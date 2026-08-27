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
 * - 게임 진행 중 기자에게 공개됐다면: 그 직업(혹은 조작된 가짜 직업)이 계속 공개 상태로 유지된다.
 * - 투표로 처형됐을 때만: 정확한 직업이 아니라 "마피아팀이었는지 여부"가 공개된다.
 *   마피아팀 특수직업(해커·마담·유괴범·테러리스트·마녀)도 전부 "마피아팀이었습니다"로 표시되지만,
 *   스파이만은 마피아 팀 소속이라도 "마피아가 아니었습니다"로 표시된다 (경찰 조사 결과와 동일한 규칙).
 * - 마피아에게 살해당했거나 그 외의 방식으로 죽었을 때는 마피아 여부조차 공개되지 않는다.
 */
function isMafiaForReveal(p) {
  if (p.role === "spy") return false;
  return ROLES[p.role].team === "mafia";
}

function revealFor(p, state, isSelf) {
  if (isSelf || state.phase === "gameover") {
    return { roleLabel: ROLES[p.role].label, isMafia: isMafiaForReveal(p) };
  }
  if (state.revealedRoles && state.revealedRoles[p.id]) {
    return { roleLabel: state.revealedRoles[p.id], isMafia: isMafiaForReveal(p) };
  }
  if (!p.alive && p.executedByVote) {
    return { roleLabel: null, isMafia: isMafiaForReveal(p) };
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
    isThrall: p.id === playerId || state.phase === "gameover" ? !!p.isThrall : undefined,
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
    tiedNominees: state.tiedNominees || [],
    dayChat: state.chats.day || [],
    skipVoteCount: state.skipVotes ? Object.keys(state.skipVotes).length : 0,
    reporterReveal: state.reporterReveal,
    veteranSurvivedName: state.veteranSurvivedName,
    vampireFightResult: state.vampireFightResult,
    terroristBombVictimName: state.terroristBombVictimName,
    curseVictimName: state.curseVictimName,
    curseCastName: state.curseCastName,
    winner: state.winner,
    revealAckCount: state.revealAckIds ? state.revealAckIds.length : 0,
    revealTotal: state.players.length,
  };

  const myRole = me?.role || null;
  const myAbility = me && NIGHT_ABILITY_ROLES.includes(myRole)
    ? {
        role: myRole,
        selectedTargetId:
          myRole === "mafia" ? state.mafiaVotes?.[me.id] || null : state[ROLE_TARGET_KEY[myRole]] || null,
      }
    : null;

  const mafiaVoteTally = {};
  if (me && ROLES[myRole].team === "mafia") {
    Object.values(state.mafiaVotes || {}).forEach((targetId) => {
      if (!targetId) return;
      mafiaVoteTally[targetId] = (mafiaVoteTally[targetId] || 0) + 1;
    });
  }

  // me가 없을 수 있다 (예: 대기열에 직접 참여하지 않은 관리자가 자기 자신 시점으로 보는 경우).
  // 이 경우에도 화면 쪽 코드가 항상 존재한다고 가정하는 필드들(teammates, chats 등)은
  // undefined가 아니라 빈 값으로라도 반드시 내려줘야 클라이언트가 죽지 않는다.
  const myPrivate = {
    myId: me?.id || null,
    myRole,
    myRoleLabel: me ? ROLES[myRole].label : null,
    myRoleDesc: me ? ROLES[myRole].desc : null,
    myTeam: me ? ROLES[myRole].team : null,
    myAlive: me ? me.alive : false,
    myIsThrall: !!me?.isThrall,
    myUsedDefense: !!me?.usedDefense,
    myPartnerId: me?.partnerId || null,
    iHaveRevealAcked: me ? (state.revealAckIds || []).includes(me.id) : false,
    myVoteTarget: me && state.votes ? state.votes[me.id] || null : null,
    myFinalVote: me && state.finalVotes ? state.finalVotes[me.id] || null : null,
    myAbility,
    mafiaVoteTally,
    myPoliceResult: myRole === "police" ? state.policeResult : null,
    mySpyResult: myRole === "spy" ? state.spyResult : null,
    myDetectiveResult: myRole === "detective" ? state.detectiveResult : null,
    myDoctorResult: myRole === "doctor" ? state.doctorResult : null,
    myUndertakerResult: myRole === "undertaker" ? state.undertakerResult : null,
    myUndertakerFindings: myRole === "undertaker" ? state.undertakerFindings || {} : null,
    myCultistStacks: myRole === "cultist" ? state.cultistStacks || 0 : null,
    mySpyCaughtByName: myRole === "veteran" ? state.veteranSpyAlert?.[me.id] || null : null,
    myWitchUsed: myRole === "witch" ? !!state.witchUsed : null,
    myBlockerPrevTarget: myRole === "blocker" ? state.blockerPrevTarget : null,
    teammates:
      me && ROLES[myRole].team === "mafia"
        ? state.players.filter((p) => ROLES[p.role].team === "mafia" && p.id !== me.id).map((p) => ({ id: p.id, name: p.name, roleLabel: ROLES[p.role].label }))
        : [],
    partnerName:
      me && myRole === "lover" && me.partnerId
        ? state.players.find((p) => p.id === me.partnerId)?.name || null
        : null,
    isBlockedVoter: !!me && state.blockedVoterId === me.id,
    mySkippedVote: !!(me && state.skipVotes && state.skipVotes[me.id]),
    isBlockedChatter: !!me && state.blockedChatterId === me.id,
    myAbilityWasBlocked: !!me && state.blockedAbilityId === me.id,
    // 죽으면 마피아/연인 채팅은 더 이상 볼 수도, 칠 수도 없다. 영매 채팅만 예외 -
    // 단, 악마 숭배자에게 영혼을 수확당한 사람은 영매 채팅조차 볼 수 없다 (영혼이 이미 소환에 쓰였기 때문).
    chats: {
      mafia: me && me.alive && ROLES[myRole].team === "mafia" ? state.chats.mafia : [],
      lover: me && me.alive && myRole === "lover" && me.partnerId && !me.isThrall ? state.chats.lover : [],
      vampire: me && me.alive && (myRole === "vampire" || me.isThrall) ? state.chats.vampire : [],
      medium: me && (myRole === "medium" || (!me.alive && !me.soulHarvested)) ? state.chats.medium : [],
    },
    chatParticipants: {
      mafia:
        me && me.alive && ROLES[myRole].team === "mafia"
          ? state.players.filter((p) => ROLES[p.role].team === "mafia" && p.alive).map((p) => p.name)
          : [],
      lover:
        me && me.alive && myRole === "lover" && me.partnerId && !me.isThrall
          ? [me.name, state.players.find((p) => p.id === me.partnerId)?.name].filter(Boolean)
          : [],
      vampire:
        me && me.alive && (myRole === "vampire" || me.isThrall)
          ? state.players.filter((p) => (p.role === "vampire" || p.isThrall) && p.alive).map((p) => p.name)
          : [],
      medium:
        me && (myRole === "medium" || (!me.alive && !me.soulHarvested))
          ? state.players.filter((p) => p.role === "medium" || (!p.alive && !p.soulHarvested)).map((p) => p.name)
          : [],
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
    isThrall: state.phase === "gameover" ? !!p.isThrall : undefined,
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
    tiedNominees: state.tiedNominees || [],
    dayChat: state.chats.day || [],
    reporterReveal: state.reporterReveal,
    veteranSurvivedName: state.veteranSurvivedName,
    vampireFightResult: state.vampireFightResult,
    terroristBombVictimName: state.terroristBombVictimName,
    curseVictimName: state.curseVictimName,
    curseCastName: state.curseCastName,
    winner: state.winner,
  };
}
