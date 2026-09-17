import React, { useEffect, useState, useRef } from "react";
import LoginPage from "./pages/LoginPage.jsx";
import LobbyPage from "./pages/LobbyPage.jsx";
import GamePage from "./pages/GamePage.jsx";
import { SettingsPanel, NoirAtmosphere } from "./components/ui.jsx";
import { fetchMe } from "./api.js";
import { createGameSocket } from "./socket.js";
import { consumeTokenFromUrlHash } from "./authToken.js";
import { playActionSound, playError, preloadPlayerSamples } from "./sound.js";
import { NOIR_THEMES as THEMES, noirThemeForPhase as themeForPhase } from "./theme.js";
import { setTimerSeconds } from "./timerStore.js";

export default function App() {
  const [me, setMe] = useState(undefined); // undefined = 로딩중, null = 비로그인
  const [gameState, setGameState] = useState(null);
  const [queue, setQueue] = useState([]);
  const [roomMeta, setRoomMeta] = useState({ streamerMode: false, gameStarted: false, isAdmin: false });
  const socketRef = useRef(null);

  useEffect(() => {
    consumeTokenFromUrlHash(); // 로그인 콜백에서 #token=...으로 넘어온 토큰을 저장
    fetchMe().then(setMe);
  }, []);

  useEffect(() => {
    if (!me) return;
    const socket = createGameSocket();
    // 플레이어가 보내는 모든 행동(투표·능력·채팅·대기열 등)에 맞는 효과음을 한 곳에서 붙인다.
    const rawEmit = socket.emit.bind(socket);
    socket.emit = (event, ...args) => { playActionSound(event, args[0]); return rawEmit(event, ...args); };
    preloadPlayerSamples();
    socketRef.current = socket;
    socket.on("state", (s) => { if (s) setTimerSeconds(s.timerSeconds); setGameState(s); });
    // 매초 오는 남은 시간은 게임 상태에 합치지 않는다 - 합치면 화면 전체가 1초마다 다시 그려져 PC에서 끊김이 생긴다.
    socket.on("tick", ({ timerSeconds }) => setTimerSeconds(timerSeconds));
    // 채팅만 바뀌었을 때 서버는 전체 상태 대신 채팅 부분만 보낸다 - 기존 상태에 합친다.
    socket.on("chat_update", ({ timerSeconds, ...chat }) => {
      if (timerSeconds !== undefined) setTimerSeconds(timerSeconds);
      setGameState((prev) => (prev ? { ...prev, ...chat } : prev));
    });
    socket.on("queue", setQueue);
    socket.on("room_meta", setRoomMeta);
    socket.on("error_message", (msg) => { console.warn("[game]", msg); playError(); setTimeout(() => alert(msg), 60); });
    return () => socket.disconnect();
  }, [me]);

  if (me === undefined) {
    return <div style={{ minHeight: "100vh", background: THEMES.dusk.bg }} />;
  }
  if (!me) return <LoginPage />;
  if (!socketRef.current) return null;

  const isInGame = roomMeta.gameStarted && gameState;
  const overlayTheme = isInGame ? themeForPhase(gameState.phase) : THEMES.dusk;

  return (
    <>
      <NoirAtmosphere theme={overlayTheme} />
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 200 }}>
        <SettingsPanel theme={overlayTheme} />
      </div>
      {!isInGame ? (
        <LobbyPage me={me} queue={queue} isAdmin={roomMeta.isAdmin} socket={socketRef.current} streamerMode={roomMeta.streamerMode} balance={roomMeta.balance} testMode={roomMeta.testMode} myProfile={roomMeta.myProfile} topHonors={roomMeta.topHonors} myOwnedTitles={roomMeta.myOwnedTitles} myActiveTitle={roomMeta.myActiveTitle} achievementCatalog={roomMeta.achievementCatalog} />
      ) : (
        <GamePage state={gameState} socket={socketRef.current} isAdmin={roomMeta.isAdmin} streamerMode={roomMeta.streamerMode}
          testMode={roomMeta.testMode} viewingAsId={roomMeta.viewingAsId} rosterForTest={roomMeta.players} honorGivenTo={roomMeta.honorGivenTo} warnedPlayerIds={roomMeta.warnedPlayerIds} />
      )}
    </>
  );
}
