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

  // ── 처형 (낮 투표·보안관·이단심판) ──
  if (newlyExecuted.length > 0) {
    newlyExecuted.forEach((victim) => {
      const wasMafia = isMafiaAligned(before(victim.id));
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
