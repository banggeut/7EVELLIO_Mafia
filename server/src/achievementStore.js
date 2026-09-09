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
    title: "🌾 명예시민", // 채팅에 표시될 칭호 텍스트 - 시민팀 상징 이모지로 꾸밈
    desc: "직업이 없는 무직 시민 상태로 게임에서 승리했을 때 자동으로 획득합니다.",
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
