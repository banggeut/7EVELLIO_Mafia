/* ============================================================
   공개 알람 카드 순서·시간 규칙 (순수 JS, JSX 없음)
   ⚠ 이 파일은 client/src/alertEvents.js 와 server/src/alertEvents.js 에 "똑같은 내용"으로 두 벌 있다.
   - 클라이언트: 방송 화면·플레이어 화면이 어떤 카드를 어떤 순서로 보여줄지 정한다.
   - 서버: 그 카드들이 다 나올 때까지 아침/투표결과 타이머를 늘려서, 모두가 알람을 다 보고 다음 단계로 넘어가게 한다.
   한쪽을 고치면 반드시 다른 쪽도 똑같이 고칠 것.
   ============================================================ */

/* 7일차 능력으로 생긴 추가 공개 사망 소식 (저주 동시 발동, 고대 주술, 방화, 따로 안내되지 않은 밤사이 사망) */
export function extraNightEventList(state) {
  const arson = new Set(state.arsonVictimNames || []);
  return [
    ...(state.extraCurseVictimNames || []).map((name) => ({ kind: "curseDeath", name })),
    ...(state.ancientCurseVictimNames || []).map((name) => ({ kind: "curseDeath", name })),
    ...((state.arsonVictimNames || []).length ? [{ kind: "arson", name: state.arsonVictimNames.join(", ") }] : []),
    ...(state.extraNightDeaths || []).filter((d) => !arson.has(d.name)).map((d) => ({ kind: "nightDeath", name: d.name })),
  ];
}
export function hasExtraNightEvents(state) { return extraNightEventList(state).length > 0; }


/** 카드 한 장이 떠 있는 시간. 남은 카드가 많으면(사건이 몰린 밤) 조금 빠르게 넘겨서 토론 화면이 너무 오래 가려지지 않게 한다. */
export function cardShowMs(kind, remaining) {
  if (kind === "sunrise") return 2400;
  if (kind === "news") return remaining > 6 ? 4200 : 5200;
  return remaining > 8 ? 2700 : remaining > 5 ? 3100 : 3600;
}

/** 아침 카드 정리: 흩어진 "사망한 채로 발견" 카드를 한 장으로 합친다 (이름은 가나다순 - 순서로 누가 누구와 엮였는지 드러나지 않게). */
export function groupNightDeaths(events) {
  const deaths = events.filter((e) => e.kind === "nightDeath" && e.name);
  if (deaths.length < 2) return events;
  const names = [...new Set(deaths.map((e) => e.name))].sort((a, b) => a.localeCompare(b, "ko"));
  const firstIdx = events.findIndex((e) => e.kind === "nightDeath");
  const rest = events.filter((e) => e.kind !== "nightDeath");
  rest.splice(Math.min(firstIdx, rest.length), 0, { kind: "nightDeath", name: names.join(", "), count: names.length });
  return rest;
}


/** 단계 전환 한 번에 대해: 전환 키(같은 전환 중복 처리 방지), 큐 처리 방식, 카드 목록, 방송 화면이 울릴 단계 효과음 */
export function alertTransition(state) {
    // 단순히 phase 문자열만 비교하면, "morning" 상태로 두 번 이상 갱신이 오는 경우(예: 재연결, 순서가
    // 어긋난 브로드캐스트) 중 첫 번째에 아직 반영 안 된 밤 결과(예: 마녀 저주 발동)가 나중에 도착해도
    // "이미 morning이었으니 처리 안 함"으로 조용히 씹혀버리는 문제가 있었다. 그래서 morning 단계에서는
    // 단계 이름뿐 아니라 이번 밤에 실제로 일어난 사건들의 내용까지 합쳐서 키로 삼아, 내용이 달라지면
    // (설령 phase 문자열은 "morning" 그대로여도) 다시 큐를 만들도록 한다.
    const nightEventsSignature = state.phase === "morning"
      ? JSON.stringify({
          d: state.lastNightDeath, cv: state.curseVictimName, cc: state.curseCastName,
          wv: state.werewolfVictimName, vf: state.vampireFightResult, ak: state.avengerKillResult,
          hk: state.hitmanKillVictimId, sk: state.soloKillVictimId,
          pr: state.priestReviveName, jp: state.judgePardonResult, bg: state.bodyguardSaveResult,
          ca: state.catAppearedName, rr: state.reporterReveal, vs: state.veteranSurvivedName,
          ns: state.nightSaveHappened, nsn: state.nightSavedName, tb: state.terroristBombVictimName,
          nl: state.nightLordResult, lw: state.bodyguardLastWord,
          ex: extraNightEventList(state),
        })
      : state.phase === "sheriffDefense" ? `${state.sheriffDesignatedTarget}:${state.verdictByPriest ? "p" : "s"}` : "";
    const key = `${state.dayNumber}:${state.phase}:${nightEventsSignature}`;


    if (state.phase === "night") return { key, mode: "clear", events: [], sound: "night_fall" };
    // vote/sheriffElectionVote는 관리자가 "강제 스킵"을 빠르게 눌러 단계를 빨리 넘기면, 아직 다 못 보여준
    // 아침 카드가 남아있는 채로 이 단계에 도달할 수 있다. 그런 경우에도 카드를 끊지 않고 끝까지 보여준다.
    if (state.phase === "vote") return { key, mode: "enqueue", events: [], sound: "vote_start" };
    if (state.phase === "sheriffElectionVote") return { key, mode: "enqueue", events: [], sound: "vote_start" };
    if (state.phase === "sheriffDefense") {
      const sheriffTarget = state.players.find((p) => p.id === state.sheriffDesignatedTarget);
      return { key, mode: "replace", events: [{ kind: state.verdictByPriest ? "inquisition" : "sheriffDesignate", name: sheriffTarget?.name }], sound: state.verdictByPriest ? null : "sheriff_designate" };
    }
    if (state.phase === "officialPick") return { key, mode: "enqueue", events: [], sound: "official_pick" };
    if (state.phase === "gameover") {
      return { key, mode: "clear", events: [], sound: "gameover" };
    }
    // 처형 결과는 바로 뒤에 뜨는 "executed" 카드가 효과음(의사봉 + 징)을 함께 울리므로 여기서는 따로 재생하지 않는다.

    if (state.phase === "morning") {
      const events = [{ kind: "sunrise" }];
      // [밤의 지배자] - 그 밤의 모든 사건보다 먼저, 어둠이 마을을 덮었다는 사실부터 알린다.
      if (state.nightLordResult) events.push({ kind: "nightLord" });
      // 마피아의 공격과는 별개로 뜨는 사건들이 하나라도 있다면, 그 밤은 절대 "평화로운 밤"이 아니다.
      const hadOtherEvent = !!(state.werewolfVictimName || state.curseVictimName || state.vampireFightResult || state.avengerKillResult || state.priestReviveName || state.catAppearedName || state.bodyguardSaveResult || state.judgePardonResult || state.veteranSurvivedName || state.nightLordResult || hasExtraNightEvents(state));
      if (state.lastNightDeath) {
        const p = state.players.find((x) => x.id === state.lastNightDeath);
        events.push({ kind: "nightDeath", name: p?.name });
      } else if (!hadOtherEvent && !state.nightSaveHappened) {
        events.push({ kind: "peaceful" });
      }
      // 군인의 방어도 마피아의 다른 습격과는 완전히 별개 사건일 수 있다(예: 마피아가 다른 사람을 죽인 같은
      // 밤에 군인도 습격당했지만 버텨낸 경우). 조용히 묻히지 않도록 항상 독립적으로 큐에 추가한다.
      if (state.veteranSurvivedName) {
        events.push({ kind: "veteranSurvived", name: state.veteranSurvivedName });
      }
      // 의사의 보호로 누군가 목숨을 건진 것도 마피아의 습격과는 완전히 별개 사건일 수 있다(예: 히트맨의 공격을
      // 막아낸 경우). 그날 밤 다른 사망이 있었더라도 조용히 묻히지 않도록 항상 독립적으로 큐에 추가한다.
      if (state.nightSaveHappened) {
        events.push({ kind: state.nightSaveBy === "saint" ? "saintSave" : state.nightSaveBy === "bodyguard" ? "eliteSave" : "nightSave", name: state.nightSavedName, by: state.nightSaveBy });
      }
      // 히트맨의 암살은 마피아의 집단 습격과는 완전히 별개 사건이다. 같은 밤에 마피아가 다른 사람을
      // 죽였다면 lastNightDeath 자리는 그쪽이 이미 차지하므로, 히트맨의 희생자가 다르면 따로 보여준다.
      if (state.hitmanKillVictimName && state.hitmanKillVictimId !== state.lastNightDeath) {
        events.push({ kind: "nightDeath", name: state.hitmanKillVictimName });
      }
      // 용병/건달의 독립적인 킬도 마피아의 집단 습격과는 완전히 별개 사건이다. 같은 이유로 따로 보여준다.
      if (state.soloKillVictimName && state.soloKillVictimId !== state.lastNightDeath && state.soloKillVictimId !== state.hitmanKillVictimId) {
        events.push({ kind: "nightDeath", name: state.soloKillVictimName });
      }
      // 뱀파이어-마피아 격돌은 마피아의 집단 공격과는 완전히 별개 사건이라, 같은 밤에 다른 사망이
      // 있었더라도 항상 독립적으로 큐에 추가한다. 또한 누가 누구와 싸워 죽었는지(연결 관계) 자체가
      // 단서가 되므로, 통합된 하나의 알람이 아니라 서로 무관한 두 개의 일반 사망 알람으로 완전히 분리한다.
      if (state.vampireFightResult) {
        events.push({ kind: "nightDeath", name: state.vampireFightResult.vampireName });
        events.push({ kind: "nightDeath", name: state.vampireFightResult.mafiaName });
      }
      // 복수자의 복수 킬도 마피아의 습격과는 완전히 별개 사건이라 항상 독립적으로 큐에 추가한다.
      if (state.avengerKillResult) {
        events.push({ kind: "bloodRevenge", targetName: state.avengerKillResult.targetName });
      }
      // 늑대인간의 습격도 마피아의 습격과는 완전히 별개 사건이라 항상 독립적으로 큐에 추가한다.
      if (state.werewolfVictimName) {
        events.push({ kind: "werewolfAttack", name: state.werewolfVictimName });
      }
      // 성직자의 부활도 마피아의 습격과는 완전히 별개 사건이라 항상 독립적으로 큐에 추가한다.
      if (state.priestReviveName) {
        events.push({ kind: "priestRevive", name: state.priestReviveName });
      }
      // 판사의 사면도 항상 독립적으로 큐에 추가한다.
      if (state.judgePardonResult) {
        events.push({ kind: "judgePardon", name: state.judgePardonResult.name });
      }
      // 경호원의 희생도 항상 독립적으로 큐에 추가한다.
      if (state.bodyguardSaveResult) {
        events.push({ kind: "bodyguardSave", targetName: state.bodyguardSaveResult.targetName, bodyguardName: state.bodyguardSaveResult.bodyguardName, attackerName: state.bodyguardSaveResult.attackerName });
      }
      if (state.bodyguardLastWord) {
        events.push({ kind: "lastWord", bodyguardName: state.bodyguardLastWord.bodyguardName, killerName: state.bodyguardLastWord.killerName });
      }
      // 고양이 등장은 1일차 아침에만 뜨는 특별 이벤트.
      if (state.catAppearedName) {
        events.push({ kind: "catAppeared", name: state.catAppearedName });
      }
      if (state.reporterReveal) {
        events.push({ kind: "news", name: state.reporterReveal.name, roleLabel: state.reporterReveal.roleLabel });
      }
      // 마녀의 저주는 마피아의 습격과 완전히 별개 사건. 시전(3일 후 발동 예고)과 발동(사망)은
      // 서로 다른 날 아침에 각각 일어나므로, 그날 해당하는 카드만 큐에 넣는다.
      if (state.curseCastName) {
        events.push({ kind: "curseAnnounced", name: state.curseCastName });
      }
      if (state.curseVictimName) {
        events.push({ kind: "curseDeath", name: state.curseVictimName });
      }
      events.push(...extraNightEventList(state));
      // 보안관이 없다면(처음부터 없었거나, 어제 감옥에 가서 자리가 비었거나) 오늘은 선출이 필요하다는 안내도
      // 지난밤 소식들과 같은 방식으로 연출 큐 맨 끝에 넣는다.
      const hasActiveSheriff = state.players.some((p) => p.isSheriff && p.alive && !p.inJail);
      if (!hasActiveSheriff) {
        events.push({ kind: "sheriffNeeded" });
      }
      return { key, mode: "enqueue", events: groupNightDeaths(events), sound: "day_break" };
    }

    if (state.phase === "voteresult") {
      const events = [];
      if (state.lastEliminated) {
        const p = state.players.find((x) => x.id === state.lastEliminated);
        events.push({ kind: "executed", name: p?.name, isMafia: p?.isMafia });
        if (state.judgeRulingResult) events.push({ kind: "judgeRuling", name: state.judgeRulingResult.name, roleLabel: state.judgeRulingResult.roleLabel });
        if (state.terroristBombVictimName) events.push({ kind: "bomb", name: state.terroristBombVictimName });
      } else if (state.judgePleaResult) {
        events.push({ kind: "judgePlea", ...state.judgePleaResult });
      } else if (state.politicianSaved) {
        const nom = state.players.find((x) => x.id === state.nominee);
        events.push({ kind: "politicianSaved", name: nom?.name });
      } else {
        events.push({ kind: "noExecution" });
      }
      return { key, mode: "enqueue", events };
    }

    if (state.phase === "discussion") {
      const events = [];
      if (state.dictatorResult) events.push({ kind: "dictator", name: state.dictatorResult.name });
      if (state.sheriffElectedName) events.push({ kind: "sheriffElected", name: state.sheriffElectedName });
      if (state.sheriffJustJailedName) {
        // 무고한 사람을 처형해 감옥에 간 경우 - "마피아가 아니었다"는 별도 처형결과 카드 없이,
        // 감옥행 알림 하나로 충분히 전달되므로 그것만 보여준다.
        events.push({ kind: "sheriffJailed", name: state.sheriffJustJailedName });
      } else if (state.sheriffExecutionResult) {
        events.push({ kind: state.sheriffExecutionResult.byPriest ? "inquisitionExecuted" : "sheriffExecuted", targetName: state.sheriffExecutionResult.targetName, wasMafia: state.sheriffExecutionResult.wasMafia });
      }
      // 보안관이 테러리스트를 즉결처형한 경우, 자폭 대상은 무조건 보안관 본인이다 - 이것도 별도로 보여준다.
      if (state.terroristBombVictimName) events.push({ kind: "bomb", name: state.terroristBombVictimName });
      return { key, mode: "enqueue", events };
    }

    // 여기로 떨어지는 단계(예: sheriffElection)는 그 자체로 보여줄 카드가 없지만, 그렇다고 무작정
    // setQueue([])로 끊어버리면 아직 안 보여준 아침 카드가 남아있을 때 통째로 사라진다.
    // enqueueEvents([])는 진행 중인 시퀀스는 그대로 두고, 진행 중이 아닐 때만 안전하게 비운다.
    return { key, mode: "enqueue", events: [] };
}



/** 카드 목록 전체가 재생되는 데 걸리는 시간(ms) - 카드마다 표시 시간 + 페이드아웃 간격 700ms */
export function alertSequenceMs(events) {
  return events.reduce((sum, e, i) => sum + cardShowMs(e.kind, events.length - i) + 700, 0);
}
