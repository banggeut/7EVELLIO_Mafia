import fs from "fs";
import path from "path";

/**
 * 업적/칭호 영구 저장소. honorStore.js와 동일한 파일시스템 저장 방식을 쓴다.
 * Render 등에서 재배포해도 유지되게 하려면 ACHIEVEMENT_DATA_PATH를 Persistent Disk
 * 마운트 경로 아래로 지정해야 한다(HONOR_DATA_PATH와 동일한 원리).
 */
const DATA_PATH = process.env.ACHIEVEMENT_DATA_PATH || path.join(process.cwd(), "data", "achievements.json");

/** 업적 카탈로그 - 여기 새 업적을 추가하면 관리자 페이지에서 바로 수여할 수 있게 된다. */
export const ACHIEVEMENTS = {
  honorable_citizen: {
    id: "honorable_citizen",
    name: "명예시민",
    title: "🌾 명예시민",
    desc: "직업이 없는 무직 시민 상태로 게임에서 승리",
  },
  master_physician: {
    id: "master_physician",
    name: "명의",
    title: "💉 명의",
    desc: "의사 상태로 한 게임에서 다섯 번 사람을 살림",
  },
  elite_detective: {
    id: "elite_detective",
    name: "엘리트 수사관",
    title: "🔍 엘리트 수사관",
    desc: "경찰 상태로 조사만으로 그 게임의 마피아팀을 전부 찾아냄 (조사로 밝힐 수 없는 마피아팀 특수직업 제외)",
  },
  righteous_journalist: {
    id: "righteous_journalist",
    name: "정론직필",
    title: "📰 정론직필",
    desc: "기자 상태로 특종 능력으로 마피아를 밝혀냄",
  },
  tanker: {
    id: "tanker",
    name: "탱커",
    title: "🛡️ 탱커",
    desc: "군인 상태로 마피아의 습격을 막아낸 뒤, 다시 마피아에게 습격당해 목숨을 잃음",
  },
  this_is_my_turf: {
    id: "this_is_my_turf",
    name: "여긴 내 구역이야",
    title: "🗡️ 여긴 내 구역이야",
    desc: "건달 상태로 용병과 접선해 중립으로 승리",
  },
  for_you: {
    id: "for_you",
    name: "너를 위해서",
    title: "💍 너를 위해서",
    desc: "신혼부부 상태로 복수 능력을 발동해 마피아를 처치",
  },
  great_detective_rabbi: {
    id: "great_detective_rabbi",
    name: "명탐정 라삐",
    title: "🕵️ 명탐정 라삐",
    desc: "탐정 상태로 스파이의 정체를 알아낸 뒤, 다음날 낮 투표로 그 스파이를 처형시킴",
  },
  vampire_hunter: {
    id: "vampire_hunter",
    name: "뱀파이어 사냥꾼",
    title: "🥀 뱀파이어 사냥꾼",
    desc: "성직자 상태로 뱀파이어의 정체를 알아낸 뒤, 다음날 낮 투표로 그 뱀파이어를 처형시킴",
  },
  ill_leave_my_back_to_you: {
    id: "ill_leave_my_back_to_you",
    name: "뒤를 부탁한다",
    title: "🕴️ 뒤를 부탁한다",
    desc: "경호원 상태로 의사를 지키다 대신 목숨을 잃음",
  },
  best_teacher: {
    id: "best_teacher",
    name: "최고의 스승",
    title: "🍎 최고의 스승",
    desc: "교사 상태로 학생을 졸업시키고, 교사·학생 둘 다 끝까지 살아남아 시민팀 승리",
  },
  best_student: {
    id: "best_student",
    name: "최고의 제자",
    title: "🎓 최고의 제자",
    desc: "학생 상태로 졸업에 성공하고, 교사·학생 둘 다 끝까지 살아남아 시민팀 승리",
  },
  tried_to_destroy_the_world: {
    id: "tried_to_destroy_the_world",
    name: "세계를 멸망시켜봤습니다",
    title: "😈 세계를 멸망시켜봤습니다",
    desc: "악마 숭배자 상태로 중립 승리",
  },
  vampire_lord: {
    id: "vampire_lord",
    name: "뱀파이어 로드",
    title: "🧛 뱀파이어 로드",
    desc: "뱀파이어 상태로 끝까지 살아남아 중립 승리",
  },
  well_fed_im_off: {
    id: "well_fed_im_off",
    name: "잘 먹고 갑니다",
    title: "💎 잘 먹고 갑니다",
    desc: "괴도 상태로 중립 승리",
  },
  alpha: {
    id: "alpha",
    name: "ALPHA",
    title: "🐺 ALPHA",
    desc: "늑대인간 상태로, 마피아와 동맹하지 않고 단독으로 중립 승리",
  },
  im_a_detective_nya: {
    id: "im_a_detective_nya",
    name: "탐정이다냥",
    title: "🐱 탐정이다냥",
    desc: "고양이 상태로 시민팀에 편입되어 끝까지 살아남아 시민팀 승리",
  },
  nyanya_punch: {
    id: "nyanya_punch",
    name: "냥냥펀치",
    title: "🐾 냥냥펀치",
    desc: "고양이 상태로 마피아팀에 편입되어 끝까지 살아남아 마피아팀 승리",
  },
  stray_cat: {
    id: "stray_cat",
    name: "길냥이",
    title: "🐈 길냥이",
    desc: "고양이 상태로 집사를 선택하지 않았는데도 시민팀이 승리",
  },
  final_boss: {
    id: "final_boss",
    name: "최종보스",
    title: "👑 최종보스",
    desc: "대부 상태로 건달을 영입한 뒤, 건달과 함께 끝까지 살아남아 마피아팀 승리",
  },
  wont_go_alone: {
    id: "wont_go_alone",
    name: "혼자는 안가요",
    title: "💣 혼자는 안가요",
    desc: "테러리스트 상태로 투표로 처형되며, 시민팀 필수직업 중 한 명과 함께 자폭",
  },
  genius_hacker: {
    id: "genius_hacker",
    name: "천재 해커",
    title: "💻 천재 해커",
    desc: "해커 상태로 조작한 대상이 다음날 낮 기자의 특종으로 마피아로 공개됨",
  },
  good_citizen: {
    id: "good_citizen",
    name: "선량한 시민",
    title: "🌱 선량한 시민",
    desc: "시민팀 소속으로 끝까지 살아남아 시민팀 승리",
  },
  honorable_mafia: {
    id: "honorable_mafia",
    name: "명예 마피아",
    title: "🔫 명예 마피아",
    desc: "마피아팀 소속으로 끝까지 살아남아 마피아팀 승리",
  },
  why_did_i_win: {
    id: "why_did_i_win",
    name: "왜 이겼지?",
    title: "🛋️ 왜 이겼지?",
    desc: "백수 상태로 끝내 직업을 갖지 못한 채 끝까지 살아남아 시민팀 승리",
  },
};

let cache = null; // { [channelId]: { nickname, achievements: [id,...], activeTitle: string|null } }

function ensureLoaded() {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    cache = JSON.parse(raw);
  } catch {
    cache = {};
  }
  return cache;
}

function persist() {
  try {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(cache, null, 2), "utf-8");
  } catch (e) {
    console.error("[achievementStore] 저장 실패:", e.message, "- 경로:", DATA_PATH);
  }
}

function getOrCreateEntry(data, channelId, nickname) {
  const entry = data[channelId] || { nickname, achievements: [], activeTitle: null };
  if (nickname) entry.nickname = nickname;
  entry.achievements = entry.achievements || [];
  data[channelId] = entry;
  return entry;
}

/** 특정 사람에게 업적을 수여한다. 이미 갖고 있으면 아무 일도 하지 않는다(중복 방지).
 *  칭호를 자동으로 장착하지는 않는다 - 장착 여부는 본인이 대기실에서 직접 고른다. */
export function grantAchievement(channelId, nickname, achievementId) {
  if (!ACHIEVEMENTS[achievementId]) return { ok: false, error: "존재하지 않는 업적입니다." };
  const data = ensureLoaded();
  const entry = getOrCreateEntry(data, channelId, nickname);
  if (!entry.achievements.includes(achievementId)) {
    entry.achievements.push(achievementId);
  }
  persist();
  return { ok: true, entry };
}

/** 관리자가 특정 사람의 활성 칭호를 직접 지정한다 (소유 여부 확인 없이 강제로, 또는 해제하려면 null). */
export function setActiveTitle(channelId, title) {
  const data = ensureLoaded();
  const entry = getOrCreateEntry(data, channelId, null);
  entry.activeTitle = title || null;
  persist();
  return entry;
}

/** 플레이어 본인이 자신의 칭호를 장착/해제한다. 본인이 실제로 보유한 업적의 칭호인지 확인 후에만 허용한다. */
export function setMyActiveTitle(channelId, title) {
  const data = ensureLoaded();
  const entry = getOrCreateEntry(data, channelId, null);
  if (!title) {
    entry.activeTitle = null; // 해제는 항상 허용
    persist();
    return { ok: true, entry };
  }
  const owns = (entry.achievements || []).some((id) => ACHIEVEMENTS[id]?.title === title);
  if (!owns) return { ok: false, error: "보유하지 않은 칭호입니다." };
  entry.activeTitle = title;
  persist();
  return { ok: true, entry };
}

/** 특정 사람의 업적을 전부 초기화한다(칭호도 함께 해제). 관리자 전용. */
export function resetAchievements(channelId) {
  const data = ensureLoaded();
  const entry = getOrCreateEntry(data, channelId, null);
  entry.achievements = [];
  entry.activeTitle = null;
  persist();
  return { ok: true, entry };
}

/** 특정 사람이 보유한 업적 id 목록. */
export function getAchievements(channelId) {
  const data = ensureLoaded();
  return data[channelId]?.achievements || [];
}

/** 특정 사람이 업적을 통해 얻어 "장착 가능한" 칭호 목록. */
export function getOwnedTitles(channelId) {
  const ids = getAchievements(channelId);
  return ids.map((id) => ACHIEVEMENTS[id]).filter(Boolean).map((a) => ({ achievementId: a.id, title: a.title, name: a.name }));
}

/** 특정 사람의 현재 활성 칭호 (없으면 null). */
export function getActiveTitle(channelId) {
  const data = ensureLoaded();
  return data[channelId]?.activeTitle || null;
}

/** 관리자 페이지용 - 기록이 있는 모든 사람의 업적/칭호 목록. */
export function getAllAchievementProfiles() {
  const data = ensureLoaded();
  return Object.entries(data).map(([channelId, v]) => ({
    channelId,
    nickname: v.nickname,
    achievements: v.achievements || [],
    activeTitle: v.activeTitle || null,
  }));
}
