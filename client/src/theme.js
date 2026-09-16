export const THEMES = {
  night: { bg: "radial-gradient(ellipse 120% 80% at 50% -10%, #1c2447 0%, #0a0d1f 55%, #060812 100%)",
    panel: "rgba(21,26,51,0.72)", panelBorder: "rgba(232,196,104,0.18)", text: "#EDE9DA",
    sub: "rgba(237,233,218,0.62)", accent: "#E8C468", accentSoft: "rgba(232,196,104,0.14)" },
  day: { bg: "radial-gradient(ellipse 120% 80% at 50% -10%, #FDF6E3 0%, #F3ECD8 55%, #ECE1C4 100%)",
    panel: "rgba(255,253,246,0.72)", panelBorder: "rgba(42,36,24,0.12)", text: "#2A2418",
    sub: "rgba(42,36,24,0.6)", accent: "#C1392B", accentSoft: "rgba(193,57,43,0.10)" },
  dusk: { bg: "radial-gradient(ellipse 120% 80% at 50% -10%, #3a2e46 0%, #211a2e 55%, #14101c 100%)",
    panel: "rgba(38,30,51,0.72)", panelBorder: "rgba(232,196,104,0.16)", text: "#F0E9E4",
    sub: "rgba(240,233,228,0.6)", accent: "#D98C3D", accentSoft: "rgba(217,140,61,0.14)" },
};

export function themeForPhase(phase) {
  if (phase === "night") return THEMES.night;
  if (["morning", "discussion", "vote", "defense", "finalvote", "judgetiebreak", "judgeverdict", "voteresult",
    "sheriffElection", "sheriffElectionVote", "sheriffDefense", "sheriffVerdict"].includes(phase)) return THEMES.day;
  return THEMES.dusk;
}

// ─────────────────────────────────────────────────────────────
// 플레이어 화면 전용 "누아르" 테마. (방송 송출 화면(BroadcastPage)은 위의 THEMES를 그대로 사용한다)
//  - night : 비 내리는 뒷골목. 새카만 바탕 + 차가운 가로등 빛 + 황동색 포인트
//  - day   : 취조실. 머리 위 백열등 한 줄기 + 핏빛 크림슨 포인트
//  - dusk  : 담배 연기 자욱한 바(대기실/직업확인/게임종료). 위스키빛 앰버 포인트
// ─────────────────────────────────────────────────────────────
export const NOIR_THEMES = {
  night: {
    name: "night",
    bg: "radial-gradient(ellipse 70% 45% at 78% -8%, rgba(120,150,190,0.20) 0%, transparent 60%), radial-gradient(ellipse 120% 80% at 50% 0%, #121418 0%, #08090b 60%, #040405 100%)",
    panel: "rgba(14,15,18,0.82)", panelBorder: "rgba(200,165,90,0.20)", text: "#E6DFCF",
    sub: "rgba(230,223,207,0.55)", accent: "#C8A55A", accentSoft: "rgba(200,165,90,0.12)",
    onAccent: "#0b0a08", danger: "#B3262E", glow: "rgba(120,150,190,0.35)",
  },
  day: {
    name: "day",
    bg: "radial-gradient(ellipse 55% 50% at 50% -12%, rgba(235,210,160,0.20) 0%, transparent 62%), radial-gradient(ellipse 120% 90% at 50% 10%, #1c1917 0%, #0f0d0c 60%, #070606 100%)",
    panel: "rgba(22,19,17,0.84)", panelBorder: "rgba(179,38,46,0.28)", text: "#EDE6D6",
    sub: "rgba(237,230,214,0.56)", accent: "#C4323A", accentSoft: "rgba(196,50,58,0.13)",
    onAccent: "#F4EDE0", danger: "#E0474F", glow: "rgba(235,210,160,0.30)",
  },
  dusk: {
    name: "dusk",
    bg: "radial-gradient(ellipse 80% 55% at 20% -10%, rgba(190,120,50,0.18) 0%, transparent 60%), radial-gradient(ellipse 120% 85% at 50% 0%, #1a1511 0%, #0c0a08 60%, #050404 100%)",
    panel: "rgba(20,16,13,0.84)", panelBorder: "rgba(210,150,70,0.22)", text: "#EBE2D0",
    sub: "rgba(235,226,208,0.55)", accent: "#D19A4C", accentSoft: "rgba(209,154,76,0.12)",
    onAccent: "#0c0906", danger: "#B3262E", glow: "rgba(190,120,50,0.30)",
  },
};

export function noirThemeForPhase(phase) {
  const base = themeForPhase(phase);
  if (base === THEMES.night) return NOIR_THEMES.night;
  if (base === THEMES.day) return NOIR_THEMES.day;
  return NOIR_THEMES.dusk;
}

export const PHASE_LABEL = (state) => ({
  setup: "게임 준비", lobby: "대기실", reveal: "직업 확인", night: `${state.dayNumber}일차 · 밤`,
  morning: `${state.dayNumber}일차 · 아침`, discussion: `${state.dayNumber}일차 · 토론`,
  powerSelection: `${state.dayNumber}일차 · 새로운 능력을 선택합니다`,
  vote: `${state.dayNumber}일차 · 투표`, defense: `${state.dayNumber}일차 · 최후 변론`,
  finalvote: `${state.dayNumber}일차 · 찬반 투표`, judgetiebreak: `${state.dayNumber}일차 · 판사 결정`,
  judgeverdict: `${state.dayNumber}일차 · 판사 심의`, voteresult: `${state.dayNumber}일차 · 투표 결과`,
  sheriffElection: `${state.dayNumber}일차 · 보안관 선출 시간`, sheriffElectionVote: `${state.dayNumber}일차 · 보안관 선출 투표`,
  sheriffDefense: `${state.dayNumber}일차 · 보안관 처형대 · 최후 변론`, sheriffVerdict: `${state.dayNumber}일차 · 보안관의 심판`,
  gameover: "게임 종료",
}[state.phase] || "");
