import React, { useEffect, useState, useRef } from "react";
import LoginPage from "./pages/LoginPage.jsx";
import LobbyPage from "./pages/LobbyPage.jsx";
import GamePage from "./pages/GamePage.jsx";
import { SettingsPanel } from "./components/ui.jsx";
import { fetchMe } from "./api.js";
import { createGameSocket } from "./socket.js";
import { consumeTokenFromUrlHash } from "./authToken.js";
import { THEMES, themeForPhase } from "./theme.js";

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
    socketRef.current = socket;
    socket.on("state", setGameState);
    socket.on("tick", ({ timerSeconds }) => setGameState((prev) => (prev ? { ...prev, timerSeconds } : prev)));
    socket.on("queue", setQueue);
    socket.on("room_meta", setRoomMeta);
    socket.on("error_message", (msg) => { console.warn("[game]", msg); alert(msg); });
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
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 200 }}>
        <SettingsPanel theme={overlayTheme} />
      </div>
      {!isInGame ? (
        <LobbyPage me={me} queue={queue} isAdmin={roomMeta.isAdmin} socket={socketRef.current} streamerMode={roomMeta.streamerMode} balance={roomMeta.balance} testMode={roomMeta.testMode} myProfile={roomMeta.myProfile} />
      ) : (
        <GamePage state={gameState} socket={socketRef.current} isAdmin={roomMeta.isAdmin} streamerMode={roomMeta.streamerMode}
          testMode={roomMeta.testMode} viewingAsId={roomMeta.viewingAsId} rosterForTest={roomMeta.players} honorGivenTo={roomMeta.honorGivenTo} warnedPlayerIds={roomMeta.warnedPlayerIds} />
      )}
    </>
  );
}
