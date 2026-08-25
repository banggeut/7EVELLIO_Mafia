import { API_BASE } from "./socket.js";

export async function fetchMe() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, { credentials: "include" });
    if (!res.ok) {
      console.error("[auth/me] 서버 응답 오류:", res.status);
      return null;
    }
    const data = await res.json();
    return data.user;
  } catch (err) {
    // 백엔드에 연결이 안 되거나(CORS, 잘못된 VITE_API_URL 등) 네트워크 오류가 나면
    // 로딩 화면에 영원히 멈추는 대신 로그인 화면으로 넘어가도록 처리
    console.error("[auth/me] 백엔드 연결 실패:", err);
    return null;
  }
}

export async function logout() {
  await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
}

export function loginUrl() {
  return `${API_BASE}/auth/chzzk/login`;
}
