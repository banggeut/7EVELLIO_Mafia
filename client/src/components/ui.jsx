import React, { useState, useEffect, useRef, memo } from "react";
import { RoleIcon } from "./roleIcons.jsx";
import { TitleIcon, splitTitle } from "./titleIcons.jsx";
import { useTimerSeconds } from "../timerStore.js";
import { playClick, playSelect, playToggle, playPlayerSample, isSoundEnabled, setSoundEnabled, getVolume, setVolume } from "../sound.js";
import { ChatSlot, useInChatSlot, useGameLayout, useChatRooms, useRegisterChatRoom } from "./gameLayout.jsx";

// 공개된 직업 라벨을 팀/분류에 따라 색으로 구분한다.
const MAFIA_LABELS = new Set(["마피아", "스파이", "해커", "마담", "유괴범", "테러리스트", "마녀", "사기꾼", "대부", "히트맨"]);
const CITIZEN_FORCED_LABELS = new Set(["경찰", "의사"]); // 필수직업
const CITIZEN_PLAIN_LABELS = new Set(["시민", "백수", "교사", "학생", "상담원", "피싱", "검시관", "교도관"]); // 일반 (특수직업 아님)
const NEUTRAL_LABELS = new Set(["악마 숭배자", "뱀파이어", "괴도", "늑대인간", "고양이", "용병"]);
// 그 외 시민팀 직업(기자·영매·건달·연인·정치인·탐정·장의사·판사·군인·공무원·성직자 등)은 전부 "특수직업"으로 취급한다.

function roleLabelColor(label) {
  if (MAFIA_LABELS.has(label)) return "#E05F5F"; // 마피아팀 - 붉은색
  if (NEUTRAL_LABELS.has(label)) return "#B57BF0"; // 중립팀 - 밝은 보라색
  if (CITIZEN_FORCED_LABELS.has(label)) return "#5B9BF0"; // 시민팀 필수직업 - 파란색
  if (CITIZEN_PLAIN_LABELS.has(label)) return "#E8D25A"; // 시민팀 일반 - 노란색(원래 색상으로 복원)
  return "#5FBF7A"; // 그 외(시민팀 특수직업) - 초록색
}

// 색상이 있는 텍스트 밑에 같은 색조의 은은한 그림자를 깔아 가독성을 살짝 보강한다.
function roleLabelShadow(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `0 1px 3px rgba(${r},${g},${b},0.55)`;
}

// 칭호별 전용 색상 - 새 칭호가 생기면 여기에 추가한다. 매핑에 없으면 theme.accent를 그대로 쓴다.
const TITLE_COLORS = {
  "🌾 명예시민": "#E8C468", // 명예 - 따뜻한 금색
  "💉 명의": "#5FA8D3", // 의사 - 청량한 하늘색
  "🔍 엘리트 수사관": "#5B9BF0", // 경찰 - 신뢰감 있는 파랑
  "📰 정론직필": "#B8935A", // 신문지 색감의 세피아
  "🛡️ 탱커": "#8C96A6", // 강철빛 회색
  "🗡️ 여긴 내 구역이야": "#B5555F", // 용병/거친 다크레드
  "💍 너를 위해서": "#E0879B", // 로맨틱한 로즈핑크
  "🕵️ 명탐정 라삐": "#6F95D0", // 진중한 감청색
  "🥀 뱀파이어 사냥꾼": "#9B7EA8", // 은은한 라일락(사냥꾼의 결기)
  "🕴️ 뒤를 부탁한다": "#7D8FA6", // 헌신적인 강철빛 블루
  "🍎 최고의 스승": "#D9A441", // 사과빛 금색
  "🎓 최고의 제자": "#E0B84A", // 학사모의 반짝이는 금색
  "😈 세계를 멸망시켜봤습니다": "#9A7BCB", // 악마 숭배자 - 짙은 보라
  "🧛 뱀파이어 로드": "#C0577F", // 뱀파이어 - 진한 마젠타
  "💎 잘 먹고 갑니다": "#C9A227", // 괴도 - 보석빛 금색
  "🐺 ALPHA": "#8C96DC", // 늑대인간 - 은빛 청보라
  "🐱 탐정이다냥": "#E8B25A", // 고양이 - 노란빛 탐정
  "🐾 냥냥펀치": "#D3695F", // 고양이 마피아 - 발랄한 빨강
  "🐈 길냥이": "#9A9A9A", // 소속 없는 회색
  "👑 최종보스": "#C23B4B", // 대부 - 짙은 진홍
  "💣 혼자는 안가요": "#D97B3E", // 폭발의 주황
  "💻 천재 해커": "#4FBF9F", // 해커 - 시원한 청록
  "🌱 선량한 시민": "#8FBF6A", // 새싹빛 연두
  "🔫 명예 마피아": "#C4505F", // 마피아 - 짙은 붉은빛
  "🛋️ 왜 이겼지?": "#A8A8A8", // 백수 - 애매한 회색
  "🚔 부패경찰": "#B99155", // 금이 간 황동 배지 - 파랑과 핏빛 사이에서 흔들리는 색
  "🦠 바이러스": "#7FD66B", // 독성 초록
  "🎯 암살": "#A9AFC0", // 차가운 강철빛
  "💄 미녀": "#E86A92", // 립스틱 로즈
  "⛓️ 너 납치된거야": "#B0906A", // 낡은 밧줄·자루 색
  "💥 폭발은 예술이다": "#FF8A3D", // 폭발 섬광 주황
  "🔥 활활": "#FF6B2C", // 불길
  "🔮 고대 주술사": "#A98AE6", // 룬 보랏빛
  "🎎 꼭두각시": "#C69BE0", // 마녀의 연보라 실
  "📰 가짜뉴스": "#D9C27A", // 누렇게 바랜 신문
  "👑 LEGEND": "#F0C24B", // 전성기의 황금
  "☠️ 중독": "#8BD450", // 독약 초록
  "🔫 FBI": "#5A96F0", // 연방 요원 블루
  "👻 최고의 파트너": "#A8D8F0", // 영혼의 하늘빛
  "👊 팍쒸, 드루와": "#E0613F", // 붉게 달아오른 주먹
  "🎩 독재자": "#D23C3C", // 선전 포스터의 붉은색
  "🔎 내 이름은 라삐, 탐정이죠": "#7EB6FF", // 번뜩이는 추리의 파랑
  "🪖 불사신": "#FF9F43", // 불사조의 불꽃
  "⚰️ 한번만 빌리겠습니다.": "#7FC8B0", // 관 속의 옅은 청록 생기
  "⚖️ 배신": "#C0A060", // 녹슨 황동
  "🗂️ 1급 공무원": "#6FA8DC", // 관청 서류철 파랑
  "😇 성녀": "#F4E3A1", // 후광의 금빛
  "🔥 이단심판관": "#E0673A", // 심판의 불길
  "📜 다잉메세지": "#D04848", // 피로 쓴 글씨
};
export function titleColor(title, theme) {
  return TITLE_COLORS[title] || theme.accent;
}

// 칭호별 전용 애니메이션 - 컨셉에 어울리는 연출이 있는 칭호만 여기에 클래스명을 매핑한다.
// 새 애니메이션을 추가하려면: 1) 아래 TITLE_ANIMATION_CSS에 @keyframes와 클래스를 추가하고
// 2) TITLE_ANIMATIONS에 "칭호 텍스트": "클래스명"을 추가하면 된다.
const TITLE_ANIMATIONS = {
  "🌾 명예시민": "title-anim-shimmer-gold", // 훈장에 광택이 스치고 금빛 별이 반짝
  "💉 명의": "title-anim-heartbeat", // 박동에 맞춰 두근 + 옆에 심전도 파형
  "🔍 엘리트 수사관": "title-anim-siren", // 양옆에서 빨강/파랑 경광등 불빛
  "📰 정론직필": "title-anim-flash", // 플래시가 터지고 잠시 흑백 사진처럼 바램
  "🛡️ 탱커": "title-anim-shield", // 강철 광택 + 방패 충격파와 반동
  "🗡️ 여긴 내 구역이야": "title-anim-blade", // 칼날이 스치면 글자가 위아래로 베여 어긋남
  "💍 너를 위해서": "title-anim-heartache", // 붉은 실이 이어지고 끝에서 하트가 떠오름
  "🕵️ 명탐정 라삐": "title-anim-spotlight", // 돋보기가 훑는 곳만 환하게
  "🥀 뱀파이어 사냥꾼": "title-anim-stake", // 은빛 십자 말뚝이 내리꽂히고 뱀파이어가 재로 흩어짐
  "🕴️ 뒤를 부탁한다": "title-anim-lastguard", // 총알을 대신 막아내고 흑백으로 바래며 영혼의 빛이 올라감
  "🍎 최고의 스승": "title-anim-warmglow", // 분필 밑줄 + 분필 가루
  "🎓 최고의 제자": "title-anim-warmglow", // 최고의 스승과 동일 연출
  "😈 세계를 멸망시켜봤습니다": "title-anim-apocalypse", // 소환진이 달아오르다 세상 끝까지 퍼지는 충격파
  "🧛 뱀파이어 로드": "title-anim-nightlord", // 핏빛 보름달이 떠오르고 박쥐가 날아감
  "💎 잘 먹고 갑니다": "title-anim-gemshine", // 보석 섬광과 함께 글자가 훔쳐진 듯 사라졌다 돌아옴
  "🐺 ALPHA": "title-anim-moonglow", // 초승달 빛이 차오르다 발톱 자국이 할큄
  "🐱 탐정이다냥": "title-anim-catbounce", // 갸웃하며 통통 튀고 발자국이 콕콕
  "🐾 냥냥펀치": "title-anim-punch", // 펀치와 함께 만화풍 집중선이 터짐
  "🐈 길냥이": "title-anim-catwalk", // 고양이가 글자 위를 어슬렁
  "👑 최종보스": "title-anim-finalboss", // 보스 체력바가 차오르고 왕관이 쿵 내려앉음
  "💣 혼자는 안가요": "title-anim-bombtick", // 도화선 불꽃이 타들어가다 폭발
  "💻 천재 해커": "title-anim-glitch", // RGB 색분리 + 슬라이스 글리치
  "🌱 선량한 시민": "title-anim-sprout", // 새싹처럼 살랑이며 초록 생기가 숨 쉼
  "🔫 명예 마피아": "title-anim-bullethole", // 총구 화염 + 반동 + 금 간 총알 구멍
  "🛋️ 왜 이겼지?": "title-anim-confused", // 갸웃갸웃, 물음표가 뭉게뭉게
  "🚔 부패경찰": "title-anim-corrupt",
  "🦠 바이러스": "title-anim-virus",
  "🎯 암살": "title-anim-assassin",
  "💄 미녀": "title-anim-femme",
  "⛓️ 너 납치된거야": "title-anim-kidnap",
  "💥 폭발은 예술이다": "title-anim-art-blast",
  "🔥 활활": "title-anim-blaze",
  "🔮 고대 주술사": "title-anim-ancient",
  "🎎 꼭두각시": "title-anim-puppet",
  "📰 가짜뉴스": "title-anim-fakenews",
  "👑 LEGEND": "title-anim-legend",
  "☠️ 중독": "title-anim-poison",
  "🔫 FBI": "title-anim-fbi",
  "👻 최고의 파트너": "title-anim-partner",
  "👊 팍쒸, 드루와": "title-anim-bringit",
  "🎩 독재자": "title-anim-dictator",
  "🔎 내 이름은 라삐, 탐정이죠": "title-anim-eureka",
  "🪖 불사신": "title-anim-phoenix",
  "⚰️ 한번만 빌리겠습니다.": "title-anim-borrow",
  "⚖️ 배신": "title-anim-betrayal",
  "🗂️ 1급 공무원": "title-anim-stamp",
  "😇 성녀": "title-anim-saint",
  "🔥 이단심판관": "title-anim-inquisitor",
  "📜 다잉메세지": "title-anim-dying",
};
export function titleAnimationClass(title) {
  return TITLE_ANIMATIONS[title] || "";
}
// 실제 사용하는 애니메이션 클래스가 있는 페이지에서 한 번만 렌더하면 되는 <style> 태그 내용.
export const TITLE_ANIMATION_CSS = `
  /* ────────────────────────────────────────────────────────────
     칭호 연출 v2 — 누아르 톤 리뉴얼
     - 모든 크기는 em 단위: 채팅(8.5px)·대기실(11px)·방송(15px) 어디서든 같은 비율로 보인다.
     - 대부분 "평소엔 조용히, 몇 초마다 한 번 터지는" 리듬이라 채팅창에 칭호가 여러 개 떠도 산만하지 않다.
     - [data-text]가 필요한 연출(칼질 분리·글리치)은 TitleBadge가 data-text 속성을 붙여준다.
     ──────────────────────────────────────────────────────────── */
  [class*="title-anim-"] { position: relative; display: inline-block; }
  .title-anim-siren, .title-anim-apocalypse, .title-anim-nightlord, .title-anim-moonglow, .title-anim-punch, .title-anim-art-blast, .title-anim-ancient, .title-anim-dictator, .title-anim-phoenix, .title-anim-saint, .title-anim-inquisitor { isolation: isolate; }


  /* 🌾 명예시민 — 훈장에 빛이 스치고, 모서리에 금빛 별이 반짝 */
  .title-anim-shimmer-gold { animation: tMedalGlow 3.6s ease-in-out infinite; }
  .title-anim-shimmer-gold::before {
    content: attr(data-text); position: absolute; inset: 0; white-space: nowrap; pointer-events: none;
    background: linear-gradient(100deg, transparent 42%, rgba(255,248,220,0.95) 50%, transparent 58%); background-size: 300% 100%; background-repeat: no-repeat;
    -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent;
    animation: tSheenSweep 3.6s ease-in-out infinite;
  }
  .title-anim-shimmer-gold::after {
    content: "✦"; position: absolute; top: -0.75em; right: -0.7em; font-size: 0.8em; color: #FFE9A8;
    text-shadow: 0 0 0.4em #FFD76A; opacity: 0; animation: tStarBurst 3.6s ease-in-out infinite;
  }
  @keyframes tMedalGlow { 0%,55%,100% { text-shadow: 0 0 0.25em rgba(232,196,104,0.35); } 70% { text-shadow: 0 0 0.6em rgba(255,215,120,0.85); } }
  @keyframes tSheenSweep { 0%,45% { background-position: 120% 0; } 80%,100% { background-position: -20% 0; } }
  @keyframes tStarBurst { 0%,62%,100% { opacity: 0; transform: scale(0) rotate(0); } 74% { opacity: 1; transform: scale(1.25) rotate(90deg); } 88% { opacity: 0; transform: scale(0.6) rotate(180deg); } }

  /* 💉 명의 — 오른쪽 작은 모니터에 심전도 파형이 흐르고, 박동에 맞춰 글자가 두근 */
  .title-anim-heartbeat { animation: tPulse 1.6s ease-in-out infinite; margin-right: 1.9em; }
  .title-anim-heartbeat::after {
    content: ""; position: absolute; top: 50%; right: -1.9em; width: 1.6em; height: 0.8em; margin-top: -0.4em;
    background: linear-gradient(90deg, rgba(95,168,211,0) 0%, rgba(160,215,245,0.5) 40%, #E6F6FF 50%, rgba(95,168,211,0) 51%), linear-gradient(rgba(95,168,211,0.45), rgba(95,168,211,0.45));
    background-size: 300% 100%, 100% 100%; background-repeat: no-repeat; filter: drop-shadow(0 0 0.15em #5FA8D3);
    clip-path: polygon(0% 50%, 28% 50%, 36% 22%, 44% 72%, 52% 0%, 62% 100%, 70% 50%, 100% 50%, 100% 64%, 70% 64%, 62% 100%, 60% 100%, 52% 20%, 45% 92%, 37% 44%, 30% 64%, 0% 64%);
    animation: tEcg 1.6s linear infinite;
  }
  @keyframes tPulse { 0%,100% { transform: scale(1); } 12% { transform: scale(1.1); } 24% { transform: scale(1); } 36% { transform: scale(1.06); } 48% { transform: scale(1); } }
  @keyframes tEcg { from { background-position: 100% 0, 0 0; } to { background-position: -50% 0, 0 0; } }

  /* 🔍 엘리트 수사관 — 글자 양옆에서 경광등 불빛(빨강/파랑)이 번갈아 비춤. 글자 자체 색은 유지해 가독성 확보 */
  .title-anim-siren::before, .title-anim-siren::after {
    content: ""; position: absolute; top: 50%; width: 0.9em; height: 0.9em; margin-top: -0.45em; border-radius: 50%;
    z-index: -1; pointer-events: none; filter: blur(0.22em);
  }
  .title-anim-siren::before { left: -0.95em; background: rgba(224,71,79,0.85); animation: tSirenA 1.1s steps(1,end) infinite; }
  .title-anim-siren::after { right: -0.95em; background: rgba(91,155,240,0.85); animation: tSirenB 1.1s steps(1,end) infinite; }
  .title-anim-siren { animation: tSirenText 1.1s steps(1,end) infinite; }
  @keyframes tSirenA { 0%,24% { opacity: 0.95; } 25%,49% { opacity: 0.1; } 50%,62% { opacity: 0.95; } 63%,100% { opacity: 0.1; } }
  @keyframes tSirenB { 0%,24% { opacity: 0.1; } 25%,49% { opacity: 0.95; } 50%,62% { opacity: 0.1; } 63%,100% { opacity: 0.95; } }
  @keyframes tSirenText { 0%,24%,50%,62% { text-shadow: -0.12em 0 0.5em rgba(224,71,79,0.8); } 25%,49%,63%,100% { text-shadow: 0.12em 0 0.5em rgba(91,155,240,0.85); } }

  /* 📰 정론직필 — 기자의 플래시가 "펑" 터지고, 잠시 흑백 사진처럼 바랬다가 돌아옴 */
  .title-anim-flash { animation: tPressDevelop 4s ease-out infinite; }
  .title-anim-flash::after {
    content: ""; position: absolute; top: 50%; left: 50%; width: 3em; height: 3em; margin: -1.5em 0 0 -1.5em; border-radius: 50%;
    background: radial-gradient(circle, #fff 0%, rgba(255,250,235,0.85) 25%, rgba(255,240,210,0) 70%);
    opacity: 0; pointer-events: none; animation: tFlashBulb 4s ease-out infinite;
  }
  @keyframes tFlashBulb { 0%,86%,100% { opacity: 0; transform: scale(0.4); } 88% { opacity: 1; transform: scale(1.2); } 93% { opacity: 0; transform: scale(1.6); } }
  @keyframes tPressDevelop { 0%,87% { filter: none; } 88% { filter: brightness(2.2) grayscale(1); } 94% { filter: grayscale(1) sepia(0.6) contrast(1.2); } 100% { filter: none; } }

  /* 🛡️ 탱커 — 강철 광택이 훑고, "쾅" 막아낼 때 방패 충격파 + 묵직한 반동 */
  .title-anim-shield { animation: tShieldHit 3s ease-out infinite; }
  .title-anim-shield::before {
    content: attr(data-text); position: absolute; inset: 0; white-space: nowrap; pointer-events: none;
    background: linear-gradient(100deg, transparent 42%, rgba(245,248,255,0.95) 50%, transparent 58%); background-size: 300% 100%; background-repeat: no-repeat;
    -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent;
    animation: tSheenSweep 3s ease-in-out infinite;
  }
  .title-anim-shield::after {
    content: ""; position: absolute; inset: -0.25em -0.45em; border: 0.12em solid #AEB7C4; border-radius: 0.2em 0.2em 45% 45%;
    opacity: 0; pointer-events: none; animation: tShieldWave 3s ease-out infinite;
  }
  @keyframes tShieldHit { 0%,78%,100% { transform: translateX(0); } 80% { transform: translateX(-0.12em) scale(0.97); } 84% { transform: translateX(0.05em) scale(1.02); } 88% { transform: translateX(0); } }
  @keyframes tShieldWave { 0%,79% { opacity: 0; transform: scale(0.9); } 81% { opacity: 0.95; transform: scale(1); } 100% { opacity: 0; transform: scale(1.35); } }

  /* 🗡️ 여긴 내 구역이야 — 칼날이 대각선으로 스치면 글자가 위아래로 "베여" 어긋났다가 다시 붙음 */
  .title-anim-blade {
    background-image: linear-gradient(160deg, transparent 47%, rgba(255,255,255,0.95) 49.5%, rgba(181,85,95,0.9) 50.5%, transparent 53%);
    background-size: 300% 300%; background-repeat: no-repeat; background-position: 120% 120%;
    animation: tBladeLine 3.4s ease-in infinite, tBladeHide 3.4s steps(1,end) infinite;
  }
  .title-anim-blade::before, .title-anim-blade::after {
    content: attr(data-text); position: absolute; inset: 0; white-space: nowrap; pointer-events: none;
    -webkit-text-fill-color: currentColor; opacity: 0;
  }
  .title-anim-blade::before { clip-path: polygon(0 0, 100% 0, 100% 38%, 0 62%); animation: tBladeTop 3.4s ease-out infinite; }
  .title-anim-blade::after { clip-path: polygon(0 62%, 100% 38%, 100% 100%, 0 100%); animation: tBladeBottom 3.4s ease-out infinite; }
  @keyframes tBladeLine { 0%,70% { background-position: 120% 120%; } 76% { background-position: -20% -20%; } 100% { background-position: -20% -20%; } }
  @keyframes tBladeHide { 0%,75% { -webkit-text-fill-color: currentColor; } 76%,93% { -webkit-text-fill-color: transparent; } 94%,100% { -webkit-text-fill-color: currentColor; } }
  @keyframes tBladeTop { 0%,75% { opacity: 0; transform: none; } 76% { opacity: 1; transform: none; } 82% { opacity: 1; transform: translate(0.22em,-0.1em) rotate(-2deg); } 93% { opacity: 1; transform: none; } 94%,100% { opacity: 0; } }
  @keyframes tBladeBottom { 0%,75% { opacity: 0; transform: none; } 76% { opacity: 1; transform: none; } 82% { opacity: 1; transform: translate(-0.18em,0.08em) rotate(1deg); } 93% { opacity: 1; transform: none; } 94%,100% { opacity: 0; } }

  /* 💍 너를 위해서 — 붉은 실이 글자 밑으로 이어지고, 끝에 작은 하트가 맺혀 애틋하게 떠오름 */
  .title-anim-heartache { animation: tTender 2.8s ease-in-out infinite; }
  .title-anim-heartache::before {
    content: ""; position: absolute; left: 0; bottom: -0.18em; height: 0.08em; width: 0; border-radius: 1em;
    background: linear-gradient(90deg, rgba(224,135,155,0.2), #F29BB0); box-shadow: 0 0 0.3em rgba(224,135,155,0.8);
    animation: tRedThread 2.8s ease-in-out infinite;
  }
  .title-anim-heartache::after {
    content: "♥"; position: absolute; right: -0.9em; bottom: -0.35em; font-size: 0.95em; color: #F29BB0;
    text-shadow: 0 0 0.35em rgba(224,135,155,0.9); opacity: 0; animation: tHeartRise 2.8s ease-out infinite;
  }
  @keyframes tTender { 0%,100% { text-shadow: 0 0 0.2em rgba(224,135,155,0.3); } 50% { text-shadow: 0 0 0.55em rgba(224,135,155,0.75); } }
  @keyframes tRedThread { 0% { width: 0; opacity: 0.9; } 45% { width: 100%; opacity: 1; } 80% { width: 100%; opacity: 0.6; } 100% { width: 100%; opacity: 0; } }
  @keyframes tHeartRise { 0%,40% { opacity: 0; transform: translateY(0) scale(0.4); } 52% { opacity: 1; transform: translateY(-0.1em) scale(1.1); } 60% { transform: translateY(-0.2em) scale(0.95); } 100% { opacity: 0; transform: translateY(-1.3em) scale(0.8); } }

  /* 🕵️ 명탐정 라삐 — 돋보기가 글자 위를 훑으며 지나가는 곳만 환하게 확대돼 보임 */
  .title-anim-spotlight::before {
    content: ""; position: absolute; top: 50%; left: 0; width: 1.25em; height: 1.25em; margin-top: -0.75em; border-radius: 50%;
    border: 0.1em solid #C9D8EE; box-shadow: 0 0 0.35em rgba(160,190,235,0.7), inset 0 0 0.3em rgba(255,255,255,0.35);
    backdrop-filter: brightness(1.9) contrast(1.15); -webkit-backdrop-filter: brightness(1.9) contrast(1.15);
    opacity: 0; pointer-events: none; animation: tLens 4s ease-in-out infinite;
  }
  .title-anim-spotlight::after {
    content: ""; position: absolute; top: 50%; left: 0; width: 0.55em; height: 0.12em; margin-top: 0.5em; border-radius: 1em;
    background: #8A6A45; transform-origin: 0 50%; opacity: 0; pointer-events: none; animation: tLensHandle 4s ease-in-out infinite;
  }
  @keyframes tLens { 0%,8% { left: -0.4em; opacity: 0; } 15% { opacity: 1; } 40% { left: 40%; } 55% { left: 30%; } 78% { left: calc(100% - 0.8em); opacity: 1; } 88%,100% { left: calc(100% - 0.8em); opacity: 0; } }
  @keyframes tLensHandle { 0%,8% { left: 0.5em; opacity: 0; transform: rotate(40deg); } 15% { opacity: 1; } 40% { left: calc(40% + 0.9em); transform: rotate(40deg); } 55% { left: calc(30% + 0.9em); } 78% { left: calc(100% + 0.1em); opacity: 1; } 88%,100% { left: calc(100% + 0.1em); opacity: 0; transform: rotate(40deg); } }

  /* 🥀 뱀파이어 사냥꾼 — 성직자가 정체를 밝혀낸 뱀파이어를 처단한 사냥꾼.
     은빛 십자 말뚝이 위에서 내리꽂히는 순간 글자가 성스러운 은백색으로 번쩍하고, 뱀파이어가 재가 되어 흩어지듯 검붉은 재가 피어오른다. */
  .title-anim-stake { animation: tHolySmite 4.4s ease-out infinite; }
  .title-anim-stake::before {
    content: "✝"; position: absolute; left: 50%; top: -1.15em; margin-left: -0.3em; font-size: 0.95em; font-weight: 900; color: #EEF1FA;
    text-shadow: 0 0 0.3em rgba(235,240,255,0.95), 0 0 0.75em rgba(255,232,160,0.65); opacity: 0; pointer-events: none;
    animation: tStakeDrop 4.4s cubic-bezier(.55,0,.9,.45) infinite;
  }
  .title-anim-stake::after {
    content: ""; position: absolute; left: 14%; top: 35%; width: 0.2em; height: 0.2em; border-radius: 50%; background: #9A2E40; pointer-events: none; opacity: 0;
    box-shadow: 0.5em 0.2em 0 rgba(170,170,180,0.9), 1em -0.1em 0 #7A2433, 1.6em 0.15em 0 rgba(150,150,160,0.9), 2.2em -0.05em 0 #9A2E40, 2.8em 0.2em 0 rgba(130,130,142,0.85), 3.4em -0.1em 0 #7A2433, 4em 0.1em 0 rgba(160,160,170,0.9), 4.7em -0.08em 0 #9A2E40, 5.4em 0.12em 0 rgba(140,140,150,0.85);
    animation: tAshRise 4.4s ease-out infinite;
  }
  @keyframes tStakeDrop {
    0%,30% { opacity: 0; transform: translateY(-0.9em) scale(1.3); } 36% { opacity: 1; }
    44% { opacity: 1; transform: translateY(0.4em) scale(1); } 48% { transform: translateY(0.3em) scale(1.12); } 52% { transform: translateY(0.35em) scale(1); }
    74% { opacity: 1; transform: translateY(0.35em) scale(1); } 86%,100% { opacity: 0; transform: translateY(0.35em) scale(0.85); }
  }
  @keyframes tAshRise { 0%,45% { opacity: 0; transform: translateY(0) scale(1); } 52% { opacity: 1; } 90%,100% { opacity: 0; transform: translateY(-1.5em) scale(0.35); } }
  @keyframes tHolySmite {
    0%,43%,100% { transform: none; text-shadow: 0 0 0.2em rgba(140,40,60,0.45); }
    45% { color: #F6F8FF; transform: translateY(0.05em); text-shadow: 0 0 0.35em rgba(240,244,255,1), 0 0 0.9em rgba(255,228,150,0.85); }
    48% { transform: translateX(-0.03em); } 51% { transform: translateX(0.03em); } 54% { transform: none; }
    62% { text-shadow: 0 0 0.45em rgba(220,228,255,0.7); } 82% { text-shadow: 0 0 0.2em rgba(140,40,60,0.45); }
  }

  /* 🕴️ 뒤를 부탁한다 — 경호원이 의사를 지키다 대신 쓰러짐.
     오른쪽에서 날아온 총알을 글자가 몸으로 막아내며 뒤로 밀리고, 흑백 사진처럼 빛이 바랜 채 작은 영혼의 빛이 하늘로 올라간 뒤 다시 색을 되찾는다. */
  .title-anim-lastguard { animation: tGuardHit 5s ease-out infinite; }
  .title-anim-lastguard::after {
    content: ""; position: absolute; top: 50%; left: 100%; width: 1.5em; height: 0.09em; margin-top: -0.045em; border-radius: 0.1em; transform-origin: 0 50%;
    background: linear-gradient(90deg, #FFF6D0, rgba(255,200,90,0.65) 35%, transparent); opacity: 0; pointer-events: none;
    animation: tBulletIn 5s linear infinite;
  }
  .title-anim-lastguard::before {
    content: ""; position: absolute; left: 50%; top: 5%; width: 0.22em; height: 0.22em; margin-left: -0.11em; border-radius: 50%;
    background: rgba(255,255,255,0.95); box-shadow: 0 0 0.3em 0.1em rgba(220,230,255,0.75); opacity: 0; pointer-events: none;
    animation: tSoulRise 5s ease-out infinite;
  }
  @keyframes tBulletIn {
    0%,18% { opacity: 0; transform: translateX(3em) scaleX(1); } 20% { opacity: 1; }
    25% { opacity: 1; transform: translateX(0) scaleX(1); box-shadow: none; }
    27% { opacity: 1; transform: translateX(0) scaleX(0.15); box-shadow: 0 0 0.35em 0.15em rgba(255,215,130,0.95); }
    33%,100% { opacity: 0; transform: translateX(0) scaleX(0.1); }
  }
  @keyframes tGuardHit {
    0%,24%,100% { transform: none; filter: none; text-shadow: none; }
    26% { transform: translateX(-0.14em) rotate(-2deg); text-shadow: 0.05em 0 0.3em rgba(200,40,50,0.9); }
    31% { transform: translateX(-0.05em); } 36% { transform: none; text-shadow: none; filter: none; }
    46%,76% { filter: grayscale(1) brightness(0.85); opacity: 0.85; text-shadow: 0 0 0.35em rgba(230,235,245,0.55); }
    90% { filter: none; opacity: 1; text-shadow: 0 0 0.25em rgba(217,164,65,0.45); }
  }
  @keyframes tSoulRise { 0%,42% { opacity: 0; transform: translateY(0) scale(0.5); } 50% { opacity: 1; transform: translateY(-0.35em) scale(1); } 76% { opacity: 0.6; transform: translateY(-1.5em) scale(0.8); } 88%,100% { opacity: 0; transform: translateY(-2em) scale(0.4); } }

  /* 🍎 최고의 스승 / 🎓 최고의 제자 — 분필로 밑줄이 그어지고, 끝에서 분필 가루가 톡 떨어짐 (같은 연출 공유) */
  .title-anim-warmglow { animation: tWarm 3s ease-in-out infinite; }
  .title-anim-warmglow::after {
    content: ""; position: absolute; left: 0; bottom: -0.2em; height: 0.12em; width: 0; border-radius: 0.1em;
    background: repeating-linear-gradient(90deg, #F0E6C8 0 0.35em, rgba(240,230,200,0.6) 0.35em 0.45em);
    box-shadow: 0 0 0.2em rgba(217,164,65,0.6); animation: tChalk 3s ease-in-out infinite;
  }
  .title-anim-warmglow::before {
    content: ""; position: absolute; left: 0; bottom: -0.2em; width: 0.08em; height: 0.08em; border-radius: 50%; background: #F0E6C8;
    box-shadow: 0.15em 0.1em 0 #F0E6C8, -0.1em 0.2em 0 rgba(240,230,200,0.7), 0.05em 0.32em 0 rgba(240,230,200,0.5);
    opacity: 0; animation: tChalkDust 3s ease-in infinite;
  }
  @keyframes tWarm { 0%,100% { text-shadow: 0 0 0.2em rgba(217,164,65,0.3); } 50% { text-shadow: 0 0 0.55em rgba(217,164,65,0.7); } }
  @keyframes tChalk { 0% { width: 0; opacity: 1; } 50% { width: 100%; opacity: 1; } 80%,100% { width: 100%; opacity: 0; } }
  @keyframes tChalkDust { 0%,45% { opacity: 0; left: 95%; transform: translateY(0); } 52% { opacity: 1; left: 97%; } 85%,100% { opacity: 0; left: 97%; transform: translateY(0.5em); } }

  /* 😈 세계를 멸망시켜봤습니다 — 악마 숭배자가 결국 세상을 끝장낸 중립 승리.
     글자 아래 소환진이 돌며 달아오르다가 "쾅" 하고 붉은 충격파가 세상 끝까지 퍼지고, 글자는 흔들리며 불타는 잔불빛으로 물든다. */
  .title-anim-apocalypse { animation: tWorldEnd 4.8s ease-in-out infinite; }
  .title-anim-apocalypse::before {
    content: ""; position: absolute; left: 0; width: 100%; aspect-ratio: 1 / 1; top: 78%; margin-top: -50%; z-index: -1; border-radius: 50%;
    border: 0.1em dashed rgba(210,50,70,0.95); box-shadow: 0 0 0.5em rgba(170,30,60,0.85), inset 0 0 0.6em rgba(120,30,140,0.75);
    opacity: 0; pointer-events: none; animation: tSigil 4.8s linear infinite;
  }
  .title-anim-apocalypse::after {
    content: ""; position: absolute; left: 50%; top: 50%; width: 1em; height: 1em; margin: -0.5em 0 0 -0.5em; border-radius: 50%;
    border: 0.08em solid rgba(255,130,70,0.95); box-shadow: 0 0 0.4em rgba(255,80,50,0.85), inset 0 0 0.3em rgba(160,40,120,0.7);
    opacity: 0; pointer-events: none; animation: tWorldWave 4.8s ease-out infinite;
  }
  @keyframes tSigil {
    0%,12% { opacity: 0; transform: scaleY(0.13) rotate(0deg) scale(0.7); }
    40% { opacity: 0.85; transform: scaleY(0.13) rotate(160deg) scale(1); }
    58% { opacity: 1; transform: scaleY(0.13) rotate(250deg) scale(1.05); border-color: rgba(255,140,80,1); }
    66% { opacity: 1; transform: scaleY(0.13) rotate(290deg) scale(1.2); }
    85%,100% { opacity: 0; transform: scaleY(0.13) rotate(360deg) scale(1.4); }
  }
  @keyframes tWorldWave { 0%,58% { opacity: 0; transform: scale(0.4, 0.4); } 60% { opacity: 1; transform: scale(0.8, 0.6); } 88%,100% { opacity: 0; transform: scale(12, 4); } }
  @keyframes tWorldEnd {
    0%,100% { transform: none; text-shadow: 0 0.05em 0.25em rgba(123,94,167,0.5); }
    50% { transform: none; text-shadow: 0 0 0.4em rgba(170,40,70,0.8), 0 0 0.9em rgba(90,40,140,0.6); }
    59% { color: #FFE0CC; transform: scale(1.06); text-shadow: 0 0 0.3em rgba(255,150,80,1), 0 0 0.8em rgba(255,70,40,0.9), 0 0 1.5em rgba(140,30,90,0.8); }
    62% { transform: translate(-0.05em, 0.03em); } 65% { transform: translate(0.05em, -0.03em); } 68% { transform: translate(-0.03em, 0); } 71% { transform: none; }
    80% { text-shadow: 0 0.08em 0.2em rgba(255,90,40,0.7), 0 0 0.6em rgba(150,30,60,0.75); }
  }

  /* 🧛 뱀파이어 로드 — 끝까지 살아남아 밤을 지배한 뱀파이어.
     글자 뒤로 핏빛 보름달이 천천히 떠오르고, 달에서 박쥐 한 마리가 날갯짓하며 글자 위를 가로질러 날아간다. 글자는 귀족적인 진홍빛으로 은은히 물든다. */
  .title-anim-nightlord { animation: tLordAura 5.2s ease-in-out infinite; }
  .title-anim-nightlord::before {
    content: ""; position: absolute; right: -0.95em; top: -0.6em; width: 1.05em; height: 1.05em; z-index: -1; border-radius: 50%;
    background: radial-gradient(circle at 38% 38%, #F4A6AE, #B3203C 55%, #4E0819 100%); box-shadow: 0 0 0.6em rgba(200,30,60,0.75);
    opacity: 0; pointer-events: none; animation: tBloodMoon 5.2s ease-in-out infinite;
  }
  .title-anim-nightlord::after {
    content: ""; width: 1em; height: 1em; background: url(\"data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2048%2048%22%3E%3Cpath%20fill%3D%22%238E2A48%22%20d%3D%22M24%2018c-2-4-4-6-6-6%201%202%201%204%200%205-4-3-10-3-16%202%205%201%207%205%207%209%204-4%209-4%2012%200%201-2%202-3%203-3s2%201%203%203c3-4%208-4%2012%200%200-4%202-8%207-9-6-5-12-5-16-2-1-1-1-3%200-5-2%200-4%202-6%206z%22/%3E%3C/svg%3E\") center/contain no-repeat; position: absolute; top: -0.55em; left: 96%; font-size: 1em; line-height: 1; opacity: 0; pointer-events: none;
    animation: tBatFly 5.2s ease-in-out infinite;
  }
  @keyframes tBloodMoon { 0%,6% { opacity: 0; transform: translateY(0.6em) scale(0.7); } 28% { opacity: 0.75; transform: translateY(0) scale(1); } 72% { opacity: 0.75; transform: translateY(0) scale(1); } 90%,100% { opacity: 0; transform: translateY(-0.15em) scale(1.05); } }
  @keyframes tBatFly {
    0%,32% { opacity: 0; left: 96%; transform: translateY(0.2em) scale(0.4, 0.4); }
    37% { opacity: 1; transform: translateY(-0.1em) scale(1, 1); } 42% { transform: translateY(0.12em) scale(1, 0.45); }
    47% { transform: translateY(-0.2em) scale(1, 1); } 52% { transform: translateY(0.08em) scale(1, 0.45); }
    57% { transform: translateY(-0.25em) scale(1, 1); } 62% { transform: translateY(0) scale(1, 0.45); }
    67% { opacity: 1; transform: translateY(-0.35em) scale(0.9, 0.9); } 72% { transform: translateY(-0.45em) scale(0.8, 0.4); }
    78%,100% { opacity: 0; left: -10%; transform: translateY(-0.7em) scale(0.5, 0.5); }
  }
  @keyframes tLordAura {
    0%,100% { text-shadow: 0 0 0.25em rgba(160,20,50,0.45); }
    30%,70% { text-shadow: 0 0.05em 0 rgba(40,0,10,0.9), 0 0 0.45em rgba(190,25,55,0.85), 0 0 1em rgba(120,10,40,0.55); }
    50% { text-shadow: 0 0.05em 0 rgba(40,0,10,0.9), 0 0 0.6em rgba(220,40,70,0.95), 0 0 1.2em rgba(140,10,45,0.7); }
  }

  /* 💎 잘 먹고 갑니다 — 보석 섬광이 번쩍하는 순간 글자가 "훔쳐진 듯" 사라졌다가, 윙크하듯 다시 나타남 */
  .title-anim-gemshine { animation: tStolen 4s ease-in-out infinite; }
  .title-anim-gemshine::before, .title-anim-gemshine::after {
    content: "✦"; position: absolute; color: #fff; text-shadow: 0 0 0.4em #F3D46B, 0 0 0.8em #C9A227; opacity: 0; pointer-events: none;
  }
  .title-anim-gemshine::before { top: -0.7em; right: -0.6em; font-size: 0.95em; animation: tGem 4s ease-in-out infinite; }
  .title-anim-gemshine::after { bottom: -0.55em; left: -0.6em; font-size: 0.7em; animation: tGem 4s ease-in-out infinite 0.25s; }
  @keyframes tGem { 0%,62%,100% { opacity: 0; transform: scale(0.2) rotate(0); } 70% { opacity: 1; transform: scale(1.6) rotate(90deg); } 78% { opacity: 0; transform: scale(0.4) rotate(140deg); } }
  @keyframes tStolen { 0%,66%,100% { opacity: 1; filter: none; transform: none; } 70% { opacity: 1; filter: brightness(2.2); } 74%,86% { opacity: 0; transform: translateY(-0.1em) scale(0.96); filter: blur(0.06em); } 92% { opacity: 1; transform: none; filter: none; } }

  /* 🐺 ALPHA — 보름달 빛이 차오르다 세 줄기 발톱 자국이 대각선으로 할퀴고 지나감 */
  .title-anim-moonglow { animation: tMoon 3.4s ease-in-out infinite; }
  .title-anim-moonglow::before {
    content: ""; position: absolute; top: -0.6em; right: -0.7em; width: 0.7em; height: 0.7em; border-radius: 50%; z-index: -1;
    background: transparent; box-shadow: inset -0.16em 0.08em 0 0 #F1EFDF; filter: drop-shadow(0 0 0.25em rgba(200,210,245,0.9)); opacity: 0.35; animation: tMoonDisc 3.4s ease-in-out infinite;
  }
  .title-anim-moonglow::after {
    content: ""; position: absolute; inset: -0.15em 10%; pointer-events: none; opacity: 0;
    background: repeating-linear-gradient(65deg, transparent 0 0.28em, rgba(235,238,255,0.95) 0.28em 0.36em, transparent 0.36em 0.62em);
    -webkit-mask-image: linear-gradient(90deg, #000 0 60%, transparent 60%); mask-image: linear-gradient(90deg, #000 0 60%, transparent 60%);
    animation: tClaw 3.4s ease-out infinite;
  }
  @keyframes tMoon { 0%,100% { text-shadow: 0 0 0.25em rgba(140,150,220,0.45); } 60% { text-shadow: 0 0 0.9em rgba(170,180,240,1); } 72% { text-shadow: 0 0 0.3em rgba(140,150,220,0.5); } }
  @keyframes tMoonDisc { 0%,100% { opacity: 0.3; transform: scale(0.85); } 60% { opacity: 1; transform: scale(1.1); } }
  @keyframes tClaw { 0%,64% { opacity: 0; transform: translate(-0.3em,-0.2em) scaleY(0.5); } 67% { opacity: 1; transform: translate(0,0) scaleY(1); } 80% { opacity: 0.6; } 90%,100% { opacity: 0; transform: translate(0.15em,0.1em); } }

  /* 🐱 탐정이다냥 — 고개를 갸웃하며 통통 튀고, 발자국이 차례로 콕콕 찍힘 */
  .title-anim-catbounce { animation: tCatHop 1.6s ease-in-out infinite; }
  .title-anim-catbounce::before, .title-anim-catbounce::after {
    content: ""; width: 1em; height: 1em; background: url(\"data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2048%2048%22%20fill%3D%22%23E8B25A%22%3E%3Cellipse%20cx%3D%2224%22%20cy%3D%2231%22%20rx%3D%2210%22%20ry%3D%228.5%22/%3E%3Cellipse%20cx%3D%2212%22%20cy%3D%2218%22%20rx%3D%223.6%22%20ry%3D%224.8%22/%3E%3Cellipse%20cx%3D%2220%22%20cy%3D%2212%22%20rx%3D%223.6%22%20ry%3D%224.8%22/%3E%3Cellipse%20cx%3D%2228%22%20cy%3D%2212%22%20rx%3D%223.6%22%20ry%3D%224.8%22/%3E%3Cellipse%20cx%3D%2236%22%20cy%3D%2218%22%20rx%3D%223.6%22%20ry%3D%224.8%22/%3E%3C/svg%3E\") center/contain no-repeat; position: absolute; top: -0.9em; font-size: 0.6em; opacity: 0; pointer-events: none;
  }
  .title-anim-catbounce::before { right: 0.2em; animation: tPaw 1.6s ease-out infinite; }
  .title-anim-catbounce::after { right: -1.1em; top: -1.3em; animation: tPaw 1.6s ease-out infinite 0.4s; }
  @keyframes tCatHop { 0%,100% { transform: translateY(0) rotate(0); } 25% { transform: translateY(-0.14em) rotate(-3deg); } 50% { transform: translateY(0) rotate(0); } 75% { transform: translateY(-0.1em) rotate(3deg); } }
  @keyframes tPaw { 0%,35% { opacity: 0; transform: scale(0.4); } 45% { opacity: 1; transform: scale(1.1); } 55% { transform: scale(1); } 90%,100% { opacity: 0; } }

  /* 🐾 냥냥펀치 — 앞발 펀치! 만화풍 집중선이 방사형으로 터지며 글자가 튕겨나감 */
  .title-anim-punch { animation: tPunch 2.6s ease-out infinite; }
  .title-anim-punch::before {
    content: ""; position: absolute; top: 50%; left: 50%; width: 3.2em; height: 3.2em; margin: -1.6em 0 0 -1.6em; z-index: -1;
    background: repeating-conic-gradient(rgba(255,210,190,0.95) 0 5deg, transparent 5deg 22deg);
    -webkit-mask-image: radial-gradient(circle, transparent 28%, #000 32%, #000 45%, transparent 70%);
    mask-image: radial-gradient(circle, transparent 28%, #000 32%, #000 45%, transparent 70%);
    opacity: 0; pointer-events: none; animation: tPunchLines 2.6s ease-out infinite;
  }
  @keyframes tPunch { 0%,78%,100% { transform: none; } 80% { transform: translateX(-0.15em) scale(0.92) rotate(-4deg); } 83% { transform: translateX(0.18em) scale(1.18) rotate(5deg); } 87% { transform: translateX(-0.05em) scale(1.04) rotate(-2deg); } 92% { transform: none; } }
  @keyframes tPunchLines { 0%,81%,100% { opacity: 0; transform: scale(0.5) rotate(0); } 83% { opacity: 1; transform: scale(1) rotate(8deg); } 92% { opacity: 0; transform: scale(1.35) rotate(14deg); } }

  /* 🐈 길냥이 — 고양이가 글자 위를 좌우로 어슬렁 (이모지는 TitleBadge가 별도 요소로 렌더) */
  .title-catwalk-emoji { position: absolute; top: 50%; left: 0%; transform: translateY(-50%) scaleX(-1); animation: tCatWalk 5s linear infinite; }
  @keyframes tCatWalk {
    0% { left: 0%; transform: translateY(-50%) scaleX(-1); } 10% { transform: translateY(-58%) scaleX(-1); } 20% { transform: translateY(-50%) scaleX(-1); }
    46% { left: calc(100% - 1em); transform: translateY(-50%) scaleX(-1); } 50% { left: calc(100% - 1em); transform: translateY(-50%) scaleX(1); }
    96% { left: 0%; transform: translateY(-50%) scaleX(1); } 100% { left: 0%; transform: translateY(-50%) scaleX(-1); }
  }

  /* 👑 최종보스 — 대부가 건달을 영입해 둘이 끝까지 살아남은 마피아 승리. 게임 속 "최종보스 등장" 연출.
     글자 밑에 보스 체력바가 붉게 차오르며 긴장감이 쌓이고, 가득 차는 순간 왕관이 "쿵" 내려앉으며 글자가 묵직하게 발을 구르고 금빛·진홍빛 오라가 터진다. */
  .title-anim-finalboss { animation: tBossStomp 4.6s ease-out infinite; }
  .title-anim-finalboss::after {
    content: ""; position: absolute; left: 0; right: 0; bottom: -0.34em; height: 0.17em; border: 0.04em solid rgba(255,215,110,0.9); border-radius: 0.05em; box-sizing: border-box;
    background: linear-gradient(90deg, #6E0C1B, #D8303F 70%, #FF8A5A) 0 0 / 0% 100% no-repeat, rgba(0,0,0,0.65); box-shadow: 0 0 0.3em rgba(216,48,63,0.6);
    opacity: 0; pointer-events: none; animation: tBossBar 4.6s ease-out infinite;
  }
  .title-anim-finalboss::before {
    content: "♛"; position: absolute; left: 50%; top: -1.05em; margin-left: -0.42em; font-size: 0.85em; line-height: 1; color: #FFD766;
    text-shadow: 0 0 0.35em rgba(255,200,80,0.95), 0 0.08em 0 #6A4A10; opacity: 0; pointer-events: none;
    animation: tCrownDrop 4.6s cubic-bezier(.55,0,1,.45) infinite;
  }
  @keyframes tBossBar {
    0%,4% { opacity: 0; background-size: 0% 100%, auto; } 9% { opacity: 1; background-size: 0% 100%, auto; }
    42% { opacity: 1; background-size: 100% 100%, auto; } 86% { opacity: 1; background-size: 100% 100%, auto; } 96%,100% { opacity: 0; background-size: 100% 100%, auto; }
  }
  @keyframes tCrownDrop {
    0%,38% { opacity: 0; transform: translateY(-1.2em) rotate(-18deg); } 42% { opacity: 1; }
    47% { opacity: 1; transform: translateY(0) rotate(0); } 50% { transform: translateY(-0.15em) rotate(5deg); } 53% { transform: translateY(0) rotate(0); }
    86% { opacity: 1; transform: translateY(0); } 96%,100% { opacity: 0; transform: translateY(0); }
  }
  @keyframes tBossStomp {
    0%,10%,100% { transform: none; text-shadow: 0 0 0.25em rgba(168,50,63,0.5); }
    44% { transform: none; text-shadow: 0 0 0.4em rgba(200,40,50,0.75); }
    47% { transform: scale(1.12) translateY(0.04em); text-shadow: 0 0.06em 0.1em rgba(0,0,0,0.7), 0 0 0.6em rgba(255,200,80,0.95), 0 0 1.2em rgba(200,40,50,0.9); }
    50% { transform: scale(0.97) translateX(-0.04em); } 53% { transform: scale(1.02) translateX(0.04em); } 56% { transform: none; }
    62%,86% { text-shadow: 0 0 0.45em rgba(255,200,80,0.6), 0 0 0.9em rgba(168,50,63,0.75); }
  }

  /* 💣 혼자는 안가요 — 도화선 불꽃이 글자 밑을 따라 타들어가다, 끝에서 "쾅" 폭발 + 화면 흔들림 */
  .title-anim-bombtick { animation: tBombShake 3.6s linear infinite; }
  .title-anim-bombtick::before {
    content: ""; position: absolute; left: 0; bottom: -0.2em; width: 0.26em; height: 0.26em; border-radius: 50%;
    background: radial-gradient(circle, #fff, #FFC460 45%, rgba(217,123,62,0) 75%); box-shadow: 0 0 0.35em #FF9A3C, 0 0 0.7em rgba(255,120,40,0.6);
    pointer-events: none; animation: tFuse 3.6s linear infinite;
  }
  .title-anim-bombtick::after {
    content: ""; position: absolute; top: 50%; left: 100%; width: 3em; height: 3em; margin: -1.5em 0 0 -1.5em; border-radius: 50%;
    background: radial-gradient(circle, rgba(255,245,220,1), rgba(255,170,70,0.85) 30%, rgba(200,70,40,0.4) 55%, transparent 72%);
    opacity: 0; pointer-events: none; animation: tBoom 3.6s ease-out infinite;
  }
  @keyframes tFuse { 0% { left: 0; opacity: 1; transform: scale(1); } 10%,30%,50% { transform: scale(1.3); } 20%,40%,60% { transform: scale(0.8); } 70% { left: calc(100% - 0.13em); opacity: 1; } 71%,100% { left: calc(100% - 0.13em); opacity: 0; } }
  @keyframes tBoom { 0%,70% { opacity: 0; transform: scale(0.2); } 72% { opacity: 1; transform: scale(1); } 85% { opacity: 0; transform: scale(1.6); } 100% { opacity: 0; } }
  @keyframes tBombShake { 0%,70% { transform: none; filter: none; } 72% { transform: translate(-0.1em,0.06em); filter: brightness(2.2); } 74% { transform: translate(0.1em,-0.05em); } 76% { transform: translate(-0.06em,0); filter: brightness(1.2); } 79%,100% { transform: none; filter: none; } }

  /* 💻 천재 해커 — 평소엔 조용한 터미널 글씨, 몇 초마다 RGB 색분리 + 가로 슬라이스로 화면이 찢어지는 글리치 */
  .title-anim-glitch { text-shadow: 0 0 0.3em rgba(79,191,159,0.45); animation: tGlitchJitter 3.2s steps(1,end) infinite; }
  .title-anim-glitch::before, .title-anim-glitch::after {
    content: attr(data-text); position: absolute; inset: 0; white-space: nowrap; pointer-events: none; opacity: 0;
  }
  .title-anim-glitch::before { color: #FF3FD2; animation: tGlitchA 3.2s steps(1,end) infinite; }
  .title-anim-glitch::after { color: #3FE8FF; animation: tGlitchB 3.2s steps(1,end) infinite; }
  @keyframes tGlitchJitter { 0%,86%,100% { transform: none; } 87% { transform: translateX(-0.06em) skewX(8deg); } 89% { transform: translateX(0.05em); } 91% { transform: skewX(-6deg); } 93% { transform: none; } }
  @keyframes tGlitchA { 0%,86%,94%,100% { opacity: 0; } 87% { opacity: 0.9; clip-path: inset(10% 0 55% 0); transform: translateX(-0.12em); } 89% { opacity: 0.9; clip-path: inset(60% 0 8% 0); transform: translateX(0.1em); } 91% { opacity: 0.8; clip-path: inset(30% 0 40% 0); transform: translateX(-0.08em); } }
  @keyframes tGlitchB { 0%,86%,94%,100% { opacity: 0; } 87% { opacity: 0.9; clip-path: inset(55% 0 12% 0); transform: translateX(0.12em); } 89% { opacity: 0.9; clip-path: inset(5% 0 70% 0); transform: translateX(-0.1em); } 92% { opacity: 0.8; clip-path: inset(40% 0 30% 0); transform: translateX(0.06em); } }

  /* 🌱 선량한 시민 — 새싹처럼 살랑 흔들리며 초록 생기가 은은하게 숨 쉼 */
  .title-anim-sprout { transform-origin: 50% 100%; animation: tSprout 3.4s ease-in-out infinite; }
  @keyframes tSprout { 0%,100% { transform: rotate(0); text-shadow: 0 0 0.2em rgba(143,191,106,0.3); } 30% { transform: rotate(-2deg); } 50% { text-shadow: 0 0 0.55em rgba(143,191,106,0.75); } 70% { transform: rotate(2deg); } }

  /* 🔫 명예 마피아 — 총구 화염이 번쩍, 반동으로 글자가 튀고, 금이 간 총알 구멍이 남았다 사라짐 */
  .title-anim-bullethole { animation: tRecoil 3.4s ease-out infinite; }
  .title-anim-bullethole::before {
    content: ""; position: absolute; top: 50%; left: -1em; width: 1.3em; height: 1em; margin-top: -0.5em; pointer-events: none;
    background: radial-gradient(ellipse at 100% 50%, #fff 0%, #FFD27A 25%, rgba(255,120,40,0.7) 45%, transparent 70%);
    clip-path: polygon(100% 50%, 0% 20%, 40% 45%, 5% 50%, 40% 55%, 0% 80%);
    opacity: 0; animation: tMuzzle 3.4s steps(1,end) infinite;
  }
  .title-anim-bullethole::after {
    content: ""; position: absolute; top: 50%; left: 55%; width: 0.85em; height: 0.85em; margin: -0.425em 0 0 -0.425em; border-radius: 50%;
    background:
      radial-gradient(circle, #050404 0 16%, #6b5a50 19%, #1a1212 22%, transparent 28%),
      conic-gradient(from 10deg, transparent 0 20deg, rgba(235,225,215,0.95) 20deg 24deg, transparent 24deg 110deg, rgba(235,225,215,0.9) 110deg 114deg, transparent 114deg 200deg, rgba(235,225,215,0.95) 200deg 203deg, transparent 203deg 290deg, rgba(235,225,215,0.85) 290deg 294deg, transparent 294deg);
    -webkit-mask-image: radial-gradient(circle, #000 45%, transparent 70%); mask-image: radial-gradient(circle, #000 45%, transparent 70%);
    opacity: 0; pointer-events: none; animation: tHole 3.4s ease-out infinite;
  }
  @keyframes tMuzzle { 0%,79%,100% { opacity: 0; } 80% { opacity: 1; } 82% { opacity: 0; } }
  @keyframes tRecoil { 0%,79%,100% { transform: none; } 81% { transform: translateX(0.14em) rotate(3deg); } 84% { transform: translateX(-0.05em) rotate(-1deg); } 88% { transform: none; } }
  @keyframes tHole { 0%,80% { opacity: 0; transform: scale(0.2); } 82% { opacity: 1; transform: scale(1.3); } 86% { opacity: 1; transform: scale(1); } 97%,100% { opacity: 0; transform: scale(1); } }

  /* 🛋️ 왜 이겼지? — 소파에 파묻힌 채 갸웃갸웃, 물음표가 뭉게뭉게 떠오름 */
  .title-anim-confused { animation: tHuh 2.4s ease-in-out infinite; }
  .title-anim-confused::before, .title-anim-confused::after {
    content: "?"; position: absolute; top: -0.2em; font-weight: 900; color: #BDBDBD; opacity: 0; pointer-events: none;
  }
  .title-anim-confused::before { left: -0.8em; font-size: 0.8em; animation: tQ 2.4s ease-out infinite; }
  .title-anim-confused::after { right: -0.9em; font-size: 1.05em; animation: tQ 2.4s ease-out infinite 0.7s; }
  @keyframes tHuh { 0%,100% { transform: rotate(0); } 20% { transform: rotate(-5deg); } 35% { transform: rotate(0); } 60% { transform: rotate(4deg); } 75% { transform: rotate(0); } }
  @keyframes tQ { 0%,20% { opacity: 0; transform: translateY(0.3em) scale(0.5) rotate(0); } 40% { opacity: 1; transform: translateY(-0.2em) scale(1.1) rotate(-10deg); } 80% { opacity: 0.4; transform: translateY(-0.8em) scale(0.9) rotate(10deg); } 100% { opacity: 0; transform: translateY(-1.1em) scale(0.8); } }

  /* ═══════════ 7일차 능력 업적 칭호 ═══════════ */

  /* 🚔 부패경찰 — 경찰의 파란 불빛이 돌다가, 순간 배지가 뒤집히며 핏빛으로 물든다 (마피아팀 편입) */
  .title-anim-corrupt { animation: tCorruptText 4.2s ease-in-out infinite; }
  .title-anim-corrupt::after {
    content: ""; position: absolute; left: -0.2em; right: -0.2em; bottom: -0.12em; height: 0.14em; border-radius: 1em;
    background: linear-gradient(90deg, #5B9BF0, #5B9BF0); transform-origin: left; animation: tCorruptBar 4.2s ease-in-out infinite; pointer-events: none;
  }
  @keyframes tCorruptText {
    0%,55% { color: #7FA8D8; text-shadow: 0 0 0.35em rgba(91,155,240,0.6); transform: rotateX(0); }
    62% { transform: rotateX(90deg); }
    63% { color: #D9454F; text-shadow: 0 0 0.45em rgba(217,69,79,0.85); transform: rotateX(90deg); }
    70%,90% { color: #D9454F; text-shadow: 0 0 0.45em rgba(217,69,79,0.85); transform: rotateX(0); }
    100% { color: #7FA8D8; text-shadow: 0 0 0.35em rgba(91,155,240,0.6); }
  }
  @keyframes tCorruptBar { 0%,55% { background: #5B9BF0; transform: scaleX(1); } 62% { transform: scaleX(0); } 63%,90% { background: #D9454F; transform: scaleX(1); } 100% { background: #5B9BF0; } }

  /* 🦠 바이러스 — 초록 포자가 글자 주변으로 퍼져나가고, 감염된 글자가 잠깐 뭉개진다 */
  .title-anim-virus { text-shadow: 0 0 0.3em rgba(127,214,107,0.45); animation: tInfect 3.6s ease-in-out infinite; }
  .title-anim-virus::before, .title-anim-virus::after {
    content: ""; position: absolute; top: 50%; left: 50%; width: 0.28em; height: 0.28em; border-radius: 50%; background: #7FD66B; pointer-events: none; opacity: 0;
    box-shadow: 1.1em -0.5em 0 -0.04em #7FD66B, -1.3em 0.4em 0 -0.06em #7FD66B, 0.6em 0.7em 0 -0.08em #9BEA86, -0.7em -0.7em 0 -0.05em #9BEA86;
    animation: tSpore 3.6s ease-out infinite;
  }
  .title-anim-virus::after { animation-delay: 0.5s; transform: rotate(60deg); }
  @keyframes tSpore { 0%,40% { opacity: 0; transform: translate(-50%,-50%) scale(0.2); } 55% { opacity: 1; } 100% { opacity: 0; transform: translate(-50%,-50%) scale(1.9) rotate(40deg); } }
  @keyframes tInfect { 0%,45%,100% { filter: none; } 52% { filter: blur(0.04em) hue-rotate(40deg); transform: skewX(-6deg); } 58% { filter: none; transform: skewX(4deg); } 62% { transform: none; } }

  /* 🎯 암살 — 붉은 레이저 조준점이 글자를 훑다가 멈추고, "탕" 하는 순간 글자가 흔들린다 */
  .title-anim-assassin { animation: tAssassinHit 3.8s ease-out infinite; }
  .title-anim-assassin::after {
    content: ""; position: absolute; top: 50%; left: 0; width: 0.34em; height: 0.34em; margin-top: -0.17em; border-radius: 50%; pointer-events: none;
    background: #FF3B3B; box-shadow: 0 0 0.35em 0.1em rgba(255,40,40,0.85); animation: tLaser 3.8s ease-in-out infinite;
  }
  @keyframes tLaser { 0% { left: 0; opacity: 0; } 8% { opacity: 0.9; } 50% { left: 70%; } 58% { left: 45%; opacity: 1; transform: scale(1); } 64% { left: 45%; transform: scale(2.4); opacity: 0; } 100% { left: 45%; opacity: 0; } }
  @keyframes tAssassinHit { 0%,62% { transform: none; color: inherit; } 64% { transform: translateX(0.06em) rotate(-2deg); text-shadow: 0 0 0.5em rgba(255,60,60,0.9); } 68% { transform: translateX(-0.04em) rotate(1deg); } 74%,100% { transform: none; text-shadow: none; } }

  /* 💄 미녀 — 은은한 분홍빛으로 반짝이다가, 모서리에 입맞춤 자국이 "쪽" 찍힌다 */
  .title-anim-femme { animation: tAllure 3.4s ease-in-out infinite; }
  .title-anim-femme::after {
    content: ""; position: absolute; right: -0.95em; top: -0.55em; width: 1em; height: 0.62em; pointer-events: none; opacity: 0;
    background: radial-gradient(ellipse 48% 42% at 30% 55%, #E86A92 60%, transparent 64%), radial-gradient(ellipse 48% 42% at 70% 55%, #E86A92 60%, transparent 64%);
    transform: rotate(-14deg); animation: tKiss 3.4s ease-out infinite;
  }
  @keyframes tAllure { 0%,100% { text-shadow: 0 0 0.25em rgba(232,106,146,0.35); } 50% { text-shadow: 0 0 0.6em rgba(255,150,190,0.85); } }
  @keyframes tKiss { 0%,55% { opacity: 0; transform: rotate(-14deg) scale(2); } 62% { opacity: 1; transform: rotate(-14deg) scale(0.9); } 66% { transform: rotate(-14deg) scale(1); } 90% { opacity: 1; } 100% { opacity: 0; } }

  /* ⛓️ 너 납치된거야 — 글자가 밧줄에 끌려가듯 옆으로 휙 당겨졌다 버둥거리며 돌아온다 */
  .title-anim-kidnap { animation: tDragged 3.8s ease-in-out infinite; }
  .title-anim-kidnap::before {
    content: ""; position: absolute; top: 55%; right: 100%; width: 0; height: 0.1em; pointer-events: none;
    background: repeating-linear-gradient(90deg, #A88B6A 0 0.18em, transparent 0.18em 0.28em); animation: tRope 3.8s ease-in-out infinite;
  }
  @keyframes tDragged { 0%,50%,100% { transform: none; } 58% { transform: translateX(-0.35em) rotate(-4deg); } 64% { transform: translateX(-0.2em) rotate(3deg); } 70% { transform: translateX(-0.28em) rotate(-2deg); } 80% { transform: none; } }
  @keyframes tRope { 0%,48% { width: 0; } 58%,72% { width: 1.1em; } 82%,100% { width: 0; } }

  /* 💥 폭발은 예술이다 — 한 박자 정적 뒤, 섬광과 함께 충격파가 퍼지며 글자가 튕겨 나간다 */
  .title-anim-art-blast { animation: tArtBlast 4s ease-out infinite; }
  .title-anim-art-blast::before {
    content: ""; position: absolute; left: 50%; top: 50%; width: 2.6em; height: 2.6em; margin: -1.3em 0 0 -1.3em; border-radius: 50%; z-index: -1; pointer-events: none;
    background: radial-gradient(circle, rgba(255,255,230,0.95) 0%, rgba(255,160,60,0.85) 30%, rgba(255,80,30,0.4) 55%, transparent 70%); opacity: 0; animation: tFireball 4s ease-out infinite;
  }
  .title-anim-art-blast::after {
    content: ""; position: absolute; left: 50%; top: 50%; width: 1em; height: 1em; margin: -0.5em 0 0 -0.5em; border-radius: 50%; pointer-events: none;
    border: 0.08em solid rgba(255,190,110,0.9); opacity: 0; animation: tShock 4s ease-out infinite;
  }
  @keyframes tFireball { 0%,58% { opacity: 0; transform: scale(0.1); } 62% { opacity: 1; transform: scale(1); } 80%,100% { opacity: 0; transform: scale(1.5); } }
  @keyframes tShock { 0%,60% { opacity: 0; transform: scale(0.3); } 64% { opacity: 1; } 90%,100% { opacity: 0; transform: scale(5); } }
  @keyframes tArtBlast { 0%,58%,100% { transform: none; filter: none; } 62% { transform: scale(1.18) rotate(-3deg); filter: brightness(1.8); } 66% { transform: scale(0.96) rotate(2deg); } 72% { transform: translate(0.05em,-0.03em); filter: none; } 78% { transform: none; } }

  /* 🔥 활활 — 글자 자체가 아래서부터 일렁이는 불길 색으로 타오르고, 불똥이 튀어오른다 */
  .title-anim-blaze {
    background: linear-gradient(0deg, #FF3D12 0%, #FF8A2C 40%, #FFD36B 75%, #FFF3C4 100%); background-size: 100% 220%;
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 0 0.25em rgba(255,110,40,0.7)); animation: tBlazeFlow 1.4s ease-in-out infinite alternate;
  }
  .title-anim-blaze::before, .title-anim-blaze::after {
    content: ""; position: absolute; bottom: 60%; width: 0.16em; height: 0.16em; border-radius: 50%; background: #FFB14A; pointer-events: none; opacity: 0;
    box-shadow: 0 0 0.3em #FF7A1F; animation: tEmber 1.8s ease-out infinite;
  }
  .title-anim-blaze::before { left: 25%; }
  .title-anim-blaze::after { left: 70%; animation-delay: 0.9s; }
  @keyframes tBlazeFlow { 0% { background-position: 0 100%; } 100% { background-position: 0 0%; } }
  @keyframes tEmber { 0% { opacity: 0; transform: translate(0,0.4em) scale(0.6); } 20% { opacity: 1; } 100% { opacity: 0; transform: translate(0.3em,-1.3em) scale(0.3); } }

  /* 🔮 고대 주술사 — 글자 뒤에 룬 마법진이 천천히 돌며 떠오르고, 보랏빛 기운이 번진다 */
  .title-anim-ancient { animation: tAncientGlow 4.4s ease-in-out infinite; }
  .title-anim-ancient::before {
    content: ""; position: absolute; left: 50%; top: 50%; width: 2.1em; height: 2.1em; margin: -1.05em 0 0 -1.05em; border-radius: 50%; z-index: -1; pointer-events: none;
    border: 0.07em dashed rgba(170,130,240,0.85); box-shadow: inset 0 0 0 0.25em rgba(155,123,216,0.12), 0 0 0.5em rgba(155,123,216,0.4);
    animation: tRuneSpin 4.4s linear infinite;
  }
  @keyframes tRuneSpin { 0% { opacity: 0; transform: rotate(0) scale(0.6); } 25% { opacity: 1; transform: rotate(90deg) scale(1); } 75% { opacity: 1; transform: rotate(270deg) scale(1); } 100% { opacity: 0; transform: rotate(360deg) scale(1.3); } }
  @keyframes tAncientGlow { 0%,100% { text-shadow: 0 0 0.2em rgba(155,123,216,0.4); } 50% { text-shadow: 0 0 0.7em rgba(190,150,255,0.95), 0 0 0.1em #fff; } }

  /* 🎎 꼭두각시 — 위에서 늘어진 실에 매달려 글자가 흔들흔들, 가끔 실을 "툭" 당긴다 */
  .title-anim-puppet { transform-origin: 50% -1em; animation: tMarionette 3.2s ease-in-out infinite; }
  .title-anim-puppet::before {
    content: ""; position: absolute; left: 22%; right: 22%; bottom: 88%; height: 0.95em; pointer-events: none; opacity: 0.6;
    border-left: 0.05em solid currentColor; border-right: 0.05em solid currentColor; border-top: 0.1em solid currentColor;
  }
  @keyframes tMarionette { 0%,100% { transform: rotate(-4deg) translateY(0); } 25% { transform: rotate(0) translateY(0.04em); } 50% { transform: rotate(4deg) translateY(0); } 62% { transform: rotate(3deg) translateY(-0.18em); } 70% { transform: rotate(2deg) translateY(0.02em); } }

  /* 📰 가짜뉴스 — 헤드라인처럼 번쩍이다가, 붉은 "FAKE" 도장이 비스듬히 쾅 찍힌다 */
  .title-anim-fakenews { animation: tHeadline 4s steps(1,end) infinite; }
  .title-anim-fakenews::after {
    content: "FAKE"; position: absolute; left: 50%; top: 50%; font-family: 'Special Elite', 'Courier Prime', monospace; font-size: 0.62em; font-weight: 900; letter-spacing: 0.08em;
    color: #E04848; border: 0.12em solid #E04848; padding: 0 0.25em; line-height: 1.15; white-space: nowrap; pointer-events: none; opacity: 0;
    transform: translate(-50%,-50%) rotate(-14deg) scale(2.4); animation: tFakeStamp 4s ease-out infinite;
  }
  @keyframes tHeadline { 0%,100% { opacity: 1; } 8% { opacity: 0.5; } 10% { opacity: 1; } }
  @keyframes tFakeStamp { 0%,50% { opacity: 0; transform: translate(-50%,-50%) rotate(-14deg) scale(2.4); } 56% { opacity: 0.95; transform: translate(-50%,-50%) rotate(-14deg) scale(0.95); } 60% { transform: translate(-50%,-50%) rotate(-14deg) scale(1); } 88% { opacity: 0.95; } 100% { opacity: 0; transform: translate(-50%,-50%) rotate(-14deg) scale(1); } }

  /* 👑 LEGEND — 황금빛 광택이 글자를 휩쓸고, 자간이 넓어지며 전성기의 위엄을 드러낸다 */
  .title-anim-legend { letter-spacing: 0.06em; text-shadow: 0 0 0.35em rgba(240,194,75,0.55); animation: tLegendRise 4.6s ease-in-out infinite; }
  .title-anim-legend::before {
    content: attr(data-text); position: absolute; inset: 0; white-space: nowrap; pointer-events: none; letter-spacing: inherit;
    background: linear-gradient(105deg, transparent 40%, #FFF6D0 48%, #FFD36B 52%, transparent 60%); background-size: 320% 100%; background-repeat: no-repeat;
    -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent; animation: tLegendSheen 4.6s ease-in-out infinite;
  }
  @keyframes tLegendSheen { 0%,40% { background-position: 130% 0; } 75%,100% { background-position: -30% 0; } }
  @keyframes tLegendRise { 0%,40%,100% { letter-spacing: 0.06em; } 58% { letter-spacing: 0.16em; text-shadow: 0 0 0.8em rgba(255,215,100,0.95); } 75% { letter-spacing: 0.08em; } }

  /* ☠️ 중독 — 글자가 독에 취한 듯 초록빛으로 일그러지고, 아래로 독방울이 똑 떨어진다 */
  .title-anim-poison { animation: tToxic 3.4s ease-in-out infinite; }
  .title-anim-poison::after {
    content: ""; position: absolute; left: 60%; top: 85%; width: 0.22em; height: 0.3em; border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%; pointer-events: none;
    background: #8BD450; box-shadow: 0 0 0.25em rgba(139,212,80,0.8); opacity: 0; animation: tDrop 3.4s ease-in infinite;
  }
  @keyframes tToxic { 0%,100% { transform: none; text-shadow: 0 0 0.2em rgba(139,212,80,0.35); } 40% { transform: skewX(-4deg) scaleY(1.04); text-shadow: 0 0 0.5em rgba(139,212,80,0.85); } 55% { transform: skewX(3deg) scaleY(0.97); } 65% { transform: none; } }
  @keyframes tDrop { 0%,45% { opacity: 0; transform: translateY(-0.2em) scale(0.3); } 55% { opacity: 1; transform: translateY(0) scale(1); } 85% { opacity: 1; transform: translateY(0.7em) scale(0.9); } 100% { opacity: 0; transform: translateY(0.9em) scale(0.5, 0.2); } }

  /* 🔫 FBI — 손전등 빛줄기가 어둠을 가르며 글자를 비추고, 빨강·파랑 불빛이 짧게 번쩍인다 */
  .title-anim-fbi { animation: tFbiFlash 3.6s steps(1,end) infinite; }
  .title-anim-fbi::before {
    content: ""; position: absolute; top: -0.35em; bottom: -0.35em; left: -40%; width: 45%; pointer-events: none; mix-blend-mode: screen;
    background: linear-gradient(90deg, transparent, rgba(255,255,235,0.55), transparent); transform: skewX(-20deg); animation: tFlashlight 3.6s ease-in-out infinite;
  }
  @keyframes tFlashlight { 0%,10% { left: -50%; opacity: 0; } 20% { opacity: 1; } 55% { left: 110%; opacity: 1; } 60%,100% { left: 110%; opacity: 0; } }
  @keyframes tFbiFlash { 0%,70% { text-shadow: 0 0 0.25em rgba(74,139,234,0.5); } 72% { text-shadow: -0.12em 0 0.5em rgba(230,60,60,0.95); } 76% { text-shadow: 0.12em 0 0.5em rgba(80,140,255,0.95); } 80% { text-shadow: -0.12em 0 0.5em rgba(230,60,60,0.95); } 84%,100% { text-shadow: 0 0 0.25em rgba(74,139,234,0.5); } }

  /* 👻 최고의 파트너 — 반투명한 영혼이 글자에서 빠져나와 떠오르고, 머리 위에 후광이 켜진다 */
  .title-anim-partner { animation: tPartnerGlow 4s ease-in-out infinite; }
  .title-anim-partner::before {
    content: attr(data-text); position: absolute; inset: 0; white-space: nowrap; pointer-events: none; color: #D8F1FF; opacity: 0; filter: blur(0.03em);
    animation: tSoulRise 4s ease-out infinite;
  }
  .title-anim-partner::after {
    content: ""; position: absolute; left: 50%; top: -0.55em; width: 1.2em; height: 0.3em; margin-left: -0.6em; border-radius: 50%; pointer-events: none;
    border: 0.08em solid #FFF1B8; box-shadow: 0 0 0.35em rgba(255,240,180,0.9); opacity: 0; animation: tHaloOn 4s ease-out infinite;
  }
  @keyframes tSoulRise { 0%,20% { opacity: 0; transform: translateY(0); } 35% { opacity: 0.6; } 70% { opacity: 0; transform: translateY(-0.9em) scale(1.05); } 100% { opacity: 0; } }
  @keyframes tHaloOn { 0%,55% { opacity: 0; transform: translateY(0.2em) scale(0.6); } 68% { opacity: 1; transform: translateY(0) scale(1); } 90% { opacity: 1; } 100% { opacity: 0; } }
  @keyframes tPartnerGlow { 0%,100% { text-shadow: 0 0 0.25em rgba(168,216,240,0.4); } 65% { text-shadow: 0 0 0.6em rgba(255,240,190,0.85); } }

  /* 👊 팍쒸, 드루와 — 턱짓하듯 까딱까딱 도발하다가, 한 방 맞고도 버티며 이를 악문다 */
  .title-anim-bringit { transform-origin: 50% 90%; animation: tBringIt 3.2s ease-in-out infinite; }
  .title-anim-bringit::after {
    content: ""; position: absolute; left: -0.3em; right: -0.3em; top: -0.2em; bottom: -0.2em; pointer-events: none; opacity: 0;
    background: radial-gradient(circle at 30% 50%, rgba(255,230,200,0.9) 0 0.08em, transparent 0.1em), radial-gradient(circle at 70% 40%, rgba(255,230,200,0.9) 0 0.06em, transparent 0.08em);
    animation: tImpactSpark 3.2s ease-out infinite;
  }
  @keyframes tBringIt { 0%,100% { transform: rotate(0); } 10% { transform: rotate(-6deg) translateY(-0.04em); } 18% { transform: rotate(0); } 26% { transform: rotate(-6deg) translateY(-0.04em); } 34% { transform: rotate(0); }
    62% { transform: translateX(0.14em) rotate(5deg) scale(0.96); filter: brightness(1.5); } 66% { transform: translateX(-0.06em) rotate(-2deg); } 72% { transform: scale(1.06); filter: none; } 80% { transform: none; } }
  @keyframes tImpactSpark { 0%,60% { opacity: 0; transform: scale(0.6); } 63% { opacity: 1; transform: scale(1.1); } 75%,100% { opacity: 0; transform: scale(1.5); } }

  /* 🎩 독재자 — 붉은 선전 광선이 뒤에서 뻗어나오고, 글자가 연단을 내리치듯 쿵쿵 울린다 */
  .title-anim-dictator { animation: tDecree 3.4s ease-out infinite; }
  .title-anim-dictator::before {
    content: ""; position: absolute; left: 50%; top: 50%; width: 3em; height: 3em; margin: -1.5em 0 0 -1.5em; z-index: -1; pointer-events: none; border-radius: 50%;
    background: repeating-conic-gradient(rgba(210,60,60,0.55) 0 10deg, transparent 10deg 30deg);
    -webkit-mask-image: radial-gradient(circle, #000 20%, transparent 68%); mask-image: radial-gradient(circle, #000 20%, transparent 68%);
    opacity: 0; animation: tPropaganda 3.4s ease-in-out infinite;
  }
  @keyframes tPropaganda { 0%,20% { opacity: 0; transform: rotate(0) scale(0.6); } 45% { opacity: 1; transform: rotate(25deg) scale(1); } 85% { opacity: 0.8; transform: rotate(60deg) scale(1.05); } 100% { opacity: 0; transform: rotate(70deg) scale(1.1); } }
  @keyframes tDecree { 0%,40%,100% { transform: none; } 46% { transform: scale(1.15) translateY(-0.06em); } 50% { transform: scale(0.95) translateY(0.04em); text-shadow: 0 0.08em 0 rgba(0,0,0,0.6), 0 0 0.5em rgba(210,60,60,0.9); } 56% { transform: scale(1.1) translateY(-0.04em); } 60% { transform: scale(0.97) translateY(0.03em); } 66% { transform: none; } }

  /* 🔎 내 이름은 라삐, 탐정이죠 — 돋보기 렌즈가 한 글자씩 확대하며 지나가다, 진실을 짚는 순간 "!"가 번뜩인다 */
  .title-anim-eureka { animation: tEureka 3.8s ease-out infinite; }
  .title-anim-eureka::before {
    content: ""; position: absolute; top: 50%; left: -0.4em; width: 1.1em; height: 1.1em; margin-top: -0.55em; border-radius: 50%; pointer-events: none;
    border: 0.08em solid rgba(126,182,255,0.95); background: radial-gradient(circle, rgba(255,255,255,0.25), rgba(126,182,255,0.08) 70%);
    box-shadow: 0 0 0.3em rgba(126,182,255,0.5); animation: tLensSweep 3.8s ease-in-out infinite;
  }
  .title-anim-eureka::after {
    content: "!"; position: absolute; right: -0.55em; top: -0.75em; font-weight: 900; font-size: 1.05em; color: #FFE36B; text-shadow: 0 0 0.4em #FFD000; pointer-events: none; opacity: 0;
    animation: tBang 3.8s ease-out infinite;
  }
  @keyframes tLensSweep { 0% { left: -0.4em; opacity: 0; } 8% { opacity: 1; } 50% { left: calc(100% - 0.7em); opacity: 1; } 58%,100% { left: calc(100% - 0.7em); opacity: 0; } }
  @keyframes tBang { 0%,55% { opacity: 0; transform: scale(0.3) rotate(-20deg); } 62% { opacity: 1; transform: scale(1.35) rotate(8deg); } 68% { transform: scale(1) rotate(0); } 90% { opacity: 1; } 100% { opacity: 0; } }
  @keyframes tEureka { 0%,56%,100% { text-shadow: 0 0 0.2em rgba(126,182,255,0.35); } 62% { text-shadow: 0 0 0.8em rgba(255,240,150,0.95), 0 0 0.1em #fff; } }

  /* 🪖 불사신 — 글자가 잿빛으로 식어 쓰러지다가, 불꽃과 함께 되살아나 더 뜨겁게 타오른다 */
  .title-anim-phoenix { animation: tRebirth 5s ease-in-out infinite; }
  .title-anim-phoenix::after {
    content: ""; position: absolute; left: -0.2em; right: -0.2em; bottom: -0.1em; height: 1.4em; pointer-events: none; z-index: -1; opacity: 0;
    background: radial-gradient(ellipse 60% 70% at 50% 100%, rgba(255,170,60,0.85), rgba(255,90,30,0.35) 55%, transparent 75%); filter: blur(0.05em);
    transform-origin: 50% 100%; animation: tRebirthFlame 5s ease-out infinite;
  }
  @keyframes tRebirth { 0%,20% { filter: none; transform: none; } 32% { filter: grayscale(1) brightness(0.55); transform: translateY(0.08em) rotate(3deg); } 48% { filter: grayscale(1) brightness(0.45); transform: translateY(0.1em) rotate(4deg); }
    56% { filter: brightness(2) saturate(1.5); transform: translateY(-0.1em) scale(1.1); } 64% { filter: brightness(1.3); transform: none; text-shadow: 0 0 0.6em rgba(255,160,60,0.95); } 100% { filter: none; transform: none; } }
  @keyframes tRebirthFlame { 0%,50% { opacity: 0; transform: scaleY(0.2); } 58% { opacity: 1; transform: scaleY(1.2); } 80% { opacity: 0.6; transform: scaleY(0.9); } 100% { opacity: 0; transform: scaleY(0.6); } }

  /* ⚰️ 한번만 빌리겠습니다. — 관 뚜껑을 살짝 열 듯 글자가 들썩이고, 초록 심전도가 "삑" 하고 한 번 뛴다 */
  .title-anim-borrow { margin-right: 1.3em; animation: tLidPeek 3.6s ease-in-out infinite; }
  .title-anim-borrow::after {
    content: ""; position: absolute; left: 100%; top: 50%; margin-left: 0.15em; width: 1.1em; height: 0.7em; margin-top: -0.35em; pointer-events: none;
    background: url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 44 28'%3E%3Cpath d='M0 14h12l4-9 6 18 5-12 3 3h14' fill='none' stroke='%237FC8B0' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") left center/auto 100% no-repeat;
    clip-path: inset(0 100% 0 0); animation: tOneBeat 3.6s linear infinite;
  }
  @keyframes tLidPeek { 0%,40%,100% { transform: none; } 46% { transform: translateY(-0.12em) rotate(-3deg); } 52% { transform: translateY(0.02em); } 56% { transform: translateY(-0.06em) rotate(-1deg); } 60% { transform: none; } }
  @keyframes tOneBeat { 0%,55% { clip-path: inset(0 100% 0 0); opacity: 1; } 75% { clip-path: inset(0 0 0 0); opacity: 1; } 92% { clip-path: inset(0 0 0 0); opacity: 0; } 100% { clip-path: inset(0 100% 0 0); opacity: 0; } }

  /* ⚖️ 배신 — 악수하던 글자의 윗줄과 아랫줄이 서로 반대로 어긋나고, 뒤에서 칼날이 번뜩인다 */
  .title-anim-betrayal { animation: tBetrayHide 4s steps(1,end) infinite; }
  .title-anim-betrayal::before, .title-anim-betrayal::after {
    content: attr(data-text); position: absolute; inset: 0; white-space: nowrap; pointer-events: none; -webkit-text-fill-color: currentColor; opacity: 0;
  }
  .title-anim-betrayal::before { clip-path: inset(0 0 50% 0); animation: tBetrayTop 4s ease-in-out infinite; }
  .title-anim-betrayal::after { clip-path: inset(50% 0 0 0); animation: tBetrayBottom 4s ease-in-out infinite; text-shadow: 0 0 0.35em rgba(255,255,255,0.8); }
  @keyframes tBetrayHide { 0%,59% { -webkit-text-fill-color: currentColor; } 60%,89% { -webkit-text-fill-color: transparent; } 90%,100% { -webkit-text-fill-color: currentColor; } }
  @keyframes tBetrayTop { 0%,59% { opacity: 0; transform: none; } 60% { opacity: 1; transform: none; } 70%,80% { opacity: 1; transform: translateX(0.18em); } 89% { opacity: 1; transform: none; } 90%,100% { opacity: 0; } }
  @keyframes tBetrayBottom { 0%,59% { opacity: 0; transform: none; } 60% { opacity: 1; transform: none; } 70%,80% { opacity: 1; transform: translateX(-0.18em); } 89% { opacity: 1; transform: none; } 90%,100% { opacity: 0; } }

  /* 🗂️ 1급 공무원 — 결재 도장이 위에서 "쾅" 내려찍히고, 붉은 "決" 인장이 남는다 */
  .title-anim-stamp { animation: tStampShake 3.6s ease-out infinite; }
  .title-anim-stamp::after {
    content: "決"; position: absolute; right: -0.9em; top: -0.5em; width: 1.05em; height: 1.05em; line-height: 1.05em; text-align: center; font-size: 0.8em; font-weight: 900;
    font-family: 'Noto Serif KR', serif; color: #D8473F; border: 0.1em solid #D8473F; border-radius: 0.15em; pointer-events: none; opacity: 0;
    transform: rotate(-12deg) scale(2.2); animation: tSealDown 3.6s ease-out infinite;
  }
  @keyframes tSealDown { 0%,48% { opacity: 0; transform: rotate(-12deg) scale(2.2) translateY(-0.6em); } 55% { opacity: 0.95; transform: rotate(-12deg) scale(0.9); } 60% { transform: rotate(-12deg) scale(1); } 88% { opacity: 0.95; } 100% { opacity: 0; transform: rotate(-12deg) scale(1); } }
  @keyframes tStampShake { 0%,54%,100% { transform: none; } 56% { transform: translateY(0.06em); } 60% { transform: none; } }

  /* 😇 성녀 — 머리 위로 금빛 후광이 천천히 내려앉고, 부드러운 빛줄기가 글자를 감싼다 */
  .title-anim-saint { animation: tSaintLight 4.2s ease-in-out infinite; }
  .title-anim-saint::before {
    content: ""; position: absolute; left: 50%; top: -0.62em; width: 1.5em; height: 0.36em; margin-left: -0.75em; border-radius: 50%; pointer-events: none;
    border: 0.09em solid #F4E3A1; box-shadow: 0 0 0.4em rgba(255,236,160,0.95), inset 0 0 0.2em rgba(255,236,160,0.7); animation: tHaloFloat 4.2s ease-in-out infinite;
  }
  .title-anim-saint::after {
    content: ""; position: absolute; left: -0.4em; right: -0.4em; top: -0.8em; bottom: 0; z-index: -1; pointer-events: none;
    background: linear-gradient(180deg, rgba(255,240,190,0.35), transparent 80%); clip-path: polygon(35% 0, 65% 0, 100% 100%, 0 100%); opacity: 0.4; animation: tSaintBeam 4.2s ease-in-out infinite;
  }
  @keyframes tHaloFloat { 0%,100% { transform: translateY(-0.12em); opacity: 0.75; } 50% { transform: translateY(0.02em); opacity: 1; } }
  @keyframes tSaintBeam { 0%,100% { opacity: 0.25; } 50% { opacity: 0.7; } }
  @keyframes tSaintLight { 0%,100% { text-shadow: 0 0 0.25em rgba(244,227,161,0.4); } 50% { text-shadow: 0 0 0.6em rgba(255,240,190,0.95); } }

  /* 🔥 이단심판관 — 발밑에서 심판의 불길이 솟고, 글자가 엄숙하게 붉게 달아오른다 */
  .title-anim-inquisitor { animation: tJudgement 3.8s ease-in-out infinite; }
  .title-anim-inquisitor::before {
    content: ""; position: absolute; left: 0; right: 0; bottom: -0.15em; height: 0.9em; z-index: -1; pointer-events: none; transform-origin: 50% 100%;
    background: radial-gradient(ellipse 12% 80% at 15% 100%, rgba(255,120,40,0.85), transparent), radial-gradient(ellipse 14% 95% at 45% 100%, rgba(255,90,30,0.9), transparent), radial-gradient(ellipse 12% 75% at 78% 100%, rgba(255,140,50,0.85), transparent);
    animation: tPyre 1.1s ease-in-out infinite alternate, tPyreShow 3.8s ease-in-out infinite;
  }
  @keyframes tPyre { 0% { transform: scaleY(0.8) skewX(-3deg); } 100% { transform: scaleY(1.15) skewX(3deg); } }
  @keyframes tPyreShow { 0%,30% { opacity: 0; } 50%,85% { opacity: 1; } 100% { opacity: 0; } }
  @keyframes tJudgement { 0%,30%,100% { text-shadow: 0 0 0.2em rgba(216,85,46,0.35); } 55% { text-shadow: 0 0 0.55em rgba(255,110,50,0.95), 0 0.05em 0 rgba(0,0,0,0.5); color: #FFB08A; } }

  /* 📜 다잉메세지 — 떨리는 손으로 한 글자씩 피로 써 내려가고, 마지막 획에서 핏방울이 흘러내린다 */
  .title-anim-dying { animation: tBloodWrite 4.4s steps(18, end) infinite; }
  .title-anim-dying::after {
    content: ""; position: absolute; right: 0.1em; top: 80%; width: 0.12em; height: 0; border-radius: 0 0 0.1em 0.1em; background: #C23A3A; pointer-events: none;
    animation: tBloodDrip 4.4s ease-in infinite;
  }
  @keyframes tBloodWrite { 0% { clip-path: inset(0 100% 0 0); } 45%,90% { clip-path: inset(-0.5em 0 -1em 0); } 100% { clip-path: inset(-0.5em 0 -1em 0); } }
  @keyframes tBloodDrip { 0%,45% { height: 0; opacity: 1; } 70% { height: 0.55em; opacity: 1; } 90% { height: 0.7em; opacity: 0; } 100% { height: 0; opacity: 0; } }

  @media (prefers-reduced-motion: reduce) {
    [class*="title-anim-"], [class*="title-anim-"]::before, [class*="title-anim-"]::after, .title-catwalk-emoji { animation: none !important; }
    [class*="title-anim-"]::before, [class*="title-anim-"]::after { opacity: 0 !important; }
  }
  /* 화면(스크롤 영역) 밖으로 나간 채팅의 칭호는 연출을 끈다 - 수백 개의 무한 애니메이션이 동시에 도는 것을 막는다. */
  .title-anim-off, .title-anim-off::before, .title-anim-off::after, .title-anim-off * { animation: none !important; will-change: auto !important; }
`;

// 칭호 배지를 렌더링하는 공용 컴포넌트. 대부분의 칭호는 그냥 "<칭호>" 텍스트에 애니메이션 클래스만
// 붙이면 되지만, "길냥이"처럼 텍스트 안의 이모지 자체가 움직여야 하는 경우는 이모지를 별도로 분리해서
// 렌더링해야 한다(원본 이모지는 레이아웃 자리만 차지하도록 숨기고, 움직이는 사본 하나만 보여준다 -
// 이렇게 해야 "새 이모지가 추가로 생긴 것"처럼 보이지 않고 "원래 있던 이모지가 움직이는" 것처럼 보인다).
/**
 * 요소가 실제로 화면에 보이는지 추적한다(스크롤 영역에 잘리거나, 숨겨진 탭 안에 있으면 false).
 * 채팅 줄마다 관찰자를 새로 만들지 않도록 IntersectionObserver 하나를 공유한다.
 */
let sharedObserver = null;
const observedCallbacks = new WeakMap();
function getSharedObserver() {
  if (sharedObserver || typeof IntersectionObserver === "undefined") return sharedObserver;
  sharedObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => observedCallbacks.get(e.target)?.(e.isIntersecting));
  }, { rootMargin: "40px 0px" });
  return sharedObserver;
}
export function useInView(ref) {
  const [inView, setInView] = useState(() => typeof IntersectionObserver === "undefined");
  useEffect(() => {
    const el = ref.current;
    const io = getSharedObserver();
    if (!el || !io) return undefined;
    observedCallbacks.set(el, setInView);
    io.observe(el);
    return () => { io.unobserve(el); observedCallbacks.delete(el); };
  }, [ref]);
  return inView;
}

export function TitleBadge({ title, style, as: Tag = "span", animate = true }) {
  const baseClass = titleAnimationClass(title);
  const animClass = animate ? baseClass : `${baseClass || ""} title-anim-off`.trim();
  const { name } = splitTitle(title);
  if (baseClass === "title-anim-catwalk") {
    // 길냥이: 고양이 아이콘이 글자 위를 좌우로 어슬렁 (자리는 투명한 아이콘으로 잡아둔다)
    return (
      <Tag className={animate ? undefined : "title-anim-off"} style={{ ...style, position: "relative", display: "inline-block" }}>
        &lt;<TitleIcon title={title} style={{ visibility: "hidden" }} />
        <span className="title-catwalk-emoji" style={{ lineHeight: 0 }}><TitleIcon title={title} style={{ transform: "scaleX(-1)", verticalAlign: "middle" }} /></span>
        {name}&gt;
      </Tag>
    );
  }
  // 이모지 대신 칭호 전용 아이콘을 괄호 안에 붙이고, 애니메이션은 칭호 이름 글자에만 건다.
  // data-text: 칼질 분리·글리치·광택 연출이 가상요소에서 글자를 복제할 때 쓴다 (아이콘을 뺀 이름과 정확히 같아야 겹침이 맞는다).
  return (
    <Tag style={{ whiteSpace: "nowrap", ...style }}>
      &lt;<TitleIcon title={title} style={{ marginRight: "0.18em" }} /><span className={animClass || undefined} data-text={name}>{name}</span>&gt;
    </Tag>
  );
}

// ─────────────────────────────────────────────────────────────
// 누아르 분위기 레이어 (플레이어 화면 전용)
// 필름 그레인 · 비네팅 · 밤엔 빗줄기 / 낮엔 블라인드 사이로 새어드는 빛
// ─────────────────────────────────────────────────────────────
const GRAIN_SVG = "data:image/svg+xml;utf8," + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>"
);

export const NOIR_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@500;700;900&family=Noto+Sans+KR:wght@400;500;700;900&family=Special+Elite&family=Courier+Prime:wght@400;700&display=swap');
  html, body { background: #060505; }
  body { color: #E6DFCF; -webkit-font-smoothing: antialiased; }
  ::selection { background: rgba(179,38,46,0.55); color: #fff; }
  * { scrollbar-width: thin; scrollbar-color: rgba(200,165,90,0.35) transparent; }
  *::-webkit-scrollbar { width: 8px; height: 8px; }
  *::-webkit-scrollbar-thumb { background: rgba(200,165,90,0.28); border-radius: 0; }
  *::-webkit-scrollbar-track { background: transparent; }
  input[type="checkbox"], input[type="range"] { accent-color: #B3262E; }

  .noir-card { position: relative; }
  .noir-card::before {
    content: ""; position: absolute; left: 0; right: 0; top: 0; height: 1px; pointer-events: none;
    background: linear-gradient(90deg, transparent, var(--noir-accent) 20%, var(--noir-accent) 80%, transparent); opacity: 0.55;
  }
  .noir-card::after {
    content: ""; position: absolute; inset: 5px; pointer-events: none; border: 1px solid rgba(255,255,255,0.025);
  }

  .noir-btn { position: relative; overflow: hidden; }
  .noir-btn:not(:disabled):hover { filter: brightness(1.12); box-shadow: 0 0 0 1px var(--noir-accent), 0 0 18px var(--noir-glow); }
  .noir-btn::after {
    content: ""; position: absolute; top: 0; bottom: 0; left: -60%; width: 40%; pointer-events: none;
    background: linear-gradient(100deg, transparent, rgba(255,255,255,0.14), transparent); transform: skewX(-20deg);
    transition: left 0.5s ease;
  }
  .noir-btn:not(:disabled):hover::after { left: 120%; }
  .noir-chip:hover { border-color: var(--noir-accent) !important; }
  .noir-input:focus { border-color: var(--noir-accent) !important; box-shadow: 0 0 0 1px var(--noir-accent) inset; }

  @keyframes noirGrain {
    0%,100% { transform: translate(0,0); } 10% { transform: translate(-5%,-10%); } 30% { transform: translate(3%,-15%); }
    50% { transform: translate(12%,9%); } 70% { transform: translate(9%,4%); } 90% { transform: translate(-1%,7%); }
  }
  @keyframes noirRain { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(-120px, 300px, 0); } }
  @keyframes noirFlicker { 0%,100% { opacity: 1; } 92% { opacity: 1; } 93% { opacity: 0.55; } 94% { opacity: 1; } 96% { opacity: 0.75; } 97% { opacity: 1; } }
  @keyframes noirTimerPulse { 0%,100% { text-shadow: 0 0 10px var(--noir-glow-red); } 50% { text-shadow: 0 0 22px var(--noir-glow-red), 0 0 2px #fff; } }
  @keyframes noirStampIn { from { opacity: 0; transform: scale(1.6) rotate(-14deg); } to { opacity: 1; transform: scale(1) rotate(-8deg); } }
  .noir-timer-urgent { animation: noirTimerPulse 1s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce) {
    .noir-grain, .noir-rain, .noir-flicker { animation: none !important; }
  }
`;

/** 화면 전체에 깔리는 누아르 분위기 오버레이. 클릭을 막지 않는다. */
export function NoirAtmosphere({ theme }) {
  const mode = theme?.name || "dusk";
  return (
    <>
      <style>{NOIR_CSS}</style>
      <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 40, overflow: "hidden" }}>
        {mode === "night" && (
          <div className="noir-rain" style={{ position: "absolute", top: "-300px", left: 0, right: "-120px", bottom: 0, opacity: 0.16, willChange: "transform",
            backgroundImage: "repeating-linear-gradient(100deg, transparent 0 22px, rgba(180,200,230,0.55) 22px 23px, transparent 23px 61px)",
            backgroundSize: "120px 300px", animation: "noirRain 0.9s linear infinite",
            maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9), rgba(0,0,0,0.2))", WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9), rgba(0,0,0,0.2))" }} />
        )}
        {mode === "day" && (
          <div className="noir-flicker" style={{ position: "absolute", inset: 0, animation: "noirFlicker 7s linear infinite" }}>
            <div style={{ position: "absolute", inset: "-10% -20%", opacity: 0.06, transform: "rotate(-12deg)",
              backgroundImage: "repeating-linear-gradient(180deg, rgba(240,220,180,1) 0 26px, transparent 26px 54px)",
              maskImage: "radial-gradient(ellipse 45% 60% at 70% 30%, #000 0%, transparent 70%)", WebkitMaskImage: "radial-gradient(ellipse 45% 60% at 70% 30%, #000 0%, transparent 70%)" }} />
          </div>
        )}
        {mode === "dusk" && (
          <div style={{ position: "absolute", inset: 0, opacity: 0.35,
            background: "radial-gradient(ellipse 60% 30% at 15% 85%, rgba(160,110,60,0.18), transparent 70%), radial-gradient(ellipse 50% 25% at 85% 70%, rgba(120,90,60,0.14), transparent 70%)" }} />
        )}
        <div className="noir-grain" style={{ position: "absolute", inset: "-50%", backgroundImage: `url("${GRAIN_SVG}")`,
          opacity: 0.045, willChange: "transform", animation: "noirGrain 1.2s steps(6) infinite" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 110% 90% at 50% 45%, transparent 55%, rgba(0,0,0,0.72) 100%)" }} />
      </div>
    </>
  );
}

const noirVars = (theme) => ({ "--noir-accent": theme.accent, "--noir-glow": theme.glow || theme.accentSoft, "--noir-glow-red": "rgba(196,50,58,0.75)" });

export function Card({ theme, children, style }) {
  return (
    <div className="noir-card" style={{ ...noirVars(theme), background: `linear-gradient(180deg, rgba(255,255,255,0.025), rgba(0,0,0,0.12)), ${theme.panel}`,
      border: `1px solid ${theme.panelBorder}`, borderRadius: 3,
      padding: "20px 22px",
      boxShadow: "0 18px 40px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(0,0,0,0.4)", ...style }}>
      {children}
    </div>
  );
}

export function Button({ theme, children, onClick, disabled, variant = "solid", style }) {
  const base = { fontSize: 14, fontWeight: 700, padding: "10px 20px", borderRadius: 2, letterSpacing: "0.04em",
    cursor: disabled ? "not-allowed" : "pointer", border: `1px solid ${theme.accent}`,
    opacity: disabled ? 0.35 : 1, transition: "transform 0.12s ease, opacity 0.2s ease, filter 0.2s ease, box-shadow 0.2s ease" };
  const variants = {
    solid: { background: `linear-gradient(180deg, ${theme.accent}, ${theme.accent}CC)`, color: theme.onAccent || "#0b0a08",
      boxShadow: "0 6px 16px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18)", textShadow: "none" },
    ghost: { background: "rgba(0,0,0,0.25)", color: theme.text },
    subtle: { background: theme.accentSoft, color: theme.text },
  };
  const handleClick = (e) => {
    if (disabled) return;
    playClick();
    onClick && onClick(e);
  };
  return (
    <button className="noir-btn" onClick={handleClick} disabled={disabled}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = "scale(0.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      style={{ ...noirVars(theme), ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

export function Chip({ theme, label, selected, onClick, dim }) {
  const handleClick = onClick ? (e) => { playSelect(); onClick(e); } : undefined;
  return (
    <button className="noir-chip" onClick={handleClick} style={{ ...noirVars(theme), padding: "7px 14px", borderRadius: 2, fontSize: 13, fontWeight: 600,
      border: `1px solid ${selected ? theme.accent : theme.panelBorder}`,
      background: selected ? `linear-gradient(180deg, ${theme.accentSoft}, rgba(0,0,0,0.2))` : "rgba(0,0,0,0.28)",
      boxShadow: selected ? `inset 3px 0 0 ${theme.accent}` : "none",
      color: selected ? theme.text : theme.text, cursor: onClick ? "pointer" : "default", opacity: dim ? 0.4 : 1,
      transition: "border-color 0.15s ease, background 0.15s ease" }}>
      {label}
    </button>
  );
}

export function PhaseHeader({ theme, label, phase }) {
  const icon = phase === "night" ? "🌙" : phase === "gameover" ? "🗃️" : "🕯️";
  const kicker = phase === "night" ? "NIGHT OPERATION" : phase === "gameover" ? "CASE CLOSED" : phase === "reveal" ? "IDENTITY FILE" : "INTERROGATION";
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontFamily: "'Special Elite', 'Courier Prime', monospace", fontSize: 10.5, letterSpacing: "0.28em", color: theme.accent }}>
          ■ 7EVELLIO · {kicker}
        </span>
        <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${theme.accent}88, transparent)` }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20, filter: "grayscale(0.4) drop-shadow(0 0 6px rgba(0,0,0,0.8))" }}>{icon}</span>
        <h2 style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: 23, color: theme.text, margin: 0,
          letterSpacing: "-0.01em", textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}>{label}</h2>
      </div>
    </div>
  );
}

export function RedactedNotice({ theme, text }) {
  return (
    <div style={{ position: "relative", border: `1px solid ${theme.panelBorder}`, borderRadius: 2, padding: "26px 18px 22px",
      textAlign: "center", color: theme.sub, fontSize: 13.5, lineHeight: 1.6,
      background: "repeating-linear-gradient(-45deg, rgba(0,0,0,0.35) 0 10px, rgba(0,0,0,0.2) 10px 20px)" }}>
      <div style={{ display: "inline-block", fontFamily: "'Special Elite', monospace", fontSize: 11, letterSpacing: "0.3em",
        color: "#C4323A", border: "2px solid #C4323A", padding: "3px 10px", marginBottom: 10, transform: "rotate(-4deg)", opacity: 0.85 }}>
        CLASSIFIED
      </div>
      <div>🔒 {text}</div>
    </div>
  );
}

export function PrivateNote({ theme, children }) {
  return (
    <div style={{ borderLeft: `3px solid ${theme.accent}`, borderTop: `1px solid ${theme.panelBorder}`, borderRight: `1px solid ${theme.panelBorder}`,
      borderBottom: `1px solid ${theme.panelBorder}`, background: `linear-gradient(90deg, ${theme.accentSoft}, rgba(0,0,0,0.25))`, borderRadius: 2,
      padding: "10px 14px", fontSize: 12.5, color: theme.text, marginBottom: 10, lineHeight: 1.55 }}>
      {children}
    </div>
  );
}

export function TimerDisplay(props) {
  const { topTimer } = useGameLayout();
  // 상단 바에 타이머가 떠 있으면 각 화면 안의 큰 타이머는 그리지 않는다 (째깍 소리도 상단 바 쪽에서 한 번만 난다).
  if (topTimer && !props.compact) return null;
  return <TimerInner {...props} />;
}

function TimerInner({ theme, seconds: fallbackSeconds, compact }) {
  const seconds = useTimerSeconds(fallbackSeconds);
  // 마지막 5초는 째깍 소리로 알려준다
  useEffect(() => {
    if (seconds >= 1 && seconds <= 5) playPlayerSample("timer_tick", { gain: 0.7 });
  }, [seconds]);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const urgent = seconds <= 10;
  const color = urgent ? "#E0474F" : theme.name === "day" ? theme.text : theme.accent;
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div className={urgent ? "noir-timer-urgent" : ""} style={{ "--noir-glow-red": "rgba(224,71,79,0.8)",
        fontFamily: "'Courier Prime', 'Special Elite', monospace", fontSize: compact ? 24 : 42, fontWeight: 700, color, textAlign: "center",
        letterSpacing: "0.08em", padding: compact ? "0 10px" : "2px 18px", lineHeight: compact ? 1.25 : undefined, borderTop: `1px solid ${color}55`, borderBottom: `1px solid ${color}55`,
        background: "rgba(0,0,0,0.35)", textShadow: `0 0 12px ${color}88` }}>
        {mm}:{ss}
      </div>
    </div>
  );
}

export function AutoNote({ theme, text = "시간이 지나면 자동으로 다음 단계로 진행됩니다." }) {
  return <div style={{ marginTop: 16, fontSize: 11.5, color: theme.sub, textAlign: "center", letterSpacing: "0.02em" }}>⏱ {text}</div>;
}

/** 메시지 목록은 입력창에 타자를 칠 때마다 다시 그릴 필요가 없으므로 따로 메모이즈한다. */
const ChatMessageList = memo(function ChatMessageList({ theme, messages, players, emptyText }) {
  return (
    <>
      {messages.length === 0 && <div style={{ fontSize: 12, color: theme.sub }}>{emptyText}</div>}
      {messages.map((m, i) => (
        <ChatMessageRow key={i} theme={theme} m={m} players={players} />
      ))}
    </>
  );
});

function ChatMessageRow({ theme, m, players }) {
  const sender = players?.find((p) => p.id === m.senderId);
  const nameColor = sender?.roleLabel ? roleLabelColor(sender.roleLabel) : theme.text;
  const rowRef = useRef(null);
  // 칭호 연출은 스크롤 영역 안에 보이는 채팅에만 켠다. 위로 밀려나간 채팅은 연출을 끈다.
  const inView = useInView(rowRef);
  return (
    <div ref={rowRef} style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {sender ? (
        <PlayerAvatar theme={theme} player={sender} size={19} />
      ) : (
        <div style={{ width: 19, height: 19, borderRadius: "50%", background: theme.accentSoft, flexShrink: 0 }} />
      )}
      <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 0, alignItems: "flex-start" }}>
        {sender?.activeTitle && (
          <TitleBadge title={sender.activeTitle} animate={inView} style={{ fontSize: 8.5, color: titleColor(sender.activeTitle, theme), fontWeight: 700, lineHeight: 1.3 }} />
        )}
        <span style={{ fontSize: 12.5, color: theme.text, lineHeight: 1.3 }}>
          <b style={{ color: nameColor, textShadow: sender?.roleLabel ? roleLabelShadow(nameColor) : "none" }}>{m.sender}</b>
          {sender?.isSheriff && <span style={{ fontSize: 10.5, marginLeft: 3 }}>⭐</span>}
          : {m.text}
        </span>
      </div>
    </div>
  );
}

/** 스크롤이 이미 맨 아래 근처일 때만 새 메시지가 올 때 자동으로 맨 아래로 내린다.
 *  옛날 채팅을 보려고 위로 스크롤해둔 상태라면, 새 메시지가 와도 억지로 끌어내리지 않는다. */
function useAutoScrollToEnd(deps, threshold = 40) {
  const containerRef = useRef(null);
  const endRef = useRef(null);
  const wasNearBottomRef = useRef(true);
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    wasNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  };
  useEffect(() => {
    // 컨테이너 자체의 스크롤 위치만 직접 조작한다 - scrollIntoView는 조상 스크롤(웹페이지 전체 스크롤)까지
    // 함께 끌고 가버려서, 채팅이 올라올 때마다 페이지 스크롤이 채팅창으로 튀는 문제가 있었다.
    const el = containerRef.current;
    if (el && wasNearBottomRef.current) el.scrollTop = el.scrollHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { containerRef, endRef, handleScroll };
}

export function ChatPanel({ theme, title, icon, messages, onSend, participants, players, inline }) {
  const [text, setText] = useState("");
  const { containerRef, endRef, handleScroll } = useAutoScrollToEnd([messages.length]);
  const submit = () => { if (chatDisabledReasonRef.current) return; if (text.trim()) { onSend(text.trim()); setText(""); } };
  const chatDisabledReasonRef = useRef(null);
  chatDisabledReasonRef.current = useGameLayout().chatDisabledReason;
  const inSlot = useInChatSlot(inline);
  const rooms = useChatRooms();
  const { chatDisabledReason } = useGameLayout();
  useRegisterChatRoom(title, title, messages.length, inSlot, icon);
  const hidden = inSlot && rooms && !rooms.isVisible(title);
  const disabled = !!chatDisabledReason;
  return (
    <ChatSlot inline={inline}>
    <div className="noir-chat-panel" data-room={title} style={{ display: hidden ? "none" : undefined, marginTop: inSlot ? 0 : 14, border: `1px solid ${theme.panelBorder}`, borderRadius: 2, padding: 12, background: inSlot ? theme.panel : "rgba(0,0,0,0.3)",
      ...(inSlot && !hidden ? { display: "flex", flexDirection: "column", flex: "1 1 0", minHeight: 200 } : {}) }}>
      <style>{TITLE_ANIMATION_CSS}</style>
      <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: participants?.length ? 2 : 8, color: theme.accent, letterSpacing: "0.03em", display: "flex", alignItems: "center", gap: 6 }}>{icon && <RoleIcon role={icon} size={16} />}{title}</div>
      {participants?.length > 0 && (
        <div style={{ fontSize: 11, color: theme.sub, marginBottom: 8 }}>참여: {participants.join(", ")}</div>
      )}
      <div ref={containerRef} onScroll={handleScroll} style={{ ...(inSlot ? { flex: 1, minHeight: 0 } : { height: 130 }), overflowY: "auto", display: "flex", flexDirection: "column", gap: 5, marginBottom: 8 }}>
        <ChatMessageList theme={theme} messages={messages} players={players} emptyText="아직 메시지가 없습니다." />
        <div ref={endRef} />
      </div>
      {disabled && (
        <div style={{ fontSize: 11.5, color: "#C9AEE0", background: "rgba(123,94,167,0.18)", border: "1px solid rgba(123,94,167,0.45)", borderRadius: 2, padding: "6px 9px", marginBottom: 6 }}>
          <RoleIcon role="witch" size={14} inline />{chatDisabledReason}
        </div>
      )}
      <div style={{ display: "flex", gap: 6, opacity: disabled ? 0.45 : 1 }}>
        <input className="noir-input" value={text} disabled={disabled} onChange={(e) => setText(e.target.value)} placeholder={disabled ? "지금은 채팅을 칠 수 없습니다" : "메시지 입력..."}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          style={{ "--noir-accent": theme.accent, flex: 1, padding: "7px 10px", borderRadius: 2, border: `1px solid ${theme.panelBorder}`,
            background: "rgba(0,0,0,0.45)", color: theme.text, fontSize: 12.5, outline: "none" }} />
        <Button theme={theme} onClick={submit} disabled={disabled} style={{ padding: "7px 14px", fontSize: 12.5 }}>전송</Button>
      </div>
    </div>
    </ChatSlot>
  );
}

export function SettingsPanel({ theme }) {
  const [open, setOpen] = useState(false);
  const [on, setOn] = useState(() => isSoundEnabled());
  const [volume, setVolumeState] = useState(() => getVolume());
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      <button onClick={() => { playToggle(); setOpen((o) => !o); }} title="설정"
        style={{ width: 36, height: 36, borderRadius: 2, border: `1px solid ${theme.panelBorder}`,
          background: theme.panel, color: theme.text, fontSize: 16, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 16px rgba(0,0,0,0.5)" }}>
        ⚙️
      </button>
      {open && (
        <Card theme={theme} style={{ position: "absolute", top: 44, right: 0, width: 220, zIndex: 200 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 12 }}>🔊 효과음 설정</div>
          <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12.5, color: theme.text, marginBottom: 12, cursor: "pointer" }}>
            효과음 사용
            <input type="checkbox" checked={on} onChange={(e) => {
              const next = e.target.checked;
              setSoundEnabled(next);
              setOn(next);
              if (next) playToggle();
            }} />
          </label>
          <div style={{ fontSize: 11.5, color: theme.sub, marginBottom: 6 }}>볼륨 {volume}</div>
          <input type="range" min={0} max={100} value={volume} disabled={!on}
            onChange={(e) => { const v = Number(e.target.value); setVolumeState(v); setVolume(v); }}
            onMouseUp={() => on && playToggle()}
            style={{ width: "100%", accentColor: theme.accent, opacity: on ? 1 : 0.4 }} />
        </Card>
      )}
    </div>
  );
}

export function PlayerAvatar({ theme, player, size = 28 }) {
  if (player.profileImageUrl) {
    return (
      <img src={player.profileImageUrl} alt={player.name} width={size} height={size}
        style={{ borderRadius: "50%", objectFit: "cover", opacity: player.alive ? 1 : 0.45, flexShrink: 0,
          filter: player.alive ? "saturate(0.85) contrast(1.05)" : "grayscale(1) contrast(1.1)", boxShadow: `0 0 0 1px ${theme.panelBorder}` }} />
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: player.alive ? theme.accentSoft : "rgba(60,60,60,0.35)", boxShadow: `0 0 0 1px ${theme.panelBorder}`,
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.42, fontWeight: 700, color: theme.text, flexShrink: 0 }}>
      {player.alive ? player.name.slice(0, 1) : "💀"}
    </div>
  );
}

export function PlayerRow({ theme, player, sub }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10 }}>
      <PlayerAvatar theme={theme} player={player} size={28} />
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: theme.text, textDecoration: player.alive ? "none" : "line-through" }}>{player.name}</div>
        {sub && <div style={{ fontSize: 11, color: theme.sub }}>{sub}</div>}
      </div>
    </div>
  );
}

/** 기자의 공개 특종을 실제 신문 호외처럼 꾸며 보여준다. */
export function NewsArticle({ theme, dayNumber, name, roleLabel }) {
  return (
    <div style={{
      border: `1px solid ${theme.text}33`, borderRadius: 1, padding: "16px 18px", marginBottom: 12,
      background: "linear-gradient(180deg, rgba(230,215,180,0.07), rgba(0,0,0,0.25))", boxShadow: "0 10px 24px rgba(0,0,0,0.5)",
      transform: "rotate(-0.4deg)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `2px solid ${theme.text}`, paddingBottom: 6, marginBottom: 8 }}>
        <span style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", color: theme.text }}>
          레벨리오 일보 · 호외
        </span>
        <span style={{ fontSize: 10.5, color: theme.sub }}>{dayNumber}일차 아침판</span>
      </div>
      <div style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 700, fontSize: 17, color: theme.text, lineHeight: 1.4, marginBottom: 6 }}>
        단독) {name}, 정체는 [{roleLabel}](으)로 밝혀져
      </div>
      <p style={{ fontSize: 12, color: theme.sub, lineHeight: 1.6, margin: 0 }}>
        본지 취재 결과 <b style={{ color: theme.text }}>{name}</b>님의 정체가 <b style={{ color: theme.text }}>{roleLabel}</b>(으)로 확인되었다.
        본지 기자는 어젯밤 현장을 취재해 이 같은 사실을 단독으로 입수했다.
      </p>
    </div>
  );
}

/** 치지직 채팅에서 중계된 메시지를 보여주는 읽기 전용 피드 (여기서는 입력할 수 없음) */
export function LiveChatFeed({ theme, title, messages, players, emptyText = "아직 채팅이 없습니다. 치지직 채팅창에 메시지를 남겨주세요!", inline }) {
  const { containerRef, endRef, handleScroll } = useAutoScrollToEnd([messages.length]);
  const inSlot = useInChatSlot(inline);
  const rooms = useChatRooms();
  const roomTitle = `💬 ${title}`;
  useRegisterChatRoom(roomTitle, roomTitle, messages.length, inSlot);
  const hidden = inSlot && rooms && !rooms.isVisible(roomTitle);
  return (
    <ChatSlot inline={inline}>
    <div className="noir-chat-panel" data-room={roomTitle} style={{ display: hidden ? "none" : undefined, border: `1px solid ${theme.panelBorder}`, borderRadius: 2, padding: 12, marginBottom: inSlot ? 0 : 14, background: inSlot ? theme.panel : "rgba(0,0,0,0.3)",
      ...((inSlot && !hidden) || inline === "fill" ? { display: "flex", flexDirection: "column", flex: "1 1 0", minHeight: 200 } : {}) }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8, color: theme.text, display: "flex", alignItems: "center", gap: 6 }}>
        💬 {title}
      </div>
      <div ref={containerRef} onScroll={handleScroll} style={{ ...(inSlot || inline === "fill" ? { flex: 1, minHeight: 0 } : { height: 220 }), overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
        <ChatMessageList theme={theme} messages={messages} players={players} emptyText={emptyText} />
        <div ref={endRef} />
      </div>
    </div>
    </ChatSlot>
  );
}

/** 참여자 명단을 하단에 늘 보여주는 로스터 - 생존/사망을 구분해 표시 */
export const PlayerRoster = memo(function PlayerRoster({ theme, players, teamCounts, onPlayerClick, variant }) {
  if (variant === "list") return <PlayerRosterList theme={theme} players={players} teamCounts={teamCounts} onPlayerClick={onPlayerClick} />;
  if (variant === "grid") return <PlayerRosterGrid theme={theme} players={players} teamCounts={teamCounts} onPlayerClick={onPlayerClick} />;
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ fontSize: 11.5, color: theme.sub, marginBottom: 10, lineHeight: 1.6 }}>
        <span style={{ fontFamily: "'Special Elite', monospace", letterSpacing: "0.2em", color: theme.accent, marginRight: 6 }}>SUSPECTS</span>
        참여자 ({players.filter((p) => p.alive).length}/{players.length}명 생존)
        {teamCounts && (
          <> · 마피아팀 {teamCounts.mafia.total}명(마피아{teamCounts.mafia.mafia}+특수직업{teamCounts.mafia.special}) · 시민팀 {teamCounts.citizen.total}명(경찰{teamCounts.citizen.police}+의사{teamCounts.citizen.doctor}+특수직업{teamCounts.citizen.special}+일반직업{teamCounts.citizen.general}) · 중립 {teamCounts.neutral.total}명</>
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {players.map((p) => {
          const clickable = !p.roleLabel && !p.isSelf && onPlayerClick;
          const eliminated = !p.alive || p.inJail; // 감옥에 간 사람도 죽은 사람처럼 탈락 취급으로 표시
          return (
            <div key={p.id} onClick={clickable ? () => onPlayerClick(p.id) : undefined}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px 4px 4px",
                borderRadius: 2, background: eliminated ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.3)",
                border: `1px solid ${eliminated ? "rgba(120,120,120,0.18)" : theme.panelBorder}`,
                borderLeft: `2px solid ${p.isMafia === true ? "#C4323A" : eliminated ? "rgba(120,120,120,0.3)" : theme.accent}`,
                filter: eliminated ? "grayscale(0.6)" : "none",
                cursor: clickable ? "pointer" : "default" }}>
              <PlayerAvatar theme={theme} player={p} size={20} />
              {p.isSheriff && (
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#E8C468", background: "rgba(232,196,104,0.16)",
                  borderRadius: 2, padding: "2px 7px" }}>
                  ⭐ 보안관
                </span>
              )}
              <span style={{
                fontSize: 12,
                // 처형 시 "마피아였습니다"로 공개된 경우 - 정확한 직업명은 아니고 마피아 여부만 붉은색으로 표시
                color: p.isMafia === true ? "#E0474F" : !eliminated ? theme.text : theme.sub,
                fontWeight: p.isMafia === true ? 700 : 400,
                textDecoration: eliminated ? "line-through" : "none",
              }}>
                {p.name}
              </span>
              {p.inJail && (
                <span style={{ fontSize: 10.5, fontWeight: 700, color: theme.sub, background: "rgba(120,120,120,0.2)",
                  borderRadius: 2, padding: "2px 7px" }}>
                  🔒 감옥
                </span>
              )}
              {p.roleLabel && (
                <span style={{
                  fontSize: 10.5, fontWeight: 700, color: roleLabelColor(p.roleLabel), background: "rgba(0,0,0,0.4)",
                  borderRadius: 2, padding: "2px 7px", textShadow: roleLabelShadow(roleLabelColor(p.roleLabel)),
                }}>
                  <RoleIcon label={p.roleLabel} size={11} inline color={roleLabelColor(p.roleLabel)} />{p.roleLabel}
                </span>
              )}
              {p.undertakerNote && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#B48CD9", background: "rgba(123,94,167,0.16)",
                  borderRadius: 2, padding: "2px 7px" }}>
                  {p.undertakerNote}
                </span>
              )}
              {p.vampireNote && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#8E4C6B", background: "rgba(142,76,107,0.16)",
                  borderRadius: 2, padding: "2px 7px" }}>
                  {p.vampireNote}
                </span>
              )}
              {p.gemNote && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#C9A227", background: "rgba(201,162,39,0.16)",
                  borderRadius: 2, padding: "2px 7px" }}>
                  {p.gemNote}
                </span>
              )}
              {!p.roleLabel && p.guessLabel && (
                <span style={{ fontSize: 10, fontWeight: 700, color: theme.sub, background: "rgba(0,0,0,0.08)",
                  border: `1px dashed ${theme.panelBorder}`, borderRadius: 2, padding: "2px 7px" }}>
                  🔎 {p.guessLabel}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

function RosterTag({ color, bg, children, dashed, theme }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color, background: bg, borderRadius: 2, padding: "1px 6px", whiteSpace: "nowrap",
      border: dashed ? `1px dashed ${theme.panelBorder}` : "none" }}>{children}</span>
  );
}

/** PC 왼쪽 열·모바일 플레이어 탭용 - 한 줄에 한 명씩, 생존자 먼저 보여주는 세로 목록 */
function PlayerRosterList({ theme, players, teamCounts, onPlayerClick }) {
  const aliveCount = players.filter((p) => p.alive && !p.inJail).length;
  const sorted = [...players].sort((a, b) => Number(!a.alive || a.inJail) - Number(!b.alive || b.inJail));
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontFamily: "'Special Elite', monospace", letterSpacing: "0.2em", color: theme.accent, fontSize: 11 }}>SUSPECTS</span>
        <span style={{ fontSize: 12, color: theme.text, fontWeight: 700 }}>생존 {aliveCount}<span style={{ color: theme.sub, fontWeight: 400 }}> / {players.length}명</span></span>
      </div>
      {teamCounts && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4, marginBottom: 10 }}>
          {[["마피아팀", teamCounts.mafia.total, "#C4323A", `마피아 ${teamCounts.mafia.mafia} · 특수 ${teamCounts.mafia.special}`],
            ["시민팀", teamCounts.citizen.total, "#6E9FD8", `경찰 ${teamCounts.citizen.police} · 의사 ${teamCounts.citizen.doctor} · 특수 ${teamCounts.citizen.special} · 일반 ${teamCounts.citizen.general}`],
            ["중립", teamCounts.neutral.total, "#9C7BC9", "직업 1개"]].map(([label, n, color, detail]) => (
            <div key={label} title={detail} style={{ borderRadius: 2, padding: "5px 6px", background: "rgba(0,0,0,0.3)", borderTop: `2px solid ${color}`, textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: theme.text, lineHeight: 1.1 }}>{n}</div>
              <div style={{ fontSize: 10, color: theme.sub }}>{label}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {sorted.map((p) => {
          const clickable = !p.roleLabel && !p.isSelf && onPlayerClick;
          const eliminated = !p.alive || p.inJail;
          return (
            <div key={p.id} className={clickable ? "noir-roster-row" : undefined} onClick={clickable ? () => onPlayerClick(p.id) : undefined}
              title={clickable ? "눌러서 예상 직업 메모하기" : undefined}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 8px 5px 5px", borderRadius: 2,
                background: p.isSelf ? theme.accentSoft : eliminated ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.26)",
                borderLeft: `2px solid ${p.isMafia === true ? "#C4323A" : eliminated ? "rgba(120,120,120,0.3)" : theme.accent}`,
                filter: eliminated ? "grayscale(0.6)" : "none", cursor: clickable ? "pointer" : "default", minHeight: 32 }}>
              <PlayerAvatar theme={theme} player={p} size={22} />
              <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column" }}>
                {p.activeTitle && !eliminated && (
                  <TitleBadge title={p.activeTitle} style={{ fontSize: 8.5, color: titleColor(p.activeTitle, theme), fontWeight: 700, lineHeight: 1.2 }} />
                )}
                <span style={{ fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  color: p.isMafia === true ? "#E0474F" : !eliminated ? theme.text : theme.sub, fontWeight: p.isSelf || p.isMafia === true ? 700 : 500,
                  textDecoration: eliminated ? "line-through" : "none" }}>
                  {p.name}{p.isSelf && <span style={{ color: theme.sub, fontWeight: 400 }}> (나)</span>}
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3, justifyContent: "flex-end", maxWidth: "58%" }}>
                {p.isSheriff && <RosterTag theme={theme} color="#E8C468" bg="rgba(232,196,104,0.16)">⭐ 보안관</RosterTag>}
                {p.inJail && <RosterTag theme={theme} color={theme.sub} bg="rgba(120,120,120,0.2)">🔒 감옥</RosterTag>}
                {p.roleLabel && <RosterTag theme={theme} color={roleLabelColor(p.roleLabel)} bg="rgba(0,0,0,0.45)"><RoleIcon label={p.roleLabel} size={11} inline color={roleLabelColor(p.roleLabel)} />{p.roleLabel}</RosterTag>}
                {p.undertakerNote && <RosterTag theme={theme} color="#B48CD9" bg="rgba(123,94,167,0.16)">{p.undertakerNote}</RosterTag>}
                {p.vampireNote && <RosterTag theme={theme} color="#8E4C6B" bg="rgba(142,76,107,0.16)">{p.vampireNote}</RosterTag>}
                {p.gemNote && <RosterTag theme={theme} color="#C9A227" bg="rgba(201,162,39,0.16)">{p.gemNote}</RosterTag>}
                {!p.roleLabel && p.guessLabel && <RosterTag theme={theme} color={theme.sub} bg="transparent" dashed>🔎 <RoleIcon label={p.guessLabel} size={11} inline color={theme.sub} />{p.guessLabel}</RosterTag>}
              </div>
            </div>
          );
        })}
      </div>
      {onPlayerClick && <div style={{ fontSize: 10.5, color: theme.sub, marginTop: 8 }}>💡 이름을 누르면 나만 보는 예상 직업 메모를 남길 수 있어요.</div>}
    </div>
  );
}

/** PC 화면 하단 가로 띠용 - 플레이어를 타일로 촘촘히 깔아 빈 공간 없이 한눈에 보여준다 */
function PlayerRosterGrid({ theme, players, teamCounts, onPlayerClick }) {
  const aliveCount = players.filter((p) => p.alive && !p.inJail).length;
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
      <div style={{ flexShrink: 0, width: 132, display: "flex", flexDirection: "column", gap: 5, paddingRight: 12, borderRight: `1px solid ${theme.panelBorder}` }}>
        <span style={{ fontFamily: "'Special Elite', monospace", letterSpacing: "0.2em", color: theme.accent, fontSize: 10.5 }}>SUSPECTS</span>
        <span style={{ fontSize: 13, color: theme.text, fontWeight: 800 }}>생존 {aliveCount}<span style={{ color: theme.sub, fontWeight: 400 }}> / {players.length}명</span></span>
        {teamCounts && [["마피아팀", teamCounts.mafia.total, "#C4323A"], ["시민팀", teamCounts.citizen.total, "#6E9FD8"], ["중립", teamCounts.neutral.total, "#9C7BC9"]].map(([label, n, color]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: theme.sub, borderLeft: `2px solid ${color}`, paddingLeft: 6 }}>
            <span>{label}</span><b style={{ color: theme.text }}>{n}</b>
          </div>
        ))}
        {onPlayerClick && <span style={{ fontSize: 10, color: theme.sub, marginTop: "auto", lineHeight: 1.4 }}>💡 이름을 눌러 예상 직업 메모</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(124px, 1fr))", gridAutoRows: "86px", gap: 6, alignContent: "start" }}>
        {players.map((p) => {
          const clickable = !p.roleLabel && !p.isSelf && onPlayerClick;
          const eliminated = !p.alive || p.inJail;
          const tags = [
            p.isSheriff && <RosterTag key="s" theme={theme} color="#E8C468" bg="rgba(232,196,104,0.16)">⭐ 보안관</RosterTag>,
            p.inJail && <RosterTag key="j" theme={theme} color={theme.sub} bg="rgba(120,120,120,0.2)">🔒 감옥</RosterTag>,
            p.roleLabel && <RosterTag key="r" theme={theme} color={roleLabelColor(p.roleLabel)} bg="rgba(0,0,0,0.45)"><RoleIcon label={p.roleLabel} size={11} inline color={roleLabelColor(p.roleLabel)} />{p.roleLabel}</RosterTag>,
            p.undertakerNote && <RosterTag key="u" theme={theme} color="#B48CD9" bg="rgba(123,94,167,0.16)">{p.undertakerNote}</RosterTag>,
            p.vampireNote && <RosterTag key="v" theme={theme} color="#8E4C6B" bg="rgba(142,76,107,0.16)">{p.vampireNote}</RosterTag>,
            p.gemNote && <RosterTag key="g" theme={theme} color="#C9A227" bg="rgba(201,162,39,0.16)">{p.gemNote}</RosterTag>,
            !p.roleLabel && p.guessLabel && <RosterTag key="q" theme={theme} color={theme.sub} bg="transparent" dashed>🔎 <RoleIcon label={p.guessLabel} size={11} inline color={theme.sub} />{p.guessLabel}</RosterTag>,
          ].filter(Boolean);
          return (
            <div key={p.id} className={clickable ? "noir-roster-row" : undefined} onClick={clickable ? () => onPlayerClick(p.id) : undefined}
              title={clickable ? "눌러서 예상 직업 메모하기" : undefined}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: "6px 6px", borderRadius: 2, textAlign: "center", minWidth: 0,
                background: p.isSelf ? theme.accentSoft : eliminated ? "rgba(0,0,0,0.42)" : "rgba(0,0,0,0.28)",
                borderTop: `2px solid ${p.isMafia === true ? "#C4323A" : eliminated ? "rgba(120,120,120,0.3)" : theme.accent}`,
                filter: eliminated ? "grayscale(0.6)" : "none", cursor: clickable ? "pointer" : "default" }}>
              <PlayerAvatar theme={theme} player={p} size={38} />
              <div style={{ minWidth: 0, width: "100%" }}>
                <div style={{ fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  color: p.isMafia === true ? "#E0474F" : !eliminated ? theme.text : theme.sub, fontWeight: p.isSelf || p.isMafia === true ? 800 : 600,
                  textDecoration: eliminated ? "line-through" : "none" }}>
                  {p.name}{p.isSelf && <span style={{ color: theme.sub, fontWeight: 400 }}> (나)</span>}
                </div>
                {tags.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 3, justifyContent: "center" }}>{tags}</div>
                ) : p.activeTitle && !eliminated ? (
                  <TitleBadge title={p.activeTitle} style={{ fontSize: 9, color: titleColor(p.activeTitle, theme), fontWeight: 700 }} />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
