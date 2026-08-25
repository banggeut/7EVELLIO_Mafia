import ioClient from "socket.io-client";

/**
 * 치지직 실시간 채팅 연동
 * 참고 문서: https://chzzk.gitbook.io/chzzk/chzzk-api/session
 *           https://chzzk.gitbook.io/chzzk/chzzk-api/chat
 *
 * ⚠️ 중요: 치지직의 세션/채팅 이벤트는 최신 socket.io(v4)가 아니라 구버전 프로토콜(v2대)로
 * 동작한다는 커뮤니티 보고가 있어, 이 모듈은 socket.io-client v2로 연결합니다.
 * 또한 세션 연결 성공 시 오는 SYSTEM 메시지와 채팅 이벤트 메시지의 정확한 필드명은
 * 공식 문서에 완전히 명시되어 있지 않습니다. 아래 코드는 합리적으로 추정한 구조로
 * 파싱을 시도하되, 알 수 없는 형태의 메시지는 전부 콘솔에 원문 그대로 로그를 남깁니다.
 * 실제로 연동해보신 뒤 콘솔 로그를 보고 이 파일의 파싱 부분만 조정하시면 됩니다.
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
      console.log("[chzzk-chat] SYSTEM 메시지 수신:", raw);
      try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        const sessionId =
          parsed?.data?.sessionKey ||
          parsed?.bdy?.sessionKey ||
          parsed?.sessionKey ||
          parsed?.sessionId ||
          parsed?.data?.sessionId;
        if (sessionId) {
          this.sessionId = sessionId;
          await this.subscribeChat();
        } else {
          console.log("[chzzk-chat] SYSTEM 메시지에서 세션 키를 찾지 못함 (구독 스킵):", raw);
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
    const res = await fetch(SUBSCRIBE_CHAT_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: this.sessionId, channelId: this.channelId }),
    });
    if (!res.ok) {
      console.error("[chzzk-chat] 채팅 구독 요청 실패:", await res.text().catch(() => ""));
      return;
    }
    console.log("[chzzk-chat] 채팅 이벤트 구독 완료");
  }

  handleChat(raw) {
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      const body = parsed?.bdy ?? parsed;
      const message = body?.message ?? body?.msg ?? body?.content ?? "";
      const profile = body?.profile ?? {};
      const senderChannelId = profile?.channelId ?? body?.senderChannelId ?? body?.channelId ?? null;
      const nickname = profile?.nickname ?? body?.nickname ?? "";

      if (!message || !senderChannelId) {
        console.log("[chzzk-chat] 알 수 없는 형식의 채팅 메시지 (필드명 확인 필요):", raw);
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
        await fetch(UNSUBSCRIBE_CHAT_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${this.accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: this.sessionId, channelId: this.channelId }),
        }).catch(() => {});
      }
    } finally {
      this.socket?.disconnect();
      this.socket = null;
      this.sessionId = null;
    }
  }
}
