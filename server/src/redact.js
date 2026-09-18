import { ROLES, ROLE_TARGET_KEY, NIGHT_ABILITY_ROLES, POWER_CARDS, CONARTIST_LEGEND_PASSIVE_ROLES, legendDisguiseOf, actsAsRole, findJudgeActor, isAbilityDisabled, puppeteerOf, isMafiaAligned, CITIZEN_GENERAL_ROLE_KEYS,
  nightDefenseMax, defenseUsedCount, isVerdictActor, soulwedChatOpen, counselorPairOf, usesStudentSlot, sharesRoleWithOriginal } from "./gameEngine.js";
import { getActiveTitle } from "./achievementStore.js";

function publicPlayer(p) {
  return {
    id: p.id,
    name: p.name,
    profileImageUrl: p.profileImageUrl,
    alive: p.alive,
    isSheriff: !!p.isSheriff,
    inJail: !!p.inJail,
    activeTitle: String(p.id).startsWith("test-") ? null : getActiveTitle(p.id), // 테스트 플레이어는 실제 저장소 기록이 없다
  };
}

/**
 * 사망/처형된 플레이어를 다른 사람에게 어떻게 보여줄지 결정한다.
 * - 게임이 끝났을 때: 전체 직업이 공개된다.
 * - 게임 진행 중 기자에게 공개됐다면: 그 직업(혹은 조작된 가짜 직업)이 계속 공개 상태로 유지된다.
 * - 투표로 처형됐을 때만: 정확한 직업이 아니라 "마피아팀이었는지 여부"가 공개된다.
 *   마피아팀 특수직업(해커·마담·유괴범·테러리스트·마녀)도 전부 "마피아팀이었습니다"로 표시되지만,
 *   스파이와 사기꾼(위장 중)만은 마피아 팀 소속이라도 "마피아가 아니었습니다"로 표시된다 (경찰 조사 결과와 동일한 규칙).
 * - 마피아에게 살해당했거나 그 외의 방식으로 죽었을 때는 마피아 여부조차 공개되지 않는다.
 */
function isMafiaForReveal(p) {
  if (p.role === "spy" || p.role === "conartist") return false;
  if (p.role === "godfather") return false;
  // "위장" 능력을 고른 마피아도 스파이·사기꾼·대부와 마찬가지로 어떤 방식으로도 마피아로 드러나지 않는다
  // (기자의 특종만 예외 - effectiveRoleLabel은 이 필터를 아예 거치지 않으므로 자연히 예외가 된다).
  if (p.powerUpgrade === "mafia_disguise" || p.powerUpgrade === "silencer_disguise") return false;
  // 대부에게 영입되어 마피아팀이 된 사람도, 스파이·사기꾼·대부와 마찬가지로 경찰 조사·처형 공개 등
  // 어떤 방식으로도 절대 마피아로 드러나지 않는다 - 원래 직업 그대로 보인다.
  if (p.recruitedToMafia) return false;
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
 * 시청자(me) 본인이 target의 직업을 이미 알고 있는 모든 경로를 확인해서, 알고 있다면 그 직업 라벨을
 * 돌려준다 - 경찰 조사(스파이/장의사/성직자), 스파이에게 들킨 군인, 대부-경찰/중립 상호 발각, 그리고
 * 교사&학생·연인·신혼부부처럼 처음부터 서로의 직업을 아는 짝 관계까지 전부 포함한다.
 * 공개적으로 드러난 직업(revealFor)과 달리, 이건 오직 이 시청자 본인의 로스터에만 반영된다.
 */
function computeKnownRoleLabel(me, target, state) {
  if (!me || !target || me.id === target.id) return null;
  // 조사·발각·목격 등으로 이 사람이 게임 중 알아낸 직업 (누적)
  const learned = state.knownRoles?.[me.id]?.[target.id];
  if (learned) return learned;
  // 같은 팀이라 서로를 알아보는 관계 - 마피아팀, 뱀파이어팀(뱀파이어+흡혈귀), 용병과 동료가 된 건달
  if (isMafiaAligned(me) && isMafiaAligned(target)) return ROLES[target.role]?.label || null;
  const inVampTeam = (p) => p.role === "vampire" || !!p.isThrall;
  if (inVampTeam(me) && inVampTeam(target)) return ROLES[target.role]?.label || null;
  const pairOf = (a, b) => a.role === "mercenary" && a.mercenaryContactedBy === "soldier" && b.role === "soldier" && b.pairedWithMercenary;
  if (pairOf(me, target) || pairOf(target, me)) return ROLES[target.role]?.label || null;
  if (me.role === "spy" && state.spyFindings?.[target.id]) return state.spyFindings[target.id];
  if (me.role === "undertaker" && state.undertakerFindings?.[target.id]) return state.undertakerFindings[target.id].roleLabel;
  if (me.role === "medium" && state.mediumFindings?.[target.id]) return state.mediumFindings[target.id]; // [성불]
  if (me.role === "detective" && state.detectiveFindings?.[target.id]) return state.detectiveFindings[target.id]; // [신원 조사]
  if (me.role === "priest" && state.priestFindings?.[target.id]) {
    const f = state.priestFindings[target.id];
    return f.type === "witch" ? ROLES.witch.label : ROLES.vampire.label;
  }
  if (me.role === "veteran" && state.veteranSpyAlert?.[me.id]) {
    const spyPlayer = state.players.find((p) => p.role === "spy");
    if (spyPlayer && spyPlayer.id === target.id) return ROLES.spy.label;
  }
  if (me.role === "police" && state.godfatherCaughtResult?.policeId === me.id) {
    const gf = state.players.find((p) => p.role === "godfather");
    if (gf && gf.id === target.id) return ROLES.godfather.label;
  }
  if (me.role === "godfather" && state.godfatherNeutralEncounterResult && state.godfatherNeutralCaughtId === target.id) {
    return state.godfatherNeutralEncounterResult.targetRoleLabel;
  }
  if (me.role === "police" && state.legendGodfatherCaught?.policeId === me.id && state.players.find((p) => p.name === state.legendGodfatherCaught.name)?.id === target.id) {
    return ROLES.godfather.label;
  }
  if (state.godfatherNeutralCaughtId === me.id) {
    const gf = state.players.find((p) => p.role === "godfather");
    if (gf && gf.id === target.id) return ROLES.godfather.label;
  }
  // 교사&학생 / 연인은 처음부터 서로가 서로의 직업임을 알고 시작한다.
  if (me.partnerId && me.partnerId === target.id) return ROLES[target.role]?.label || null;
  return null;
}

/** 도청 대상이 속한 비밀 채팅방들에서 오늘 밤 올라온 대화만 모은다. 누가 몇 명 있는지 모르도록 발신자는 전부 가린다. */
function collectSecretChats(state, target) {
  if (!target) return null;
  const collected = [];
  const tonight = (m) => m.day === state.dayNumber && m.phase === "night";
  const push = (msgs) => (msgs || []).forEach((m) => { if (tonight(m)) collected.push({ sender: "???", text: m.text }); });
  Object.entries(state.chats || {}).forEach(([channel, chan]) => {
    if (channel === "day") return;
    if (Array.isArray(chan)) {
      const member = channel === "mafia" ? (isMafiaAligned(target) && target.alive)
        : channel === "vampire" ? (target.role === "vampire" || !!target.isThrall)
        : channel === "medium" ? actsAsRole(target, "medium")
        : false;
      if (member) push(chan);
    } else if (chan && typeof chan === "object") {
      Object.entries(chan).forEach(([key, msgs]) => {
        const inRoom = channel === "wardenChat" ? (key === "jail" && (target.inJail || target.role === "warden")) : String(key).split("|").includes(target.id);
        if (inRoom) push(msgs);
      });
    }
  });
  return { targetName: target.name, messages: collected.slice(-50) };
}

/**
 * 각 플레이어 소켓으로 보낼, 그 사람 시점에서만 허용된 정보로 걸러진 상태.
 */
/**
 * 플레이어 화면에서도 방송 화면과 똑같은 공개 알람 카드를 틀기 위한 공개 정보 묶음.
 * 방송(스트리밍 모드)에 그대로 나가는 정보만 담는다 - 사람 목록도 이름·생존·보안관·수감 여부와
 * 공개적으로 드러난 마피아 여부(처형 결과 등)만 있어서, 이 플레이어가 개인적으로 아는 직업 정보는 섞이지 않는다.
 */
function alertPublic(state) {
  return {
    phase: state.phase, dayNumber: state.dayNumber, winner: state.winner,
    players: state.players.map((p) => ({ id: p.id, name: p.name, alive: p.alive, isSheriff: !!p.isSheriff, inJail: !!p.inJail, isMafia: revealFor(p, state, false).isMafia })),
    lastNightDeath: state.lastNightDeath, nightSaveHappened: state.nightSaveHappened, nightSavedName: state.nightSavedName, nightSaveBy: state.nightSaveBy || null,
    hitmanKillVictimId: state.hitmanKillVictimId, hitmanKillVictimName: state.hitmanKillVictimName,
    soloKillVictimId: state.soloKillVictimId, soloKillVictimName: state.soloKillVictimName,
    lastEliminated: state.lastEliminated, politicianSaved: state.politicianSaved, nominee: state.nominee,
    reporterReveal: state.reporterReveal, veteranSurvivedName: state.veteranSurvivedName, vampireFightResult: state.vampireFightResult,
    terroristBombVictimName: state.terroristBombVictimName, curseVictimName: state.curseVictimName, curseCastName: state.curseCastName,
    extraCurseVictimNames: state.extraCurseVictimNames || [], ancientCurseVictimNames: state.ancientCurseVictimNames || [],
    extraNightDeaths: state.extraNightDeaths || [], arsonVictimNames: state.arsonVictimNames || [], hospitalizedName: state.hospitalizedName || null, traffickedName: state.traffickedName || null,
    werewolfVictimName: state.werewolfVictimName, priestReviveName: state.priestReviveName, judgePardonResult: state.judgePardonResult,
    sheriffElectedName: state.sheriffElectedName, sheriffDesignatedTarget: state.sheriffDesignatedTarget,
    sheriffExecutionResult: state.sheriffExecutionResult, sheriffJustJailedName: state.sheriffJustJailedName,
    bodyguardSaveResult: state.bodyguardSaveResult, catAppearedName: state.catAppearedName, avengerKillResult: state.avengerKillResult,
    nightLordResult: state.nightLordResult || null, bodyguardLastWord: state.bodyguardLastWord || null,
    dictatorResult: state.dictatorResult || null, judgeRulingResult: state.judgeRulingResult || null, judgePleaResult: state.judgePleaResult || null,
    verdictByPriest: !!state.inquisitionBy,
  };
}

/**
 * 이번 밤에 "나에게 일어난 일" 중 본인이 알 수 있는 것들만 모은다.
 * (아침에 개인 알람 카드로 보여주고, 낮 내내 고정 패널에도 남긴다)
 */
function myNightVictimEvents(state, me) {
  if (!me) return [];
  const ev = [];
  if (state.virusLostId === me.id) ev.push({ kind: "virusLost" });
  if (state.charmSealedId === me.id) ev.push({ kind: "charmSealed" });
  if (state.blockedAbilityId === me.id || state.legendBlockedAbilityId === me.id || state.seducedAbilityId === me.id || state.mindControlledId === me.id) ev.push({ kind: "abilityBlocked" });
  if (state.hostedVoterId === me.id) ev.push({ kind: "voteHosted" });
  else if (state.blockedVoterId === me.id || state.extraBlockedVoterId === me.id || state.possessBlockedVoterId === me.id || state.studentBlockedVoterId === me.id) ev.push({ kind: "voteBlocked" });
  if (state.blockedChatterId === me.id || state.extraBlockedChatterId === me.id) ev.push({ kind: "chatBlocked" });
  if (state.catVoteRemovedId === me.id) ev.push({ kind: "catVoteRemoved" });
  if (me.role === "veteran" && state.veteranSpyAlert?.[me.id]) ev.push({ kind: "spyCaught", name: state.veteranSpyAlert[me.id] });
  if (me.role === "police" && state.godfatherCaughtResult?.policeId === me.id) ev.push({ kind: "godfatherCaught", name: state.godfatherCaughtResult.name });
  if (me.role === "police" && state.legendGodfatherCaught?.policeId === me.id) ev.push({ kind: "godfatherCaught", name: state.legendGodfatherCaught.name });
  if (state.godfatherNeutralCaughtId === me.id) ev.push({ kind: "godfatherNeutralCaught", name: state.players.find((p) => p.role === "godfather")?.name || null });
  if (state.silencerBrainwashResultId === me.id) ev.push({ kind: "brainwashed" });
  if ((state.newThrallIds || []).includes(me.id)) ev.push({ kind: "becameThrall" });
  if (puppeteerOf(state, me.id)) ev.push({ kind: "mindControlled" });
  return ev;
}

export function redactForPlayer(state, playerId) {
  const me = state.players.find((p) => p.id === playerId) || null;

  const players = state.players.map((p) => {
    const base = { ...publicPlayer(p), ...revealFor(p, state, p.id === playerId), isSelf: p.id === playerId };
    // 공개적으로 드러난 직업이 없다면, 시청자 본인이 여러 경로로 이미 알고 있는 직업인지 확인해서
    // 채워준다 - 본인의 로스터에만 반영되고 다른 사람에게는 영향 없다.
    if (!base.roleLabel) {
      const known = computeKnownRoleLabel(me, p, state);
      if (known) {
        base.roleLabel = known;
        base.isMafia = isMafiaForReveal({ ...p, role: Object.keys(ROLES).find((k) => ROLES[k].label === known) || p.role });
      }
    }
    return {
      ...base,
      isThrall: p.id === playerId || state.phase === "gameover" ? !!p.isThrall : undefined,
    };
  });

  const base = {
    phase: state.phase,
    dayNumber: state.dayNumber,
    timerSeconds: state.timerSeconds,
    timerRunning: state.timerRunning,
    players,
    log: state.log,
    lastNightDeath: state.lastNightDeath,
    nightSaveHappened: state.nightSaveHappened, nightSavedName: state.nightSavedName,
    hitmanKillVictimId: state.hitmanKillVictimId, hitmanKillVictimName: state.hitmanKillVictimName,
    soloKillVictimId: state.soloKillVictimId, soloKillVictimName: state.soloKillVictimName,
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
    extraCurseVictimNames: state.extraCurseVictimNames || [],
    ancientCurseVictimNames: state.ancientCurseVictimNames || [],
    extraNightDeaths: state.extraNightDeaths || [],
    arsonVictimNames: state.arsonVictimNames || [], hospitalizedName: state.hospitalizedName || null, traffickedName: state.traffickedName || null,
    werewolfVictimName: state.werewolfVictimName,
    priestReviveName: state.priestReviveName,
    idolMessage: state.idolMessage,
    judgePardonResult: state.judgePardonResult,
    sheriffElectedName: state.sheriffElectedName,
    sheriffElectionVotes: state.phase === "sheriffElectionVote" ? state.sheriffElectionVotes : undefined,
    sheriffRunoffCandidates: state.sheriffRunoffCandidates,
    sheriffDesignateResult: state.sheriffDesignateResult,
    sheriffDesignatedTarget: state.sheriffDesignatedTarget,
    sheriffDefenseText: state.sheriffDefenseText,
    sheriffExecutionResult: state.sheriffExecutionResult,
    sheriffJustJailedName: state.sheriffJustJailedName,
    bodyguardSaveResult: state.bodyguardSaveResult,
    catAppearedName: state.catAppearedName,
    avengerKillResult: state.avengerKillResult,
    curseCastName: state.curseCastName,
    nightLordResult: state.nightLordResult || null,
    bodyguardLastWord: state.bodyguardLastWord || null,
    nightSaveBy: state.nightSaveBy || null,
    dictatorResult: state.dictatorResult || null,
    judgeRulingResult: state.judgeRulingResult || null,
    judgePleaResult: state.judgePleaResult || null,
    verdictByPriest: !!state.inquisitionBy,
    winner: state.winner,
    revealAckCount: state.revealAckIds ? state.revealAckIds.length : 0,
    revealTotal: state.players.length,
    teamCounts: computeTeamCounts(state.players, state.initialRoles),
  };

  const myRole = me?.role || null;
  const myAbility = isAbilityDisabled(me) ? null :
    myRole === "cat"
      ? (!me.catAlignment
          ? { role: "cat", selectedTargetId: state.catOwnerTarget || null }
          : me.catAlignment === "citizen"
          ? { role: "cat_detect", selectedTargetId: state.catDetectTarget || null }
          : null) // 마피아 편입 고양이는 밤 능력이 없다 (낮 시간 능력이라 별도로 노출)
      : me && (NIGHT_ABILITY_ROLES.includes(myRole) || (myRole === "medium" && me.powerUpgrade === "medium_exorcise") ||
          (myRole === "official" && me.powerUpgrade === "official_audit") || (myRole === "veteran" && me.powerUpgrade === "veteran_pmc" && !me.veteranPmcUsed)) &&
        (myRole !== "mercenary" || !!me.mercenaryContactedBy) &&
        !(myRole === "detective" && me.powerUpgrade === "detective_deduce") &&
        !(myRole === "witch" && me.powerUpgrade === "witch_mindcontrol") &&
        !(myRole === "silencer" && ["silencer_trafficking", "silencer_brainwash"].includes(me.powerUpgrade)) &&
        !(myRole === "hitman" && me.powerUpgrade === "hitman_poison") &&
        !(myRole === "blocker" && me.powerUpgrade === "blocker_charm" && me.blockerCharmUsed)
      ? {
          role: myRole,
          selectedTargetId:
            myRole === "mafia" ? state.mafiaVotes?.[me.id] || null
            : usesStudentSlot(state, me) ? (state.studentUse?.actorId === me.id ? state.studentUse.targetId : null)
            : state[ROLE_TARGET_KEY[myRole]] || null,
        }
      : me && me.isAvenger && !me.avengerUsed && me.powerUpgrade === "newlywed_revenge"
      ? { role: "avenger", selectedTargetId: state.avengerActorId === me.id ? state.avengerTarget || null : null }
      : null;

  // 수업으로 얻은 직업이 원래 직업과 겹치는 학생에게는, 원래 직업 쪽의 비공개 결과(조사 결과·누적 기록)를 보여주지 않는다.
  const hideMainNight = !!me && (usesStudentSlot(state, me) || (state.lastNightDupStudentIds || []).includes(me.id));
  const hideMainFindings = sharesRoleWithOriginal(state, me);
  // 히트맨은 대상 + 추측 직업, 두 가지를 함께 골라야 해서 일반적인 myAbility 형태로는 표현이 안 된다 - 따로 노출한다.
  const myHitmanAbility =
    myRole === "hitman" && me?.alive && !isAbilityDisabled(me)
      ? { selectedTargetId: state.hitmanTargetId || null, selectedGuessedRole: state.hitmanGuessedRole || null }
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
    myUsedDefense: !!me && nightDefenseMax(me) > 0 && defenseUsedCount(me) >= nightDefenseMax(me),
    myDefenseLeft: me ? Math.max(0, nightDefenseMax(me) - defenseUsedCount(me)) : 0,
    // [빙의]·[유품수거] 상태
    myPossess: me && ((myRole === "medium" && me.powerUpgrade === "medium_possess") || (myRole === "undertaker" && me.powerUpgrade === "undertaker_relic"))
      ? { picked: !!me.possessPicked, failed: !!me.possessFailed, fromName: me.possessFromName || null, role: me.possessRole || null,
          roleLabel: me.possessRole ? ROLES[me.possessRole].label : null, used: !!me.possessUsed,
          selectedTargetId: state.possessUse?.actorId === me.id ? state.possessUse.targetId : null }
      : null,
    myPossessResult: me && state.possessResult?.actorId === me.id ? state.possessResult : null,
    myStudentSlotResult: me && state.studentResult?.actorId === me.id ? state.studentResult : null,
    myMediumExorciseResult: myRole === "medium" ? state.mediumExorciseResult || null : null,
    myExorcisedIds: myRole === "medium" ? state.players.filter((p) => p.exorcised).map((p) => p.id) : [],
    myOfficialAuditResult: myRole === "official" ? state.officialAuditResult || null : null,
    myOfficialPickCandidates: myRole === "official" && me?.powerUpgrade === "official_rig" && state.phase === "officialPick" ? state.officialPickCandidates || [] : null,
    myOfficialPickTally: myRole === "official" && state.phase === "officialPick" ? state.officialPickTally || null : null,
    myDetectiveDeduceUsed: myRole === "detective" ? !!me?.detectiveDeduceUsed : false,
    myDetectiveDeduceResult: me && state.detectiveDeduceResult?.actorId === me.id ? state.detectiveDeduceResult : null,
    myDeduceCandidateIds: myRole === "detective" && me?.powerUpgrade === "detective_deduce" ? state.players.filter((p) => !p.alive && p.deathNight === state.dayNumber - 1).map((p) => p.id) : [],
    myVeteranPmcUsed: myRole === "veteran" ? !!me?.veteranPmcUsed : false,
    myInquisitionUsed: myRole === "priest" ? !!me?.inquisitionUsed : false,
    iAmVerdictActor: !!me && isVerdictActor(state, me),
    myNightLordUsed: myRole === "godfather" ? !!me?.nightLordUsed : false,
    myNightLordTonight: myRole === "godfather" && state.phase === "night" && state.nightLordPendingId === me?.id,
    myReporterUsed: myRole === "reporter" ? (me?.reporterUseCount || 0) >= (me?.powerUpgrade === "reporter_abuse" ? 2 : 1) : null,
    mySoldierBossActive: !!me && state.soldierBossVoterId === me.id,
    myLoverChatOpen: !!me && ((me.alive && (myRole === "newlywed") && me.partnerId && !me.isThrall && state.players.find((p) => p.id === me.partnerId)?.alive) || soulwedChatOpen(state, me)),
    myMediumChatReadOnly: !!me && !me.alive && !!me.exorcised,
    myPartnerId: me?.partnerId || null,
    iHaveRevealAcked: me ? (state.revealAckIds || []).includes(me.id) : false,
    myVoteTarget: me && state.votes ? state.votes[me.id] || null : null,
    mySheriffElectionVote: me && state.sheriffElectionVotes ? state.sheriffElectionVotes[me.id] || null : null,
    myFinalVote: me && state.finalVotes ? state.finalVotes[me.id] || null : null,
    myAbility,
    myHitmanAbility,
    mafiaVoteTally,
    myPoliceResult: myRole === "police" && !hideMainNight ? state.policeResult : null,
    myPoliceSecondResult: myRole === "police" && !hideMainNight ? state.policeSecondResult : null,
    // [수습] 능력 - 죽인 대상의 직업을 알게 된 마피아 본인에게만.
    myMafiaApprenticeReveal: myRole === "mafia" ? state.mafiaApprenticeReveal?.[me?.id] || null : null,
    // [무법자] UI에서 첫 번째 대상을 제외하고 두 번째 대상을 고를 때 필요.
    mafiaTarget: myRole === "mafia" ? state.mafiaVotes?.[me?.id] || null : null,
    mafiaSecondTarget: myRole === "mafia" ? state.mafiaSecondVotes?.[me?.id] || null : null,
    mafiaHasOutlaw: myRole === "mafia" ? state.players.some((p) => p.role === "mafia" && p.alive && !p.inJail && p.powerUpgrade === "mafia_outlaw") : false,
    // [강력 수사] UI에서 첫 번째 대상을 제외하고 두 번째 대상을 고를 때 필요.
    policeTarget: myRole === "police" && !usesStudentSlot(state, me) ? state.policeTarget : null,
    policeSecondTarget: myRole === "police" && !usesStudentSlot(state, me) ? state.policeSecondTarget : null,
    // 7일차 능력 선택 - 본인에게 제안된 카드 목록과, 이미 골랐다면 그 결과.
    myPowerCardsOffered: me ? state.powerCardsOffered?.[me.id] || null : null,
    myPowerUpgrade: me?.powerUpgrade || null,
    // 고른(또는 시간 초과로 자동 배정된) 카드의 이름·설명 - 선택 단계가 끝난 뒤에도 본인이 확인할 수 있게 한다.
    myPowerUpgradeCard: me?.powerUpgrade ? Object.values(POWER_CARDS).flat().find((c) => c.id === me.powerUpgrade) || null : null,
    // [미인계] 연속 지목 불가 대상 - 스파이 화면에서 미리 제외하기 위해
    spySeducePrevTarget: myRole === "spy" && me?.powerUpgrade === "spy_seduce" ? state.spySeducePrevTarget || null : null,
    // 유괴범 [인신매매]/[세뇌] 사용 여부
    mySilencerTraffickingUsed: myRole === "silencer" ? !!me?.silencerTraffickingUsed : false,
    mySilencerBrainwashUsed: myRole === "silencer" ? !!me?.silencerBrainwashUsed : false,
    mySilencerBrainwashOutcome: myRole === "silencer" ? state.silencerBrainwashOutcome || null : null,
    // [독살] - 오늘 독을 먹여둔 대상 (히트맨 본인 화면에서 선택 상태 표시용)
    myHitmanPoisonTargetId: myRole === "hitman" && state.hitmanPoisonDeathDay === state.dayNumber ? state.hitmanPoisonTargetId || null : null,
    // [방화] 오늘 밤 이미 표식/방화를 했는지
    myTerroristActedTonight: myRole === "terrorist" ? state.terroristActedDay === state.dayNumber && state.phase === "night" : false,
    myTerroristArsonPending: myRole === "terrorist" && state.phase === "night" && state.terroristArsonPending === me?.id,
    // 판사의 판결권을 가진 사람인지 (진짜 판사, 또는 판사로 위장한 [전설의 사기꾼])
    iAmActingJudge: !!me && (state.phase === "judgetiebreak"
      ? findJudgeActor(state.players, state.tiedNominees || [])?.id === me.id
      : findJudgeActor(state.players, [state.nominee])?.id === me.id),
    // [전설의 사기꾼] - 위장한 직업으로 쓸 수 있는 능력과 오늘 밤 선택, 결과
    myConartistLegendRole: legendDisguiseOf(me),
    myConartistLegendIsPassive: !!legendDisguiseOf(me) && CONARTIST_LEGEND_PASSIVE_ROLES.includes(legendDisguiseOf(me)),
    myConartistLegendOnceUsed: legendDisguiseOf(me) ? me.legendOnceUsed || {} : null,
    myConartistLegendGuess: myRole === "conartist" ? state.conartistLegendGuess || null : null,
    myConartistLegendTarget: myRole === "conartist" ? state.conartistLegendTarget || state.mafiaVotes?.[me?.id] || null : null,
    myConartistLegendResult: myRole === "conartist" ? state.conartistLegendResult || null : null,
    myWitchAncientUsed: myRole === "witch" ? !!me?.witchAncientUsed : false,
    myGodfatherLegendEligible: myRole === "godfather" && me?.powerUpgrade === "godfather_legend"
      ? !state.players.some((p) => p.id !== me.id && isMafiaAligned(p) && p.alive) : false,
    mafiaVoteTargetId: (myRole === "mafia" || (myRole === "godfather" && me?.powerUpgrade === "godfather_legend"))
      ? state.mafiaVotes?.[me?.id] || null : null,
    conartistRiggedTargetId: myRole === "conartist" ? state.conartistRiggedTargetId : null,
    // 기자 [잠입취재] - 낮에 골라둔 사람의 비밀 채팅방 대화 (그날 밤에만). [밤의 지배자]가 깨어난 밤에는 막힌다.
    myReporterInfiltrateTargetId: myRole === "reporter" ? state.reporterInfiltrateTargetId || null : null,
    myReporterInfiltrateMessages: myRole === "reporter" && me?.alive && !me.inJail && me.powerUpgrade === "reporter_infiltrate" && state.phase === "night"
      && !isAbilityDisabled(me) && !state.nightLordPendingId && state.reporterInfiltrateTargetId
      ? collectSecretChats(state, state.players.find((p) => p.id === state.reporterInfiltrateTargetId))
      : null,
    // 해커 [도청] - 낮에 골라둔 사람의 비밀 채팅방 대화 (그날 밤에만)
    myFramerWiretapTargetId: myRole === "framer" ? state.framerWiretapTargetId || null : null,
    myFramerWiretapMessages: myRole === "framer" && me?.alive && me.powerUpgrade === "framer_wiretap" && state.phase === "night" && !isAbilityDisabled(me) && state.framerWiretapTargetId
      ? collectSecretChats(state, state.players.find((p) => p.id === state.framerWiretapTargetId))
      : null,
    myFramerVirusTriedIds: myRole === "framer" ? me?.virusTriedIds || [] : null,
    myVirusResult: myRole === "framer" ? state.virusResult || null : null,
    myFramerProxyResult: myRole === "framer" ? state.framerProxyResult || null : null,
    myBlockerCharmUsed: myRole === "blocker" ? !!me?.blockerCharmUsed : false,
    myBlockerCharmResult: myRole === "blocker" ? state.blockerCharmResult || null : null,
    myBlockerSpyResult: myRole === "blocker" ? state.blockerSpyResult || null : null,
    myBlockerHostResult: myRole === "blocker" && state.hostVoterBy === me?.id && state.hostedVoterId
      ? { targetName: state.players.find((p) => p.id === state.hostedVoterId)?.name || "?" } : null,
    // 능력 상실/봉인 상태 - "lost"(바이러스, 영구) | "sealed"(현혹, 마담이 죽을 때까지) | null
    myAbilityDisabled: me?.abilityLost ? "lost" : me?.abilitySealed ? "sealed" : null,
    myAbilityLostTonight: !!me && state.virusLostId === me.id,
    myAbilitySealedTonight: !!me && state.charmSealedId === me.id,
    isHostedVoter: !!me && state.hostedVoterId === me.id,
    mySpyResult: myRole === "spy" ? state.spyResult : null,
    myDetectiveResult: myRole === "detective" && !hideMainNight ? state.detectiveResult : null,
    myDoctorResult: myRole === "doctor" && !hideMainNight ? state.doctorResult : null,
    myDoctorHospitalizeUsed: myRole === "doctor" ? !!me?.doctorHospitalizeUsed : false,
    myDoctorHospitalizeTargetId: myRole === "doctor" ? state.doctorHospitalizeTargetId || null : null,
    mySilencerTraffickingTargetId: myRole === "silencer" ? state.silencerTraffickingTargetId || null : null,
    mySilencerBrainwashTargetId: myRole === "silencer" ? state.silencerBrainwashTargetId || null : null,
    myWitchMindControlTargetId: myRole === "witch" ? state.witchMindControlTargetId || null : null,
    myWitchAncientPending: myRole === "witch" ? state.witchAncientPendingBy === me?.id : false,
    myTerroristMarkedNames: myRole === "terrorist" ? (me?.terroristMarkedIds || []).map((id) => state.players.find((p) => p.id === id)?.name).filter(Boolean) : null,
    terroristSelfdestructTarget: myRole === "terrorist" ? state.terroristSelfdestructTarget : null,
    myHitmanResult: myRole === "hitman" ? state.hitmanResult : null,
    myHitmanSecondResult: myRole === "hitman" ? state.hitmanSecondResult : null,
    hitmanTargetId: myRole === "hitman" ? state.hitmanTargetId : null,
    myCoronerResult: myRole === "coroner" ? state.coronerResult : null,
    myCoronerUsedToday: myRole === "coroner" ? state.coronerUsedDay === state.dayNumber : null,
    myUndertakerResult: myRole === "undertaker" && !hideMainNight ? state.undertakerResult : null,
    myUndertakerFindings: myRole === "undertaker" ? (hideMainFindings ? {} : state.undertakerFindings || {}) : null,
    mySpyFindings: myRole === "spy" ? state.spyFindings || {} : null,
    myPriestFindings: myRole === "priest" ? (hideMainFindings ? {} : state.priestFindings || {}) : null,
    myPoliceFindings: myRole === "police" ? (hideMainFindings ? {} : state.policeFindings || {}) : null,
    // 용병과 접선한(경찰/건달) 사람은 용병의 정체를 확실히 알게 된다 - 마피아 접선은 이미 teammates로 커버된다.
    myMercenaryFindings: (() => {
      if (!me) return null;
      const merc = state.players.find((p) => p.role === "mercenary");
      if (!merc || !merc.mercenaryContactedBy || merc.mercenaryContactedBy === "mafia") return null;
      // 용병 본인은 자신을 접선한 경찰/건달의 정체도 확실히 알아본다.
      if (me.id === merc.id) {
        return { [merc.mercenaryContactPlayerId]: ROLES[merc.mercenaryContactedBy].label };
      }
      if (me.id !== merc.mercenaryContactPlayerId) return null;
      return { [merc.id]: ROLES.mercenary.label };
    })(),
    myGodfatherCaughtName: myRole === "police" && state.godfatherCaughtResult?.policeId === me?.id
      ? state.players.find((p) => p.role === "godfather")?.name || null
      : myRole === "police" && state.legendGodfatherCaught?.policeId === me?.id ? state.legendGodfatherCaught.name
      : null,
    // 대부가 중립을 영입하려다 실패한 경우 - 대부 본인은 상대 이름과 직업을, 그 중립은 대부의 이름을 알게 된다.
    myGodfatherNeutralEncounterResult: myRole === "godfather" ? state.godfatherNeutralEncounterResult : null,
    myNightVictimEvents: myNightVictimEvents(state, me),
    myGodfatherNeutralCaughtName: me && state.godfatherNeutralCaughtId === me.id
      ? state.players.find((p) => p.role === "godfather")?.name || null
      : me && state.legendNeutralCaught?.id === me.id ? state.legendNeutralCaught.name
      : null,
    myLastDayVotes:
      actsAsRole(me, "official") && !(myRole === "official" && me.powerUpgrade === "official_audit")
        ? (state.dayNumber === 1
            ? []
            : state.players.map((p) => {
                const targetId = state.lastDayVotes?.[p.id];
                return { voterName: p.name, targetName: targetId ? state.players.find((t) => t.id === targetId)?.name || "?" : null };
              }))
        : null,
    myLastDayFinalVotes:
      actsAsRole(me, "official") && !(myRole === "official" && me.powerUpgrade === "official_audit") && !state.lastDayJudgeDecided
        ? (state.dayNumber === 1
            ? []
            : state.players.map((p) => ({ voterName: p.name, choice: state.lastDayFinalVotes?.[p.id] || null })))
        : null,
    myLastDayJudgeDecided: actsAsRole(me, "official") ? !!state.lastDayJudgeDecided : null,
    myStolenGemTypes: myRole === "thief" ? state.stolenGemTypes || [] : null, // 지금까지 모은 보석 종류 체크리스트용
    myStolenFrom: myRole === "thief" ? state.stolenFrom || {} : null, // { [playerId]: gemType } - 로스터에 표시할 용도
    myThiefStealResult: myRole === "thief" ? state.thiefStealResult : null, // 이번 밤 절도 결과
    myCultistStacks: myRole === "cultist" ? state.cultistStacks || 0 : null,
    mySpyCaughtByName: myRole === "veteran" ? state.veteranSpyAlert?.[me.id] || null : null,
    myWitchUsed: myRole === "witch"
      ? (me?.powerUpgrade === "witch_mindcontrol" ? false : (state.witchCastCount || 0) >= (me?.powerUpgrade === "witch_high" ? 3 : 1))
      : null,
    myCatAlignment: myRole === "cat" ? me.catAlignment || null : null,
    myIsCatOwner: !!me && state.players.some((p) => p.role === "cat" && p.catAlignment === "citizen" && p.catOwnerId === me.id),
    myCatDetectResult: myRole === "cat" && me.catAlignment === "citizen" ? state.catDetectResult : null,
    myPriestUsed: myRole === "priest" ? !!me?.priestReviveUsed : null,
    myJudgePardonUsed: myRole === "judge" ? !!me?.judgePardonDone : null,
    myUnemployedJobGranted: me && state.unemployedJobGrantedPlayerId === me.id ? state.unemployedJobGrantedLabel : null,
    myConartistUsed: myRole === "conartist" ? !!state.conartistUsed : null,
    myMercenaryContactedBy: myRole === "mercenary" ? me?.mercenaryContactedBy || null : null,
    myMercenaryPendingContacts: myRole === "mercenary" && !me?.mercenaryContactedBy ? (state.mercenaryPendingContacts || []) : [],
    myPairedWithMercenary: myRole === "soldier" ? !!me?.pairedWithMercenary : null,
    myConartistDisguiseResult: myRole === "conartist" ? state.conartistDisguiseResult : null,
    myDisguisedAs: myRole === "conartist" && me?.disguisedAs ? ROLES[me.disguisedAs].label : null,
    myGodfatherUsed: myRole === "godfather" ? (state.godfatherRecruitCount || 0) >= (me?.powerUpgrade === "godfather_deal" ? 2 : 1) : null,
    myCounselorTarget: myRole === "counselor" ? (state.counselorTargets || {})[me?.id] || null : null,
    // 교사/학생 둘 다에게 학생의 수업 진행도·결과를 보여준다 (파트너 관계가 유지되는 한, 졸업 직후에도 - role이 바뀐 시점이라 role만으로는 판별 불가).
    myTeachingProgress: (() => {
      if (!me || !me.partnerId) return null;
      const partner = state.players.find((p) => p.id === me.partnerId);
      if (myRole === "teacher" && partner) return partner.teachingProgress || {};
      if (partner?.role === "teacher") return me.teachingProgress || {};
      return null;
    })(),
    myTeacherLessonResult: (() => {
      if (!me || !me.partnerId) return null;
      const partner = state.players.find((p) => p.id === me.partnerId);
      if (myRole === "teacher" || partner?.role === "teacher") return state.teacherLessonResult;
      return null;
    })(),
    myTeacherLessonChoice: myRole === "teacher" ? state.teacherLessonChoice : null,
    // 영입 결과는 완전히 비공개 - 대부 본인(누구를 영입했는지)과 영입 당사자(자신이 영입됐다는 사실)만 알 수 있다.
    myGodfatherRecruitedName: myRole === "godfather" && state.godfatherRecruitResult ? state.godfatherRecruitResult.targetName : null,
    wasRecruitedToMafia: !!me && (state.godfatherRecruitResult?.targetId === me.id || state.silencerBrainwashResultId === me.id || state.legendRecruitTargetId === me.id),
    myRecruitedToMafia: !!me?.recruitedToMafia,
    myBlockerPrevTarget: myRole === "blocker" ? state.blockerPrevTarget : null,
    mySilencerPrevTarget: myRole === "silencer" ? state.silencerPrevTarget : null,
    myIsAvenger: !!me?.isAvenger,
    myAvengerUsed: !!me?.avengerUsed,
    myIsWolfAllied: myRole === "werewolf" ? !!me?.isWolfAllied : null,
    myIsSheriff: !!me?.isSheriff,
    isInJail: !!me?.inJail,
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
    isBlockedVoter: !!me && (state.blockedVoterId === me.id || state.extraBlockedVoterId === me.id || state.hostedVoterId === me.id),
    isCatVoteRemoved: !!me && state.catVoteRemovedId === me.id,
    myCatVoteRemovedName: myRole === "cat" && me.catAlignment === "mafia" && state.catVoteRemovedId
      ? state.players.find((p) => p.id === state.catVoteRemovedId)?.name || null
      : null,
    mySkippedVote: !!(me && state.skipVotes && state.skipVotes[me.id]),
    isBlockedChatter: !!me && (state.blockedChatterId === me.id || state.extraBlockedChatterId === me.id),
    // [정신 지배] - 오늘 밤 채팅을 칠 수 없는 상태인지 (본인 화면에서 입력창을 막고 안내하기 위해)
    myMindControlledTonight: false,
    // [정신 지배] - 마녀의 꼭두각시가 되어 스스로는 아무것도 할 수 없는 상태 (마녀가 죽으면 풀림)
    myControlledByWitch: !!me && !!puppeteerOf(state, me.id),
    myMindControlUsed: myRole === "witch" && me?.powerUpgrade === "witch_mindcontrol" ? !!me.mindControlUsed : null,
    myAbilityWasBlocked: !!me && (state.blockedAbilityId === me.id || state.legendBlockedAbilityId === me.id || state.seducedAbilityId === me.id || state.mindControlledId === me.id),
    // 죽으면 마피아/연인 채팅은 더 이상 볼 수도, 칠 수도 없다. 영매 채팅만 예외 -
    // 단, 악마 숭배자에게 영혼을 수확당한 사람은 영매 채팅조차 볼 수 없다 (영혼이 이미 소환에 쓰였기 때문).
    // 연인/신혼부부 채팅은 쌍(pair)별로 격리되어 저장되어 있어서, 본인 쌍의 대화만 꺼내 평평한 배열로 내려준다.
    chats: {
      mafia: me && me.alive && isMafiaAligned(me) ? state.chats.mafia : [],
      lover: (() => {
        if (me && soulwedChatOpen(state, me)) return state.chats.lover?.[[me.id, me.partnerId].sort().join("|")] || [];
        if (!me || !me.alive) return [];
        if ((myRole === "lover" || myRole === "newlywed") && me.partnerId && !me.isThrall
          && state.players.find((p) => p.id === me.partnerId)?.alive) {
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
      teacherStudent: (() => {
        if (!me || !me.alive || !me.partnerId) return [];
        const partner = state.players.find((p) => p.id === me.partnerId);
        if (!partner?.alive) return [];
        if (myRole !== "teacher" && partner?.role !== "teacher") return [];
        return state.chats.teacherStudent?.[[me.id, me.partnerId].sort().join("|")] || [];
      })(),
      counselor: (() => {
        if (!me || !me.alive || state.phase !== "night") return [];
        const pair = counselorPairOf(state, me.id);
        if (!pair) return [];
        return state.chats.counselor?.[[...pair].sort().join("|")] || [];
      })(),
      mercenaryContact: (() => {
        if (!me || !me.alive) return [];
        const merc = state.players.find((p) => p.role === "mercenary");
        if (!merc || !merc.mercenaryContactedBy || merc.mercenaryContactedBy === "mafia") return [];
        if (me.id !== merc.id && me.id !== merc.mercenaryContactPlayerId) return [];
        return state.chats.mercenaryContact?.[[merc.id, merc.mercenaryContactPlayerId].sort().join("|")] || [];
      })(),
      wardenChat: (() => {
        // 감옥에 갇힌 사람이 여러 명이면 전원이 교도관과 같은 면회실(채팅방 하나)을 쓴다.
        if (!me || !me.alive || state.phase !== "night") return [];
        const warden = state.players.find((p) => p.role === "warden" && p.alive && !p.inJail && !isAbilityDisabled(p));
        if (!warden || !state.players.some((p) => p.inJail && p.alive)) return [];
        if (me.id !== warden.id && !me.inJail) return [];
        return state.chats.wardenChat?.jail || [];
      })(),
      medium: me && ((me.alive && actsAsRole(me, "medium")) || (!me.alive && !me.soulHarvested)) ? state.chats.medium : [],
    },
    chatParticipants: {
      mafia:
        me && me.alive && isMafiaAligned(me)
          ? state.players.filter((p) => isMafiaAligned(p) && p.alive).map((p) => p.name)
          : [],
      lover:
        me && ((me.alive && (myRole === "lover" || myRole === "newlywed") && me.partnerId && !me.isThrall
          && state.players.find((p) => p.id === me.partnerId)?.alive) || soulwedChatOpen(state, me))
          ? [me.name, state.players.find((p) => p.id === me.partnerId)?.name].filter(Boolean)
          : [],
      vampire:
        me && me.alive && (myRole === "vampire" || me.isThrall)
          ? state.players.filter((p) => (p.role === "vampire" || p.isThrall) && p.alive).map((p) => p.name)
          : [],
      teacherStudent: (() => {
        if (!me || !me.alive || !me.partnerId) return [];
        const partner = state.players.find((p) => p.id === me.partnerId);
        if (!partner?.alive) return [];
        if (myRole !== "teacher" && partner?.role !== "teacher") return [];
        return [me.name, partner?.name].filter(Boolean);
      })(),
      counselor: (() => {
        if (!me || !me.alive || state.phase !== "night") return [];
        const pair = counselorPairOf(state, me.id);
        if (!pair) return [];
        const targetPlayer = state.players.find((p) => p.id === pair[1]);
        // 상담원의 실명은 여기서도 노출하지 않는다 - 대상자 이름만 실명으로 보여준다.
        return ["상담원", targetPlayer?.name].filter(Boolean);
      })(),
      mercenaryContact: (() => {
        if (!me || !me.alive) return [];
        const merc = state.players.find((p) => p.role === "mercenary");
        if (!merc || !merc.mercenaryContactedBy || merc.mercenaryContactedBy === "mafia") return [];
        if (me.id !== merc.id && me.id !== merc.mercenaryContactPlayerId) return [];
        const contactPlayer = state.players.find((p) => p.id === merc.mercenaryContactPlayerId);
        return [merc.name, contactPlayer?.name].filter(Boolean);
      })(),
      wardenChat: (() => {
        if (!me || !me.alive || state.phase !== "night") return [];
        const warden = state.players.find((p) => p.role === "warden" && p.alive && !p.inJail && !isAbilityDisabled(p));
        const jailed = state.players.filter((p) => p.inJail && p.alive);
        if (!warden || jailed.length === 0) return [];
        if (me.id !== warden.id && !me.inJail) return [];
        return [warden.name, ...jailed.map((p) => p.name)];
      })(),
      medium:
        me && ((me.alive && actsAsRole(me, "medium")) || (!me.alive && !me.soulHarvested))
          ? state.players.filter((p) => (p.alive && actsAsRole(p, "medium")) || (!p.alive && !p.soulHarvested)).map((p) => p.name)
          : [],
    },
  };

  return { ...base, ...myPrivate, alertPublic: alertPublic(state) };
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
    nightSaveHappened: state.nightSaveHappened, nightSavedName: state.nightSavedName,
    hitmanKillVictimId: state.hitmanKillVictimId, hitmanKillVictimName: state.hitmanKillVictimName,
    soloKillVictimId: state.soloKillVictimId, soloKillVictimName: state.soloKillVictimName,
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
    extraCurseVictimNames: state.extraCurseVictimNames || [],
    ancientCurseVictimNames: state.ancientCurseVictimNames || [],
    extraNightDeaths: state.extraNightDeaths || [],
    arsonVictimNames: state.arsonVictimNames || [], hospitalizedName: state.hospitalizedName || null, traffickedName: state.traffickedName || null,
    werewolfVictimName: state.werewolfVictimName,
    priestReviveName: state.priestReviveName,
    idolMessage: state.idolMessage,
    judgePardonResult: state.judgePardonResult,
    sheriffElectedName: state.sheriffElectedName,
    sheriffElectionVotes: state.phase === "sheriffElectionVote" ? state.sheriffElectionVotes : undefined,
    sheriffRunoffCandidates: state.sheriffRunoffCandidates,
    sheriffDesignateResult: state.sheriffDesignateResult,
    sheriffDesignatedTarget: state.sheriffDesignatedTarget,
    sheriffDefenseText: state.sheriffDefenseText,
    sheriffExecutionResult: state.sheriffExecutionResult,
    sheriffJustJailedName: state.sheriffJustJailedName,
    bodyguardSaveResult: state.bodyguardSaveResult,
    catAppearedName: state.catAppearedName,
    avengerKillResult: state.avengerKillResult,
    curseCastName: state.curseCastName,
    nightLordResult: state.nightLordResult || null,
    bodyguardLastWord: state.bodyguardLastWord || null,
    nightSaveBy: state.nightSaveBy || null,
    dictatorResult: state.dictatorResult || null,
    judgeRulingResult: state.judgeRulingResult || null,
    judgePleaResult: state.judgePleaResult || null,
    verdictByPriest: !!state.inquisitionBy,
    winner: state.winner,
    teamCounts: computeTeamCounts(state.players, state.initialRoles),
  };
}

/** 관전 화면 참여자 목록 옆에 표시할 팀별 생존 인원과 그중 특수직업 수를 계산한다. */
function computeTeamCounts(players, initialRoles) {
  // 게임 시작 시점 직업 배정 기준으로 고정 표시한다 - 죽거나 흡혈귀로 전환되거나,
  // 백수가 나중에 다른 직업을 물려받아도 이 숫자는 절대 바뀌지 않는다.
  const roleOf = (p) => (initialRoles && initialRoles[p.id]) || p.role;
  const mafiaPlayers = players.filter((p) => ROLES[roleOf(p)].team === "mafia");
  const citizenPlayers = players.filter((p) => ROLES[roleOf(p)].team === "citizen");
  const neutralPlayers = players.filter((p) => ROLES[roleOf(p)].team === "neutral");
  return {
    mafia: {
      total: mafiaPlayers.length,
      mafia: mafiaPlayers.filter((p) => roleOf(p) === "mafia").length,
      special: mafiaPlayers.filter((p) => roleOf(p) !== "mafia").length,
    },
    // 시민(순수)은 필수도 특수도 일반직업도 아니고, 경찰·의사는 필수직업, 연인 등은 일반직업이라 "특수직업" 수에서 전부 제외한다.
    citizen: {
      total: citizenPlayers.length,
      police: citizenPlayers.filter((p) => roleOf(p) === "police").length,
      doctor: citizenPlayers.filter((p) => roleOf(p) === "doctor").length,
      general: citizenPlayers.filter((p) => CITIZEN_GENERAL_ROLE_KEYS.includes(roleOf(p))).length,
      special: citizenPlayers.filter((p) => ![...CITIZEN_GENERAL_ROLE_KEYS, "citizen", "police", "doctor"].includes(roleOf(p))).length,
    },
    neutral: { total: neutralPlayers.length },
  };
}
