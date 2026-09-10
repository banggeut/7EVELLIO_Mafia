import React, { useEffect, useRef, useState } from "react";
import { THEMES, themeForPhase, PHASE_LABEL } from "../theme.js";
import { createBroadcastSocket } from "../socket.js";
import { titleColor } from "../components/ui.jsx";
import {
  playNightFall, playDayBreak, playVote, playElimination,
  playMafiaKill, playDoctorSave, playNewsFlash, playDramaticHit, playCurse, playWerewolfHowl, playRevive, playMeow, playPhishingAlert,
  playCitizenVictory, playMafiaVictory, playCultistVictory, playVampireVictory, playThiefVictory, playMercenaryVictory,
} from "../sound.js";

// 공개된 직업 라벨을 팀/분류에 따라 색으로 구분한다 (게임 화면 ui.jsx와 동일한 기준).
const MAFIA_LABELS = new Set(["마피아", "스파이", "해커", "마담", "유괴범", "테러리스트", "마녀", "사기꾼", "대부", "히트맨"]);
const CITIZEN_FORCED_LABELS = new Set(["경찰", "의사"]);
const CITIZEN_PLAIN_LABELS = new Set(["시민", "연인", "백수", "교사", "학생", "상담원", "피싱", "검시관", "교도관"]);
const NEUTRAL_LABELS = new Set(["악마 숭배자", "뱀파이어", "괴도", "늑대인간", "고양이", "용병"]);
function roleLabelColor(label) {
  if (MAFIA_LABELS.has(label)) return "#E05F5F";
  if (NEUTRAL_LABELS.has(label)) return "#B57BF0";
  if (CITIZEN_FORCED_LABELS.has(label)) return "#5B9BF0";
  if (CITIZEN_PLAIN_LABELS.has(label)) return "#E8D25A";
  return "#5FBF7A";
}

function roleLabelShadow(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `0 1px 3px rgba(${r},${g},${b},0.55)`;
}

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
  const items = Array.from({ length: variant === "mist" ? 10 : variant === "bats" ? 14 : variant === "moonwolf" ? 16 : 34 });
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
        if (variant === "gems") {
          const gemColors = ["#EAEAF2", "#D9534F", "#4F7FD9", "#4FD98A"]; // 다이아몬드/루비/사파이어/에메랄드
          const color = gemColors[i % gemColors.length];
          const duration = 3 + (i % 5) * 0.5;
          const size = 10 + (i % 3) * 5;
          return (
            <div key={i} style={{
              position: "absolute", top: "-8%", left, width: size, height: size,
              background: `linear-gradient(135deg, ${color}, ${color}88)`,
              boxShadow: `0 0 10px ${color}aa`,
              animation: `levellio-gem-fall ${duration}s ease-in infinite, levellio-gem-twinkle 1.1s ease-in-out infinite`,
              animationDelay: `${delay}, ${(i % 6) * 0.15}s`,
            }} />
          );
        }
        if (variant === "bats") {
          const duration = 5 + (i % 4) * 1.2;
          return (
            <div key={i} style={{
              position: "absolute", top: `${(i * 17) % 70 + 5}%`, left: "-8%", fontSize: 26 + (i % 3) * 10,
              animation: `levellio-bat-fly ${duration}s linear infinite`, animationDelay: delay, opacity: 0.85,
            }}>🦇</div>
          );
        }
        if (variant === "moonwolf") {
          // 짝수 인덱스는 차가운 달빛 안개, 홀수 인덱스는 떠다니는 늑대 실루엣
          if (i % 2 === 0) {
            const size = 200 + (i % 4) * 80;
            return (
              <div key={i} style={{
                position: "absolute", top: `${(i * 19) % 80 + 5}%`, left,
                width: size, height: size * 0.55, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(140,150,220,0.32) 0%, rgba(140,150,220,0) 70%)",
                filter: "blur(6px)", animation: `levellio-mist-drift ${6 + (i % 3)}s ease-in-out infinite`, animationDelay: delay,
              }} />
            );
          }
          const duration = 6 + (i % 4) * 1.3;
          return (
            <div key={i} style={{
              position: "absolute", top: `${(i * 13) % 65 + 10}%`, left: "-8%", fontSize: 22 + (i % 3) * 8,
              animation: `levellio-bat-fly ${duration}s linear infinite`, animationDelay: delay, opacity: 0.8,
            }}>🐺</div>
          );
        }
        return null;
      })}
    </div>
  );
}

const WINNER_CONFIG = {
  mafia: { icon: "🗡️", text: "마피아 팀 승리", color: "#B84C5C", particle: "embers", sound: playMafiaVictory },
  citizen: { icon: "🌾", text: "시민 팀 승리", color: "#E8C468", particle: "confetti", sound: playCitizenVictory },
  cultist: { icon: "😈", text: "악마 숭배자 승리", color: "#7B5EA7", particle: "mist", sound: playCultistVictory },
  vampire: { icon: "🧛", text: "뱀파이어 팀 승리", color: "#8E4C6B", particle: "bats", sound: playVampireVictory },
  thief: { icon: "🎭", text: "괴도 승리", color: "#C9A227", particle: "gems", sound: playThiefVictory },
  werewolf: { icon: "🐺", text: "늑대인간 승리", color: "#8C96DC", particle: "moonwolf", sound: playWerewolfHowl },
  mercenary: { icon: "🗡️", text: "용병 & 건달 동맹 승리", color: "#6B7280", particle: "embers", sound: playMercenaryVictory },
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

function RosterBar({ theme, players, teamCounts }) {
  const aliveCount = players.filter((p) => p.alive).length;
  const n = players.length;
  const PX_PER_VW = 19.2; // 1920px 기준 디자인이므로 1vw = 19.2px
  const AVAILABLE_PX = 1920 - 40 * 2 - 16 * 2; // 로스터 박스 좌우 여백(40)과 안쪽 패딩(16) 제외한 실제 가용 너비
  const GAP_PX = 10;
  const MAX_ROSTER_HEIGHT_PX = 230; // 로스터 전체 높이 상한 - 이걸 절대 넘지 않는다
  const V_PADDING_PX = 24; // 박스 위아래 패딩(각 12px)
  const TITLE_ROW_PX = 42; // 제목 줄의 실제 높이(자체 여백 포함)
  const HEIGHT_BUDGET_PX = MAX_ROSTER_HEIGHT_PX - V_PADDING_PX - TITLE_ROW_PX; // 참여자 목록이 쓸 수 있는 최대 높이
  const PILL_HEIGHT_PX = 40 + 2 * 8; // 아바타+상하패딩 기준 scale=1일 때 한 줄 높이

  // pill 너비를 평균값 하나로 뭉뚱그려 "n/줄수"만큼 균등하게 들어간다고 가정했더니, 실제로는
  // 이름 길이가 제각각이라 줄마다 실제로 들어가는 인원이 달라서 예상보다 줄이 하나 더 생기고
  // 그 줄이 화면 밖으로 잘리는 문제가 있었다. 그래서 각 플레이어의 실제 예상 너비로 진짜
  // flex-wrap과 똑같은 방식으로 줄바꿈을 시뮬레이션하고, 그 결과가 높이 제한 안에 들어가는
  // 가장 큰 배율을 이진탐색으로 정확히 찾는다 - 균등 분배 가정 자체를 없애서 아예 어긋날 일이 없다.
  const estimatePillPx = (p) => {
    let px = 40 + 10 + p.name.length * 16 + 26 + 8; // 아바타 + 간격 + 이름(글자당 약 16px) + 좌우 패딩
    if (p.isSheriff) px += 74; // "⭐ 보안관" 배지
    if (p.inJail) px += 58; // "🔒 감옥" 배지
    if (p.roleLabel) px += p.roleLabel.length * 11 + 26; // 직업 라벨 배지
    return px * 1.08; // 8% 안전 여유 - 실제보다 더 크게 잡아 절대 잘리지 않게 한다
  };
  const pillWidthsPx = players.map(estimatePillPx);

  // 주어진 배율로 pill들을 순서대로 배치했을 때 실제 flex-wrap과 동일한 방식으로 몇 줄이 되는지 센다.
  const rowsNeededAtScale = (testScale) => {
    let rows = 1, rowWidth = 0;
    for (const w of pillWidthsPx) {
      const scaledW = w * testScale;
      if (rowWidth > 0 && rowWidth + GAP_PX * testScale + scaledW > AVAILABLE_PX) {
        rows += 1;
        rowWidth = scaledW;
      } else {
        rowWidth += (rowWidth > 0 ? GAP_PX * testScale : 0) + scaledW;
      }
    }
    return rows;
  };
  const fitsHeight = (testScale) => {
    const rows = rowsNeededAtScale(testScale);
    const heightNeeded = rows * PILL_HEIGHT_PX * testScale + (rows - 1) * GAP_PX * testScale;
    return heightNeeded <= HEIGHT_BUDGET_PX;
  };
  let lo = 0.4, hi = 1.8;
  if (n > 0) {
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (fitsHeight(mid)) lo = mid; else hi = mid;
    }
  }
  const scale = lo;
  const avatarVw = (40 / PX_PER_VW) * scale;
  const nameFontVw = (22 / PX_PER_VW) * scale;
  const badgeFontVw = (15 / PX_PER_VW) * scale;
  const roleFontVw = (16 / PX_PER_VW) * scale;
  const pillGapVw = Math.max(0.2, (10 / PX_PER_VW) * scale);
  const pillPadYVw = Math.max(0.15, (8 / PX_PER_VW) * scale);
  const pillPadXVw = Math.max(0.3, (18 / PX_PER_VW) * scale);
  const rowGapVw = Math.max(0.2, (10 / PX_PER_VW) * scale);
  const badgePadYVw = Math.max(0.05, (3 / 19.2) * scale);
  const badgePadXVw = Math.max(0.2, (10 / 19.2) * scale);
  const rolePadXVw = Math.max(0.26, (12 / 19.2) * scale);

  // 실제 필요한 줄 수를 다시 계산해서, 목록이 2줄만 쓴다면 3~4줄 몫으로 남겨둔 여유 공간을
  // 만들지 않고 박스 높이 자체를 그만큼 줄인다 - 아래 빈 공간이 생기지 않게 하는 핵심.
  const actualRows = n > 0 ? rowsNeededAtScale(scale) : 1;
  const actualContentHeightPx = actualRows * PILL_HEIGHT_PX * scale + (actualRows - 1) * GAP_PX * scale;
  const rosterHeightPx = Math.min(MAX_ROSTER_HEIGHT_PX, V_PADDING_PX + TITLE_ROW_PX + actualContentHeightPx);

  return (
    <div style={{ position: "absolute", left: 40, right: 40, bottom: 30, zIndex: 5, height: rosterHeightPx,
      display: "flex", flexDirection: "column", padding: "12px 16px", borderRadius: 18,
      background: theme.panel, border: `1px solid ${theme.panelBorder}`, backdropFilter: "blur(10px)", boxSizing: "border-box" }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: theme.sub, marginBottom: 12, flexShrink: 0 }}>
        참여자 · {aliveCount}/{players.length}명 생존
        {teamCounts && (
          <> / 마피아팀 {teamCounts.mafia.total}명(마피아{teamCounts.mafia.mafia}+특수직업{teamCounts.mafia.special}) · 시민팀 {teamCounts.citizen.total}명(경찰{teamCounts.citizen.police}+의사{teamCounts.citizen.doctor}+특수직업{teamCounts.citizen.special}+일반직업{teamCounts.citizen.general}) · 중립 {teamCounts.neutral.total}명</>
        )}
      </div>
      {/* 가로+세로 배율을 모두 반영했기 때문에, 어지간해서는 이 안에 빈 공간 없이 다 들어온다.
          그래도 극단적인 경우를 대비해 overflow는 hidden으로 막아서, 다른 영역(채팅·알람)을 절대 침범하지 않도록 한다. */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexWrap: "wrap", gap: `${rowGapVw}vw`, alignContent: "flex-start", justifyContent: "center" }}>
        {players.map((p) => {
          const eliminated = !p.alive || p.inJail;
          return (
            <div key={p.id} style={{
              display: "inline-flex", alignItems: "center", gap: `${pillGapVw}vw`,
              padding: `${pillPadYVw}vw ${pillPadXVw}vw ${pillPadYVw}vw ${pillPadYVw}vw`, borderRadius: 999,
              background: !eliminated ? theme.accentSoft : "rgba(120,120,120,0.16)",
            }}>
              {p.profileImageUrl ? (
                <img src={p.profileImageUrl} alt="" style={{ width: `${avatarVw}vw`, height: `${avatarVw}vw`, borderRadius: "50%", objectFit: "cover", opacity: !eliminated ? 1 : 0.4, flexShrink: 0 }} />
              ) : (
                <div style={{ width: `${avatarVw}vw`, height: `${avatarVw}vw`, borderRadius: "50%", background: !eliminated ? theme.accentSoft : "rgba(120,120,120,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: `${avatarVw * 0.45}vw`, fontWeight: 800, color: theme.text, flexShrink: 0 }}>
                  {!p.alive ? "💀" : p.inJail ? "🔒" : p.name.slice(0, 1)}
                </div>
              )}
              {p.isSheriff && (
                <span style={{ fontSize: `${badgeFontVw}vw`, fontWeight: 800, color: "#E8C468", background: "rgba(232,196,104,0.18)",
                  borderRadius: 999, padding: `${badgePadYVw}vw ${badgePadXVw}vw`, whiteSpace: "nowrap", flexShrink: 0 }}>
                  ⭐ 보안관
                </span>
              )}
              <span style={{
                fontSize: `${nameFontVw}vw`, fontWeight: p.isMafia === true ? 800 : 600, whiteSpace: "nowrap",
                color: p.isMafia === true ? "#E45B54" : !eliminated ? theme.text : theme.sub,
                textDecoration: eliminated ? "line-through" : "none",
              }}>
                {p.name}
              </span>
              {p.inJail && (
                <span style={{ fontSize: `${badgeFontVw}vw`, fontWeight: 800, color: theme.sub, background: "rgba(120,120,120,0.22)",
                  borderRadius: 999, padding: `${badgePadYVw}vw ${badgePadXVw}vw`, whiteSpace: "nowrap", flexShrink: 0 }}>
                  🔒 감옥
                </span>
              )}
              {p.roleLabel && (
                <span style={{
                  fontSize: `${roleFontVw}vw`, fontWeight: 800, color: roleLabelColor(p.roleLabel), background: "rgba(0,0,0,0.14)",
                  borderRadius: 999, padding: `${badgePadYVw}vw ${rolePadXVw}vw`,
                  textShadow: roleLabelShadow(roleLabelColor(p.roleLabel)), whiteSpace: "nowrap", flexShrink: 0,
                }}>
                  {p.roleLabel}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BigTimer({ theme, seconds }) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return <div style={{ fontFamily: "monospace", fontSize: 150, fontWeight: 700, color: theme.accent, letterSpacing: 4, textShadow: "0 8px 30px rgba(0,0,0,0.3)" }}>{mm}:{ss}</div>;
}

function BigChatFeed({ theme, messages, players }) {
  const containerRef = useRef(null);
  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);
  return (
    <div ref={containerRef} style={{ width: 1100, height: 260, overflowY: "auto", marginTop: 24, borderRadius: 20,
      border: `1px solid ${theme.panelBorder}`, background: theme.panel, padding: "24px 30px", backdropFilter: "blur(6px)" }}>
      {messages.length === 0 && <div style={{ fontSize: 24, color: theme.sub, textAlign: "center" }}>아직 채팅이 없습니다</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {messages.slice(-6).map((m, i) => {
          const sender = players?.find((p) => p.id === m.senderId);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {sender?.profileImageUrl ? (
                <img src={sender.profileImageUrl} alt="" width={38} height={38} style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: theme.accentSoft, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: theme.text }}>
                  {sender ? sender.name.slice(0, 1) : "?"}
                </div>
              )}
              <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 0 }}>
                {sender?.activeTitle && (
                  <span style={{ fontSize: 15, color: titleColor(sender.activeTitle, theme), fontWeight: 700, lineHeight: 1.3 }}>&lt;{sender.activeTitle}&gt;</span>
                )}
                <span style={{ fontSize: 26, color: theme.text, lineHeight: 1.3 }}>
                  <b>{m.sender}</b> · {m.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- 낮 화면에 고정으로 떠 있는 지난밤 결과 요약 ---------- */
function NightSummaryPinned({ theme, state, death }) {
  const hadOtherEvent = !!(state.werewolfVictimName || state.curseVictimName || state.vampireFightResult || state.avengerKillResult || state.priestReviveName || state.catAppearedName || state.bodyguardSaveResult || state.judgePardonResult);
  return (
    <div style={{ width: 1100, marginTop: 22, borderRadius: 18, padding: "18px 28px",
      border: `1px solid ${theme.panelBorder}`, background: theme.panel, backdropFilter: "blur(6px)" }}>
      <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 2, color: theme.sub, marginBottom: 8 }}>📌 지난밤 소식</div>
      {(death || state.veteranSurvivedName || (!hadOtherEvent && !state.nightSaveHappened)) && (
        <div style={{ fontSize: 24, color: theme.text }}>
          {death
            ? <>☠️ <b>{death.name}</b>님이 사망한 채로 발견되었습니다</>
            : state.veteranSurvivedName
            ? <>🪖 <b>{state.veteranSurvivedName}</b>님이 마피아의 공격에 맞서 싸워 살아남았습니다</>
            : <>🌤️ 평화로운 밤이었습니다</>}
        </div>
      )}
      {state.nightSaveHappened && (
        <div style={{ fontSize: 24, color: theme.text, marginTop: 8 }}>🛡️ 누군가 습격당했지만 의사의 보호로 목숨을 건졌습니다</div>
      )}
      {state.vampireFightResult && (
        <div style={{ fontSize: 22, color: theme.text, marginTop: 8 }}>
          🩸 <b>{state.vampireFightResult.vampireName}</b>님과 <b>{state.vampireFightResult.mafiaName}</b>님이 사망한 채로 발견되었습니다
        </div>
      )}
      {state.avengerKillResult && (
        <div style={{ fontSize: 22, color: theme.text, marginTop: 8 }}>
          ⚔️ <b>{state.avengerKillResult.avengerName}</b>님과 <b>{state.avengerKillResult.targetName}</b>님이 함께 사망한 채로 발견되었습니다
        </div>
      )}
      {state.werewolfVictimName && (
        <div style={{ fontSize: 22, color: theme.text, marginTop: 8 }}>
          🐺 <b>{state.werewolfVictimName}</b>님이 늑대인간에게 습격당해 목숨을 잃었습니다
        </div>
      )}
      {state.priestReviveName && (
        <div style={{ fontSize: 22, color: theme.text, marginTop: 8 }}>
          🕊️ <b>{state.priestReviveName}</b>님이 성직자에 의해 부활했습니다
        </div>
      )}
      {state.bodyguardSaveResult && (
        <div style={{ fontSize: 22, color: theme.text, marginTop: 8 }}>
          🛡️ <b>{state.bodyguardSaveResult.bodyguardName}</b>님이 <b>{state.bodyguardSaveResult.targetName}</b>님을 지키다 목숨을 잃었습니다{state.bodyguardSaveResult.attackerName ? <>, <b>{state.bodyguardSaveResult.attackerName}</b>님도 함께 쓰러졌습니다</> : ""}
        </div>
      )}
      {state.catAppearedName && (
        <div style={{ fontSize: 22, color: theme.text, marginTop: 8 }}>
          🐱 어느새 고양이 한 마리(<b>{state.catAppearedName}</b>)가 마을에 들어와 있었습니다
        </div>
      )}
      {state.reporterReveal && (
        <div style={{ fontSize: 22, color: theme.text, marginTop: 8 }}>
          📰 <b>{state.reporterReveal.name}</b>님의 직업이 <b>[{state.reporterReveal.roleLabel}]</b>(으)로 공개되었습니다
        </div>
      )}
      {state.curseCastName && (
        <div style={{ fontSize: 22, color: theme.text, marginTop: 8 }}>
          🔮 <b>{state.curseCastName}</b>님이 마녀의 저주를 받았습니다 (3일 후 발동)
        </div>
      )}
      {state.curseVictimName && (
        <div style={{ fontSize: 22, color: theme.text, marginTop: 8 }}>
          💀 <b>{state.curseVictimName}</b>님이 마녀의 저주가 발동해 목숨을 잃었습니다 (마피아의 습격과는 별개)
        </div>
      )}
    </div>
  );
}

/* ---------- 메인 컴포넌트 ---------- */
export default function BroadcastPage() {
  const [state, setState] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [lobbyQueue, setLobbyQueue] = useState(null); // null = 아직 대기 화면 아님, [] = 대기열 비어있음
  const prevPhaseRef = useRef(null);
  const [queue, setQueue] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [cardVisible, setCardVisible] = useState(false);
  const timeoutsRef = useRef([]);
  const prevIdolMessageRef = useRef(null);

  useEffect(() => {
    if (!state) return;
    const prevText = prevIdolMessageRef.current;
    const nextText = state.idolMessage?.text || null;
    prevIdolMessageRef.current = nextText;
    if (nextText && nextText !== prevText) playPhishingAlert();
  }, [state?.idolMessage?.text]);

  useEffect(() => {
    const socket = createBroadcastSocket();
    socket.on("broadcast_state", (s) => { setState(s); setDisabled(false); setLobbyQueue(null); });
    socket.on("broadcast_tick", ({ timerSeconds }) => setState((prev) => (prev ? { ...prev, timerSeconds } : prev)));
    socket.on("broadcast_disabled", () => { setDisabled(true); setLobbyQueue(null); setState(null); });
    socket.on("broadcast_lobby", ({ queue: q }) => { setLobbyQueue(q || []); setDisabled(false); setState(null); });
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (!state) return;
    // 단순히 phase 문자열만 비교하면, "morning" 상태로 두 번 이상 갱신이 오는 경우(예: 재연결, 순서가
    // 어긋난 브로드캐스트) 중 첫 번째에 아직 반영 안 된 밤 결과(예: 마녀 저주 발동)가 나중에 도착해도
    // "이미 morning이었으니 처리 안 함"으로 조용히 씹혀버리는 문제가 있었다. 그래서 morning 단계에서는
    // 단계 이름뿐 아니라 이번 밤에 실제로 일어난 사건들의 내용까지 합쳐서 키로 삼아, 내용이 달라지면
    // (설령 phase 문자열은 "morning" 그대로여도) 다시 큐를 만들도록 한다.
    const nightEventsSignature = state.phase === "morning"
      ? JSON.stringify({
          d: state.lastNightDeath, cv: state.curseVictimName, cc: state.curseCastName,
          wv: state.werewolfVictimName, vf: state.vampireFightResult, ak: state.avengerKillResult,
          pr: state.priestReviveName, jp: state.judgePardonResult, bg: state.bodyguardSaveResult,
          ca: state.catAppearedName, rr: state.reporterReveal, vs: state.veteranSurvivedName,
          ns: state.nightSaveHappened, tb: state.terroristBombVictimName,
        })
      : "";
    const transitionKey = `${state.dayNumber}:${state.phase}:${nightEventsSignature}`;
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = transitionKey;
    if (prev === transitionKey) return;

    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    if (state.phase === "night") { playNightFall(); setQueue([]); setActiveIndex(-1); return; }
    if (state.phase === "vote") { playVote(); setQueue([]); setActiveIndex(-1); return; }
    if (state.phase === "sheriffElectionVote") { playVote(); setQueue([]); setActiveIndex(-1); return; }
    if (state.phase === "sheriffDefense") {
      const sheriffTarget = state.players.find((p) => p.id === state.sheriffDesignatedTarget);
      playDramaticHit();
      setQueue([{ kind: "sheriffDesignate", name: sheriffTarget?.name }]);
      setActiveIndex(0);
      return;
    }
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
      // 마피아의 공격과는 별개로 뜨는 사건들이 하나라도 있다면, 그 밤은 절대 "평화로운 밤"이 아니다.
      const hadOtherEvent = !!(state.werewolfVictimName || state.curseVictimName || state.vampireFightResult || state.avengerKillResult || state.priestReviveName || state.catAppearedName || state.bodyguardSaveResult || state.judgePardonResult);
      if (state.lastNightDeath) {
        const p = state.players.find((x) => x.id === state.lastNightDeath);
        events.push({ kind: "nightDeath", name: p?.name });
      } else if (state.veteranSurvivedName) {
        events.push({ kind: "veteranSurvived", name: state.veteranSurvivedName });
      } else if (!hadOtherEvent && !state.nightSaveHappened) {
        events.push({ kind: "peaceful" });
      }
      // 의사의 보호로 누군가 목숨을 건진 것도 마피아의 습격과는 완전히 별개 사건일 수 있다(예: 히트맨의 공격을
      // 막아낸 경우). 그날 밤 다른 사망이 있었더라도 조용히 묻히지 않도록 항상 독립적으로 큐에 추가한다.
      if (state.nightSaveHappened) {
        events.push({ kind: "nightSave" });
      }
      // 뱀파이어-마피아 격돌은 마피아의 집단 공격과는 완전히 별개 사건이라, 같은 밤에 다른 사망이
      // 있었더라도 항상 독립적으로 큐에 추가한다 (예전엔 else-if로 묶여있어서 조용히 묻히곤 했음).
      if (state.vampireFightResult) {
        events.push({ kind: "vampireFight", vampireName: state.vampireFightResult.vampireName, mafiaName: state.vampireFightResult.mafiaName });
      }
      // 복수자의 복수 킬도 마피아의 습격과는 완전히 별개 사건이라 항상 독립적으로 큐에 추가한다.
      if (state.avengerKillResult) {
        events.push({ kind: "avengerKill", avengerName: state.avengerKillResult.avengerName, targetName: state.avengerKillResult.targetName });
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
      // 보안관이 없다면(처음부터 없었거나, 어제 감옥에 가서 자리가 비었거나) 오늘은 선출이 필요하다는 안내도
      // 지난밤 소식들과 같은 방식으로 연출 큐 맨 끝에 넣는다.
      const hasActiveSheriff = state.players.some((p) => p.isSheriff && p.alive && !p.inJail);
      if (!hasActiveSheriff) {
        events.push({ kind: "sheriffNeeded" });
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

    if (state.phase === "discussion") {
      const events = [];
      if (state.sheriffElectedName) events.push({ kind: "sheriffElected", name: state.sheriffElectedName });
      if (state.sheriffJustJailedName) {
        // 무고한 사람을 처형해 감옥에 간 경우 - "마피아가 아니었다"는 별도 처형결과 카드 없이,
        // 감옥행 알림 하나로 충분히 전달되므로 그것만 보여준다.
        events.push({ kind: "sheriffJailed", name: state.sheriffJustJailedName });
      } else if (state.sheriffExecutionResult) {
        events.push({ kind: "sheriffExecuted", targetName: state.sheriffExecutionResult.targetName, wasMafia: state.sheriffExecutionResult.wasMafia });
      }
      if (events.length > 0) {
        setQueue(events);
        setActiveIndex(0);
        return;
      }
      setQueue([]); setActiveIndex(-1);
      return;
    }

    setQueue([]);
    setActiveIndex(-1);
  }, [state]);

  useEffect(() => {
    if (activeIndex < 0 || activeIndex >= queue.length) { setCardVisible(false); return; }
    const kind = queue[activeIndex].kind;
    setCardVisible(true);

    const soundTimer = setTimeout(() => {
      if (kind === "nightDeath" || kind === "bomb") playMafiaKill();
      else if (kind === "nightSave") playDoctorSave();
      else if (kind === "news") playNewsFlash();
      else if (kind === "curseAnnounced" || kind === "curseDeath") playCurse();
      else if (kind === "sheriffNeeded") playNewsFlash();
      else if (kind === "werewolfAttack") playWerewolfHowl();
      else if (kind === "priestRevive") playRevive();
      else if (kind === "judgePardon") playRevive();
      else if (kind === "catAppeared") playMeow();
      else if (["veteranSurvived", "vampireFight", "avengerKill", "politicianSaved", "executed", "bodyguardSave"].includes(kind)) playDramaticHit();
      else if (kind === "sheriffElected") playRevive();
      else if (kind === "sheriffJailed") playDramaticHit();
      else if (kind === "sheriffExecuted") playElimination();
    }, 150);

    const showMs = kind === "sunrise" ? 2400 : kind === "news" ? 5200 : 3600;
    const hideTimer = setTimeout(() => setCardVisible(false), showMs);
    const nextTimer = setTimeout(() => setActiveIndex((i) => i + 1), showMs + 700);
    timeoutsRef.current.push(soundTimer, hideTimer, nextTimer);
    return () => { clearTimeout(soundTimer); clearTimeout(hideTimer); clearTimeout(nextTimer); };
  }, [activeIndex, queue]);

  if (lobbyQueue) {
    const theme = THEMES.dusk;
    return (
      <div style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", overflow: "hidden",
        background: theme.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <style>{`html,body{margin:0;padding:0;overflow:hidden;} ${FONT_IMPORT}
          @keyframes levellio-pulse { 0%,100% { transform: scale(1); opacity: 0.9; } 50% { transform: scale(1.12); opacity: 1; } }`}</style>
        <GlowIcon theme={theme}>🌾</GlowIcon>
        <div style={{ fontSize: 20, fontWeight: 700, color: theme.sub, marginBottom: 22 }}>참여 대기열 · {lobbyQueue.length}명</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center", maxWidth: 1400, marginBottom: 36 }}>
          {lobbyQueue.length === 0 && <div style={{ fontSize: 24, color: theme.sub }}>아직 참여자가 없습니다</div>}
          {lobbyQueue.map((q) => (
            <div key={q.channelId} style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "10px 22px 10px 10px",
              borderRadius: 999, background: theme.accentSoft }}>
              {q.profileImageUrl ? (
                <img src={q.profileImageUrl} alt="" width={44} height={44} style={{ borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: theme.accentSoft,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: theme.text }}>
                  {q.nickname.slice(0, 1)}
                </div>
              )}
              <span style={{ fontSize: 24, fontWeight: 600, color: theme.text }}>{q.nickname}</span>
            </div>
          ))}
        </div>
        <BigHeadline theme={theme} size={40}>🎬 시작 준비중입니다</BigHeadline>
      </div>
    );
  }

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

  // 상단바 바로 아래에 쌓이는 배너들 - 하나의 배열로 관리해서, 배너 렌더링과 아래 본문 영역의 top 계산이
  // 항상 같은 개수를 참조하도록 한다. 새 배너를 추가할 땐 이 배열에 항목 하나만 더 넣으면 된다.
  const activeBanners = [];
  if (state.idolMessage) {
    activeBanners.push({
      key: "phishing",
      node: (
        <div style={{ display: "flex", alignItems: "center", gap: 12, borderRadius: 14, padding: "10px 20px",
          background: "rgba(120,170,232,0.16)", border: "1px solid rgba(120,170,232,0.45)" }}>
          <span style={{ fontSize: 22 }}>📧</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#78AAE8" }}>알 수 없는 발신번호</span>
          <span style={{ fontSize: 17, fontWeight: 700, color: theme.text }}>{state.idolMessage.text}</span>
        </div>
      ),
    });
  }
  const BANNER_SLOT_HEIGHT = 64; // 배너 하나가 차지하는 세로 공간(여백 포함) - 배너 스타일을 크게 바꾸면 이 값도 같이 조정
  const contentTop = 100 + activeBanners.length * BANNER_SLOT_HEIGHT;

  let restingBody = null;
  if (state.phase === "reveal") {
    restingBody = (
      <>
        <GlowIcon theme={theme}>🕯️</GlowIcon>
        <BigTimer theme={theme} seconds={state.timerSeconds} />
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
        <BigChatFeed theme={theme} messages={state.dayChat} players={state.players} />
      </>
    );
  } else if (state.phase === "sheriffElection") {
    // 보안관 선출 시간도 평소 낮 회의와 같은 화면을 쓴다 - "보안관이 없습니다" 안내는
    // 이미 아침 연출 큐에서 한 번 보여줬으니, 여기서는 그냥 토론 화면과 동일하게 취급한다.
    restingBody = (
      <>
        <BigTimer theme={theme} seconds={state.timerSeconds} />
        <BigHeadline theme={theme} size={44}>채팅으로 회의를 진행해주세요</BigHeadline>
        <NightSummaryPinned theme={theme} state={state} death={death} />
        <BigChatFeed theme={theme} messages={state.dayChat} players={state.players} />
      </>
    );
  } else if (state.phase === "sheriffElectionVote") {
    const isRunoff = state.sheriffRunoffCandidates?.length > 0;
    const eligibleCandidates = isRunoff
      ? state.players.filter((p) => p.alive && state.sheriffRunoffCandidates.includes(p.id))
      : state.players.filter((p) => p.alive && p.role !== "cat");
    const voteEntries = Object.entries(state.sheriffElectionVotes || {});
    const votersFor = (targetId) => voteEntries
      .filter(([, t]) => t === targetId)
      .map(([voterId]) => state.players.find((p) => p.id === voterId))
      .filter(Boolean);
    // 아무도 투표하지 않은 후보는 화면을 복잡하게만 하니 표시하지 않는다. 투표가 취소되면 자동으로 다시 사라진다.
    const votedCandidates = eligibleCandidates
      .map((p) => ({ p, voters: votersFor(p.id) }))
      .filter(({ voters }) => voters.length > 0);
    restingBody = (
      <>
        <GlowIcon theme={theme} color="#E8C468">🗳️</GlowIcon>
        <BigTimer theme={theme} seconds={state.timerSeconds} />
        <BigHeadline theme={theme}>
          {isRunoff ? "동점자 재투표가 진행 중입니다" : "보안관 선출 투표가 진행 중입니다"}
        </BigHeadline>
        {votedCandidates.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center", marginTop: 22 }}>
            {votedCandidates.map(({ p, voters }) => (
              <div key={p.id} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                width: 130, height: 130, padding: "14px 12px", borderRadius: 16, background: "rgba(0,0,0,0.15)",
              }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: theme.text, maxWidth: "100%",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.name}
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center",
                  height: 56, overflowY: "auto", alignContent: "flex-start" }}>
                  {voters.map((v) => (
                    v.profileImageUrl ? (
                      <img key={v.id} src={v.profileImageUrl} alt="" width={24} height={24} style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                    ) : (
                      <div key={v.id} style={{ width: 24, height: 24, borderRadius: "50%", background: theme.accentSoft, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: theme.text }}>
                        {v.name.slice(0, 1)}
                      </div>
                    )
                  ))}
                </div>
                <span style={{ fontSize: 13, color: theme.sub }}>{voters.length}표</span>
              </div>
            ))}
          </div>
        )}
      </>
    );
  } else if (state.phase === "sheriffDefense") {
    const sheriffTarget = state.players.find((p) => p.id === state.sheriffDesignatedTarget);
    restingBody = (
      <>
        <BigTimer theme={theme} seconds={state.timerSeconds} />
        <BigHeadline theme={theme}>⚖️ {sheriffTarget?.name}님의 최후 변론</BigHeadline>
        <BigChatFeed theme={theme} messages={state.dayChat} players={state.players} />
      </>
    );
  } else if (state.phase === "sheriffVerdict") {
    const sheriffTarget = state.players.find((p) => p.id === state.sheriffDesignatedTarget);
    restingBody = (
      <>
        <GlowIcon theme={theme} color="#E8C468">⭐</GlowIcon>
        <BigTimer theme={theme} seconds={state.timerSeconds} />
        <BigHeadline theme={theme}>보안관이 {sheriffTarget?.name}님의 운명을 심판하고 있습니다</BigHeadline>
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
        <BigChatFeed theme={theme} messages={state.dayChat} players={state.players} />
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
        @keyframes levellio-gem-fall { 0% { transform: translateY(-10vh) translateX(0) rotate(45deg); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateY(110vh) translateX(24px) rotate(405deg); opacity: 0.9; } }
        @keyframes levellio-gem-twinkle { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.9); } }
        @keyframes levellio-shockwave { 0% { transform: scale(0.4); opacity: 0.8; } 100% { transform: scale(1.7); opacity: 0; } }
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

      {activeBanners.length > 0 && (
        <div style={{ position: "absolute", top: 96, left: 56, right: 56, zIndex: 6, display: "flex", flexDirection: "column", gap: 10 }}>
          {activeBanners.map((b) => <React.Fragment key={b.key}>{b.node}</React.Fragment>)}
        </div>
      )}

      {/* 로스터가 bottom:30 + height:230(+padding 24) 만큼 차지하므로, 콘텐츠 영역은 그 위까지만 내려오게 한다.
          여유 공간(20px)을 더 둬서 계산이 살짝 어긋나도 겹치지 않게 하고, overflow도 hidden으로 막아
          안의 내용이 아무리 길어져도 이 경계 밖으로(=로스터 쪽으로) 새어나가지 않도록 한다. */}
      <div style={{ position: "absolute", top: contentTop, left: 0, right: 0, bottom: 30 + 230 + 24 + 20, overflow: "hidden" }}>
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
                <BigHeadline theme={theme}>{current.name}님이 사망한 채로 발견되었습니다</BigHeadline>
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
                <GlowIcon theme={theme} color="#8E1F3A">🩸</GlowIcon>
                <BigHeadline theme={theme}>{current.vampireName}님과 {current.mafiaName}님이 사망한 채로 발견되었습니다</BigHeadline>
              </>
            )}
            {current.kind === "avengerKill" && (
              <>
                <GlowIcon theme={theme} color="#8E1F3A">⚔️</GlowIcon>
                <BigHeadline theme={theme}>{current.avengerName}님과 {current.targetName}님이 함께 사망한 채로 발견되었습니다</BigHeadline>
                <BigSubtext theme={theme}>복수는 스스로의 목숨까지 대가로 치렀습니다</BigSubtext>
              </>
            )}
            {current.kind === "werewolfAttack" && (
              <>
                <GlowIcon theme={theme} color="#8C96DC">🐺</GlowIcon>
                <BigHeadline theme={theme}>{current.name}님이 늑대인간에게 습격당했습니다</BigHeadline>
                <BigSubtext theme={theme}>보름달 아래, 날카로운 발톱과 이빨 자국만이 남았습니다</BigSubtext>
              </>
            )}
            {current.kind === "priestRevive" && (
              <>
                <GlowIcon theme={theme} color="#E8C468">🕊️</GlowIcon>
                <BigHeadline theme={theme}>{current.name}님이 성직자에 의해 부활했습니다</BigHeadline>
                <BigSubtext theme={theme}>따뜻한 빛이 마을에 다시 한 번의 기회를 내려주었습니다</BigSubtext>
              </>
            )}
            {current.kind === "judgePardon" && (
              <>
                <GlowIcon theme={theme} color="#5B9BF0">⚖️</GlowIcon>
                <BigHeadline theme={theme}>{current.name}님이 판사에 의해 사면되었습니다</BigHeadline>
                <BigSubtext theme={theme}>감옥에서 풀려나 다시 게임에 참여할 수 있게 되었습니다</BigSubtext>
              </>
            )}
            {current.kind === "sheriffElected" && (
              <>
                <GlowIcon theme={theme} color="#E8C468">⭐</GlowIcon>
                <BigHeadline theme={theme}>{current.name}님이 보안관으로 선출되었습니다!</BigHeadline>
                <BigSubtext theme={theme}>마을의 새로운 질서를 책임지게 되었습니다</BigSubtext>
              </>
            )}
            {current.kind === "sheriffDesignate" && (
              <>
                <GlowIcon theme={theme} color="#E8C468">⭐</GlowIcon>
                <BigHeadline theme={theme}>보안관이 {current.name}님을 처형대에 세웠습니다</BigHeadline>
                <BigSubtext theme={theme}>곧 최후 변론이 시작됩니다</BigSubtext>
              </>
            )}
            {current.kind === "sheriffJailed" && (
              <>
                <GlowIcon theme={theme} color="#E05F5F">🚨</GlowIcon>
                <BigHeadline theme={theme}>무고한 처형으로 {current.name}님이 감옥에 수감되었습니다</BigHeadline>
                <BigSubtext theme={theme}>보안관 직위가 즉시 박탈되었습니다</BigSubtext>
              </>
            )}
            {current.kind === "sheriffExecuted" && (
              <>
                <GlowIcon theme={theme} color="#E8C468">⭐</GlowIcon>
                <BigHeadline theme={theme}>{current.targetName}님이 보안관에 의해 처형되었습니다</BigHeadline>
                <BigSubtext theme={theme}>{current.wasMafia ? "마피아팀이었습니다" : "마피아팀이 아니었습니다"}</BigSubtext>
              </>
            )}
            {current.kind === "bodyguardSave" && (
              <>
                <GlowIcon theme={theme} color="#5B9BF0">🛡️</GlowIcon>
                <BigHeadline theme={theme}>{current.bodyguardName}님이 {current.targetName}님을 지키다 목숨을 잃었습니다</BigHeadline>
                <BigSubtext theme={theme}>{current.attackerName ? `${current.attackerName}님도 함께 쓰러졌습니다` : "몸을 던져 지켜냈습니다"}</BigSubtext>
              </>
            )}
            {current.kind === "catAppeared" && (
              <>
                <GlowIcon theme={theme} color="#E8B478">🐱</GlowIcon>
                <BigHeadline theme={theme}>어느새 고양이 한 마리가 마을에 들어와 있었습니다</BigHeadline>
                <BigSubtext theme={theme}>이름은 {current.name} — 아무도 언제부터인지 알지 못합니다</BigSubtext>
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
                <BigSubtext theme={theme}>3일 후 저주가 발동됩니다. 그 전에 마녀가 처형되면 저주는 풀립니다.</BigSubtext>
              </>
            )}
            {current.kind === "curseDeath" && (
              <>
                <GlowIcon theme={theme} color="#7B5EA7">💀</GlowIcon>
                <BigHeadline theme={theme}>저주로 인해 {current.name}님이 목숨을 잃었습니다</BigHeadline>
              </>
            )}
            {current.kind === "sheriffNeeded" && (
              <>
                <GlowIcon theme={theme} color="#E8C468">⭐</GlowIcon>
                <BigHeadline theme={theme}>마을에 보안관이 없습니다</BigHeadline>
                <BigSubtext theme={theme}>토론 후 투표로 보안관을 선출합니다</BigSubtext>
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

      <RosterBar theme={theme} players={state.players} teamCounts={state.teamCounts} />

      {state.phase === "gameover" && (() => {
        const w = WINNER_CONFIG[state.winner] || WINNER_CONFIG.citizen;
        return (
          <div style={{
            position: "absolute", inset: 0, zIndex: 100, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", background: theme.bg,
            animation: "levellio-title-pop 500ms ease both",
          }}>
            <div style={{
              position: "absolute", inset: 0,
              background: `radial-gradient(circle at 50% 42%, ${w.color}33 0%, ${w.color}00 62%)`,
            }} />
            <Particles variant={w.particle} />
            <div style={{ position: "relative", width: 340, height: 340, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 26 }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${w.color}`, opacity: 0, animation: "levellio-shockwave 2.2s ease-out infinite" }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${w.color}`, opacity: 0, animation: "levellio-shockwave 2.2s ease-out infinite", animationDelay: "0.7s" }} />
              <div style={{
                position: "absolute", inset: 18, borderRadius: "50%",
                background: `radial-gradient(circle, ${w.color}66 0%, ${w.color}00 72%)`,
                animation: "levellio-pulse 2.2s ease-in-out infinite",
              }} />
              <div style={{ fontSize: 212, lineHeight: 1, filter: "drop-shadow(0 12px 34px rgba(0,0,0,0.4))", animation: "levellio-title-pop 900ms cubic-bezier(0.22,1.4,0.36,1) both" }}>
                {w.icon}
              </div>
            </div>
            <div style={{ animation: "levellio-title-pop 900ms cubic-bezier(0.22,1.4,0.36,1) both", animationDelay: "120ms" }}>
              <BigHeadline theme={theme} size={84}>{w.text}</BigHeadline>
            </div>
            <div style={{ marginTop: 16, fontSize: 24, fontWeight: 700, letterSpacing: 6, color: w.color, textTransform: "uppercase" }}>
              🏆 GAME OVER 🏆
            </div>
            <RosterBar theme={theme} players={state.players} teamCounts={state.teamCounts} />
          </div>
        );
      })()}
    </div>
  );
}
