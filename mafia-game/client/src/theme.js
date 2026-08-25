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
  if (["morning", "discussion", "vote", "defense", "finalvote", "voteresult"].includes(phase)) return THEMES.day;
  return THEMES.dusk;
}

export const PHASE_LABEL = (state) => ({
  setup: "게임 준비", lobby: "대기실", reveal: "직업 확인", night: `${state.dayNumber}일차 · 밤`,
  morning: `${state.dayNumber}일차 · 아침`, discussion: `${state.dayNumber}일차 · 토론`,
  vote: `${state.dayNumber}일차 · 투표`, defense: `${state.dayNumber}일차 · 최후 변론`,
  finalvote: `${state.dayNumber}일차 · 찬반 투표`, voteresult: `${state.dayNumber}일차 · 투표 결과`,
  gameover: "게임 종료",
}[state.phase] || "");
