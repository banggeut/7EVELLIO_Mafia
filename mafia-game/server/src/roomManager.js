import { assignRoles, createGameState, applyAction, autoAdvance, requiredSlots, getMafiaCount } from "./gameEngine.js";
import { config } from "./config.js";

/**
 * 데모/단일 채널용 MVP: 방(room) 하나만 메모리에 둡니다.
 * 여러 채널을 동시에 운영하려면 room을 channelId 별 Map으로 바꾸면 됩니다.
 */
class Room {
  constructor() {
    this.queue = []; // [{ channelId, nickname, profileImageUrl }]
    this.game = null; // gameEngine state | null
    this.streamerMode = false;
    this.sockets = new Map(); // socketId -> channelId ('' for anonymous broadcast viewers)
  }

  isAdmin(channelId) {
    return !!config.adminChannelId && channelId === config.adminChannelId;
  }

  joinQueue(user) {
    if (this.game) return { ok: false, error: "이미 게임이 시작되어 참여할 수 없습니다." };
    if (this.queue.some((q) => q.channelId === user.channelId)) {
      return { ok: false, error: "이미 대기열에 참여 중입니다." };
    }
    this.queue.push(user);
    return { ok: true };
  }

  leaveQueue(channelId) {
    this.queue = this.queue.filter((q) => q.channelId !== channelId);
  }

  startGame(specialConfig, byChannelId) {
    if (!this.isAdmin(byChannelId)) return { ok: false, error: "관리자만 게임을 시작할 수 있습니다." };
    if (this.queue.length < 4) return { ok: false, error: "최소 4명 이상 필요합니다." };
    const mafiaCount = getMafiaCount(this.queue.length);
    const fullConfig = { ...specialConfig, mafiaCount };
    const need = requiredSlots(fullConfig);
    if (need > this.queue.length) {
      return { ok: false, error: `선택한 직업 수(${need}자리)가 참여 인원(${this.queue.length}명)보다 많습니다.` };
    }
    const players = assignRoles(this.queue, fullConfig);
    this.game = createGameState(players);
    return { ok: true };
  }

  action(type, payload, channelId) {
    if (!this.game) return { ok: false, error: "게임이 시작되지 않았습니다." };
    this.game = applyAction(this.game, { type, ...payload }, channelId);
    return { ok: true };
  }

  adminForceSkip(byChannelId) {
    if (!this.isAdmin(byChannelId)) return { ok: false, error: "관리자만 사용할 수 있습니다." };
    if (!this.game) return { ok: false, error: "게임이 시작되지 않았습니다." };
    this.game = autoAdvance(this.game);
    return { ok: true };
  }

  toggleStreamerMode(byChannelId) {
    if (!this.isAdmin(byChannelId)) return { ok: false, error: "관리자만 사용할 수 있습니다." };
    this.streamerMode = !this.streamerMode;
    return { ok: true };
  }

  resetGame(byChannelId) {
    if (!this.isAdmin(byChannelId)) return { ok: false, error: "관리자만 사용할 수 있습니다." };
    this.game = null;
    this.queue = [];
    return { ok: true };
  }

  /** 1초마다 호출: 타이머가 돌고 있으면 한 틱 진행 */
  tick() {
    if (!this.game || !this.game.timerRunning) return false;
    const next = this.game.timerSeconds <= 1 ? autoAdvance(this.game) : { ...this.game, timerSeconds: this.game.timerSeconds - 1 };
    this.game = next;
    return true;
  }
}

export const room = new Room();
