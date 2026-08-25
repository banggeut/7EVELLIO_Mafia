import React, { useEffect, useState, useRef } from "react";
import LoginPage from "./pages/LoginPage.jsx";
import LobbyPage from "./pages/LobbyPage.jsx";
import GamePage from "./pages/GamePage.jsx";
import { fetchMe } from "./api.js";
import { createGameSocket } from "./socket.js";
import { THEMES } from "./theme.js";

export default function App() {
  const [me, setMe] = useState(undefined); // undefined = 로딩중, null = 비로그인
  const [gameState, setGameState] = useState(null);
  const [queue, setQueue] = useState([]);
  const [roomMeta, setRoomMeta] = useState({ streamerMode: false, gameStarted: false, isAdmin: false });
  const socketRef = useRef(null);

  useEffect(() => {
    fetchMe().then(setMe);
  }, []);

  useEffect(() => {
    if (!me) return;
    const socket = createGameSocket();
    socketRef.current = socket;
    socket.on("state", setGameState);
    socket.on("queue", setQueue);
    socket.on("room_meta", setRoomMeta);
    socket.on("error_message", (msg) => console.warn("[game]", msg));
    return () => socket.disconnect();
  }, [me]);

  if (me === undefined) {
    return <div style={{ minHeight: "100vh", background: THEMES.dusk.bg }} />;
  }
  if (!me) return <LoginPage />;
  if (!socketRef.current) return null;

  if (!roomMeta.gameStarted || !gameState) {
    return <LobbyPage me={me} queue={queue} isAdmin={roomMeta.isAdmin} socket={socketRef.current} streamerMode={roomMeta.streamerMode} />;
  }

  return <GamePage state={gameState} socket={socketRef.current} isAdmin={roomMeta.isAdmin} streamerMode={roomMeta.streamerMode} />;
}
