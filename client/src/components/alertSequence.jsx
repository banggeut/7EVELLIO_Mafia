import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NoirIcon } from "./noirIcons.jsx";
import {
  playElimination, playMafiaKill, playDoctorSave, playNewsFlash, playDramaticHit, playCurse, playWerewolfHowl, playRevive, playMeow,
  playSample,
} from "../sound.js";
import { alertTransition, cardShowMs } from "../alertEvents.js";
export { alertTransition, cardShowMs, groupNightDeaths, extraNightEventList, hasExtraNightEvents, alertSequenceMs } from "../alertEvents.js";

/* ============================================================
   공개 알람 카드 연출 - 방송(스트리밍 모드) 화면과 플레이어 화면(PC·모바일)이 같이 쓴다.
   어떤 단계 전환에서 어떤 카드가 어떤 순서로 나오는지(alertTransition),
   카드 재생 타이머(useAlertSequence), 카드 모양(AlertCard)이 전부 여기 한 곳에 있어서
   두 화면의 연출 순서·시간이 항상 똑같다.
   ============================================================ */

/* 알림 카드 종류 → 방송 효과음 파일 이름 + 파일을 못 쓸 때의 합성음 대체 */
const ALERT_SAMPLES = {
  nightDeath: ["night_death", () => playMafiaKill()],
  bomb: ["bomb", () => playMafiaKill()],
  arson: ["bomb", () => playMafiaKill()],
  nightSave: ["doctor_save", () => playDoctorSave()],
  news: ["news_flash", () => playNewsFlash()],
  curseAnnounced: ["curse_announced", () => playCurse()],
  curseDeath: ["curse_death", () => playCurse()],
  sheriffNeeded: ["sheriff_needed", () => playNewsFlash()],
  werewolfAttack: ["werewolf_attack", () => playWerewolfHowl()],
  priestRevive: ["priest_revive", () => playRevive()],
  judgePardon: ["judge_pardon", () => playRevive()],
  catAppeared: ["cat_appeared", () => playMeow()],
  veteranSurvived: ["veteran_survived", () => playDramaticHit()],
  vampireFight: ["vampire_fight", () => playDramaticHit()],
  avengerKill: ["avenger_kill", () => playDramaticHit()],
  politicianSaved: ["politician_saved", () => playDramaticHit()],
  executed: ["execution", () => playElimination()],
  bodyguardSave: ["bodyguard_save", () => playDramaticHit()],
  sheriffElected: ["sheriff_elected", () => playRevive()],
  sheriffJailed: ["sheriff_jailed", () => playDramaticHit()],
  sheriffExecuted: ["sheriff_execute", () => playElimination()],
  peaceful: ["peaceful_morning", null],
  noExecution: ["vote_result", null],
  nightLord: ["night_lord", () => playDramaticHit()],
  bloodRevenge: ["blood_revenge", () => playDramaticHit()],
  lastWord: ["last_word", () => playNewsFlash()],
  dictator: ["dictator", () => playDramaticHit()],
  judgeRuling: ["judge_ruling", () => playNewsFlash()],
  judgePlea: ["judge_plea", () => playDramaticHit()],
  inquisition: ["inquisition", () => playDramaticHit()],
  inquisitionExecuted: ["inquisition_execute", () => playElimination()],
  saintSave: ["saint_save", () => playRevive()],
  eliteSave: ["elite_guard", () => playDoctorSave()],
};
export function playAlertSound(kind, gain = 1) {
  const entry = ALERT_SAMPLES[kind];
  if (!entry) return;
  playSample(entry[0], { gain, fallback: entry[1] || undefined });
}


export const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@600;700;900&family=Noto+Sans+KR:wght@400;600;700;900&family=Special+Elite&family=Courier+Prime:wght@700&display=swap');" +
  // 누아르 방송 연출 공용 키프레임
  "@keyframes noir-cone { 0%,100% { opacity: 0.85; } 50% { opacity: 1; } 93% { opacity: 1; } 94% { opacity: 0.55; } 95% { opacity: 1; } }" +
  "@keyframes noir-live { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }" +
  "@keyframes noir-timer-urgent { 0%,100% { text-shadow: 0 0 24px rgba(224,71,79,0.7); transform: scale(1); } 50% { text-shadow: 0 0 60px rgba(224,71,79,1), 0 0 4px #fff; transform: scale(1.03); } }" +
  "@keyframes noir-stamp { 0% { opacity: 0; transform: scale(2.2) rotate(-16deg); } 60% { opacity: 1; transform: scale(0.94) rotate(-7deg); } 100% { opacity: 1; transform: scale(1) rotate(-8deg); } }";


/* ---------- 페이드 인/아웃 스테이지 ---------- */
export function FadeStage({ visible, children }) {
  return (
    <div
      style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1) translateY(0px)" : "scale(0.93) translateY(22px)",
        transition: "opacity 750ms ease, transform 750ms ease",
      }}
    >
      <AutoFit>{children}</AutoFit>
    </div>
  );
}

export function GlowIcon({ theme, children, color, icon }) {
  const c = color || theme.accent;
  return (
    <div style={{ position: "relative", width: 340, height: 340, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
      {/* 머리 위에서 떨어지는 조명 한 줄기 */}
      <div style={{
        position: "absolute", left: "50%", top: -260, width: 520, height: 600, marginLeft: -260, pointerEvents: "none",
        background: `linear-gradient(180deg, ${c}00 0%, ${c}22 55%, ${c}10 100%)`,
        clipPath: "polygon(42% 0, 58% 0, 100% 100%, 0 100%)", filter: "blur(18px)",
        maskImage: "linear-gradient(180deg, transparent 0%, #000 50%, #000 78%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(180deg, transparent 0%, #000 50%, #000 78%, transparent 100%)",
        animation: "noir-cone 5s ease-in-out infinite",
      }} />
      {/* 바닥에 떨어진 조명 원 */}
      <div style={{
        position: "absolute", left: "50%", bottom: 6, width: 360, height: 70, marginLeft: -180, borderRadius: "50%",
        background: `radial-gradient(ellipse, ${c}40 0%, ${c}00 70%)`,
      }} />
      <div style={{
        position: "absolute", inset: 30, borderRadius: "50%",
        background: `radial-gradient(circle, ${c}33 0%, ${c}00 70%)`,
        animation: "levellio-pulse 2.6s ease-in-out infinite",
      }} />
      {icon ? (
        <div style={{ position: "relative", lineHeight: 0, filter: `drop-shadow(0 0 22px ${c}66) drop-shadow(0 24px 30px rgba(0,0,0,0.85))` }}>
          <NoirIcon name={icon} size={236} color={c} />
        </div>
      ) : (
        <div style={{ position: "relative", fontSize: 216, lineHeight: 1, filter: "saturate(0.7) contrast(1.1) drop-shadow(0 24px 30px rgba(0,0,0,0.85))" }}>{children}</div>
      )}
    </div>
  );
}


export function BigHeadline({ theme, children, size = 68 }) {
  return (
    <div style={{
      fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: size, color: theme.text, letterSpacing: "-0.01em",
      textAlign: "center", maxWidth: "var(--alert-max-w, 1400px)", lineHeight: 1.3, textShadow: "0 4px 0 rgba(0,0,0,0.6), 0 10px 40px rgba(0,0,0,0.9)", wordBreak: "keep-all", overflowWrap: "anywhere",
    }}>
      {children}
    </div>
  );
}
export function BigSubtext({ theme, children }) {
  return (
    <div style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: 30, fontWeight: 500, color: theme.sub, textAlign: "center", marginTop: 14, maxWidth: "var(--alert-sub-w, 1200px)", letterSpacing: "0.02em", textShadow: "0 2px 12px rgba(0,0,0,0.9)", wordBreak: "keep-all", overflowWrap: "anywhere" }}>
      {children}
    </div>
  );
}

/* ---------- 신문 호외 카드 (기자 특종 전용, 다른 연출과 확실히 구분) ---------- */
export function NewsFlashCard({ dayNumber, name, roleLabel }) {
  return (
    <div style={{
      width: "var(--alert-news-w, 1180px)", boxSizing: "border-box", borderRadius: 2, padding: "44px 60px 52px",
      background: "radial-gradient(ellipse at 50% 40%, #EFE4C6 0%, #DDCCA2 70%, #BFA979 100%)",
      boxShadow: "0 40px 90px rgba(0,0,0,0.85), inset 0 0 80px rgba(90,60,20,0.35)", transform: "rotate(-1.2deg)",
      border: "1px solid rgba(0,0,0,0.25)", filter: "sepia(0.15) contrast(1.05)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "4px solid #2A2418", paddingBottom: 14, marginBottom: 22 }}>
        <div style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: 34, letterSpacing: 2, color: "#2A2418" }}>
          레벨리오 일보 · 호외
        </div>
        <div style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: 22, color: "#8a7a52" }}>{dayNumber}일차 아침판</div>
      </div>
      <div style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: 54, color: "#2A2418", lineHeight: 1.35, marginBottom: 18 }}>
        단독) {name}, 정체는 <span style={{ color: "#9C2E28" }}>[{roleLabel}]</span>(으)로 밝혀져
      </div>
      <div style={{ height: 2, background: "repeating-linear-gradient(90deg,#2A2418 0 6px,transparent 6px 10px)", marginBottom: 18 }} />
      <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: 26, color: "#4a4028", lineHeight: 1.7, margin: 0 }}>
        본지 취재 결과 <b>{name}</b>님의 정체가 <b>{roleLabel}</b>(으)로 확인되었다.
        본지 기자는 어젯밤 현장을 취재해 이 같은 사실을 단독으로 입수했다.
      </p>
    </div>
  );
}


/** 내용이 영역보다 크면 통째로 줄여서(가운데 기준) 잘리지 않게 한다. 방송 화면은 1920x1080 고정이라 스크롤 대신 축소가 맞다. */
export function AutoFit({ children, min = 0.5 }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const outer = outerRef.current, inner = innerRef.current;
    if (!outer || !inner) return undefined;
    const fit = () => {
      const avail = outer.clientHeight - 8, need = inner.scrollHeight;
      const availW = outer.clientWidth - 8, needW = inner.scrollWidth;
      const k = Math.max(min, Math.min(1, need > 0 ? avail / need : 1, needW > 0 ? availW / needW : 1));
      setScale((prev) => (Math.abs(prev - k) > 0.01 ? k : prev));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(inner); ro.observe(outer);
    return () => ro.disconnect();
  }, [min]);
  return (
    <div ref={outerRef} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div ref={innerRef} style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: scale < 1 ? `scale(${scale})` : "none", transformOrigin: "center center" }}>
        {children}
      </div>
    </div>
  );
}


/** 단계 전환마다 카드 큐를 갱신하고, 카드를 한 장씩 보여준다. 방송 화면과 플레이어 화면이 같은 규칙으로 돈다. */
export function useAlertSequence(state, { onTransition, soundGain = 1, skipInitial = false } = {}) {
  // queue와 activeIndex를 하나의 상태로 합쳐서 항상 두 값을 한 번에 원자적으로 읽고 갱신한다.
  // id: 큐를 새로 갈아끼울 때마다 1씩 늘어난다. 같은 activeIndex(예: 0)로 새 큐가 시작돼도 카드 타이머가 확실히 다시 돌도록 하기 위함.
  const [sequence, setSequenceRaw] = useState({ queue: [], activeIndex: -1, id: 0 });
  const setSequence = (next) => setSequenceRaw((prev) => ({ ...next, id: prev.id + 1 }));
  const setActiveIndex = (updater) => setSequenceRaw((prev) => ({ ...prev, activeIndex: typeof updater === "function" ? updater(prev.activeIndex) : updater }));
  const [cardVisible, setCardVisible] = useState(false);
  const queueRef = useRef([]);
  const activeIndexRef = useRef(-1);
  const cardStartedAtRef = useRef(0);
  const prevKeyRef = useRef(null);
  const onTransitionRef = useRef(onTransition);
  onTransitionRef.current = onTransition;
  const { queue, activeIndex } = sequence;
  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { activeIndexRef.current = activeIndex; }, [activeIndex]);

  // 이전 시퀀스가 아직 재생 중이면 끊지 않고 뒤에 이어붙인다 (재생 중인 카드와 그 타이머는 그대로).
  const enqueueEvents = (newEvents) => {
    setSequenceRaw((prev) => {
      const inProgress = prev.activeIndex >= 0 && prev.activeIndex < prev.queue.length;
      if (inProgress) return { ...prev, queue: [...prev.queue, ...newEvents] };
      if (newEvents.length === 0) return prev.queue.length === 0 ? prev : { queue: [], activeIndex: -1, id: prev.id + 1 };
      return { queue: newEvents, activeIndex: 0, id: prev.id + 1 };
    });
  };

  useEffect(() => {
    if (!state) return;
    const t = alertTransition(state);
    const prev = prevKeyRef.current;
    prevKeyRef.current = t.key;
    if (prev === t.key) return;
    // 게임 도중에 새로 들어오거나 새로고침했을 때는, 이미 지나간 단계의 카드를 다시 틀지 않는다 (아침 발표 중이면 예외).
    if (prev === null && skipInitial && state.phase !== "morning") return;
    onTransitionRef.current?.(t, state);
    if (t.mode === "clear") setSequence({ queue: [], activeIndex: -1 });
    else if (t.mode === "replace") setSequence({ queue: t.events, activeIndex: t.events.length ? 0 : -1 });
    else enqueueEvents(t.events);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    const currentQueue = sequence.queue;
    if (activeIndex < 0 || activeIndex >= currentQueue.length) { setCardVisible(false); return undefined; }
    const kind = currentQueue[activeIndex].kind;
    setCardVisible(true);
    const soundTimer = setTimeout(() => playAlertSound(kind, soundGain), 150);
    const showMs = cardShowMs(kind, currentQueue.length - activeIndex);
    const hideTimer = setTimeout(() => setCardVisible(false), showMs);
    const nextTimer = setTimeout(() => setActiveIndex((i) => i + 1), showMs + 700);
    cardStartedAtRef.current = Date.now();
    return () => { clearTimeout(soundTimer); clearTimeout(hideTimer); clearTimeout(nextTimer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, sequence.id]);

  // 안전장치: 탭이 백그라운드로 가서 setTimeout이 밀리는 등으로 카드가 멈추면 강제로 다음 카드로 넘긴다.
  useEffect(() => {
    const watchdog = setInterval(() => {
      const idx = activeIndexRef.current;
      const q = queueRef.current;
      if (idx < 0 || idx >= q.length) return;
      const showMs = cardShowMs(q[idx].kind, q.length - idx);
      if (Date.now() - cardStartedAtRef.current > showMs + 700 + 3000) setActiveIndex((i) => i + 1);
    }, 1000);
    return () => clearInterval(watchdog);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inSequence = activeIndex >= 0 && activeIndex < queue.length;
  return { current: inSequence ? queue[activeIndex] : null, inSequence, cardVisible };
}

/** 카드 한 장의 내용 */
export function AlertCard({ theme, event, dayNumber }) {
  return (
    <>
    {event.kind === "sunrise" && (
      <>
        <GlowIcon theme={theme} color="#F0B84E" icon="dawn" />
        <BigHeadline theme={theme} size={88}>아침이 되었습니다</BigHeadline>
        <BigSubtext theme={theme}>{dayNumber}일차</BigSubtext>
      </>
    )}
    {event.kind === "nightDeath" && (
      <>
        <GlowIcon theme={theme} color="#C4323A" icon="chalk" />
        <BigHeadline theme={theme} size={event.count > 2 ? 58 : 68}>{event.name}님이 사망한 채로 발견되었습니다</BigHeadline>
        {event.count > 1 && <BigSubtext theme={theme}>지난밤, {event.count}명이 목숨을 잃었습니다</BigSubtext>}
      </>
    )}
    {(event.kind === "nightSave" || event.kind === "saintSave" || event.kind === "eliteSave") && (
      <>
        <GlowIcon theme={theme} color={event.by === "saint" ? "#EFE2B8" : event.by === "bodyguard" ? "#5B9BF0" : "#8FC9A0"} icon={event.by === "saint" ? "halo" : event.by === "bodyguard" ? "earpiece" : "pulse"} />
        <BigHeadline theme={theme}>{event.name || "누군가"}님이 습격당했지만 목숨을 건졌습니다!</BigHeadline>
        {event.by === "saint" && <BigSubtext theme={theme}>성녀의 가호가 죽음을 비껴가게 했습니다</BigSubtext>}
        {event.by === "bodyguard" && <BigSubtext theme={theme}>그림자처럼 붙어 있던 엘리트 경호원이 공격을 막아냈습니다</BigSubtext>}
      </>
    )}
    {event.kind === "nightLord" && (
      <>
        <GlowIcon theme={theme} color="#C4455A" icon="crownmoon" />
        <BigHeadline theme={theme} size={78}>밤의 지배자가 깨어났습니다</BigHeadline>
        <BigSubtext theme={theme}>짙은 어둠이 마을을 삼켜, 지난밤 마피아팀을 제외한 모든 능력이 무력화되었습니다</BigSubtext>
      </>
    )}
    {event.kind === "bloodRevenge" && (
      <>
        <GlowIcon theme={theme} color="#C8304F" icon="bleedingheart" />
        <BigHeadline theme={theme}>{event.targetName}님이 피의 복수에 쓰러졌습니다</BigHeadline>
        <BigSubtext theme={theme}>사랑하는 이를 잃은 누군가가, 끝내 원수를 갚았습니다</BigSubtext>
      </>
    )}
    {event.kind === "lastWord" && (
      <>
        <GlowIcon theme={theme} color="#E8D2A0" icon="lastwill" />
        <BigHeadline theme={theme}>경호원 {event.bodyguardName}님의 결정적 유언</BigHeadline>
        <BigSubtext theme={theme}>“나를 죽인 건… <b style={{ color: "#F1DFA8" }}>{event.killerName}</b>님이다”</BigSubtext>
      </>
    )}
    {event.kind === "dictator" && (
      <>
        <GlowIcon theme={theme} color="#C9A24B" icon="podium" />
        <BigHeadline theme={theme}>정치인 {event.name}님이 독재를 선포했습니다</BigHeadline>
        <BigSubtext theme={theme}>보안관 배지를 빼앗아, 이제부터 마을의 처형대를 손에 쥡니다</BigSubtext>
      </>
    )}
    {event.kind === "judgeRuling" && (
      <>
        <GlowIcon theme={theme} color="#A88BC4" icon="verdictscroll" />
        <BigHeadline theme={theme}>판결문 — {event.name}님의 직업은 [{event.roleLabel}]</BigHeadline>
        <BigSubtext theme={theme}>판사가 직접 내린 판결의 기록이 마을에 공개되었습니다</BigSubtext>
      </>
    )}
    {event.kind === "judgePlea" && (
      <>
        <GlowIcon theme={theme} color="#5B9BF0" icon="deal" />
        <BigHeadline theme={theme}>사법거래 — {event.jailedName}님은 처형 대신 감옥으로</BigHeadline>
        <BigSubtext theme={theme}>{event.exposedName ? <>그 대가로 <b style={{ color: "#F1DFA8" }}>{event.exposedName}</b>님의 정체 [{event.exposedRoleLabel}]가 폭로되었습니다</> : "털어놓을 동료는 이미 남아있지 않았습니다"}</BigSubtext>
      </>
    )}
    {event.kind === "inquisition" && (
      <>
        <GlowIcon theme={theme} color="#E8A050" icon="stake" />
        <BigHeadline theme={theme}>성직자가 {event.name}님을 이단으로 고발했습니다</BigHeadline>
        <BigSubtext theme={theme}>이단심판이 열립니다 — 곧 최후 변론이 시작됩니다</BigSubtext>
      </>
    )}
    {event.kind === "inquisitionExecuted" && (
      <>
        <GlowIcon theme={theme} color="#E05F3F" icon="stake" />
        <BigHeadline theme={theme}>{event.targetName}님이 이단심판으로 처형되었습니다</BigHeadline>
        <BigSubtext theme={theme}>{event.wasMafia ? "마피아팀이었습니다" : "마피아팀이 아니었습니다"}</BigSubtext>
      </>
    )}
    {event.kind === "veteranSurvived" && (
      <>
        <GlowIcon theme={theme} color="#C09A6A" icon="dogtags" />
        <BigHeadline theme={theme}>{event.name}님이 공격에 맞서 싸워 살아남았습니다!</BigHeadline>
      </>
    )}
    {event.kind === "vampireFight" && (
      <>
        <GlowIcon theme={theme} color="#C4323A" icon="fangs" />
        <BigHeadline theme={theme}>{event.vampireName}님과 {event.mafiaName}님이 사망한 채로 발견되었습니다</BigHeadline>
      </>
    )}
    {event.kind === "avengerKill" && (
      <>
        <GlowIcon theme={theme} color="#C4323A" icon="daggers" />
        <BigHeadline theme={theme}>{event.avengerName}님과 {event.targetName}님이 함께 사망한 채로 발견되었습니다</BigHeadline>
        <BigSubtext theme={theme}>복수는 스스로의 목숨까지 대가로 치렀습니다</BigSubtext>
      </>
    )}
    {event.kind === "werewolfAttack" && (
      <>
        <GlowIcon theme={theme} color="#8C96DC" icon="claws" />
        <BigHeadline theme={theme}>{event.name}님이 늑대인간에게 습격당했습니다</BigHeadline>
        <BigSubtext theme={theme}>보름달 아래, 날카로운 발톱과 이빨 자국만이 남았습니다</BigSubtext>
      </>
    )}
    {event.kind === "priestRevive" && (
      <>
        <GlowIcon theme={theme} color="#E8C468" icon="cross" />
        <BigHeadline theme={theme}>{event.name}님이 성직자에 의해 부활했습니다</BigHeadline>
        <BigSubtext theme={theme}>따뜻한 빛이 마을에 다시 한 번의 기회를 내려주었습니다</BigSubtext>
      </>
    )}
    {event.kind === "judgePardon" && (
      <>
        <GlowIcon theme={theme} color="#5B9BF0" icon="cuffs" />
        <BigHeadline theme={theme}>{event.name}님이 판사에 의해 사면되었습니다</BigHeadline>
        <BigSubtext theme={theme}>감옥에서 풀려나 다시 게임에 참여할 수 있게 되었습니다</BigSubtext>
      </>
    )}
    {event.kind === "sheriffElected" && (
      <>
        <GlowIcon theme={theme} color="#E8C468" icon="badge" />
        <BigHeadline theme={theme}>{event.name}님이 보안관으로 선출되었습니다!</BigHeadline>
        <BigSubtext theme={theme}>마을의 새로운 질서를 책임지게 되었습니다</BigSubtext>
      </>
    )}
    {event.kind === "sheriffDesignate" && (
      <>
        <GlowIcon theme={theme} color="#E8C468" icon="badge" />
        <BigHeadline theme={theme}>보안관이 {event.name}님을 처형대에 세웠습니다</BigHeadline>
        <BigSubtext theme={theme}>곧 최후 변론이 시작됩니다</BigSubtext>
      </>
    )}
    {event.kind === "sheriffJailed" && (
      <>
        <GlowIcon theme={theme} color="#E05F5F" icon="bars" />
        <BigHeadline theme={theme}>무고한 처형으로 {event.name}님이 감옥에 수감되었습니다</BigHeadline>
        <BigSubtext theme={theme}>보안관 직위가 즉시 박탈되었습니다</BigSubtext>
      </>
    )}
    {event.kind === "sheriffExecuted" && (
      <>
        <GlowIcon theme={theme} color="#E8C468" icon="badge" />
        <BigHeadline theme={theme}>{event.targetName}님이 보안관에 의해 처형되었습니다</BigHeadline>
        <BigSubtext theme={theme}>{event.wasMafia ? "마피아팀이었습니다" : "마피아팀이 아니었습니다"}</BigSubtext>
      </>
    )}
    {event.kind === "bodyguardSave" && (
      <>
        <GlowIcon theme={theme} color="#5B9BF0" icon="shield" />
        <BigHeadline theme={theme}>{event.bodyguardName}님이 {event.targetName}님을 지키다 목숨을 잃었습니다</BigHeadline>
        <BigSubtext theme={theme}>{event.attackerName ? `${event.attackerName}님도 함께 쓰러졌습니다` : "몸을 던져 지켜냈습니다"}</BigSubtext>
      </>
    )}
    {event.kind === "catAppeared" && (
      <>
        <GlowIcon theme={theme} color="#E8B478" icon="cat" />
        <BigHeadline theme={theme}>어느새 고양이 한 마리가 마을에 들어와 있었습니다</BigHeadline>
        <BigSubtext theme={theme}>이름은 {event.name} — 아무도 언제부터인지 알지 못합니다</BigSubtext>
      </>
    )}
    {event.kind === "peaceful" && (
      <>
        <GlowIcon theme={theme} icon="coffee" />
        <BigHeadline theme={theme}>평화로운 아침입니다</BigHeadline>
      </>
    )}
    {event.kind === "news" && (
      <NewsFlashCard dayNumber={dayNumber} name={event.name} roleLabel={event.roleLabel} />
    )}
    {event.kind === "curseAnnounced" && (
      <>
        <GlowIcon theme={theme} color="#9A7BCB" icon="tarot" />
        <BigHeadline theme={theme}>{event.name}님이 마녀에게 죽음의 저주를 받았습니다</BigHeadline>
        <BigSubtext theme={theme}>3일 후 저주가 발동됩니다. 그 전에 마녀가 처형되면 저주는 풀립니다.</BigSubtext>
      </>
    )}
    {event.kind === "curseDeath" && (
      <>
        <GlowIcon theme={theme} color="#9A7BCB" icon="skull" />
        <BigHeadline theme={theme}>저주로 인해 {event.name}님이 목숨을 잃었습니다</BigHeadline>
      </>
    )}
    {event.kind === "sheriffNeeded" && (
      <>
        <GlowIcon theme={theme} color="#E8C468" icon="badge" />
        <BigHeadline theme={theme}>마을에 보안관이 없습니다</BigHeadline>
        <BigSubtext theme={theme}>토론 후 투표로 보안관을 선출합니다</BigSubtext>
      </>
    )}
    {event.kind === "executed" && (
      <>
        <GlowIcon theme={theme} color="#C4323A" icon="scales" />
        <BigHeadline theme={theme}>{event.name}님이 마을에서 처형되었습니다</BigHeadline>
        <BigSubtext theme={theme}>{event.isMafia ? "마피아였습니다" : "마피아가 아니었습니다"}</BigSubtext>
      </>
    )}
    {event.kind === "arson" && (
      <>
        <GlowIcon theme={theme} color="#D9723D" icon="dynamite" />
        <BigHeadline theme={theme}>밤사이 큰 불이 나 {event.name}님이 목숨을 잃었습니다</BigHeadline>
      </>
    )}
    {event.kind === "bomb" && (
      <>
        <GlowIcon theme={theme} color="#D9723D" icon="dynamite" />
        <BigHeadline theme={theme}>테러리스트의 자폭으로 {event.name}님이 함께 목숨을 잃었습니다</BigHeadline>
      </>
    )}
    {event.kind === "politicianSaved" && (
      <>
        <GlowIcon theme={theme} color="#C9A24B" icon="fedora" />
        <BigHeadline theme={theme}>{event.name}님은 정치인이라 처형되지 않았습니다!</BigHeadline>
        <BigSubtext theme={theme}>과반수가 찬성했지만, 정치인은 투표로 처형할 수 없습니다</BigSubtext>
      </>
    )}
    {event.kind === "noExecution" && (
      <>
        <GlowIcon theme={theme} icon="ballot" />
        <BigHeadline theme={theme}>아무도 처형되지 않았습니다</BigHeadline>
      </>
    )}
    </>
  );
}
