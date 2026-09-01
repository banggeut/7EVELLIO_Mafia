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
const CHANNELS_URL = "https://openapi.chzzk.naver.com/open/v1/channels";

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
  };
}

/**
 * 프로필 사진(channelImageUrl)은 /users/me 에는 없고, 별도의 "채널 정보 조회" API에서만 제공된다.
 * 이 API는 사용자 Access Token이 아니라 "Client 인증"(우리 앱 자신의 Client-Id/Client-Secret을
 * 헤더에 그대로 실어 보내는 방식)을 쓴다 - 토큰 발급 절차 없이 바로 호출 가능하다.
 */
export async function getChzzkChannelImage(channelId) {
  const url = `${CHANNELS_URL}?channelIds=${encodeURIComponent(channelId)}`;
  const res = await fetch(url, {
    headers: {
      "Client-Id": config.chzzk.clientId,
      "Client-Secret": config.chzzk.clientSecret,
      "Content-Type": "application/json",
    },
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("[chzzk] 채널 정보 조회 실패:", data);
    return null;
  }
  const content = data.content || data;
  const channel = (content.data || [])[0];
  return channel?.channelImageUrl || null;
}
