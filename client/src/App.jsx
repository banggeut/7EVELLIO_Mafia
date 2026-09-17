import React, { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage.jsx";
import LobbyPage from "./pages/LobbyPage.jsx";
import GamePage from "./pages/GamePage.jsx";
import { SettingsPanel, NoirAtmosphere } from "./components/ui.jsx";
import { fetchMe } from "./api.js";
import { createGameSocket } from "./socket.js";
import { consumeTokenFromUrlHash, readTokenUser, clearAuthToken } from "./authToken.js";
import { playActionSound, playError, preloadPlayerSamples } from "./sound.js";
import { NOIR_THEMES as THEMES, noirThemeForPhase as themeForPhase } from "./theme.js";
import { setTimerSeconds } from "./timerStore.js";

export default function App() {
  // undefined = 로딩중, null = 비로그인. 저장된 토큰이 있으면 서버 확인을 기다리지 않고 바로 로그인 상태로 시작한다.
  const [me, setMe] = useState(() => { consumeTokenFromUrlHash(); return readTokenUser() || undefined; });
  const [connected, setConnected] = useState(true);
  const [gameState, setGameState] = useState(null);
  const [queue, setQueue] = useState([]);
  const [roomMeta, setRoomMeta] = useState({ streamerMode: false, gameStarted: false, isAdmin: false });
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // 서버에 로그인 상태 확인. 서버에 닿지 못하면(모바일 네트워크 흔들림, 서버 깨어나는 중) 로그인 화면으로 보내지 않고
    // 토큰으로 계속 진행하면서 잠시 뒤 다시 확인한다. 토큰이 진짜 만료/무효일 때만 로그인 화면으로 간다.
    let stopped = false;
    let retry = null;
    const check = (delay) => {
      fetchMe().then((r) => {
        if (stopped) return;
        if (r.offline) {
          if (readTokenUser()) setMe((m) => m || readTokenUser());
          else setMe((m) => (m === undefined ? null : m));
          retry = setTimeout(() => check(Math.min(delay * 2, 30000)), delay);
          return;
        }
        setMe((m) => (r.user && m && m.channelId === r.user.channelId ? m : r.user));
      });
    };
    check(3000);
    return () => { stopped = true; clearTimeout(retry); };
  }, []);

  useEffect(() => {
    if (!me) return;
    const socket = createGameSocket();
    // 플레이어가 보내는 모든 행동(투표·능력·채팅·대기열 등)에 맞는 효과음을 한 곳에서 붙인다.
    const rawEmit = socket.emit.bind(socket);
    socket.emit = (event, ...args) => { playActionSound(event, args[0]); return rawEmit(event, ...args); };
    preloadPlayerSamples();
    setSocket(socket);
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
    // 모바일에서 화면을 껐다 켜거나 다른 앱에 갔다 오면 연결이 끊겨 있는 경우가 많다.
    // 돌아오는 즉시 다시 붙어서(서버가 접속 시 전체 상태를 다시 보내준다) 튕긴 느낌이 없게 한다.
    let offTimer = null;
    socket.on("connect", () => { clearTimeout(offTimer); setConnected(true); });
    socket.on("disconnect", () => { clearTimeout(offTimer); offTimer = setTimeout(() => setConnected(false), 1500); });
    socket.on("connect_error", (err) => {
      if (err && err.message === "unauthorized") { clearAuthToken(); socket.disconnect(); setMe(null); return; }
      clearTimeout(offTimer); offTimer = setTimeout(() => setConnected(false), 1500);
    });
    // [멈춤 감시] 모바일은 화면이 꺼지거나 네트워크가 바뀌면 연결이 "붙어 있는 척" 조용히 죽는 경우가 있다.
    // 이러면 채팅·타이머가 완전히 멈춘 채로 보인다. 게임 중에는 서버가 1초마다 타이머를 보내고,
    // 그 외에도 25초마다 연결 확인 신호가 오므로, 그게 끊기면 강제로 다시 연결해 최신 상태를 받아온다.
    let lastRx = Date.now();
    let timerRunning = false;
    let hiddenAt = 0;
    const touch = () => { lastRx = Date.now(); };
    socket.onAny((event, payload) => {
      touch();
      if (event === "state") timerRunning = !!payload?.timerRunning;
      else if (event === "room_meta" && !payload?.gameStarted) timerRunning = false;
    });
    socket.io.on("ping", touch);
    socket.on("connect", touch);
    const forceReconnect = () => { touch(); socket.disconnect(); socket.connect(); };
    const watchdog = setInterval(() => {
      if (document.visibilityState === "hidden" || !socket.connected) return;
      const idle = Date.now() - lastRx;
      if ((timerRunning && idle > 7000) || idle > 40000) forceReconnect();
    }, 2000);
    const wake = () => {
      if (document.visibilityState === "hidden") { hiddenAt = Date.now(); return; }
      if (!socket.connected) { socket.connect(); return; }
      // 10초 넘게 다른 앱/화면 꺼짐 상태였다면, 연결이 살아 있어 보여도 새로 붙어서 놓친 채팅까지 확실히 받는다
      if (hiddenAt && Date.now() - hiddenAt > 10000) forceReconnect();
      hiddenAt = 0;
    };
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("online", wake);
    window.addEventListener("pageshow", wake);
    window.addEventListener("focus", wake);
    socket.on("error_message", (msg) => { console.warn("[game]", msg); playError(); setTimeout(() => alert(msg), 60); });
    return () => {
      clearTimeout(offTimer);
      clearInterval(watchdog);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("online", wake);
      window.removeEventListener("pageshow", wake);
      window.removeEventListener("focus", wake);
      socket.disconnect();
      setSocket(null);
    };
  }, [me?.channelId]);

  if (me === undefined) {
    return <div style={{ minHeight: "100vh", background: THEMES.dusk.bg }} />;
  }
  if (!me) return <LoginPage />;
  if (!socket) return null;

  const isInGame = roomMeta.gameStarted && gameState;
  const overlayTheme = isInGame ? themeForPhase(gameState.phase) : THEMES.dusk;

  return (
    <>
      <NoirAtmosphere theme={overlayTheme} />
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 200 }}>
        <SettingsPanel theme={overlayTheme} />
      </div>
      {!connected && (
        <div role="status" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 6000, padding: "7px 12px", textAlign: "center",
          fontSize: 12.5, fontWeight: 700, color: "#F3E3C3", background: "rgba(120,24,28,0.92)", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
          연결이 잠시 끊겼어요. 다시 연결하는 중…
        </div>
      )}
      {!isInGame ? (
        <LobbyPage me={me} queue={queue} isAdmin={roomMeta.isAdmin} socket={socket} streamerMode={roomMeta.streamerMode} balance={roomMeta.balance} testMode={roomMeta.testMode} myProfile={roomMeta.myProfile} topHonors={roomMeta.topHonors} myOwnedTitles={roomMeta.myOwnedTitles} myActiveTitle={roomMeta.myActiveTitle} achievementCatalog={roomMeta.achievementCatalog} />
      ) : (
        <GamePage state={gameState} socket={socket} isAdmin={roomMeta.isAdmin} streamerMode={roomMeta.streamerMode}
          testMode={roomMeta.testMode} viewingAsId={roomMeta.viewingAsId} rosterForTest={roomMeta.players} honorGivenTo={roomMeta.honorGivenTo} warnedPlayerIds={roomMeta.warnedPlayerIds} puppet={roomMeta.puppet} />
      )}
    </>
  );
}
