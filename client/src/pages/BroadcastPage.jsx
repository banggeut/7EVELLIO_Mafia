import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NOIR_THEMES as THEMES, noirThemeForPhase as themeForPhase, PHASE_LABEL } from "../theme.js";
import { createBroadcastSocket } from "../socket.js";
import { setTimerSeconds, useTimerSeconds } from "../timerStore.js";
import { titleColor, TITLE_ANIMATION_CSS, TitleBadge, NoirAtmosphere, useChatSeq } from "../components/ui.jsx";
import { NoirIcon, NOIR_ICON_CSS } from "../components/noirIcons.jsx";
import { RoleIcon } from "../components/roleIcons.jsx";
import {
  FONT_IMPORT, FadeStage, GlowIcon, BigHeadline, BigSubtext, extraNightEventList, hasExtraNightEvents, useAlertSequence, AlertCard,
} from "../components/alertSequence.jsx";
import {
  playNightFall, playDayBreak, playVote, playDramaticHit, playWerewolfHowl, playPhishingAlert,
  playCitizenVictory, playMafiaVictory, playCultistVictory, playVampireVictory, playThiefVictory, playMercenaryVictory,
  playSample, preloadBroadcastSamples,
} from "../sound.js";

const PHASE_FALLBACK = { night_fall: () => playNightFall(), vote_start: () => playVote(), sheriff_designate: () => playDramaticHit(), official_pick: () => playVote(), day_break: () => playDayBreak() };

// 공개된 직업 라벨을 팀/분류에 따라 색으로 구분한다 (게임 화면 ui.jsx와 동일한 기준).
const MAFIA_LABELS = new Set(["마피아", "스파이", "해커", "마담", "유괴범", "테러리스트", "마녀", "사기꾼", "대부", "히트맨"]);
const CITIZEN_FORCED_LABELS = new Set(["경찰", "의사"]);
const CITIZEN_PLAIN_LABELS = new Set(["시민", "백수", "교사", "학생", "상담원", "피싱", "검시관", "교도관"]);
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

/* ---------- 승리 파티클 연출 ---------- */
const CONFETTI_COLORS = ["#D19A4C", "#EDE6D6", "#C4323A", "#8C96A6", "#F1DFA8", "#6B1E24"]; // 누아르: 황동·아이보리·크림슨·강철

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
              animation: `levellio-mist-drift ${6 + (i % 3)}s ease-in-out infinite`, animationDelay: delay,
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
              animation: `levellio-bat-fly ${duration}s linear infinite`, animationDelay: delay, opacity: 0.85, lineHeight: 0,
            }}><NoirIcon name="bat" size={(26 + (i % 3) * 10) * 1.6} color="#1a0f14" style={{ filter: "drop-shadow(0 0 6px rgba(192,87,127,0.7))" }} /></div>
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
                animation: `levellio-mist-drift ${6 + (i % 3)}s ease-in-out infinite`, animationDelay: delay,
              }} />
            );
          }
          const duration = 6 + (i % 4) * 1.3;
          return (
            <div key={i} style={{
              position: "absolute", top: `${(i * 13) % 65 + 10}%`, left: "-8%", fontSize: 22 + (i % 3) * 8,
              animation: `levellio-bat-fly ${duration}s linear infinite`, animationDelay: delay, opacity: 0.8, lineHeight: 0,
            }}><NoirIcon name="paw" size={(22 + (i % 3) * 8) * 1.4} color="#8C96DC" style={{ filter: "drop-shadow(0 0 8px rgba(140,150,220,0.8))" }} /></div>
          );
        }
        return null;
      })}
    </div>
  );
}

const WINNER_CONFIG = {
  mafia: { icon: "revolver", text: "마피아 팀 승리", color: "#C4323A", particle: "embers", sound: () => playSample("win_mafia", { fallback: playMafiaVictory }) },
  citizen: { icon: "magnifier", text: "시민 팀 승리", color: "#E8C468", particle: "confetti", sound: () => playSample("win_citizen", { fallback: playCitizenVictory }) },
  cultist: { icon: "pentagram", text: "악마 숭배자 승리", color: "#9A7BCB", particle: "mist", sound: () => playSample("win_cultist", { fallback: playCultistVictory }) },
  vampire: { icon: "fangs", text: "뱀파이어 팀 승리", color: "#C0577F", particle: "bats", sound: () => playSample("win_vampire", { fallback: playVampireVictory }) },
  thief: { icon: "mask", text: "괴도 승리", color: "#C9A227", particle: "gems", sound: () => playSample("win_thief", { fallback: playThiefVictory }) },
  werewolf: { icon: "claws", text: "늑대인간 승리", color: "#8C96DC", particle: "moonwolf", sound: () => playSample("win_werewolf", { fallback: playWerewolfHowl }) },
  mercenary: { icon: "daggers", text: "용병 & 건달 동맹 승리", color: "#8C96A6", particle: "embers", sound: () => playSample("win_mercenary", { fallback: playMercenaryVictory }) },
};

/* ---------- 상단/하단 상시 UI ---------- */
function TopBar({ theme, state }) {
  const kicker = state.phase === "night" ? "NIGHT OPERATION" : state.phase === "gameover" ? "CASE CLOSED" : ["reveal", "lobby", "setup"].includes(state.phase) ? "IDENTITY FILE" : "INTERROGATION";
  return (
    <div style={{ position: "absolute", top: 34, left: 56, right: 56, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 5 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: "'Special Elite', 'Courier Prime', monospace", fontSize: 15, letterSpacing: "0.32em", color: theme.accent }}>
          ■ 7EVELLIO · {kicker}
          <span style={{ width: 220, height: 1, background: `linear-gradient(90deg, ${theme.accent}99, transparent)` }} />
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 12, fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: 32, color: theme.text, textShadow: "0 3px 16px rgba(0,0,0,0.9)" }}>
          <NoirIcon name={state.phase === "night" ? "moon" : state.phase === "gameover" ? "casefile" : "candle"} size={40} color={theme.accent} style={{ flexShrink: 0 }} />
          {PHASE_LABEL(state)}
        </div>
      </div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 10, fontFamily: "'Special Elite', 'Courier Prime', monospace", fontSize: 16, letterSpacing: "0.22em",
        color: theme.text, padding: "8px 18px", borderRadius: 2, border: `1px solid ${theme.panelBorder}`, background: "rgba(0,0,0,0.45)" }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#E0474F", boxShadow: "0 0 10px #E0474F", animation: "noir-live 1.4s ease-in-out infinite" }} />
        SURVEILLANCE · 관전 모드
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
    if (p.roleLabel) px += p.roleLabel.length * 11 + 42; // 직업 라벨 배지
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
  // 추정치가 실제 렌더링과 어긋나 줄이 넘치면(긴 닉네임·직업 배지 등) 아래 측정 단계에서 배율을 한 번 더 줄인다.
  const fitKey = players.map((p) => `${p.name}:${p.roleLabel || ""}:${p.isSheriff ? 1 : 0}:${p.inJail ? 1 : 0}:${p.alive ? 1 : 0}`).join("|");
  const [fix, setFix] = useState({ key: "", shrink: 1, contentPx: 0 });
  const shrink = fix.key === fitKey ? fix.shrink : 1;
  const measuredPx = fix.key === fitKey ? fix.contentPx : 0;
  const listRef = useRef(null);
  const scale = lo * shrink;
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
  const rosterHeightPx = Math.min(MAX_ROSTER_HEIGHT_PX, V_PADDING_PX + TITLE_ROW_PX + Math.max(actualContentHeightPx, measuredPx));
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const need = el.scrollHeight, have = el.clientHeight;
    if (need <= have + 1) return;
    if (need <= HEIGHT_BUDGET_PX && need > measuredPx) setFix({ key: fitKey, shrink, contentPx: need }); // 박스를 늘리면 들어가는 경우
    else if (shrink > 0.45) setFix({ key: fitKey, shrink: shrink * 0.92, contentPx: 0 }); // 최대 높이로도 모자라면 더 작게
  });

  return (
    <div style={{ position: "absolute", left: 40, right: 40, bottom: 30, zIndex: 5, height: rosterHeightPx,
      display: "flex", flexDirection: "column", padding: "12px 16px", borderRadius: 3,
      background: `linear-gradient(180deg, rgba(255,255,255,0.025), rgba(0,0,0,0.2)), ${theme.panel}`, border: `1px solid ${theme.panelBorder}`,
      borderTop: `1px solid ${theme.accent}88`, boxShadow: "0 -10px 40px rgba(0,0,0,0.6)", boxSizing: "border-box" }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: theme.sub, marginBottom: 12, flexShrink: 0 }}>
        <span style={{ fontFamily: "'Special Elite', monospace", letterSpacing: "0.26em", color: theme.accent, marginRight: 12 }}>SUSPECTS</span>
        참여자 · {aliveCount}/{players.length}명 생존
        {teamCounts && (
          <> / 마피아팀 {teamCounts.mafia.total}명(마피아{teamCounts.mafia.mafia}+특수직업{teamCounts.mafia.special}) · 시민팀 {teamCounts.citizen.total}명(경찰{teamCounts.citizen.police}+의사{teamCounts.citizen.doctor}+특수직업{teamCounts.citizen.special}+일반직업{teamCounts.citizen.general}) · 중립 {teamCounts.neutral.total}명</>
        )}
      </div>
      {/* 가로+세로 배율을 모두 반영했기 때문에, 어지간해서는 이 안에 빈 공간 없이 다 들어온다.
          그래도 극단적인 경우를 대비해 overflow는 hidden으로 막아서, 다른 영역(채팅·알람)을 절대 침범하지 않도록 한다. */}
      <div ref={listRef} style={{ flex: 1, overflow: "hidden", display: "flex", flexWrap: "wrap", gap: `${rowGapVw}vw`, alignContent: "flex-start", justifyContent: "center" }}>
        {players.map((p) => {
          const eliminated = !p.alive || p.inJail;
          return (
            <div key={p.id} style={{
              display: "inline-flex", alignItems: "center", gap: `${pillGapVw}vw`,
              padding: `${pillPadYVw}vw ${pillPadXVw}vw ${pillPadYVw}vw ${pillPadYVw}vw`, borderRadius: 2,
              background: !eliminated ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.55)",
              border: `1px solid ${!eliminated ? theme.panelBorder : "rgba(120,120,120,0.18)"}`,
              borderLeft: `3px solid ${p.isMafia === true ? "#C4323A" : !eliminated ? theme.accent : "rgba(120,120,120,0.35)"}`,
              filter: eliminated ? "grayscale(0.7)" : "none",
            }}>
              {p.profileImageUrl ? (
                <img src={p.profileImageUrl} alt="" style={{ width: `${avatarVw}vw`, height: `${avatarVw}vw`, borderRadius: "50%", objectFit: "cover", opacity: !eliminated ? 1 : 0.45, filter: !eliminated ? "saturate(0.85)" : "grayscale(1)", flexShrink: 0 }} />
              ) : (
                <div style={{ width: `${avatarVw}vw`, height: `${avatarVw}vw`, borderRadius: "50%", background: !eliminated ? theme.accentSoft : "rgba(120,120,120,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: `${avatarVw * 0.45}vw`, fontWeight: 800, color: theme.text, flexShrink: 0 }}>
                  {!p.alive ? <NoirIcon name="skull" size={20} color={theme.sub} style={{ width: `${avatarVw * 0.62}vw`, height: `${avatarVw * 0.62}vw` }} />
                    : p.inJail ? <NoirIcon name="lock" size={20} color={theme.sub} style={{ width: `${avatarVw * 0.58}vw`, height: `${avatarVw * 0.58}vw` }} />
                    : p.name.slice(0, 1)}
                </div>
              )}
              {p.isSheriff && (
                <span style={{ fontSize: `${badgeFontVw}vw`, fontWeight: 800, color: "#E8C468", background: "rgba(232,196,104,0.18)",
                  borderRadius: 2, padding: `${badgePadYVw}vw ${badgePadXVw}vw`, whiteSpace: "nowrap", flexShrink: 0 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: `${badgePadXVw * 0.4}vw` }}><NoirIcon name="badge" size={14} color="#E8C468" style={{ width: `${badgeFontVw * 1.25}vw`, height: `${badgeFontVw * 1.25}vw` }} />보안관</span>
                </span>
              )}
              <span style={{
                fontSize: `${nameFontVw}vw`, fontWeight: p.isMafia === true ? 800 : 600, whiteSpace: "nowrap",
                color: p.isMafia === true ? "#E0474F" : !eliminated ? theme.text : theme.sub,
                textDecoration: eliminated ? "line-through" : "none",
              }}>
                {p.name}
              </span>
              {p.inJail && (
                <span style={{ fontSize: `${badgeFontVw}vw`, fontWeight: 800, color: theme.sub, background: "rgba(120,120,120,0.22)",
                  borderRadius: 2, padding: `${badgePadYVw}vw ${badgePadXVw}vw`, whiteSpace: "nowrap", flexShrink: 0 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: `${badgePadXVw * 0.4}vw` }}><NoirIcon name="lock" size={14} color={theme.sub} style={{ width: `${badgeFontVw * 1.15}vw`, height: `${badgeFontVw * 1.15}vw` }} />감옥</span>
                </span>
              )}
              {p.roleLabel && (
                <span style={{
                  fontSize: `${roleFontVw}vw`, fontWeight: 800, color: roleLabelColor(p.roleLabel), background: "rgba(0,0,0,0.5)",
                  borderRadius: 2, padding: `${badgePadYVw}vw ${rolePadXVw}vw`,
                  textShadow: roleLabelShadow(roleLabelColor(p.roleLabel)), whiteSpace: "nowrap", flexShrink: 0,
                }}>
                  <RoleIcon label={p.roleLabel} size="1.05em" inline color={roleLabelColor(p.roleLabel)} />{p.roleLabel}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BigTimer({ theme, seconds: fallbackSeconds }) {
  const seconds = useTimerSeconds(fallbackSeconds);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const urgent = seconds <= 10;
  const color = urgent ? "#E0474F" : theme.name === "day" ? theme.text : theme.accent;
  return (
    <div style={{ fontFamily: "'Courier Prime', 'Special Elite', monospace", fontSize: 140, fontWeight: 700, color, letterSpacing: 10, lineHeight: 1.05,
      padding: "0 40px", borderTop: `2px solid ${color}55`, borderBottom: `2px solid ${color}55`, background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.5), transparent)",
      textShadow: `0 0 28px ${color}77, 0 8px 30px rgba(0,0,0,0.8)`, animation: urgent ? "noir-timer-urgent 1s ease-in-out infinite" : "none" }}>
      {mm}:{ss}
    </div>
  );
}

function BigChatFeed({ theme, messages, players, width = 1100, height = 260 }) {
  const containerRef = useRef(null);
  const seq = useChatSeq(messages); // 채팅이 200개(서버 보관 한도)를 넘어도 새 메시지를 감지하도록 누적 번호 사용
  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [seq.total]);
  return (
    <div ref={containerRef} style={{ width, height, overflowY: "auto", marginTop: 24, borderRadius: 3,
      border: `1px solid ${theme.panelBorder}`, borderTop: `1px solid ${theme.accent}88`, background: `linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.45)), ${theme.panel}`,
      padding: "24px 30px", boxShadow: "0 24px 60px rgba(0,0,0,0.6)", scrollbarWidth: "none", display: "flex", flexDirection: "column" }}>
      {/* 첫 채팅도 아래에서부터 쌓여 위로 밀려 올라가게 하는 빈 공간 */}
      <div aria-hidden style={{ flex: "1 0 auto" }} />
      {messages.length === 0 && <div style={{ fontSize: 24, color: theme.sub, textAlign: "center" }}>아직 채팅이 없습니다</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, flexShrink: 0 }}>
        {messages.slice(-6).map((m, i) => {
          const sender = players?.find((p) => p.id === m.senderId);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {sender?.profileImageUrl ? (
                <img src={sender.profileImageUrl} alt="" width={38} height={38} style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0, filter: "saturate(0.85)", boxShadow: `0 0 0 1px ${theme.panelBorder}` }} />
              ) : (
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: theme.accentSoft, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: theme.text }}>
                  {sender ? sender.name.slice(0, 1) : "?"}
                </div>
              )}
              <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 0, alignItems: "flex-start" }}>
                {sender?.activeTitle && (
                  <TitleBadge title={sender.activeTitle} style={{ fontSize: 15, color: titleColor(sender.activeTitle, theme), fontWeight: 700, lineHeight: 1.3 }} />
                )}
                <span style={{ fontSize: 26, color: theme.text, lineHeight: 1.3 }}>
                  <b style={{ color: theme.accent }}>{m.sender}</b> <span style={{ color: theme.sub }}>·</span> {m.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** 지난밤 소식·배너 등 본문 줄 앞에 붙는 작은 누아르 아이콘 (이모지 대신) */
function LineIcon({ name, color, size = 34 }) {
  return <NoirIcon name={name} size={size} color={color} style={{ flexShrink: 0, filter: `drop-shadow(0 0 6px ${color}55)` }} />;
}
function ReportLine({ icon, color, size = 22, first, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: size, color: "inherit", marginTop: first ? 0 : 8, breakInside: "avoid" }}>
      <LineIcon name={icon} color={color} size={size + 12} />
      <span>{children}</span>
    </div>
  );
}
const SAVE_ICON = { saint: ["halo", "#EFE2B8"], bodyguard: ["earpiece", "#5B9BF0"] };

function saveByText(state) {
  return state.nightSaveBy === "saint" ? "성녀의 가호로" : state.nightSaveBy === "bodyguard" ? "경호원의 경호로" : "의사의 보호로";
}

/* 낮 회의 화면 - 지난밤 소식이 많으면 타이머·채팅(왼쪽)과 소식(오른쪽)을 나란히 배치해 글씨가 작아지지 않게 한다 */
function DiscussionBody({ theme, state, death }) {
  const many = nightSummaryLineCount(state, death) > 5;
  if (!many) {
    return (
      <>
        <BigTimer theme={theme} seconds={state.timerSeconds} />
        <BigHeadline theme={theme} size={44}>채팅으로 회의를 진행해주세요</BigHeadline>
        <NightSummaryPinned theme={theme} state={state} death={death} />
        <BigChatFeed theme={theme} messages={state.dayChat} players={state.players} />
      </>
    );
  }
  return (
    <div style={{ display: "flex", gap: 40, alignItems: "stretch" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 760 }}>
        <BigTimer theme={theme} seconds={state.timerSeconds} />
        <BigHeadline theme={theme} size={38}>채팅으로 회의를 진행해주세요</BigHeadline>
        <BigChatFeed theme={theme} messages={state.dayChat} players={state.players} width={760} height={330} />
      </div>
      <NightSummaryPinned theme={theme} state={state} death={death} side />
    </div>
  );
}

/* ---------- 낮 화면에 고정으로 떠 있는 지난밤 결과 요약 ---------- */
function nightSummaryLineCount(state, death) {
  const hadOtherEvent = !!(state.werewolfVictimName || state.curseVictimName || state.vampireFightResult || state.avengerKillResult || state.priestReviveName || state.catAppearedName || state.bodyguardSaveResult || state.judgePardonResult || state.veteranSurvivedName || state.nightLordResult || hasExtraNightEvents(state));
  const lineCount = [state.nightLordResult, death || (!hadOtherEvent && !state.nightSaveHappened), state.veteranSurvivedName, state.nightSaveHappened,
    state.hitmanKillVictimName && state.hitmanKillVictimId !== state.lastNightDeath, state.soloKillVictimName, state.vampireFightResult, state.vampireFightResult,
    state.avengerKillResult, state.werewolfVictimName, state.priestReviveName, state.bodyguardSaveResult, state.bodyguardLastWord, state.catAppearedName,
    state.reporterReveal, state.curseCastName, state.curseVictimName].filter(Boolean).length + extraNightEventList(state).length;
  return lineCount;
}
function NightSummaryPinned({ theme, state, death, side = false }) {
  const hadOtherEvent = !!(state.werewolfVictimName || state.curseVictimName || state.vampireFightResult || state.avengerKillResult || state.priestReviveName || state.catAppearedName || state.bodyguardSaveResult || state.judgePardonResult || state.veteranSurvivedName || state.nightLordResult || hasExtraNightEvents(state));
  const lineCount = nightSummaryLineCount(state, death);
  const twoCol = !side && lineCount > 5;
  return (
    <div style={{ width: side ? 860 : twoCol ? 1560 : 1100, marginTop: side ? 0 : 22, alignSelf: side ? "stretch" : undefined, borderRadius: 2, padding: "18px 28px",
      border: `1px solid ${theme.panelBorder}`, borderLeft: `4px solid ${theme.accent}`,
      background: `linear-gradient(90deg, ${theme.accentSoft}, rgba(0,0,0,0.35)), rgba(10,9,8,0.72)` }}>
      <div style={{ fontFamily: "'Special Elite', monospace", fontSize: 15, letterSpacing: "0.26em", color: theme.accent, marginBottom: 8 }}>■ LAST NIGHT REPORT · 지난밤 소식</div>
      <div style={{ columnCount: twoCol ? 2 : 1, columnGap: 48 }}>
      {state.nightLordResult && (
        <div style={{ color: "#F0B4BC", marginBottom: 8 }}><ReportLine first size={24} icon="crownmoon" color="#C4455A">밤의 지배자가 깨어나, 마피아팀을 제외한 모든 능력이 무력화되었습니다</ReportLine></div>
      )}
      {(death || (!hadOtherEvent && !state.nightSaveHappened)) && (
        <div style={{ color: theme.text }}>
          {death
            ? <ReportLine first size={24} icon="chalk" color="#C4323A"><b>{death.name}</b>님이 사망한 채로 발견되었습니다</ReportLine>
            : <ReportLine first size={24} icon="coffee" color={theme.accent}>평화로운 밤이었습니다</ReportLine>}
        </div>
      )}
      {state.veteranSurvivedName && (
        <div style={{ color: theme.text }}><ReportLine size={24} icon="dogtags" color="#C09A6A"><b>{state.veteranSurvivedName}</b>님이 공격에 맞서 싸워 살아남았습니다</ReportLine></div>
      )}
      {state.nightSaveHappened && (
        <div style={{ color: theme.text }}><ReportLine size={24} icon={(SAVE_ICON[state.nightSaveBy] || ["pulse"])[0]} color={(SAVE_ICON[state.nightSaveBy] || [0, "#8FC9A0"])[1]}><b>{state.nightSavedName || "누군가"}</b>님이 습격당했지만 {saveByText(state)} 목숨을 건졌습니다</ReportLine></div>
      )}
      {state.hitmanKillVictimName && state.hitmanKillVictimId !== state.lastNightDeath && (
        <div style={{ color: theme.text }}><ReportLine size={24} icon="chalk" color="#C4323A"><b>{state.hitmanKillVictimName}</b>님이 사망한 채로 발견되었습니다</ReportLine></div>
      )}
      {state.soloKillVictimName && state.soloKillVictimId !== state.lastNightDeath && state.soloKillVictimId !== state.hitmanKillVictimId && (
        <div style={{ color: theme.text }}><ReportLine size={24} icon="chalk" color="#C4323A"><b>{state.soloKillVictimName}</b>님이 사망한 채로 발견되었습니다</ReportLine></div>
      )}
      {state.vampireFightResult && (
        <>
          <div style={{ color: theme.text }}><ReportLine icon="chalk" color="#C4323A"><b>{state.vampireFightResult.vampireName}</b>님이 사망한 채로 발견되었습니다</ReportLine></div>
          <div style={{ color: theme.text }}><ReportLine icon="chalk" color="#C4323A"><b>{state.vampireFightResult.mafiaName}</b>님이 사망한 채로 발견되었습니다</ReportLine></div>
        </>
      )}
      {state.avengerKillResult && (
        <div style={{ color: theme.text }}>
          <ReportLine icon="bleedingheart" color="#B8284A"><b>{state.avengerKillResult.targetName}</b>님이 피의 복수에 쓰러졌습니다</ReportLine>
        </div>
      )}
      {state.werewolfVictimName && (
        <div style={{ color: theme.text }}>
          <ReportLine icon="claws" color="#8C96DC"><b>{state.werewolfVictimName}</b>님이 늑대인간에게 습격당해 목숨을 잃었습니다</ReportLine>
        </div>
      )}
      {state.priestReviveName && (
        <div style={{ color: theme.text }}>
          <ReportLine icon="cross" color="#E8C468"><b>{state.priestReviveName}</b>님이 성직자에 의해 부활했습니다</ReportLine>
        </div>
      )}
      {state.bodyguardSaveResult && (
        <div style={{ color: theme.text }}>
          <ReportLine icon="shield" color="#5B9BF0"><b>{state.bodyguardSaveResult.bodyguardName}</b>님이 <b>{state.bodyguardSaveResult.targetName}</b>님을 지키다 목숨을 잃었습니다{state.bodyguardSaveResult.attackerName ? <>, <b>{state.bodyguardSaveResult.attackerName}</b>님도 함께 쓰러졌습니다</> : ""}</ReportLine>
        </div>
      )}
      {state.bodyguardLastWord && (
        <div style={{ color: theme.text }}>
          <ReportLine icon="lastwill" color="#E8D2A0">경호원 <b>{state.bodyguardLastWord.bodyguardName}</b>님의 결정적 유언 — 범인은 <b>{state.bodyguardLastWord.killerName}</b>님</ReportLine>
        </div>
      )}
      {state.catAppearedName && (
        <div style={{ color: theme.text }}>
          <ReportLine icon="cat" color="#E8B478">어느새 고양이 한 마리(<b>{state.catAppearedName}</b>)가 마을에 들어와 있었습니다</ReportLine>
        </div>
      )}
      {state.reporterReveal && (
        <div style={{ color: theme.text }}>
          <ReportLine icon="newspaper" color="#EFE4C6"><b>{state.reporterReveal.name}</b>님의 직업이 <b>[{state.reporterReveal.roleLabel}]</b>(으)로 공개되었습니다</ReportLine>
        </div>
      )}
      {state.curseCastName && (
        <div style={{ color: theme.text }}>
          <ReportLine icon="tarot" color="#9A7BCB"><b>{state.curseCastName}</b>님이 마녀의 저주를 받았습니다 (3일 후 발동)</ReportLine>
        </div>
      )}
      {state.curseVictimName && (
        <div style={{ color: theme.text }}>
          <ReportLine icon="skull" color="#9A7BCB"><b>{state.curseVictimName}</b>님이 마녀의 저주가 발동해 목숨을 잃었습니다 (마피아의 습격과는 별개)</ReportLine>
        </div>
      )}
      {extraNightEventList(state).map((e, i) => (
        <div key={i} style={{ color: theme.text }}>
          {e.kind === "hospitalized" ? <ReportLine icon="pulse" color="#5FA8D3"><b>{e.name}</b>님이 의사에 의해 강제로 입원했습니다</ReportLine>
            : e.kind === "trafficked" ? <ReportLine icon="lock" color="#B84C5C"><b>{e.name}</b>님이 밤사이 어디론가 팔려나갔습니다</ReportLine>
            : e.kind === "curseDeath" ? <ReportLine icon="skull" color="#9A7BCB"><b>{e.name}</b>님이 저주로 목숨을 잃었습니다</ReportLine>
            : e.kind === "arson" ? <ReportLine icon="dynamite" color="#D9723D">밤사이 큰 불이 나 <b>{e.name}</b>님이 목숨을 잃었습니다</ReportLine>
            : <ReportLine icon="chalk" color="#C4323A"><b>{e.name}</b>님이 사망한 채로 발견되었습니다</ReportLine>}
        </div>
      ))}
      </div>
    </div>
  );
}

/* ---------- 메인 컴포넌트 ---------- */
export default function BroadcastPage() {
  const [state, setState] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [lobbyQueue, setLobbyQueue] = useState(null); // null = 아직 대기 화면 아님, [] = 대기열 비어있음
  const prevIdolMessageRef = useRef(null);
  // 카드 큐·타이머는 플레이어 화면과 같은 규칙을 쓴다 (components/alertSequence.jsx). 방송 화면은 단계 효과음만 따로 울린다.
  const { current, inSequence, cardVisible } = useAlertSequence(state, {
    onTransition: (t, s) => {
      if (t.sound === "gameover") { (WINNER_CONFIG[s.winner] || WINNER_CONFIG.citizen).sound(); return; }
      if (t.sound) playSample(t.sound, { fallback: PHASE_FALLBACK[t.sound] });
    },
  });

  useEffect(() => {
    if (!state) return;
    const prevText = prevIdolMessageRef.current;
    const nextText = state.idolMessage?.text || null;
    prevIdolMessageRef.current = nextText;
    if (nextText && nextText !== prevText) playSample("phishing", { fallback: playPhishingAlert });
  }, [state?.idolMessage?.text]);

  useEffect(() => {
    preloadBroadcastSamples();
    const socket = createBroadcastSocket();
    socket.on("broadcast_state", (s) => { if (s) setTimerSeconds(s.timerSeconds); setState(s); setDisabled(false); setLobbyQueue(null); });
    // 매초 오는 남은 시간은 상태에 합치지 않는다 - 합치면 방송 화면 전체가 1초마다 다시 그려진다. 타이머만 따로 갱신.
    socket.on("broadcast_tick", ({ timerSeconds }) => setTimerSeconds(timerSeconds));
    // 채팅만 바뀌었을 때 서버는 채팅 부분만 보낸다.
    socket.on("broadcast_chat", ({ timerSeconds, ...chat }) => { if (timerSeconds !== undefined) setTimerSeconds(timerSeconds); setState((prev) => (prev ? { ...prev, ...chat } : prev)); });
    socket.on("broadcast_disabled", () => { setDisabled(true); setLobbyQueue(null); setState(null); });
    socket.on("broadcast_lobby", ({ queue: q }) => { setLobbyQueue(q || []); setDisabled(false); setState(null); });
    return () => socket.disconnect();
  }, []);

  if (lobbyQueue) {
    const theme = THEMES.dusk;
    return (
      <div style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", overflow: "hidden",
        background: theme.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <style>{`html,body{margin:0;padding:0;overflow:hidden;background:#060505;font-family:'Noto Sans KR',sans-serif;} ${FONT_IMPORT}
          @keyframes levellio-pulse { 0%,100% { transform: scale(1); opacity: 0.9; } 50% { transform: scale(1.12); opacity: 1; } }`}</style>
        <NoirAtmosphere theme={theme} />
        <div style={{ fontFamily: "'Special Elite', monospace", fontSize: 18, letterSpacing: "0.45em", color: theme.accent, marginBottom: 14 }}>── CASE No. 7 ──</div>
        <div style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: 96, color: theme.text, lineHeight: 1.1, textShadow: "0 6px 0 rgba(0,0,0,0.6), 0 14px 50px rgba(0,0,0,0.95)" }}>레벨리오 마피아</div>
        <div style={{ fontFamily: "'Special Elite', monospace", fontSize: 22, letterSpacing: "0.7em", color: theme.sub, margin: "10px 0 34px" }}>7EVELLIO · MAFIA</div>
        <div style={{ width: 900, height: 1, background: `linear-gradient(90deg, transparent, ${theme.accent}aa, transparent)`, marginBottom: 26 }} />
        <div style={{ fontSize: 20, fontWeight: 700, color: theme.sub, marginBottom: 22 }}>
          <span style={{ fontFamily: "'Special Elite', monospace", letterSpacing: "0.3em", color: theme.accent, marginRight: 12 }}>SUSPECT LINE-UP</span>참여 대기열 · {lobbyQueue.length}명
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center", maxWidth: 1400, marginBottom: 36 }}>
          {lobbyQueue.length === 0 && <div style={{ fontSize: 24, color: theme.sub }}>아직 참여자가 없습니다</div>}
          {lobbyQueue.map((q) => (
            <div key={q.channelId} style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "10px 22px 10px 10px",
              borderRadius: 2, background: "rgba(0,0,0,0.45)", border: `1px solid ${theme.panelBorder}`, borderLeft: `3px solid ${theme.accent}` }}>
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
        <BigHeadline theme={theme} size={40}>수사를 시작할 준비 중입니다</BigHeadline>
      </div>
    );
  }

  if (disabled || !state) {
    const theme = THEMES.dusk;
    return (
      <div style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", overflow: "hidden",
        background: theme.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`html,body{margin:0;padding:0;overflow:hidden;background:#060505;font-family:'Noto Sans KR',sans-serif;} ${FONT_IMPORT}`}</style>
        <NoirAtmosphere theme={theme} />
        <BigHeadline theme={theme} size={44}>
          {disabled ? <span style={{ display: "inline-flex", alignItems: "center", gap: 18 }}><NoirIcon name="lock" size={54} color={theme.accent} />관리자가 아직 스트리머 모드를 켜지 않았습니다</span> : "연결 중..."}
        </BigHeadline>
      </div>
    );
  }

  const theme = themeForPhase(state.phase);
  const nominee = state.nominee ? state.players.find((p) => p.id === state.nominee) : null;
  const death = state.lastNightDeath ? state.players.find((p) => p.id === state.lastNightDeath) : null;

  // 상단바 바로 아래에 쌓이는 배너들 - 하나의 배열로 관리해서, 배너 렌더링과 아래 본문 영역의 top 계산이
  // 항상 같은 개수를 참조하도록 한다. 새 배너를 추가할 땐 이 배열에 항목 하나만 더 넣으면 된다.
  const activeBanners = [];
  if (state.idolMessage) {
    activeBanners.push({
      key: "phishing",
      node: (
        <div style={{ display: "flex", alignItems: "center", gap: 12, borderRadius: 2, padding: "10px 20px",
          background: "rgba(120,170,232,0.16)", border: "1px solid rgba(120,170,232,0.45)" }}>
          <LineIcon name="envelope" color="#78AAE8" size={32} />
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
        <GlowIcon theme={theme} icon="fingerprint" />
        <BigTimer theme={theme} seconds={state.timerSeconds} />
        <BigHeadline theme={theme}>각자 직업을 확인하는 중입니다</BigHeadline>
        <BigSubtext theme={theme}>곧 첫 번째 밤이 시작됩니다</BigSubtext>
      </>
    );
  } else if (state.phase === "night") {
    restingBody = (
      <>
        <GlowIcon theme={theme} icon="moon" />
        <BigHeadline theme={theme}>밤이 되었습니다</BigHeadline>
        <BigSubtext theme={theme}>직업이 있는 플레이어들이 조용히 능력을 사용하고 있어요</BigSubtext>
        <div style={{ marginTop: 30 }}><BigTimer theme={theme} seconds={state.timerSeconds} /></div>
      </>
    );
  } else if (state.phase === "morning" && !inSequence) {
    restingBody = (
      <>
        <GlowIcon theme={theme} color={theme.accent} icon="dawn" />
        <BigHeadline theme={theme}>{state.dayNumber}일차 아침입니다</BigHeadline>
        <BigSubtext theme={theme}>잠시 후 토론이 시작됩니다</BigSubtext>
      </>
    );
  } else if (state.phase === "powerSelection" && !inSequence) {
    restingBody = (
      <>
        <GlowIcon theme={theme} color="#E8C468" icon="dawn" />
        <BigTimer theme={theme} seconds={state.timerSeconds} />
        <BigHeadline theme={theme}>{state.dayNumber}일차 · 새로운 능력을 선택하는 중입니다</BigHeadline>
        <BigSubtext theme={theme}>일부 직업이 새로운 능력을 손에 넣습니다</BigSubtext>
      </>
    );
  } else if (state.phase === "discussion") {
    restingBody = (
      <DiscussionBody theme={theme} state={state} death={death} />
    );
  } else if (state.phase === "sheriffElection") {
    // 보안관 선출 시간도 평소 낮 회의와 같은 화면을 쓴다 - "보안관이 없습니다" 안내는
    // 이미 아침 연출 큐에서 한 번 보여줬으니, 여기서는 그냥 토론 화면과 동일하게 취급한다.
    restingBody = (
      <DiscussionBody theme={theme} state={state} death={death} />
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
        <GlowIcon theme={theme} color="#E8C468" icon="ballot" />
        <BigTimer theme={theme} seconds={state.timerSeconds} />
        <BigHeadline theme={theme}>
          {isRunoff ? "동점자 재투표가 진행 중입니다" : "보안관 선출 투표가 진행 중입니다"}
        </BigHeadline>
        {votedCandidates.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center", marginTop: 22 }}>
            {votedCandidates.map(({ p, voters }) => (
              <div key={p.id} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                width: 130, height: 130, padding: "14px 12px", borderRadius: 2, background: "rgba(0,0,0,0.45)", border: `1px solid ${theme.panelBorder}`, borderTop: `2px solid ${theme.accent}`,
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
        <BigHeadline theme={theme}><span style={{ display: "inline-flex", alignItems: "center", gap: 20 }}><NoirIcon name={state.verdictByPriest ? "stake" : "scales"} size={72} color={state.verdictByPriest ? "#E8A050" : theme.accent} />{sheriffTarget?.name}님의 최후 변론{state.verdictByPriest ? " · 이단심판" : ""}</span></BigHeadline>
        <BigChatFeed theme={theme} messages={state.dayChat} players={state.players} />
      </>
    );
  } else if (state.phase === "sheriffVerdict") {
    const sheriffTarget = state.players.find((p) => p.id === state.sheriffDesignatedTarget);
    restingBody = (
      <>
        <GlowIcon theme={theme} color={state.verdictByPriest ? "#E8A050" : "#E8C468"} icon={state.verdictByPriest ? "stake" : "badge"} />
        <BigTimer theme={theme} seconds={state.timerSeconds} />
        <BigHeadline theme={theme}>{state.verdictByPriest ? `성직자가 ${sheriffTarget?.name}님을 심판하고 있습니다` : `보안관이 ${sheriffTarget?.name}님의 운명을 심판하고 있습니다`}</BigHeadline>
      </>
    );
  } else if (state.phase === "vote") {
    restingBody = (
      <>
        <GlowIcon theme={theme} icon="ballot" />
        <BigTimer theme={theme} seconds={state.timerSeconds} />
        <BigHeadline theme={theme}>투표가 진행 중입니다</BigHeadline>
      </>
    );
  } else if (state.phase === "defense") {
    restingBody = (
      <>
        <BigTimer theme={theme} seconds={state.timerSeconds} />
        <BigHeadline theme={theme}><span style={{ display: "inline-flex", alignItems: "center", gap: 20 }}><NoirIcon name="scales" size={72} color={theme.accent} />{nominee?.name}님의 최후 변론</span></BigHeadline>
        <BigChatFeed theme={theme} messages={state.dayChat} players={state.players} />
      </>
    );
  } else if (state.phase === "judgetiebreak") {
    restingBody = (
      <>
        <GlowIcon theme={theme} color="#A88BC4" icon="gavel" />
        <BigTimer theme={theme} seconds={state.timerSeconds} />
        <BigHeadline theme={theme}>투표가 동점이 나와, 판사가 한 명을 지명하고 있습니다</BigHeadline>
      </>
    );
  } else if (state.phase === "officialPick") {
    restingBody = (
      <>
        <GlowIcon theme={theme} color="#9FB6C9" icon="sealedballot" />
        <BigTimer theme={theme} seconds={state.timerSeconds} />
        <BigHeadline theme={theme}>개표가 진행되고 있습니다</BigHeadline>
        <BigSubtext theme={theme}>투표함이 굳게 닫힌 방 안으로 옮겨졌습니다…</BigSubtext>
      </>
    );
  } else if (state.phase === "judgeverdict") {
    restingBody = (
      <>
        <GlowIcon theme={theme} color="#A88BC4" icon="gavel" />
        <BigTimer theme={theme} seconds={state.timerSeconds} />
        <BigHeadline theme={theme}>{nominee?.name}님의 처형 여부를 판사가 심의하고 있습니다</BigHeadline>
      </>
    );
  } else if (state.phase === "finalvote") {
    restingBody = (
      <>
        <GlowIcon theme={theme} icon="scales" />
        <BigTimer theme={theme} seconds={state.timerSeconds} />
        <BigHeadline theme={theme}>찬반 투표가 진행 중입니다</BigHeadline>
      </>
    );
  } else if (state.phase === "voteresult" && !inSequence) {
    restingBody = (
      <>
        <GlowIcon theme={theme} icon="scales" />
        <BigHeadline theme={theme}>{state.dayNumber}일차 투표가 마무리되었습니다</BigHeadline>
      </>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", overflow: "hidden", background: theme.bg, transition: "background 900ms ease" }}>
      <style>{`
        html, body { margin:0; padding:0; overflow:hidden; background:#060505; font-family:'Noto Sans KR',sans-serif; }
        ${FONT_IMPORT}
        ${TITLE_ANIMATION_CSS}
        ${NOIR_ICON_CSS}
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

      <NoirAtmosphere theme={theme} />

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
            <AlertCard theme={theme} event={current} dayNumber={state.dayNumber} />
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
              background: `radial-gradient(circle at 50% 42%, ${w.color}33 0%, ${w.color}00 62%), radial-gradient(ellipse 110% 90% at 50% 45%, transparent 55%, rgba(0,0,0,0.75) 100%)`,
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
              <div style={{ lineHeight: 0, filter: `drop-shadow(0 0 26px ${w.color}77) drop-shadow(0 24px 34px rgba(0,0,0,0.85))`, animation: "levellio-title-pop 900ms cubic-bezier(0.22,1.4,0.36,1) both" }}>
                <NoirIcon name={w.icon} size={230} color={w.color} />
              </div>
            </div>
            <div style={{ position: "relative", animation: "levellio-title-pop 900ms cubic-bezier(0.22,1.4,0.36,1) both", animationDelay: "120ms" }}>
              <BigHeadline theme={theme} size={84}>{w.text}</BigHeadline>
              <div style={{ position: "absolute", right: -150, top: -46, fontFamily: "'Special Elite', 'Courier Prime', monospace", fontSize: 30, letterSpacing: "0.26em",
                color: w.color, border: `4px double ${w.color}`, padding: "4px 20px", whiteSpace: "nowrap", background: "rgba(0,0,0,0.35)",
                textShadow: `0 0 18px ${w.color}88`, animation: "noir-stamp 700ms cubic-bezier(0.22,1.4,0.36,1) 1000ms both" }}>
                CASE CLOSED
              </div>
            </div>
            <RosterBar theme={theme} players={state.players} teamCounts={state.teamCounts} />
          </div>
        );
      })()}
    </div>
  );
}
