import { io } from "socket.io-client";
import { getAuthToken } from "./authToken.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function createGameSocket() {
  return io(API_URL, { autoConnect: true, auth: { token: getAuthToken() } });
}

export function createBroadcastSocket() {
  return io(API_URL, { autoConnect: true, query: { mode: "broadcast" } });
}

export const API_BASE = API_URL;
