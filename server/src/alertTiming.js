import { alertTransition, alertSequenceMs } from "./alertEvents.js";

/* ============================================================
   공개 알람 연출 시간 맞추기
   방송 화면과 모든 플레이어 화면(PC·모바일)이 같은 알람 카드를 순서대로 보여준다(alertEvents.js).
   그 카드들이 끝나기 전에 다음 단계로 넘어가 버리면 "다같이 보고 넘어가는" 느낌이 깨지므로,
   단계가 바뀌는 순간 그 단계의 카드 재생 시간을 계산해서 타이머를 맞춘다.
   - 아침: 카드가 다 나오고 2초 뒤에 다음 단계 (고정 12초 대신)
   - 투표 결과: 카드가 다 나올 때까지는 밤으로 넘어가지 않음
   - 토론 시작 카드(독재·보안관 결과 등)·보안관 지목 카드: 카드가 떠 있는 시간만큼 그 단계 시간을 더 준다
   ============================================================ */
const BUFFER_SECONDS = 2;

export function applyAlertTiming(prev, next) {
  if (!next || !next.timerRunning) return next;
  if (prev && prev.phase === next.phase && prev.dayNumber === next.dayNumber) return next;
  const t = alertTransition({ ...next, verdictByPriest: !!next.inquisitionBy });
  if (t.mode === "clear" || !t.events.length) return next;
  const seconds = Math.ceil(alertSequenceMs(t.events) / 1000);
  switch (next.phase) {
    case "morning":
      return { ...next, timerSeconds: Math.max(8, seconds + BUFFER_SECONDS) };
    case "voteresult":
      return { ...next, timerSeconds: Math.max(next.timerSeconds, seconds + BUFFER_SECONDS) };
    case "discussion":
    case "sheriffDefense":
      return { ...next, timerSeconds: next.timerSeconds + seconds };
    default:
      return next;
  }
}
