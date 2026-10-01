import { isMafiaAligned, isCitizenAligned, CITIZEN_SPECIAL_ROLES, ROLES } from "./gameEngine.js";

/* ============================================================
   업적 진행도 추적기
   게임 규칙(gameEngine.js)은 건드리지 않고, 단계가 바뀔 때마다 "직전 상태 → 다음 상태"를 비교해서
   7일차 능력으로 달성하는 업적의 진행도를 state.achv[플레이어id]에 쌓아둔다.
   게임이 끝나면 roomManager.recordGameStats가 이 기록 + 최종 생존/승리 여부로 업적을 수여한다.
   ============================================================ */

const FORCED_OR_SPECIAL_CITIZEN = new Set(CITIZEN_SPECIAL_ROLES); // 경찰·의사(필수) + 시민팀 특수직업 전부

function bump(achv, id, key, n = 1) {
  const cur = achv[id] || {};
  achv[id] = { ...cur, [key]: (cur[key] || 0) + n };
}
function flag(achv, id, key, value = true) {
  achv[id] = { ...(achv[id] || {}), [key]: value };
}

export function trackAchievements(prev, next) {
  if (!prev || !next || prev === next || !prev.players || !next.players) return next;
  const achv = { ...(next.achv || prev.achv || {}) };
  const before = (id) => prev.players.find((p) => p.id === id);
  const byName = (name) => next.players.find((p) => p.name === name);
  const roleHolder = (role) => prev.players.find((p) => p.role === role);
  // 이번 전환에서 새로 죽은 사람들
  const newlyDead = next.players.filter((p) => !p.alive && before(p.id)?.alive);
  const newlyExecuted = newlyDead.filter((p) => p.deathCause === "execution");

  // ── 밤이 끝나는 순간 (밤 결과가 막 계산된 상태) ──
  if (prev.phase === "night" && next.phase !== "night") {
    // [전설급] 의사가 "같은 사람"을 몇 번 살렸는지
    if (next.nightSaveHappened && next.nightSaveBy === "doctor" && next.nightSavedName) {
      const doc = roleHolder("doctor");
      const saved = byName(next.nightSavedName);
      if (doc && saved) {
        const rec = achv[doc.id] || {};
        const map = { ...(rec.lgSaveCounts || {}) };
        map[saved.id] = (map[saved.id] || 0) + 1;
        flag(achv, doc.id, "lgSaveCounts", map);
      }
    }

    // [전설급] 경호원이 그 밤에 누구를 지키고 있었는지 - "누명도 업무의 일부" 판정용.
    // 밤마다 덮어써서 "마지막으로 경호하던 사람"이 남는다.
    if (prev.bodyguardTarget) {
      const bg = prev.players.find((p) => p.role === "bodyguard" && p.alive && !p.inJail);
      if (bg && bg.id !== prev.bodyguardTarget) flag(achv, bg.id, "lgGuardLastTarget", prev.bodyguardTarget);
    }

    // [전설급] 테러리스트가 방화·자폭으로 보낸 사람 수 - "오늘은 쉬는 날"(0명) 판정용
    const terrorist = roleHolder("terrorist");
    if (terrorist) {
      const boom = (next.arsonVictimNames || []).length + (next.terroristBombVictimName ? 1 : 0);
      if (boom > 0) bump(achv, terrorist.id, "lgTerrorKills", boom);
    }

    // [중간] 마피아팀의 밤 지목이 만장일치였는지 - "손발이 척척" 판정용.
    // 그 밤에 실제로 표를 던진 마피아팀 전원에게 쌓는다.
    const mv = Object.entries(prev.mafiaVotes || {});
    if (mv.length >= 2 && mv.every(([, t]) => t && t === mv[0][1])) {
      mv.forEach(([voterId]) => bump(achv, voterId, "midMafiaSync"));
    }

    // [중간] 용병이 의뢰를 받은 뒤 처치한 사람 수 - "계약은 계약이니까" 판정용
    const mercKills = newlyDead.filter((p) => p.deathCause === "mercenary").length;
    if (mercKills > 0) {
      const merc = roleHolder("mercenary");
      if (merc) bump(achv, merc.id, "midMercKills", mercKills);
    }

    // [중간] 사기꾼이 누구로 위장했는지 - "고인의 명의로" 판정용.
    // 위장은 게임당 한 번뿐이라 처음 정해지는 순간만 기록하면 된다.
    const con = next.players.find((p) => p.role === "conartist");
    if (con && con.disguisedAs && !before(con.id)?.disguisedAs && prev.conartistTarget) {
      flag(achv, con.id, "midConTargetId", prev.conartistTarget);
    }

    // [중간] 히트맨의 암살 시도와 적중 - "명단은 외우고 다닙니다" 판정용.
    // 시도한 밤마다 시도 수를 올리고, 그 대상이 실제로 암살당했을 때만 적중 수를 올린다.
    const hitman = roleHolder("hitman");
    if (hitman) {
      [prev.hitmanTargetId, prev.hitmanSecondTargetId].filter(Boolean).forEach((tid) => {
        bump(achv, hitman.id, "midHitTry");
        if (newlyDead.some((d) => d.id === tid && d.deathCause === "hitman")) bump(achv, hitman.id, "midHitHit");
      });
    }

    // [중간] 마담이 어떤 직업을 막았는지 - "두 분 다 오늘은 쉬세요" 판정용
    if (prev.blockerTarget) {
      const madam = roleHolder("blocker");
      const victim = before(prev.blockerTarget);
      if (madam && victim) {
        const seen = new Set(achv[madam.id]?.midBlockedRoles || []);
        seen.add(victim.role);
        flag(achv, madam.id, "midBlockedRoles", [...seen]);
      }
    }

    // [중간] 기자의 특종이 마피아팀이 아닌 사람을 가리켰는지 - "오보였습니다" 판정용
    if (next.reporterReveal && next.reporterReveal !== prev.reporterReveal) {
      const rep = roleHolder("reporter");
      const shown = byName(next.reporterReveal.name);
      if (rep && shown && !isMafiaAligned(shown)) flag(achv, rep.id, "midScoopMissed");
    }

    // [중간] 교사가 지금까지 어떤 직업을 가르쳤는지 - "조기 졸업"(한 우물만 파기) 판정용.
    // 중간에 다른 직업으로 갈아타면 그동안 쌓은 수업이 헛수고가 되므로, 종류가 하나뿐이어야 한다.
    const lesson = next.teacherLessonResult;
    if (lesson?.roleKey && lesson !== prev.teacherLessonResult) {
      const teach = next.players.find((p) => p.role === "teacher");
      if (teach) {
        const taught = new Set(achv[teach.id]?.midTaughtRoles || []);
        taught.add(lesson.roleKey);
        flag(achv, teach.id, "midTaughtRoles", [...taught]);
      }
    }

    // [중간] 학생이 졸업했는지 - 교사 쪽에 기록해 둔다.
    next.players.forEach((p) => {
      if (p.studentGraduatedSuccessfully && !before(p.id)?.studentGraduatedSuccessfully && p.partnerId) {
        flag(achv, p.partnerId, "midGraduated", true);
      }
    });

    // [정산용] 마피아팀의 밤 처치 수. 누가 찔렀는지는 엔진이 무작위로 정하므로(투표한 마피아 중 한 명),
    // 개인에게 귀속시키지 않고 그 밤에 살아있던 마피아팀 전원의 공동 성과로 쌓는다.
    const mafiaKills = newlyDead.filter((p) => p.deathCause === "mafia").length;
    if (mafiaKills > 0) {
      prev.players.filter((p) => p.alive && isMafiaAligned(p)).forEach((m) => bump(achv, m.id, "scMafiaNightKills", mafiaKills));
    }
    // 바이러스 - 감염 성공 횟수
    const framer = roleHolder("framer");
    if (framer && framer.powerUpgrade === "framer_virus" && next.virusResult?.success) bump(achv, framer.id, "virusSuccess");

    // 암살 - 스파이의 [암살]로 죽은 사람 수
    newlyDead.filter((p) => p.deathCause === "spy").forEach((p) => {
      const spy = p.killedById ? before(p.killedById) : roleHolder("spy");
      if (spy && spy.role === "spy" && spy.powerUpgrade === "spy_assassin") bump(achv, spy.id, "assassinKills");
    });

    // 중독 - [독살]로 죽은 사람 수
    if (prev.hitmanPoisonTargetId) {
      const victim = newlyDead.find((p) => p.id === prev.hitmanPoisonTargetId && p.deathCause === "hitman");
      const hitman = roleHolder("hitman");
      if (victim && hitman && hitman.powerUpgrade === "hitman_poison") bump(achv, hitman.id, "poisonKills");
    }

    // FBI - [사살 작전]으로 '마피아'를 사살
    newlyDead.forEach((p) => {
      const shooter = p.killedById ? before(p.killedById) : null;
      if (shooter && shooter.role === "police" && shooter.powerUpgrade === "police_hitman" && before(p.id)?.role === "mafia") flag(achv, shooter.id, "fbiShotMafia");
    });

    // 활활 - 방화 한 번에 (테러리스트 본인 제외) 3명 이상
    if ((next.arsonVictimNames || []).length >= 4) {
      const terr = roleHolder("terrorist");
      if (terr) flag(achv, terr.id, "arsonBig");
    }

    // 고대 주술사 - 3명 이상에게 동시에 건 저주가 실제로 사람을 죽임
    if ((next.ancientCurseVictimNames || []).length > 0) {
      const witch = roleHolder("witch");
      if (witch && achv[witch.id]?.ancientBigCast) flag(achv, witch.id, "ancientKilled");
    }


    // 가짜뉴스 - 전설의 사기꾼이 기자로 변장해 특종으로 시민팀을 마피아로 공개
    const legend = next.conartistLegendResult;
    if (legend && legend.role === "reporter" && legend.roleLabel === ROLES.mafia.label) {
      const target = byName(legend.targetName);
      const con = roleHolder("conartist");
      if (con && target && isCitizenAligned(target) && !isMafiaAligned(target)) flag(achv, con.id, "fakeNews");
    }

    // 최고의 파트너 / 한번만 빌리겠습니다 - 빌린 능력 사용
    const pr = next.possessResult;
    if (pr && pr.actorId) {
      const actor = before(pr.actorId);
      if (actor?.role === "medium" && pr.role === "priest") flag(achv, actor.id, "possessRevive");
      if (actor?.role === "undertaker" && pr.role === "doctor" && pr.saved) flag(achv, actor.id, "relicProtect"); // 실제로 공격을 막아낸 경우만
    }

    // 성녀 - 보호 성공
    if (next.nightSaveHappened && next.nightSaveBy === "saint") {
      const priest = roleHolder("priest");
      if (priest) bump(achv, priest.id, "saintSaves");
    }

    // 불사신 - 죽었다가 성직자(빙의·전설 포함)에게 부활
    if (next.priestReviveName) {
      const revived = byName(next.priestReviveName);
      if (revived && !before(revived.id)?.alive && revived.alive) flag(achv, revived.id, "revived");
    }

    // 1급 공무원 - 행정조사로 마피아팀 확인 → 그날 낮 처형되면 달성
    if (next.officialAuditResult?.team === "mafia") {
      const official = roleHolder("official");
      const t = byName(next.officialAuditResult.targetName);
      if (official && t) flag(achv, official.id, "auditMafia", { targetId: t.id, day: next.dayNumber });
    }

    // 다잉메세지 - 결정적 유언으로 마피아팀 공개 → 그날 낮 처형되면 달성
    if (next.bodyguardLastWord) {
      const bg = byName(next.bodyguardLastWord.bodyguardName);
      const killer = byName(next.bodyguardLastWord.killerName);
      if (bg && killer && isMafiaAligned(killer)) flag(achv, bg.id, "lastWordMafia", { targetId: killer.id, day: next.dayNumber });
    }
  }

  // ── 밤 중 즉시 발동하는 능력 ──
  // 꼭두각시 - [정신 지배]로 새로 꼭두각시가 된 사람
  next.players.forEach((p) => {
    if (p.mindControlledBy && !before(p.id)?.mindControlledBy) {
      const list = new Set(achv[p.mindControlledBy]?.controlledIds || []);
      list.add(p.id);
      flag(achv, p.mindControlledBy, "controlledIds", [...list]);
    }
  });
  // 고대 주술사 - 시전 순간 3명 이상 저주
  if ((prev.ancientCurseIds || []).length === 0 && (next.ancientCurseIds || []).length >= 3) {
    const witch = next.players.find((p) => p.role === "witch" && p.witchAncientUsed);
    if (witch) flag(achv, witch.id, "ancientBigCast");
  }

  // [전설급] 최후 변론대(또는 보안관 처형대)에 올라간 적이 있는지 - "한 번도 의심받지 않음" 판정용.
  // 횟수도 같이 세어 둔다 - "신분증은 못 보여드립니다"는 두 번 서고 두 번 다 살아 돌아와야 한다.
  if (next.nominee && next.nominee !== prev.nominee) {
    flag(achv, next.nominee, "lgWasNominated");
    bump(achv, next.nominee, "lgNominateCount");
  }
  if (next.sheriffDesignatedTarget && next.sheriffDesignatedTarget !== prev.sheriffDesignatedTarget) {
    flag(achv, next.sheriffDesignatedTarget, "lgWasNominated");
    bump(achv, next.sheriffDesignatedTarget, "lgNominateCount");
  }

  // [전설급] 능력을 봉인당하거나 영구히 잃은 적이 있는지 - "기도는 막히지 않습니다" 판정용
  next.players.forEach((p) => {
    const was = before(p.id);
    if (!was) return;
    if ((p.abilitySealed && !was.abilitySealed) || (p.abilityLost && !was.abilityLost)) flag(achv, p.id, "lgSealedEver");
  });

  // [전설급] 마피아팀에 혼자만 남은 순간이 있었는지 - "마지막 마녀" 판정용
  const mafiaAliveNow = next.players.filter((p) => p.alive && !p.inJail && isMafiaAligned(p));
  if (mafiaAliveNow.length === 1) flag(achv, mafiaAliveNow[0].id, "lgLastOneStanding");

  // [전설급] 테러리스트가 자폭 대상을 지목한 적이 있는지 - "오늘은 쉬는 날"(능력 미사용) 판정용
  if (next.terroristSelfdestructTarget && !prev.terroristSelfdestructTarget) {
    const terr = next.players.find((p) => p.role === "terrorist");
    if (terr) flag(achv, terr.id, "lgTerrorSelfdestruct");
  }

  // [전설급] 낮 투표에 한 번이라도 참여했는지 - "밤에만 일합니다" 판정용
  Object.keys(next.votes || {}).forEach((voterId) => flag(achv, voterId, "lgDidVote"));
  Object.keys(next.finalVotes || {}).forEach((voterId) => flag(achv, voterId, "lgDidVote"));

  // [중간] 피싱이 문자를 돌린 횟수 - "수신거부는 안 받습니다" 판정용
  if (next.idolMessage && next.idolMessage !== prev.idolMessage) {
    const idol = next.players.find((p) => p.role === "idol");
    if (idol) bump(achv, idol.id, "midIdolSends");
  }

  // [중간] 검시관이 부검으로 밝혀낸 "서로 다른" 사인 - "다 다르게 죽으셨네요" 판정용.
  // flavor는 사인별로 고정된 문구라 종류를 세는 열쇠로 쓸 수 있다.
  if (next.coronerResult && next.coronerResult !== prev.coronerResult && next.coronerResult.flavor) {
    const cor = next.players.find((p) => p.role === "coroner");
    if (cor) {
      const seen = new Set(achv[cor.id]?.midCoronerFlavors || []);
      seen.add(next.coronerResult.flavor);
      flag(achv, cor.id, "midCoronerFlavors", [...seen]);
    }
  }

  // [중간] 낮 투표가 마감되는 순간, 각자 던진 표가 마피아팀이었는지 - "제 촉은 틀린 적이 없어요" 판정용.
  // 투표 도중엔 표를 바꿀 수 있으므로, 단계를 벗어나는 순간의 최종 표만 본다.
  if (prev.phase === "vote" && next.phase !== "vote") {
    Object.entries(prev.votes || {}).forEach(([voterId, targetId]) => {
      const target = prev.players.find((p) => p.id === targetId);
      if (!target || voterId === targetId) return;
      if (isMafiaAligned(target)) bump(achv, voterId, "midVoteOnMafia");
      else flag(achv, voterId, "midVoteMissed");
    });

    // [중간] 투표할 수 있었는데 안 한 적이 있는지 - "무단결근은 없습니다" 판정용.
    // 투표권을 빼앗겼거나(마담·유괴범·학생 등) 애초에 투표권이 없는 고양이는 결근으로 치지 않는다.
    const cantVote = new Set([prev.blockedVoterId, prev.extraBlockedVoterId, prev.possessBlockedVoterId,
      prev.studentBlockedVoterId, prev.catVoteRemovedId].filter(Boolean));
    prev.players.forEach((p) => {
      if (!p.alive || p.inJail || p.role === "cat" || cantVote.has(p.id)) return;
      if (prev.votes?.[p.id]) bump(achv, p.id, "midVotesCast");
      else flag(achv, p.id, "midSkippedVote");
    });
  }

  // [중간] 정치인이 최다 득표로 지목되고도 처형 면책으로 살아난 횟수 - "의혹은 모두 사실무근입니다" 판정용
  if (next.politicianSaved && !prev.politicianSaved) {
    const poli = next.players.find((p) => p.role === "politician");
    if (poli) bump(achv, poli.id, "midPoliSaved");
  }

  // [중간] 판사가 처형을 기각해 살려준 사람 - "무죄를 선고합니다" 판정용.
  // 판결이 끝나는 순간 지목자가 아직 살아 있으면 기각된 것이다.
  if (prev.phase === "judgeverdict" && next.phase !== "judgeverdict" && prev.nominee && !next.politicianSaved) {
    const judge = prev.players.find((p) => p.role === "judge" && p.alive);
    const spared = next.players.find((p) => p.id === prev.nominee);
    // 정치인이라 애초에 처형되지 않았거나, 사법거래로 감옥에 넣은 경우는 "살려준" 것이 아니다.
    if (judge && spared && spared.alive && !spared.inJail) {
      if (isMafiaAligned(spared)) flag(achv, judge.id, "midPardonedMafia");
      else bump(achv, judge.id, "midPardonedClean");
    }
  }

  // ── 처형 (낮 투표·보안관·이단심판) ──
  if (newlyExecuted.length > 0) {
    newlyExecuted.forEach((victim) => {
      const wasMafia = isMafiaAligned(before(victim.id));
      // 이 처형에 표를 보탠 사람들. 투표 기록은 하루가 지나면 지워지므로 여기서 그때그때 누적해 둬야 한다.
      const hit = new Set();
      Object.entries(prev.votes || {}).forEach(([voterId, targetId]) => { if (targetId === victim.id) hit.add(voterId); });
      Object.entries(prev.finalVotes || {}).forEach(([voterId, choice]) => { if (choice === "agree") hit.add(voterId); });

      // [정산용] 내가 투표한 사람이 처형됐고 그가 마피아팀이었다 - 시민팀 추리 성과
      if (wasMafia) {
        hit.forEach((voterId) => {
          const voter = before(voterId);
          // 마피아가 동료를 버리는 연기는 성과로 치지 않는다
          if (voter && voter.id !== victim.id && isCitizenAligned(voter)) bump(achv, voterId, "scVoteHitMafia");
        });
      }

      // [전설급] 마피아팀이 여론을 몰아 사람을 처형시킨 횟수 - "민심은 제가 만듭니다" 판정용.
      // 마피아팀을 하나라도 처형시켰으면(동료를 버렸으면) 자격이 사라진다.
      hit.forEach((voterId) => {
        const voter = before(voterId);
        if (!voter || voter.id === victim.id || !isMafiaAligned(voter)) return;
        if (wasMafia) flag(achv, voterId, "lgSteerHitMafia");
        else bump(achv, voterId, "lgSteerExec");
      });
      // [정산용] 보안관(또는 이단심판 집행자)이 마피아팀을 올바르게 처형
      if (prev.phase === "sheriffVerdict") {
        const executor = prev.inquisitionBy ? before(prev.inquisitionBy) : prev.players.find((p) => p.isSheriff);
        // [전설급] 보안관이 무고한 사람을 처형한 적이 있는지 - "한 번도 틀리지 않음" 판정용
        if (executor) { if (wasMafia) bump(achv, executor.id, "scSheriffMafiaExec"); else flag(achv, executor.id, "lgSheriffMiss"); }
      }
      // [중간] 유괴범이 입을 막아둔 사람이 그날 처형됨 - "말 못 할 사정이 있겠죠" 판정용
      if (prev.blockedChatterId === victim.id) {
        const sil = prev.players.find((p) => p.role === "silencer");
        if (sil) bump(achv, sil.id, "midSilenceExec");
      }

      // 1급 공무원 / 다잉메세지 - 지목된 대상이 그날 처형됨
      Object.entries(achv).forEach(([pid, rec]) => {
        if (rec.auditMafia && rec.auditMafia.targetId === victim.id && rec.auditMafia.day === prev.dayNumber) flag(achv, pid, "auditExecuted");
        if (rec.lastWordMafia && rec.lastWordMafia.targetId === victim.id && rec.lastWordMafia.day === prev.dayNumber) flag(achv, pid, "lastWordExecuted");
      });
      if (prev.phase === "sheriffVerdict" && wasMafia) {
        if (prev.inquisitionBy) {
          flag(achv, prev.inquisitionBy, "inquisitionMafia");
        } else {
          const sheriff = prev.players.find((p) => p.isSheriff);
          if (sheriff && sheriff.role === "politician" && sheriff.powerUpgrade === "politician_dictator") bump(achv, sheriff.id, "dictatorExecutions");
        }
      }
    });
  }

  // 폭발은 예술이다 - 처형된 [거대 폭탄] 테러리스트가 시민팀 필수·특수직업 2명을 함께 데려감
  const executedBomber = newlyExecuted.find((p) => p.role === "terrorist" && p.powerUpgrade === "terrorist_bigbomb");
  if (executedBomber) {
    const taken = newlyDead.filter((p) => p.deathCause === "terroristBomb" && isCitizenAligned(before(p.id)) && FORCED_OR_SPECIAL_CITIZEN.has(before(p.id).role));
    if (taken.length >= 2) flag(achv, executedBomber.id, "bigBombArt");
  }

  // 배신 - [사법거래]로 마피아팀 공개
  if (next.judgePleaResult?.exposedName && next.judgePleaResult !== prev.judgePleaResult) {
    const judge = next.players.find((p) => p.role === "judge" && p.judgePleaUsed);
    if (judge) flag(achv, judge.id, "pleaExposed");
  }

  // 내 이름은 라삐, 탐정이죠 - [명추리]로 범인이 마피아팀임을 밝힘
  if (next.detectiveDeduceResult && next.detectiveDeduceResult !== prev.detectiveDeduceResult) {
    const r = next.detectiveDeduceResult;
    const killer = r.killerName ? byName(r.killerName) : null;
    if (killer && !r.suicide && isMafiaAligned(killer)) flag(achv, r.actorId, "deduceMafia");
  }

  return { ...next, achv };
}

/** 게임이 끝났을 때, 이 플레이어가 7일차 능력 업적 중 무엇을 달성했는지 id 목록을 돌려준다. */
export function earnedPowerAchievements(game, p, won) {
  const players = game.players;
  const out = [];
  const rec = game.achv?.[p.id] || {};
  const survivedWin = p.alive && won;
  const up = p.powerUpgrade;
  if (p.role === "police" && p.recruitedToMafia && survivedWin) out.push("corrupt_cop");
  if (p.role === "framer" && up === "framer_virus" && (rec.virusSuccess || 0) >= 3) out.push("virus");
  if (p.role === "spy" && up === "spy_assassin" && (rec.assassinKills || 0) >= 3) out.push("assassination");
  if (p.role === "blocker" && up === "blocker_charm" && p.blockerCharmUsed && survivedWin) out.push("femme_fatale");
  if (p.role === "silencer" && up === "silencer_trafficking" && p.silencerTraffickingUsed && survivedWin) out.push("youve_been_kidnapped");
  if (p.role === "terrorist" && rec.bigBombArt) out.push("explosion_is_art");
  if (p.role === "terrorist" && rec.arsonBig) out.push("burn_burn");
  if (p.role === "witch" && rec.ancientBigCast && rec.ancientKilled) out.push("ancient_sorcerer");
  if (p.role === "witch" && up === "witch_mindcontrol" && survivedWin && (rec.controlledIds || []).some((id) => players.find((x) => x.id === id)?.alive)) out.push("puppet");
  if (p.role === "conartist" && rec.fakeNews) out.push("fake_news");
  if (p.role === "godfather" && up === "godfather_legend" && survivedWin) out.push("legend");
  if (p.role === "hitman" && up === "hitman_poison" && (rec.poisonKills || 0) >= 3 && survivedWin) out.push("poisoned");
  if (p.role === "police" && up === "police_hitman" && rec.fbiShotMafia && survivedWin) out.push("fbi");
  if (p.role === "medium" && up === "medium_possess" && rec.possessRevive && survivedWin) out.push("best_partner");
  if (p.role === "soldier" && up === "soldier_grit" && (p.defenseUsedCount || (p.usedDefense ? 1 : 0)) >= 1 && survivedWin) out.push("bring_it_on");
  if (p.role === "politician" && up === "politician_dictator" && (rec.dictatorExecutions || 0) >= 3 && survivedWin) out.push("dictator");
  if (p.role === "detective" && up === "detective_deduce" && rec.deduceMafia && survivedWin) out.push("my_name_is_rabbi");
  if (p.role === "veteran" && up === "veteran_will" && (p.defenseUsedCount || 0) >= 2 && rec.revived && survivedWin) out.push("immortal");
  if (p.role === "undertaker" && up === "undertaker_relic" && rec.relicProtect && survivedWin) out.push("just_borrowing");
  if (p.role === "judge" && up === "judge_plea" && rec.pleaExposed && survivedWin) out.push("betrayal");
  if (p.role === "official" && up === "official_audit" && rec.auditExecuted && survivedWin) out.push("first_class_official");
  if (p.role === "priest" && up === "priest_saint" && (rec.saintSaves || 0) >= 1 && survivedWin) out.push("saint");
  if (p.role === "priest" && up === "priest_inquisition" && rec.inquisitionMafia && survivedWin) out.push("inquisitor");
  if (p.role === "bodyguard" && up === "bodyguard_lastword" && rec.lastWordExecuted) out.push("dying_message");
  return out;
}
