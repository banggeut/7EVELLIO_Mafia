import { ROLES, ROLE_TARGET_KEY, NIGHT_ABILITY_ROLES } from "./gameEngine.js";

function publicPlayer(p) {
  return {
    id: p.id,
    name: p.name,
    profileImageUrl: p.profileImageUrl,
    alive: p.alive,
  };
}

/**
 * 사망/처형된 플레이어를 다른 사람에게 어떻게 보여줄지 결정한다.
 * - 게임이 끝났을 때: 전체 직업이 공개된다.
 * - 게임 진행 중 죽었을 때: 정확한 직업이 아니라 "마피아(역할명 그대로)였는지 여부"만 공개된다.
 *   스파이는 마피아 팀이지만 '마피아' 역할 자체는 아니므로, 공개 시에는 "마피아가 아님"으로 표시된다.
 */
function revealFor(p, state, isSelf) {
  if (isSelf || state.phase === "gameover") {
    return { roleLabel: ROLES[p.role].label, isMafia: p.role === "mafia" };
  }
  if (!p.alive) {
    return { roleLabel: null, isMafia: p.role === "mafia" };
  }
  return { roleLabel: null, isMafia: null };
}

/**
 * 각 플레이어 소켓으로 보낼, 그 사람 시점에서만 허용된 정보로 걸러진 상태.
 */
export function redactForPlayer(state, playerId) {
  const me = state.players.find((p) => p.id === playerId) || null;

  const players = state.players.map((p) => ({
    ...publicPlayer(p),
    ...revealFor(p, state, p.id === playerId),
    isSelf: p.id === playerId,
  }));

  const base = {
    phase: state.phase,
    dayNumber: state.dayNumber,
    timerSeconds: state.timerSeconds,
    timerRunning: state.timerRunning,
    players,
    log: state.log,
    lastNightDeath: state.lastNightDeath,
    nightSaveHappened: state.nightSaveHappened,
    lastEliminated: state.lastEliminated,
    politicianSaved: state.politicianSaved,
    nominee: state.nominee,
    dayChat: state.chats.day || [],
    reporterReveal: state.reporterReveal,
    winner: state.winner,
    revealAckCount: state.revealAckIds ? state.revealAckIds.length : 0,
    revealTotal: state.players.length,
  };

  if (!me) return base;

  const myRole = me.role;
  const myAbility = NIGHT_ABILITY_ROLES.includes(myRole)
    ? { role: myRole, selectedTargetId: state[ROLE_TARGET_KEY[myRole]] || null }
    : null;

  const myPrivate = {
    myId: me.id,
    myRole,
    myRoleLabel: ROLES[myRole].label,
    myRoleDesc: ROLES[myRole].desc,
    myTeam: ROLES[myRole].team,
    myAlive: me.alive,
    myPartnerId: me.partnerId || null,
    iHaveRevealAcked: (state.revealAckIds || []).includes(me.id),
    myVoteTarget: state.votes ? state.votes[me.id] || null : null,
    myFinalVote: state.finalVotes ? state.finalVotes[me.id] || null : null,
    myAbility,
    myPoliceResult: myRole === "police" ? state.policeResult : null,
    mySpyResult: myRole === "spy" ? state.spyResult : null,
    myDetectiveResult: myRole === "detective" ? state.detectiveResult : null,
    myDoctorResult: myRole === "doctor" ? state.doctorResult : null,
    teammates:
      ROLES[myRole].team === "mafia"
        ? state.players.filter((p) => ROLES[p.role].team === "mafia" && p.id !== me.id).map((p) => ({ id: p.id, name: p.name }))
        : [],
    partnerName:
      myRole === "lover" && me.partnerId
        ? state.players.find((p) => p.id === me.partnerId)?.name || null
        : null,
    isBlockedVoter: state.blockedVoterId === me.id,
    chats: {
      mafia: myRole === "mafia" || myRole === "spy" ? state.chats.mafia : [],
      lover: myRole === "lover" && me.partnerId ? state.chats.lover : [],
      medium: myRole === "medium" || !me.alive ? state.chats.medium : [],
    },
  };

  return { ...base, ...myPrivate };
}

/**
 * 방송(OBS 브라우저 소스)용으로 보낼, 완전히 공개된 정보만 남긴 상태.
 * 정확한 직업, 능력 대상, 투표 내용은 절대 포함하지 않는다. (사망자의 마피아 여부는 공개 정보이므로 포함)
 */
export function redactForBroadcast(state) {
  const players = state.players.map((p) => ({
    ...publicPlayer(p),
    ...revealFor(p, state, false),
  }));
  return {
    phase: state.phase,
    dayNumber: state.dayNumber,
    timerSeconds: state.timerSeconds,
    timerRunning: state.timerRunning,
    players,
    lastNightDeath: state.lastNightDeath,
    nightSaveHappened: state.nightSaveHappened,
    lastEliminated: state.lastEliminated,
    politicianSaved: state.politicianSaved,
    nominee: state.nominee,
    dayChat: state.chats.day || [],
    reporterReveal: state.reporterReveal,
    winner: state.winner,
  };
}
