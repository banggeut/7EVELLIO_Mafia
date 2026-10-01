import fs from "fs";
import path from "path";

/**
 * 플레이어 프로필(명예 점수 + 전적) 영구 저장소.
 *
 * 기본 저장 경로는 서버 코드 옆의 ./data/honors.json 인데, 이건 Render 같은 플랫폼에서는
 * 재배포할 때마다 통째로 사라지는 "임시" 파일시스템이다. 서버를 껐다 켜거나 업데이트해도
 * 유지되게 하려면, Render 대시보드에서 이 서비스에 Persistent Disk를 추가하고 환경변수
 * HONOR_DATA_PATH를 그 마운트 경로 아래(예: /var/data/honors.json)로 지정해야 한다.
 * HONOR_DATA_PATH가 없으면 로컬 개발용으로 ./data/honors.json을 그대로 쓴다.
 */
const DATA_PATH = process.env.HONOR_DATA_PATH || path.join(process.cwd(), "data", "honors.json");

/**
 * 게임 결과로 자동 적립되는 포인트.
 * 명예(honor)는 사람들이 서로 "선물"하는 점수라 운영상 손으로 조정되지만,
 * 포인트는 순수하게 "게임을 했다"는 기록이므로 둘을 같은 칸에 섞지 않는다.
 * 값을 바꾸려면 여기만 고치면 서버·화면·관리자 페이지에 한 번에 반영된다.
 */
export const POINTS_PER_WIN = 5;
export const POINTS_PER_LOSS = 1;

let cache = null; // { [channelId]: { nickname, honor, points, gamesPlayed, wins, losses, warnings } }

function ensureLoaded() {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    cache = JSON.parse(raw);
    if (!cache || typeof cache !== "object" || Array.isArray(cache)) throw new Error("형식이 올바르지 않음");
  } catch (e) {
    if (e && e.code === "ENOENT") {
      cache = {}; // 아직 저장 파일이 없는 첫 실행 - 정상
    } else {
      // 파일이 깨졌다면 조용히 빈 상태로 시작하면 다음 저장 때 그대로 덮어써서 영영 복구할 수 없다.
      // 깨진 파일을 따로 보관하고, 사람이 알아볼 수 있게 크게 경고한다.
      const broken = `${DATA_PATH}.corrupt-${Date.now()}`;
      try { fs.renameSync(DATA_PATH, broken); } catch { /* 옮기지 못해도 진행은 한다 */ }
      console.error(`\n[중요] 명예·전적 저장 파일을 읽지 못했습니다 (${e.message}).\n       깨진 파일은 ${broken} 로 옮겨두었고, 빈 상태로 시작합니다.\n       예전 기록이 필요하면 그 파일을 확인해주세요.\n`);
      cache = {};
    }
  }
  return cache;
}

/**
 * 저장은 "임시 파일에 쓴 뒤 이름 바꾸기"로 한다.
 * 바로 덮어쓰면 쓰는 도중에 서버가 죽었을 때 반쪽짜리 파일이 남아 기록이 통째로 날아간다.
 */
let persistTimer = null;
function persistNow() {
  try {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    const tmp = `${DATA_PATH}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(cache), "utf-8");
    fs.renameSync(tmp, DATA_PATH);
  } catch (e) {
    console.error("[honorStore] 저장 실패:", e.message, "- 경로:", DATA_PATH);
  }
}
/** 짧은 시간에 여러 번 바뀌어도 디스크 쓰기는 한 번만 한다 (게임 종료 직후처럼 몰릴 때) */
function persist() {
  topHonorsCache = null; // 점수가 바뀌었으니 랭킹 캐시를 버린다
  topPointsCache = null;
  if (persistTimer) return;
  persistTimer = setTimeout(() => { persistTimer = null; persistNow(); }, 300);
  persistTimer.unref?.();
}
/** 서버를 끄기 전처럼 즉시 확정 저장이 필요할 때 */
export function flush() {
  if (persistTimer) { clearTimeout(persistTimer); persistTimer = null; }
  persistNow();
}

function getOrCreateEntry(data, channelId, nickname) {
  const entry = data[channelId] || { nickname, honor: 0, points: 0, gamesPlayed: 0, wins: 0, losses: 0, warnings: 0 };
  if (nickname) entry.nickname = nickname;
  // 예전 데이터 호환 - 필드가 없던 시절 기록이면 0으로 채워준다.
  entry.gamesPlayed = entry.gamesPlayed || 0;
  entry.points = entry.points || 0; // 포인트가 생기기 전의 기록이면 0부터 시작한다
  entry.wins = entry.wins || 0;
  entry.losses = entry.losses || 0;
  entry.warnings = entry.warnings || 0;
  data[channelId] = entry;
  return entry;
}

/** 명예 3점을 소모해서 경고 1회를 자동으로 줄인다. 명예가 쌓일 때마다(또는 경고를 받을 때) 호출한다. */
function applyWarningRedemption(entry) {
  while (entry.warnings > 0 && entry.honor >= 3) {
    entry.honor -= 3;
    entry.warnings -= 1;
  }
}

/** 특정 사람에게 명예 1점을 더하고, 최근 닉네임을 갱신한 뒤 즉시 디스크에 저장한다. */
export function addHonor(channelId, nickname) {
  const data = ensureLoaded();
  const entry = getOrCreateEntry(data, channelId, nickname);
  entry.honor += 1;
  applyWarningRedemption(entry); // 명예가 3점 쌓일 때마다 경고가 자동으로 하나씩 줄어든다
  persist();
  return entry.honor;
}

/** 관리자가 특정 사람에게 경고 1회를 준다. 3회가 되면 게임 참여가 제한된다. */
export function addWarning(channelId, nickname) {
  const data = ensureLoaded();
  const entry = getOrCreateEntry(data, channelId, nickname);
  entry.warnings += 1;
  applyWarningRedemption(entry); // 이미 쌓아둔 명예가 3점 이상이면 그 자리에서 바로 상쇄된다
  persist();
  return entry.warnings;
}

/** 경고 누적으로 게임 참여가 제한된 상태인지 확인한다 (경고 3회 이상). */
export function isBanned(channelId) {
  const data = ensureLoaded();
  return (data[channelId]?.warnings || 0) >= 3;
}

/**
 * 게임 하나가 끝날 때마다, 참여했던 각 플레이어의 총 게임 수·승/패를 기록하고 포인트를 적립한다.
 * 적립량은 pointsEngine 이 "진영 기본점 + 이번 판에 해낸 일들"로 계산해서 넘겨준다.
 * (진 사람도 받는 이유: 끝까지 남아 판을 채워준 것 자체에 대한 보상이라, 중도 이탈을 줄인다)
 * 반환값의 earned/total 은 게임 종료 화면에서 "+5 포인트" 를 보여주는 데 쓴다.
 */
export function recordGameResult(channelId, nickname, won, earnedOverride) {
  const data = ensureLoaded();
  const entry = getOrCreateEntry(data, channelId, nickname);
  entry.gamesPlayed += 1;
  if (won) entry.wins += 1;
  else entry.losses += 1;
  // 정산기(pointsEngine)가 계산한 값이 오면 그걸 쓰고, 없으면 기본값으로 떨어진다.
  const earned = Number.isFinite(earnedOverride) ? Math.max(0, Math.round(earnedOverride)) : (won ? POINTS_PER_WIN : POINTS_PER_LOSS);
  entry.points += earned;
  persist();
  return { entry, earned, total: entry.points };
}

/** 특정 사람의 전체 프로필(명예 점수 + 전적)을 가져온다. 기록이 없으면 전부 0으로 채워 반환한다. */
export function getProfile(channelId) {
  const data = ensureLoaded();
  const entry = data[channelId];
  return {
    honor: entry?.honor || 0,
    points: entry?.points || 0,
    gamesPlayed: entry?.gamesPlayed || 0,
    wins: entry?.wins || 0,
    losses: entry?.losses || 0,
    warnings: entry?.warnings || 0,
  };
}

/** 특정 사람의 누적 명예 점수를 가져온다 (없으면 0). */
export function getHonor(channelId) {
  const data = ensureLoaded();
  return data[channelId]?.honor || 0;
}

/** 관리자가 특정 사람의 명예 점수를 직접 지정한다 (음수 방지, 정수로 반올림). */
export function setHonor(channelId, nickname, value) {
  const data = ensureLoaded();
  const entry = getOrCreateEntry(data, channelId, nickname);
  entry.honor = Math.max(0, Math.round(Number(value) || 0));
  persist();
  return entry;
}

/** 관리자가 특정 사람의 경고 횟수를 직접 지정한다 (음수 방지, 정수로 반올림). */
export function setWarnings(channelId, nickname, value) {
  const data = ensureLoaded();
  const entry = getOrCreateEntry(data, channelId, nickname);
  entry.warnings = Math.max(0, Math.round(Number(value) || 0));
  persist();
  return entry;
}

/** 관리자가 특정 사람의 포인트를 직접 지정한다 (음수 방지, 정수로 반올림). */
export function setPoints(channelId, nickname, value) {
  const data = ensureLoaded();
  const entry = getOrCreateEntry(data, channelId, nickname);
  entry.points = Math.max(0, Math.round(Number(value) || 0));
  persist();
  return entry;
}

/** 관리자 페이지용 - 기록이 있는 모든 사람의 명예/경고/전적 목록. */
export function getAllHonorProfiles() {
  const data = ensureLoaded();
  return Object.entries(data).map(([channelId, v]) => ({
    channelId,
    nickname: v.nickname,
    honor: v.honor || 0,
    points: v.points || 0,
    warnings: v.warnings || 0,
    gamesPlayed: v.gamesPlayed || 0,
    wins: v.wins || 0,
    losses: v.losses || 0,
  }));
}

/** 포인트 랭킹 상위 N명. (명예 랭킹과 같은 이유로 캐시한다) */
let topPointsCache = null; // { limit, list }
export function getTopPoints(limit = 20) {
  if (topPointsCache && topPointsCache.limit === limit) return topPointsCache.list;
  const data = ensureLoaded();
  const list = Object.entries(data)
    .map(([channelId, v]) => ({ channelId, nickname: v.nickname, points: v.points || 0 }))
    .filter((e) => e.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, limit);
  topPointsCache = { limit, list };
  return list;
}

/** 명예 랭킹 상위 N명을 가져온다. (모든 접속자에게 매번 보내는 값이라 결과를 캐시한다) */
let topHonorsCache = null; // { limit, list }
export function getTopHonors(limit = 20) {
  if (topHonorsCache && topHonorsCache.limit === limit) return topHonorsCache.list;
  const data = ensureLoaded();
  const list = Object.entries(data)
    .map(([channelId, v]) => ({ channelId, nickname: v.nickname, honor: v.honor }))
    .sort((a, b) => b.honor - a.honor)
    .slice(0, limit);
  topHonorsCache = { limit, list };
  return list;
}
