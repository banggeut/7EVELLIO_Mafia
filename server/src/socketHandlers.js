import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { room } from "./roomManager.js";
import { redactForPlayer, redactForBroadcast } from "./redact.js";
import { getBalanceForCount } from "./gameEngine.js";

function verifySession(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch {
    return null;
  }
}

function parseCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  const match = cookieHeader.split(";").map((s) => s.trim()).find((s) => s.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

function broadcastAll(io) {
  // 로그인한 플레이어들: 각자 시점으로 필터링된 상태 전송
  for (const [socketId, channelId] of room.sockets.entries()) {
    const socket = io.sockets.sockets.get(socketId);
    if (!socket) continue;
    if (channelId === "__broadcast__") {
      if (room.streamerMode && room.game) socket.emit("broadcast_state", redactForBroadcast(room.game));
      else socket.emit("broadcast_disabled");
      continue;
    }
    if (room.game) socket.emit("state", redactForPlayer(room.game, channelId));
    socket.emit("queue", room.queue.map((q) => ({ channelId: q.channelId, nickname: q.nickname, profileImageUrl: q.profileImageUrl })));
    socket.emit("room_meta", {
      streamerMode: room.streamerMode,
      gameStarted: !!room.game,
      isAdmin: room.isAdmin(channelId),
      balance: getBalanceForCount(Math.max(room.queue.length, 4)),
    });
  }
}

export function registerSocketHandlers(io) {
  io.use((socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie;
    const token = parseCookie(cookieHeader, "session");
    const isBroadcastViewer = socket.handshake.query?.mode === "broadcast";

    if (isBroadcastViewer) {
      socket.data.channelId = "__broadcast__";
      return next();
    }
    const payload = token && verifySession(token);
    if (!payload) return next(new Error("unauthorized"));
    socket.data.channelId = payload.channelId;
    socket.data.nickname = payload.nickname;
    socket.data.profileImageUrl = payload.profileImageUrl;
    next();
  });

  // 치지직 채팅에서 새 낮 채팅이 들어올 때마다 전체 상태를 다시 내려준다.
  // 다만 메시지가 몰릴 때(혹은 연결 문제로 폭주할 때) 매번 즉시 전체 상태를 쏘면
  // 모든 브라우저가 과도한 이벤트를 받게 되므로, 짧게 묶어서(디바운스) 전송한다.
  let dayChatBroadcastTimer = null;
  room.onDayChat = () => {
    if (dayChatBroadcastTimer) return;
    dayChatBroadcastTimer = setTimeout(() => {
      dayChatBroadcastTimer = null;
      broadcastAll(io);
    }, 200);
  };

  io.on("connection", (socket) => {
    const channelId = socket.data.channelId;
    room.sockets.set(socket.id, channelId);
    broadcastAll(io);

    socket.on("join_queue", () => {
      if (channelId === "__broadcast__") return;
      const result = room.joinQueue({
        channelId,
        nickname: socket.data.nickname,
        profileImageUrl: socket.data.profileImageUrl,
      });
      if (!result.ok) socket.emit("error_message", result.error);
      broadcastAll(io);
    });

    socket.on("leave_queue", () => {
      if (channelId === "__broadcast__") return;
      room.leaveQueue(channelId);
      broadcastAll(io);
    });

    socket.on("admin_start_game", (specialConfig) => {
      const result = room.startGame(specialConfig || {}, channelId);
      if (!result.ok) socket.emit("error_message", result.error);
      broadcastAll(io);
    });

    socket.on("admin_toggle_streamer_mode", () => {
      const result = room.toggleStreamerMode(channelId);
      if (!result.ok) socket.emit("error_message", result.error);
      broadcastAll(io);
    });

    socket.on("admin_force_skip", () => {
      const result = room.adminForceSkip(channelId);
      if (!result.ok) socket.emit("error_message", result.error);
      broadcastAll(io);
    });

    socket.on("admin_reset_game", () => {
      const result = room.resetGame(channelId);
      if (!result.ok) socket.emit("error_message", result.error);
      broadcastAll(io);
    });

    socket.on("game_action", ({ type, ...payload }) => {
      if (channelId === "__broadcast__") return;
      const result = room.action(type, payload, channelId);
      if (!result.ok) socket.emit("error_message", result.error);
      broadcastAll(io);
    });

    socket.on("disconnect", () => {
      room.sockets.delete(socket.id);
    });
  });

  // 서버 타이머 루프: 1초마다 진행 상태를 갱신하고 전체에 브로드캐스트
  setInterval(() => {
    const changed = room.tick();
    if (changed) broadcastAll(io);
  }, 1000);
}
