import { useSyncExternalStore } from "react";

/**
 * 남은 시간(초)만 따로 보관하는 아주 작은 저장소.
 * 서버가 매초 보내는 "tick"을 게임 상태 전체에 합치면 화면 전체가 1초마다 다시 그려져서 PC에서 스크롤·타자가 끊겼다.
 * 타이머가 필요한 작은 컴포넌트(상단 타이머, 30초 알림)만 이 저장소를 구독해서 다시 그려지게 한다.
 */
let seconds = null;
const listeners = new Set();

export function setTimerSeconds(next) {
  if (next === seconds) return;
  seconds = next;
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTimerSeconds(fallback) {
  const live = useSyncExternalStore(subscribe, () => seconds, () => seconds);
  return live ?? fallback ?? 0;
}
