import { useEffect, useState } from "react";
import { noirThemeForPhase } from "../theme.js";
import { NOIR_ICON_CSS } from "./noirIcons.jsx";
import { useAlertSequence, FadeStage, AlertCard } from "./alertSequence.jsx";
import { PLAYER_PHASE_GAIN } from "../sound.js";

/* ============================================================
   플레이어 화면(PC·모바일)용 공개 알람 연출
   방송(스트리밍 모드) 화면과 똑같은 카드를 같은 순서·같은 시간으로 전체 화면에 띄운다.
   서버가 카드가 다 나올 때까지 다음 단계로 넘어가지 않게 타이머를 맞춰주므로,
   모든 플레이어가 같은 알람을 함께 보고 다음 단계로 넘어가게 된다.

   카드 디자인은 방송용 1920x1080 기준이라, 화면 비율에 맞는 가상 무대를 만들고 통째로 축소한다.
   - 가로 화면(PC): 폭 1920 기준 무대
   - 세로 화면(모바일): 폭 860 기준 무대 + 글줄 폭을 좁혀서 줄바꿈이 자연스럽게
   ============================================================ */

const OVERLAY_CSS = `
@keyframes levellio-pulse { 0%,100% { transform: scale(1); opacity: 0.9; } 50% { transform: scale(1.12); opacity: 1; } }
@keyframes noir-cone { 0%,100% { opacity: 0.85; } 50% { opacity: 1; } 93% { opacity: 1; } 94% { opacity: 0.55; } 95% { opacity: 1; } }
@keyframes noir-stamp { 0% { opacity: 0; transform: scale(2.2) rotate(-16deg); } 60% { opacity: 1; transform: scale(0.94) rotate(-7deg); } 100% { opacity: 1; transform: scale(1) rotate(-8deg); } }
`;

function useViewport() {
  const read = () => ({ w: window.innerWidth || 390, h: window.innerHeight || 844 });
  const [vp, setVp] = useState(read);
  useEffect(() => {
    const on = () => setVp(read());
    window.addEventListener("resize", on);
    window.addEventListener("orientationchange", on);
    return () => { window.removeEventListener("resize", on); window.removeEventListener("orientationchange", on); };
  }, []);
  return vp;
}

export default function PlayerAlertOverlay({ alertState }) {
  const { current, inSequence, cardVisible } = useAlertSequence(alertState, { soundGain: PLAYER_PHASE_GAIN, skipInitial: true });
  const { w, h } = useViewport();
  // 마지막 카드가 사라지는 페이드아웃 동안에도 배경을 유지하려고, 마지막으로 보여준 카드를 잠깐 기억한다.
  const [lastCard, setLastCard] = useState(null);
  useEffect(() => { if (current) setLastCard(current); }, [current]);
  useEffect(() => {
    if (inSequence) return undefined;
    const t = setTimeout(() => setLastCard(null), 800);
    return () => clearTimeout(t);
  }, [inSequence]);

  const card = current || lastCard;
  if (!alertState || !card) return null;

  const theme = noirThemeForPhase(alertState.phase);
  const portrait = w / h < 1;
  const stageW = portrait ? 860 : 1920;
  const scale = w / stageW;
  const stageH = h / scale;
  const vars = portrait
    ? { "--alert-max-w": "780px", "--alert-sub-w": "760px", "--alert-news-w": "800px" }
    : {};

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: "fixed", inset: 0, zIndex: 5000, overflow: "hidden",
        background: `radial-gradient(ellipse 110% 90% at 50% 45%, transparent 40%, rgba(0,0,0,0.8) 100%), ${theme.bg}`,
        opacity: inSequence ? 1 : 0, transition: "opacity 700ms ease",
        pointerEvents: inSequence ? "auto" : "none", touchAction: "none",
      }}
    >
      <style>{OVERLAY_CSS + NOIR_ICON_CSS}</style>
      <div style={{ position: "absolute", left: 0, top: 0, width: stageW, height: stageH, transform: `scale(${scale})`, transformOrigin: "0 0", ...vars }}>
        <div style={{ position: "absolute", inset: portrait ? "60px 20px" : "40px 80px" }}>
          <FadeStage visible={!!current && cardVisible}>
            <AlertCard theme={theme} event={card} dayNumber={alertState.dayNumber} />
          </FadeStage>
        </div>
      </div>
    </div>
  );
}
