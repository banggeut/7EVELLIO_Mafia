import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { room } from "./roomManager.js";
import { redactForPlayer, redactForBroadcast } from "./redact.js";
import { getBalanceForCount } from "./gameEngine.js";
import { getProfile } from "./honorStore.js";

function verifySession(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch {
    return null;
  }
}

function broadcastAll(io) {
  // 로그인한 플레이어들: 각자 시점으로 필터링된 상태 전송
  for (const [socketId, channelId] of room.sockets.entries()) {
    const socket = io.sockets.sockets.get(socketId);
    if (!socket) continue;
    if (channelId === "__broadcast__") {
      if (!room.streamerMode) {
        socket.emit("broadcast_disabled");
      } else if (!room.game) {
        // 스트리머 모드는 켜져 있지만 아직 게임이 시작되지 않은 상태 - 대기열을 보여준다.
        socket.emit("broadcast_lobby", {
          queue: room.queue.map((q) => ({ channelId: q.channelId, nickname: q.nickname, profileImageUrl: q.profileImageUrl })),
        });
      } else {
        socket.emit("broadcast_state", redactForBroadcast(room.game));
      }
      continue;
    }
    const viewAsId = room.resolveActingId(channelId);
    if (room.game) socket.emit("state", redactForPlayer(room.game, viewAsId));
    socket.emit("queue", room.queue.map((q) => ({ channelId: q.channelId, nickname: q.nickname, profileImageUrl: q.profileImageUrl, isTestPlayer: !!q.isTestPlayer })));
    socket.emit("room_meta", {
      streamerMode: room.streamerMode,
      gameStarted: !!room.game,
      isAdmin: room.isAdmin(channelId),
      balance: getBalanceForCount(Math.max(room.queue.length, 4)),
      testMode: room.testMode,
      viewingAsId: room.isAdmin(channelId) ? room.testPerspectiveId : null,
      players: room.game ? room.game.players.map((p) => ({ id: p.id, name: p.name })) : [],
      honorGivenTo: room.honorsGiven[channelId] || null,
      myProfile: String(channelId).startsWith("test-") ? null : getProfile(channelId),
    });
  }
}

/**
 * 타이머가 그냥 1초 줄어들기만 한, "사소한 틱"용 경량 브로드캐스트.
 * 전체 상태(플레이어 목록, 로그, 채팅 등)를 다시 보내지 않고 숫자 하나만 보낸다 —
 * 이게 없으면 게임이 진행되는 내내(특히 방송 화면을 몇 시간씩 켜둘 때) 1초마다
 * 전체 데이터를 반복 전송하게 되어 트래픽이 크게 낭비된다.
 */
function broadcastTickOnly(io) {
  const timerSeconds = room.game?.timerSeconds;
  if (timerSeconds === undefined) return;
  for (const [socketId, channelId] of room.sockets.entries()) {
    const socket = io.sockets.sockets.get(socketId);
    if (!socket) continue;
    if (channelId === "__broadcast__") {
      if (room.streamerMode) socket.emit("broadcast_tick", { timerSeconds });
      continue;
    }
    socket.emit("tick", { timerSeconds });
  }
}

export function registerSocketHandlers(io) {
  io.use((socket, next) => {
    const isBroadcastViewer = socket.handshake.query?.mode === "broadcast";

    if (isBroadcastViewer) {
      socket.data.channelId = "__broadcast__";
      return next();
    }
    const token = socket.handshake.auth?.token;
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

    socket.on("admin_toggle_test_mode", () => {
      const result = room.toggleTestMode(channelId);
      if (!result.ok) socket.emit("error_message", result.error);
      broadcastAll(io);
    });

    socket.on("admin_add_test_player", (nickname) => {
      const result = room.addTestPlayer(channelId, nickname);
      if (!result.ok) socket.emit("error_message", result.error);
      broadcastAll(io);
    });

    socket.on("admin_set_test_perspective", (asPlayerId) => {
      const result = room.setTestPerspective(channelId, asPlayerId || null);
      if (!result.ok) socket.emit("error_message", result.error);
      broadcastAll(io);
    });

    socket.on("give_honor", (targetId) => {
      if (channelId === "__broadcast__") return;
      const result = room.giveHonor(channelId, targetId);
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

  // 서버 타이머 루프: 1초마다 진행. 단계가 실제로 바뀔 때만 전체 상태를 다시 보내고,
  // 그냥 숫자만 줄어들 때는 가벼운 tick 이벤트만 보낸다.
  setInterval(() => {
    const result = room.tick();
    if (!result.changed) return;
    if (result.full) broadcastAll(io);
    else broadcastTickOnly(io);
  }, 1000);
}
