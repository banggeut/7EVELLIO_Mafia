import {
  ROLES, isMafiaAligned, isCitizenAligned, isNeutralSide,
  CITIZEN_SPECIAL_ROLES, GEM_TYPES, defenseUsedCount,
} from "./gameEngine.js";

/* ============================================================
   게임 종료 정산 (포인트)

   한 판이 끝나면 참가자마다 "기본 점수 + 이번 판에 해낸 일들"을 더해 포인트를 준다.
   화면에는 항목별로 한 줄씩 보여주므로, 여기서 만드는 label 이 그대로 플레이어에게 읽힌다.

   설계 원칙
   1) 기본 점수는 진영 난이도순: 시민 < 마피아 < 중립.
      시민은 인원이 가장 많아 이길 확률이 높고, 중립은 혼자 조건을 맞춰야 해서 가장 어렵다.
   2) 보너스는 "운"이 아니라 "판단"에 준다. 역할을 받았다는 사실만으로는 주지 않고,
      그 역할로 뭔가를 해냈을 때만 준다.
   3) 흔한 성과는 작게(3~6), 판을 바꾼 성과는 크게(12~25).
      한 사람이 여러 개를 쌓을 수 있으므로, 합계에는 상한을 둔다(BONUS_CAP).
   4) 감점은 없다. 못해도 잃지 않고, 잘하면 더 받는 구조여야 계속 시도하게 된다.

   새 항목을 추가할 때: gameEngine 이 "게임 끝까지 남겨두는 값"만 쓸 것.
   밤마다 초기화되는 state 필드는 여기까지 오지 않는다. 누적이 필요하면
   achievementTracker.js 에서 state.achv 에 쌓은 뒤 여기서 읽는다(sc* 키들이 그 예).
   ============================================================ */

/** 승리 시 기본 점수 */
export const BASE_WIN = { citizen: 50, mafia: 70, neutral: 100 };
/** 패배해도 끝까지 자리를 지킨 것에 대한 기본 점수 (승리의 20%) */
export const BASE_LOSS = { citizen: 10, mafia: 14, neutral: 20 };
/** 보너스 합계 상한 - 기본 승리 점수만큼까지만. 한 판 최대치가 기본점의 2배를 넘지 않게 한다. */
export const BONUS_CAP = { citizen: 60, mafia: 70, neutral: 100 };
/** 권속(흡혈당해 중립이 된 시민) - 본인이 만든 승리가 아니라서 중립 기본점보다 낮게 둔다. */
export const BASE_THRALL_WIN = 30;
export const BASE_THRALL_LOSS = 10;

const SPECIAL_CITIZEN = new Set(CITIZEN_SPECIAL_ROLES);

/**
 * 정산에 쓸 진영. isMafiaAligned/isCitizenAligned 는 감옥에 갇힌 사람을 모든 진영에서 빼버리는데,
 * 그건 승패 계산용 규칙이라 정산에는 맞지 않는다(감옥에 갔다고 지금까지 한 일이 사라지진 않는다).
 * 그래서 감옥 여부를 무시한 사본으로 판정한다.
 */
export function scoringTeam(p) {
  const free = { ...p, inJail: false };
  if (isNeutralSide(free)) return "neutral";
  if (isMafiaAligned(free)) return "mafia";
  if (isCitizenAligned(free)) return "citizen";
  return ROLES[p.role]?.team || "citizen";
}

export function computeGamePoints(game, player, won) {
  const team = scoringTeam(player);
  const a = game.achv?.[player.id] || {};
  const players = game.players || [];
  const startRole = game.initialRoles?.[player.id] || player.role;
  const alive = player.alive && !player.inJail;
  const items = [];

  /** 보너스 한 줄 추가. n이 0 이하면 아무것도 안 한다. */
  const add = (label, n) => { if (n > 0) items.push({ label, points: Math.round(n) }); };
  /** 조건이 참일 때만 */
  const addIf = (cond, label, n) => { if (cond) add(label, n); };
  /** 횟수 × 단가 (여러 번 해낸 성과) */
  const addEach = (count, label, per) => { if (count > 0) add(count > 1 ? `${label} ×${count}` : label, count * per); };

  // ══════════════ 공통 ══════════════
  addIf(alive, "끝까지 생존", 8);
  addIf(a.revived, "죽음에서 돌아옴", 6);
  // 오래 버틴 판일수록 한 사람이 감당한 밤이 많다
  addIf(alive && (game.dayNumber || 0) >= 6, "장기전 완주", 5);

  // ══════════════ 시민팀 ══════════════
  if (team === "citizen") {
    // 투표 추리 - 직접 투표한 대상이 처형됐고 마피아팀이었음
    addEach(a.scVoteHitMafia || 0, "투표 적중 (처형된 마피아에 투표)", 6);

    // 보안관 - 틀리면 감옥에 가는 큰 리스크를 지고 맞힌 것
    addIf(player.isSheriff, "보안관 당선", 4);
    addEach(a.scSheriffMafiaExec || 0, "보안관 처형 적중", 15);
    addEach(a.dictatorExecutions || 0, "독재 처형 적중", 12);
    addIf(a.inquisitionMafia, "이단심판 적중", 15);

    // 조사 계열
    addEach((player.policeInvestigatedMafiaIds || []).length, "경찰 조사로 마피아 적발", 5);
    const findable = players.filter((m) => isMafiaAligned(m) && !["spy", "conartist", "godfather"].includes(m.role));
    addIf(findable.length > 0 && findable.every((m) => (player.policeInvestigatedMafiaIds || []).includes(m.id)), "마피아팀 완전 적발", 15);
    addIf(a.fbiShotMafia, "[FBI] 사살 성공", 14);
    addIf(player.detectiveCaughtSpyThenExecuted, "탐정 추적 → 스파이 처형", 12);
    addIf(a.deduceMafia, "명추리로 범인 특정", 10);
    addIf(a.auditExecuted, "행정조사 → 처형 성공", 10);
    if (player.role === "undertaker") addEach(Object.keys(game.undertakerFindings || {}).length, "부검 기록", 3);
    addIf(player.reporterRevealedMafiaOnce, "특종으로 마피아 공개", 10);

    // 보호 계열
    addEach(player.doctorSaveCount || 0, "의사 보호 성공", 6);
    addEach(a.saintSaves || 0, "성녀의 가호", 6);
    addIf(player.deathCause === "bodyguard", "경호원 희생", 12);
    addIf(player.bodyguardDiedProtectingDoctor, "의사를 지켜냄", 6);
    addIf(a.lastWordExecuted, "결정적 유언 → 처형 성공", 12);
    addIf(player.priestCaughtVampireThenExecuted, "성직자 적발 → 뱀파이어 처형", 12);
    addIf(player.priestReviveUsed, "부활 집행", 8);
    addIf(a.possessRevive || a.relicProtect, "영매의 빌린 능력 활용", 8);
    addIf(a.pleaExposed, "사법거래로 마피아 폭로", 10);
    addEach(defenseUsedCount(player), "공격을 버텨냄", 5);

    // 성장·역할 달성
    addIf(player.teacherGraduatedStudent, "제자를 졸업시킴", 8);
    addIf(player.studentGraduatedSuccessfully, "졸업 성공", 8);
    addIf(won && alive && startRole === "unemployed" && player.role === "unemployed", "백수인 채로 승리", 10);
    addIf(won && alive && startRole === "citizen", "무직 시민 생존 승리", 5);
  }

  // ══════════════ 마피아팀 ══════════════
  if (team === "mafia") {
    addEach(a.scMafiaNightKills || 0, "밤 처치 (팀 성과)", 4);
    addEach(a.assassinKills || 0, "암살 성공", 12);
    addEach(a.poisonKills || 0, "독살 성공", 12);
    addEach(a.virusSuccess || 0, "바이러스 감염", 10);
    addIf(player.framerExposedNextDay, "조작한 대상이 마피아로 공개됨", 12);

    // 정체 은폐 - 경찰에게 조사당했는데 마피아로 뜨지 않은 직업들
    const investigatedMe = players.some((p) => (p.policeAllInvestigatedIds || []).includes(player.id));
    const flaggedMe = players.some((p) => (p.policeInvestigatedMafiaIds || []).includes(player.id));
    addIf(investigatedMe && !flaggedMe, "경찰 조사를 속여넘김", 12);

    addIf(player.blockerCharmUsed, "능력 봉인 성공", 6);
    addIf(player.silencerTraffickingUsed, "인신매매 실행", 6);
    addIf(player.silencerBrainwashUsed, "세뇌 실행", 8);
    if (player.role === "witch") addEach(game.witchCastCount || 0, "저주 시전", 5);
    addEach((a.controlledIds || []).length, "정신 지배", 5);
    addIf(a.ancientKilled, "고대 주술 적중", 18);
    addIf(a.fakeNews, "가짜뉴스로 시민을 몰아냄", 15);
    if (player.role === "godfather") addEach(game.godfatherRecruitCount || 0, "영입 성공", 15);
    addIf(player.godfatherRecruitedSoldier, "건달을 포섭", 10);
    addIf(player.terroristKilledForcedRole, "자폭으로 핵심 직업 제거", 15);
    addIf(a.arsonBig, "대규모 방화", 18);
    addIf(a.bigBombArt, "거대 폭탄 예술", 18);
    addIf(won && alive && player.disguisedAs, "위장을 끝까지 유지", 10);
    addIf(won && alive, "마피아 생존 승리", 8);
  }

  // ══════════════ 중립 ══════════════
  if (team === "neutral") {
    // 아래 보석·영혼은 게임 전체 카운터라, 그 역할을 맡은 본인에게만 준다.
    // (이게 없으면 같은 중립이라는 이유로 늑대인간이 괴도의 보석 점수를 받아간다)
    const gems = (game.stolenGemTypes || []).length;
    if (player.role === "thief") {
      // 수집 자체가 승리 조건이라 기본점 100에 이미 반영돼 있다. 단가를 낮춰 이중 보상을 줄인다.
      addEach(gems, "보석 수집", 5);
      addIf(gems >= GEM_TYPES.length, "보석 전부 수집", 15);
    }

    const thralls = players.filter((p) => p.isThrall).length;
    if (player.role === "vampire") addEach(thralls, "권속 생성", 5);
    addEach(player.werewolfKillCount || 0, "늑대인간 사냥", 8);
    if (player.role === "cultist") addEach(game.cultistStacks || 0, "영혼 수집", 5);
    addIf(player.role === "mercenary" && player.mercenaryContactedBy, "계약 성사", 10);
    addIf(won && player.role === "mercenary", "계약 완수", 12);
    addIf(player.catOwnerId, "집사를 확보", 8);
    addIf(won && alive, "중립 생존 승리", 10);
    // 끝까지 혼자 남은 경우
    addIf(won && alive && players.filter((p) => p.alive && !p.inJail).length === 1, "최후의 1인", 15);
  }

  // ══════════════ 합산 ══════════════
  // 권속은 "흡혈당해서" 중립이 된 시민이다. 스스로 어려운 조건을 맞춘 게 아니므로
  // 진짜 중립과 같은 기본점(100)을 주지 않는다.
  const thrall = !!player.isThrall;
  const base = thrall ? (won ? BASE_THRALL_WIN : BASE_THRALL_LOSS)
    : ((won ? BASE_WIN : BASE_LOSS)[team] ?? (won ? 50 : 10));
  const rawBonus = items.reduce((sum, it) => sum + it.points, 0);
  const cap = BONUS_CAP[team] ?? 50;
  const bonus = Math.min(rawBonus, cap);

  return {
    team,
    won: !!won,
    base,
    baseLabel: thrall ? (won ? "권속 승리" : "권속 참가") : won ? `${TEAM_LABEL[team]} 승리` : `${TEAM_LABEL[team]} 참가`,
    bonus,
    // 상한에 걸렸을 때는 "깎였다"가 아니라 "꽉 채웠다"로 보여준다.
    // 음수 줄을 만들면 잘한 판인데도 손해 본 기분이 든다.
    rawBonus,
    capped: rawBonus > cap,
    cap,
    items,
    total: base + bonus,
  };
}

export const TEAM_LABEL = { citizen: "시민팀", mafia: "마피아팀", neutral: "중립" };
