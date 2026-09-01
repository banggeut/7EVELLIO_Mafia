import fs from "fs";
import path from "path";

/**
 * 명예(名譽) 점수 영구 저장소.
 *
 * 기본 저장 경로는 서버 코드 옆의 ./data/honors.json 인데, 이건 Render 같은 플랫폼에서는
 * 재배포할 때마다 통째로 사라지는 "임시" 파일시스템이다. 서버를 껐다 켜거나 업데이트해도
 * 유지되게 하려면, Render 대시보드에서 이 서비스에 Persistent Disk를 추가하고(예: /data 경로에
 * 마운트) 환경변수 HONOR_DATA_PATH를 그 마운트 경로 아래(예: /data/honors.json)로 지정해야 한다.
 * HONOR_DATA_PATH가 없으면 로컬 개발용으로 ./data/honors.json을 그대로 쓴다.
 */
const DATA_PATH = process.env.HONOR_DATA_PATH || path.join(process.cwd(), "data", "honors.json");

let cache = null; // { [channelId]: { nickname, honor } }

function ensureLoaded() {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    cache = JSON.parse(raw);
  } catch {
    cache = {}; // 파일이 없거나 읽기 실패 - 빈 상태로 새로 시작
  }
  return cache;
}

function persist() {
  try {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(cache, null, 2), "utf-8");
  } catch (e) {
    console.error("[honorStore] 저장 실패:", e.message, "- 경로:", DATA_PATH);
  }
}

/** 특정 사람에게 명예 1점을 더하고, 최근 닉네임을 갱신한 뒤 즉시 디스크에 저장한다. */
export function addHonor(channelId, nickname) {
  const data = ensureLoaded();
  const entry = data[channelId] || { nickname, honor: 0 };
  entry.nickname = nickname || entry.nickname;
  entry.honor += 1;
  data[channelId] = entry;
  persist();
  return entry.honor;
}

/** 특정 사람의 누적 명예 점수를 가져온다 (없으면 0). */
export function getHonor(channelId) {
  const data = ensureLoaded();
  return data[channelId]?.honor || 0;
}

/** 명예 랭킹 상위 N명을 가져온다. */
export function getTopHonors(limit = 20) {
  const data = ensureLoaded();
  return Object.entries(data)
    .map(([channelId, v]) => ({ channelId, nickname: v.nickname, honor: v.honor }))
    .sort((a, b) => b.honor - a.honor)
    .slice(0, limit);
}
