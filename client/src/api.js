import { API_BASE } from "./socket.js";
import { getAuthToken, clearAuthToken } from "./authToken.js";

export async function fetchMe() {
  const token = getAuthToken();
  if (!token) return null; // 저장된 토큰이 없으면 서버에 물어볼 필요도 없이 비로그인 상태
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error("[auth/me] 서버 응답 오류:", res.status);
      return null;
    }
    const data = await res.json();
    if (!data.user) clearAuthToken(); // 토큰이 만료/무효화됐다면 로컬에서도 지운다
    return data.user;
  } catch (err) {
    // 백엔드에 연결이 안 되거나(CORS, 잘못된 VITE_API_URL 등) 네트워크 오류가 나면
    // 로딩 화면에 영원히 멈추는 대신 로그인 화면으로 넘어가도록 처리
    console.error("[auth/me] 백엔드 연결 실패:", err);
    return null;
  }
}

export async function logout() {
  // 세션이 서버 쿠키가 아니라 이 브라우저의 localStorage 토큰이라, 로컬에서 지우는 것만으로 충분하다.
  clearAuthToken();
}

export function loginUrl() {
  return `${API_BASE}/auth/chzzk/login`;
}
