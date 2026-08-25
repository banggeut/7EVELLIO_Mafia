import ioClient from "socket.io-client";

/**
 * 치지직 실시간 채팅 연동
 * 공식 문서(전문 확인함): https://chzzk.gitbook.io/chzzk/chzzk-api/session
 *
 * - 세션 생성(유저): GET /open/v1/sessions/auth  (Authorization: Bearer {accessToken})
 *   → { content: { url } } 형태로 소켓 연결 URL 반환
 * - 채팅 이벤트 구독: POST /open/v1/sessions/events/subscribe/chat
 *   → 쿼리 파라미터로 sessionKey 전달 (요청 바디가 아님)
 * - CHAT 이벤트 메시지 필드: channelId, senderChannelId, chatChannelId,
 *   profile{nickname,badges,verifiedMark}, userRoleCode, content, emojis, messageTime
 *   → 실제 메시지 텍스트는 "content" 필드, 작성자는 "senderChannelId" 필드.
 * - Socket.IO-client 는 1.0.0 ~ 2.0.3 버전대만 공식 지원.
 */

const SESSION_URL = "https://openapi.chzzk.naver.com/open/v1/sessions/auth";
const SUBSCRIBE_CHAT_URL = "https://openapi.chzzk.naver.com/open/v1/sessions/events/subscribe/chat";
const UNSUBSCRIBE_CHAT_URL = "https://openapi.chzzk.naver.com/open/v1/sessions/events/unsubscribe/chat";

export class ChzzkChatRelay {
  /**
   * @param {object} opts
   * @param {string} opts.accessToken - 관리자(스트리머) 본인의 치지직 access token
   * @param {string} opts.channelId - 관리자의 channelId
   * @param {(msg: {senderChannelId: string, nickname: string, message: string}) => void} opts.onChatMessage
   */
  constructor({ accessToken, channelId, onChatMessage }) {
    this.accessToken = accessToken;
    this.channelId = channelId;
    this.onChatMessage = onChatMessage;
    this.socket = null;
    this.sessionId = null;
  }

  async connect() {
    const res = await fetch(SESSION_URL, {
      method: "GET",
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    const raw = await res.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      console.error("[chzzk-chat] 세션 URL 응답이 JSON이 아님 (status:", res.status, "):", raw);
      throw new Error(`치지직 채팅 세션 발급에 실패했습니다 (status ${res.status}): ${raw}`);
    }
    if (!res.ok) {
      console.error("[chzzk-chat] 세션 URL 발급 실패:", data);
      throw new Error("치지직 채팅 세션 발급에 실패했습니다. 채팅 관련 API Scope가 승인되어 있는지 확인해주세요.");
    }
    const content = data.content || data;
    const sessionUrl = content.url;
    if (!sessionUrl) {
      console.error("[chzzk-chat] 세션 URL을 응답에서 찾지 못함:", data);
      throw new Error("치지직 채팅 세션 URL을 찾을 수 없습니다.");
    }

    console.log("[chzzk-chat] 세션 URL 발급 완료, 소켓 연결 시도...");
    this.socket = ioClient(sessionUrl, { transports: ["websocket"] });

    this.socket.on("connect", () => {
      console.log("[chzzk-chat] 세션 소켓 연결됨");
    });

    this.socket.on("disconnect", (reason) => {
      console.log("[chzzk-chat] 세션 소켓 연결 끊김:", reason);
    });

    this.socket.on("SYSTEM", async (raw) => {
      try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        console.log("[chzzk-chat] SYSTEM 메시지 수신 (type:", parsed?.type, "):", raw);
        const sessionKey = parsed?.data?.sessionKey;
        if (parsed?.type === "connected" && sessionKey) {
          this.sessionId = sessionKey;
          await this.subscribeChat();
        } else if (parsed?.type === "subscribed") {
          console.log("[chzzk-chat] 이벤트 구독 확인:", parsed.data);
        } else if (parsed?.type === "revoked") {
          console.warn("[chzzk-chat] 권한이 취소되어 구독이 해제되었습니다:", parsed.data);
        }
      } catch (e) {
        console.error("[chzzk-chat] SYSTEM 메시지 파싱 실패:", e, raw);
      }
    });

    this.socket.on("CHAT", (raw) => this.handleChat(raw));

    // 이벤트 이름이 문서와 다를 경우를 대비해 모든 이벤트를 콘솔에 남깁니다.
    if (typeof this.socket.onAny === "function") {
      this.socket.onAny((event, ...args) => {
        if (event !== "SYSTEM" && event !== "CHAT") {
          console.log("[chzzk-chat] 기타 이벤트:", event, args);
        }
      });
    }
  }

  async subscribeChat() {
    if (!this.sessionId) return;
    // 공식 문서상 sessionKey는 Request Param(쿼리 파라미터)이다 - JSON 바디가 아님.
    const url = `${SUBSCRIBE_CHAT_URL}?sessionKey=${encodeURIComponent(this.sessionId)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      console.error("[chzzk-chat] 채팅 구독 요청 실패 (status:", res.status, "):", text);
      return;
    }
    console.log("[chzzk-chat] 채팅 구독 요청 응답 OK:", text);
  }

  handleChat(raw) {
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      // 공식 스펙: content(메시지 본문), senderChannelId(작성자), profile.nickname(닉네임)
      const message = parsed?.content;
      const senderChannelId = parsed?.senderChannelId;
      const nickname = parsed?.profile?.nickname ?? "";

      if (!message || !senderChannelId) {
        console.log("[chzzk-chat] 알 수 없는 형식의 채팅 메시지:", raw);
        return;
      }
      this.onChatMessage({ senderChannelId, nickname, message: String(message) });
    } catch (e) {
      console.error("[chzzk-chat] 채팅 메시지 파싱 실패:", e, raw);
    }
  }

  async disconnect() {
    try {
      if (this.sessionId) {
        const url = `${UNSUBSCRIBE_CHAT_URL}?sessionKey=${encodeURIComponent(this.sessionId)}`;
        await fetch(url, {
          method: "POST",
          headers: { Authorization: `Bearer ${this.accessToken}` },
        }).catch(() => {});
      }
    } finally {
      this.socket?.disconnect();
      this.socket = null;
      this.sessionId = null;
    }
  }
}
