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
  framer: { label: "부패경찰", team: "mafia", emoji: "👮",
    desc: "밤마다 한 명을 지목합니다. 조사 기록을 조작해, 그 사람이 이번 밤 경찰·스파이·기자의 조사를 받으면 결과가 마피아로 둔갑합니다." },
  blocker: { label: "마담", team: "mafia", emoji: "💋",
    desc: "밤마다 한 명을 유혹해 밤을 함께 보냅니다. 유혹당한 사람은 이번 밤 자신의 능력을 사용하지 못합니다." },
  silencer: { label: "유괴범", team: "mafia", emoji: "⛓️",
    desc: "밤마다 한 명을 납치합니다. 납치당한 사람은 다음날 낮 채팅에 전혀 참여할 수 없습니다." },
  terrorist: { label: "테러리스트", team: "mafia", emoji: "💣",
    desc: "투표로 처형되면, 마피아팀을 제외한 무작위 플레이어 한 명과 함께 자폭합니다. 그 플레이어의 직업은 공개되지 않습니다." },
  witch: { label: "마녀", team: "mafia", emoji: "🔮",
    desc: "게임당 단 한 번, 밤에 플레이어 한 명에게 죽음의 저주를 겁니다. 저주에 걸리면 그날 밤 목숨을 잃습니다. 마피아의 습격과는 완전히 별개로 발동됩니다." },
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
  lover: { label: "연인", team: "citizen", emoji: "💞",
    desc: "연인끼리 밤마다 채팅할 수 있습니다. 한쪽이 마피아에게 살해당하면 그 대신 상대 연인이 사망합니다." },
  politician: { label: "정치인", team: "citizen", emoji: "🎩",
    desc: "투표로는 절대 처형되지 않으며, 투표할 때 표를 두 번 행사합니다." },
  detective: { label: "탐정", team: "citizen", emoji: "🧭",
    desc: "밤마다 한 명을 지목해, 그 사람이 이번 밤 능력을 썼다면 누구를 대상으로 했는지 알 수 있습니다." },
  citizen: { label: "시민", team: "citizen", emoji: "🌾",
    desc: "특별한 능력은 없습니다. 낮의 토론과 투표로 마피아를 찾아내야 합니다." },
  veteran: { label: "군인", team: "citizen", emoji: "🪖",
    desc: "단 한 번, 마피아의 공격을 막아내고 살아남을 수 있습니다. 성공하면 모두에게 공개적으로 알려집니다." },
  cultist: { label: "악마 숭배자", team: "neutral", emoji: "😈",
    desc: "밤마다 한 명을 지목합니다. 그 사람이 다음날 투표로 처형되면 영혼을 하나 수확합니다. 영혼 6개를 모으면 승리합니다." },
  vampire: { label: "뱀파이어", team: "neutral", emoji: "🧛",
    desc: "1일차를 제외한 홀수일차 밤마다 한 명을 물어 흡혈귀로 만듭니다. 흡혈귀 팀 수가 마피아+시민팀 합보다 많아지면 승리합니다." },
};

export const NEUTRAL_ROLES = ["cultist", "vampire"];

export const MAFIA_SPECIAL_ROLES = ["spy", "framer", "blocker", "silencer", "terrorist", "witch"];
export const CITIZEN_SPECIAL_ROLES = ["police", "doctor", "reporter", "medium", "soldier", "lover", "politician", "detective", "veteran"];

export const NIGHT_ABILITY_ROLES = [
  "mafia", "spy", "framer", "blocker", "silencer", "police", "doctor", "soldier", "reporter", "detective",
  "cultist", "vampire", "witch",
];
export const ROLE_TARGET_KEY = {
  mafia: "mafiaTarget", spy: "spyTarget", framer: "framerTarget", blocker: "blockerTarget", silencer: "silencerTarget",
  police: "policeTarget", doctor: "doctorTarget", soldier: "soldierTarget", reporter: "reporterTarget", detective: "detectiveTarget",
  cultist: "cultistTarget", vampire: "vampireTarget", witch: "witchTarget",
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
  const mafiaRoleAlive = alive.filter((p) => p.role === "mafia" && !p.isThrall).length;
  const mafiaTeamAlive = alive.filter((p) => ROLES[p.role].team === "mafia" && !p.isThrall).length;
  const citizenTeamAlive = alive.filter((p) => ROLES[p.role].team === "citizen" && !p.isThrall).length;

  // 뱀파이어 팀 수가 마피아+시민팀 합보다 많아지면 즉시 승리 (다른 조건보다 우선)
  if (vampireTeamAlive > 0 && vampireTeamAlive > mafiaTeamAlive + citizenTeamAlive) return "vampire";
  // 스파이/모함꾼/방해꾼/입막음꾼은 마피아 팀이지만 '마피아' 역할 자체는 아니므로,
  // 마피아 역할이 전멸하면 이들이 살아있어도 시민팀 승리로 처리한다.
  if (mafiaRoleAlive === 0) return "citizen";
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
  const remainingCitizenBudget = Math.max(0, balance.citizenSpecials - FORCED_CITIZEN_ROLES.length);
  const chosenOptionalCitizenSpecials = pickRandomRolesWithinBudget(optionalCitizenPoolRoles, remainingCitizenBudget, { lover: 2 });
  const chosenCitizenSpecials = [...FORCED_CITIZEN_ROLES, ...chosenOptionalCitizenSpecials];

  const citizenTeamTotal = Math.max(0, n - balance.mafiaTeam);
  const usedCitizenSlots = chosenCitizenSpecials.reduce((sum, r) => sum + (r === "lover" ? 2 : 1), 0);

  // 중립 직업: 일반 시민 한 자리를 대신해서 매 게임 정확히 1명 등장한다.
  const neutralPoolRoles = NEUTRAL_ROLES.filter((r) => config.neutralPool?.[r]);
  const chosenNeutral = neutralPoolRoles.length > 0 ? [shuffle(neutralPoolRoles)[0]] : [];

  const plainCitizenCount = Math.max(0, citizenTeamTotal - usedCitizenSlots - chosenNeutral.length);

  let bag = [];
  bag.push(...Array(plainMafiaCount).fill("mafia"));
  bag.push(...chosenMafiaSpecials);
  chosenCitizenSpecials.forEach((r) => (r === "lover" ? bag.push("lover", "lover") : bag.push(r)));
  bag.push(...chosenNeutral);
  bag.push(...Array(plainCitizenCount).fill("citizen"));
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
  }));
  const lovers = players.filter((p) => p.role === "lover");
  if (lovers.length === 2) { lovers[0].partnerId = lovers[1].id; lovers[1].partnerId = lovers[0].id; }
  return players;
}

export function createGameState(players) {
  return {
    phase: "reveal",
    players,
    dayNumber: 1,
    mafiaVotes: {}, spyTarget: null, framerTarget: null, blockerTarget: null, silencerTarget: null,
    policeTarget: null, doctorTarget: null, soldierTarget: null, reporterTarget: null, detectiveTarget: null,
    cultistTarget: null, vampireTarget: null, witchTarget: null,
    reporterUsed: false, witchUsed: false,
    policeResult: null, spyResult: null, detectiveResult: null, reporterReveal: null, doctorResult: null,
    lastNightDeath: null, nightSaveHappened: false, curseVictimName: null,
    blockedVoterId: null, blockedChatterId: null, blockedAbilityId: null,
    veteranSurvivedName: null, vampireFightResult: null, terroristBombVictimName: null,
    veteranSpyAlert: {}, // { [veteranPlayerId]: spyName } - 그 밤에 스파이에게 조사당한 군인에게만 공개
    cultistStacks: 0,
    revealedRoles: {}, // { [playerId]: roleLabel } - 한 번 공개되면 게임이 끝날 때까지 유지
    votes: {}, nominee: null, defenseText: "", finalVotes: {}, skipVotes: {},
    lastEliminated: null, politicianSaved: false,
    chats: { mafia: [], lover: [], medium: [], day: [], vampire: [] },
    log: ["🌙 밤이 시작되기 전, 각자 자신의 직업을 확인합니다."],
    revealAckIds: [],
    winner: null,
    timerSeconds: 0, timerRunning: false,
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
    cultistTarget, vampireTarget, witchTarget, dayNumber, reporterUsed, witchUsed } = state;

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
  let curseVictimName = null;
  let newWitchUsed = witchUsed;
  let policeResult = null, spyResult = null, detectiveResult = null, reporterReveal = null, doctorResult = null;
  let newReporterUsed = reporterUsed;
  const veteranSpyAlert = {};
  let revealedRoles = { ...(state.revealedRoles || {}) };

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
      { role: "witch", targetId: effectiveWitchTarget },
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

  // ── 마녀의 저주: 게임당 단 한 번, 마피아의 습격과 완전히 별개로 즉시 발동 (의사 보호로 막을 수 없음) ──
  if (effectiveWitchTarget && !witchUsed) {
    const cursed = updatedPlayers.find((p) => p.id === effectiveWitchTarget);
    if (cursed && cursed.alive) {
      updatedPlayers = updatedPlayers.map((p) => (p.id === cursed.id ? { ...p, alive: false } : p));
      curseVictimName = cursed.name;
      newWitchUsed = true;
      log.push(`🔮 ${cursed.name}님이 마녀의 저주를 받아 목숨을 잃었습니다.`);
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
          if (target.role === "lover" && p.id === target.partnerId) return { ...p, isThrall: true };
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
      if (victim && victim.role === "lover" && victim.partnerId) {
        const partner = updatedPlayers.find((p) => p.id === victim.partnerId);
        if (partner && partner.alive) victim = partner;
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

  const winner = checkWinner(updatedPlayers);
  return {
    ...state, players: updatedPlayers,
    phase: winner ? "gameover" : "morning", winner,
    lastNightDeath, nightSaveHappened, policeResult, spyResult, detectiveResult, reporterReveal, doctorResult,
    veteranSurvivedName, vampireFightResult, curseVictimName, veteranSpyAlert, revealedRoles,
    cultistTarget: effectiveCultistTarget, // 투표 시점에 다시 대조해야 하므로 막히지 않은 값만 남겨둔다
    reporterUsed: newReporterUsed, witchUsed: newWitchUsed,
    blockedVoterId: effectiveSoldierTarget || null,
    blockedChatterId: effectiveSilencerTarget || null,
    blockedAbilityId: blockerTarget || null,
    timerSeconds: winner ? 0 : 12, timerRunning: !winner,
    log,
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
  if (max <= 0 || leaders.length > 1) {
    log.push(`🗳️ 표가 갈려 아무도 지목되지 않았습니다.`);
    return { ...state, phase: "voteresult", lastEliminated: null, politicianSaved: false, nominee: null, log, timerSeconds: 10, timerRunning: true };
  }
  const nominee = state.players.find((p) => p.id === leaders[0]);
  log.push(`⚖️ ${nominee.name}님이 최다 득표로 지목되어 최후 변론을 시작합니다.`);
  return { ...state, phase: "defense", nominee: nominee.id, defenseText: "", log, timerSeconds: 45, timerRunning: true };
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
  let log = [...state.log];
  let updatedPlayers = state.players;
  let lastEliminated = null;
  let politicianSaved = false;
  let cultistStacks = state.cultistStacks || 0;
  let revealedRoles = { ...(state.revealedRoles || {}) };
  let terroristBombVictimName = null;
  const majorityAgree = agree > disagree && agree > 0;
  if (majorityAgree && nominee.role !== "politician") {
    // 악마 숭배자가 밤에 지목했던 대상이 오늘 처형되면 영혼을 하나 수확한다.
    const soulHarvested = !!state.cultistTarget && state.cultistTarget === nominee.id;
    if (soulHarvested) cultistStacks += 1;
    updatedPlayers = state.players.map((p) => (p.id === nominee.id ? { ...p, alive: false, soulHarvested, executedByVote: true } : p));
    lastEliminated = nominee.id;
    log.push(`⚖️ 찬성 ${agree} : 반대 ${disagree} — ${nominee.name}님이 마을에서 처형되었습니다.`);

    // 테러리스트의 자폭 - 마피아팀을 제외한 생존자 중 무작위 한 명을 함께 데려간다. 직업은 공개되지 않는다.
    if (nominee.role === "terrorist") {
      const candidates = updatedPlayers.filter((p) => p.alive && ROLES[p.role].team !== "mafia");
      if (candidates.length > 0) {
        const victim = candidates[Math.floor(Math.random() * candidates.length)];
        updatedPlayers = updatedPlayers.map((p) => (p.id === victim.id ? { ...p, alive: false } : p));
        terroristBombVictimName = victim.name;
        log.push(`💣 테러리스트의 자폭으로 ${victim.name}님이 함께 목숨을 잃었습니다.`);
      }
    }
  } else if (majorityAgree && nominee.role === "politician") {
    politicianSaved = true;
    revealedRoles[nominee.id] = ROLES.politician.label; // 정치인 면역이 발동하면 직업이 영구 공개된다
    log.push(`🛡️ 찬성 ${agree} : 반대 ${disagree} — 과반수가 찬성했지만 정치인은 투표로 처형되지 않습니다.`);
  } else {
    log.push(`🗳️ 찬성 ${agree} : 반대 ${disagree} — 과반수 찬성에 미치지 못해 아무도 처형되지 않았습니다.`);
  }
  const winner = cultistStacks >= 6 ? "cultist" : checkWinner(updatedPlayers);
  return {
    ...state, players: updatedPlayers, phase: winner ? "gameover" : "voteresult", winner,
    lastEliminated, politicianSaved, cultistStacks, revealedRoles, terroristBombVictimName,
    log, timerSeconds: winner ? 0 : 10, timerRunning: !winner,
  };
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
    case "night": return resolveNight(state);
    case "morning": return { ...state, phase: "discussion", timerSeconds: 120, timerRunning: true, votes: {}, skipVotes: {}, chats: { ...state.chats, day: [] } };
    case "discussion": return { ...state, phase: "vote", timerSeconds: 40, timerRunning: true, votes: {}, skipVotes: {} };
    case "vote": return resolveNomination(state);
    case "defense": return { ...state, phase: "finalvote", timerSeconds: 15, timerRunning: true, finalVotes: {} };
    case "finalvote": return resolveFinalVote(state);
    case "voteresult": {
      if (state.winner) return { ...state, phase: "gameover", timerRunning: false };
      return {
        ...state, phase: "night", dayNumber: state.dayNumber + 1,
        mafiaVotes: {}, spyTarget: null, framerTarget: null, blockerTarget: null, silencerTarget: null,
        policeTarget: null, doctorTarget: null, soldierTarget: null, reporterTarget: null, detectiveTarget: null,
        cultistTarget: null, vampireTarget: null, witchTarget: null,
        policeResult: null, spyResult: null, detectiveResult: null, reporterReveal: null, doctorResult: null,
        veteranSurvivedName: null, vampireFightResult: null, terroristBombVictimName: null, curseVictimName: null, veteranSpyAlert: {},
        blockedVoterId: null, blockedChatterId: null, blockedAbilityId: null,
        nominee: null, defenseText: "", votes: {}, finalVotes: {},
        timerSeconds: 60, timerRunning: true,
        log: [...state.log, `🌒 ${state.dayNumber + 1}일차 밤이 찾아왔습니다.`],
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
          log: [...state.log, `🌒 ${state.dayNumber}일차 밤이 찾아왔습니다.`] };
      }
      return { ...state, revealAckIds };
    }

    case "SET_NIGHT_TARGET": {
      if (state.phase !== "night" || !player || !player.alive) return state;
      if (player.role !== action.role) return state; // 본인 직업이 아니면 무시
      if (action.role === "reporter" && (state.dayNumber < 2 || state.reporterUsed)) return state;
      if (action.role === "vampire" && !(state.dayNumber >= 3 && state.dayNumber % 2 === 1)) return state;
      if (action.role === "witch" && state.witchUsed) return state;
      if (action.role === "mafia") {
        return { ...state, mafiaVotes: { ...state.mafiaVotes, [playerId]: action.targetId } };
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
        (channel === "mafia" && player.alive && (player.role === "mafia" || player.role === "spy" || player.role === "framer" || player.role === "blocker" || player.role === "silencer")) ||
        (channel === "lover" && player.alive && player.role === "lover" && player.partnerId && !player.isThrall) ||
        (channel === "vampire" && player.alive && (player.role === "vampire" || player.isThrall)) ||
        (channel === "medium" && (player.role === "medium" || (!player.alive && !player.soulHarvested))) ||
        (channel === "day" && player.alive && playerId !== state.blockedChatterId &&
          (state.phase === "discussion" || (state.phase === "defense" && playerId === state.nominee)));
      if (!allowed) return state;
      const text = String(action.text || "").slice(0, 300);
      if (!text.trim()) return state;
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
