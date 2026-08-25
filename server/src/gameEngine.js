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
};

export const NIGHT_ABILITY_ROLES = ["mafia", "spy", "police", "doctor", "soldier", "reporter", "detective"];
export const ROLE_TARGET_KEY = {
  mafia: "mafiaTarget", spy: "spyTarget", police: "policeTarget", doctor: "doctorTarget",
  soldier: "soldierTarget", reporter: "reporterTarget", detective: "detectiveTarget",
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function getMafiaCount(n) {
  if (n < 8) return 1;
  if (n < 12) return 2;
  if (n < 20) return 3;
  return 4;
}
export function alivePlayers(players) { return players.filter((p) => p.alive); }
export function checkWinner(players) {
  const alive = alivePlayers(players);
  const mafiaRoleAlive = alive.filter((p) => p.role === "mafia").length;
  const mafiaTeamAlive = alive.filter((p) => ROLES[p.role].team === "mafia").length;
  const citizenAlive = alive.length - mafiaTeamAlive;
  // 스파이는 마피아 팀이지만 '마피아' 역할 자체는 아니므로, 마피아 역할이 전멸하면
  // 스파이가 살아있어도 시민팀 승리로 처리한다.
  if (mafiaRoleAlive === 0) return "citizen";
  if (mafiaTeamAlive >= citizenAlive) return "mafia";
  return null;
}
export function requiredSlots(config) {
  return (
    config.mafiaCount + (config.spy ? 1 : 0) +
    (config.police ? 1 : 0) + (config.doctor ? 1 : 0) + (config.reporter ? 1 : 0) +
    (config.medium ? 1 : 0) + (config.soldier ? 1 : 0) + (config.politician ? 1 : 0) +
    (config.detective ? 1 : 0) + (config.lover ? 2 : 0)
  );
}

/**
 * queueUsers: [{ channelId, nickname, profileImageUrl }]
 */
export function assignRoles(queueUsers, config) {
  const n = queueUsers.length;
  let bag = [];
  bag.push(...Array(Math.max(0, config.mafiaCount)).fill("mafia"));
  if (config.spy) bag.push("spy"); // 스파이는 마피아 수와 별개로 추가되는 슬롯
  if (config.police) bag.push("police");
  if (config.doctor) bag.push("doctor");
  if (config.reporter) bag.push("reporter");
  if (config.medium) bag.push("medium");
  if (config.soldier) bag.push("soldier");
  if (config.politician) bag.push("politician");
  if (config.detective) bag.push("detective");
  if (config.lover) bag.push("lover", "lover");
  while (bag.length < n) bag.push("citizen");
  bag = shuffle(bag).slice(0, n);

  const players = queueUsers.map((u, i) => ({
    id: u.channelId,
    name: u.nickname,
    profileImageUrl: u.profileImageUrl || null,
    role: bag[i],
    alive: true,
    partnerId: null,
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
    mafiaVotes: {}, spyTarget: null, policeTarget: null, doctorTarget: null,
    soldierTarget: null, reporterTarget: null, detectiveTarget: null,
    reporterUsed: false,
    policeResult: null, spyResult: null, detectiveResult: null, reporterReveal: null, doctorResult: null,
    lastNightDeath: null, nightSaveHappened: false,
    blockedVoterId: null,
    votes: {}, nominee: null, defenseText: "", finalVotes: {},
    lastEliminated: null, politicianSaved: false,
    chats: { mafia: [], lover: [], medium: [], day: [] },
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
  const { players, spyTarget, policeTarget, doctorTarget, soldierTarget, reporterTarget, dayNumber, reporterUsed } = state;
  const { targetId: mafiaTarget, tied: mafiaVoteTied } = resolveMafiaTarget(state);
  let log = [...state.log];
  let updatedPlayers = players;
  let lastNightDeath = null;
  let nightSaveHappened = false;
  let policeResult = null, spyResult = null, detectiveResult = null, reporterReveal = null, doctorResult = null;
  let newReporterUsed = reporterUsed;

  if (doctorTarget) {
    const t = players.find((p) => p.id === doctorTarget);
    if (t) doctorResult = { targetName: t.name, saved: !!(mafiaTarget && mafiaTarget === doctorTarget) };
  }
  if (policeTarget) {
    const t = players.find((p) => p.id === policeTarget);
    if (t) policeResult = { targetName: t.name, isMafia: ROLES[t.role].team === "mafia" };
  }
  if (spyTarget) {
    const t = players.find((p) => p.id === spyTarget);
    if (t) spyResult = { targetName: t.name, roleLabel: ROLES[t.role].label };
  }
  if (state.detectiveTarget) {
    const t = players.find((p) => p.id === state.detectiveTarget);
    const actionMap = [
      { role: "mafia", targetId: mafiaTarget }, { role: "spy", targetId: spyTarget },
      { role: "police", targetId: policeTarget }, { role: "doctor", targetId: doctorTarget },
      { role: "soldier", targetId: soldierTarget }, { role: "reporter", targetId: reporterTarget },
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
  if (reporterTarget && !reporterUsed && dayNumber >= 2) {
    const t = players.find((p) => p.id === reporterTarget);
    if (t) { reporterReveal = { name: t.name, roleLabel: ROLES[t.role].label }; newReporterUsed = true; }
  }

  if (mafiaTarget) {
    if (mafiaVoteTied) log.push(`🎲 마피아팀의 표가 갈려, 대상이 무작위로 정해졌습니다.`);
    const negated = doctorTarget && doctorTarget === mafiaTarget;
    if (!negated) {
      let victim = players.find((p) => p.id === mafiaTarget);
      if (victim && victim.role === "lover" && victim.partnerId) {
        const partner = players.find((p) => p.id === victim.partnerId);
        if (partner && partner.alive) victim = partner;
      }
      if (victim && victim.alive) {
        updatedPlayers = updatedPlayers.map((p) => (p.id === victim.id ? { ...p, alive: false } : p));
        lastNightDeath = victim.id;
        log.push(`☠️ 밤 사이, ${victim.name}님이 목숨을 잃었습니다.`);
      }
    } else {
      nightSaveHappened = true;
      log.push(`🩺 의사의 보호 덕분에 이번 밤은 아무도 목숨을 잃지 않았습니다.`);
    }
  } else {
    log.push(`🌤️ 이번 밤은 특별한 일이 일어나지 않았습니다.`);
  }
  if (reporterReveal) log.push(`📰 기자의 취재: ${reporterReveal.name}님의 직업은 [${reporterReveal.roleLabel}]입니다.`);

  const winner = checkWinner(updatedPlayers);
  return {
    ...state, players: updatedPlayers,
    phase: winner ? "gameover" : "morning", winner,
    lastNightDeath, nightSaveHappened, policeResult, spyResult, detectiveResult, reporterReveal, doctorResult,
    reporterUsed: newReporterUsed, blockedVoterId: soldierTarget || null,
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
  const majorityAgree = agree > disagree && agree > 0;
  if (majorityAgree && nominee.role !== "politician") {
    updatedPlayers = state.players.map((p) => (p.id === nominee.id ? { ...p, alive: false } : p));
    lastEliminated = nominee.id;
    log.push(`⚖️ 찬성 ${agree} : 반대 ${disagree} — ${nominee.name}님이 마을에서 처형되었습니다. (직업: ${ROLES[nominee.role].label})`);
  } else if (majorityAgree && nominee.role === "politician") {
    politicianSaved = true;
    log.push(`🛡️ 찬성 ${agree} : 반대 ${disagree} — 과반수가 찬성했지만 정치인은 투표로 처형되지 않습니다.`);
  } else {
    log.push(`🗳️ 찬성 ${agree} : 반대 ${disagree} — 과반수 찬성에 미치지 못해 아무도 처형되지 않았습니다.`);
  }
  const winner = checkWinner(updatedPlayers);
  return {
    ...state, players: updatedPlayers, phase: winner ? "gameover" : "voteresult", winner,
    lastEliminated, politicianSaved, log, timerSeconds: winner ? 0 : 10, timerRunning: !winner,
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
    case "morning": return { ...state, phase: "discussion", timerSeconds: 120, timerRunning: true, votes: {}, chats: { ...state.chats, day: [] } };
    case "discussion": return { ...state, phase: "vote", timerSeconds: 40, timerRunning: true, votes: {} };
    case "vote": return resolveNomination(state);
    case "defense": return { ...state, phase: "finalvote", timerSeconds: 30, timerRunning: true, finalVotes: {} };
    case "finalvote": return resolveFinalVote(state);
    case "voteresult": {
      if (state.winner) return { ...state, phase: "gameover", timerRunning: false };
      return {
        ...state, phase: "night", dayNumber: state.dayNumber + 1,
        mafiaVotes: {}, spyTarget: null, policeTarget: null, doctorTarget: null,
        soldierTarget: null, reporterTarget: null, detectiveTarget: null,
        policeResult: null, spyResult: null, detectiveResult: null, reporterReveal: null, doctorResult: null,
        blockedVoterId: null, nominee: null, defenseText: "", votes: {}, finalVotes: {},
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
        (channel === "mafia" && player.alive && (player.role === "mafia" || player.role === "spy")) ||
        (channel === "lover" && player.alive && player.role === "lover" && player.partnerId) ||
        (channel === "medium" && (player.role === "medium" || !player.alive)) ||
        (channel === "day" && player.alive &&
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
