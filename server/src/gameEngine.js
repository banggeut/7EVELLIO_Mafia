/**
 * 레벨리오 마피아 - 서버 권위(authoritative) 게임 엔진
 * 클라이언트 프로토타입의 로직을 순수 함수 형태로 이식했습니다.
 * 이 파일은 프레임워크 의존성이 없는 순수 JS라, 프론트/백엔드 어디서든 재사용 가능합니다.
 */

export const ROLES = {
  mafia: { label: "마피아", team: "mafia", emoji: "🗡️",
    desc: "밤마다 시민 한 명을 지목해 제거합니다. 마피아팀끼리는 서로를 알아볼 수 있습니다." },
  spy: { label: "스파이", team: "mafia", emoji: "🕵️",
    desc: "밤마다 플레이어 한 명을 조사해 직업을 알 수 있습니다." },
  framer: { label: "해커", team: "mafia", emoji: "💻",
    desc: "밤마다 한 명을 지목합니다. 시스템을 해킹해 데이터를 조작해서, 그 사람이 이번 밤 경찰·스파이·기자의 조사를 받으면 결과가 마피아로 둔갑합니다." },
  blocker: { label: "마담", team: "mafia", emoji: "💋",
    desc: "밤마다 한 명을 유혹해 밤을 함께 보냅니다. 유혹당한 사람은 이번 밤 자신의 능력을 사용하지 못합니다." },
  silencer: { label: "유괴범", team: "mafia", emoji: "⛓️",
    desc: "밤마다 한 명을 납치합니다. 납치당한 사람은 다음날 낮 채팅에 전혀 참여할 수 없습니다." },
  terrorist: { label: "테러리스트", team: "mafia", emoji: "💣",
    desc: "투표로 처형되면, 마피아팀을 제외한 무작위 플레이어 한 명과 함께 자폭합니다. 그 플레이어의 직업은 공개되지 않습니다." },
  witch: { label: "마녀", team: "mafia", emoji: "🔮",
    desc: "게임당 단 한 번, 밤에 플레이어 한 명에게 죽음의 저주를 겁니다. 저주에 걸린 사람은 3일 후 목숨을 잃습니다. 그 전에 마녀가 투표로 처형되면 저주는 풀립니다." },
  police: { label: "경찰", team: "citizen", emoji: "🔍",
    desc: "밤마다 한 명을 조사해 마피아 팀인지 아닌지 확인할 수 있습니다." },
  doctor: { label: "의사", team: "citizen", emoji: "🩺",
    desc: "밤마다 살릴 사람을 한 명 선택합니다. 그 사람이 그날 밤 공격당했다면 다음날 죽지 않습니다." },
  reporter: { label: "기자", team: "citizen", emoji: "📰",
    desc: "2일차 밤부터, 단 한 번, 선택한 사람의 직업을 다음날 아침 공개합니다." },
  medium: { label: "영매", team: "citizen", emoji: "👻",
    desc: "밤마다 죽은 사람들과 채팅으로 대화할 수 있습니다." },
  soldier: { label: "건달", team: "citizen", emoji: "🎖️",
    desc: "밤마다 한 명을 협박해 다음날 투표를 하지 못하게 만듭니다." },
  newlywed: { label: "신혼부부", team: "citizen", emoji: "💍",
    desc: "부부끼리 밤마다 채팅할 수 있습니다. 한쪽이 마피아에게 살해당하면 그 대신 배우자가 사망합니다. 이렇게 배우자를 잃으면, 남은 사람은 '복수자'가 되어 게임당 단 한 번 밤에 누군가를 죽일 수 있습니다 (단, 본인도 함께 목숨을 잃습니다)." },
  lover: { label: "연인", team: "citizen", emoji: "💞",
    desc: "서로의 존재를 알고, 밤마다 연인끼리 채팅할 수 있습니다. 신혼부부와 달리 상대가 죽어도 대신 죽는 능력은 없습니다." },
  politician: { label: "정치인", team: "citizen", emoji: "🎩",
    desc: "투표로는 절대 처형되지 않으며, 투표할 때 표를 두 번 행사합니다." },
  detective: { label: "탐정", team: "citizen", emoji: "🧭",
    desc: "밤마다 한 명을 지목해, 그 사람이 이번 밤 능력을 썼다면 누구를 대상으로 했는지 알 수 있습니다." },
  undertaker: { label: "장의사", team: "citizen", emoji: "⚰️",
    desc: "밤마다 죽은 사람 한 명을 조사해 정확한 직업을 알아냅니다. 영혼을 빼앗겼거나 흡혈귀였는지도 함께 확인할 수 있습니다." },
  judge: { label: "판사", team: "citizen", emoji: "🔨",
    desc: "판사가 살아있으면, 낮 처형 투표에서 최다 득표자의 처형 여부를 공개 찬반 투표 대신 판사 혼자 결정합니다. 투표가 동점이 나면 동점자 중 한 명을 직접 지명할 수도 있습니다. 능력을 사용해도 직업은 공개되지 않습니다." },
  citizen: { label: "시민", team: "citizen", emoji: "🌾",
    desc: "특별한 능력은 없습니다. 낮의 토론과 투표로 마피아를 찾아내야 합니다." },
  veteran: { label: "군인", team: "citizen", emoji: "🪖",
    desc: "단 한 번, 마피아의 공격을 막아내고 살아남을 수 있습니다. 성공하면 모두에게 공개적으로 알려집니다." },
  cultist: { label: "악마 숭배자", team: "neutral", emoji: "😈",
    desc: "밤마다 한 명을 지목합니다. 그 사람이 다음날 투표로 처형되면 영혼을 하나 수확합니다. 영혼 4개를 모으면 승리합니다." },
  vampire: { label: "뱀파이어", team: "neutral", emoji: "🧛",
    desc: "1일차를 제외한 홀수일차 밤마다 한 명을 물어 흡혈귀로 만듭니다. 흡혈귀 팀 수가 마피아+시민팀 합보다 많아지면 승리합니다." },
};

export const NEUTRAL_ROLES = ["cultist", "vampire"];

export const MAFIA_SPECIAL_ROLES = ["spy", "framer", "blocker", "silencer", "terrorist", "witch"];
export const CITIZEN_SPECIAL_ROLES = ["police", "doctor", "reporter", "medium", "soldier", "newlywed", "politician", "detective", "veteran", "undertaker", "judge"];

export const NIGHT_ABILITY_ROLES = [
  "mafia", "spy", "framer", "blocker", "silencer", "police", "doctor", "soldier", "reporter", "detective",
  "cultist", "vampire", "witch", "undertaker",
];
export const ROLE_TARGET_KEY = {
  mafia: "mafiaTarget", spy: "spyTarget", framer: "framerTarget", blocker: "blockerTarget", silencer: "silencerTarget",
  police: "policeTarget", doctor: "doctorTarget", soldier: "soldierTarget", reporter: "reporterTarget", detective: "detectiveTarget",
  cultist: "cultistTarget", vampire: "vampireTarget", witch: "witchTarget", undertaker: "undertakerTarget",
  avenger: "avengerTarget",
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
/**
 * 인원수별 밸런스 표.
 * mafiaTeam: 마피아팀 총원(마피아+스파이+모함꾼+방해꾼+입막음꾼 전부 합쳐서)
 * mafiaSpecials: 그중 "특수 능력이 있는" 인원 수 (나머지는 순수 마피아)
 * citizenSpecials: 시민팀 중 특수직업 슬롯 수 (연인은 2슬롯 소모)
 */
const BALANCE_TABLE = [
  { max: 4, mafiaTeam: 1, mafiaSpecials: 0, citizenSpecials: 0 },
  { max: 5, mafiaTeam: 1, mafiaSpecials: 0, citizenSpecials: 1 },
  { max: 7, mafiaTeam: 2, mafiaSpecials: 1, citizenSpecials: 2 },
  { max: 9, mafiaTeam: 2, mafiaSpecials: 1, citizenSpecials: 2 },
  { max: 11, mafiaTeam: 3, mafiaSpecials: 2, citizenSpecials: 3 },
  { max: 13, mafiaTeam: 3, mafiaSpecials: 2, citizenSpecials: 4 },
  { max: 15, mafiaTeam: 4, mafiaSpecials: 3, citizenSpecials: 4 },
  { max: 17, mafiaTeam: 4, mafiaSpecials: 3, citizenSpecials: 5 },
  { max: 19, mafiaTeam: 5, mafiaSpecials: 3, citizenSpecials: 5 },
  { max: Infinity, mafiaTeam: 6, mafiaSpecials: 4, citizenSpecials: 6 },
];

export function getBalanceForCount(n) {
  for (const tier of BALANCE_TABLE) {
    if (n <= tier.max) return { mafiaTeam: tier.mafiaTeam, mafiaSpecials: tier.mafiaSpecials, citizenSpecials: tier.citizenSpecials };
  }
  const last = BALANCE_TABLE[BALANCE_TABLE.length - 1];
  return { mafiaTeam: last.mafiaTeam, mafiaSpecials: last.mafiaSpecials, citizenSpecials: last.citizenSpecials };
}

// 구버전 호환용 - 더 이상 내부적으로 쓰이진 않지만 혹시 참조하는 곳이 있을까봐 남겨둠
export function getMafiaCount(n) {
  return getBalanceForCount(n).mafiaTeam;
}

export function alivePlayers(players) { return players.filter((p) => p.alive); }

/** 살아있는 뱀파이어(뱀파이어 본인 + 흡혈귀가 된 사람 전원) 인원 */
function countVampireTeam(alive) {
  return alive.filter((p) => p.role === "vampire" || p.isThrall).length;
}

export function checkWinner(players) {
  const alive = alivePlayers(players);
  const vampireTeamAlive = countVampireTeam(alive);
  // 흡혈귀가 된 사람은 원래 팀(마피아/시민)에서는 더 이상 그 팀 소속으로 세지 않는다.
  const mafiaTeamAlive = alive.filter((p) => ROLES[p.role].team === "mafia" && !p.isThrall).length;
  const citizenTeamAlive = alive.filter((p) => ROLES[p.role].team === "citizen" && !p.isThrall).length;

  // 뱀파이어 팀 수가 마피아+시민팀 합보다 많아지면 즉시 승리 (다른 조건보다 우선)
  if (vampireTeamAlive > 0 && vampireTeamAlive > mafiaTeamAlive + citizenTeamAlive) return "vampire";
  // 마피아 팀 전체(스파이·해커·마담·유괴범·테러리스트·마녀 포함)를 전부 제거해야 시민팀 승리로 처리한다.
  if (mafiaTeamAlive === 0) return "citizen";
  if (mafiaTeamAlive >= citizenTeamAlive) return "mafia";
  return null;
}

/** 후보 풀에서 예산(슬롯 수)을 넘지 않는 선에서 무작위로 역할을 골라낸다. */
function pickRandomRolesWithinBudget(pool, budget, costMap = {}) {
  const shuffled = shuffle(pool);
  const chosen = [];
  let remaining = budget;
  for (const role of shuffled) {
    const cost = costMap[role] || 1;
    if (cost <= remaining) {
      chosen.push(role);
      remaining -= cost;
    }
  }
  return chosen;
}

/**
 * queueUsers: [{ channelId, nickname, profileImageUrl }]
 * config: { mafiaPool: {spy,framer,blocker,silencer}, citizenPool: {police,doctor,reporter,medium,soldier,lover,politician,detective} }
 * "체크한 직업"은 이제 확정 배정이 아니라 "등장 가능한 후보 풀"이며, 실제 등장 개수는
 * 인원수에 따른 밸런스 표를 기준으로 그 풀 안에서 무작위로 정해진다.
 */
export const FORCED_CITIZEN_ROLES = ["police", "doctor"];

export function assignRoles(queueUsers, config) {
  const n = queueUsers.length;
  const balance = getBalanceForCount(n);

  const mafiaPoolRoles = MAFIA_SPECIAL_ROLES.filter((r) => config.mafiaPool?.[r]);
  const chosenMafiaSpecials = pickRandomRolesWithinBudget(mafiaPoolRoles, balance.mafiaSpecials);
  const plainMafiaCount = Math.max(0, balance.mafiaTeam - chosenMafiaSpecials.length);

  // 경찰과 의사는 체크 여부와 무관하게 항상 시민팀에 포함된다.
  const optionalCitizenPoolRoles = CITIZEN_SPECIAL_ROLES.filter(
    (r) => !FORCED_CITIZEN_ROLES.includes(r) && config.citizenPool?.[r]
  );
  // 경찰·의사는 "필수 직업"이라 특수직업 예산을 소모하지 않는다. 그 예산은 온전히 다른 특수직업들에게 돌아간다.
  const remainingCitizenBudget = balance.citizenSpecials;
  // 신혼부부는 실제로는 두 명이 배정되지만, 특수직업 자리 예산은 1개만 차지한다.
  const chosenOptionalCitizenSpecials = pickRandomRolesWithinBudget(optionalCitizenPoolRoles, remainingCitizenBudget, { newlywed: 1 });
  const chosenCitizenSpecials = [...FORCED_CITIZEN_ROLES, ...chosenOptionalCitizenSpecials];

  const citizenTeamTotal = Math.max(0, n - balance.mafiaTeam);
  const usedCitizenSlots = chosenCitizenSpecials.reduce((sum, r) => sum + (r === "newlywed" ? 2 : 1), 0);

  // 중립 직업: 일반 시민 한 자리를 대신해서 매 게임 정확히 1명 등장한다.
  const neutralPoolRoles = NEUTRAL_ROLES.filter((r) => config.neutralPool?.[r]);
  const chosenNeutral = neutralPoolRoles.length > 0 ? [shuffle(neutralPoolRoles)[0]] : [];

  const plainCitizenCount = Math.max(0, citizenTeamTotal - usedCitizenSlots - chosenNeutral.length);
  // 남은 순수 시민은 최대한 '연인' 쌍으로 자동 짝지어진다. 홀수면 딱 한 명만 진짜 순수 시민(솔로)으로 남는다.
  const loverPairCount = Math.floor(plainCitizenCount / 2);
  const soloCitizenCount = plainCitizenCount % 2;

  let bag = [];
  bag.push(...Array(plainMafiaCount).fill("mafia"));
  bag.push(...chosenMafiaSpecials);
  chosenCitizenSpecials.forEach((r) => (r === "newlywed" ? bag.push("newlywed", "newlywed") : bag.push(r)));
  bag.push(...chosenNeutral);
  for (let i = 0; i < loverPairCount; i++) bag.push("lover", "lover");
  bag.push(...Array(soloCitizenCount).fill("citizen"));
  while (bag.length < n) bag.push("citizen"); // 안전장치
  bag = shuffle(bag).slice(0, n);

  const players = queueUsers.map((u, i) => ({
    id: u.channelId,
    name: u.nickname,
    profileImageUrl: u.profileImageUrl || null,
    role: bag[i],
    alive: true,
    partnerId: null,
    isThrall: false,
    usedDefense: false,
    soulHarvested: false,
    executedByVote: false,
    isAvenger: false, // 신혼부부의 배우자가 대신 죽어서 '복수자'가 된 경우 true
    avengerUsed: false,
  }));
  // 신혼부부는 정확히 한 쌍만 존재한다.
  const newlyweds = players.filter((p) => p.role === "newlywed");
  if (newlyweds.length === 2) { newlyweds[0].partnerId = newlyweds[1].id; newlyweds[1].partnerId = newlyweds[0].id; }
  // 연인은 여러 쌍이 있을 수 있다 - 순서대로 둘씩 짝지어준다.
  const loverPlayers = players.filter((p) => p.role === "lover");
  for (let i = 0; i + 1 < loverPlayers.length; i += 2) {
    loverPlayers[i].partnerId = loverPlayers[i + 1].id;
    loverPlayers[i + 1].partnerId = loverPlayers[i].id;
  }
  return players;
}

export function createGameState(players) {
  return {
    phase: "reveal",
    players,
    dayNumber: 1,
    mafiaVotes: {}, spyTarget: null, framerTarget: null, blockerTarget: null, silencerTarget: null,
    policeTarget: null, doctorTarget: null, soldierTarget: null, reporterTarget: null, detectiveTarget: null,
    cultistTarget: null, vampireTarget: null, witchTarget: null, undertakerTarget: null, avengerTarget: null,
    avengerActorId: null,
    blockerPrevTarget: null, // 마담이 어젯밤 유혹한 대상 - 오늘 밤 같은 사람은 다시 고를 수 없다
    silencerPrevTarget: null, // 유괴범이 어젯밤 납치한 대상 - 오늘 밤 같은 사람은 다시 고를 수 없다
    reporterUsed: false, witchUsed: false,
    policeResult: null, spyResult: null, detectiveResult: null, reporterReveal: null, doctorResult: null, undertakerResult: null,
    lastNightDeath: null, nightSaveHappened: false, curseVictimName: null, curseCastName: null,
    curseTargetId: null, curseDeathDay: null,
    avengerKillResult: null, // { avengerName, targetName } - 복수자가 이번 밤 복수에 성공한 경우 (본인도 함께 사망)
    soloJobGrantedPlayerId: null, soloJobGrantedLabel: null, // 1일차 밤 사망자의 직업을 물려받은 솔로 시민 - 본인에게만 비공개로 알려줌
    blockedVoterId: null, blockedChatterId: null, blockedAbilityId: null,
    veteranSurvivedName: null, vampireFightResult: null, terroristBombVictimName: null,
    veteranSpyAlert: {}, // { [veteranPlayerId]: spyName } - 그 밤에 스파이에게 조사당한 군인에게만 공개
    cultistStacks: 0,
    revealedRoles: {}, // { [playerId]: roleLabel } - 한 번 공개되면 게임이 끝날 때까지 유지
    undertakerFindings: {}, // { [deadPlayerId]: { roleLabel, wasSoulHarvested, wasThrall } } - 장의사 본인에게만, 게임 내내 누적
    votes: {}, nominee: null, defenseText: "", finalVotes: {}, skipVotes: {}, tiedNominees: [], judgeVerdict: null,
    lastEliminated: null, politicianSaved: false,
    chats: { mafia: [], lover: {}, medium: [], day: [], vampire: [] }, // lover는 쌍(pair)별로 격리된 맵: { "id1|id2": [...메시지] }
    log: ["🌙 밤이 시작되기 전, 각자 자신의 직업을 확인합니다."],
    revealAckIds: [],
    winner: null,
    timerSeconds: 15, timerRunning: true,
  };
}

/* ---------- resolution helpers (identical logic to client prototype) ---------- */

/**
 * 마피아팀(마피아 역할만, 스파이 제외)의 밤 투표를 집계한다.
 * 최다 득표 대상이 목표가 되고, 동점이면 그 대상들 중 무작위로 정해진다.
 */
function resolveMafiaTarget(state) {
  const votes = state.mafiaVotes || {};
  const tally = {};
  Object.values(votes).forEach((targetId) => {
    if (!targetId) return;
    tally[targetId] = (tally[targetId] || 0) + 1;
  });
  const entries = Object.entries(tally);
  if (entries.length === 0) return { targetId: null, tied: false };
  let max = -1, leaders = [];
  entries.forEach(([id, c]) => {
    if (c > max) { max = c; leaders = [id]; } else if (c === max) leaders.push(id);
  });
  if (leaders.length === 1) return { targetId: leaders[0], tied: false };
  const picked = leaders[Math.floor(Math.random() * leaders.length)];
  return { targetId: picked, tied: true };
}

function resolveNight(state) {
  const { players, spyTarget, framerTarget, blockerTarget, silencerTarget,
    policeTarget, doctorTarget, soldierTarget, reporterTarget, detectiveTarget,
    cultistTarget, vampireTarget, witchTarget, undertakerTarget, avengerTarget, avengerActorId,
    dayNumber, reporterUsed, witchUsed } = state;

  // 방해꾼(마담)에게 막힌 사람이 있다면, 그 사람이 가진 "1인 전용 능력"(마피아 집단 킬 제외)은 이번 밤 무효가 된다.
  const blockedPlayer = blockerTarget ? players.find((p) => p.id === blockerTarget) : null;
  const blockedRole = blockedPlayer?.role || null;
  const effectiveDoctorTarget = blockedRole === "doctor" ? null : doctorTarget;
  const effectivePoliceTarget = blockedRole === "police" ? null : policeTarget;
  const effectiveSpyTarget = blockedRole === "spy" ? null : spyTarget;
  const effectiveDetectiveTarget = blockedRole === "detective" ? null : detectiveTarget;
  const effectiveReporterTarget = blockedRole === "reporter" ? null : reporterTarget;
  const effectiveSoldierTarget = blockedRole === "soldier" ? null : soldierTarget;
  const effectiveSilencerTarget = blockedRole === "silencer" ? null : silencerTarget;
  const effectiveFramerTarget = blockedRole === "framer" ? null : framerTarget;
  const effectiveCultistTarget = blockedRole === "cultist" ? null : cultistTarget;
  const effectiveVampireTarget = blockedRole === "vampire" ? null : vampireTarget;
  const effectiveWitchTarget = blockedRole === "witch" ? null : witchTarget;
  const effectiveUndertakerTarget = blockedRole === "undertaker" ? null : undertakerTarget;
  // 복수자는 직업(role)이 아니라 상태라서, 마담이 그 사람을 막았는지는 role이 아니라 isAvenger로 확인한다.
  const effectiveAvengerTarget = blockedPlayer?.isAvenger ? null : avengerTarget;

  // 방해꾼(마담)에게 막힌 마피아원의 표는 마피아 집단 투표 집계에서 제외한다 (마피아팀 전체가 무력화되진 않음).
  const mafiaVotesEffective = { ...state.mafiaVotes };
  if (blockerTarget && mafiaVotesEffective[blockerTarget] !== undefined) delete mafiaVotesEffective[blockerTarget];
  const { targetId: mafiaTarget, tied: mafiaVoteTied } = resolveMafiaTarget({ mafiaVotes: mafiaVotesEffective });

  let log = [...state.log];
  let updatedPlayers = players;
  let lastNightDeath = null;
  let nightSaveHappened = false;
  let veteranSurvivedName = null;
  let vampireFightResult = null;
  let curseVictimName = null; // 이번 밤에 저주가 실제로 발동해 사망한 경우
  let curseCastName = null; // 이번 밤에 처음 저주가 걸린 경우 (사망은 아직 아님)
  let curseTargetId = state.curseTargetId || null;
  let curseDeathDay = state.curseDeathDay || null;
  let avengerKillResult = null; // { avengerName, targetName } - 복수자가 이번 밤 성공한 경우
  let newWitchUsed = witchUsed;
  let policeResult = null, spyResult = null, detectiveResult = null, reporterReveal = null, doctorResult = null, undertakerResult = null;
  let newReporterUsed = reporterUsed;
  const veteranSpyAlert = {};
  let revealedRoles = { ...(state.revealedRoles || {}) };
  let undertakerFindings = { ...(state.undertakerFindings || {}) };

  if (effectiveDoctorTarget) {
    const t = players.find((p) => p.id === effectiveDoctorTarget);
    if (t) doctorResult = { targetName: t.name, saved: !!(mafiaTarget && mafiaTarget === effectiveDoctorTarget) };
  }
  if (effectivePoliceTarget) {
    const t = players.find((p) => p.id === effectivePoliceTarget);
    if (t) {
      const framed = !!effectiveFramerTarget && effectiveFramerTarget === effectivePoliceTarget;
      // 스파이는 부패경찰에게 모함당하지 않는 한 경찰 조사에서도 절대 마피아로 나오지 않는다.
      const isMafia = framed ? true : t.role === "spy" ? false : ROLES[t.role].team === "mafia";
      policeResult = { targetName: t.name, isMafia };
    }
  }
  if (effectiveSpyTarget) {
    const t = players.find((p) => p.id === effectiveSpyTarget);
    if (t) {
      const framed = !!effectiveFramerTarget && effectiveFramerTarget === effectiveSpyTarget;
      spyResult = { targetName: t.name, roleLabel: framed ? ROLES.mafia.label : ROLES[t.role].label };
      // 스파이가 군인을 조사하면, 군인이 다음날 아침 "스파이에게 정체를 들켰다"는 걸 알게 된다 (스파이 신원 노출).
      if (t.role === "veteran") {
        const spyActor = players.find((p) => p.role === "spy");
        if (spyActor) veteranSpyAlert[t.id] = spyActor.name;
      }
    }
  }
  if (effectiveDetectiveTarget) {
    const t = players.find((p) => p.id === effectiveDetectiveTarget);
    const actionMap = [
      { role: "mafia", targetId: mafiaTarget }, { role: "spy", targetId: effectiveSpyTarget },
      { role: "framer", targetId: effectiveFramerTarget }, { role: "blocker", targetId: blockerTarget },
      { role: "silencer", targetId: effectiveSilencerTarget },
      { role: "police", targetId: effectivePoliceTarget }, { role: "doctor", targetId: effectiveDoctorTarget },
      { role: "soldier", targetId: effectiveSoldierTarget }, { role: "reporter", targetId: effectiveReporterTarget },
      { role: "cultist", targetId: effectiveCultistTarget }, { role: "vampire", targetId: effectiveVampireTarget },
      { role: "witch", targetId: effectiveWitchTarget }, { role: "undertaker", targetId: effectiveUndertakerTarget },
    ];
    if (t) {
      const entry = actionMap.find((a) => a.role === t.role);
      if (entry && entry.targetId) {
        const actedOn = players.find((p) => p.id === entry.targetId);
        detectiveResult = { actorName: t.name, actedOnName: actedOn ? actedOn.name : null };
      } else {
        detectiveResult = { actorName: t.name, actedOnName: null };
      }
    }
  }
  if (effectiveReporterTarget && !reporterUsed && dayNumber >= 2) {
    const t = players.find((p) => p.id === effectiveReporterTarget);
    if (t) {
      const framed = !!effectiveFramerTarget && effectiveFramerTarget === effectiveReporterTarget;
      const roleLabel = framed ? ROLES.mafia.label : ROLES[t.role].label;
      reporterReveal = { name: t.name, roleLabel };
      newReporterUsed = true;
      revealedRoles[t.id] = roleLabel; // 기자가 공개한 직업은 이후로도 계속 공개 상태 유지
    }
  }

  // ── 장의사: 죽은 사람만 조사할 수 있고, 결과는 장의사 본인에게만 공개된다 ──
  if (effectiveUndertakerTarget) {
    const t = players.find((p) => p.id === effectiveUndertakerTarget);
    if (t && !t.alive) {
      const finding = { roleLabel: ROLES[t.role].label, wasSoulHarvested: !!t.soulHarvested, wasThrall: !!t.isThrall };
      undertakerResult = { targetName: t.name, ...finding };
      undertakerFindings[t.id] = finding;
    }
  }

  // ── 마녀의 저주 발동 확인: 이전에 걸어둔 저주가 있다면, 오늘이 그 발동일(3일 뒤)인지 확인한다 ──
  // 마피아의 습격과는 완전히 별개로 발동되며, 의사 보호로도 막을 수 없다.
  if (curseTargetId && curseDeathDay === dayNumber) {
    const cursed = updatedPlayers.find((p) => p.id === curseTargetId);
    if (cursed && cursed.alive) {
      updatedPlayers = updatedPlayers.map((p) => (p.id === cursed.id ? { ...p, alive: false } : p));
      curseVictimName = cursed.name;
      log.push(`🔮 ${cursed.name}님이 마녀의 저주로 목숨을 잃었습니다.`);
    }
    curseTargetId = null;
    curseDeathDay = null;
  }

  // ── 마녀의 저주 시전: 게임당 단 한 번, 대상은 3일 후 목숨을 잃는다 ──
  if (effectiveWitchTarget && !witchUsed) {
    const cursed = updatedPlayers.find((p) => p.id === effectiveWitchTarget);
    if (cursed && cursed.alive) {
      curseTargetId = cursed.id;
      curseDeathDay = dayNumber + 3;
      curseCastName = cursed.name;
      newWitchUsed = true;
      log.push(`🔮 ${cursed.name}님이 마녀의 저주를 받았습니다. 3일 후 저주가 발동됩니다.`);
    }
  }

  // ── 복수자: 배우자를 잃고 복수자가 된 사람의 1회용 복수 킬. 대상을 죽이지만 본인도 함께 목숨을 잃는다. ──
  if (effectiveAvengerTarget && avengerActorId) {
    const actor = updatedPlayers.find((p) => p.id === avengerActorId);
    const target = updatedPlayers.find((p) => p.id === effectiveAvengerTarget);
    if (actor && actor.alive && actor.isAvenger && !actor.avengerUsed && target && target.alive) {
      updatedPlayers = updatedPlayers.map((p) => {
        if (p.id === actor.id) return { ...p, alive: false, avengerUsed: true };
        if (p.id === target.id) return { ...p, alive: false };
        return p;
      });
      avengerKillResult = { avengerName: actor.name, targetName: target.name };
      log.push(`⚔️ ${actor.name}님과 ${target.name}님이 함께 사망한 채로 발견되었습니다.`);
    }
  }

  // ── 뱀파이어: 1일차 제외 홀수일차 밤에만 활동 ──
  if (effectiveVampireTarget && dayNumber >= 3 && dayNumber % 2 === 1) {
    const vampireActor = players.find((p) => p.role === "vampire" && p.alive);
    const target = players.find((p) => p.id === effectiveVampireTarget);
    if (vampireActor && target && target.alive) {
      if (target.role === "mafia") {
        // 진짜 마피아를 물면 서로 싸우다 둘 다 죽는다.
        updatedPlayers = updatedPlayers.map((p) =>
          p.id === target.id || p.id === vampireActor.id ? { ...p, alive: false } : p
        );
        vampireFightResult = { vampireName: vampireActor.name, mafiaName: target.name };
        log.push(`⚔️ 밤 사이, 뱀파이어와 마피아가 격돌해 서로 목숨을 잃었습니다.`);
      } else {
        updatedPlayers = updatedPlayers.map((p) => {
          if (p.id === target.id) return { ...p, isThrall: true };
          if ((target.role === "lover" || target.role === "newlywed") && p.id === target.partnerId) return { ...p, isThrall: true };
          return p;
        });
      }
    }
  }

  if (mafiaTarget) {
    if (mafiaVoteTied) log.push(`🎲 마피아팀의 표가 갈려, 대상이 무작위로 정해졌습니다.`);
    const negated = effectiveDoctorTarget && effectiveDoctorTarget === mafiaTarget;
    if (!negated) {
      let victim = updatedPlayers.find((p) => p.id === mafiaTarget);
      if (victim && victim.role === "newlywed" && victim.partnerId) {
        const partner = updatedPlayers.find((p) => p.id === victim.partnerId);
        if (partner && partner.alive) {
          // 원래 노려진 사람(victim)은 살아남고, 배우자가 대신 죽는다.
          // 살아남은 사람은 이제 '복수자'가 되어 게임당 한 번 밤에 누군가를 죽일 수 있다.
          updatedPlayers = updatedPlayers.map((p) => (p.id === victim.id ? { ...p, isAvenger: true } : p));
          victim = partner;
        }
      } else if (victim && victim.role === "vampire") {
        // 마피아가 뱀파이어를 노리면, 흡혈귀가 살아있는 한 그중 무작위 한 명이 대신 죽는다.
        const aliveThralls = updatedPlayers.filter((p) => p.isThrall && p.alive && p.id !== victim.id);
        if (aliveThralls.length > 0) victim = aliveThralls[Math.floor(Math.random() * aliveThralls.length)];
      }
      if (victim && victim.alive && victim.role === "veteran" && !victim.usedDefense) {
        // 군인의 1회용 방어 - 공격을 막아내고 모두에게 공개적으로 알려진다 (직업도 영구 공개).
        updatedPlayers = updatedPlayers.map((p) => (p.id === victim.id ? { ...p, usedDefense: true } : p));
        veteranSurvivedName = victim.name;
        revealedRoles[victim.id] = ROLES.veteran.label;
        log.push(`🪖 ${victim.name}님이 마피아의 공격에 맞서 싸워 살아남았습니다!`);
      } else if (victim && victim.alive) {
        updatedPlayers = updatedPlayers.map((p) => (p.id === victim.id ? { ...p, alive: false } : p));
        lastNightDeath = victim.id;
        log.push(`☠️ 밤 사이, ${victim.name}님이 목숨을 잃었습니다.`);
      }
    } else {
      nightSaveHappened = true;
      log.push(`🩺 의사의 보호 덕분에 이번 밤은 아무도 목숨을 잃지 않았습니다.`);
    }
  } else if (!vampireFightResult) {
    log.push(`🌤️ 이번 밤은 특별한 일이 일어나지 않았습니다.`);
  }
  if (reporterReveal) log.push(`📰 기자의 취재: ${reporterReveal.name}님의 직업은 [${reporterReveal.roleLabel}]입니다.`);

  // ── 1일차 밤에 죽은 사람이 직업이 있었다면(연인/신혼부부/중립 제외), 짝을 못 찾은 솔로 시민이 그 자리를 물려받는다 ──
  let soloJobGrantedPlayerId = null;
  let soloJobGrantedLabel = null;
  if (dayNumber === 1 && lastNightDeath) {
    const deadPlayer = updatedPlayers.find((p) => p.id === lastNightDeath);
    const excludedFromInheritance = ["citizen", "lover", "newlywed", "cultist", "vampire"];
    if (deadPlayer && !excludedFromInheritance.includes(deadPlayer.role)) {
      const soloCitizen = updatedPlayers.find((p) => p.role === "citizen" && p.alive && !p.partnerId);
      if (soloCitizen) {
        const inheritedRole = deadPlayer.role;
        updatedPlayers = updatedPlayers.map((p) => (p.id === soloCitizen.id ? { ...p, role: inheritedRole } : p));
        soloJobGrantedPlayerId = soloCitizen.id;
        soloJobGrantedLabel = ROLES[inheritedRole].label;
        log.push(`🧾 빈자리가 채워졌습니다.`); // 누가 무엇을 물려받았는지는 본인에게만 비공개로 알려준다
      }
    }
  }

  const winner = checkWinner(updatedPlayers);
  return {
    ...state, players: updatedPlayers,
    phase: winner ? "gameover" : "morning", winner,
    dayNumber: state.dayNumber + 1, // 밤이 끝나고 아침이 되는 시점에 날짜가 하루 넘어간다 (밤 N → 아침 N+1)
    lastNightDeath, nightSaveHappened, policeResult, spyResult, detectiveResult, reporterReveal, doctorResult, undertakerResult,
    veteranSurvivedName, vampireFightResult, curseVictimName, curseCastName, curseTargetId, curseDeathDay,
    avengerKillResult, avengerTarget: null, avengerActorId: null,
    soloJobGrantedPlayerId, soloJobGrantedLabel,
    veteranSpyAlert, revealedRoles, undertakerFindings,
    cultistTarget: effectiveCultistTarget, // 투표 시점에 다시 대조해야 하므로 막히지 않은 값만 남겨둔다
    blockerPrevTarget: blockerTarget || state.blockerPrevTarget || null,
    silencerPrevTarget: silencerTarget || state.silencerPrevTarget || null,
    reporterUsed: newReporterUsed, witchUsed: newWitchUsed,
    blockedVoterId: effectiveSoldierTarget || null,
    blockedChatterId: effectiveSilencerTarget || null,
    blockedAbilityId: blockerTarget || null,
    timerSeconds: winner ? 0 : 12, timerRunning: !winner,
    log: log.slice(-60), // 로그가 끝없이 커지지 않도록 최근 60개만 유지 (트래픽 절약)
  };
}

function resolveNomination(state) {
  const votables = alivePlayers(state.players);
  const tally = {};
  votables.forEach((p) => (tally[p.id] = 0));
  Object.entries(state.votes).forEach(([voterId, targetId]) => {
    const voter = state.players.find((p) => p.id === voterId);
    if (!voter) return;
    const weight = voter.role === "politician" ? 2 : 1;
    if (tally[targetId] !== undefined) tally[targetId] += weight;
  });
  let max = -1, leaders = [];
  Object.entries(tally).forEach(([id, c]) => {
    if (c > max) { max = c; leaders = [id]; } else if (c === max) leaders.push(id);
  });
  let log = [...state.log];
  if (max <= 0) {
    log.push(`🗳️ 아무도 투표하지 않아 아무도 지목되지 않았습니다.`);
    return { ...state, phase: "voteresult", lastEliminated: null, politicianSaved: false, nominee: null, log: log.slice(-60), timerSeconds: 10, timerRunning: true };
  }
  if (leaders.length > 1) {
    // 판사가 살아있고 본인이 동점자에 포함되지 않았다면, 판사가 동점자 중 한 명을 직접 지명한다.
    const judge = state.players.find((p) => p.role === "judge" && p.alive && !leaders.includes(p.id));
    if (judge) {
      log.push(`🔨 표가 갈려 판사가 동점자 중 한 명을 지명하게 됩니다.`);
      return { ...state, phase: "judgetiebreak", tiedNominees: leaders, nominee: null, log: log.slice(-60), timerSeconds: 15, timerRunning: true };
    }
    log.push(`🗳️ 표가 갈려 아무도 지목되지 않았습니다.`);
    return { ...state, phase: "voteresult", lastEliminated: null, politicianSaved: false, nominee: null, log: log.slice(-60), timerSeconds: 10, timerRunning: true };
  }
  const nominee = state.players.find((p) => p.id === leaders[0]);
  log.push(`⚖️ ${nominee.name}님이 최다 득표로 지목되어 최후 변론을 시작합니다.`);
  return { ...state, phase: "defense", nominee: nominee.id, defenseText: "", log: log.slice(-60), timerSeconds: 20, timerRunning: true };
}

/**
 * 처형 여부가 정해진 뒤(공개 찬반투표든 판사의 단독 판결이든) 공통으로 처리하는 로직.
 * shouldExecute: 이번에 처형하기로 결정됐는지, verdictLogLine: 그 결정에 대한 로그 한 줄.
 */
function applyExecutionOutcome(state, shouldExecute, verdictLogLine) {
  const nominee = state.players.find((p) => p.id === state.nominee);
  let log = [...state.log, verdictLogLine];
  let updatedPlayers = state.players;
  let lastEliminated = null;
  let politicianSaved = false;
  let cultistStacks = state.cultistStacks || 0;
  let revealedRoles = { ...(state.revealedRoles || {}) };
  let terroristBombVictimName = null;
  let curseTargetId = state.curseTargetId || null;
  let curseDeathDay = state.curseDeathDay || null;

  if (shouldExecute && nominee.role !== "politician") {
    const soulHarvested = !!state.cultistTarget && state.cultistTarget === nominee.id;
    if (soulHarvested) cultistStacks += 1;
    updatedPlayers = state.players.map((p) => (p.id === nominee.id ? { ...p, alive: false, soulHarvested, executedByVote: true } : p));
    lastEliminated = nominee.id;
    log.push(`⚖️ ${nominee.name}님이 마을에서 처형되었습니다.`);

    // 마녀가 처형되면, 아직 발동되지 않은 저주는 그대로 풀린다.
    if (nominee.role === "witch" && curseTargetId) {
      log.push(`🔮 마녀가 처형되어 걸려있던 저주가 풀렸습니다.`);
      curseTargetId = null;
      curseDeathDay = null;
    }

    if (nominee.role === "terrorist") {
      const candidates = updatedPlayers.filter((p) => p.alive && ROLES[p.role].team !== "mafia");
      if (candidates.length > 0) {
        const victim = candidates[Math.floor(Math.random() * candidates.length)];
        updatedPlayers = updatedPlayers.map((p) => (p.id === victim.id ? { ...p, alive: false } : p));
        terroristBombVictimName = victim.name;
        log.push(`💣 테러리스트의 자폭으로 ${victim.name}님이 함께 목숨을 잃었습니다.`);
      }
    }
  } else if (shouldExecute && nominee.role === "politician") {
    politicianSaved = true;
    revealedRoles[nominee.id] = ROLES.politician.label; // 정치인 면역이 발동하면 직업이 영구 공개된다
    log.push(`🛡️ 과반수가 찬성했지만 정치인은 처형되지 않습니다.`);
  } else {
    log.push(`🗳️ ${nominee.name}님은 처형되지 않았습니다.`);
  }
  const winner = cultistStacks >= 4 ? "cultist" : checkWinner(updatedPlayers);
  return {
    ...state, players: updatedPlayers, phase: winner ? "gameover" : "voteresult", winner,
    lastEliminated, politicianSaved, cultistStacks, revealedRoles, terroristBombVictimName,
    curseTargetId, curseDeathDay,
    log: log.slice(-60), timerSeconds: winner ? 0 : 10, timerRunning: !winner,
  };
}

function resolveFinalVote(state) {
  const nominee = state.players.find((p) => p.id === state.nominee);
  const eligible = alivePlayers(state.players).filter((p) => p.id !== state.nominee && p.id !== state.blockedVoterId);
  let agree = 0, disagree = 0;
  eligible.forEach((p) => {
    const v = state.finalVotes[p.id];
    const weight = p.role === "politician" ? 2 : 1;
    if (v === "agree") agree += weight; else if (v === "disagree") disagree += weight;
  });
  const majorityAgree = agree > disagree && agree > 0;
  return applyExecutionOutcome(state, majorityAgree, `🗳️ 찬성 ${agree} : 반대 ${disagree}`);
}

/**
 * 판사가 살아있을 때(그리고 본인이 지목당하지 않았을 때), 공개 찬반투표 대신 판사 혼자
 * 처형 여부를 결정한다. 판사의 정체는 이 과정에서 절대 드러나지 않는다.
 */
function resolveJudgeVerdict(state) {
  const shouldExecute = state.judgeVerdict === "agree";
  return applyExecutionOutcome(state, shouldExecute, `🔨 판사가 판결을 내렸습니다.`);
}

/**
 * 치지직 채팅에서 들어온 메시지를 낮 채팅 피드로 중계한다.
 * 게임에 참여 중이고 현재 살아있는 플레이어의 메시지만, 토론/최후변론 시간에만 반영한다.
 */
export function relayDayChat(state, senderChannelId, message) {
  const allowedNow =
    state.phase === "discussion" || (state.phase === "defense" && senderChannelId === state.nominee);
  if (!allowedNow) return state;
  if (senderChannelId === state.blockedChatterId) return state;
  const player = state.players.find((p) => p.id === senderChannelId);
  if (!player || !player.alive) return state;
  const text = String(message || "").slice(0, 300);
  if (!text.trim()) return state;
  const dayChat = [...(state.chats.day || []), { sender: player.name, text }].slice(-200);
  return { ...state, chats: { ...state.chats, day: dayChat } };
}

export function autoAdvance(state) {
  switch (state.phase) {
    case "reveal":
      // 15초가 지나면 아직 확인 버튼을 안 누른 사람이 있어도 강제로 밤으로 진행한다.
      // (전원이 먼저 누르면 REVEAL_ACK 쪽에서 그전에 즉시 넘어감)
      return {
        ...state, phase: "night", timerSeconds: 60, timerRunning: true,
        log: [...state.log, `🌒 ${state.dayNumber}일차 밤이 찾아왔습니다.`].slice(-60),
      };
    case "night": return resolveNight(state);
    case "morning": return { ...state, phase: "discussion", timerSeconds: 180, timerRunning: true, votes: {}, skipVotes: {}, chats: { ...state.chats, day: [] } };
    case "discussion": return { ...state, phase: "vote", timerSeconds: 15, timerRunning: true, votes: {}, skipVotes: {} };
    case "vote": return resolveNomination(state);
    case "judgetiebreak": {
      // 판사가 시간 안에 고르지 못하면 동점자 중 무작위로 정해진다 (마피아 내부 동표 처리와 같은 맥락).
      const picked = state.tiedNominees[Math.floor(Math.random() * state.tiedNominees.length)];
      const t = state.players.find((p) => p.id === picked);
      return {
        ...state, phase: "defense", nominee: picked, tiedNominees: [], defenseText: "", timerSeconds: 20, timerRunning: true,
        log: [...state.log, `🎲 판사가 시간 안에 결정하지 못해 무작위로 ${t?.name}님이 지목되었습니다.`].slice(-60),
      };
    }
    case "defense": {
      // 판사가 살아있고 본인이 이번 지목자가 아니라면, 공개 찬반투표 대신 판사 혼자 결정한다.
      const judge = state.players.find((p) => p.role === "judge" && p.alive && p.id !== state.nominee);
      if (judge) return { ...state, phase: "judgeverdict", timerSeconds: 15, timerRunning: true, judgeVerdict: null };
      return { ...state, phase: "finalvote", timerSeconds: 10, timerRunning: true, finalVotes: {} };
    }
    case "judgeverdict": return resolveJudgeVerdict({ ...state, judgeVerdict: state.judgeVerdict || "disagree" });
    case "finalvote": return resolveFinalVote(state);
    case "voteresult": {
      if (state.winner) return { ...state, phase: "gameover", timerRunning: false };
      return {
        ...state, phase: "night",
        mafiaVotes: {}, spyTarget: null, framerTarget: null, blockerTarget: null, silencerTarget: null,
        policeTarget: null, doctorTarget: null, soldierTarget: null, reporterTarget: null, detectiveTarget: null,
        cultistTarget: null, vampireTarget: null, witchTarget: null, undertakerTarget: null,
        avengerTarget: null, avengerActorId: null, avengerKillResult: null,
        soloJobGrantedPlayerId: null, soloJobGrantedLabel: null,
        policeResult: null, spyResult: null, detectiveResult: null, reporterReveal: null, doctorResult: null, undertakerResult: null,
        veteranSurvivedName: null, vampireFightResult: null, terroristBombVictimName: null,
        curseVictimName: null, curseCastName: null, veteranSpyAlert: {},
        blockedVoterId: null, blockedChatterId: null, blockedAbilityId: null,
        nominee: null, defenseText: "", votes: {}, finalVotes: {}, tiedNominees: [], judgeVerdict: null,
        timerSeconds: 60, timerRunning: true,
        log: [...state.log, `🌒 ${state.dayNumber}일차 밤이 찾아왔습니다.`].slice(-60),
      };
    }
    default: return { ...state, timerRunning: false };
  }
}

/**
 * applyAction: 클라이언트에서 온 개별 플레이어 행동을 상태에 반영합니다.
 * playerId는 소켓 인증에서 검증된 값만 들어오므로, 여기서는 "그 행동을 할 자격이 있는지"만 확인합니다.
 */
export function applyAction(state, action, playerId) {
  const player = state.players.find((p) => p.id === playerId);

  switch (action.type) {
    case "REVEAL_ACK": {
      if (!player) return state;
      const revealAckIds = state.revealAckIds.includes(playerId)
        ? state.revealAckIds
        : [...state.revealAckIds, playerId];
      if (revealAckIds.length >= state.players.length) {
        return { ...state, phase: "night", revealAckIds, timerSeconds: 60, timerRunning: true,
          log: [...state.log, `🌒 ${state.dayNumber}일차 밤이 찾아왔습니다.`].slice(-60) };
      }
      return { ...state, revealAckIds };
    }

    case "SET_NIGHT_TARGET": {
      if (state.phase !== "night" || !player || !player.alive) return state;
      if (action.role === "avenger") {
        // 복수자는 정식 직업이 아니라 상태라서, 본인 role이 아니라 isAvenger 여부로 검증한다.
        if (!player.isAvenger || player.avengerUsed) return state;
      } else if (player.role !== action.role) {
        return state; // 본인 직업이 아니면 무시
      }
      if (action.role === "reporter" && (state.dayNumber < 2 || state.reporterUsed)) return state;
      if (action.role === "vampire" && !(state.dayNumber >= 3 && state.dayNumber % 2 === 1)) return state;
      if (action.role === "witch" && state.witchUsed) return state;
      if (action.role === "blocker" && action.targetId && action.targetId === state.blockerPrevTarget) return state;
      if (action.role === "silencer" && action.targetId && action.targetId === state.silencerPrevTarget) return state;
      if (action.targetId) {
        const targetPlayer = state.players.find((p) => p.id === action.targetId);
        if (!targetPlayer) return state;
        // 장의사는 죽은 사람만, 그 외 모든 능력은 살아있는 사람만 대상으로 할 수 있다.
        if (action.role === "undertaker" ? targetPlayer.alive : !targetPlayer.alive) return state;
      }
      if (action.role === "mafia") {
        return { ...state, mafiaVotes: { ...state.mafiaVotes, [playerId]: action.targetId } };
      }
      if (action.role === "avenger") {
        return { ...state, avengerTarget: action.targetId, avengerActorId: playerId };
      }
      return { ...state, [ROLE_TARGET_KEY[action.role]]: action.targetId };
    }

    case "CAST_VOTE": {
      if (state.phase !== "vote" || !player || !player.alive) return state;
      if (playerId === state.blockedVoterId) return state;
      return { ...state, votes: { ...state.votes, [playerId]: action.targetId } };
    }

    case "CAST_SKIP_VOTE": {
      if (state.phase !== "discussion" || !player || !player.alive) return state;
      const nextSkipVotes = { ...state.skipVotes };
      if (nextSkipVotes[playerId]) delete nextSkipVotes[playerId];
      else nextSkipVotes[playerId] = true;
      const aliveCount = alivePlayers(state.players).length;
      const skipCount = Object.keys(nextSkipVotes).length;
      // 살아있는 플레이어의 70% 이상이 스킵에 찬성하면 토론을 즉시 강제 종료한다.
      if (aliveCount > 0 && skipCount / aliveCount >= 0.7) {
        return autoAdvance({ ...state, skipVotes: nextSkipVotes });
      }
      return { ...state, skipVotes: nextSkipVotes };
    }

    case "CAST_JUDGE_TIEBREAK": {
      if (state.phase !== "judgetiebreak" || !player || !player.alive || player.role !== "judge") return state;
      if (!state.tiedNominees.includes(action.targetId)) return state;
      return { ...state, nominee: action.targetId, tiedNominees: [], phase: "defense", defenseText: "", timerSeconds: 20, timerRunning: true };
    }

    case "CAST_JUDGE_VERDICT": {
      if (state.phase !== "judgeverdict" || !player || !player.alive || player.role !== "judge") return state;
      if (action.choice !== "agree" && action.choice !== "disagree") return state;
      return resolveJudgeVerdict({ ...state, judgeVerdict: action.choice });
    }

    case "SET_DEFENSE_TEXT": {
      if (state.phase !== "defense" || !player || player.id !== state.nominee) return state;
      return { ...state, defenseText: action.text.slice(0, 500) };
    }

    case "CAST_FINAL_VOTE": {
      if (state.phase !== "finalvote" || !player || !player.alive) return state;
      if (playerId === state.nominee || playerId === state.blockedVoterId) return state;
      return { ...state, finalVotes: { ...state.finalVotes, [playerId]: action.choice } };
    }

    case "CHAT_SEND": {
      if (!player) return state;
      const channel = action.channel;
      const allowed =
        (channel === "mafia" && player.alive && ROLES[player.role].team === "mafia") ||
        (channel === "lover" && player.alive && (player.role === "lover" || player.role === "newlywed") && player.partnerId && !player.isThrall) ||
        (channel === "vampire" && player.alive && (player.role === "vampire" || player.isThrall)) ||
        (channel === "medium" && (player.role === "medium" || (!player.alive && !player.soulHarvested))) ||
        (channel === "day" && player.alive && playerId !== state.blockedChatterId &&
          (state.phase === "discussion" || (state.phase === "defense" && playerId === state.nominee)));
      if (!allowed) return state;
      const text = String(action.text || "").slice(0, 300);
      if (!text.trim()) return state;
      if (channel === "lover") {
        // 연인/신혼부부 채팅은 쌍(pair)별로 격리된다 - 다른 커플에게 새지 않도록.
        const key = [player.id, player.partnerId].sort().join("|");
        const nextPair = [...(state.chats.lover[key] || []), { sender: player.name, text }].slice(-200);
        return { ...state, chats: { ...state.chats, lover: { ...state.chats.lover, [key]: nextPair } } };
      }
      const nextChannel = [...state.chats[channel], { sender: player.name, text }].slice(-200);
      return {
        ...state,
        chats: { ...state.chats, [channel]: nextChannel },
      };
    }

    default:
      return state;
  }
}
