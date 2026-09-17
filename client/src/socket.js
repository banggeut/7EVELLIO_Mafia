import { io } from "socket.io-client";
import { getAuthToken } from "./authToken.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function createGameSocket() {
  // auth를 함수로 넘겨야 재접속할 때마다 "지금 저장된" 토큰을 쓴다 (도중에 새 토큰으로 갱신될 수 있음)
  return io(API_URL, {
    autoConnect: true,
    auth: (cb) => cb({ token: getAuthToken() }),
    reconnectionDelay: 800,
    reconnectionDelayMax: 4000,
  });
}

export function createBroadcastSocket() {
  return io(API_URL, { autoConnect: true, query: { mode: "broadcast" } });
}

export const API_BASE = API_URL;
