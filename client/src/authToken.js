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

/**
 * 저장된 토큰 안의 사용자 정보를 서버에 묻지 않고 바로 꺼낸다 (서명 검증은 서버가 소켓 접속 때 한다).
 * 모바일에서 앱을 다시 열었을 때 서버가 잠깐 늦게 응답하거나(무료 호스팅 깨어나는 중 등)
 * 네트워크가 흔들려도 로그인 화면으로 튕기지 않고 바로 대기실로 들어가게 하기 위함.
 */
export function readTokenUser(token = getAuthToken()) {
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    const json = decodeURIComponent(atob(part.replace(/-/g, "+").replace(/_/g, "/")).split("").map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join(""));
    const payload = JSON.parse(json);
    if (!payload.channelId) return null;
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return { channelId: payload.channelId, nickname: payload.nickname, profileImageUrl: payload.profileImageUrl };
  } catch {
    return null;
  }
}
