const TOKEN_KEY = "levellio_mafia_auth_token";

export function getAuthToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // localStorage 사용 불가 환경(사파리 프라이빗 모드 등)이면 조용히 무시
  }
}

export function clearAuthToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // no-op
  }
}

/**
 * 로그인 콜백에서 넘어온 URL 조각(#token=...)이 있으면 꺼내서 저장하고,
 * 주소창에서 흔적을 지운다. 앱이 처음 로드될 때 한 번만 호출하면 된다.
 */
export function consumeTokenFromUrlHash() {
  if (typeof window === "undefined") return;
  const hash = window.location.hash || "";
  if (!hash.startsWith("#token=")) return;
  const token = decodeURIComponent(hash.slice("#token=".length));
  if (token) setAuthToken(token);
  const cleanUrl = window.location.pathname + window.location.search;
  window.history.replaceState({}, document.title, cleanUrl);
}
