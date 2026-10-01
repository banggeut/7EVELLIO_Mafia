import { assignRoles, createGameState, applyAction, autoAdvance, didPlayerWin, isMafiaAligned, isCitizenAligned, puppetOf } from "./gameEngine.js";
import { config } from "./config.js";
import { applyAlertTiming } from "./alertTiming.js";
import { trackAchievements, earnedPowerAchievements } from "./achievementTracker.js";
import { addHonor, addWarning, isBanned, recordGameResult, setHonor, setWarnings, setPoints, getAllHonorProfiles } from "./honorStore.js";
import { computeGamePoints } from "./pointsEngine.js";
import { grantAchievement, resetAchievements, setActiveTitle, setMyActiveTitle, getAllAchievementProfiles, getAchievements, getOwnedTitles, getActiveTitle, ACHIEVEMENTS } from "./achievementStore.js";

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
    this.puppetView = {}; // { [마녀 플레이어 id]: true } - [정신 지배]로 꼭두각시 시점에서 조작 중인 마녀
    this.sockets = new Map(); // socketId -> channelId ('' for anonymous broadcast viewers)
    this.honorsGiven = {}; // { [giverChannelId]: targetChannelId } - 이번 판에서 누가 누구에게 명예를 줬는지 (게임마다 초기화)
    this.warningsGiven = {}; // { [targetChannelId]: true } - 이번 판에서 누구에게 이미 경고를 줬는지 (게임마다 초기화)
    this.statsRecorded = false; // 이번 게임의 전적(총 게임 수/승/패)을 이미 영구 저장소에 기록했는지
    // 게임이 끝나면 방(game)은 즉시 비우고, 결과는 여기에 "다 끝난 판의 사본"으로 남겨둔다.
    // 그래야 결과를 아직 보고 있는 사람과 상관없이 다음 판 대기열을 바로 열 수 있다.
    this.lastResult = null;
    this.resultClosedByAdmin = false; // 관리자가 결과를 닫았는지 (방송 화면이 이걸 따라간다)
  }

  /** 게임이 끝났다 - 전적을 기록한 뒤 방을 즉시 비우고, 결과만 사본으로 남긴다. */
  finishGame() {
    if (!this.game || this.game.phase !== "gameover") return;
    this.recordGameStats();          // 포인트·업적·전적 (내부에서 한 번만 실행됨)
    this.lastResult = this.game;     // 각자 닫을 때까지 보여줄 결과 사본
    this.resultClosedByAdmin = false;
    this.game = null;                // 여기서 방이 비워진다 - 대기열이 바로 열린다
    this.queue = [];                 // 다음 판은 각자 새로 참여한다
    this.testPerspectiveId = null;
    this.puppetView = {};
    // honorsGiven / warningsGiven 은 "이 결과"에 묶인 기록이라 여기서 지우지 않는다.
    // 다음 게임이 시작될 때 함께 초기화된다.
  }

  /** 결과 화면을 닫는다. 관리자가 닫으면 방송 화면의 결과도 함께 내려간다. */
  closeResult(channelId) {
    if (this.isAdmin(channelId)) this.resultClosedByAdmin = true;
    return { ok: true };
  }

  /** 관리자: 대기열만 비운다 (게임은 이미 끝나 있으므로 따로 초기화할 게 없다). */
  clearQueue(byChannelId) {
    if (!this.isAdmin(byChannelId)) return { ok: false, error: "관리자만 사용할 수 있습니다." };
    this.queue = [];
    return { ok: true };
  }

  isAdmin(channelId) {
    return !!config.adminChannelId && channelId === config.adminChannelId;
  }

  /** 관리자 소켓이 지금 어떤 플레이어로서 행동/조회해야 하는지 결정한다. */
  resolveActingId(channelId) {
    const base = this.testMode && this.isAdmin(channelId) && this.testPerspectiveId ? this.testPerspectiveId : channelId;
    // [정신 지배] - 꼭두각시 시점으로 전환한 마녀는 꼭두각시로서 보고 행동한다 (마녀가 죽으면 자동으로 풀린다).
    if (this.game && this.puppetView[base]) {
      const puppetId = puppetOf(this.game, base);
      if (puppetId) return puppetId;
    }
    return base;
  }

  /** 지금 이 소켓이 꼭두각시를 조작 중인지 (마녀 본인 id, 꼭두각시 id) */
  puppetInfo(channelId) {
    const base = this.testMode && this.isAdmin(channelId) && this.testPerspectiveId ? this.testPerspectiveId : channelId;
    const puppetId = this.game ? puppetOf(this.game, base) : null;
    return { witchId: base, puppetId, viewing: !!(puppetId && this.puppetView[base]) };
  }

  /** 마녀가 [정신 지배]로 얻은 꼭두각시 시점 ↔ 본인 시점을 전환한다. */
  setPuppetView(channelId, on) {
    const { witchId, puppetId } = this.puppetInfo(channelId);
    if (on && !puppetId) return { ok: false, error: "조종할 수 있는 꼭두각시가 없습니다." };
    this.puppetView = { ...this.puppetView, [witchId]: !!on };
    return { ok: true };
  }

  joinQueue(user) {
    if (this.game) return { ok: false, error: "이미 게임이 시작되어 참여할 수 없습니다." };
    if (this.queue.some((q) => q.channelId === user.channelId)) {
      return { ok: false, error: "이미 대기열에 참여 중입니다." };
    }
    if (isBanned(user.channelId)) {
      return { ok: false, error: "경고 누적으로 게임 참여가 제한되었습니다." };
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
    this.puppetView = {};
    this.honorsGiven = {};
    this.warningsGiven = {};
    this.statsRecorded = false;
    this.lastResult = null;          // 지난 판 결과는 새 게임이 시작되면 사라진다
    this.resultClosedByAdmin = false;
    return { ok: true };
  }

  /** 게임이 방금 gameover에 도달했다면, 참여자 전원의 총 게임 수/승/패를 영구 저장소에 딱 한 번만 기록한다.
   *  동시에, 자동으로 판정 가능한 업적도 이 시점에 함께 확인해서 수여한다. */
  recordGameStats() {
    if (!this.game || this.game.phase !== "gameover" || this.statsRecorded) return;
    this.statsRecorded = true;
    const players = this.game.players;
    const winner = this.game.winner;
    const pointsAwarded = {}; // { playerId: 이번 판에 적립된 포인트 }
    const achievementsEarned = {}; // { playerId: [이번 판에 "처음" 달성한 업적들] }
    const findPartner = (p) => (p.partnerId ? players.find((x) => x.id === p.partnerId) : null);

    for (const p of players) {
      if (String(p.id).startsWith("test-")) continue; // 테스트 모드 가짜 참여자는 전적에 안 남긴다
      const won = didPlayerWin(p, winner);
      // 이번 판 정산 - 진영 기본점 + 해낸 일들. 내역은 종료 화면에 그대로 보여준다.
      const score = computeGamePoints(this.game, p, won);
      const award = recordGameResult(p.id, p.name, won, score.total);
      pointsAwarded[p.id] = {
        earned: award.earned, total: award.total,
        base: score.base, baseLabel: score.baseLabel, bonus: score.bonus, items: score.items,
      };
      const grant = (id) => {
        const r = grantAchievement(p.id, p.name, id);
        // 이미 갖고 있던 업적은 연출을 띄우지 않는다 - 처음 딴 것만 축하한다.
        if (r.ok && r.isNew && ACHIEVEMENTS[id]) {
          (achievementsEarned[p.id] ||= []).push({ id, name: ACHIEVEMENTS[id].name, title: ACHIEVEMENTS[id].title, desc: ACHIEVEMENTS[id].desc });
        }
        return r;
      };

      // 명예시민 - 무직 시민 상태로 승리
      if (won && p.role === "citizen") grant("honorable_citizen");

      // 명의 - 의사로 한 게임에 5번 이상 살림
      if (p.role === "doctor" && (p.doctorSaveCount || 0) >= 5) grant("master_physician");

      // 엘리트 수사관 - 경찰 조사만으로, 조사로 밝힐 수 있는 마피아팀 전원을 찾아냄
      if (p.role === "police") {
        const findableMafia = players.filter((m) => isMafiaAligned(m) && !["spy", "conartist", "godfather"].includes(m.role));
        const found = p.policeInvestigatedMafiaIds || [];
        if (findableMafia.length > 0 && findableMafia.every((m) => found.includes(m.id))) grant("elite_detective");
      }

      // 정론직필 - 기자 특종으로 진짜 마피아팀을 밝혀냄
      if (p.role === "reporter" && p.reporterRevealedMafiaOnce) grant("righteous_journalist");

      // 탱커 - 군인으로 한 번 막아낸 뒤, 다시 마피아 공격으로 사망
      if (p.role === "veteran" && p.usedDefense && p.diedToMafiaAttack && !p.alive) grant("tanker");

      // 여긴 내 구역이야 - 건달이 용병과 접선해 중립 승리
      if (p.role === "soldier" && p.pairedWithMercenary && winner === "mercenary") grant("this_is_my_turf");

      // 너를 위해서 - 연인이 [피의 복수]로 마피아를 처치
      if (p.role === "newlywed" && p.avengerKilledMafia) grant("for_you");

      // 명탐정 라삐 - 탐정이 스파이를 짚어낸 뒤 다음날 처형까지 성공
      if (p.role === "detective" && p.detectiveCaughtSpyThenExecuted) grant("great_detective_rabbi");

      // 뱀파이어 사냥꾼 - 성직자가 뱀파이어를 막아낸 뒤 다음날 처형까지 성공
      if (p.role === "priest" && p.priestCaughtVampireThenExecuted) grant("vampire_hunter");

      // 뒤를 부탁한다 - 경호원이 의사를 지키다 사망
      if (p.bodyguardDiedProtectingDoctor) grant("ill_leave_my_back_to_you");

      // 최고의 스승 / 최고의 제자 - 졸업 성공 + 교사·학생 모두 생존 + 시민팀 승리
      if (p.role === "teacher" && p.teacherGraduatedStudent && p.alive && winner === "citizen") {
        const student = findPartner(p);
        if (student && student.alive) grant("best_teacher");
      }
      if (p.studentGraduatedSuccessfully && p.alive && winner === "citizen") {
        const teacher = findPartner(p);
        if (teacher && teacher.alive) grant("best_student");
      }

      // 세계를 멸망시켜봤습니다 / 뱀파이어 로드 / 잘 먹고 갑니다 / ALPHA - 각 중립 역할의 단독 승리
      if (p.role === "cultist" && winner === "cultist") grant("tried_to_destroy_the_world");
      if (p.role === "vampire" && p.alive && winner === "vampire") grant("vampire_lord");
      if (p.role === "thief" && winner === "thief") grant("well_fed_im_off");
      if (p.role === "werewolf" && !p.isWolfAllied && winner === "werewolf") grant("alpha");

      // 탐정이다냥 / 냥냥펀치 / 길냥이 - 고양이의 세 가지 결말
      if (p.role === "cat" && p.catAlignment === "citizen" && p.alive && winner === "citizen") grant("im_a_detective_nya");
      if (p.role === "cat" && p.catAlignment === "mafia" && p.alive && winner === "mafia") grant("nyanya_punch");
      if (p.role === "cat" && !p.catAlignment && winner === "citizen") grant("stray_cat");

      // 최종보스 - 대부가 건달을 영입한 뒤, 건달과 함께 생존해 마피아 승리
      if (p.role === "godfather" && p.godfatherRecruitedSoldier && p.alive && winner === "mafia") {
        const recruitedSoldier = players.find((s) => s.role === "soldier" && s.recruitedToMafia);
        if (recruitedSoldier && recruitedSoldier.alive) grant("final_boss");
      }

      // 혼자는 안가요 - 테러리스트 자폭으로 시민팀 필수직업을 처치
      if (p.role === "terrorist" && p.terroristKilledForcedRole) grant("wont_go_alone");

      // 천재 해커 - 해커가 조작한 대상이 다음날 기자에게 마피아로 공개됨
      if (p.role === "framer" && p.framerExposedNextDay) grant("genius_hacker");

      // 선량한 시민 / 명예 마피아 - 각 팀 소속으로 끝까지 살아남아 그 팀이 승리
      if (isCitizenAligned(p) && p.alive && winner === "citizen") grant("good_citizen");
      if (isMafiaAligned(p) && p.alive && winner === "mafia") grant("honorable_mafia");

      // 왜 이겼지? - 백수가 끝내 직업을 갖지 못한 채 생존해 시민팀 승리
      if (p.role === "unemployed" && p.alive && winner === "citizen") grant("why_did_i_win");

      // ── 7일차 능력 업적 (진행도는 achievementTracker.js가 게임 중에 state.achv에 쌓아둔다) ──
      earnedPowerAchievements(this.game, p, won).forEach(grant);
    }
    // 게임 종료 화면에서 각자 "이번 판에 얼마 받았는지"를 보여주기 위해 상태에 싣는다.
    // (영구 저장은 이미 위에서 끝났고, 이건 화면 표시용 사본이다)
    this.game = { ...this.game, pointsAwarded, achievementsEarned };
  }

  /** 게임 종료 후, 플레이어가 다른 플레이어에게 명예 1점을 선물한다. 게임당 한 번만 줄 수 있다. */
  giveHonor(byChannelId, targetId) {
    const result = this.lastResult;
    if (!result) return { ok: false, error: "명예를 줄 수 있는 게임 결과가 없습니다." };
    const giver = result.players.find((p) => p.id === byChannelId);
    if (!giver) return { ok: false, error: "이번 게임에 참여하지 않으셨습니다." };
    if (this.honorsGiven[byChannelId]) return { ok: false, error: "이미 이번 판에 명예를 선물하셨습니다." };
    if (!targetId || targetId === byChannelId) return { ok: false, error: "본인에게는 줄 수 없습니다." };
    const target = result.players.find((p) => p.id === targetId);
    if (!target) return { ok: false, error: "존재하지 않는 플레이어입니다." };
    this.honorsGiven[byChannelId] = targetId;
    addHonor(target.id, target.name); // 영구 저장소에 즉시 반영
    return { ok: true };
  }

  /** 관리자가 게임 종료 후, 문제를 일으킨 참여자에게 경고를 준다. 같은 게임에서 같은 사람에게 중복으로 줄 수는 없다. */
  giveWarning(byChannelId, targetId) {
    if (!this.isAdmin(byChannelId)) return { ok: false, error: "관리자만 경고를 줄 수 있습니다." };
    const result = this.lastResult;
    if (!result) return { ok: false, error: "경고를 줄 수 있는 게임 결과가 없습니다." };
    if (!targetId) return { ok: false, error: "대상을 지정해주세요." };
    const target = result.players.find((p) => p.id === targetId);
    if (!target) return { ok: false, error: "존재하지 않는 플레이어입니다." };
    if (this.warningsGiven[targetId]) return { ok: false, error: "이미 이번 판에 이 플레이어에게 경고를 주셨습니다." };
    this.warningsGiven[targetId] = true;
    const totalWarnings = addWarning(target.id, target.name); // 영구 저장소에 즉시 반영
    return { ok: true, totalWarnings };
  }

  /** 플레이어 본인이 자신의 칭호를 장착/해제한다. 관리자 권한이 필요 없고, 본인이 실제로 보유한 업적의 칭호인지만 확인한다. */
  setMyTitle(channelId, title) {
    return setMyActiveTitle(channelId, title);
  }

  /** 관리자 페이지: 특정 사람의 명예 점수를 직접 지정한다. */
  adminSetHonor(byChannelId, targetChannelId, nickname, value) {
    if (!this.isAdmin(byChannelId)) return { ok: false, error: "관리자만 사용할 수 있습니다." };
    if (!targetChannelId) return { ok: false, error: "대상을 지정해주세요." };
    setHonor(targetChannelId, nickname, value);
    return { ok: true };
  }

  /** 관리자 페이지: 특정 사람의 포인트를 직접 지정한다. */
  adminSetPoints(byChannelId, targetChannelId, nickname, value) {
    if (!this.isAdmin(byChannelId)) return { ok: false, error: "관리자만 사용할 수 있습니다." };
    if (!targetChannelId) return { ok: false, error: "대상을 지정해주세요." };
    setPoints(targetChannelId, nickname, value);
    return { ok: true };
  }

  /** 관리자 페이지: 특정 사람의 경고 횟수를 직접 지정한다. */
  adminSetWarnings(byChannelId, targetChannelId, nickname, value) {
    if (!this.isAdmin(byChannelId)) return { ok: false, error: "관리자만 사용할 수 있습니다." };
    if (!targetChannelId) return { ok: false, error: "대상을 지정해주세요." };
    setWarnings(targetChannelId, nickname, value);
    return { ok: true };
  }

  /** 관리자 페이지: 특정 사람에게 업적을 수여한다 (칭호도 함께 갱신됨). */
  adminGrantAchievement(byChannelId, targetChannelId, nickname, achievementId) {
    if (!this.isAdmin(byChannelId)) return { ok: false, error: "관리자만 사용할 수 있습니다." };
    if (!targetChannelId) return { ok: false, error: "대상을 지정해주세요." };
    return grantAchievement(targetChannelId, nickname, achievementId);
  }

  /** 관리자 페이지: 특정 사람의 업적을 전부 초기화한다 (보유 칭호도 함께 사라지고, 장착 중이었다면 해제됨). */
  adminResetAchievements(byChannelId, targetChannelId) {
    if (!this.isAdmin(byChannelId)) return { ok: false, error: "관리자만 사용할 수 있습니다." };
    if (!targetChannelId) return { ok: false, error: "대상을 지정해주세요." };
    return resetAchievements(targetChannelId);
  }

  /** 관리자 페이지: 특정 사람이 표시할 활성 칭호를 직접 지정한다(해제하려면 title을 null로). */
  adminSetActiveTitle(byChannelId, targetChannelId, title) {
    if (!this.isAdmin(byChannelId)) return { ok: false, error: "관리자만 사용할 수 있습니다." };
    if (!targetChannelId) return { ok: false, error: "대상을 지정해주세요." };
    setActiveTitle(targetChannelId, title);
    return { ok: true };
  }

  /** 관리자 페이지: 명예/경고/업적 기록이 있는 모든 사람의 정보를 하나로 합쳐서 가져온다. */
  adminGetProfiles(byChannelId) {
    if (!this.isAdmin(byChannelId)) return { ok: false, error: "관리자만 사용할 수 있습니다." };
    const honorProfiles = getAllHonorProfiles();
    const achievementProfiles = getAllAchievementProfiles();
    const byId = {};
    for (const h of honorProfiles) {
      byId[h.channelId] = { ...h, achievements: [], activeTitle: null };
    }
    for (const a of achievementProfiles) {
      byId[a.channelId] = { ...(byId[a.channelId] || { channelId: a.channelId, honor: 0, points: 0, warnings: 0, gamesPlayed: 0, wins: 0, losses: 0 }), nickname: a.nickname, achievements: a.achievements, activeTitle: a.activeTitle };
    }
    const profiles = Object.values(byId).sort((a, b) => (a.nickname || "").localeCompare(b.nickname || ""));
    return { ok: true, profiles, catalog: Object.values(ACHIEVEMENTS) };
  }

  action(type, payload, channelId) {
    if (!this.game) return { ok: false, error: "게임이 시작되지 않았습니다." };
    const actingId = this.resolveActingId(channelId);
    const { __byPuppeteer, __auto, ...cleanPayload } = payload || {}; // 클라이언트가 임의로 보낸 조종 표시는 무시한다
    const asPuppet = this.puppetInfo(channelId).viewing && actingId !== this.puppetInfo(channelId).witchId;
    const before = this.game;
    const next = applyAction(before, { type, ...cleanPayload, ...(asPuppet ? { __byPuppeteer: true } : {}) }, actingId);
    this.game = applyAlertTiming(before, trackAchievements(before, next));
    this.finishGame();
    return { ok: true };
  }

  adminForceSkip(byChannelId) {
    if (!this.isAdmin(byChannelId)) return { ok: false, error: "관리자만 사용할 수 있습니다." };
    if (!this.game) return { ok: false, error: "게임이 시작되지 않았습니다." };
    this.game = applyAlertTiming(this.game, trackAchievements(this.game, autoAdvance(this.game)));
    this.finishGame();
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
    this.puppetView = {};
    this.honorsGiven = {};
    this.warningsGiven = {};
    this.statsRecorded = false;
    this.lastResult = null;          // 지난 판 결과는 새 게임이 시작되면 사라진다
    this.resultClosedByAdmin = false;
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
      this.game = applyAlertTiming(this.game, trackAchievements(this.game, autoAdvance(this.game)));
      this.finishGame();
      return { changed: true, full: true };
    }
    this.game = { ...this.game, timerSeconds: this.game.timerSeconds - 1 };
    return { changed: true, full: false };
  }
}

export const room = new Room();
