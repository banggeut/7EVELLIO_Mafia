import { API_BASE } from "./socket.js";
import { getAuthToken, setAuthToken, clearAuthToken } from "./authToken.js";

/**
 * 서버에 로그인 상태를 확인한다.
 * - { user } : 확인 완료 (user가 null이면 토큰이 만료/무효 → 로컬 토큰도 지움)
 * - { offline: true } : 서버에 닿지 못함(네트워크 끊김, 서버 깨어나는 중 등) → 토큰은 그대로 둔다
 * 서버가 오래된 토큰을 새 토큰으로 바꿔주면 저장해서, 자주 들어오는 사람은 로그인이 만료되지 않게 한다.
 */
export async function fetchMe() {
  const token = getAuthToken();
  if (!token) return { user: null }; // 저장된 토큰이 없으면 서버에 물어볼 필요도 없이 비로그인 상태
  try {
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = ctrl && setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: ctrl?.signal,
    });
    if (timer) clearTimeout(timer);
    if (!res.ok) {
      console.error("[auth/me] 서버 응답 오류:", res.status);
      return { offline: true };
    }
    const data = await res.json();
    if (!data.user) clearAuthToken(); // 토큰이 만료/무효화됐다면 로컬에서도 지운다
    else if (data.token) setAuthToken(data.token);
    return { user: data.user };
  } catch (err) {
    console.error("[auth/me] 백엔드 연결 실패:", err);
    return { offline: true };
  }
}

export async function logout() {
  // 세션이 서버 쿠키가 아니라 이 브라우저의 localStorage 토큰이라, 로컬에서 지우는 것만으로 충분하다.
  clearAuthToken();
}

export function loginUrl() {
  return `${API_BASE}/auth/chzzk/login`;
}
