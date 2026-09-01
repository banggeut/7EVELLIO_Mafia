import { assignRoles, createGameState, applyAction, autoAdvance, relayDayChat, didPlayerWin } from "./gameEngine.js";
import { config } from "./config.js";
import { ChzzkChatRelay } from "./chzzkChat.js";
import { addHonor, recordGameResult } from "./honorStore.js";

/**
 * 데모/단일 채널용 MVP: 방(room) 하나만 메모리에 둡니다.
 * 여러 채널을 동시에 운영하려면 room을 channelId 별 Map으로 바꾸면 됩니다.
 */
class Room {
  constructor() {
    this.queue = []; // [{ channelId, nickname, profileImageUrl }]
    this.game = null; // gameEngine state | null
    this.streamerMode = false;
    this.testMode = false;
    this.testPerspectiveId = null; // 관리자가 테스트 모드에서 "그 사람인 척" 조작 중인 플레이어 id
    this.sockets = new Map(); // socketId -> channelId ('' for anonymous broadcast viewers)
    this.chatRelay = null; // ChzzkChatRelay | null
    this.onDayChat = null; // 새 낮 채팅이 들어왔을 때 알림 (index.js에서 브로드캐스트하기 위해 연결)
    this.honorsGiven = {}; // { [giverChannelId]: targetChannelId } - 이번 판에서 누가 누구에게 명예를 줬는지 (게임마다 초기화)
    this.statsRecorded = false; // 이번 게임의 전적(총 게임 수/승/패)을 이미 영구 저장소에 기록했는지
  }

  isAdmin(channelId) {
    return !!config.adminChannelId && channelId === config.adminChannelId;
  }

  /** 관리자 소켓이 지금 어떤 플레이어로서 행동/조회해야 하는지 결정한다. */
  resolveActingId(channelId) {
    if (this.testMode && this.isAdmin(channelId) && this.testPerspectiveId) {
      return this.testPerspectiveId;
    }
    return channelId;
  }

  /** 관리자가 로그인하면 호출 — 치지직 채팅 세션을 연결한다. */
  async connectAdminChat({ accessToken, channelId }) {
    if (!this.isAdmin(channelId)) return;
    if (this.chatRelay) {
      await this.chatRelay.disconnect().catch(() => {});
    }
    this.chatRelay = new ChzzkChatRelay({
      accessToken,
      channelId,
      onChatMessage: ({ senderChannelId, message }) => {
        if (!this.game) return;
        const next = relayDayChat(this.game, senderChannelId, message);
        if (next !== this.game) {
          this.game = next;
          this.onDayChat?.();
        }
      },
    });
    try {
      await this.chatRelay.connect();
    } catch (e) {
      console.error("[room] 치지직 채팅 연동 실패:", e.message);
    }
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

  toggleTestMode(byChannelId) {
    if (!this.isAdmin(byChannelId)) return { ok: false, error: "관리자만 사용할 수 있습니다." };
    this.testMode = !this.testMode;
    if (!this.testMode) this.testPerspectiveId = null;
    return { ok: true };
  }

  /** 테스트 모드에서 실제 치지직 로그인 없이 가짜 참여자를 대기열에 추가한다. */
  addTestPlayer(byChannelId, nickname) {
    if (!this.isAdmin(byChannelId)) return { ok: false, error: "관리자만 사용할 수 있습니다." };
    if (!this.testMode) return { ok: false, error: "테스트 모드를 먼저 켜주세요." };
    if (this.game) return { ok: false, error: "이미 게임이 시작되어 참여할 수 없습니다." };
    const name = String(nickname || "").trim().slice(0, 20) || `테스트${this.queue.length + 1}`;
    const fakeId = `test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    this.queue.push({ channelId: fakeId, nickname: name, profileImageUrl: null, isTestPlayer: true });
    return { ok: true };
  }

  /** 관리자가 테스트 모드에서 특정 플레이어의 시점으로 전환한다. null이면 관리자 본인 시점으로 복귀. */
  setTestPerspective(byChannelId, asPlayerId) {
    if (!this.isAdmin(byChannelId)) return { ok: false, error: "관리자만 사용할 수 있습니다." };
    if (!this.testMode) return { ok: false, error: "테스트 모드가 꺼져 있습니다." };
    if (asPlayerId && this.game && !this.game.players.some((p) => p.id === asPlayerId)) {
      return { ok: false, error: "존재하지 않는 플레이어입니다." };
    }
    this.testPerspectiveId = asPlayerId || null;
    return { ok: true };
  }

  startGame(specialConfig, byChannelId) {
    if (!this.isAdmin(byChannelId)) return { ok: false, error: "관리자만 게임을 시작할 수 있습니다." };
    if (this.queue.length < 4) return { ok: false, error: "최소 4명 이상 필요합니다." };
    const players = assignRoles(this.queue, specialConfig || {});
    this.game = createGameState(players);
    this.honorsGiven = {};
    this.statsRecorded = false;
    return { ok: true };
  }

  /** 게임이 방금 gameover에 도달했다면, 참여자 전원의 총 게임 수/승/패를 영구 저장소에 딱 한 번만 기록한다. */
  recordGameStats() {
    if (!this.game || this.game.phase !== "gameover" || this.statsRecorded) return;
    this.statsRecorded = true;
    for (const p of this.game.players) {
      if (String(p.id).startsWith("test-")) continue; // 테스트 모드 가짜 참여자는 전적에 안 남긴다
      recordGameResult(p.id, p.name, didPlayerWin(p, this.game.winner));
    }
  }

  /** 게임 종료 후, 플레이어가 다른 플레이어에게 명예 1점을 선물한다. 게임당 한 번만 줄 수 있다. */
  giveHonor(byChannelId, targetId) {
    if (!this.game) return { ok: false, error: "게임이 시작되지 않았습니다." };
    if (this.game.phase !== "gameover") return { ok: false, error: "게임이 끝난 뒤에만 명예를 줄 수 있습니다." };
    const giver = this.game.players.find((p) => p.id === byChannelId);
    if (!giver) return { ok: false, error: "이번 게임에 참여하지 않으셨습니다." };
    if (this.honorsGiven[byChannelId]) return { ok: false, error: "이미 이번 판에 명예를 선물하셨습니다." };
    if (!targetId || targetId === byChannelId) return { ok: false, error: "본인에게는 줄 수 없습니다." };
    const target = this.game.players.find((p) => p.id === targetId);
    if (!target) return { ok: false, error: "존재하지 않는 플레이어입니다." };
    this.honorsGiven[byChannelId] = targetId;
    addHonor(target.id, target.name); // 영구 저장소에 즉시 반영
    return { ok: true };
  }

  action(type, payload, channelId) {
    if (!this.game) return { ok: false, error: "게임이 시작되지 않았습니다." };
    const actingId = this.resolveActingId(channelId);
    this.game = applyAction(this.game, { type, ...payload }, actingId);
    this.recordGameStats();
    return { ok: true };
  }

  adminForceSkip(byChannelId) {
    if (!this.isAdmin(byChannelId)) return { ok: false, error: "관리자만 사용할 수 있습니다." };
    if (!this.game) return { ok: false, error: "게임이 시작되지 않았습니다." };
    this.game = autoAdvance(this.game);
    this.recordGameStats();
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
    this.testPerspectiveId = null;
    this.honorsGiven = {};
    this.statsRecorded = false;
    return { ok: true };
  }

  /** 1초마다 호출: 타이머가 돌고 있으면 한 틱 진행 */
  /**
   * 1초마다 호출: 타이머가 돌고 있으면 한 틱 진행.
   * 그냥 숫자만 하나 줄어드는 "사소한 틱"과, 실제로 다음 단계로 넘어가는 "중요한 틱"을 구분해서
   * 반환한다 — 사소한 틱까지 매번 전체 상태를 다시 보내면 트래픽이 불필요하게 많이 나가기 때문.
   */
  tick() {
    if (!this.game || !this.game.timerRunning) return { changed: false };
    if (this.game.timerSeconds <= 1) {
      this.game = autoAdvance(this.game);
      this.recordGameStats();
      return { changed: true, full: true };
    }
    this.game = { ...this.game, timerSeconds: this.game.timerSeconds - 1 };
    return { changed: true, full: false };
  }
}

export const room = new Room();
