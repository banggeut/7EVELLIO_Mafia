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

/** 버튼/칩 클릭음 */
export function playClick() {
  tone({ freq: 900, duration: 0.045, type: "square", gain: 0.06 });
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
