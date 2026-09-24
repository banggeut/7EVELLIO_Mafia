import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { room } from "./roomManager.js";
import { redactForPlayer, redactForBroadcast } from "./redact.js";
import { getBalanceForCount } from "./gameEngine.js";
import { getProfile, getTopHonors } from "./honorStore.js";
import { getAchievements, getOwnedTitles, getActiveTitle, ACHIEVEMENTS } from "./achievementStore.js";

function verifySession(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch {
    return null;
  }
}

// 소켓별로 "마지막으로 보낸 내용"을 기억해 두고, 바뀐 것만 보낸다.
//  - 채팅만 바뀌었으면 전체 state 대신 채팅 부분(chat_update)만 보낸다.
//  - queue / room_meta 는 내용이 똑같으면 아예 보내지 않는다.
// 이게 없으면 채팅 한 줄마다 모든 접속자에게 전체 게임 상태 + 대기열 + 메타가 통째로 날아가서
// 네트워크(특히 모바일 데이터)와 클라이언트 렌더링을 크게 낭비한다.
const sentCache = new Map(); // socketId -> { rest, chat, queue, meta, bRest, bChat, bMode }
const CHAT_KEYS = ["chats", "chatParticipants", "dayChat"];
const VOLATILE_KEYS = ["timerSeconds"];

function splitState(s) {
  const rest = {};
  const chat = {};
  for (const k of Object.keys(s)) {
    if (CHAT_KEYS.includes(k)) chat[k] = s[k];
    else if (!VOLATILE_KEYS.includes(k)) rest[k] = s[k];
  }
  return { rest: JSON.stringify(rest), chat: JSON.stringify(chat), chatObj: chat };
}

/**
 * 낮 채팅은 200줄까지 쌓이는데, 한 줄 올라올 때마다 200줄 전체를 다시 보내면
 * 채팅 한 번에 수백 KB가 오가서 모바일 데이터와 서버가 모두 버겁다.
 * 그래서 "이 소켓에 마지막으로 보낸 줄 이후"만 골라 보낸다.
 * (맨 앞 줄이 잘려나갔거나 내용이 어긋나면 안전하게 전체를 다시 보낸다)
 */
function dayChatDelta(cache, dayChat) {
  const list = dayChat || [];
  const firstKey = list.length ? JSON.stringify(list[0]) : "";
  const sameStart = cache.dayFirst === firstKey && typeof cache.dayLen === "number" && cache.dayLen <= list.length;
  cache.dayFirst = firstKey;
  cache.dayLen = list.length;
  if (!sameStart) return { full: list };
  return { append: list.slice(cache.dayLenSent ?? 0) };
}

function cacheFor(socketId) {
  let c = sentCache.get(socketId);
  if (!c) { c = {}; sentCache.set(socketId, c); }
  return c;
}

/** 게임 상태를 이 소켓에 보낸다. 바뀐 게 없으면 보내지 않고, 채팅만 바뀌면 채팅만 보낸다. */
function emitGameState(socket, cache, state, fullEvent, chatEvent, tickEvent, force) {
  const { rest, chat, chatObj } = splitState(state);
  if (force || cache.rest !== rest) {
    socket.emit(fullEvent, state);
    cache.dayFirst = (state.dayChat || []).length ? JSON.stringify(state.dayChat[0]) : "";
    cache.dayLenSent = (state.dayChat || []).length;
  } else if (cache.chat !== chat) {
    const { append, full } = dayChatDelta(cache, state.dayChat);
    const { dayChat, ...restChat } = chatObj;
    if (append) {
      socket.emit(chatEvent, { ...restChat, dayChatAppend: append, timerSeconds: state.timerSeconds });
    } else {
      socket.emit(chatEvent, { ...restChat, dayChat: full, timerSeconds: state.timerSeconds });
    }
    cache.dayLenSent = (state.dayChat || []).length;
  } else if (cache.timer !== state.timerSeconds) {
    // 시간 연장처럼 숫자만 바뀐 경우
    socket.emit(tickEvent, { timerSeconds: state.timerSeconds });
  }
  cache.timer = state.timerSeconds;
  cache.rest = rest;
  cache.chat = chat;
}

function emitIfChanged(socket, cache, key, event, payload) {
  const json = JSON.stringify(payload);
  if (cache[key] === json) return;
  cache[key] = json;
  socket.emit(event, payload);
}

const ACHIEVEMENT_CATALOG = Object.values(ACHIEVEMENTS); // 게임 중 변하지 않으므로 한 번만 만든다

function broadcastAll(io, { force = false } = {}) {
  // 같은 시점(예: 관전자 여러 명, 같은 사람을 보는 관리자)은 필터링 결과를 재사용한다.
  const viewCache = new Map();
  const redactFor = (viewAsId) => {
    if (!viewCache.has(viewAsId)) viewCache.set(viewAsId, redactForPlayer(room.game, viewAsId));
    return viewCache.get(viewAsId);
  };
  let broadcastState = null;
  // 로그인한 플레이어들: 각자 시점으로 필터링된 상태 전송
  for (const [socketId, channelId] of room.sockets.entries()) {
    const socket = io.sockets.sockets.get(socketId);
    if (!socket) continue;
    const cache = cacheFor(socketId);
    const forceThis = force === true || force === socketId;
    if (channelId === "__broadcast__") {
      if (!room.streamerMode) {
        if (forceThis || cache.bMode !== "disabled") socket.emit("broadcast_disabled");
        cache.bMode = "disabled"; cache.rest = cache.chat = cache.bLobby = undefined;
      } else if (!room.game) {
        // 스트리머 모드는 켜져 있지만 아직 게임이 시작되지 않은 상태 - 대기열을 보여준다.
        if (forceThis || cache.bMode !== "lobby") cache.bLobby = undefined;
        cache.bMode = "lobby"; cache.rest = cache.chat = undefined;
        emitIfChanged(socket, cache, "bLobby", "broadcast_lobby", {
          queue: room.queue.map((q) => ({ channelId: q.channelId, nickname: q.nickname, profileImageUrl: q.profileImageUrl })),
        });
      } else {
        const modeChanged = cache.bMode !== "game";
        cache.bMode = "game"; cache.bLobby = undefined;
        if (!broadcastState) broadcastState = redactForBroadcast(room.game);
        emitGameState(socket, cache, broadcastState, "broadcast_state", "broadcast_chat", "broadcast_tick", forceThis || modeChanged);
      }
      continue;
    }
    const viewAsId = room.resolveActingId(channelId);
    if (room.game) {
      emitGameState(socket, cache, redactFor(viewAsId), "state", "chat_update", "tick", forceThis);
    } else {
      cache.rest = cache.chat = undefined;
    }
    if (forceThis) cache.queue = cache.meta = undefined;
    emitIfChanged(socket, cache, "queue", "queue", room.queue.map((q) => ({ channelId: q.channelId, nickname: q.nickname, profileImageUrl: q.profileImageUrl, isTestPlayer: !!q.isTestPlayer })));
    emitIfChanged(socket, cache, "meta", "room_meta", {
      streamerMode: room.streamerMode,
      gameStarted: !!room.game,
      isAdmin: room.isAdmin(channelId),
      balance: getBalanceForCount(Math.max(room.queue.length, 4)),
      testMode: room.testMode,
      viewingAsId: room.isAdmin(channelId) ? room.testPerspectiveId : null,
      // [정신 지배] - 이 사람(마녀)이 조종할 수 있는 꼭두각시와, 지금 꼭두각시 시점인지
      puppet: (() => { const info = room.puppetInfo(channelId); const pp = info.puppetId && room.game.players.find((p) => p.id === info.puppetId); return pp ? { id: pp.id, name: pp.name, viewing: info.viewing } : null; })(),
      players: room.game ? room.game.players.map((p) => ({ id: p.id, name: p.name })) : [],
      honorGivenTo: room.honorsGiven[channelId] || null,
      warnedPlayerIds: room.isAdmin(channelId) ? Object.keys(room.warningsGiven || {}) : [],
      myProfile: String(channelId).startsWith("test-") ? null : getProfile(channelId),
      topHonors: getTopHonors(3),
      myOwnedTitles: String(channelId).startsWith("test-") ? [] : getOwnedTitles(channelId),
      myActiveTitle: String(channelId).startsWith("test-") ? null : getActiveTitle(channelId),
      achievementCatalog: ACHIEVEMENT_CATALOG,
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
  for (const c of sentCache.values()) c.timer = timerSeconds;
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

  io.on("connection", (socket) => {
    const channelId = socket.data.channelId;
    room.sockets.set(socket.id, channelId);
    sentCache.delete(socket.id);
    broadcastAll(io, { force: socket.id }); // 새로 들어온 소켓에는 전부 다시 보낸다

    // ── 이 소켓이 보내는 요청 속도 제한 (토큰 버킷) ──
    // 한 사람이 채팅·행동을 연타해도 서버 전체가 느려지지 않게 한다.
    const buckets = {};
    const allow = (key, perSecond, burst) => {
      const now = Date.now();
      const b = buckets[key] || (buckets[key] = { tokens: burst, at: now });
      b.tokens = Math.min(burst, b.tokens + ((now - b.at) / 1000) * perSecond);
      b.at = now;
      if (b.tokens < 1) return false;
      b.tokens -= 1;
      return true;
    };

    /** 모든 소켓 핸들러 공통 래퍼 - 예외가 나도 서버가 죽지 않게 감싸고, 요청 속도도 제한한다. */
    const on = (event, handler, limit) => {
      socket.on(event, (...args) => {
        try {
          if (limit && !allow(limit.key || event, limit.perSecond, limit.burst)) return;
          handler(...args);
        } catch (err) {
          console.error(`[socket] ${event} 처리 중 오류:`, err);
          try { socket.emit("error_message", "요청을 처리하는 중 문제가 생겼어요."); } catch { /* 소켓이 이미 끊긴 경우 */ }
        }
      });
    };

    on("join_queue", () => {
      if (channelId === "__broadcast__") return;
      const result = room.joinQueue({
        channelId,
        nickname: socket.data.nickname,
        profileImageUrl: socket.data.profileImageUrl,
      });
      if (!result.ok) socket.emit("error_message", result.error);
      broadcastAll(io);
    });

    on("leave_queue", () => {
      if (channelId === "__broadcast__") return;
      room.leaveQueue(channelId);
      broadcastAll(io);
    });

    on("admin_start_game", (specialConfig) => {
      const result = room.startGame(specialConfig || {}, channelId);
      if (!result.ok) socket.emit("error_message", result.error);
      broadcastAll(io);
    });

    on("admin_toggle_streamer_mode", () => {
      const result = room.toggleStreamerMode(channelId);
      if (!result.ok) socket.emit("error_message", result.error);
      broadcastAll(io);
    });

    on("admin_force_skip", () => {
      const result = room.adminForceSkip(channelId);
      if (!result.ok) socket.emit("error_message", result.error);
      broadcastAll(io);
    });

    on("admin_reset_game", () => {
      const result = room.resetGame(channelId);
      if (!result.ok) socket.emit("error_message", result.error);
      broadcastAll(io);
    });

    on("admin_toggle_test_mode", () => {
      const result = room.toggleTestMode(channelId);
      if (!result.ok) socket.emit("error_message", result.error);
      broadcastAll(io);
    });

    on("admin_add_test_player", (nickname) => {
      const result = room.addTestPlayer(channelId, nickname);
      if (!result.ok) socket.emit("error_message", result.error);
      broadcastAll(io);
    });

    on("admin_set_test_perspective", (asPlayerId) => {
      const result = room.setTestPerspective(channelId, asPlayerId || null);
      if (!result.ok) socket.emit("error_message", result.error);
      broadcastAll(io);
    });

    on("give_honor", (targetId) => {
      if (channelId === "__broadcast__") return;
      const result = room.giveHonor(channelId, targetId);
      if (!result.ok) socket.emit("error_message", result.error);
      broadcastAll(io);
    });

    on("give_warning", (targetId) => {
      if (channelId === "__broadcast__") return;
      const result = room.giveWarning(channelId, targetId);
      if (!result.ok) socket.emit("error_message", result.error);
      broadcastAll(io);
    });

    on("set_my_title", (title) => {
      if (channelId === "__broadcast__" || String(channelId).startsWith("test-")) return;
      const result = room.setMyTitle(channelId, title || null);
      if (!result.ok) socket.emit("error_message", result.error);
      broadcastAll(io); // 본인의 room_meta(myActiveTitle) 및 게임 중이라면 채팅 표시도 즉시 갱신
    });

    on("admin_get_profiles", () => {
      if (channelId === "__broadcast__") return;
      const result = room.adminGetProfiles(channelId);
      if (!result.ok) { socket.emit("error_message", result.error); return; }
      socket.emit("admin_profiles", { profiles: result.profiles, catalog: result.catalog });
    });

    on("admin_set_honor", (payload) => {
      const { targetId, nickname, value } = payload || {};
      if (channelId === "__broadcast__") return;
      const result = room.adminSetHonor(channelId, targetId, nickname, value);
      if (!result.ok) { socket.emit("error_message", result.error); return; }
      const refreshed = room.adminGetProfiles(channelId);
      if (refreshed.ok) socket.emit("admin_profiles", { profiles: refreshed.profiles, catalog: refreshed.catalog });
    });

    on("admin_set_warnings", (payload) => {
      const { targetId, nickname, value } = payload || {};
      if (channelId === "__broadcast__") return;
      const result = room.adminSetWarnings(channelId, targetId, nickname, value);
      if (!result.ok) { socket.emit("error_message", result.error); return; }
      const refreshed = room.adminGetProfiles(channelId);
      if (refreshed.ok) socket.emit("admin_profiles", { profiles: refreshed.profiles, catalog: refreshed.catalog });
    });

    on("admin_grant_achievement", (payload) => {
      const { targetId, nickname, achievementId } = payload || {};
      if (channelId === "__broadcast__") return;
      const result = room.adminGrantAchievement(channelId, targetId, nickname, achievementId);
      if (!result.ok) { socket.emit("error_message", result.error); return; }
      const refreshed = room.adminGetProfiles(channelId);
      if (refreshed.ok) socket.emit("admin_profiles", { profiles: refreshed.profiles, catalog: refreshed.catalog });
      broadcastAll(io); // 지금 진행 중인 게임의 채팅 등에 칭호가 즉시 반영되도록
    });

    on("admin_reset_achievements", (payload) => {
      const { targetId } = payload || {};
      if (channelId === "__broadcast__") return;
      const result = room.adminResetAchievements(channelId, targetId);
      if (!result.ok) { socket.emit("error_message", result.error); return; }
      const refreshed = room.adminGetProfiles(channelId);
      if (refreshed.ok) socket.emit("admin_profiles", { profiles: refreshed.profiles, catalog: refreshed.catalog });
      broadcastAll(io); // 지금 진행 중인 게임의 채팅 등에 칭호(해제)가 즉시 반영되도록
    });

    on("witch_puppet_view", (on) => {
      if (channelId === "__broadcast__") return;
      const result = room.setPuppetView(channelId, !!on);
      if (!result.ok) socket.emit("error_message", result.error);
      broadcastAll(io);
    });

    on("game_action", (raw) => {
      if (channelId === "__broadcast__") return;
      if (!raw || typeof raw !== "object") return;
      const { type, ...payload } = raw;
      if (typeof type !== "string") return;
      // 채팅은 사람이 손으로 치는 속도 이상으로는 받지 않는다
      const isChat = type === "CHAT_SEND" || type === "PHISHING_SEND";
      if (!allow(isChat ? "chat" : "action", isChat ? 2 : 8, isChat ? 4 : 12)) return;
      const result = room.action(type, payload, channelId);
      if (!result.ok) socket.emit("error_message", result.error);
      broadcastAll(io);
    });

    on("disconnect", () => {
      room.sockets.delete(socket.id);
      sentCache.delete(socket.id);
    });
  });

  // 서버 타이머 루프: 1초마다 진행. 단계가 실제로 바뀔 때만 전체 상태를 다시 보내고,
  // 그냥 숫자만 줄어들 때는 가벼운 tick 이벤트만 보낸다.
  setInterval(() => {
    try {
      const result = room.tick();
      if (!result.changed) return;
      if (result.full) broadcastAll(io);
      else broadcastTickOnly(io);
    } catch (err) {
      // 한 번의 오류로 게임 전체가 멈추지 않도록, 로그만 남기고 다음 초에 계속 진행한다.
      console.error("[tick] 진행 중 오류:", err);
    }
  }, 1000);
}
