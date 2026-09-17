/* ============================================================
   직업 아이콘 세트 (이모지 대체)
   - 작은 크기(14~32px)에서도 한눈에 알아보도록 48x48 격자에 굵은 선 + 옅은 면 채움으로 그렸다.
   - currentColor 기반이라 color만 주면 된다. 기본 색은 팀 색(ROLE_ICON_COLOR).
   - 직업 키(role)로 쓰거나, 직업 이름(label)으로 찾을 수 있다(roleKeyFromLabel).
   ============================================================ */

const F = 'fill="currentColor" fill-opacity=".22"';
const S = 'fill="currentColor" stroke="none"';

export const ROLE_ICONS = {
  /* ---------- 마피아팀 ---------- */
  mafia: { label: "마피아 · 단검", svg:
    `<path d="M24 2l8 25H16z" ${F}/><path d="M24 2l8 25H16z"/><line x1="24" y1="8" x2="24" y2="24" stroke-width="1.6"/><path d="M11 29h26" stroke-width="4.4"/><rect x="20.5" y="31" width="7" height="10" rx="1.5" fill="currentColor" fill-opacity=".45"/><circle cx="24" cy="44" r="2.8"/>` },
  spy: { label: "스파이 · 중절모와 선글라스", svg:
    `<path d="M12 22c0-9 5-15 12-15s12 6 12 15" ${F}/><path d="M5 23c6 4 32 4 38 0" stroke-width="3.2"/><path d="M12 29h24"/><path d="M13 29c0 6 3 8 6 8s5-3 5-8" ${S}/><path d="M24 29c0 6 2 8 5 8s6-2 6-8" ${S}/><path d="M16 42c3 3 13 3 16 0"/>` },
  conartist: { label: "사기꾼 · 웃는 얼굴 뒤의 우는 가면", svg:
    `<path d="M20 8h22v14c0 9-5 15-11 15S20 31 20 22z" ${F}/><path d="M25 17l4 2M37 17l-4 2"/><path d="M26 30c3-3 7-3 10 0"/><path d="M6 14h20v14c0 9-4 14-10 14S6 37 6 28z" fill="currentColor" fill-opacity=".45"/><path d="M10 23l3-2 3 2M19 23l3-2 3 2" stroke-width="2"/><path d="M11 31c3 4 7 4 10 0" stroke-width="2"/>` },
  godfather: { label: "대부 · 왕관", svg:
    `<path d="M7 36L5 14l11 9 8-15 8 15 11-9-2 22z" ${F}/><path d="M7 36h34v6H7z" fill="currentColor" fill-opacity=".45"/><circle cx="24" cy="8" r="2.2" ${S}/><circle cx="5" cy="14" r="2" ${S}/><circle cx="43" cy="14" r="2" ${S}/><circle cx="24" cy="29" r="2.6" ${S}/>` },
  hitman: { label: "히트맨 · 조준경", svg:
    `<circle cx="24" cy="24" r="16" ${F}/><circle cx="24" cy="24" r="16"/><circle cx="24" cy="24" r="7"/><path d="M24 2v12M24 34v12M2 24h12M34 24h12" stroke-width="2.6"/><circle cx="24" cy="24" r="2" ${S}/>` },
  framer: { label: "해커 · 터미널이 켜진 노트북", svg:
    `<rect x="8" y="8" width="32" height="23" rx="2" ${F}/><path d="M14 16l5 4-5 4" stroke-width="2.6"/><path d="M22 25h8" stroke-width="2.6"/><path d="M3 36h42l-3 5H6z" fill="currentColor" fill-opacity=".45"/>` },
  blocker: { label: "마담 · 붉은 입술 자국", svg:
    `<path d="M4 23c5-8 11-11 15-9 2 1 4 2 5 2s3-1 5-2c4-2 10 1 15 9-5 9-12 14-20 14S9 32 4 23z" ${F}/><path d="M4 23c8 2 16 3 20 3s12-1 20-3"/><path d="M4 23c5-8 11-11 15-9 2 1 4 2 5 2s3-1 5-2c4-2 10 1 15 9-5 9-12 14-20 14S9 32 4 23z"/>` },
  silencer: { label: "유괴범 · 끊어지지 않는 쇠사슬", svg:
    `<rect x="4" y="18" width="18" height="12" rx="6" transform="rotate(-35 13 24)" ${F}/><rect x="4" y="18" width="18" height="12" rx="6" transform="rotate(-35 13 24)" stroke-width="3"/><rect x="15" y="18" width="18" height="12" rx="6" transform="rotate(35 24 24)" stroke-width="3"/><rect x="26" y="18" width="18" height="12" rx="6" transform="rotate(-35 35 24)" ${F}/><rect x="26" y="18" width="18" height="12" rx="6" transform="rotate(-35 35 24)" stroke-width="3"/>` },
  terrorist: { label: "테러리스트 · 도화선이 붙은 폭탄", svg:
    `<circle cx="21" cy="29" r="14" ${F}/><circle cx="21" cy="29" r="14"/><rect x="25" y="11" width="8" height="6" rx="1" transform="rotate(40 29 14)" fill="currentColor" fill-opacity=".5"/><path d="M32 12c2-5 6-6 9-4" stroke-dasharray="2.4 2"/><path d="M42 3v4M45 6h-4M39 3l2 3" stroke-width="2"/><path d="M14 24a8 8 0 0 1 5-4" stroke-width="2.4"/>` },
  witch: { label: "마녀 · 별이 박힌 고깔모자", svg:
    `<path d="M11 36L22 5c2 6 9 9 14 9-5 2-8 8-7 22z" ${F}/><path d="M11 36L22 5c2 6 9 9 14 9-5 2-8 8-7 22"/><path d="M3 38c6 5 36 5 42 0-6-4-36-4-42 0z" fill="currentColor" fill-opacity=".45"/><path d="M13 31h17" stroke-width="3.6"/><path d="M22 18l1.4 3 3.2.4-2.4 2.2.7 3.2-2.9-1.6-2.9 1.6.7-3.2-2.4-2.2 3.2-.4z" ${S}/>` },

  /* ---------- 시민팀 ---------- */
  police: { label: "경찰 · 별이 새겨진 경찰 배지", svg:
    `<path d="M24 4l17 6v12c0 11-7 19-17 23C14 41 7 33 7 22V10z" ${F}/><path d="M24 4l17 6v12c0 11-7 19-17 23C14 41 7 33 7 22V10z"/><path d="M24 14l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z" ${S}/>` },
  doctor: { label: "의사 · 청진기", svg:
    `<path d="M11 5v11a9 9 0 0 0 18 0V5" stroke-width="3"/><path d="M8 5h6M26 5h6" stroke-width="3"/><path d="M20 25v5a9 9 0 0 0 18 0v-4"/><circle cx="38" cy="21" r="5" ${F}/><circle cx="38" cy="21" r="5"/><circle cx="38" cy="21" r="1.6" ${S}/>` },
  reporter: { label: "기자 · 플래시가 달린 보도용 카메라", svg:
    `<rect x="4" y="18" width="30" height="22" rx="3" ${F}/><rect x="4" y="18" width="30" height="22" rx="3"/><circle cx="19" cy="29" r="6"/><circle cx="19" cy="29" r="2" ${S}/><path d="M9 18l3-4h8l3 4"/><path d="M36 22h4V8h-4z" fill="currentColor" fill-opacity=".45"/><path d="M44 5l3-2M44 12l3 1M45 8h3" stroke-width="2"/>` },
  medium: { label: "영매 · 떠도는 유령", svg:
    `<path d="M10 42V21a14 14 0 0 1 28 0v21l-5-4-4 4-5-4-5 4-4-4z" ${F}/><path d="M10 42V21a14 14 0 0 1 28 0v21l-5-4-4 4-5-4-5 4-4-4z"/><ellipse cx="19" cy="21" rx="2.4" ry="3.4" ${S}/><ellipse cx="29" cy="21" rx="2.4" ry="3.4" ${S}/><path d="M21 30c2 2 4 2 6 0" stroke-width="2"/>` },
  soldier: { label: "건달 · 너클", svg:
    `<path d="M6 16a5 5 0 0 1 10 0 5 5 0 0 1 10 0 5 5 0 0 1 10 0 5 5 0 0 1 10 0v6c0 7-4 12-10 14H14C9 34 6 30 6 24z" ${F}/><circle cx="11" cy="17" r="3"/><circle cx="21" cy="17" r="3"/><circle cx="31" cy="17" r="3"/><circle cx="41" cy="17" r="2.6"/><path d="M6 16v8c0 6 4 10 8 12h20c6-2 10-7 10-14v-6"/><path d="M16 36v6h16v-6" stroke-width="2.6"/>` },
  newlywed: { label: "연인 · 맞닿은 두 개의 하트", svg:
    `<path d="M17 40C5 31 2 23 5 17c3-6 10-6 12-1 2-5 9-5 12 1 3 6 0 14-12 23z" ${F}/><path d="M17 40C5 31 2 23 5 17c3-6 10-6 12-1 2-5 9-5 12 1 3 6 0 14-12 23z"/><path d="M31 34c10-7 13-14 11-19-2-5-8-5-10-1-2-4-7-5-9-2" fill="currentColor" fill-opacity=".45"/><path d="M31 34c10-7 13-14 11-19-2-5-8-5-10-1"/>` },
  unemployed: { label: "백수 · 푹 꺼진 소파", svg:
    `<path d="M10 22V13a4 4 0 0 1 4-4h20a4 4 0 0 1 4 4v9" ${F}/><path d="M10 22V13a4 4 0 0 1 4-4h20a4 4 0 0 1 4 4v9"/><path d="M4 22a4 4 0 0 1 8 0v4h24v-4a4 4 0 0 1 8 0v12H4z" fill="currentColor" fill-opacity=".4"/><path d="M4 22a4 4 0 0 1 8 0v4h24v-4a4 4 0 0 1 8 0v12H4z"/><path d="M8 34v5M40 34v5" stroke-width="3"/><path d="M16 26c3 3 13 3 16 0" stroke-width="1.6" opacity=".7"/>` },
  teacher: { label: "교사 · 사과", svg:
    `<path d="M24 16c-4-4-15-4-17 6-2 11 5 22 11 22 3 0 4-1 6-1s3 1 6 1c6 0 13-11 11-22-2-10-13-10-17-6z" ${F}/><path d="M24 16c-4-4-15-4-17 6-2 11 5 22 11 22 3 0 4-1 6-1s3 1 6 1c6 0 13-11 11-22-2-10-13-10-17-6z"/><path d="M24 16c0-5 2-9 5-11" stroke-width="2.6"/><path d="M26 9c4-4 10-3 12 0-4 3-9 3-12 0z" fill="currentColor" fill-opacity=".5"/><path d="M13 24c0-3 2-5 4-5" stroke-width="2"/>` },
  student: { label: "학생 · 책가방", svg:
    `<path d="M17 10V8a7 7 0 0 1 14 0v2"/><rect x="8" y="10" width="32" height="34" rx="8" ${F}/><rect x="8" y="10" width="32" height="34" rx="8"/><rect x="14" y="28" width="20" height="12" rx="2" fill="currentColor" fill-opacity=".4"/><path d="M14 33h20" stroke-width="1.8"/><path d="M15 20h18" stroke-width="1.8" opacity=".6"/>` },
  counselor: { label: "상담원 · 주고받는 두 말풍선", svg:
    `<path d="M4 8h24a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H14l-6 6v-6H4a3 3 0 0 1-3-3V11a3 3 0 0 1 3-3z" ${F}/><path d="M4 8h24a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H14l-6 6v-6H4a3 3 0 0 1-3-3V11a3 3 0 0 1 3-3z"/><path d="M35 18h9a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-3v6l-6-6H24a3 3 0 0 1-3-3v-3" fill="currentColor" fill-opacity=".4"/><path d="M9 17h14M9 21h9" stroke-width="2"/>` },
  idol: { label: "피싱 · 낚싯바늘에 걸린 편지", svg:
    `<path d="M24 2v12"/><path d="M24 14c0 4 5 4 5 0" stroke-width="2.4"/><rect x="5" y="19" width="38" height="25" rx="2" ${F}/><rect x="5" y="19" width="38" height="25" rx="2"/><path d="M5 21l19 13 19-13"/><path d="M29 14l-2-3" stroke-width="2.4"/>` },
  coroner: { label: "검시관 · 현미경", svg:
    `<path d="M20 6l8 4-9 18-8-4z" ${F}/><path d="M20 6l8 4-9 18-8-4z"/><path d="M15 26l-2 5"/><path d="M26 16a12 12 0 0 1 6 18"/><path d="M8 42h32" stroke-width="3.4"/><path d="M22 36h16" stroke-width="3"/><path d="M32 34v8" stroke-width="3"/><path d="M21 4l6 3" stroke-width="3.4"/>` },
  warden: { label: "교도관 · 감옥 열쇠", svg:
    `<circle cx="15" cy="15" r="10" ${F}/><circle cx="15" cy="15" r="10"/><circle cx="15" cy="15" r="3.4"/><path d="M22 22l20 20" stroke-width="3.6"/><path d="M33 33l-5 5M39 39l-4 4M36 36l-3 3" stroke-width="3"/>` },
  politician: { label: "정치인 · 실크햇", svg:
    `<path d="M13 8h22l-2 28H15z" ${F}/><path d="M13 8h22l-2 28H15z"/><path d="M14 28h20" stroke-width="4"/><path d="M3 38c4 5 38 5 42 0-5-3-37-3-42 0z" fill="currentColor" fill-opacity=".45"/><path d="M3 38c4 5 38 5 42 0"/>` },
  detective: { label: "탐정 · 돋보기", svg:
    `<circle cx="20" cy="20" r="14" ${F}/><circle cx="20" cy="20" r="14" stroke-width="3.2"/><path d="M30 30l14 14" stroke-width="5.4"/><path d="M12 16a9 9 0 0 1 6-6" stroke-width="2.4"/>` },
  undertaker: { label: "장의사 · 관", svg:
    `<path d="M17 3h14l7 11-5 31H15l-5-31z" ${F}/><path d="M17 3h14l7 11-5 31H15l-5-31z"/><path d="M24 13v16M18 19h12" stroke-width="3"/>` },
  judge: { label: "판사 · 의사봉", svg:
    `<rect x="9" y="6" width="24" height="12" rx="2" transform="rotate(-30 21 12)" ${F}/><rect x="9" y="6" width="24" height="12" rx="2" transform="rotate(-30 21 12)"/><path d="M24 20l14 16" stroke-width="4"/><path d="M4 42h24" stroke-width="3.4"/><path d="M8 37h16" stroke-width="2"/>` },
  official: { label: "공무원 · 결재 도장이 찍힌 서류철", svg:
    `<path d="M4 10h14l4 4h22v28H4z" ${F}/><path d="M4 10h14l4 4h22v28H4z"/><path d="M4 18h40" stroke-width="1.8"/><circle cx="30" cy="30" r="7" fill="currentColor" fill-opacity=".45"/><path d="M27 30l2.4 2.4L34 27" stroke-width="2.2"/><path d="M10 26h10M10 32h8" stroke-width="2"/>` },
  priest: { label: "성직자 · 빛나는 십자가", svg:
    `<path d="M20 4h8v10h10v8H28v22h-8V22H10v-8h10z" ${F}/><path d="M20 4h8v10h10v8H28v22h-8V22H10v-8h10z"/><path d="M4 8l3 2M44 8l-3 2M3 28h4M45 28h-4" stroke-width="2"/>` },
  citizen: { label: "시민 · 여문 밀 이삭", svg:
    `<path d="M24 46V10" stroke-width="2.6"/><g ${F}><path d="M24 10c-3-3-3-7 0-9 3 2 3 6 0 9z"/><path d="M24 20c-5 0-8-4-8-8 5 0 8 3 8 8z"/><path d="M24 20c5 0 8-4 8-8-5 0-8 3-8 8z"/><path d="M24 30c-5 0-8-4-8-8 5 0 8 3 8 8z"/><path d="M24 30c5 0 8-4 8-8-5 0-8 3-8 8z"/></g><path d="M24 10c-3-3-3-7 0-9 3 2 3 6 0 9zM24 20c-5 0-8-4-8-8 5 0 8 3 8 8zM24 20c5 0 8-4 8-8-5 0-8 3-8 8zM24 30c-5 0-8-4-8-8 5 0 8 3 8 8zM24 30c5 0 8-4 8-8-5 0-8 3-8 8z" stroke-width="2"/><path d="M24 40c-4-3-9-3-12 0M24 40c4-3 9-3 12 0" stroke-width="2"/>` },
  veteran: { label: "군인 · 철모", svg:
    `<path d="M6 30C6 17 14 8 24 8s18 9 18 22z" ${F}/><path d="M6 30C6 17 14 8 24 8s18 9 18 22"/><path d="M2 30h44l-3 5H5z" fill="currentColor" fill-opacity=".45"/><path d="M13 30c3 8 7 12 11 12s8-4 11-12" stroke-width="2"/><path d="M14 18h20M12 23h24" stroke-width="1.6" stroke-dasharray="2 3" opacity=".7"/>` },
  bodyguard: { label: "경호원 · 방패", svg:
    `<path d="M24 3l18 7v13c0 11-8 19-18 23C14 42 6 34 6 23V10z" ${F}/><path d="M24 3l18 7v13c0 11-8 19-18 23C14 42 6 34 6 23V10z" stroke-width="3"/><path d="M24 10v30M12 18h24" stroke-width="2.2" opacity=".8"/>` },

  /* ---------- 중립 ---------- */
  cultist: { label: "악마 숭배자 · 뿔 달린 악마", svg:
    `<path d="M11 18C6 14 5 8 7 3c2 5 6 8 10 9M37 18c5-4 6-10 4-15-2 5-6 8-10 9" ${F}/><path d="M11 18C6 14 5 8 7 3c2 5 6 8 10 9M37 18c5-4 6-10 4-15-2 5-6 8-10 9"/><path d="M10 26c0-9 6-15 14-15s14 6 14 15c0 10-6 18-14 18S10 36 10 26z" ${F}/><path d="M10 26c0-9 6-15 14-15s14 6 14 15c0 10-6 18-14 18S10 36 10 26z"/><path d="M15 24l6 3M33 24l-6 3" stroke-width="2.6"/><path d="M17 34c4 4 10 4 14 0" stroke-width="2.4"/>` },
  vampire: { label: "뱀파이어 · 박쥐", svg:
    `<path d="M24 18c-2-4-4-6-6-6 1 2 1 4 0 5-4-3-10-3-16 2 5 1 7 5 7 9 4-4 9-4 12 0 1-2 2-3 3-3s2 1 3 3c3-4 8-4 12 0 0-4 2-8 7-9-6-5-12-5-16-2-1-1-1-3 0-5-2 0-4 2-6 6z" ${F}/><path d="M24 18c-2-4-4-6-6-6 1 2 1 4 0 5-4-3-10-3-16 2 5 1 7 5 7 9 4-4 9-4 12 0 1-2 2-3 3-3s2 1 3 3c3-4 8-4 12 0 0-4 2-8 7-9-6-5-12-5-16-2-1-1-1-3 0-5-2 0-4 2-6 6z"/><path d="M21 32l1.4 5 1.6-4 1.6 4 1.4-5" stroke-width="2"/><path d="M24 40c-2 3-3 4-3 5a3 3 0 0 0 6 0c0-1-1-2-3-5z" ${S}/>` },
  thief: { label: "괴도 · 도미노 가면과 보석", svg:
    `<path d="M3 22c5-6 16-6 21 0 5-6 16-6 21 0 0 10-5 15-11 15-5 0-8-4-10-7-2 3-5 7-10 7C8 37 3 32 3 22z" ${F}/><path d="M3 22c5-6 16-6 21 0 5-6 16-6 21 0 0 10-5 15-11 15-5 0-8-4-10-7-2 3-5 7-10 7C8 37 3 32 3 22z"/><path d="M9 26c3-3 7-3 10 0-3 3-7 3-10 0zM29 26c3-3 7-3 10 0-3 3-7 3-10 0z" ${S}/><path d="M35 3l4 0 3 3-5 5-5-5z" fill="currentColor" fill-opacity=".5"/>` },
  werewolf: { label: "늑대인간 · 날 선 늑대의 얼굴", svg:
    `<path d="M7 4l11 11h12L41 4v20l5 5-8 3c-3 6-8 10-14 14-6-4-11-8-14-14l-8-3 5-5z" ${F}/><path d="M7 4l11 11h12L41 4v20l5 5-8 3c-3 6-8 10-14 14-6-4-11-8-14-14l-8-3 5-5z"/><path d="M13 22l7 3M35 22l-7 3" stroke-width="2.8"/><path d="M20 35h8l-4 4z" ${S}/><path d="M24 25v9" stroke-width="1.6" opacity=".7"/>` },
  cat: { label: "고양이 · 귀를 세운 고양이", svg:
    `<path d="M8 40V14l8 7c5-2 11-2 16 0l8-7v26c0 3-3 5-6 5H14c-3 0-6-2-6-5z" ${F}/><path d="M8 40V14l8 7c5-2 11-2 16 0l8-7v26c0 3-3 5-6 5H14c-3 0-6-2-6-5z"/><path d="M15 29c2-2 5-2 7 0-2 2-5 2-7 0zM26 29c2-2 5-2 7 0-2 2-5 2-7 0z" ${S}/><path d="M22 35l2 2 2-2" stroke-width="2"/><path d="M4 33h8M4 38h8M36 33h8M36 38h8" stroke-width="1.6" opacity=".7"/>` },
  mercenary: { label: "용병 · 엇갈린 두 자루의 장검", svg:
    `<path d="M9 7l23 23" stroke-width="5"/><path d="M9 7l23 23" stroke="#000" stroke-opacity=".35" stroke-width="1.4"/><path d="M26 36l10-10" stroke-width="3.2"/><path d="M33 33l8 8" stroke-width="4"/><circle cx="43" cy="43" r="2.4"/><path d="M39 7L16 30" stroke-width="5"/><path d="M39 7L16 30" stroke="#000" stroke-opacity=".35" stroke-width="1.4"/><path d="M22 36L12 26" stroke-width="3.2"/><path d="M15 33l-8 8" stroke-width="4"/><circle cx="5" cy="43" r="2.4"/>` },
};

/* 팀 대표 아이콘 (팀 이름 앞에 붙는 아이콘) */
export const TEAM_ICON = { mafia: "mafia", citizen: "citizen", neutral: "cultist" };

const MAFIA_TEAM = ["mafia", "spy", "conartist", "godfather", "hitman", "framer", "blocker", "silencer", "terrorist", "witch"];
const NEUTRAL_TEAM = ["cultist", "vampire", "thief", "werewolf", "cat", "mercenary"];
const CITIZEN_FORCED = ["police", "doctor"];
const CITIZEN_PLAIN = ["citizen", "unemployed", "teacher", "student", "counselor", "idol", "coroner", "warden"];

/** 직업별 기본 색 - 직업 공개 라벨 색 기준(마피아 빨강 · 중립 보라 · 필수 파랑 · 일반 노랑 · 특수 초록) */
export function roleIconColor(role) {
  if (MAFIA_TEAM.includes(role)) return "#E05F5F";
  if (NEUTRAL_TEAM.includes(role)) return "#B57BF0";
  if (CITIZEN_FORCED.includes(role)) return "#5B9BF0";
  if (CITIZEN_PLAIN.includes(role)) return "#E8D25A";
  return "#5FBF7A";
}

const LABEL_TO_KEY = {
  마피아: "mafia", 스파이: "spy", 사기꾼: "conartist", 대부: "godfather", 히트맨: "hitman", 해커: "framer", 마담: "blocker", 유괴범: "silencer",
  테러리스트: "terrorist", 마녀: "witch", 경찰: "police", 의사: "doctor", 기자: "reporter", 영매: "medium", 건달: "soldier", 연인: "newlywed",
  신혼부부: "newlywed", 백수: "unemployed", 교사: "teacher", 학생: "student", 상담원: "counselor", 피싱: "idol", 검시관: "coroner", 교도관: "warden",
  정치인: "politician", 탐정: "detective", 장의사: "undertaker", 판사: "judge", 공무원: "official", 성직자: "priest", 시민: "citizen", 군인: "veteran",
  경호원: "bodyguard", "악마 숭배자": "cultist", 뱀파이어: "vampire", 흡혈귀: "vampire", 괴도: "thief", 늑대인간: "werewolf", 고양이: "cat", 용병: "mercenary",
};
export function roleKeyFromLabel(label) {
  return LABEL_TO_KEY[label] || null;
}

/**
 * 직업 아이콘. role(직업 키) 또는 label(직업 이름) 중 하나를 준다.
 * inline이면 글자 줄 높이에 맞춰 살짝 내려 앉힌다.
 */
export function RoleIcon({ role, label, size = 18, color, inline = false, style, title }) {
  const key = role || roleKeyFromLabel(label);
  const icon = ROLE_ICONS[key];
  if (!icon) return null;
  const c = color || roleIconColor(key);
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
      role="img" aria-label={title || icon.label}
      style={{ color: c, flexShrink: 0, overflow: "visible", ...(inline ? { display: "inline-block", verticalAlign: "-0.2em", marginRight: "0.3em" } : {}), ...style }}
      dangerouslySetInnerHTML={{ __html: icon.svg }} />
  );
}

/** 팀 아이콘 (마피아팀/시민팀/중립) */
export function TeamIcon({ team, size = 16, inline = true, style }) {
  const key = TEAM_ICON[team];
  return <RoleIcon role={key} size={size} inline={inline} style={style} color={team === "mafia" ? "#E05F5F" : team === "neutral" ? "#B57BF0" : "#E8C468"} />;
}
