import React, { useEffect, useRef, useState } from "react";
import { THEMES, themeForPhase, PHASE_LABEL } from "../theme.js";
import { createBroadcastSocket } from "../socket.js";
import {
  playNightFall, playDayBreak, playVote, playElimination,
  playMafiaKill, playDoctorSave, playNewsFlash, playDramaticHit, playCurse,
  playCitizenVictory, playMafiaVictory, playCultistVictory, playVampireVictory,
} from "../sound.js";

/* ============================================================
   레벨리오 마피아 — 방송(OBS) 화면
   1920x1080 풀프레임 전용. 스크롤 없이 화면을 꽉 채우고,
   밤 결과 발표는 아이콘 카드가 순차적으로 페이드 인/아웃되는
   연출로 진행됩니다.
   ============================================================ */

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@600;700;900&family=Noto+Sans+KR:wght@400;600;700;900&display=swap');";

/* ---------- 페이드 인/아웃 스테이지 ---------- */
function FadeStage({ visible, children }) {
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
      {children}
    </div>
  );
}

function GlowIcon({ theme, children, color }) {
  return (
    <div style={{ position: "relative", width: 340, height: 340, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
      <div style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        background: `radial-gradient(circle, ${color || theme.accent}55 0%, ${color || theme.accent}00 72%)`,
        animation: "levellio-pulse 2.6s ease-in-out infinite",
      }} />
      <div style={{ fontSize: 216, lineHeight: 1, filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.35))" }}>{children}</div>
    </div>
  );
}

/* ---------- 승리 파티클 연출 ---------- */
const CONFETTI_COLORS = ["#E8C468", "#7FA88C", "#C1392B", "#5C9EAD", "#F0E9E4", "#D98C3D"];

function Particles({ variant }) {
  const items = Array.from({ length: variant === "mist" ? 10 : variant === "bats" ? 14 : 34 });
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {items.map((_, i) => {
        const left = `${(i * 37) % 100}%`;
        const delay = `${(i % 12) * 0.35}s`;
        if (variant === "confetti") {
          const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
          const duration = 3.4 + (i % 5) * 0.6;
          const size = 8 + (i % 4) * 4;
          return (
            <div key={i} style={{
              position: "absolute", top: "-8%", left, width: size, height: size * 1.6,
              background: color, opacity: 0.9, borderRadius: 2,
              animation: `levellio-confetti-fall ${duration}s linear infinite`, animationDelay: delay,
            }} />
          );
        }
        if (variant === "embers") {
          const duration = 3.2 + (i % 6) * 0.5;
          const size = 5 + (i % 3) * 4;
          return (
            <div key={i} style={{
              position: "absolute", bottom: "-6%", left, width: size, height: size, borderRadius: "50%",
              background: "radial-gradient(circle, #F0B84E 0%, #B84C5C 60%, transparent 100%)",
              animation: `levellio-ember-rise ${duration}s ease-in infinite`, animationDelay: delay,
            }} />
          );
        }
        if (variant === "mist") {
          const size = 220 + (i % 4) * 90;
          return (
            <div key={i} style={{
              position: "absolute", top: `${(i * 23) % 80 + 5}%`, left,
              width: size, height: size * 0.6, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(123,94,167,0.35) 0%, rgba(123,94,167,0) 70%)",
              filter: "blur(6px)", animation: `levellio-mist-drift ${6 + (i % 3)}s ease-in-out infinite`, animationDelay: delay,
            }} />
          );
        }
        // bats
        const duration = 5 + (i % 4) * 1.2;
        return (
          <div key={i} style={{
            position: "absolute", top: `${(i * 17) % 70 + 5}%`, left: "-8%", fontSize: 26 + (i % 3) * 10,
            animation: `levellio-bat-fly ${duration}s linear infinite`, animationDelay: delay, opacity: 0.85,
          }}>🦇</div>
        );
      })}
    </div>
  );
}

const WINNER_CONFIG = {
  mafia: { icon: "🗡️", text: "마피아 팀 승리", color: "#B84C5C", particle: "embers", sound: playMafiaVictory },
  citizen: { icon: "🌾", text: "시민 팀 승리", color: "#E8C468", particle: "confetti", sound: playCitizenVictory },
  cultist: { icon: "😈", text: "악마 숭배자 승리", color: "#7B5EA7", particle: "mist", sound: playCultistVictory },
  vampire: { icon: "🧛", text: "뱀파이어 팀 승리", color: "#8E4C6B", particle: "bats", sound: playVampireVictory },
};

function BigHeadline({ theme, children, size = 68 }) {
  return (
    <div style={{
      fontFamily: "'Noto Serif KR', serif", fontWeight: 800, fontSize: size, color: theme.text,
      textAlign: "center", maxWidth: 1400, lineHeight: 1.3, textShadow: "0 6px 24px rgba(0,0,0,0.25)",
    }}>
      {children}
    </div>
  );
}
function BigSubtext({ theme, children }) {
  return (
    <div style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: 32, fontWeight: 600, color: theme.sub, textAlign: "center", marginTop: 14, maxWidth: 1200 }}>
      {children}
    </div>
  );
}

/* ---------- 신문 호외 카드 (기자 특종 전용, 다른 연출과 확실히 구분) ---------- */
function NewsFlashCard({ dayNumber, name, roleLabel }) {
  return (
    <div style={{
      width: 1180, background: "#F7F1DE", borderRadius: 6, padding: "44px 60px 52px",
      boxShadow: "0 30px 80px rgba(0,0,0,0.5)", transform: "rotate(-0.6deg)",
      border: "1px solid rgba(0,0,0,0.15)",
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

/* ---------- 상단/하단 상시 UI ---------- */
function TopBar({ theme, state }) {
  return (
    <div style={{ position: "absolute", top: 40, left: 56, right: 56, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 5 }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 12, fontFamily: "'Noto Serif KR', serif", fontWeight: 800, fontSize: 30, color: theme.text }}>
        <span>{state.phase === "night" ? "🌙" : state.phase === "gameover" ? "🏁" : "☀️"}</span>
        {PHASE_LABEL(state)}
      </div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 700, letterSpacing: 2,
        color: theme.sub, padding: "6px 16px", borderRadius: 999, border: `1px solid ${theme.panelBorder}` }}>
        👁️ 관전 모드
      </div>
    </div>
  );
}

function RosterBar({ theme, players }) {
  const aliveCount = players.filter((p) => p.alive).length;
  return (
    <div style={{ position: "absolute", left: 56, right: 56, bottom: 44, zIndex: 5 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: theme.sub, marginBottom: 12 }}>
        참여자 · {aliveCount}/{players.length}명 생존
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {players.map((p) => (
          <div key={p.id} style={{
            display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 18px 8px 8px", borderRadius: 999,
            background: p.alive ? theme.accentSoft : "rgba(120,120,120,0.16)",
          }}>
            {p.profileImageUrl ? (
              <img src={p.profileImageUrl} alt="" width={40} height={40} style={{ borderRadius: "50%", objectFit: "cover", opacity: p.alive ? 1 : 0.4 }} />
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: p.alive ? theme.accentSoft : "rgba(120,120,120,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: theme.text }}>
                {p.alive ? p.name.slice(0, 1) : "💀"}
              </div>
            )}
            <span style={{ fontSize: 22, fontWeight: 600, color: p.alive ? theme.text : theme.sub, textDecoration: p.alive ? "none" : "line-through" }}>
              {p.name}
            </span>
            {p.roleLabel && (
              <span style={{ fontSize: 16, fontWeight: 800, color: theme.accent, background: "rgba(0,0,0,0.14)", borderRadius: 999, padding: "3px 12px" }}>
                {p.roleLabel}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BigTimer({ theme, seconds }) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return <div style={{ fontFamily: "monospace", fontSize: 150, fontWeight: 700, color: theme.accent, letterSpacing: 4, textShadow: "0 8px 30px rgba(0,0,0,0.3)" }}>{mm}:{ss}</div>;
}

function BigChatFeed({ theme, messages }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [messages.length]);
  return (
    <div style={{ width: 1100, maxHeight: 320, overflowY: "auto", marginTop: 36, borderRadius: 20,
      border: `1px solid ${theme.panelBorder}`, background: theme.panel, padding: "24px 30px", backdropFilter: "blur(6px)" }}>
      {messages.length === 0 && <div style={{ fontSize: 24, color: theme.sub, textAlign: "center" }}>아직 채팅이 없습니다</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.slice(-6).map((m, i) => (
          <div key={i} style={{ fontSize: 26, color: theme.text }}><b>{m.sender}</b> · {m.text}</div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

/* ---------- 낮 화면에 고정으로 떠 있는 지난밤 결과 요약 ---------- */
function NightSummaryPinned({ theme, state, death }) {
  return (
    <div style={{ width: 1100, marginTop: 22, borderRadius: 18, padding: "18px 28px",
      border: `1px solid ${theme.panelBorder}`, background: theme.panel, backdropFilter: "blur(6px)" }}>
      <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 2, color: theme.sub, marginBottom: 8 }}>📌 지난밤 소식</div>
      <div style={{ fontSize: 24, color: theme.text }}>
        {death
          ? <>☠️ <b>{death.name}</b>님이 밤 사이 목숨을 잃었습니다</>
          : state.veteranSurvivedName
          ? <>🪖 <b>{state.veteranSurvivedName}</b>님이 마피아의 공격에 맞서 싸워 살아남았습니다</>
          : state.vampireFightResult
          ? <>⚔️ 뱀파이어와 마피아가 격돌해 서로 목숨을 잃었습니다</>
          : state.nightSaveHappened
          ? <>🛡️ 누군가 습격당했지만 의사의 보호로 목숨을 건졌습니다</>
          : <>🌤️ 평화로운 밤이었습니다</>}
      </div>
      {state.reporterReveal && (
        <div style={{ fontSize: 22, color: theme.text, marginTop: 8 }}>
          📰 <b>{state.reporterReveal.name}</b>님의 직업이 <b>[{state.reporterReveal.roleLabel}]</b>(으)로 공개되었습니다
        </div>
      )}
      {state.curseVictimName && (
        <div style={{ fontSize: 22, color: theme.text, marginTop: 8 }}>
          🔮 <b>{state.curseVictimName}</b>님이 마녀의 저주를 받아 목숨을 잃었습니다 (마피아의 습격과는 별개)
        </div>
      )}
    </div>
  );
}

/* ---------- 메인 컴포넌트 ---------- */
export default function BroadcastPage() {
  const [state, setState] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const prevPhaseRef = useRef(null);
  const [queue, setQueue] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [cardVisible, setCardVisible] = useState(false);
  const timeoutsRef = useRef([]);

  useEffect(() => {
    const socket = createBroadcastSocket();
    socket.on("broadcast_state", (s) => { setState(s); setDisabled(false); });
    socket.on("broadcast_tick", ({ timerSeconds }) => setState((prev) => (prev ? { ...prev, timerSeconds } : prev)));
    socket.on("broadcast_disabled", () => setDisabled(true));
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (!state) return;
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = state.phase;
    if (prev === state.phase) return;

    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    if (state.phase === "night") { playNightFall(); setQueue([]); setActiveIndex(-1); return; }
    if (state.phase === "vote") { playVote(); setQueue([]); setActiveIndex(-1); return; }
    if (state.phase === "gameover") {
      const cfg = WINNER_CONFIG[state.winner] || WINNER_CONFIG.citizen;
      cfg.sound();
      setQueue([]); setActiveIndex(-1);
      return;
    }
    if (state.phase === "voteresult" && state.lastEliminated) playElimination();

    if (state.phase === "morning") {
      playDayBreak();
      const events = [{ kind: "sunrise" }];
      if (state.lastNightDeath) {
        const p = state.players.find((x) => x.id === state.lastNightDeath);
        events.push({ kind: "nightDeath", name: p?.name });
      } else if (state.veteranSurvivedName) {
        events.push({ kind: "veteranSurvived", name: state.veteranSurvivedName });
      } else if (state.vampireFightResult) {
        events.push({ kind: "vampireFight" });
      } else if (state.nightSaveHappened) {
        events.push({ kind: "nightSave" });
      } else {
        events.push({ kind: "peaceful" });
      }
      if (state.reporterReveal) {
        events.push({ kind: "news", name: state.reporterReveal.name, roleLabel: state.reporterReveal.roleLabel });
      }
      // 마녀의 저주는 마피아의 습격과 완전히 별개 사건이라, 항상 독립된 두 장의 카드로 순서대로 보여준다.
      if (state.curseVictimName) {
        events.push({ kind: "curseAnnounced", name: state.curseVictimName });
        events.push({ kind: "curseDeath", name: state.curseVictimName });
      }
      setQueue(events);
      setActiveIndex(0);
      return;
    }

    if (state.phase === "voteresult") {
      const events = [];
      if (state.lastEliminated) {
        const p = state.players.find((x) => x.id === state.lastEliminated);
        events.push({ kind: "executed", name: p?.name, isMafia: p?.isMafia });
        if (state.terroristBombVictimName) events.push({ kind: "bomb", name: state.terroristBombVictimName });
      } else if (state.politicianSaved) {
        const nom = state.players.find((x) => x.id === state.nominee);
        events.push({ kind: "politicianSaved", name: nom?.name });
      } else {
        events.push({ kind: "noExecution" });
      }
      setQueue(events);
      setActiveIndex(0);
      return;
    }

    setQueue([]);
    setActiveIndex(-1);
  }, [state?.phase]);

  useEffect(() => {
    if (activeIndex < 0 || activeIndex >= queue.length) { setCardVisible(false); return; }
    const kind = queue[activeIndex].kind;
    setCardVisible(true);

    const soundTimer = setTimeout(() => {
      if (kind === "nightDeath" || kind === "bomb") playMafiaKill();
      else if (kind === "nightSave") playDoctorSave();
      else if (kind === "news") playNewsFlash();
      else if (kind === "curseAnnounced" || kind === "curseDeath") playCurse();
      else if (["veteranSurvived", "vampireFight", "politicianSaved", "executed"].includes(kind)) playDramaticHit();
    }, 150);

    const showMs = kind === "sunrise" ? 2400 : kind === "news" ? 5200 : 3600;
    const hideTimer = setTimeout(() => setCardVisible(false), showMs);
    const nextTimer = setTimeout(() => setActiveIndex((i) => i + 1), showMs + 700);
    timeoutsRef.current.push(soundTimer, hideTimer, nextTimer);
    return () => { clearTimeout(soundTimer); clearTimeout(hideTimer); clearTimeout(nextTimer); };
  }, [activeIndex, queue]);

  if (disabled || !state) {
    const theme = THEMES.dusk;
    return (
      <div style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", overflow: "hidden",
        background: theme.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`html,body{margin:0;padding:0;overflow:hidden;} ${FONT_IMPORT}`}</style>
        <BigHeadline theme={theme} size={44}>
          {disabled ? "🔒 관리자가 아직 스트리머 모드를 켜지 않았습니다" : "연결 중..."}
        </BigHeadline>
      </div>
    );
  }

  const theme = themeForPhase(state.phase);
  const nominee = state.nominee ? state.players.find((p) => p.id === state.nominee) : null;
  const death = state.lastNightDeath ? state.players.find((p) => p.id === state.lastNightDeath) : null;
  const inSequence = activeIndex >= 0 && activeIndex < queue.length;
  const current = inSequence ? queue[activeIndex] : null;

  let restingBody = null;
  if (state.phase === "reveal") {
    restingBody = (
      <>
        <GlowIcon theme={theme}>🕯️</GlowIcon>
        <BigHeadline theme={theme}>각자 직업을 확인하는 중입니다</BigHeadline>
        <BigSubtext theme={theme}>곧 첫 번째 밤이 시작됩니다</BigSubtext>
      </>
    );
  } else if (state.phase === "night") {
    restingBody = (
      <>
        <GlowIcon theme={theme}>🌙</GlowIcon>
        <BigHeadline theme={theme}>밤이 되었습니다</BigHeadline>
        <BigSubtext theme={theme}>직업이 있는 플레이어들이 조용히 능력을 사용하고 있어요</BigSubtext>
        <div style={{ marginTop: 30 }}><BigTimer theme={theme} seconds={state.timerSeconds} /></div>
      </>
    );
  } else if (state.phase === "morning" && !inSequence) {
    restingBody = (
      <>
        <GlowIcon theme={theme} color={theme.accent}>☀️</GlowIcon>
        <BigHeadline theme={theme}>{state.dayNumber}일차 아침입니다</BigHeadline>
        <BigSubtext theme={theme}>잠시 후 토론이 시작됩니다</BigSubtext>
      </>
    );
  } else if (state.phase === "discussion") {
    restingBody = (
      <>
        <BigTimer theme={theme} seconds={state.timerSeconds} />
        <BigHeadline theme={theme} size={44}>채팅으로 회의를 진행해주세요</BigHeadline>
        <NightSummaryPinned theme={theme} state={state} death={death} />
        <BigChatFeed theme={theme} messages={state.dayChat} />
      </>
    );
  } else if (state.phase === "vote") {
    restingBody = (
      <>
        <GlowIcon theme={theme}>🗳️</GlowIcon>
        <BigTimer theme={theme} seconds={state.timerSeconds} />
        <BigHeadline theme={theme}>투표가 진행 중입니다</BigHeadline>
      </>
    );
  } else if (state.phase === "defense") {
    restingBody = (
      <>
        <BigTimer theme={theme} seconds={state.timerSeconds} />
        <BigHeadline theme={theme}>⚖️ {nominee?.name}님의 최후 변론</BigHeadline>
        <BigChatFeed theme={theme} messages={state.dayChat} />
      </>
    );
  } else if (state.phase === "judgetiebreak") {
    restingBody = (
      <>
        <GlowIcon theme={theme} color="#8E6BA8">🔨</GlowIcon>
        <BigTimer theme={theme} seconds={state.timerSeconds} />
        <BigHeadline theme={theme}>투표가 동점이 나와, 판사가 한 명을 지명하고 있습니다</BigHeadline>
      </>
    );
  } else if (state.phase === "judgeverdict") {
    restingBody = (
      <>
        <GlowIcon theme={theme} color="#8E6BA8">🔨</GlowIcon>
        <BigTimer theme={theme} seconds={state.timerSeconds} />
        <BigHeadline theme={theme}>{nominee?.name}님의 처형 여부를 판사가 심의하고 있습니다</BigHeadline>
      </>
    );
  } else if (state.phase === "finalvote") {
    restingBody = (
      <>
        <GlowIcon theme={theme}>⚖️</GlowIcon>
        <BigTimer theme={theme} seconds={state.timerSeconds} />
        <BigHeadline theme={theme}>찬반 투표가 진행 중입니다</BigHeadline>
      </>
    );
  } else if (state.phase === "voteresult" && !inSequence) {
    restingBody = (
      <>
        <GlowIcon theme={theme}>⚖️</GlowIcon>
        <BigHeadline theme={theme}>{state.dayNumber}일차 투표가 마무리되었습니다</BigHeadline>
      </>
    );
  } else if (state.phase === "gameover") {
    const w = WINNER_CONFIG[state.winner] || WINNER_CONFIG.citizen;
    restingBody = (
      <>
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(circle at 50% 42%, ${w.color}33 0%, ${w.color}00 62%)`,
        }} />
        <Particles variant={w.particle} />
        <div style={{ position: "relative", width: 380, height: 380, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 30 }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${w.color}`, opacity: 0, animation: "levellio-shockwave 2.2s ease-out infinite" }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${w.color}`, opacity: 0, animation: "levellio-shockwave 2.2s ease-out infinite", animationDelay: "0.7s" }} />
          <div style={{
            position: "absolute", inset: 20, borderRadius: "50%",
            background: `radial-gradient(circle, ${w.color}66 0%, ${w.color}00 72%)`,
            animation: "levellio-pulse 2.2s ease-in-out infinite",
          }} />
          <div style={{ fontSize: 236, lineHeight: 1, filter: "drop-shadow(0 12px 34px rgba(0,0,0,0.4))", animation: "levellio-title-pop 900ms cubic-bezier(0.22,1.4,0.36,1) both" }}>
            {w.icon}
          </div>
        </div>
        <div style={{ animation: "levellio-title-pop 900ms cubic-bezier(0.22,1.4,0.36,1) both", animationDelay: "120ms" }}>
          <BigHeadline theme={theme} size={92}>{w.text}</BigHeadline>
        </div>
        <div style={{ marginTop: 16, fontSize: 26, fontWeight: 700, letterSpacing: 6, color: w.color, textTransform: "uppercase" }}>
          🏆 GAME OVER 🏆
        </div>
      </>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", overflow: "hidden", background: theme.bg, transition: "background 900ms ease" }}>
      <style>{`
        html, body { margin:0; padding:0; overflow:hidden; background:#000; }
        ${FONT_IMPORT}
        @keyframes levellio-pulse { 0%,100% { transform: scale(1); opacity: 0.9; } 50% { transform: scale(1.12); opacity: 1; } }
        @keyframes levellio-twinkle { 0%,100% { opacity: 0.15; } 50% { opacity: 0.9; } }
        @keyframes levellio-confetti-fall { 0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; } 100% { transform: translateY(110vh) rotate(760deg); opacity: 0.85; } }
        @keyframes levellio-ember-rise { 0% { transform: translateY(0) scale(0.6); opacity: 0; } 12% { opacity: 1; } 100% { transform: translateY(-105vh) scale(1.15); opacity: 0; } }
        @keyframes levellio-mist-drift { 0%,100% { transform: translateX(-16px) translateY(0) scale(1); opacity: 0.5; } 50% { transform: translateX(16px) translateY(-18px) scale(1.08); opacity: 0.85; } }
        @keyframes levellio-bat-fly { 0% { transform: translate(0, 0) scale(1); opacity: 0; } 8% { opacity: 0.85; } 92% { opacity: 0.85; } 100% { transform: translate(118vw, -12vh) scale(0.9); opacity: 0; } }
        @keyframes levellio-shockwave { 0% { transform: scale(0.4); opacity: 0.8; } 100% { transform: scale(2.4); opacity: 0; } }
        @keyframes levellio-title-pop { 0% { transform: scale(0.5); opacity: 0; } 65% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>

      {state.phase === "night" && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {[...Array(14)].map((_, i) => (
            <div key={i} style={{
              position: "absolute", width: 3, height: 3, borderRadius: "50%", background: "#EDE9DA",
              top: `${(i * 37) % 90 + 4}%`, left: `${(i * 53) % 92 + 4}%`,
              animation: `levellio-twinkle ${2 + (i % 4)}s ease-in-out infinite`, animationDelay: `${(i % 5) * 0.4}s`,
            }} />
          ))}
        </div>
      )}

      <TopBar theme={theme} state={state} />

      <div style={{ position: "absolute", inset: 0 }}>
        {restingBody && <FadeStage visible={!inSequence}>{restingBody}</FadeStage>}

        {current && (
          <FadeStage visible={cardVisible}>
            {current.kind === "sunrise" && (
              <>
                <GlowIcon theme={theme} color="#F0B84E">☀️</GlowIcon>
                <BigHeadline theme={theme} size={88}>아침이 되었습니다</BigHeadline>
                <BigSubtext theme={theme}>{state.dayNumber}일차</BigSubtext>
              </>
            )}
            {current.kind === "nightDeath" && (
              <>
                <GlowIcon theme={theme} color="#B84C5C">☠️</GlowIcon>
                <BigHeadline theme={theme}>{current.name}님이 밤 사이 목숨을 잃었습니다</BigHeadline>
              </>
            )}
            {current.kind === "nightSave" && (
              <>
                <GlowIcon theme={theme} color="#7FA88C">🛡️</GlowIcon>
                <BigHeadline theme={theme}>누군가 습격당했지만 목숨을 건졌습니다!</BigHeadline>
              </>
            )}
            {current.kind === "veteranSurvived" && (
              <>
                <GlowIcon theme={theme} color="#A0784E">🪖</GlowIcon>
                <BigHeadline theme={theme}>{current.name}님이 마피아의 공격에 맞서 싸워 살아남았습니다!</BigHeadline>
              </>
            )}
            {current.kind === "vampireFight" && (
              <>
                <GlowIcon theme={theme} color="#8E4C6B">⚔️</GlowIcon>
                <BigHeadline theme={theme}>뱀파이어와 마피아가 격돌해 서로 목숨을 잃었습니다</BigHeadline>
              </>
            )}
            {current.kind === "peaceful" && (
              <>
                <GlowIcon theme={theme}>🌤️</GlowIcon>
                <BigHeadline theme={theme}>평화로운 아침입니다</BigHeadline>
              </>
            )}
            {current.kind === "news" && (
              <NewsFlashCard dayNumber={state.dayNumber} name={current.name} roleLabel={current.roleLabel} />
            )}
            {current.kind === "curseAnnounced" && (
              <>
                <GlowIcon theme={theme} color="#7B5EA7">🔮</GlowIcon>
                <BigHeadline theme={theme}>{current.name}님이 마녀에게 죽음의 저주를 받았습니다</BigHeadline>
                <BigSubtext theme={theme}>마피아의 습격과는 별개의 힘입니다</BigSubtext>
              </>
            )}
            {current.kind === "curseDeath" && (
              <>
                <GlowIcon theme={theme} color="#7B5EA7">💀</GlowIcon>
                <BigHeadline theme={theme}>저주로 인해 {current.name}님이 목숨을 잃었습니다</BigHeadline>
              </>
            )}
            {current.kind === "executed" && (
              <>
                <GlowIcon theme={theme} color="#B84C5C">⚖️</GlowIcon>
                <BigHeadline theme={theme}>{current.name}님이 마을에서 처형되었습니다</BigHeadline>
                <BigSubtext theme={theme}>{current.isMafia ? "마피아였습니다" : "마피아가 아니었습니다"}</BigSubtext>
              </>
            )}
            {current.kind === "bomb" && (
              <>
                <GlowIcon theme={theme} color="#D9723D">💣</GlowIcon>
                <BigHeadline theme={theme}>테러리스트의 자폭으로 {current.name}님이 함께 목숨을 잃었습니다</BigHeadline>
              </>
            )}
            {current.kind === "politicianSaved" && (
              <>
                <GlowIcon theme={theme} color="#C9A24B">🎩</GlowIcon>
                <BigHeadline theme={theme}>{current.name}님은 정치인이라 처형되지 않았습니다!</BigHeadline>
                <BigSubtext theme={theme}>과반수가 찬성했지만, 정치인은 투표로 처형할 수 없습니다</BigSubtext>
              </>
            )}
            {current.kind === "noExecution" && (
              <>
                <GlowIcon theme={theme}>🗳️</GlowIcon>
                <BigHeadline theme={theme}>아무도 처형되지 않았습니다</BigHeadline>
              </>
            )}
          </FadeStage>
        )}
      </div>

      <RosterBar theme={theme} players={state.players} />
    </div>
  );
}
