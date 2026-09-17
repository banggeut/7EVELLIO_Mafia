/* ============================================================
   칭호 아이콘 세트 (칭호 앞 이모지 대체)
   - 칭호는 채팅(8.5px)처럼 아주 작게도 보이므로, 48x48 격자에 굵은 선 + 진한 면으로 단순하게 그렸다.
   - currentColor 기반: 칭호 글자 색(titleColor)을 그대로 따라간다.
   - 서버에 저장된 칭호 문자열("👑 최종보스")은 그대로 두고, 화면에 그릴 때만 이모지를 떼고 아이콘을 붙인다.
     그래서 이미 칭호를 가진 사람의 데이터는 바꿀 필요가 없다. 매칭은 이모지 뒤의 "칭호 이름"으로 한다.
   ============================================================ */

const F = 'fill="currentColor" fill-opacity=".28"';
const S = 'fill="currentColor" stroke="none"';

export const TITLE_ICONS = {
  "명예시민": { label: "명예시민 · 리본 달린 훈장", svg:
    `<path d="M14 3h8l4 14h-8zM34 3h-8l-4 14h8z" fill="currentColor" fill-opacity=".45"/><circle cx="24" cy="31" r="13" ${F}/><circle cx="24" cy="31" r="13"/><path d="M24 23l2.5 5 5.5.7-4 3.8 1 5.5-5-2.7-5 2.7 1-5.5-4-3.8 5.5-.7z" ${S}/>` },
  "명의": { label: "명의 · 다시 뛰는 심장", svg:
    `<path d="M24 43C8 32 3 23 6 15c3-8 13-9 18-2 5-7 15-6 18 2 3 8-2 17-18 28z" ${F}/><path d="M24 43C8 32 3 23 6 15c3-8 13-9 18-2 5-7 15-6 18 2 3 8-2 17-18 28z"/><path d="M8 25h9l3-6 5 13 3-7h12" stroke-width="3"/>` },
  "엘리트 수사관": { label: "엘리트 수사관 · 돌아가는 경광등", svg:
    `<path d="M13 32V22a11 11 0 0 1 22 0v10z" ${F}/><path d="M13 32V22a11 11 0 0 1 22 0v10z"/><path d="M8 32h32v7H8z" fill="currentColor" fill-opacity=".55"/><path d="M19 22a5 5 0 0 1 5-5" stroke-width="2.4"/><path d="M4 12l5 4M44 12l-5 4M24 2v5M9 4l3 5M39 4l-3 5" stroke-width="2.6"/>` },
  "정론직필": { label: "정론직필 · 곧게 선 만년필 펜촉", svg:
    `<path d="M24 45L12 27l6-18h12l6 18z" ${F}/><path d="M24 45L12 27l6-18h12l6 18z"/><path d="M24 45V29" stroke-width="2.2"/><circle cx="24" cy="25" r="3" ${S}/><path d="M17 5h14" stroke-width="3.4"/>` },
  "탱커": { label: "탱커 · 총탄 자국이 박힌 방패", svg:
    `<path d="M24 3l18 7v13c0 11-8 19-18 23C14 42 6 34 6 23V10z" ${F}/><path d="M24 3l18 7v13c0 11-8 19-18 23C14 42 6 34 6 23V10z" stroke-width="3"/><circle cx="21" cy="20" r="3.4" ${S}/><path d="M21 20l7-5M21 20l-6-4M21 20l2 8M21 20l-7 5" stroke-width="1.8"/><circle cx="31" cy="31" r="2.4" ${S}/><path d="M31 31l5 2M31 31l-2 5" stroke-width="1.6"/>` },
  "여긴 내 구역이야": { label: "여긴 내 구역이야 · 펼친 잭나이프", svg:
    `<path d="M5 34l20-20c5-5 12-6 16-5-2 5-6 10-12 14L11 40z" ${F}/><path d="M5 34l20-20c5-5 12-6 16-5-2 5-6 10-12 14L11 40z"/><path d="M5 34l6 6-4 4-7-7z" fill="currentColor" fill-opacity=".6"/><path d="M14 31l4 4" stroke-width="2"/><path d="M36 30l6 6M40 26l5 3M32 34l3 6" stroke-width="2.2"/>` },
  "너를 위해서": { label: "너를 위해서 · 핏방울이 맺힌 반지", svg:
    `<path d="M17 14l3-8h8l3 8-7 5z" fill="currentColor" fill-opacity=".55"/><path d="M17 14l3-8h8l3 8-7 5z"/><circle cx="24" cy="31" r="12" stroke-width="3.6"/><circle cx="24" cy="31" r="12" ${F}/><path d="M39 38c-3 4-4 6-4 7a4 4 0 0 0 8 0c0-1-1-3-4-7z" ${S}/>` },
  "명탐정 라삐": { label: "명탐정 라삐 · 연기 피어오르는 담배 파이프", svg:
    `<path d="M3 22c8 1 14 4 19 9" stroke-width="4.4"/><path d="M22 20h18v10c0 8-4 13-9 13s-9-5-9-13z" ${F}/><path d="M22 20h18v10c0 8-4 13-9 13s-9-5-9-13z"/><path d="M21 20h20" stroke-width="3.6"/><path d="M27 14c-3-3 3-5 0-9M35 15c-3-3 3-5 0-9" stroke-width="2.4"/>` },
  "뱀파이어 사냥꾼": { label: "뱀파이어 사냥꾼 · 십자 말뚝과 시든 장미", svg:
    `<path d="M20 46l4-8 4 8" ${S}/><path d="M20 38h8V14h-8z" ${F}/><path d="M20 38h8V14h-8z"/><path d="M24 2v12M17 7h14" stroke-width="3.4"/><path d="M28 26c6-2 12 0 14 5-5 2-11 1-14-5z" fill="currentColor" fill-opacity=".5"/><path d="M20 30c-5-3-11-2-14 2 4 3 10 3 14-2z" fill="currentColor" fill-opacity=".35"/>` },
  "뒤를 부탁한다": { label: "뒤를 부탁한다 · 총알 구멍이 난 넥타이", svg:
    `<path d="M6 4l18 8 18-8" stroke-width="3"/><path d="M18 10h12l-3 6h-6z" fill="currentColor" fill-opacity=".55"/><path d="M21 16h6l5 20-8 9-8-9z" ${F}/><path d="M21 16h6l5 20-8 9-8-9z"/><circle cx="25" cy="28" r="3" ${S}/><path d="M25 28l6-3M25 28l-5-4M25 28l3 6" stroke-width="1.6"/>` },
  "최고의 스승": { label: "최고의 스승 · 분필 자국이 남은 칠판", svg:
    `<rect x="3" y="6" width="42" height="28" rx="2" ${F}/><rect x="3" y="6" width="42" height="28" rx="2"/><path d="M10 16c4-3 7 3 11 0s7 3 11 0" stroke-width="2.4"/><path d="M10 25h18" stroke-width="2.4"/><path d="M15 34l-4 10M33 34l4 10" stroke-width="3"/><path d="M34 26l6-2" stroke-width="3.6"/>` },
  "최고의 제자": { label: "최고의 제자 · 학사모", svg:
    `<path d="M2 18l22-10 22 10-22 10z" fill="currentColor" fill-opacity=".5"/><path d="M2 18l22-10 22 10-22 10z"/><path d="M11 23v10c0 4 6 7 13 7s13-3 13-7V23" ${F}/><path d="M11 23v10c0 4 6 7 13 7s13-3 13-7V23"/><path d="M42 20v14" stroke-width="2.2"/><circle cx="42" cy="36" r="2.4" ${S}/>` },
  "세계를 멸망시켜봤습니다": { label: "세계를 멸망시켜봤습니다 · 불타며 갈라지는 지구", svg:
    `<circle cx="24" cy="28" r="17" ${F}/><circle cx="24" cy="28" r="17"/><path d="M7 26c6 2 10-2 15 1s9 1 19-1M24 11l-3 8 5 6-4 7 3 13" stroke-width="2.2"/><path d="M13 12c-3-4 0-8 3-9 0 3 3 3 3 6M34 11c-2-4 1-7 4-8 0 3 3 4 2 7" fill="currentColor" fill-opacity=".6" stroke-width="2"/>` },
  "뱀파이어 로드": { label: "뱀파이어 로드 · 피가 넘치는 성배", svg:
    `<path d="M10 6h28c0 12-5 20-14 20S10 18 10 6z" ${F}/><path d="M10 6h28c0 12-5 20-14 20S10 18 10 6z"/><path d="M11 12c5 2 21 2 26 0" stroke-width="2"/><path d="M24 26v12M14 43h20" stroke-width="3.4"/><path d="M36 15c2 4 3 6 3 7a3 3 0 0 1-6 0c0-1 1-3 3-7z" ${S}/>` },
  "잘 먹고 갑니다": { label: "잘 먹고 갑니다 · 빛나는 보석", svg:
    `<path d="M4 18l9-11h22l9 11-20 25z" ${F}/><path d="M4 18l9-11h22l9 11-20 25z"/><path d="M4 18h40M13 7l6 11 5-11 5 11 6-11M19 18l5 25 5-25" stroke-width="2"/><path d="M42 2l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" ${S}/>` },
  "ALPHA": { label: "ALPHA · 세 줄기 발톱 자국과 초승달", svg:
    `<path d="M40 3a8 8 0 1 0 5 13 6 6 0 1 1-5-13z" ${S}/><path d="M6 10c5 10 7 22 6 34M16 6c6 12 8 24 7 38M27 8c5 10 7 20 6 32" stroke-width="4.4"/>` },
  "탐정이다냥": { label: "탐정이다냥 · 돋보기를 든 고양이", svg:
    `<path d="M4 34V10l7 6c4-2 10-2 14 0l7-6v14" ${F}/><path d="M4 34V10l7 6c4-2 10-2 14 0l7-6v12"/><path d="M4 34c0 5 4 8 9 8h6" /><path d="M10 26c1.5-1.5 3.5-1.5 5 0M20 26c1.5-1.5 3.5-1.5 5 0" stroke-width="2.4"/><circle cx="33" cy="33" r="7" ${F}/><circle cx="33" cy="33" r="7" stroke-width="3"/><path d="M38 38l7 7" stroke-width="4"/>` },
  "냥냥펀치": { label: "냥냥펀치 · 집중선이 터지는 발바닥", svg:
    `<ellipse cx="24" cy="31" rx="10" ry="8.5" ${S}/><ellipse cx="12" cy="18" rx="3.6" ry="4.8" ${S}/><ellipse cx="20" cy="12" rx="3.6" ry="4.8" ${S}/><ellipse cx="28" cy="12" rx="3.6" ry="4.8" ${S}/><ellipse cx="36" cy="18" rx="3.6" ry="4.8" ${S}/><path d="M2 36l5-1M4 44l5-4M44 36l-5-1M42 44l-5-4M24 47v-5" stroke-width="2.6"/>` },
  "길냥이": { label: "길냥이 · 꼬리를 세우고 걷는 고양이", svg:
    `<path d="M8 42l2-12c-1-6 3-11 10-11h10l4-6 3 3 3-3 1 8c0 5-3 8-7 9l1 12M16 42l1-8M29 42l-1-8" ${F}/><path d="M8 42l2-12c-1-6 3-11 10-11h10l4-6 3 3 3-3 1 8c0 5-3 8-7 9l1 12M16 42l1-8M29 42l-1-8"/><path d="M10 26C3 22 2 12 7 6" stroke-width="3"/><circle cx="37" cy="17" r="1.6" ${S}/>` },
  "최종보스": { label: "최종보스 · 왕관을 쓴 해골", svg:
    `<path d="M11 14L9 3l8 6 7-7 7 7 8-6-2 11z" fill="currentColor" fill-opacity=".55"/><path d="M11 14L9 3l8 6 7-7 7 7 8-6-2 11z"/><path d="M24 16c-10 0-15 6-15 13 0 5 3 8 6 10v6h18v-6c3-2 6-5 6-10 0-7-5-13-15-13z" ${F}/><path d="M24 16c-10 0-15 6-15 13 0 5 3 8 6 10v6h18v-6c3-2 6-5 6-10 0-7-5-13-15-13z"/><circle cx="18.5" cy="29" r="3.4" ${S}/><circle cx="29.5" cy="29" r="3.4" ${S}/><path d="M24 34l-2 3h4z" ${S}/>` },
  "혼자는 안가요": { label: "혼자는 안가요 · 누르기 직전의 기폭 장치", svg:
    `<path d="M24 20V6M14 6h20" stroke-width="4"/><rect x="7" y="20" width="34" height="22" rx="2" ${F}/><rect x="7" y="20" width="34" height="22" rx="2"/><path d="M7 27h34" stroke-width="1.8"/><path d="M41 34c4 0 5 4 3 7" stroke-dasharray="2.4 2" stroke-width="2.2"/><path d="M13 35h8" stroke-width="3"/><circle cx="33" cy="35" r="2.6" ${S}/>` },
  "천재 해커": { label: "천재 해커 · 깨져 흐르는 코드 괄호", svg:
    `<path d="M15 10L3 24l12 14" stroke-width="4"/><path d="M33 10l12 14-12 14" stroke-width="4"/><path d="M28 6L20 42" stroke-width="3.6"/><path d="M8 18h12M30 30h12" stroke-width="2" opacity=".7"/>` },
  "선량한 시민": { label: "선량한 시민 · 막 돋아난 새싹", svg:
    `<path d="M24 44V22" stroke-width="3.4"/><path d="M24 24C24 12 14 6 4 8c0 10 8 17 20 16z" ${F}/><path d="M24 24C24 12 14 6 4 8c0 10 8 17 20 16z"/><path d="M24 30c0-9 8-14 18-12 0 8-7 13-18 12z" fill="currentColor" fill-opacity=".5"/><path d="M24 30c0-9 8-14 18-12 0 8-7 13-18 12z"/><path d="M12 44h24" stroke-width="3"/>` },
  "명예 마피아": { label: "명예 마피아 · 연기 나는 권총", svg:
    `<path d="M3 14h32l2-3h6v10h-9l-2 4H20l-4 17H7l3-17-7-4z" ${F}/><path d="M3 14h32l2-3h6v10h-9l-2 4H20l-4 17H7l3-17-7-4z"/><path d="M20 25c0 5 6 5 6 0" stroke-width="2.2"/><path d="M45 8c-3-3 2-5-1-8" stroke-width="2.2"/>` },
  "왜 이겼지?": { label: "왜 이겼지? · 머리 위에 뜬 물음표 말풍선", svg:
    `<path d="M24 3c11 0 20 7 20 16s-9 16-20 16c-2 0-4 0-6-1l-9 6 2-8C6 29 4 24 4 19 4 10 13 3 24 3z" ${F}/><path d="M24 3c11 0 20 7 20 16s-9 16-20 16c-2 0-4 0-6-1l-9 6 2-8C6 29 4 24 4 19 4 10 13 3 24 3z"/><path d="M18 14c0-4 3-6 6-6s6 2 6 5c0 4-6 4-6 9" stroke-width="3.4"/><circle cx="24" cy="28" r="2.2" ${S}/><path d="M36 46h2M41 44h2M46 42h1" stroke-width="2.4"/>` },
  /* ---------- 7일차 능력 업적 칭호 ---------- */
  "부패경찰": { label: "부패경찰 · 금이 가 반쯤 붉게 물든 경찰 배지", svg:
    `<path d="M24 3l17 6v13c0 11-7 19-17 23C14 41 7 33 7 22V9z" ${F}/><path d="M24 3l17 6v13c0 11-7 19-17 23C14 41 7 33 7 22V9z"/><path d="M24 3v8l-3 6 4 5-3 7 3 6-1 10" stroke-width="2.4"/><path d="M24 11l-3 6 4 5-3 7 3 6-1 10c10-4 17-12 17-23V9z" fill="currentColor" fill-opacity=".55" stroke="none"/><path d="M15 21l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" ${S}/>` },
  "바이러스": { label: "바이러스 · 가시 돋친 바이러스 입자", svg:
    `<circle cx="24" cy="24" r="12" ${F}/><circle cx="24" cy="24" r="12"/><path d="M24 12V5M24 36v7M12 24H5M36 24h7M15.5 15.5l-5-5M32.5 32.5l5 5M32.5 15.5l5-5M15.5 32.5l-5 5" stroke-width="2.6"/><circle cx="24" cy="4" r="2.4" ${S}/><circle cx="24" cy="44" r="2.4" ${S}/><circle cx="4" cy="24" r="2.4" ${S}/><circle cx="44" cy="24" r="2.4" ${S}/><circle cx="9" cy="9" r="2.2" ${S}/><circle cx="39" cy="39" r="2.2" ${S}/><circle cx="39" cy="9" r="2.2" ${S}/><circle cx="9" cy="39" r="2.2" ${S}/><circle cx="20" cy="21" r="2.4" ${S}/><circle cx="28" cy="27" r="3" ${S}/>` },
  "암살": { label: "암살 · 조준선 안의 단검", svg:
    `<circle cx="24" cy="24" r="18" stroke-width="2.2"/><path d="M24 2v7M24 39v7M2 24h7M39 24h7" stroke-width="2.4"/><g transform="rotate(45 24 24)"><path d="M24 7l4 20h-8z" ${F}/><path d="M24 7l4 20h-8z"/><path d="M17 29h14" stroke-width="3.4"/><path d="M24 31v9" stroke-width="3.6"/></g>` },
  "미녀": { label: "미녀 · 붉은 립스틱과 입맞춤 자국", svg:
    `<rect x="7" y="26" width="14" height="19" rx="2" ${F}/><rect x="7" y="26" width="14" height="19" rx="2"/><path d="M9 26V16h10v10" fill="currentColor" fill-opacity=".4"/><path d="M9 16l4-12c3 0 6 3 6 7v5" fill="currentColor" fill-opacity=".75"/><path d="M26 16c3-4 6-5 8-4l2 1 2-1c2-1 5 0 8 4-3 5-6 8-10 8s-7-3-10-8z" fill="currentColor" fill-opacity=".75" stroke-width="2"/><path d="M26 16c6 1 14 1 20 0" stroke-width="1.6"/>` },
  "너 납치된거야": { label: "너 납치된거야 · 밧줄로 묶은 자루", svg:
    `<path d="M14 18c-6 5-9 12-8 19 1 6 6 9 18 9s17-3 18-9c1-7-2-14-8-19z" ${F}/><path d="M14 18c-6 5-9 12-8 19 1 6 6 9 18 9s17-3 18-9c1-7-2-14-8-19z"/><path d="M14 18c3-3 17-3 20 0" stroke-width="3.6"/><path d="M17 12l7 6 7-6M24 18c-2-7-7-10-12-9M24 18c2-7 7-10 12-9" stroke-width="2.2"/><path d="M15 30c3 2 6 1 8 3M28 36c3-1 6 0 8 2" stroke-width="1.6" opacity=".7"/>` },
  "폭발은 예술이다": { label: "폭발은 예술이다 · 터져나가는 폭발 섬광", svg:
    `<path d="M24 2l4 11 9-7-2 11 11-1-8 8 9 7-11 1 4 11-10-6-6 10-3-11-10 5 4-10L2 31l9-7-8-8 11 1-2-11 9 7z" ${F}/><path d="M24 2l4 11 9-7-2 11 11-1-8 8 9 7-11 1 4 11-10-6-6 10-3-11-10 5 4-10L2 31l9-7-8-8 11 1-2-11 9 7z"/><path d="M24 15l3 6 6 1-4 5 1 6-6-3-5 3 1-6-4-5 6-1z" fill="currentColor" fill-opacity=".7" stroke="none"/>` },
  "활활": { label: "활활 · 치솟는 세 갈래 불길", svg:
    `<path d="M24 46c-11 0-17-7-16-16 1-6 5-9 6-15 4 3 5 7 5 10 2-6 1-13-2-21 9 4 16 13 15 23 2-2 3-5 3-8 4 4 6 9 6 14 0 8-7 13-17 13z" ${F}/><path d="M24 46c-11 0-17-7-16-16 1-6 5-9 6-15 4 3 5 7 5 10 2-6 1-13-2-21 9 4 16 13 15 23 2-2 3-5 3-8 4 4 6 9 6 14 0 8-7 13-17 13z"/><path d="M24 46c-5 0-8-3-8-8 0-4 3-6 4-10 2 2 3 4 3 6 1-2 2-5 1-8 5 3 8 7 8 12 0 5-3 8-8 8z" fill="currentColor" fill-opacity=".7" stroke="none"/>` },
  "고대 주술사": { label: "고대 주술사 · 룬이 새겨진 마법진과 눈", svg:
    `<circle cx="24" cy="24" r="20" ${F}/><circle cx="24" cy="24" r="20"/><circle cx="24" cy="24" r="14" stroke-width="1.6" stroke-dasharray="3 3"/><path d="M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M38 10l-4 4M10 38l4-4" stroke-width="2.2"/><path d="M14 24c4-6 16-6 20 0-4 6-16 6-20 0z" fill="currentColor" fill-opacity=".45"/><circle cx="24" cy="24" r="3.4" ${S}/>` },
  "꼭두각시": { label: "꼭두각시 · 줄에 매달린 마리오네트", svg:
    `<path d="M8 5h32M16 2v6M32 2v6" stroke-width="3.4"/><path d="M12 5v19M24 5v10M36 5v17M18 5l-2 36M30 5l2 36" stroke-width="1.4" stroke-dasharray="2 2.4"/><circle cx="24" cy="18" r="4.4" ${F}/><circle cx="24" cy="18" r="4.4"/><path d="M24 23v12M24 26l-12-2M24 26l12-4M24 35l-8 8M24 35l8 8" stroke-width="3"/>` },
  "가짜뉴스": { label: "가짜뉴스 · 거짓 도장이 찍힌 신문", svg:
    `<path d="M5 8h32v34H10a5 5 0 0 1-5-5z" ${F}/><path d="M5 8h32v34H10a5 5 0 0 1-5-5z"/><path d="M37 15h6v24a3 3 0 0 1-3 3"/><path d="M10 14h22" stroke-width="3.6"/><path d="M10 21h22M10 26h14" stroke-width="1.8" opacity=".6"/><g transform="rotate(-18 26 33)"><rect x="12" y="27" width="28" height="12" rx="1.5" fill="currentColor" fill-opacity=".2" stroke-width="2.6"/><path d="M18 30l5 6M23 30l-5 6M28 30h6M28 33h5M28 36h6" stroke-width="2"/></g>` },
  "LEGEND": { label: "LEGEND · 월계관에 둘러싸인 별", svg:
    `<path d="M16 42C7 37 3 27 6 16M32 42c9-5 13-15 10-26" stroke-width="2.6"/><path d="M6 18c3-1 5 1 5 4-3 1-5-1-5-4zM5 26c3-1 6 1 6 4-3 1-6-1-6-4zM8 34c3 0 5 2 5 5-3 0-5-2-5-5zM42 18c-3-1-5 1-5 4 3 1 5-1 5-4zM43 26c-3-1-6 1-6 4 3 1 6-1 6-4zM40 34c-3 0-5 2-5 5 3 0 5-2 5-5z" fill="currentColor" fill-opacity=".6" stroke-width="1.6"/><path d="M24 8l4.4 9 9.6 1.3-7 6.7 1.7 9.5L24 30l-8.7 4.5 1.7-9.5-7-6.7 9.6-1.3z" ${F}/><path d="M24 8l4.4 9 9.6 1.3-7 6.7 1.7 9.5L24 30l-8.7 4.5 1.7-9.5-7-6.7 9.6-1.3z"/><path d="M18 44h12" stroke-width="3"/>` },
  "중독": { label: "중독 · 해골 표시가 붙은 독약병", svg:
    `<path d="M19 3h10v5h-10z" fill="currentColor" fill-opacity=".6"/><path d="M20 8v7C11 18 7 24 7 31c0 9 7 14 17 14s17-5 17-14c0-7-4-13-13-16V8" ${F}/><path d="M20 8v7C11 18 7 24 7 31c0 9 7 14 17 14s17-5 17-14c0-7-4-13-13-16V8"/><path d="M24 24c-5 0-7 3-7 6 0 2 1 3 3 4v3h8v-3c2-1 3-2 3-4 0-3-2-6-7-6z" fill="currentColor" fill-opacity=".7" stroke="none"/><circle cx="21" cy="30" r="1.4" fill="#000" fill-opacity=".6" stroke="none"/><circle cx="27" cy="30" r="1.4" fill="#000" fill-opacity=".6" stroke="none"/>` },
  "FBI": { label: "FBI · 조준경이 겹친 연방 요원 배지", svg:
    `<path d="M24 3l6 5 8-1 1 8 6 6-5 6 1 8-8 1-4 7-5-4-5 4-4-7-8-1 1-8-5-6 6-6 1-8 8 1z" ${F}/><path d="M24 3l6 5 8-1 1 8 6 6-5 6 1 8-8 1-4 7-5-4-5 4-4-7-8-1 1-8-5-6 6-6 1-8 8 1z"/><circle cx="24" cy="24" r="9" stroke-width="2.6"/><path d="M24 12v7M24 29v7M12 24h7M29 24h7" stroke-width="2.2"/><circle cx="24" cy="24" r="2.2" ${S}/>` },
  "최고의 파트너": { label: "최고의 파트너 · 후광을 두른 유령과 십자가", svg:
    `<ellipse cx="18" cy="6" rx="8" ry="2.6" stroke-width="2.4"/><path d="M6 44V22a12 12 0 0 1 24 0v22l-4-3-4 3-4-3-4 3-4-3z" ${F}/><path d="M6 44V22a12 12 0 0 1 24 0v22l-4-3-4 3-4-3-4 3-4-3z"/><circle cx="14" cy="22" r="2" ${S}/><circle cx="22" cy="22" r="2" ${S}/><path d="M38 14v28M31 22h14" stroke-width="3.6"/><path d="M30 30c3-1 5 0 6 2" stroke-width="2"/>` },
  "팍쒸, 드루와": { label: "팍쒸, 드루와 · 붕대 감은 주먹", svg:
    `<path d="M10 20a4 4 0 0 1 8 0v-2a4 4 0 0 1 8 0v1a4 4 0 0 1 8 0v2a4 4 0 0 1 8 0v10c0 9-6 15-15 15h-3c-8 0-14-6-14-14z" ${F}/><path d="M10 20a4 4 0 0 1 8 0v-2a4 4 0 0 1 8 0v1a4 4 0 0 1 8 0v2a4 4 0 0 1 8 0v10c0 9-6 15-15 15h-3c-8 0-14-6-14-14z"/><path d="M18 20v6M26 19v6M34 21v5" stroke-width="2"/><path d="M11 32l30-4M12 37l28-4" stroke-width="2.6" opacity=".8"/><path d="M2 8l5 4M8 2l3 6M46 8l-5 4M40 2l-3 6" stroke-width="2.4"/>` },
  "독재자": { label: "독재자 · 붉은 별 아래 외치는 확성기", svg:
    `<path d="M24 2l2.4 5 5.6.7-4 3.8 1 5.5-5-2.7-5 2.7 1-5.5-4-3.8 5.6-.7z" ${S}/><path d="M6 24h7l20-9v28l-20-9H6z" ${F}/><path d="M6 24h7l20-9v28l-20-9H6z"/><path d="M13 34l3 10h5l-2-9" stroke-width="2.6"/><path d="M38 22c3 3 3 11 0 14M42 18c6 5 6 17 0 22" stroke-width="2.6"/>` },
  "내 이름은 라삐, 탐정이죠": { label: "내 이름은 라삐, 탐정이죠 · 진실을 짚어낸 돋보기", svg:
    `<circle cx="20" cy="20" r="15" ${F}/><circle cx="20" cy="20" r="15" stroke-width="3.2"/><path d="M31 31l13 13" stroke-width="5.4"/><path d="M20 10v12" stroke-width="4"/><circle cx="20" cy="28" r="2.4" ${S}/><path d="M40 4l2 4M46 10l-4 1M36 2v4" stroke-width="2.2"/>` },
  "불사신": { label: "불사신 · 불길 속에서 날개를 편 불사조", svg:
    `<path d="M24 16c-3-5-1-10 2-13 1 4 4 6 3 10" fill="currentColor" fill-opacity=".6" stroke-width="2"/><path d="M24 20C17 12 8 10 2 12c5 3 7 8 8 13-3 0-5 1-6 3 6 1 11 3 14 7l6 9 6-9c3-4 8-6 14-7-1-2-3-3-6-3 1-5 3-10 8-13-6-2-15 0-22 8z" ${F}/><path d="M24 20C17 12 8 10 2 12c5 3 7 8 8 13-3 0-5 1-6 3 6 1 11 3 14 7l6 9 6-9c3-4 8-6 14-7-1-2-3-3-6-3 1-5 3-10 8-13-6-2-15 0-22 8z"/><path d="M24 22v18" stroke-width="2.4"/>` },
  "한번만 빌리겠습니다.": { label: "한번만 빌리겠습니다. · 의료 십자가가 붙은 관", svg:
    `<path d="M17 3h14l7 11-5 31H15l-5-31z" ${F}/><path d="M17 3h14l7 11-5 31H15l-5-31z"/><path d="M20 21h8v-6h5v6h0" stroke="none"/><path d="M21.5 13h5v6h6v5h-6v6h-5v-6h-6v-5h6z" fill="currentColor" fill-opacity=".7" stroke-width="1.8"/><path d="M40 36l6-4M42 42l5-1" stroke-width="2.2"/>` },
  "배신": { label: "배신 · 악수 뒤로 숨긴 단검", svg:
    `<path d="M3 26l8-8 8 3 6-3 7 5 6-3 7 6-9 9-7-2-6 5-7-2-6-4z" ${F}/><path d="M3 26l8-8 8 3 6-3 7 5 6-3 7 6-9 9-7-2-6 5-7-2-6-4z"/><path d="M19 21l8 7M25 18l9 7" stroke-width="2"/><g transform="rotate(35 36 14)"><path d="M36 0l3 13h-6z" fill="currentColor" fill-opacity=".7"/><path d="M31 14h10" stroke-width="3"/><path d="M36 15v7" stroke-width="3.4"/></g>` },
  "1급 공무원": { label: "1급 공무원 · 결재 도장", svg:
    `<path d="M18 4h12v8c0 3 5 4 5 9v4H13v-4c0-5 5-6 5-9z" ${F}/><path d="M18 4h12v8c0 3 5 4 5 9v4H13v-4c0-5 5-6 5-9z"/><path d="M8 25h32v7H8z" fill="currentColor" fill-opacity=".5"/><path d="M8 25h32v7H8z"/><circle cx="24" cy="41" r="6" stroke-width="2.4"/><path d="M21 41l2.2 2.2L27 39" stroke-width="2.2"/>` },
  "성녀": { label: "성녀 · 후광 아래 피어난 백합", svg:
    `<ellipse cx="24" cy="6" rx="12" ry="3.6" stroke-width="3"/><path d="M24 44V26" stroke-width="2.6"/><path d="M24 28c-3-6-3-12 0-16 3 4 3 10 0 16z" fill="currentColor" fill-opacity=".6"/><path d="M24 28c-6-1-12-5-13-11 6 0 11 4 13 11z" ${F}/><path d="M24 28c-6-1-12-5-13-11 6 0 11 4 13 11z"/><path d="M24 28c6-1 12-5 13-11-6 0-11 4-13 11z" ${F}/><path d="M24 28c6-1 12-5 13-11-6 0-11 4-13 11z"/><path d="M24 38c-5-1-8-4-9-7M24 38c5-1 8-4 9-7" stroke-width="2"/>` },
  "이단심판관": { label: "이단심판관 · 불타는 성스러운 횃불", svg:
    `<path d="M18 24h12l-3 21h-6z" ${F}/><path d="M18 24h12l-3 21h-6z"/><path d="M15 24h18" stroke-width="3.4"/><path d="M24 22c-7 0-10-5-9-10 1-3 3-4 3-7 3 2 4 4 4 6 1-3 1-6 0-9 5 3 8 7 8 12 1-1 2-3 2-4 2 3 2 6 1 8-1 3-4 4-9 4z" fill="currentColor" fill-opacity=".6"/><path d="M24 28v12M20 32h8" stroke-width="2.2"/>` },
  "다잉메세지": { label: "다잉메세지 · 피로 쓴 글씨와 손자국", svg:
    `<path d="M6 8c5-2 9 3 13 0s8 2 12-1" stroke-width="3.4"/><path d="M6 17c4-2 7 2 11 0" stroke-width="3.4"/><path d="M13 19v6M29 8v8" stroke-width="2.2"/><circle cx="13" cy="27" r="1.8" ${S}/><circle cx="29" cy="18" r="1.8" ${S}/><path d="M26 44c-6 0-10-4-10-9v-6a2.4 2.4 0 0 1 4.8 0V26a2.4 2.4 0 0 1 4.8 0v-2a2.4 2.4 0 0 1 4.8 0v2a2.4 2.4 0 0 1 4.8 0v10c0 5-4 8-9 8z" fill="currentColor" fill-opacity=".6"/>` },
};

/** "👑 최종보스" → { emoji: "👑", name: "최종보스" } (이모지가 없으면 전체가 이름) */
export function splitTitle(title) {
  if (!title) return { emoji: "", name: "" };
  const i = title.indexOf(" ");
  if (i > 0 && !/[가-힣A-Za-z0-9]/.test(title.slice(0, i))) return { emoji: title.slice(0, i), name: title.slice(i + 1) };
  return { emoji: "", name: title };
}

/** 칭호 아이콘. 아이콘이 없는 칭호(새로 추가됐는데 아직 안 그린 경우)는 원래 이모지를 그대로 보여준다. */
export function TitleIcon({ title, size = "1.2em", color, style, className }) {
  const { emoji, name } = splitTitle(title);
  const icon = TITLE_ICONS[name];
  if (!icon) return emoji ? <span className={className} style={style}>{emoji}</span> : null;
  return (
    <svg className={className} viewBox="0 0 48 48" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"
      role="img" aria-label={icon.label}
      style={{ display: "inline-block", verticalAlign: "-0.22em", flexShrink: 0, overflow: "visible", ...(color ? { color } : {}), ...style }}
      dangerouslySetInnerHTML={{ __html: icon.svg }} />
  );
}
