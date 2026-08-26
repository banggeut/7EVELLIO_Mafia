import React, { useEffect, useState, useRef } from "react";
import { Card, PhaseHeader, RedactedNotice, TimerDisplay, NewsArticle, LiveChatFeed } from "../components/ui.jsx";
import { THEMES, themeForPhase, PHASE_LABEL } from "../theme.js";
import { createBroadcastSocket } from "../socket.js";
import { playNightFall, playDayBreak, playVote, playElimination, playMafiaKill, playDoctorSave } from "../sound.js";

export default function BroadcastPage() {
  const [state, setState] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const prevPhaseRef = useRef(null);

  useEffect(() => {
    const socket = createBroadcastSocket();
    socket.on("broadcast_state", (s) => { setState(s); setDisabled(false); });
    socket.on("broadcast_disabled", () => setDisabled(true));
    return () => socket.disconnect();
  }, []);

  // 방송 화면은 공개 정보(broadcast_state)만 받으므로, 여기서 재생되는 효과음도
  // 그 공개 정보만으로 판단한다 — 의사가 살렸는지 여부 같은 비공개 정보는 여기 존재하지 않는다.
  useEffect(() => {
    if (!state) return;
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = state.phase;
    if (prev === null || prev === state.phase) return;

    if (state.phase === "night") playNightFall();
    else if (state.phase === "morning") {
      playDayBreak();
      if (state.lastNightDeath) setTimeout(() => playMafiaKill(), 350);
      else if (state.nightSaveHappened) setTimeout(() => playDoctorSave(), 500);
    } else if (state.phase === "vote") playVote();
    else if (state.phase === "voteresult" && state.lastEliminated) playElimination();
  }, [state?.phase]);

  if (disabled || !state) {
    const theme = THEMES.dusk;
    return (
      <div style={{ minHeight: "100vh", background: theme.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <Card theme={theme} style={{ maxWidth: 380 }}>
          <RedactedNotice theme={theme} text={disabled ? "관리자가 아직 스트리머 모드를 켜지 않았습니다." : "연결 중..."} />
        </Card>
      </div>
    );
  }

  const theme = themeForPhase(state.phase);
  const death = state.lastNightDeath ? state.players.find((p) => p.id === state.lastNightDeath) : null;
  const eliminated = state.lastEliminated ? state.players.find((p) => p.id === state.lastEliminated) : null;
  const nominee = state.nominee ? state.players.find((p) => p.id === state.nominee) : null;
  const aliveList = state.players.filter((p) => p.alive);

  const DAY_CYCLE_PHASES = ["discussion", "vote", "defense", "finalvote", "voteresult"];
  const showPinnedSummary = DAY_CYCLE_PHASES.includes(state.phase);

  let body = null;
  if (state.phase === "reveal") body = <RedactedNotice theme={theme} text="각자 직업을 확인하는 중입니다. 곧 시작합니다." />;
  else if (state.phase === "night") body = (
    <div style={{ textAlign: "center", padding: "6px 0" }}>
      <TimerDisplay theme={theme} seconds={state.timerSeconds} />
      <div style={{ marginTop: 10 }}>
        <RedactedNotice theme={theme} text="밤이 되었습니다. 각자의 능력이 조용히 사용되는 중입니다." />
      </div>
    </div>
  );
  else if (state.phase === "morning") body = (
    <div style={{ textAlign: "center", padding: "16px 0" }}>
      <div style={{ fontSize: 26 }}>{death ? "☠️" : state.veteranSurvivedName ? "🪖" : state.vampireFightResult ? "⚔️" : state.nightSaveHappened ? "🛡️" : "🌤️"}</div>
      <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 16, fontWeight: 700, color: theme.text, marginTop: 6 }}>
        {death
          ? `${death.name}님이 밤 사이 목숨을 잃었습니다`
          : state.veteranSurvivedName
          ? `${state.veteranSurvivedName}님이 마피아의 공격에 맞서 싸워 살아남았습니다!`
          : state.vampireFightResult
          ? "뱀파이어와 마피아가 격돌해 서로 목숨을 잃었습니다"
          : state.nightSaveHappened
          ? "누군가 습격당했지만 목숨을 건졌습니다!"
          : "평화로운 아침입니다"}
      </div>
      {death && <div style={{ fontSize: 12.5, color: theme.sub, marginTop: 4 }}>{death.isMafia ? "마피아였습니다" : "마피아가 아니었습니다"}</div>}
      {state.reporterReveal && (
        <div style={{ marginTop: 12, textAlign: "left" }}>
          <NewsArticle theme={theme} dayNumber={state.dayNumber} name={state.reporterReveal.name} roleLabel={state.reporterReveal.roleLabel} />
        </div>
      )}
    </div>
  );
  else if (state.phase === "discussion") body = (
    <div style={{ padding: "8px 0" }}>
      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <TimerDisplay theme={theme} seconds={state.timerSeconds} />
        <div style={{ fontSize: 12.5, color: theme.sub, marginTop: 6 }}>토론 중 · 치지직 채팅으로 추리를 나눠주세요</div>
      </div>
      <LiveChatFeed theme={theme} title="채팅" messages={state.dayChat} />
    </div>
  );
  else if (state.phase === "vote") body = (
    <div style={{ textAlign: "center", padding: "6px 0" }}>
      <TimerDisplay theme={theme} seconds={state.timerSeconds} />
      <div style={{ marginTop: 10 }}>
        <RedactedNotice theme={theme} text="투표가 진행 중입니다. 결과는 곧 공개됩니다." />
      </div>
    </div>
  );
  else if (state.phase === "defense") body = (
    <div style={{ padding: "6px 0" }}>
      <TimerDisplay theme={theme} seconds={state.timerSeconds} />
      <div style={{ textAlign: "center", fontSize: 14, fontWeight: 700, color: theme.text, margin: "8px 0" }}>⚖️ {nominee?.name}님의 최후 변론</div>
      <LiveChatFeed theme={theme} title="채팅" messages={state.dayChat} />
    </div>
  );
  else if (state.phase === "finalvote") body = (
    <div style={{ textAlign: "center", padding: "6px 0" }}>
      <TimerDisplay theme={theme} seconds={state.timerSeconds} />
      <div style={{ marginTop: 10 }}>
        <RedactedNotice theme={theme} text="찬반 투표가 진행 중입니다." />
      </div>
    </div>
  );
  else if (state.phase === "voteresult") body = (
    <div style={{ textAlign: "center", padding: "16px 0" }}>
      <div style={{ fontSize: 26 }}>{eliminated ? "⚖️" : state.politicianSaved ? "🎩" : "⚖️"}</div>
      <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 16, fontWeight: 700, color: theme.text, marginTop: 6 }}>
        {eliminated
          ? `${eliminated.name}님이 처형되었습니다`
          : state.politicianSaved && nominee
          ? `${nominee.name}님은 정치인이라 처형되지 않았습니다!`
          : "아무도 처형되지 않았습니다"}
      </div>
      {eliminated && <div style={{ fontSize: 12.5, color: theme.sub, marginTop: 4 }}>{eliminated.isMafia ? "마피아였습니다" : "마피아가 아니었습니다"}</div>}
    </div>
  );
  else if (state.phase === "gameover") {
    const w = { mafia: { icon: "🗡️", text: "마피아 팀 승리" }, citizen: { icon: "🌾", text: "시민 팀 승리" },
      cultist: { icon: "😈", text: "악마 숭배자 승리" }, vampire: { icon: "🧛", text: "뱀파이어 팀 승리" } }[state.winner] || { icon: "🌾", text: "시민 팀 승리" };
    body = (
      <div style={{ textAlign: "center", padding: "16px 0" }}>
        <div style={{ fontSize: 28 }}>{w.icon}</div>
        <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 17, fontWeight: 700, color: theme.text, marginTop: 6 }}>{w.text}</div>
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 4, textAlign: "left" }}>
          {state.players.map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              fontSize: 12.5, padding: "5px 10px", borderRadius: 8, background: theme.accentSoft }}>
              <span style={{ color: theme.text, textDecoration: p.alive ? "none" : "line-through" }}>{p.name}</span>
              <span style={{ color: theme.sub }}>{p.roleLabel}{p.isThrall ? " (흡혈귀화)" : ""}{!p.alive && " · 사망"}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "transparent", padding: 20 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@600;700&family=Noto+Sans+KR:wght@400;600;700&display=swap');
        html, body { background: transparent !important; }
      `}</style>
      <Card theme={theme} style={{ maxWidth: 460, margin: "0 auto" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10.5, fontWeight: 700,
          letterSpacing: "0.06em", color: theme.sub, marginBottom: 6 }}>
          👁️ 관전 모드 · 제3자 시점
        </div>
        <PhaseHeader theme={theme} phase={state.phase} label={PHASE_LABEL(state)} />

        {showPinnedSummary && (
          <div style={{ borderRadius: 12, padding: "10px 14px", background: theme.accentSoft, margin: "10px 0" }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: theme.sub, marginBottom: 4, letterSpacing: 1 }}>📌 지난밤 소식</div>
            <div style={{ fontSize: 13, color: theme.text }}>
              {death
                ? `☠️ ${death.name}님이 밤 사이 목숨을 잃었습니다 (${death.isMafia ? "마피아였습니다" : "마피아가 아니었습니다"})`
                : state.veteranSurvivedName
                ? `🪖 ${state.veteranSurvivedName}님이 마피아의 공격에 맞서 싸워 살아남았습니다`
                : state.vampireFightResult
                ? "⚔️ 뱀파이어와 마피아가 격돌해 서로 목숨을 잃었습니다"
                : state.nightSaveHappened
                ? "🛡️ 누군가 습격당했지만 목숨을 건졌습니다"
                : "🌤️ 평화로운 밤이었습니다"}
            </div>
            {state.reporterReveal && (
              <div style={{ marginTop: 8 }}>
                <NewsArticle theme={theme} dayNumber={state.dayNumber} name={state.reporterReveal.name} roleLabel={state.reporterReveal.roleLabel} />
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 10 }}>{body}</div>
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 11.5, color: theme.sub, marginBottom: 8 }}>생존자 ({aliveList.length}명)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {state.players.map((p) => (
              <span key={p.id} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 999,
                background: p.alive ? theme.accentSoft : "rgba(120,120,120,0.18)", color: p.alive ? theme.text : theme.sub,
                textDecoration: p.alive ? "none" : "line-through", display: "inline-flex", alignItems: "center", gap: 5 }}>
                {p.name}
                {p.roleLabel && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, background: "rgba(0,0,0,0.12)", borderRadius: 999, padding: "1px 6px" }}>
                    {p.roleLabel}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
