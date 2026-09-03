import { ROLES, ROLE_TARGET_KEY, NIGHT_ABILITY_ROLES, isMafiaAligned } from "./gameEngine.js";

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
    werewolfVictimName: state.werewolfVictimName,
    priestReviveName: state.priestReviveName,
    catAppearedName: state.catAppearedName,
    avengerKillResult: state.avengerKillResult,
    curseCastName: state.curseCastName,
    winner: state.winner,
    revealAckCount: state.revealAckIds ? state.revealAckIds.length : 0,
    revealTotal: state.players.length,
    teamCounts: computeTeamCounts(state.players),
  };

  const myRole = me?.role || null;
  const myAbility =
    myRole === "cat"
      ? (!me.catAlignment
          ? { role: "cat", selectedTargetId: state.catOwnerTarget || null }
          : me.catAlignment === "citizen"
          ? { role: "cat_detect", selectedTargetId: state.catDetectTarget || null }
          : null) // 마피아 편입 고양이는 밤 능력이 없다 (낮 시간 능력이라 별도로 노출)
      : me && NIGHT_ABILITY_ROLES.includes(myRole)
      ? {
          role: myRole,
          selectedTargetId:
            myRole === "mafia" ? state.mafiaVotes?.[me.id] || null : state[ROLE_TARGET_KEY[myRole]] || null,
        }
      : me && me.isAvenger && !me.avengerUsed
      ? { role: "avenger", selectedTargetId: state.avengerActorId === me.id ? state.avengerTarget || null : null }
      : null;

  const mafiaVoteTally = {};
  if (me && isMafiaAligned(me)) {
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
    mySpyFindings: myRole === "spy" ? state.spyFindings || {} : null,
    myPriestFindings: myRole === "priest" ? state.priestFindings || {} : null,
    myLastDayVotes:
      myRole === "official"
        ? (state.dayNumber === 1
            ? []
            : state.players.map((p) => {
                const targetId = state.lastDayVotes?.[p.id];
                return { voterName: p.name, targetName: targetId ? state.players.find((t) => t.id === targetId)?.name || "?" : null };
              }))
        : null,
    myLastDayFinalVotes:
      myRole === "official" && !state.lastDayJudgeDecided
        ? (state.dayNumber === 1
            ? []
            : state.players.map((p) => ({ voterName: p.name, choice: state.lastDayFinalVotes?.[p.id] || null })))
        : null,
    myLastDayJudgeDecided: myRole === "official" ? !!state.lastDayJudgeDecided : null,
    myStolenGemTypes: myRole === "thief" ? state.stolenGemTypes || [] : null, // 지금까지 모은 보석 종류 체크리스트용
    myStolenFrom: myRole === "thief" ? state.stolenFrom || {} : null, // { [playerId]: gemType } - 로스터에 표시할 용도
    myThiefStealResult: myRole === "thief" ? state.thiefStealResult : null, // 이번 밤 절도 결과
    myCultistStacks: myRole === "cultist" ? state.cultistStacks || 0 : null,
    mySpyCaughtByName: myRole === "veteran" ? state.veteranSpyAlert?.[me.id] || null : null,
    myWitchUsed: myRole === "witch" ? !!state.witchUsed : null,
    myCatAlignment: myRole === "cat" ? me.catAlignment || null : null,
    myIsCatOwner: !!me && state.players.some((p) => p.role === "cat" && p.catAlignment === "citizen" && p.catOwnerId === me.id),
    myCatDetectResult: myRole === "cat" && me.catAlignment === "citizen" ? state.catDetectResult : null,
    myPriestUsed: myRole === "priest" ? !!state.priestUsed : null,
    myBlockerPrevTarget: myRole === "blocker" ? state.blockerPrevTarget : null,
    mySilencerPrevTarget: myRole === "silencer" ? state.silencerPrevTarget : null,
    myIsAvenger: !!me?.isAvenger,
    myAvengerUsed: !!me?.avengerUsed,
    mySoloJobGranted: me && state.soloJobGrantedPlayerId === me.id ? state.soloJobGrantedLabel : null,
    myIsWolfAllied: myRole === "werewolf" ? !!me?.isWolfAllied : null,
    teammates:
      me && isMafiaAligned(me)
        ? state.players.filter((p) => isMafiaAligned(p) && p.id !== me.id).map((p) => ({ id: p.id, name: p.name, roleLabel: ROLES[p.role].label }))
        : [],
    // 뱀파이어 본인 및 흡혈귀가 된 사람들은 서로를 확실히 알아본다 (본인 포함).
    vampireTeammates:
      me && (myRole === "vampire" || me.isThrall)
        ? state.players.filter((p) => p.role === "vampire" || p.isThrall).map((p) => ({ id: p.id, name: p.name, isVampire: p.role === "vampire" }))
        : [],
    partnerName:
      me && (myRole === "lover" || myRole === "newlywed") && me.partnerId
        ? state.players.find((p) => p.id === me.partnerId)?.name || null
        : null,
    isBlockedVoter: !!me && state.blockedVoterId === me.id,
    isCatVoteRemoved: !!me && state.catVoteRemovedId === me.id,
    myCatVoteRemovedName: myRole === "cat" && me.catAlignment === "mafia" && state.catVoteRemovedId
      ? state.players.find((p) => p.id === state.catVoteRemovedId)?.name || null
      : null,
    mySkippedVote: !!(me && state.skipVotes && state.skipVotes[me.id]),
    isBlockedChatter: !!me && state.blockedChatterId === me.id,
    myAbilityWasBlocked: !!me && state.blockedAbilityId === me.id,
    // 죽으면 마피아/연인 채팅은 더 이상 볼 수도, 칠 수도 없다. 영매 채팅만 예외 -
    // 단, 악마 숭배자에게 영혼을 수확당한 사람은 영매 채팅조차 볼 수 없다 (영혼이 이미 소환에 쓰였기 때문).
    // 연인/신혼부부 채팅은 쌍(pair)별로 격리되어 저장되어 있어서, 본인 쌍의 대화만 꺼내 평평한 배열로 내려준다.
    chats: {
      mafia: me && me.alive && isMafiaAligned(me) ? state.chats.mafia : [],
      lover: (() => {
        if (!me || !me.alive) return [];
        if ((myRole === "lover" || myRole === "newlywed") && me.partnerId && !me.isThrall) {
          return state.chats.lover?.[[me.id, me.partnerId].sort().join("|")] || [];
        }
        if (myRole === "cat" && me.catAlignment === "citizen" && me.catOwnerId) {
          const owner = state.players.find((p) => p.id === me.catOwnerId);
          const key = (owner && (owner.role === "lover" || owner.role === "newlywed") && owner.partnerId)
            ? [owner.id, owner.partnerId].sort().join("|")
            : [me.id, me.catOwnerId].sort().join("|");
          return state.chats.lover?.[key] || [];
        }
        // 고양이가 집사로 삼은 "일반 시민"(연인/신혼부부가 아닌 경우) 본인 시점 - 고양이와의 전용 채팅방
        if (!me.partnerId) {
          const catOfMine = state.players.find((p) => p.role === "cat" && p.catAlignment === "citizen" && p.catOwnerId === me.id);
          if (catOfMine) {
            return state.chats.lover?.[[catOfMine.id, me.id].sort().join("|")] || [];
          }
        }
        return [];
      })(),
      vampire: me && me.alive && (myRole === "vampire" || me.isThrall) ? state.chats.vampire : [],
      medium: me && (myRole === "medium" || (!me.alive && !me.soulHarvested)) ? state.chats.medium : [],
    },
    chatParticipants: {
      mafia:
        me && me.alive && isMafiaAligned(me)
          ? state.players.filter((p) => isMafiaAligned(p) && p.alive).map((p) => p.name)
          : [],
      lover:
        me && me.alive && (myRole === "lover" || myRole === "newlywed") && me.partnerId && !me.isThrall
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
    werewolfVictimName: state.werewolfVictimName,
    priestReviveName: state.priestReviveName,
    catAppearedName: state.catAppearedName,
    avengerKillResult: state.avengerKillResult,
    curseCastName: state.curseCastName,
    winner: state.winner,
    teamCounts: computeTeamCounts(state.players),
  };
}

/** 관전 화면 참여자 목록 옆에 표시할 팀별 생존 인원과 그중 특수직업 수를 계산한다. */
function computeTeamCounts(players) {
  // 게임 시작 시점 총 인원 기준으로 고정 표시한다 - 죽거나 흡혈귀로 전환돼도 이 숫자는 바뀌지 않는다.
  const mafiaPlayers = players.filter((p) => ROLES[p.role].team === "mafia");
  const citizenPlayers = players.filter((p) => ROLES[p.role].team === "citizen");
  const neutralPlayers = players.filter((p) => ROLES[p.role].team === "neutral");
  return {
    mafia: {
      total: mafiaPlayers.length,
      mafia: mafiaPlayers.filter((p) => p.role === "mafia").length,
      special: mafiaPlayers.filter((p) => p.role !== "mafia").length,
    },
    // 시민·연인은 특수직업이 아니고, 경찰·의사는 필수직업이라 둘 다 "특수직업" 수에서 제외한다.
    citizen: {
      total: citizenPlayers.length,
      police: citizenPlayers.filter((p) => p.role === "police").length,
      doctor: citizenPlayers.filter((p) => p.role === "doctor").length,
      special: citizenPlayers.filter((p) => !["citizen", "lover", "police", "doctor"].includes(p.role)).length,
    },
    neutral: { total: neutralPlayers.length },
  };
}
