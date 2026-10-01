/* ============================================================
   가명(별명) 배정기

   게임이 시작되면 참가자는 치지직 닉네임 대신 이 목록의 이름을 하나씩 받는다.
   목적은 익명성이다 - 방송 시청자나 다른 참가자가 "저 사람은 원래 이런 플레이를 하지"
   하는 선입견 없이 판을 풀게 하고, 채팅으로 정답이 흘러나가는 것도 막는다.

   단 관리자(방송 진행자)만은 예외로 원래 닉네임과 프로필 사진을 그대로 쓴다.
   진행자는 어차피 화면에 얼굴과 목소리가 나가므로 숨길 이유가 없고,
   시청자가 "지금 말하는 사람이 누구지" 하고 헷갈리지 않아야 하기 때문이다.

   실제 닉네임은 player.realName 에 따로 보관된다. 포인트·업적 같은 영구 기록은
   반드시 realName 으로 남겨야 한다 (가명으로 남기면 랭킹에 '박춘봉'이 쌓인다).
   ============================================================ */

export const ALIAS_NAMES = [
  "박춘봉", "김춘자", "박영식", "김순복", "김영자",
  "권칠봉", "최순자", "안경숙", "곽금철", "곽철수",
  "이용식", "나재민", "이병수", "신미영", "왕기철",
  "천득수", "미셸박", "최보경", "신짱구", "하츄핑",
  "노진구", "마철수", "엄준식", "코난", "고기철",
];

/* 프로필 아이콘 색. 모양은 전원 같은 사람 실루엣이고 색만 달라서,
   익명은 유지하면서도 명단에서 서로를 눈으로 구분할 수 있다.
   노르 톤에 맞춰 채도를 낮추고, 바로 옆자리끼리 비슷한 색이 오지 않도록 순서를 섞어 두었다. */
export const ALIAS_COLORS = [
  "#C9524A", "#4FA3C9", "#D8A14A", "#7FA86B", "#A072C4",
  "#CF6D96", "#5FA89C", "#C98A4A", "#6E85C4", "#B5544A",
  "#8FA84A", "#B06BA8", "#4A96A8", "#D1884A", "#6FA8D4",
  "#A85F6E", "#79A88A", "#9A7BC4", "#C4694A", "#5A9BB5",
  "#B89A4A", "#8A6BC4", "#4FA07A", "#C45F7E", "#7A8FA8",
];

/** Fisher-Yates. gameEngine의 shuffle과 같은 방식이지만, 여기서만 쓰므로 따로 둔다. */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 대기열에 가명을 배정해 새 배열을 돌려준다. 원본은 건드리지 않는다.
 *
 * @param {Array} queueUsers  [{ channelId, nickname, profileImageUrl }]
 * @param {string|null} adminChannelId  이 사람만 원래 닉네임·프사를 유지한다
 * @returns {Array} [{ channelId, nickname(표시용), realName, profileImageUrl, aliasColor, isAliased }]
 *
 * 이름이 모자라면(참가자가 목록보다 많으면) 뒤쪽 사람에게 "박춘봉2" 처럼 번호를 붙인다.
 * 지금 최대 인원(24명)보다 목록이 길어서 실제로는 일어나지 않지만,
 * 인원 상한이 늘어나도 조용히 같은 이름 두 명이 생기는 일은 없어야 한다.
 */
export function assignAliases(queueUsers, adminChannelId) {
  // 테스트 플레이어는 관리자가 구분하려고 직접 이름을 붙여 넣은 자리다.
  // 여기에 가명을 씌우면 "누가 누구인지 보려고" 만든 기능이 무용지물이 되므로 그대로 둔다.
  const keepsRealName = (u) => u.channelId === adminChannelId || u.isTestPlayer || String(u.channelId).startsWith("test-");
  const targets = queueUsers.filter((u) => !keepsRealName(u));
  const names = shuffle(ALIAS_NAMES);
  const colors = shuffle(ALIAS_COLORS);

  const picked = new Map(); // channelId -> { name, color }
  targets.forEach((u, i) => {
    const round = Math.floor(i / names.length);
    const base = names[i % names.length];
    picked.set(u.channelId, {
      name: round === 0 ? base : `${base}${round + 1}`,
      color: colors[i % colors.length],
    });
  });

  return queueUsers.map((u) => {
    const alias = picked.get(u.channelId);
    if (!alias) {
      // 관리자 - 원래 모습 그대로
      return { ...u, realName: u.nickname, aliasColor: null, isAliased: false };
    }
    return {
      ...u,
      nickname: alias.name,
      realName: u.nickname,
      profileImageUrl: null, // 치지직 프사 대신 색만 다른 공용 아이콘을 쓴다
      aliasColor: alias.color,
      isAliased: true,
    };
  });
}
