/**
 * 효과음 모듈 — 실제 mp3 파일 없이 Web Audio API로 즉석 합성합니다.
 * 나중에 진짜 녹음된 효과음으로 바꾸고 싶다면, 이 파일의 각 play* 함수 내부만
 * `new Audio('/sounds/xxx.mp3').play()` 형태로 바꿔치기하면 됩니다.
 */

const ENABLED_KEY = "levellio_mafia_sound_enabled";
const VOLUME_KEY = "levellio_mafia_sound_volume";

let ctx = null;
function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    // 효과음이 유튜브·라이브 방송(팝업/PIP)을 멈추지 않도록, 다른 소리와 "섞여서" 나는 오디오로 선언한다.
    // (iOS Safari 16.4+ 지원. 이 모드에서는 아이폰 무음 스위치를 켜면 효과음도 꺼진다)
    try { if (navigator.audioSession) navigator.audioSession.type = "ambient"; } catch { /* 미지원 브라우저 */ }
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function isSoundEnabled() {
  if (typeof window === "undefined") return true;
  const v = window.localStorage.getItem(ENABLED_KEY);
  return v === null ? true : v === "1";
}
export function setSoundEnabled(on) {
  window.localStorage.setItem(ENABLED_KEY, on ? "1" : "0");
}

/** 0~100 사이 볼륨. 기본값 70. */
export function getVolume() {
  if (typeof window === "undefined") return 70;
  const raw = window.localStorage.getItem(VOLUME_KEY);
  const n = raw === null ? 70 : Number(raw);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 70;
}
export function setVolume(v) {
  const clamped = Math.max(0, Math.min(100, Math.round(v)));
  window.localStorage.setItem(VOLUME_KEY, String(clamped));
}

function tone({ freq, duration = 0.15, type = "sine", gain = 0.15, delay = 0 }) {
  if (!isSoundEnabled()) return;
  const volumeFactor = getVolume() / 100;
  if (volumeFactor <= 0) return;
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  const t0 = c.currentTime + delay;
  osc.frequency.setValueAtTime(freq, t0);
  const peak = Math.max(0.0002, gain * volumeFactor);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.03);
}

/* 버튼 → 서버 행동(투표·능력 사용 등)으로 이어지는 클릭은 그 행동 전용 효과음이 대신 울린다.
   Button의 클릭음은 onClick보다 먼저 호출되므로, 아주 잠깐 기다렸다가 그사이 행동음이 나왔으면 생략한다. */
let lastActionSoundAt = 0;
function deferredUiSound(name, synth) {
  if (typeof window === "undefined") return;
  setTimeout(() => {
    if (Date.now() - lastActionSoundAt < 120) return;
    playPlayerSample(name, { fallback: synth });
  }, 20);
}

/** 버튼 클릭음 (타자기 키) */
export function playClick() {
  deferredUiSound("ui_click", () => tone({ freq: 900, duration: 0.045, type: "square", gain: 0.06 }));
}
/** 칩(선택지) 선택음 (금속 걸쇠) */
export function playSelect() {
  deferredUiSound("ui_select", () => tone({ freq: 1100, duration: 0.04, type: "triangle", gain: 0.06 }));
}
/** 설정 스위치 */
export function playToggle() {
  playPlayerSample("ui_toggle", { fallback: () => tone({ freq: 700, duration: 0.05, type: "square", gain: 0.05 }) });
}
/** 오류 알림 (빈 총 철컥) */
export function playError() {
  playPlayerSample("ui_error", { fallback: () => tone({ freq: 160, duration: 0.2, type: "sawtooth", gain: 0.1 }) });
}

/** 낮 → 밤 전환 (내려가는 저음) */
export function playNightFall() {
  tone({ freq: 392, duration: 0.35, type: "sine", gain: 0.12 });
  tone({ freq: 261.6, duration: 0.55, type: "sine", gain: 0.12, delay: 0.15 });
  tone({ freq: 196, duration: 0.7, type: "sine", gain: 0.1, delay: 0.32 });
}

/** 밤 → 낮 전환 (밝게 올라가는 3화음) */
export function playDayBreak() {
  tone({ freq: 523.25, duration: 0.2, type: "sine", gain: 0.13 });
  tone({ freq: 659.25, duration: 0.22, type: "sine", gain: 0.13, delay: 0.12 });
  tone({ freq: 783.99, duration: 0.4, type: "sine", gain: 0.15, delay: 0.26 });
}

/** 투표 확정음 */
export function playVote() {
  tone({ freq: 660, duration: 0.08, type: "triangle", gain: 0.1 });
  tone({ freq: 880, duration: 0.1, type: "triangle", gain: 0.08, delay: 0.06 });
}

/** 투표로 처형될 때 (무거운 타종 느낌) */
export function playElimination() {
  tone({ freq: 130.8, duration: 0.9, type: "sawtooth", gain: 0.16 });
  tone({ freq: 98, duration: 1.1, type: "sine", gain: 0.14, delay: 0.06 });
  tone({ freq: 65.4, duration: 1.2, type: "sine", gain: 0.1, delay: 0.15 });
}

/** 밤사이 마피아에게 살해당했을 때 (음산한 하강음) */
export function playMafiaKill() {
  tone({ freq: 220, duration: 0.5, type: "sawtooth", gain: 0.14 });
  tone({ freq: 164.8, duration: 0.6, type: "sine", gain: 0.13, delay: 0.1 });
  tone({ freq: 110, duration: 0.8, type: "sine", gain: 0.1, delay: 0.22 });
}

/** 의사가 살리기에 성공했을 때 (반짝이는 상승음, 의사 본인에게만 재생) */
export function playDoctorSave() {
  tone({ freq: 784, duration: 0.12, type: "sine", gain: 0.12 });
  tone({ freq: 987.77, duration: 0.14, type: "sine", gain: 0.12, delay: 0.09 });
  tone({ freq: 1318.5, duration: 0.25, type: "sine", gain: 0.14, delay: 0.18 });
}

/** 신문 호외 특종 공개 (경쾌한 타자기/벨 느낌의 이중 딩) */
export function playNewsFlash() {
  tone({ freq: 1046.5, duration: 0.07, type: "square", gain: 0.09 });
  tone({ freq: 1318.5, duration: 0.1, type: "square", gain: 0.09, delay: 0.09 });
  tone({ freq: 1568, duration: 0.18, type: "sine", gain: 0.1, delay: 0.19 });
}

/** 피싱의 스팸 문자 공지 갱신 - 짧은 문자 알림음 느낌의 이중 딩 */
export function playPhishingAlert() {
  // 휴대폰 문자 알림음처럼 "띠-링 띠-링" (파일을 못 불러올 때만 쓰는 합성음)
  [[0, 1318.5], [0.12, 1975.5], [0.42, 1318.5], [0.54, 1975.5]].forEach(([delay, freq]) =>
    tone({ freq, duration: 0.32, type: "sine", gain: 0.1, delay }));
}

/** 극적인 순간 전환용 임팩트음 (테러리스트 폭발, 정치인 면역, 군인 생존 등) */
export function playDramaticHit() {
  tone({ freq: 90, duration: 0.5, type: "square", gain: 0.16 });
  tone({ freq: 220, duration: 0.3, type: "sawtooth", gain: 0.1, delay: 0.02 });
  tone({ freq: 55, duration: 0.7, type: "sine", gain: 0.14, delay: 0.1 });
}

/** 늑대인간의 하울링 (밤에 습격당한 사람 발표 시 재생) - 진짜 음정을 미끄러뜨려서 울부짖는 소리를 낸다 */
export function playWerewolfHowl() {
  if (!isSoundEnabled()) return;
  const volumeFactor = getVolume() / 100;
  if (volumeFactor <= 0) return;
  const c = getCtx();
  if (!c) return;

  // 늑대가 "컹! 컹! 컹!" 세 번 짖는 소리 - 각 짖음은 순간적으로 훅 튀었다가 뚝 떨어지는 짧고 굵은 음.
  const barkTimes = [0, 0.24, 0.46];
  barkTimes.forEach((offset, i) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sawtooth";
    const t0 = c.currentTime + offset;
    const startFreq = 260 - i * 12;
    const peak = Math.max(0.0002, (i === 2 ? 0.19 : 0.16) * volumeFactor);

    osc.frequency.setValueAtTime(startFreq, t0);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 0.5, t0 + 0.11);

    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.17);

    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + 0.2);
  });
}

/** 마녀의 저주 (음산하게 흔들리며 내려가는 불협화음) */
export function playCurse() {
  tone({ freq: 466.16, duration: 0.3, type: "sine", gain: 0.1 });
  tone({ freq: 415.3, duration: 0.35, type: "sine", gain: 0.1, delay: 0.14 });
  tone({ freq: 233.08, duration: 0.6, type: "sawtooth", gain: 0.12, delay: 0.28 });
  tone({ freq: 116.54, duration: 0.9, type: "sine", gain: 0.13, delay: 0.42 });
}

/** 고양이 등장 - "야옹~" 하는 울음소리, 음정이 위로 살짝 올라갔다가 부드럽게 흘러내린다 */
export function playMeow() {
  if (!isSoundEnabled()) return;
  const volumeFactor = getVolume() / 100;
  if (volumeFactor <= 0) return;
  const c = getCtx();
  if (!c) return;

  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sine";
  const t0 = c.currentTime;
  const peak = Math.max(0.0002, 0.15 * volumeFactor);

  osc.frequency.setValueAtTime(520, t0);
  osc.frequency.linearRampToValueAtTime(760, t0 + 0.12);
  osc.frequency.linearRampToValueAtTime(430, t0 + 0.55);

  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.06);
  g.gain.setValueAtTime(peak * 0.85, t0 + 0.25);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6);

  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + 0.65);
}

/** 성직자의 부활 - 따뜻하고 신성한 종소리 화음이 위로 퍼져나간다 */
export function playRevive() {
  // 낮은 음부터 차례로 쌓아 올라가는 맑은 화음(도-미-솔-도), 마지막 음은 은은하게 오래 남는다.
  tone({ freq: 392, duration: 0.55, type: "sine", gain: 0.1 });
  tone({ freq: 493.88, duration: 0.55, type: "sine", gain: 0.1, delay: 0.12 });
  tone({ freq: 587.33, duration: 0.6, type: "sine", gain: 0.11, delay: 0.24 });
  tone({ freq: 784, duration: 1.3, type: "sine", gain: 0.13, delay: 0.4 });
  // 반짝이는 배음을 살짝 얹어 신성한 느낌을 더한다.
  tone({ freq: 1568, duration: 0.9, type: "triangle", gain: 0.05, delay: 0.55 });
}

/** 시민팀 승리 - 밝게 상승하는 팡파레 */
export function playCitizenVictory() {
  tone({ freq: 523.25, duration: 0.22, type: "triangle", gain: 0.13 });
  tone({ freq: 659.25, duration: 0.22, type: "triangle", gain: 0.13, delay: 0.16 });
  tone({ freq: 783.99, duration: 0.26, type: "triangle", gain: 0.14, delay: 0.32 });
  tone({ freq: 1046.5, duration: 0.7, type: "sine", gain: 0.17, delay: 0.5 });
  tone({ freq: 1318.5, duration: 0.5, type: "sine", gain: 0.1, delay: 0.58 });
}

/** 마피아팀 승리 - 무겁고 불길한 저음 */
export function playMafiaVictory() {
  tone({ freq: 73.42, duration: 1.3, type: "sawtooth", gain: 0.18 });
  tone({ freq: 98, duration: 0.9, type: "square", gain: 0.09, delay: 0.08 });
  tone({ freq: 46.25, duration: 1.6, type: "sine", gain: 0.17, delay: 0.25 });
  tone({ freq: 138.59, duration: 0.4, type: "sawtooth", gain: 0.07, delay: 0.7 });
}

/** 악마 숭배자 승리 - 주술적인 하강 불협화음 */
export function playCultistVictory() {
  tone({ freq: 220, duration: 0.4, type: "sine", gain: 0.12 });
  tone({ freq: 174.61, duration: 0.5, type: "sine", gain: 0.12, delay: 0.22 });
  tone({ freq: 130.81, duration: 0.9, type: "sawtooth", gain: 0.14, delay: 0.46 });
  tone({ freq: 65.41, duration: 1.3, type: "sine", gain: 0.16, delay: 0.68 });
}

/** 뱀파이어팀 승리 - 스산하게 울리는 하강음 */
export function playVampireVictory() {
  tone({ freq: 349.23, duration: 0.3, type: "sine", gain: 0.12 });
  tone({ freq: 293.66, duration: 0.35, type: "sine", gain: 0.12, delay: 0.16 });
  tone({ freq: 174.61, duration: 0.7, type: "sawtooth", gain: 0.13, delay: 0.34 });
  tone({ freq: 87.31, duration: 1.1, type: "sine", gain: 0.15, delay: 0.55 });
}

/** 괴도 승리 - 장난스럽고 능청맞은 상승 음형에, 보석이 반짝이는 듯한 글리산도로 마무리 */
export function playThiefVictory() {
  tone({ freq: 392, duration: 0.12, type: "triangle", gain: 0.11 });
  tone({ freq: 466.16, duration: 0.12, type: "triangle", gain: 0.11, delay: 0.1 });
  tone({ freq: 587.33, duration: 0.12, type: "triangle", gain: 0.12, delay: 0.2 });
  tone({ freq: 698.46, duration: 0.22, type: "triangle", gain: 0.13, delay: 0.3 });
  // 마지막 "짜잔" 하는 반짝임 - 짧은 고음들이 빠르게 이어짐
  [1174.7, 1318.5, 1567.98, 1760].forEach((freq, i) => {
    tone({ freq, duration: 0.16, type: "sine", gain: 0.08, delay: 0.55 + i * 0.07 });
  });
}

/** 용병+건달 동맹 승리 - 거칠고 날카로운 단조 진행, 칼날이 부딪히는 듯한 임팩트로 마무리 */
export function playMercenaryVictory() {
  tone({ freq: 196, duration: 0.16, type: "sawtooth", gain: 0.12 });
  tone({ freq: 233.08, duration: 0.16, type: "sawtooth", gain: 0.12, delay: 0.14 });
  tone({ freq: 174.61, duration: 0.22, type: "sawtooth", gain: 0.13, delay: 0.28 });
  tone({ freq: 1567.98, duration: 0.05, type: "square", gain: 0.14, delay: 0.5 });
  tone({ freq: 2093, duration: 0.08, type: "square", gain: 0.12, delay: 0.54 });
  tone({ freq: 130.81, duration: 0.9, type: "sawtooth", gain: 0.15, delay: 0.62 });
}


/* ============================================================
   방송 화면 전용 "실제 녹음" 효과음 (public/sounds/broadcast/*.mp3)
   - 전부 CC0(퍼블릭 도메인) 녹음 샘플을 겹쳐 만든 파일이다. 출처: public/sounds/broadcast/CREDITS.md
   - 파일을 못 불러오거나 재생이 막히면 fallback(기존 합성음)으로 대신 울린다.
   - 효과음을 바꾸고 싶으면 같은 이름의 mp3로 덮어쓰기만 하면 된다.
   ============================================================ */
const sampleCache = {};

function getSample(name, folder = "broadcast") {
  if (typeof window === "undefined" || typeof Audio === "undefined") return null;
  const key = `${folder}/${name}`;
  if (!sampleCache[key]) {
    const a = new Audio(`/sounds/${key}.mp3`);
    a.preload = "auto";
    sampleCache[key] = a;
  }
  return sampleCache[key];
}

/* 플레이어 화면(PC·모바일)은 효과음 파일도 <audio> 태그 대신 Web Audio로 재생한다.
   모바일에서 <audio>.play()는 "미디어 재생"으로 취급돼 오디오 포커스를 가져가므로,
   팝업/PIP로 틀어둔 유튜브·라이브 방송이 효과음이 날 때마다 멈춰버리기 때문이다.
   (방송 화면=OBS 브라우저 소스는 기존 방식 그대로 둔다) */
let webAudioSamples = false;
const bufferCache = {};
function loadBuffer(key) {
  if (bufferCache[key]) return bufferCache[key];
  const c = getCtx();
  if (!c || typeof fetch === "undefined") return null;
  bufferCache[key] = fetch(`/sounds/${key}.mp3`)
    .then((r) => { if (!r.ok) throw new Error("load"); return r.arrayBuffer(); })
    .then((ab) => new Promise((res, rej) => { const pr = c.decodeAudioData(ab, res, rej); if (pr && pr.then) pr.then(res, rej); }))
    .then((buf) => { bufferCache[key].buffer = buf; return buf; });
  bufferCache[key].catch(() => { bufferCache[key].failed = true; });
  return bufferCache[key];
}
function playBuffer(c, buf, vol) {
  const src = c.createBufferSource();
  const g = c.createGain();
  src.buffer = buf;
  g.gain.value = Math.max(0, Math.min(1, vol));
  src.connect(g).connect(c.destination);
  src.start();
}
function playSampleWebAudio(key, vol, fallback) {
  const c = getCtx();
  const job = c && loadBuffer(key);
  if (!job || job.failed) { fallback && fallback(); return; }
  if (job.buffer) { playBuffer(c, job.buffer, vol); return; }
  const askedAt = Date.now();
  job.then((buf) => { if (Date.now() - askedAt < 1500) playBuffer(c, buf, vol); }, () => fallback && fallback());
}
// 브라우저는 사용자가 화면을 한 번 건드려야 소리를 허용하므로, 첫 터치/클릭/키 입력 때 오디오를 깨워둔다.
function installUnlock() {
  if (typeof window === "undefined" || installUnlock.done) return;
  installUnlock.done = true;
  const unlock = () => {
    const c = getCtx();
    if (c && c.state === "running") ["pointerdown", "touchend", "keydown"].forEach((ev) => window.removeEventListener(ev, unlock, true));
  };
  ["pointerdown", "touchend", "keydown"].forEach((ev) => window.addEventListener(ev, unlock, true));
}

/** 방송 효과음 파일 하나를 재생한다. gain은 파일별 미세 음량 보정(0~1). */
export function playSample(name, { fallback, gain = 1, folder = "broadcast" } = {}) {
  if (!isSoundEnabled()) return;
  const vol = (getVolume() / 100) * gain;
  if (vol <= 0) return;
  if (webAudioSamples) { playSampleWebAudio(`${folder}/${name}`, vol, fallback); return; }
  const base = getSample(name, folder);
  if (!base) { fallback && fallback(); return; }
  try {
    const a = base.cloneNode();
    a.volume = Math.max(0, Math.min(1, vol));
    const p = a.play();
    if (p && typeof p.catch === "function") p.catch(() => fallback && fallback());
  } catch {
    fallback && fallback();
  }
}

export const BROADCAST_SAMPLES = [
  "night_fall", "day_break", "vote_start", "vote_result", "night_death", "doctor_save", "veteran_survived",
  "bodyguard_save", "vampire_fight", "avenger_kill", "werewolf_attack", "priest_revive", "judge_pardon",
  "cat_appeared", "peaceful_morning", "news_flash", "curse_announced", "curse_death", "bomb", "politician_saved",
  "execution", "sheriff_needed", "sheriff_elected", "sheriff_designate", "sheriff_jailed", "sheriff_execute",
  "phishing", "night_lord", "blood_revenge", "last_word", "dictator", "judge_ruling", "judge_plea", "inquisition", "inquisition_execute",
  "official_pick", "saint_save", "elite_guard", "win_mafia", "win_citizen", "win_cultist", "win_vampire", "win_thief", "win_werewolf", "win_mercenary",
];

/** 방송 화면이 열릴 때 한 번 호출해 두면 첫 알림부터 지연 없이 울린다. */
export function preloadBroadcastSamples() {
  BROADCAST_SAMPLES.forEach((n) => { const a = getSample(n); a && a.load(); });
}


/* ============================================================
   플레이어 화면 효과음 (public/sounds/player/*.mp3) — 방송용과 같은 CC0 녹음 샘플로 만든 짧은 조작음
   페이즈 전환(밤·아침·투표·처형 등)은 방송용 파일을 조금 작은 음량으로 같이 쓴다.
   ============================================================ */
export function playPlayerSample(name, opts = {}) {
  playSample(name, { ...opts, folder: "player" });
}

/** 플레이어 화면에서 페이즈가 바뀔 때 쓰는 공통 음량 (방송 파일 재사용 시) */
export const PLAYER_PHASE_GAIN = 0.6;

const ACTION_SOUNDS = {
  REVEAL_ACK: "reveal_ack",
  CHAT_SEND: "chat_send",
  PHISHING_SEND: "chat_send",
  CAST_VOTE: "vote_cast",
  CAST_SHERIFF_ELECTION_VOTE: "vote_cast",
  CAST_JUDGE_TIEBREAK: "vote_cast",
  SHERIFF_DESIGNATE: "vote_cast",
  CAT_REMOVE_VOTE: "vote_cast",
  CAST_SKIP_VOTE: "vote_skip",
  CHOOSE_POWER_CARD: "card_pick",
  HITMAN_POISON: "ability_major",
  TERRORIST_ARSON: "ability_major",
  DOCTOR_HOSPITALIZE: "ability_major",
  WITCH_ANCIENT_CURSE: "ability_major",
};
const SOCKET_EVENT_SOUNDS = {
  join_queue: "queue_join",
  leave_queue: "queue_leave",
  set_my_title: "title_equip",
  give_honor: "honor_give",
  give_warning: "warning_give",
};

/** 플레이어가 서버로 보내는 행동(socket.emit)에 맞는 효과음을 고른다. 관리자 전용 이벤트는 기본 클릭음만 난다. */
export function playActionSound(event, payload) {
  let name = SOCKET_EVENT_SOUNDS[event];
  if (event === "game_action" && payload && payload.type) {
    const t = payload.type;
    if (ACTION_SOUNDS[t]) name = ACTION_SOUNDS[t];
    else if (t === "CAST_FINAL_VOTE" || t === "CAST_JUDGE_VERDICT") name = payload.choice === "agree" ? "final_agree" : "final_disagree";
    else if (t === "CAST_SHERIFF_VERDICT") name = payload.choice === "execute" ? "final_agree" : "final_disagree";
    else name = "night_mark"; // SET_*_TARGET, TERRORIST_MARK, CORONER_INVESTIGATE, COUNSELOR_SELECT, TEACHER_TEACH 등 조사·표적 지정
  }
  if (!name) return;
  lastActionSoundAt = Date.now();
  playPlayerSample(name);
}

export const PLAYER_SAMPLES = [
  "ui_click", "ui_select", "ui_toggle", "ui_error", "chat_send", "queue_join", "queue_leave", "title_equip", "night_mark",
  "vote_cast", "vote_skip", "final_agree", "final_disagree", "card_pick", "ability_major", "reveal_ack", "honor_give",
  "warning_give", "timer_tick", "role_reveal", "power_select", "defense_start", "action_reminder",
];
const PLAYER_PHASE_SAMPLES = ["night_fall", "day_break", "vote_start", "vote_result", "execution", "night_death", "doctor_save",
  "phishing", "sheriff_needed", "win_mafia", "win_citizen", "win_cultist", "win_vampire", "win_thief", "win_werewolf", "win_mercenary"];

export function preloadPlayerSamples() {
  const AC = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
  if (!AC) {
    PLAYER_SAMPLES.forEach((n) => { const a = getSample(n, "player"); a && a.load(); });
    PLAYER_PHASE_SAMPLES.forEach((n) => { const a = getSample(n, "broadcast"); a && a.load(); });
    return;
  }
  webAudioSamples = true;
  installUnlock();
  PLAYER_SAMPLES.forEach((n) => loadBuffer(`player/${n}`));
  PLAYER_PHASE_SAMPLES.forEach((n) => loadBuffer(`broadcast/${n}`));
}
