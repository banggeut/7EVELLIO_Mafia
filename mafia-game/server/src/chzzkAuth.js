import { config } from "./config.js";

/**
 * 치지직 OAuth 연동
 * 참고 문서: https://chzzk.gitbook.io/chzzk/chzzk-api/authorization
 *           https://chzzk.gitbook.io/chzzk/chzzk-api/user
 *
 * 주의: 치지직 오픈 API 응답은 보통 { code, message, content: {...} } 형태로
 * 감싸져 오는 경우가 많습니다. 아래 코드는 content 유무를 방어적으로 처리하지만,
 * 실제 연동 테스트 시 콘솔에 찍히는 원본 응답을 보고 필드명을 한 번 확인해주세요.
 */

const AUTHORIZE_BASE = "https://chzzk.naver.com/account-interlock";
const TOKEN_URL = "https://openapi.chzzk.naver.com/auth/v1/token";
const USER_ME_URL = "https://openapi.chzzk.naver.com/open/v1/users/me";

export function getAuthorizeUrl(state) {
  const params = new URLSearchParams({
    clientId: config.chzzk.clientId,
    redirectUri: config.chzzk.redirectUri,
    state,
  });
  return `${AUTHORIZE_BASE}?${params.toString()}`;
}

export async function exchangeCodeForToken(code, state) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grantType: "authorization_code",
      clientId: config.chzzk.clientId,
      clientSecret: config.chzzk.clientSecret,
      code,
      state,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("[chzzk] 토큰 발급 실패:", data);
    throw new Error("치지직 토큰 발급에 실패했습니다.");
  }
  const content = data.content || data;
  return {
    accessToken: content.accessToken || content.access_token,
    refreshToken: content.refreshToken || content.refresh_token,
    expiresIn: content.expiresIn || content.expires_in,
  };
}

export async function getChzzkUser(accessToken) {
  const res = await fetch(USER_ME_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("[chzzk] 유저 정보 조회 실패:", data);
    throw new Error("치지직 유저 정보 조회에 실패했습니다.");
  }
  const content = data.content || data;
  return {
    channelId: content.channelId,
    channelName: content.channelName,
    // 프로필 이미지 필드명은 문서에 명시되어 있지 않아 여러 후보를 방어적으로 처리합니다.
    profileImageUrl: content.channelImageUrl || content.profileImageUrl || null,
  };
}
