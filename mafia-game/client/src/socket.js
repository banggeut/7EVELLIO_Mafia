import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function createGameSocket() {
  return io(API_URL, { withCredentials: true, autoConnect: true });
}

export function createBroadcastSocket() {
  return io(API_URL, { withCredentials: true, autoConnect: true, query: { mode: "broadcast" } });
}

export const API_BASE = API_URL;
