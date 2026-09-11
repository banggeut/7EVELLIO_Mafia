import React, { useState, useEffect, useRef } from "react";
import { playClick, isSoundEnabled, setSoundEnabled, getVolume, setVolume } from "../sound.js";

// 공개된 직업 라벨을 팀/분류에 따라 색으로 구분한다.
const MAFIA_LABELS = new Set(["마피아", "스파이", "해커", "마담", "유괴범", "테러리스트", "마녀", "사기꾼", "대부", "히트맨"]);
const CITIZEN_FORCED_LABELS = new Set(["경찰", "의사"]); // 필수직업
const CITIZEN_PLAIN_LABELS = new Set(["시민", "연인", "백수", "교사", "학생", "상담원", "피싱", "검시관", "교도관"]); // 일반 (특수직업 아님)
const NEUTRAL_LABELS = new Set(["악마 숭배자", "뱀파이어", "괴도", "늑대인간", "고양이", "용병"]);
// 그 외 시민팀 직업(기자·영매·건달·신혼부부·정치인·탐정·장의사·판사·군인·공무원·성직자 등)은 전부 "특수직업"으로 취급한다.

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
  "🕵️ 명탐정 라삐": "#4A6FA5", // 진중한 감청색
  "🥀 뱀파이어 사냥꾼": "#9B7EA8", // 은은한 라일락(사냥꾼의 결기)
  "🕴️ 뒤를 부탁한다": "#7D8FA6", // 헌신적인 강철빛 블루
  "🍎 최고의 스승": "#D9A441", // 사과빛 금색
  "🎓 최고의 제자": "#E0B84A", // 학사모의 반짝이는 금색
  "😈 세계를 멸망시켜봤습니다": "#7B5EA7", // 악마 숭배자 - 짙은 보라
  "🧛 뱀파이어 로드": "#8E4C6B", // 뱀파이어 - 진한 마젠타
  "💎 잘 먹고 갑니다": "#C9A227", // 괴도 - 보석빛 금색
  "🐺 ALPHA": "#8C96DC", // 늑대인간 - 은빛 청보라
  "🐱 탐정이다냥": "#E8B25A", // 고양이 - 노란빛 탐정
  "🐾 냥냥펀치": "#D3695F", // 고양이 마피아 - 발랄한 빨강
  "🐈 길냥이": "#9A9A9A", // 소속 없는 회색
  "👑 최종보스": "#A8323F", // 대부 - 짙은 진홍
  "💣 혼자는 안가요": "#D97B3E", // 폭발의 주황
  "💻 천재 해커": "#4FBF9F", // 해커 - 시원한 청록
  "🌱 선량한 시민": "#8FBF6A", // 새싹빛 연두
  "🔫 명예 마피아": "#B84C5C", // 마피아 - 짙은 붉은빛
  "🛋️ 왜 이겼지?": "#9A9A9A", // 백수 - 애매한 회색
};
export function titleColor(title, theme) {
  return TITLE_COLORS[title] || theme.accent;
}

// 칭호별 전용 애니메이션 - 컨셉에 어울리는 연출이 있는 칭호만 여기에 클래스명을 매핑한다.
// 새 애니메이션을 추가하려면: 1) 아래 TITLE_ANIMATION_CSS에 @keyframes와 클래스를 추가하고
// 2) TITLE_ANIMATIONS에 "칭호 텍스트": "클래스명"을 추가하면 된다.
const TITLE_ANIMATIONS = {
  "🌾 명예시민": "title-anim-shimmer-gold", // 명예의 광채가 반짝임
  "💉 명의": "title-anim-heartbeat", // 심장 박동처럼 두근 (맥박 점: 오른쪽)
  "🔍 엘리트 수사관": "title-anim-siren", // 경광등처럼 파랑↔빨강
  "📰 정론직필": "title-anim-flash", // 카메라 플래시 터짐
  "🛡️ 탱커": "title-anim-shield", // 방패로 막아내는 묵직한 펄스
  "🗡️ 여긴 내 구역이야": "title-anim-blade", // 왼쪽에서 오른쪽으로 갈라지며 텍스트가 분해됐다 재조립
  "💍 너를 위해서": "title-anim-heartache", // 애틋하게 두근거리다 옅어짐 (더 아래·더 크게)
  "🕵️ 명탐정 라삐": "title-anim-spotlight", // 탐정의 조명이 스치듯
  "🥀 뱀파이어 사냥꾼": "title-anim-wilt", // 꽃잎이 텍스트 전체에 걸쳐 떨어짐
  "🕴️ 뒤를 부탁한다": "title-anim-windscatter", // 바람에 흩날려 사라졌다 돌아옴
  "🍎 최고의 스승": "title-anim-warmglow", // 따뜻한 사과빛 은은한 발광 + 분필 밑줄
  "🎓 최고의 제자": "title-anim-warmglow", // 최고의 스승과 동일 연출
  "😈 세계를 멸망시켜봤습니다": "title-anim-ominous", // 불길하게 커지는 그림자
  "🧛 뱀파이어 로드": "title-anim-bloodbg", // 텍스트 배경에 핏물이 흐름
  "💎 잘 먹고 갑니다": "title-anim-gemshine", // 보석이 여러 곳에서 번쩍이는 섬광
  "🐺 ALPHA": "title-anim-moonglow", // 달빛을 받아 커지는 발광
  "🐱 탐정이다냥": "title-anim-catbounce", // 고양이처럼 통통 튀는 움직임
  "🐾 냥냥펀치": "title-anim-punch", // 펀치를 날리는 듯한 충격 흔들림
  "🐈 길냥이": "title-anim-catwalk", // 고양이가 텍스트를 가로질러 걸어다님
  "👑 최종보스": "title-anim-bossaura", // 화려하지만 정제된 왕좌의 오라
  "💣 혼자는 안가요": "title-anim-bombtick", // 폭탄 타이머처럼 깜빡이다 터짐
  "💻 천재 해커": "title-anim-glitch",
  "🔫 명예 마피아": "title-anim-bullethole", // 총알에 맞아 흔들리며 총구멍이 생김
  "🛋️ 왜 이겼지?": "title-anim-confused", // 물음표가 더 아래에서 여러 개 떠오름
};
export function titleAnimationClass(title) {
  return TITLE_ANIMATIONS[title] || "";
}
// 실제 사용하는 애니메이션 클래스가 있는 페이지에서 한 번만 렌더하면 되는 <style> 태그 내용.
export const TITLE_ANIMATION_CSS = `
  /* 💻 천재 해커: RGB 색분리 글리치 노이즈 */
  @keyframes titleGlitchHacker {
    0%, 88%, 100% { text-shadow: 0 1px 3px rgba(79,191,159,0.55); transform: translate(0,0); color: #4FBF9F; }
    89% { text-shadow: -2px 0 #ff2fd0, 2px 0 #00e5ff; transform: translate(-1px,0); color: #00e5ff; }
    90% { text-shadow: 2px 0 #ff2fd0, -2px 0 #4FBF9F; transform: translate(1px,0); color: #ff2fd0; }
    91% { text-shadow: -1px 0 #00e5ff, 1px 0 #ff2fd0; transform: translate(0,1px); color: #4FBF9F; }
    92% { text-shadow: 1px 0 #ff2fd0, -1px 0 #00e5ff; transform: translate(-1px,-1px); color: #00e5ff; }
    93%, 100% { text-shadow: 0 1px 3px rgba(79,191,159,0.55); transform: translate(0,0); color: #4FBF9F; }
  }
  .title-anim-glitch { animation: titleGlitchHacker 3s steps(1, end) infinite; display: inline-block; position: relative; }

  /* 🌾 명예시민: 반짝이는 별빛이 옆에서 솟아올랐다 사라짐 */
  .title-anim-shimmer-gold { position: relative; display: inline-block; }
  .title-anim-shimmer-gold::after {
    content: "✦"; position: absolute; top: -7px; right: -9px; font-size: 8px; color: #FFE9A8;
    text-shadow: 0 0 4px #FFE9A8; animation: titleSparkleBurst 2.4s ease-in-out infinite;
  }
  @keyframes titleSparkleBurst {
    0%, 65%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
    78% { opacity: 1; transform: scale(1.3) rotate(90deg); }
    92% { opacity: 0.6; transform: scale(0.8) rotate(180deg); }
  }

  /* 💉 명의: 심전도 모니터처럼 오른쪽에서 맥박 점이 깜빡임 */
  .title-anim-heartbeat { position: relative; display: inline-block; animation: titleHeartbeat 1.8s ease-in-out infinite; }
  .title-anim-heartbeat::before {
    content: ""; position: absolute; right: -9px; top: 50%; width: 5px; height: 5px; margin-top: -2.5px;
    border-radius: 50%; background: #5FA8D3; box-shadow: 0 0 5px #5FA8D3;
    animation: titleHeartBlip 1.8s ease-in-out infinite;
  }
  @keyframes titleHeartbeat { 0%,100% { transform: scale(1); } 15% { transform: scale(1.15); } 30% { transform: scale(1); } 45% { transform: scale(1.1); } 60% { transform: scale(1); } }
  @keyframes titleHeartBlip { 0%,100% { transform: scale(0.5); opacity: 0.3; } 15% { transform: scale(1.8); opacity: 1; } 30% { transform: scale(0.5); opacity: 0.3; } }

  /* 🔍 엘리트 수사관: 경광등처럼 파랑/빨강 빛이 번갈아 번쩍 */
  .title-anim-siren { display: inline-block; animation: titleSirenLight 1s steps(1,end) infinite; }
  @keyframes titleSirenLight {
    0%,49% { color: #5B9BF0; text-shadow: 0 0 6px #5B9BF0, 0 0 12px rgba(91,155,240,0.6); }
    50%,100% { color: #E05F5F; text-shadow: 0 0 6px #E05F5F, 0 0 12px rgba(224,95,95,0.6); }
  }

  /* 📰 정론직필: 카메라 플래시가 전체를 순간적으로 뒤덮음 */
  .title-anim-flash { position: relative; display: inline-block; }
  .title-anim-flash::after {
    content: ""; position: absolute; inset: -3px -6px; background: #fff; opacity: 0; border-radius: 4px;
    animation: titleFlashBulb 3s ease-in-out infinite; pointer-events: none;
  }
  @keyframes titleFlashBulb { 0%,90%,100% { opacity: 0; } 92% { opacity: 0.95; } 95% { opacity: 0; } }

  /* 🛡️ 탱커: 충격을 막아내는 방패 충격파가 테두리로 퍼짐 */
  .title-anim-shield { position: relative; display: inline-block; }
  .title-anim-shield::before {
    content: ""; position: absolute; inset: -4px; border: 2px solid #8C96A6; border-radius: 8px; opacity: 0;
    animation: titleShieldWave 2.4s ease-out infinite;
  }
  @keyframes titleShieldWave { 0% { transform: scale(0.85); opacity: 0.9; } 60% { transform: scale(1.3); opacity: 0; } 100% { opacity: 0; } }

  /* 🗡️ 여긴 내 구역이야: 가로로 누운 칼선이 위에서 아래로 베어 내려가며, 글자가 분해되듯 일그러졌다가 다시 원래대로 */
  .title-anim-blade { position: relative; display: inline-block; animation: titleBladeDisassemble 3.2s ease-in-out infinite; }
  .title-anim-blade::after {
    content: ""; position: absolute; left: -8%; top: -60%; width: 216%; height: 2px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent);
    animation: titleBladeLine 3.2s ease-in-out infinite;
  }
  @keyframes titleBladeDisassemble {
    0%,12% { transform: skewX(0deg) translateX(0); filter: blur(0); letter-spacing: normal; }
    30% { transform: skewX(10deg) translateX(2px); filter: blur(1px); letter-spacing: 2px; }
    45% { transform: skewX(-8deg) translateX(-2px); filter: blur(1.4px); letter-spacing: 3px; }
    60% { transform: skewX(6deg) translateX(1px); filter: blur(0.8px); letter-spacing: 1px; }
    75%,100% { transform: skewX(0deg) translateX(0); filter: blur(0); letter-spacing: normal; }
  }
  @keyframes titleBladeLine {
    0%,12% { top: -60%; opacity: 0; }
    16% { opacity: 1; }
    70% { top: 160%; opacity: 1; }
    75%,100% { top: 160%; opacity: 0; }
  }

  /* 💍 너를 위해서: 텍스트 아래쪽에서 하트가 떠올랐다 흐려지며 사라짐 */
  .title-anim-heartache { position: relative; display: inline-block; }
  .title-anim-heartache::after {
    content: "♥"; position: absolute; bottom: 0px; right: -12px; font-size: 12px; color: #E0879B;
    animation: titleHeartFloat 2.6s ease-in infinite;
  }
  @keyframes titleHeartFloat {
    0% { opacity: 0; transform: translateY(0) scale(0.6); }
    20% { opacity: 1; transform: translateY(-3px) scale(1); }
    70% { opacity: 0.4; transform: translateY(-11px) scale(0.9); }
    100% { opacity: 0; transform: translateY(-15px) scale(0.7); }
  }

  /* 🕵️ 명탐정 라삐: 탐정의 조명이 좌에서 우로 훑고 지나감 */
  .title-anim-spotlight { position: relative; display: inline-block; overflow: hidden; }
  .title-anim-spotlight::after {
    content: ""; position: absolute; top: -30%; left: -20%; width: 26%; height: 160%;
    background: radial-gradient(circle, rgba(255,255,255,0.85), transparent 70%);
    animation: titleSpotSweep 3.4s ease-in-out infinite;
  }
  @keyframes titleSpotSweep {
    0% { left: -20%; opacity: 0; }
    12% { opacity: 1; }
    55% { left: 95%; opacity: 1; }
    65%,100% { left: 95%; opacity: 0; }
  }

  /* 🥀 뱀파이어 사냥꾼: 시든 꽃잎 두 송이가 텍스트 여러 지점에서 엇갈려 떨어짐 */
  .title-anim-wilt { position: relative; display: inline-block; }
  .title-anim-wilt::before, .title-anim-wilt::after {
    content: "❀"; position: absolute; top: -4px; font-size: 7px; color: #9B7EA8; opacity: 0;
  }
  .title-anim-wilt::before { left: 12%; animation: titlePetalFall 3.5s ease-in infinite; }
  .title-anim-wilt::after { left: 62%; animation: titlePetalFall 3.5s ease-in infinite 1.6s; }
  @keyframes titlePetalFall {
    0% { opacity: 0; transform: translate(0,-2px) rotate(0deg); }
    15% { opacity: 1; }
    80% { opacity: 0.3; transform: translate(6px,10px) rotate(200deg); }
    100% { opacity: 0; transform: translate(6px,14px) rotate(240deg); }
  }

  /* 🕴️ 뒤를 부탁한다: 바람에 흩날려 옅어졌다가 다시 원래 모습으로 돌아옴 */
  .title-anim-windscatter { position: relative; display: inline-block; animation: titleWindScatter 3.5s ease-in-out infinite; }
  @keyframes titleWindScatter {
    0%,20% { opacity: 1; filter: blur(0); transform: translateX(0); letter-spacing: normal; }
    50% { opacity: 0.25; filter: blur(2px); transform: translateX(10px); letter-spacing: 6px; }
    75% { opacity: 0.65; filter: blur(1px); transform: translateX(4px); letter-spacing: 2px; }
    100% { opacity: 1; filter: blur(0); transform: translateX(0); letter-spacing: normal; }
  }

  /* 🍎 최고의 스승 / 🎓 최고의 제자: 밑줄이 분필로 쓰듯 그어졌다 지워짐 (같은 연출 공유) */
  .title-anim-warmglow { position: relative; display: inline-block; }
  .title-anim-warmglow::after {
    content: ""; position: absolute; left: 0; bottom: -3px; height: 2px; width: 0; background: #D9A441; border-radius: 2px;
    animation: titleChalkUnderline 2.6s ease-in-out infinite;
  }
  @keyframes titleChalkUnderline { 0% { width: 0; opacity: 0.9; } 55% { width: 100%; opacity: 1; } 80%,100% { width: 100%; opacity: 0; } }

  /* 😈 세계를 멸망시켜봤습니다: 불길한 그림자 기운이 겹겹이 번짐 */
  .title-anim-ominous { display: inline-block; animation: titleOminousAura 3s ease-in-out infinite; }
  @keyframes titleOminousAura {
    0%,100% { text-shadow: 0 0 4px rgba(123,94,167,0.5); }
    50% { text-shadow: 0 0 10px rgba(123,94,167,0.9), 0 0 22px rgba(60,20,80,0.7), 0 0 36px rgba(123,94,167,0.35); }
  }

  /* 🧛 뱀파이어 로드: 텍스트 배경 전체에 핏물이 흐르듯 움직임 */
  .title-anim-bloodbg {
    position: relative; display: inline-block; padding: 1px 4px; border-radius: 3px;
    background-image: linear-gradient(120deg, rgba(142,76,107,0.1), rgba(184,50,79,0.65), rgba(142,76,107,0.1));
    background-size: 250% 250%;
    animation: titleBloodFlow 3s ease-in-out infinite;
  }
  @keyframes titleBloodFlow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

  /* 💎 잘 먹고 갑니다: 양쪽 모서리에서 보석 십자 섬광이 엇갈려 반짝 터짐 */
  .title-anim-gemshine { position: relative; display: inline-block; }
  .title-anim-gemshine::before, .title-anim-gemshine::after {
    content: "✛"; position: absolute; color: #fff; text-shadow: 0 0 6px #C9A227; opacity: 0;
  }
  .title-anim-gemshine::before { top: -7px; right: -7px; font-size: 9px; animation: titleGemFlare 2.2s ease-in-out infinite; }
  .title-anim-gemshine::after { bottom: -6px; left: -7px; font-size: 7px; animation: titleGemFlare 2.2s ease-in-out infinite 1.1s; }
  @keyframes titleGemFlare {
    0%,78%,100% { opacity: 0; transform: scale(0.3) rotate(0deg); }
    88% { opacity: 1; transform: scale(1.5) rotate(90deg); }
    94% { opacity: 0; transform: scale(0.5) rotate(120deg); }
  }

  /* 🐺 ALPHA: 달빛 발광 위로 발톱자국이 순간 스쳐감 */
  .title-anim-moonglow { position: relative; display: inline-block; animation: titleMoonGlow 2.8s ease-in-out infinite; }
  .title-anim-moonglow::after {
    content: ""; position: absolute; inset: -4px; opacity: 0;
    background: repeating-linear-gradient(70deg, transparent 0 3px, rgba(220,220,255,0.85) 3px 4px, transparent 4px 9px);
    animation: titleClawFlash 3s ease-in-out infinite;
  }
  @keyframes titleMoonGlow { 0%,100% { text-shadow: 0 0 4px rgba(140,150,220,0.5); transform: scale(1); } 50% { text-shadow: 0 0 16px rgba(140,150,220,1); transform: scale(1.06); } }
  @keyframes titleClawFlash { 0%,70%,100% { opacity: 0; } 75% { opacity: 0.85; } 79% { opacity: 0; } }

  /* 🐱 탐정이다냥: 발랄하게 통통 튀며 발자국이 톡 찍힘 */
  .title-anim-catbounce { position: relative; display: inline-block; animation: titleCatBounce 1.4s ease-in-out infinite; }
  .title-anim-catbounce::after {
    content: "🐾"; position: absolute; top: -9px; right: -11px; font-size: 7px; opacity: 0;
    animation: titlePawPop 1.4s ease-in-out infinite;
  }
  @keyframes titleCatBounce { 0%,100% { transform: translateY(0) rotate(0deg); } 25% { transform: translateY(-2px) rotate(-3deg); } 75% { transform: translateY(-2px) rotate(3deg); } }
  @keyframes titlePawPop { 0%,50%,100% { opacity: 0; transform: scale(0.5); } 62% { opacity: 1; transform: scale(1); } }

  /* 🐾 냥냥펀치: 주먹을 날리는 순간 임팩트 이펙트가 터짐 */
  .title-anim-punch { position: relative; display: inline-block; animation: titlePunch 2.5s ease-in-out infinite; }
  .title-anim-punch::after {
    content: "💥"; position: absolute; top: 50%; left: 50%; font-size: 12px; opacity: 0;
    transform: translate(-50%,-50%) scale(0); animation: titlePunchImpact 2.5s ease-in-out infinite;
  }
  @keyframes titlePunch { 0%,80%,100% { transform: scale(1) rotate(0deg); } 82% { transform: scale(1.2) rotate(-8deg); } 84% { transform: scale(0.95) rotate(5deg); } 86% { transform: scale(1.05) rotate(-3deg); } 88% { transform: scale(1) rotate(0deg); } }
  @keyframes titlePunchImpact {
    0%,80%,100% { opacity: 0; transform: translate(-50%,-50%) scale(0); }
    83% { opacity: 1; transform: translate(-50%,-50%) scale(1.6); }
    88% { opacity: 0; transform: translate(-50%,-50%) scale(2); }
  }

  /* 🐈 길냥이: 텍스트에 있던 고양이 이모지 자체가 좌↔우 끝까지 걸어다님 (이동 방향으로 머리가 향함).
     이 클래스는 TitleBadge 컴포넌트가 이모지 부분만 따로 감싸 렌더링한 실제 요소에 적용된다(가상요소 아님). */
  .title-catwalk-emoji {
    position: absolute; top: 50%; left: 0%; transform: translateY(-50%) scaleX(-1);
    animation: titleCatWalk 4.5s linear infinite;
  }
  @keyframes titleCatWalk {
    0% { left: 0%; transform: translateY(-50%) scaleX(-1); }
    48% { left: 100%; transform: translateY(-50%) scaleX(-1); }
    50% { left: 100%; transform: translateY(-50%) scaleX(1); }
    98% { left: 0%; transform: translateY(-50%) scaleX(1); }
    100% { left: 0%; transform: translateY(-50%) scaleX(-1); }
  }

  /* 👑 최종보스: 화려하되 텍스트 주변에만 머무는 절제된 왕좌의 오라 + 금빛 별 반짝임 */
  .title-anim-bossaura { position: relative; display: inline-block; animation: titleBossAura 2.4s ease-in-out infinite; }
  .title-anim-bossaura::before, .title-anim-bossaura::after {
    content: "✦"; position: absolute; font-size: 7px; color: #FFD766; opacity: 0;
  }
  .title-anim-bossaura::before { top: -8px; left: -9px; animation: titleBossSparkle 2.4s ease-in-out infinite; }
  .title-anim-bossaura::after { bottom: -8px; right: -9px; animation: titleBossSparkle 2.4s ease-in-out infinite 1.2s; }
  @keyframes titleBossAura {
    0%,100% { text-shadow: 0 0 4px rgba(168,50,63,0.5); }
    50% { text-shadow: 0 1px 2px rgba(0,0,0,0.35), 0 0 9px rgba(255,215,0,0.85), 0 0 16px rgba(168,50,63,0.75); }
  }
  @keyframes titleBossSparkle { 0%,60%,100% { opacity: 0; transform: scale(0) rotate(0deg); } 80% { opacity: 1; transform: scale(1.3) rotate(180deg); } }

  /* 💣 혼자는 안가요: 깜빡이다 결국 펑 터지는 폭발 플래시 */
  .title-anim-bombtick { position: relative; display: inline-block; animation: titleBombTick 3s steps(1,end) infinite; }
  .title-anim-bombtick::after {
    content: ""; position: absolute; inset: -7px; border-radius: 50%; opacity: 0;
    background: radial-gradient(circle, rgba(255,220,150,0.95), rgba(217,123,62,0.5) 50%, transparent 75%);
    animation: titleBombBoom 3s steps(1,end) infinite;
  }
  @keyframes titleBombTick {
    0%,10% { opacity: 1; } 10.1% { opacity: 0.4; } 20% { opacity: 1; }
    30%,38% { opacity: 1; } 38.1% { opacity: 0.4; } 45% { opacity: 1; }
    50%,55% { opacity: 1; } 55.1% { opacity: 0.3; } 60% { opacity: 1; }
    65% { filter: brightness(3); } 66%,100% { filter: brightness(1); opacity: 1; }
  }
  @keyframes titleBombBoom {
    0%,64%,100% { opacity: 0; transform: scale(0.3); }
    65% { opacity: 1; transform: scale(1.9); }
    69% { opacity: 0; transform: scale(2.3); }
  }

  /* 🔫 명예 마피아: 총격을 맞은 듯 흔들리며 총구멍이 잠깐 나타남 */
  .title-anim-bullethole { position: relative; display: inline-block; animation: titleBulletShake 3s ease-in-out infinite; }
  .title-anim-bullethole::after {
    content: ""; position: absolute; top: 50%; left: 50%; width: 5px; height: 5px; border-radius: 50%;
    background: radial-gradient(circle, #000 40%, rgba(0,0,0,0.4) 70%, transparent 100%);
    transform: translate(-50%,-50%) scale(0); opacity: 0;
    animation: titleBulletHole 3s ease-in-out infinite;
  }
  @keyframes titleBulletShake {
    0%,88%,100% { transform: translate(0,0); }
    89% { transform: translate(-2px,1px); }
    90% { transform: translate(2px,-1px); }
    91% { transform: translate(-1px,0); }
    92%,100% { transform: translate(0,0); }
  }
  @keyframes titleBulletHole {
    0%,87%,100% { opacity: 0; transform: translate(-50%,-50%) scale(0); }
    89% { opacity: 1; transform: translate(-50%,-50%) scale(1.4); }
    93% { opacity: 1; transform: translate(-50%,-50%) scale(1); }
    98%,100% { opacity: 0; transform: translate(-50%,-50%) scale(1); }
  }

  /* 🛋️ 왜 이겼지?: 텍스트 아래쪽에서 물음표 두 개가 엇갈려 톡톡 떠올랐다 사라짐 */
  .title-anim-confused { position: relative; display: inline-block; animation: titleConfused 1.8s ease-in-out infinite; }
  .title-anim-confused::before, .title-anim-confused::after {
    content: "?"; position: absolute; top: 0px; font-weight: 900; color: #9A9A9A; opacity: 0;
  }
  .title-anim-confused::before { left: -9px; font-size: 8px; animation: titleQuestionPop 1.8s ease-in-out infinite; }
  .title-anim-confused::after { right: -9px; font-size: 10px; animation: titleQuestionPop 1.8s ease-in-out infinite 0.5s; }
  @keyframes titleConfused { 0%,100% { transform: rotate(0deg); } 25% { transform: rotate(-4deg); } 75% { transform: rotate(4deg); } }
  @keyframes titleQuestionPop {
    0%,40%,100% { opacity: 0; transform: translateY(2px) scale(0.5); }
    55% { opacity: 1; transform: translateY(5px) scale(1.2); }
    75% { opacity: 0; transform: translateY(9px) scale(0.9); }
  }
`;

// 칭호 배지를 렌더링하는 공용 컴포넌트. 대부분의 칭호는 그냥 "<칭호>" 텍스트에 애니메이션 클래스만
// 붙이면 되지만, "길냥이"처럼 텍스트 안의 이모지 자체가 움직여야 하는 경우는 이모지를 별도로 분리해서
// 렌더링해야 한다(원본 이모지는 레이아웃 자리만 차지하도록 숨기고, 움직이는 사본 하나만 보여준다 -
// 이렇게 해야 "새 이모지가 추가로 생긴 것"처럼 보이지 않고 "원래 있던 이모지가 움직이는" 것처럼 보인다).
export function TitleBadge({ title, style, as: Tag = "span" }) {
  const animClass = titleAnimationClass(title);
  if (animClass === "title-anim-catwalk") {
    const spaceIdx = title.indexOf(" ");
    const emoji = spaceIdx > 0 ? title.slice(0, spaceIdx) : title;
    const rest = spaceIdx > 0 ? title.slice(spaceIdx) : "";
    return (
      <Tag style={{ ...style, position: "relative", display: "inline-block" }}>
        &lt;<span style={{ visibility: "hidden" }}>{emoji}</span>
        <span className="title-catwalk-emoji">{emoji}</span>
        {rest}&gt;
      </Tag>
    );
  }
  return <Tag className={animClass} style={style}>&lt;{title}&gt;</Tag>;
}

export function Card({ theme, children, style }) {
  return (
    <div style={{ background: theme.panel, border: `1px solid ${theme.panelBorder}`, borderRadius: 18,
      padding: "20px 22px", backdropFilter: "blur(6px)", boxShadow: "0 12px 30px rgba(0,0,0,0.18)", ...style }}>
      {children}
    </div>
  );
}

export function Button({ theme, children, onClick, disabled, variant = "solid", style }) {
  const base = { fontSize: 14.5, fontWeight: 600, padding: "10px 18px", borderRadius: 999,
    cursor: disabled ? "not-allowed" : "pointer", border: `1px solid ${theme.accent}`,
    opacity: disabled ? 0.4 : 1, transition: "transform 0.12s ease, opacity 0.2s ease" };
  const variants = {
    solid: { background: theme.accent, color: "#1a1508" },
    ghost: { background: "transparent", color: theme.text },
    subtle: { background: theme.accentSoft, color: theme.text },
  };
  const handleClick = (e) => {
    if (disabled) return;
    playClick();
    onClick && onClick(e);
  };
  return (
    <button onClick={handleClick} disabled={disabled}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = "scale(0.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

export function Chip({ theme, label, selected, onClick, dim }) {
  const handleClick = onClick ? (e) => { playClick(); onClick(e); } : undefined;
  return (
    <button onClick={handleClick} style={{ padding: "7px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600,
      border: `1px solid ${selected ? theme.accent : theme.panelBorder}`, background: selected ? theme.accentSoft : "transparent",
      color: theme.text, cursor: onClick ? "pointer" : "default", opacity: dim ? 0.4 : 1 }}>
      {label}
    </button>
  );
}

export function PhaseHeader({ theme, label, phase }) {
  const icon = phase === "night" ? "🌙" : phase === "gameover" ? "🏁" : "☀️";
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <h2 style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 700, fontSize: 22, color: theme.text, margin: 0 }}>{label}</h2>
    </div>
  );
}

export function RedactedNotice({ theme, text }) {
  return (
    <div style={{ border: `1.5px dashed ${theme.panelBorder}`, borderRadius: 14, padding: "26px 18px",
      textAlign: "center", color: theme.sub, fontSize: 13.5, lineHeight: 1.6 }}>
      🔒 {text}
    </div>
  );
}

export function PrivateNote({ theme, children }) {
  return (
    <div style={{ border: `1px solid ${theme.accent}55`, background: theme.accentSoft, borderRadius: 12,
      padding: "10px 14px", fontSize: 12.5, color: theme.text, marginBottom: 10, lineHeight: 1.5 }}>
      {children}
    </div>
  );
}

export function TimerDisplay({ theme, seconds }) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return <div style={{ fontFamily: "monospace", fontSize: 40, fontWeight: 700, color: theme.accent, textAlign: "center" }}>{mm}:{ss}</div>;
}

export function AutoNote({ theme, text = "시간이 지나면 자동으로 다음 단계로 진행됩니다." }) {
  return <div style={{ marginTop: 16, fontSize: 12, color: theme.sub, textAlign: "center" }}>⏱️ {text}</div>;
}

function ChatMessageRow({ theme, m, players }) {
  const sender = players?.find((p) => p.id === m.senderId);
  const nameColor = sender?.roleLabel ? roleLabelColor(sender.roleLabel) : theme.text;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {sender ? (
        <PlayerAvatar theme={theme} player={sender} size={19} />
      ) : (
        <div style={{ width: 19, height: 19, borderRadius: "50%", background: theme.accentSoft, flexShrink: 0 }} />
      )}
      <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 0 }}>
        {sender?.activeTitle && (
          <TitleBadge title={sender.activeTitle} style={{ fontSize: 8.5, color: titleColor(sender.activeTitle, theme), fontWeight: 700, lineHeight: 1.3 }} />
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

export function ChatPanel({ theme, title, messages, onSend, participants, players }) {
  const [text, setText] = useState("");
  const { containerRef, endRef, handleScroll } = useAutoScrollToEnd([messages.length]);
  const submit = () => { if (text.trim()) { onSend(text.trim()); setText(""); } };
  return (
    <div style={{ marginTop: 14, border: `1px solid ${theme.panelBorder}`, borderRadius: 12, padding: 12 }}>
      <style>{TITLE_ANIMATION_CSS}</style>
      <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: participants?.length ? 2 : 8, color: theme.text }}>{title}</div>
      {participants?.length > 0 && (
        <div style={{ fontSize: 11, color: theme.sub, marginBottom: 8 }}>참여: {participants.join(", ")}</div>
      )}
      <div ref={containerRef} onScroll={handleScroll} style={{ height: 130, overflowY: "auto", display: "flex", flexDirection: "column", gap: 5, marginBottom: 8 }}>
        {messages.length === 0 && <div style={{ fontSize: 12, color: theme.sub }}>아직 메시지가 없습니다.</div>}
        {messages.map((m, i) => (
          <ChatMessageRow key={i} theme={theme} m={m} players={players} />
        ))}
        <div ref={endRef} />
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="메시지 입력..."
          onKeyDown={(e) => e.key === "Enter" && submit()}
          style={{ flex: 1, padding: "7px 10px", borderRadius: 8, border: `1px solid ${theme.panelBorder}`,
            background: "rgba(255,255,255,0.04)", color: theme.text, fontSize: 12.5, outline: "none" }} />
        <Button theme={theme} onClick={submit} style={{ padding: "7px 14px", fontSize: 12.5 }}>전송</Button>
      </div>
    </div>
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
      <button onClick={() => setOpen((o) => !o)} title="설정"
        style={{ width: 36, height: 36, borderRadius: "50%", border: `1px solid ${theme.panelBorder}`,
          background: theme.panel, color: theme.text, fontSize: 16, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
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
              if (next) playClick();
            }} />
          </label>
          <div style={{ fontSize: 11.5, color: theme.sub, marginBottom: 6 }}>볼륨 {volume}</div>
          <input type="range" min={0} max={100} value={volume} disabled={!on}
            onChange={(e) => { const v = Number(e.target.value); setVolumeState(v); setVolume(v); }}
            onMouseUp={() => on && playClick()}
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
        style={{ borderRadius: "50%", objectFit: "cover", opacity: player.alive ? 1 : 0.4, flexShrink: 0 }} />
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: player.alive ? theme.accentSoft : "rgba(120,120,120,0.25)",
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
      border: `1px solid ${theme.text}33`, borderRadius: 4, padding: "16px 18px", marginBottom: 12,
      background: "rgba(120,120,120,0.06)", boxShadow: "0 3px 10px rgba(0,0,0,0.12)",
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
export function LiveChatFeed({ theme, title, messages, players, emptyText = "아직 채팅이 없습니다. 치지직 채팅창에 메시지를 남겨주세요!" }) {
  const { containerRef, endRef, handleScroll } = useAutoScrollToEnd([messages.length]);
  return (
    <div style={{ border: `1px solid ${theme.panelBorder}`, borderRadius: 12, padding: 12, marginBottom: 14 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8, color: theme.text, display: "flex", alignItems: "center", gap: 6 }}>
        💬 {title}
      </div>
      <div ref={containerRef} onScroll={handleScroll} style={{ height: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
        {messages.length === 0 && <div style={{ fontSize: 12, color: theme.sub }}>{emptyText}</div>}
        {messages.map((m, i) => (
          <ChatMessageRow key={i} theme={theme} m={m} players={players} />
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

/** 참여자 명단을 하단에 늘 보여주는 로스터 - 생존/사망을 구분해 표시 */
export function PlayerRoster({ theme, players, teamCounts, onPlayerClick }) {
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ fontSize: 11.5, color: theme.sub, marginBottom: 8 }}>
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
                borderRadius: 999, background: eliminated ? "rgba(120,120,120,0.16)" : theme.accentSoft,
                cursor: clickable ? "pointer" : "default" }}>
              <PlayerAvatar theme={theme} player={p} size={20} />
              {p.isSheriff && (
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#E8C468", background: "rgba(232,196,104,0.16)",
                  borderRadius: 999, padding: "2px 7px" }}>
                  ⭐ 보안관
                </span>
              )}
              <span style={{
                fontSize: 12,
                // 처형 시 "마피아였습니다"로 공개된 경우 - 정확한 직업명은 아니고 마피아 여부만 붉은색으로 표시
                color: p.isMafia === true ? "#D9534F" : !eliminated ? theme.text : theme.sub,
                fontWeight: p.isMafia === true ? 700 : 400,
                textDecoration: eliminated ? "line-through" : "none",
              }}>
                {p.name}
              </span>
              {p.inJail && (
                <span style={{ fontSize: 10.5, fontWeight: 700, color: theme.sub, background: "rgba(120,120,120,0.2)",
                  borderRadius: 999, padding: "2px 7px" }}>
                  🔒 감옥
                </span>
              )}
              {p.roleLabel && (
                <span style={{
                  fontSize: 10.5, fontWeight: 700, color: roleLabelColor(p.roleLabel), background: "rgba(0,0,0,0.12)",
                  borderRadius: 999, padding: "2px 7px", textShadow: roleLabelShadow(roleLabelColor(p.roleLabel)),
                }}>
                  {p.roleLabel}
                </span>
              )}
              {p.undertakerNote && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#B48CD9", background: "rgba(123,94,167,0.16)",
                  borderRadius: 999, padding: "2px 7px" }}>
                  {p.undertakerNote}
                </span>
              )}
              {p.vampireNote && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#8E4C6B", background: "rgba(142,76,107,0.16)",
                  borderRadius: 999, padding: "2px 7px" }}>
                  {p.vampireNote}
                </span>
              )}
              {p.gemNote && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#C9A227", background: "rgba(201,162,39,0.16)",
                  borderRadius: 999, padding: "2px 7px" }}>
                  {p.gemNote}
                </span>
              )}
              {!p.roleLabel && p.guessLabel && (
                <span style={{ fontSize: 10, fontWeight: 700, color: theme.sub, background: "rgba(0,0,0,0.08)",
                  border: `1px dashed ${theme.panelBorder}`, borderRadius: 999, padding: "2px 7px" }}>
                  🔎 {p.guessLabel}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
