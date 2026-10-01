/* ============================================================
   시스템 아이콘 세트 (게임 UI 전용 · 이모지 대체)
   - 48x48 viewBox, currentColor 선화 + 옅은 면 채움. 칭호 아이콘(titleIcons)과 같은 규격이라 나란히 놓아도 톤이 맞는다.
   - 작은 크기(16~22px)에서 읽혀야 하므로 선 수를 일부러 적게 유지한다.
   - 아이콘마다 컨셉에 맞는 연출(sic-*)이 붙어 있다. SYSTEM_ICON_CSS 를 페이지에 한 번 넣어야 움직인다.
     · 사건성 아이콘은 한 번만 재생(forwards) - 목록에 여러 개 떠 있어도 산만해지지 않게.
     · 불·김·경광등처럼 "계속 그 상태인" 것만 무한 반복.
   - 새 아이콘 추가: SYSTEM_ICONS 에 { label, svg } 를 추가하면 된다.
   ============================================================ */
import React from "react";

const F = 'fill="currentColor" stroke="none"';          // 꽉 찬 면
const FS = 'fill="currentColor" fill-opacity=".18"';     // 옅은 면 + 선화 유지

export const SYSTEM_ICONS = {
  // ── 사건 · 사망 ────────────────────────────────────────────
  "corpse": { label: "사망 · 분필로 그린 시신 윤곽", svg:
    `<circle cx="20" cy="11" r="5.5"/><path class="sic-chalk" d="M20 16.5L18 30M19 21L8 17M20 22l12 8M18 30l-8 12M18 30l9 10" stroke-dasharray="72" stroke-dashoffset="72"/><path d="M34 33h10v11H34z" ${FS}/><path d="M39 36v5" stroke-width="2.2"/>` },
  "curse": { label: "저주로 인한 죽음 · 해골과 룬", svg:
    `<path d="M24 6c8 0 13 6 13 13 0 5-2 7-2 10 0 2-2 4-5 4h-12c-3 0-5-2-5-4 0-3-2-5-2-10 0-7 5-13 13-13z" ${FS}/><circle class="sic-eye" cx="19" cy="20" r="3" ${F}/><circle class="sic-eye" cx="29" cy="20" r="3" ${F} style="animation-delay:.18s"/><path d="M21 28h6M20 37v5M24 37v5M28 37v5"/><path class="sic-rune" d="M8 12l4-4M40 12l-4-4" stroke-width="2.2"/>` },
  "blood": { label: "피의 복수 · 떨어진 핏방울", svg:
    `<path d="M24 4c0 11-11 16-11 25a11 11 0 0 0 22 0C35 20 24 15 24 4z" ${FS}/><path d="M19 29a5 5 0 0 0 5 6" stroke-width="2.4"/><circle class="sic-drip" cx="9" cy="40" r="2.6" ${F}/><circle class="sic-drip" cx="39" cy="37" r="2" ${F} style="animation-delay:.7s"/>` },
  "arson": { label: "방화 · 솟구치는 불길", svg:
    `<path class="sic-flame" d="M24 42c-7 0-12-5-12-11 0-8 8-11 8-18 0 0 7 3 7 9 2-2 3-5 3-5 3 4 6 8 6 14 0 6-5 11-12 11z" ${FS}/><path class="sic-flame" d="M24 38c-3 0-5-2-5-5 0-4 5-5 5-10 3 3 5 6 5 10 0 3-2 5-5 5z" ${F} style="animation-delay:.25s"/><circle class="sic-ember" cx="13" cy="16" r="1.6" ${F}/><circle class="sic-ember" cx="36" cy="12" r="1.3" ${F} style="animation-delay:.9s"/>` },

  // ── 상태 · 처리 ───────────────────────────────────────────
  "hospital": { label: "강제 입원 · 들것과 적십자", svg:
    `<path d="M7 30h34v8H7z" ${FS}/><path d="M11 38v5M37 38v5M7 30l5-8h24l5 8"/><path class="sic-crosspulse" d="M24 23v-7M20.5 19.5h7" stroke-width="3"/>` },
  "scales": { label: "사면 · 균형을 되찾은 저울", svg:
    `<path d="M24 8v30M16 42h16"/><g class="sic-sway"><path d="M9 16h30"/><path d="M9 16l-5 9a6 6 0 0 0 10 0z" ${FS}/><path d="M39 16l5 9a6 6 0 0 1-10 0z" ${FS}/></g><circle cx="24" cy="13" r="2.4" ${F}/>` },
  "siren": { label: "수감 · 회전하는 경광등", svg:
    `<path d="M14 36h20v6H14z" ${FS}/><path d="M17 36c0-7 3-11 7-11s7 4 7 11" ${FS}/><circle cx="24" cy="21" r="3" ${F}/><g class="sic-siren"><path d="M9 18l-5-3M39 18l5-3M12 28H5M36 28h7"/></g>` },
  "sheriffstar": { label: "보안관 · 여섯 꼭짓점 배지", svg:
    `<path d="M24 5l5 9 10-3-3 10 8 7-8 7 3 10-10-3-5 9-5-9-10 3 3-10-8-7 8-7-3-10 10 3z" ${FS}/><circle cx="24" cy="24" r="5"/><path class="sic-glint" d="M12 12l24 24" stroke-width="2.4"/>` },
  "stake": { label: "이단심판 · 불타는 십자가", svg:
    `<path class="sic-flame" d="M15 45c-4-2-6-6-4-10 1 2 2 3 3 4 0-5 2-8 5-11 0 7 4 9 4 14 0 3-3 5-8 3z" ${FS}/><path class="sic-flame" d="M33 45c4-2 6-6 4-10-1 2-2 3-3 4 0-5-2-8-5-11 0 7-4 9-4 14 0 3 3 5 8 3z" ${FS} style="animation-delay:.35s"/><path d="M24 2v28M14 12h20" stroke-width="3.4"/>` },
  "jail": { label: "감옥 · 내려온 창살", svg:
    `<path d="M6 8h36v32H6z" ${FS}/><g class="sic-bars"><path d="M15 8v32M24 8v32M33 8v32" stroke-width="3"/></g><path d="M6 8h36M6 40h36"/>` },
  "note": { label: "결정적 유언 · 피 묻은 쪽지", svg:
    `<path d="M11 6h26v30l-6 6H11z" ${FS}/><path d="M31 42v-6h6"/><path class="sic-write" d="M17 16h14M17 23h14M17 30h8" stroke-dasharray="20" stroke-dashoffset="20"/><circle cx="34" cy="12" r="2.2" ${F}/>` },
  "candle": { label: "성불 · 촛불과 떠오르는 영혼", svg:
    `<path d="M17 24h14v18H17z" ${FS}/><path d="M14 42h20"/><path d="M24 24v-4"/><path class="sic-flame" d="M24 20c-2.6 0-4-1.6-4-3.6 0-3 4-4.4 4-8.4 3 3 4 5.4 4 8.4 0 2-1.4 3.6-4 3.6z" ${F}/><path class="sic-wisp" d="M24 12c-3-4 3-6 0-10" stroke-width="2"/>` },
  "moon": { label: "밤 · 구름에 걸린 초승달", svg:
    `<path d="M30 6a18 18 0 1 0 12 25 15 15 0 1 1-12-25z" ${FS}/><circle class="sic-twinkle" cx="12" cy="12" r="2" ${F}/><circle class="sic-twinkle" cx="40" cy="12" r="1.5" ${F} style="animation-delay:.9s"/><circle class="sic-twinkle" cx="9" cy="28" r="1.4" ${F} style="animation-delay:.45s"/>` },
  "coffee": { label: "평화로운 밤 · 김이 오르는 커피", svg:
    `<path d="M10 20h24v10a10 10 0 0 1-10 10h-4a10 10 0 0 1-10-10z" ${FS}/><path d="M34 23h4a5 5 0 0 1 0 10h-4"/><path d="M8 44h30"/><g class="sic-steam"><path d="M18 14c-2-3 2-4 0-7M26 13c-2-3 2-5 0-8" stroke-width="2"/></g>` },

  // ── 정보 · 조사 ───────────────────────────────────────────
  "brainwash": { label: "세뇌 · 머릿속으로 파고드는 나선", svg:
    `<path d="M33 40v-5c5-3 7-8 7-13 0-9-7-16-16-16S8 13 8 22c0 4 2 7 5 9v9z" ${FS}/><path class="sic-spiral" d="M24 22a4 4 0 1 0 4-4 8 8 0 1 0-8 8 12 12 0 1 0 12-12"/>` },
  "deduction": { label: "명추리 · 실로 이어 붙인 수사 보드", svg:
    `<path d="M6 7h36v34H6z" ${FS}/><circle cx="15" cy="16" r="2.6" ${F}/><circle cx="34" cy="14" r="2.6" ${F}/><circle cx="23" cy="33" r="2.6" ${F}/><path class="sic-thread" d="M15 16l19-2-11 19L15 16" stroke-dasharray="70" stroke-dashoffset="70" stroke-width="2"/>` },
  "toast": { label: "접대 · 맞부딪친 두 잔", svg:
    `<g class="sic-clinkL"><path d="M8 10h12l-3 11a3 3 0 0 1-6 0z" ${FS}/><path d="M14 21v14M9 35h10"/></g><g class="sic-clinkR"><path d="M28 10h12l-3 11a3 3 0 0 1-6 0z" ${FS}/><path d="M34 21v14M29 35h10"/></g><path class="sic-spark" d="M24 10v-5M20 12l-3-3M28 12l3-3" stroke-width="2.2"/>` },
  "relay": { label: "프록시 · 나를 비껴 다른 곳으로 꺾인 능력", svg:
    `<path d="M20 3v12"/><path d="M20 15l-4.5-5M20 15l4.5-5"/><path d="M6 20h32v7H6z" ${FS}/><path class="sic-relayPath" d="M38 24c7 0 6 12 0 17" stroke-dasharray="34" stroke-dashoffset="34" stroke-width="2.6"/><path class="sic-signal" d="M38 41l5.5-2M38 41l1.5 5.5"/>` },
  "antenna": { label: "도청 · 전파를 받아내는 접시", svg:
    `<path d="M8 36a20 20 0 0 1 20-20v20z" ${FS}/><path d="M28 36l10 8M6 44h18"/><g class="sic-wave"><path d="M30 8a16 16 0 0 1 10 10"/><path d="M32 2a24 24 0 0 1 14 14" style="animation-delay:.3s"/></g>` },
  "pin": { label: "지난밤 소식 · 압정으로 꽂은 쪽지", svg:
    `<path d="M10 10h28v28l-7 6H10z" ${FS}/><path d="M31 44v-6h7"/><path d="M16 20h16M16 27h12"/><circle cx="24" cy="9" r="4" ${F}/><path d="M24 13v4" stroke-width="2.4"/>` },
  "hit": { label: "적중 · 과녁에 꽂힌 탄흔", svg:
    `<circle cx="24" cy="24" r="18"/><circle cx="24" cy="24" r="11"/><circle class="sic-impact" cx="24" cy="24" r="4.5" ${F}/><path class="sic-impactRing" d="M24 4a20 20 0 1 1 0 40 20 20 0 0 1 0-40" stroke-width="2"/>` },
  "miss": { label: "빗나감 · 과녁을 스친 탄도", svg:
    `<circle cx="24" cy="24" r="18"/><circle cx="24" cy="24" r="8" stroke-dasharray="4 4"/><path class="sic-miss" d="M4 44L44 4" stroke-dasharray="58" stroke-dashoffset="58" stroke-width="3"/>` },

  // ── 로비 · 시스템 ─────────────────────────────────────────
  "trophy": { label: "명예 · 트로피", svg:
    `<path d="M14 7h20v11a10 10 0 0 1-20 0z" ${FS}/><path d="M14 10H8a7 7 0 0 0 7 7M34 10h6a7 7 0 0 1-7 7"/><path d="M24 28v7M16 41h16l-2-6H18z" ${FS}/><path class="sic-glint" d="M17 11l12 10" stroke-width="2.2"/>` },
  "warn": { label: "경고 · 느낌표 삼각", svg:
    `<path d="M24 6l19 34H5z" ${FS}/><path class="sic-blink" d="M24 18v11" stroke-width="3.4"/><circle class="sic-blink" cx="24" cy="34" r="2.2" ${F}/>` },
  "medal": { label: "순위 메달", svg:
    `<path d="M15 3l5 11M33 3l-5 11" stroke-width="3"/><circle cx="24" cy="31" r="15" ${FS}/><circle cx="24" cy="31" r="7.5"/><path class="sic-glint" d="M13 20l22 22" stroke-width="2.4"/>` },
  "ribbon": { label: "칭호 · 로제트 배지", svg:
    `<circle cx="24" cy="18" r="11" ${FS}/><path d="M24 11l2.4 4.8 5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3-3.8-3.7 5.3-.8z"/><path d="M18 28l-3 15 9-5 9 5-3-15" ${FS}/>` },
  "ticket": { label: "대기열 · 입장권", svg:
    `<path d="M5 14h38v8a4 4 0 0 0 0 8v8H5v-8a4 4 0 0 0 0-8z" ${FS}/><path d="M28 14v4M28 22v4M28 30v4" stroke-dasharray="3 3"/><path d="M12 22h10M12 28h7"/>` },
  "dossier": { label: "내 기록 · 서류철", svg:
    `<path d="M6 12h14l4 5h18v23H6z" ${FS}/><path d="M6 20h38"/><path d="M14 27h20M14 33h13"/>` },
  "book": { label: "직업 도감 · 펼친 책", svg:
    `<path d="M24 12C19 8 13 7 7 8v28c6-1 12 0 17 4 5-4 11-5 17-4V8c-6-1-12 0-17 4z" ${FS}/><path d="M24 12v28"/><path d="M12 17h7M12 24h7M29 17h7M29 24h7"/>` },
  "gear": { label: "능력 · 톱니바퀴", svg:
    `<g class="sic-turn"><path d="M24 4l3 5 6-1 1 6 5 3-3 5 3 5-5 3-1 6-6-1-3 5-3-5-6 1-1-6-5-3 3-5-3-5 5-3 1-6 6 1z" ${FS}/></g><circle cx="24" cy="24" r="6"/>` },
  "flask": { label: "테스트 · 플라스크", svg:
    `<path d="M19 6h10v12l8 18a4 4 0 0 1-4 6H15a4 4 0 0 1-4-6l8-18z" ${FS}/><path d="M17 6h14"/><path d="M14 32h20"/><circle class="sic-bubble" cx="20" cy="36" r="2" ${F}/><circle class="sic-bubble" cx="28" cy="34" r="1.5" ${F} style="animation-delay:.6s"/>` },
  "broadcastwave": { label: "스트리머 모드 · 송신탑", svg:
    `<path d="M24 20l8 23H16z" ${FS}/><circle cx="24" cy="14" r="3" ${F}/><g class="sic-wave"><path d="M15 9a13 13 0 0 1 18 0"/><path d="M10 4a20 20 0 0 1 28 0" style="animation-delay:.3s"/></g>` },
  "clapper": { label: "게임 시작 · 슬레이트", svg:
    `<path d="M5 20h38v22H5z" ${FS}/><g class="sic-clap"><path d="M5 20L8 9l34 4-2 7z" ${FS}/><path d="M15 10l-2 9M24 11l-2 9M33 12l-2 9"/></g><path d="M14 28h20M14 35h13"/>` },
  "trash": { label: "초기화 · 휴지통", svg:
    `<path d="M11 14h26l-2 28H13z" ${FS}/><path d="M7 14h34M18 14V8h12v6"/><path d="M20 22v13M28 22v13"/>` },
  "sparkle": { label: "7일차 새로운 능력 · 섬광", svg:
    `<path class="sic-sparkle" d="M24 4l4 14 14 4-14 4-4 14-4-14-14-4 14-4z" ${FS}/><path class="sic-sparkle" d="M38 30l1.6 4.4L44 36l-4.4 1.6L38 42l-1.6-4.4L32 36l4.4-1.6z" ${F} style="animation-delay:.5s"/>` },
  "gem": { label: "보석", svg:
    `<path d="M14 8h20l10 12-20 24L4 20z" ${FS}/><path d="M4 20h40M14 8l6 12M34 8l-6 12M20 20l4 24M28 20l-4 24"/><path class="sic-gemglint" d="M16 14l-6 8" stroke-width="2.4"/>` },


  // ── 투표 · 판단 ───────────────────────────────────────────
  "ballot": { label: "투표 · 투표함에 넣는 쪽지", svg:
    `<path d="M7 24h34v18H7z" ${FS}/><path d="M7 24l6-5h22l6 5"/><path class="sic-ballotDrop" d="M17 4h14v13H17z" ${FS}/><path d="M21 9h6M21 13h6"/>` },
  "thumbUp": { label: "찬성", svg:
    `<path d="M15 20l8-15a4 4 0 0 1 6 4l-2 8h11a4 4 0 0 1 4 5l-4 15a5 5 0 0 1-5 4H15z" ${FS}/><path d="M5 20h10v21H5z"/>` },
  "thumbDown": { label: "반대", svg:
    `<path d="M15 28l8 15a4 4 0 0 0 6-4l-2-8h11a4 4 0 0 0 4-5l-4-15a5 5 0 0 0-5-4H15z" ${FS}/><path d="M5 7h10v21H5z"/>` },
  "dove": { label: "방면 · 풀려나는 새", svg:
    `<path d="M6 28c8-4 13-12 20-12 7 0 9 4 14 4l-4 6 4 2c-3 7-10 12-18 12-7 0-13-5-16-12z" ${FS}/><circle cx="33" cy="22" r="1.8" ${F}/><path class="sic-wingFlap" d="M18 26c4-8 10-12 16-11" stroke-width="2.2"/>` },
  "stop": { label: "강제 종료 · 금지", svg:
    `<circle cx="24" cy="24" r="19" ${FS}/><path d="M11 11l26 26" stroke-width="3.6"/>` },

  // ── 능력 · 정보 ───────────────────────────────────────────
  "poison": { label: "독살 · 해골이 그려진 약병", svg:
    `<path d="M19 5h10v9l7 20a5 5 0 0 1-5 7H17a5 5 0 0 1-5-7l7-20z" ${FS}/><path d="M17 5h14"/><circle cx="21" cy="31" r="1.9" ${F}/><circle cx="27" cy="31" r="1.9" ${F}/><path d="M22 37h4M21 40v3M24 40v3M27 40v3" stroke-width="2"/>` },
  "target": { label: "오늘 쓸 수 있는 능력 · 과녁", svg:
    `<circle cx="24" cy="24" r="18"/><circle cx="24" cy="24" r="10"/><circle cx="24" cy="24" r="3" ${F}/><path d="M24 2v6M24 40v6M2 24h6M40 24h6"/>` },
  "search": { label: "결과 · 돋보기", svg:
    `<circle cx="21" cy="21" r="14" ${FS}/><path d="M31 31l12 12" stroke-width="3.4"/><path class="sic-glint" d="M14 15l9 9" stroke-width="2.2"/>` },
  "card": { label: "새로운 능력 · 카드", svg:
    `<path d="M14 5h20a4 4 0 0 1 4 4v30a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4z" ${FS}/><path class="sic-sparkle" d="M24 15l3 6 6 3-6 3-3 6-3-6-6-3 6-3z" ${F}/><path d="M15 10h3M30 38h3"/>` },
  "bulb": { label: "힌트 · 전구", svg:
    `<path d="M24 5a13 13 0 0 1 8 23v5H16v-5a13 13 0 0 1 8-23z" ${FS}/><path d="M18 38h12M20 43h8"/><path class="sic-blink" d="M24 16v10" stroke-width="2.4"/>` },
  "skull": { label: "사망", svg:
    `<path d="M24 5c9 0 15 7 15 15 0 6-3 8-3 12 0 2-2 4-5 4H21c-3 0-5-2-5-4 0-4-3-6-3-12 0-8 6-15 15-15z" ${FS}/><circle cx="18" cy="21" r="3.4" ${F}/><circle cx="30" cy="21" r="3.4" ${F}/><path d="M20 31h8M20 36v6M24 36v6M28 36v6" stroke-width="2.2"/>` },
  "chat": { label: "채팅 · 말풍선", svg:
    `<path d="M7 9h34v24H20l-9 8v-8H7z" ${FS}/><circle cx="17" cy="21" r="2.2" ${F}/><circle cx="24" cy="21" r="2.2" ${F}/><circle cx="31" cy="21" r="2.2" ${F}/>` },
  "coin": { label: "포인트 · 적립된 코인", svg:
    `<ellipse cx="24" cy="31" rx="15" ry="7"/><path d="M9 31v-8a15 7 0 0 1 30 0v8"/><ellipse cx="24" cy="23" rx="15" ry="7" ${FS}/><path class="sic-glint" d="M14 19l9 6" stroke-width="2.2"/><path d="M24 18v10M21 21h5a2 2 0 0 1 0 4h-4a2 2 0 0 0 0 4h5" stroke-width="2"/>` },
  "volume": { label: "효과음 설정 · 스피커", svg:
    `<path d="M6 18h8l12-9v30l-12-9H6z" ${FS}/><g class="sic-wave"><path d="M32 18a9 9 0 0 1 0 12"/><path d="M38 13a17 17 0 0 1 0 22" style="animation-delay:.3s"/></g>` },
  "caretDown": { label: "펼치기", svg: `<path d="M11 18l13 13 13-13" stroke-width="3.4"/>` },

  // ── 작은 조작 글리프 ──────────────────────────────────────
  "chevronL": { label: "이전", svg: `<path d="M29 10L15 24l14 14" stroke-width="3.4"/>` },
  "chevronR": { label: "다음", svg: `<path d="M19 10l14 14-14 14" stroke-width="3.4"/>` },
  "close": { label: "닫기", svg: `<path d="M12 12l24 24M36 12L12 36" stroke-width="3.4"/>` },
  "back": { label: "뒤로", svg: `<path d="M42 24H9M20 11L7 24l13 13" stroke-width="3.2"/>` },
  "check": { label: "확인", svg: `<path d="M9 25l10 10L39 13" stroke-width="3.8"/>` },
};

export const SYSTEM_ICON_CSS = `
  /* 사건성 연출 - 한 번만 재생 (목록에 여러 줄이 떠 있어도 산만해지지 않게) */
  @keyframes sicChalk { to { stroke-dashoffset: 0; } }
  .sic-chalk { animation: sicChalk 0.75s ease-out 0.05s forwards; }
  @keyframes sicEye { 0%,100% { opacity: 1; } 45% { opacity: 0.15; } }
  .sic-eye { animation: sicEye 2.4s ease-in-out 2; }
  @keyframes sicRune { 0% { opacity: 0; transform: scale(0.4); } 40% { opacity: 1; transform: scale(1); } 100% { opacity: 0.35; } }
  .sic-rune { animation: sicRune 0.9s ease-out forwards; transform-origin: 50% 50%; }
  @keyframes sicDrip { 0%,55% { transform: translateY(0); opacity: 1; } 85% { transform: translateY(7px); opacity: 0.5; } 100% { transform: translateY(10px); opacity: 0; } }
  .sic-drip { animation: sicDrip 1.9s ease-in 3; }
  @keyframes sicWrite { to { stroke-dashoffset: 0; } }
  .sic-write { animation: sicWrite 1s ease-out 0.1s forwards; }
  @keyframes sicThread { to { stroke-dashoffset: 0; } }
  .sic-thread { animation: sicThread 1.1s ease-out 0.15s forwards; }
  @keyframes sicRelay { to { stroke-dashoffset: 0; } }
  .sic-relayPath { animation: sicRelay 1s ease-out 0.1s forwards; }
  @keyframes sicMiss { to { stroke-dashoffset: 0; } }
  .sic-miss { animation: sicMiss 0.5s ease-in forwards; }
  @keyframes sicImpact { 0% { opacity: 0; transform: scale(2.4); } 45% { opacity: 1; transform: scale(0.85); } 100% { transform: scale(1); opacity: 1; } }
  .sic-impact { animation: sicImpact 0.45s ease-out forwards; transform-origin: 24px 24px; }
  @keyframes sicImpactRing { 0% { opacity: 0.9; transform: scale(0.35); } 100% { opacity: 0; transform: scale(1.25); } }
  .sic-impactRing { animation: sicImpactRing 0.7s ease-out forwards; transform-origin: 24px 24px; }
  @keyframes sicBars { 0% { transform: translateY(-34px); } 60% { transform: translateY(1.5px); } 100% { transform: translateY(0); } }
  .sic-bars { animation: sicBars 0.6s cubic-bezier(0.3,1.5,0.6,1) forwards; }
  @keyframes sicSpiral { 0% { opacity: 0; transform: rotate(-150deg) scale(0.3); } 100% { opacity: 1; transform: rotate(0) scale(1); } }
  .sic-spiral { animation: sicSpiral 0.9s ease-out forwards; transform-origin: 24px 22px; }
  @keyframes sicClinkL { 0%,100% { transform: rotate(0); } 30% { transform: rotate(-11deg); } 46% { transform: rotate(3deg); } }
  .sic-clinkL { animation: sicClinkL 1.3s ease-out 2; transform-origin: 14px 35px; }
  @keyframes sicClinkR { 0%,100% { transform: rotate(0); } 30% { transform: rotate(11deg); } 46% { transform: rotate(-3deg); } }
  .sic-clinkR { animation: sicClinkR 1.3s ease-out 2; transform-origin: 34px 35px; }
  @keyframes sicSpark { 0%,22% { opacity: 0; transform: scale(0.3); } 34% { opacity: 1; transform: scale(1); } 60%,100% { opacity: 0; transform: scale(1.4); } }
  .sic-spark { animation: sicSpark 1.3s ease-out 2; transform-origin: 24px 10px; }
  @keyframes sicCrossPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
  .sic-crosspulse { animation: sicCrossPulse 1.4s ease-in-out 3; }
  @keyframes sicGlint { 0%,70% { opacity: 0; transform: translate(-14px,-14px); } 80% { opacity: 0.95; } 100% { opacity: 0; transform: translate(14px,14px); } }
  .sic-glint { animation: sicGlint 2.6s ease-in-out 2; }
  @keyframes sicGemGlint { 0%,60% { opacity: 0; transform: translate(-8px,-6px); } 72% { opacity: 1; } 100% { opacity: 0; transform: translate(12px,9px); } }
  .sic-gemglint { animation: sicGemGlint 2.2s ease-in-out infinite; }
  @keyframes sicSparkle { 0%,100% { opacity: 0.55; transform: scale(0.88) rotate(0); } 50% { opacity: 1; transform: scale(1.06) rotate(12deg); } }
  .sic-sparkle { animation: sicSparkle 2.4s ease-in-out infinite; transform-origin: 50% 50%; }
  @keyframes sicBlink { 0%,100% { opacity: 1; } 42% { opacity: 0.2; } }
  .sic-blink { animation: sicBlink 1.1s ease-in-out 3; }
  @keyframes sicSway { 0%,100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }
  .sic-sway { animation: sicSway 2.8s ease-in-out 2; transform-origin: 24px 16px; }
  @keyframes sicClap { 0% { transform: rotate(-16deg); } 55% { transform: rotate(2deg); } 100% { transform: rotate(0); } }
  .sic-clap { animation: sicClap 0.5s ease-out forwards; transform-origin: 6px 19px; }
  @keyframes sicTurn { to { transform: rotate(360deg); } }
  .sic-turn { animation: sicTurn 14s linear infinite; transform-origin: 24px 24px; }

  /* "계속 그 상태인" 것들만 무한 반복 */
  @keyframes sicFlame { 0%,100% { transform: scaleY(1) scaleX(1); } 35% { transform: scaleY(1.1) scaleX(0.94); } 65% { transform: scaleY(0.95) scaleX(1.05); } }
  .sic-flame { animation: sicFlame 1.5s ease-in-out infinite; transform-origin: 24px 44px; }
  @keyframes sicEmber { 0% { opacity: 0; transform: translateY(6px); } 30% { opacity: 1; } 100% { opacity: 0; transform: translateY(-12px); } }
  .sic-ember { animation: sicEmber 2.6s ease-out infinite; }
  @keyframes sicSteam { 0% { opacity: 0; transform: translateY(5px); } 35% { opacity: 0.9; } 100% { opacity: 0; transform: translateY(-7px); } }
  .sic-steam { animation: sicSteam 3.2s ease-in-out infinite; }
  @keyframes sicWisp { 0% { opacity: 0; transform: translateY(4px) scaleX(1); } 40% { opacity: 1; } 100% { opacity: 0; transform: translateY(-9px) scaleX(0.7); } }
  .sic-wisp { animation: sicWisp 3s ease-out infinite; }
  @keyframes sicSiren { 0%,49% { opacity: 1; } 50%,100% { opacity: 0.15; } }
  .sic-siren { animation: sicSiren 0.7s steps(1) infinite; }
  @keyframes sicWave { 0% { opacity: 0; transform: scale(0.7); } 40% { opacity: 1; } 100% { opacity: 0; transform: scale(1.15); } }
  .sic-wave > * { animation: sicWave 2.2s ease-out infinite; transform-origin: 24px 20px; }
  @keyframes sicSignal { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
  .sic-signal { animation: sicSignal 1.8s ease-in-out infinite; }
  @keyframes sicBubble { 0% { opacity: 0; transform: translateY(2px); } 40% { opacity: 1; } 100% { opacity: 0; transform: translateY(-9px); } }
  .sic-bubble { animation: sicBubble 2.4s ease-in-out infinite; }
  @keyframes sicBallotDrop { 0% { transform: translateY(-14px); opacity: 0; } 55% { opacity: 1; transform: translateY(2px); } 100% { transform: translateY(0); opacity: 1; } }
  .sic-ballotDrop { animation: sicBallotDrop 0.6s ease-out forwards; }
  @keyframes sicWingFlap { 0%,100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-2px) rotate(-5deg); } }
  .sic-wingFlap { animation: sicWingFlap 1.6s ease-in-out infinite; transform-origin: 20px 26px; }
  @keyframes sicTwinkle { 0%,100% { opacity: 0.25; } 50% { opacity: 1; } }
  .sic-twinkle { animation: sicTwinkle 2.8s ease-in-out infinite; }

  @media (prefers-reduced-motion: reduce) {
    [class^="sic-"], [class*=" sic-"] { animation: none !important; }
    .sic-chalk, .sic-write, .sic-thread, .sic-relayPath, .sic-miss { stroke-dashoffset: 0 !important; }
  }
`;

/**
 * 시스템 아이콘. 이름이 없으면 null (이모지로 되돌리지 않는다 - 빠진 건 바로 눈에 띄는 게 낫다).
 * @param n   SYSTEM_ICONS 키
 * @param size 기본 1.15em (글자 옆에 놓을 때 자연스러운 크기)
 */
export function SystemIcon({ n, size = "1.15em", color, style, className, strokeWidth = 2.8 }) {
  const icon = SYSTEM_ICONS[n];
  if (!icon) return null;
  return (
    <svg className={className} viewBox="0 0 48 48" width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" role="img" aria-label={icon.label}
      style={{ display: "inline-block", verticalAlign: "-0.2em", flexShrink: 0, overflow: "visible", ...(color ? { color } : {}), ...style }}
      dangerouslySetInnerHTML={{ __html: icon.svg }} />
  );
}

/** 괴도 보석 - 같은 컷에 색만 바뀐다 */
export const GEM_COLORS = { "다이아몬드": "#BFE4F0", "루비": "#D9465C", "사파이어": "#5B8FE0", "에메랄드": "#4FB37A" };
export function GemIcon({ type, size = "1.15em", style }) {
  return <SystemIcon n="gem" size={size} color={GEM_COLORS[type] || "#C9A227"} style={style} />;
}

export default SystemIcon;
