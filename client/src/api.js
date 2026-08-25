import { API_BASE } from "./socket.js";

export async function fetchMe() {
  const res = await fetch(`${API_BASE}/auth/me`, { credentials: "include" });
  const data = await res.json();
  return data.user;
}

export async function logout() {
  await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
}

export function loginUrl() {
  return `${API_BASE}/auth/chzzk/login`;
}
