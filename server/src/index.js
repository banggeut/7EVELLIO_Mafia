import express from "express";
import http from "http";
import cors from "cors";
import jwt from "jsonwebtoken";
import { Server as SocketIOServer } from "socket.io";
import crypto from "crypto";

import { config } from "./config.js";
import { getAuthorizeUrl, exchangeCodeForToken, getChzzkUser } from "./chzzkAuth.js";
import { registerSocketHandlers } from "./socketHandlers.js";
import { room } from "./roomManager.js";

/**
 * 인증 방식: 쿠키 대신 토큰(JWT) + localStorage.
 *
 * 원래는 로그인 세션을 쿠키로 저장했는데, 프론트엔드와 백엔드가 서로 다른 도메인이라
 * 브라우저 입장에서 이 쿠키가 "제3자 쿠키"로 취급돼요. iOS는 모든 브라우저가 결국
 * WebKit 기반이라 제3자 쿠키를 사실상 항상 차단하고, 안드로이드도 특정 앱의 인앱
 * 브라우저(자체 웹뷰)에서는 마찬가지로 막히는 경우가 많아서 로그인이 안 되는
 * 문제가 있었습니다. 그래서 쿠키를 아예 안 쓰고, 로그인 성공 시 토큰을 URL
 * 조각(#token=...)에 실어 프론트엔드로 넘기고, 프론트엔드가 그걸 localStorage에
 * 저장한 뒤 이후 모든 요청에 Authorization: Bearer 헤더로 실어 보내는 방식으로
 * 바꿨습니다. 이 방식은 브라우저의 쿠키 정책과 무관하게 항상 동작합니다.
 */

const app = express();
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

const stateStore = new Map(); // state -> createdAt (CSRF 방지용, 5분 후 만료)
function makeState() {
  const state = crypto.randomBytes(16).toString("hex");
  stateStore.set(state, Date.now());
  return state;
}
function consumeState(state) {
  const created = stateStore.get(state);
  stateStore.delete(state);
  return !!created && Date.now() - created < 5 * 60 * 1000;
}

app.get("/auth/chzzk/login", (req, res) => {
  const state = makeState();
  res.redirect(getAuthorizeUrl(state));
});

app.get("/auth/chzzk/callback", async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state || !consumeState(String(state))) {
    return res.status(400).send("잘못된 로그인 요청입니다. 다시 시도해주세요.");
  }
  try {
    const { accessToken, refreshToken } = await exchangeCodeForToken(String(code), String(state));
    const user = await getChzzkUser(accessToken);
    const token = jwt.sign(
      { channelId: user.channelId, nickname: user.channelName, profileImageUrl: user.profileImageUrl },
      config.jwtSecret,
      { expiresIn: "7d" }
    );

    // 관리자(스트리머) 본인이 로그인한 경우, 그 access token으로 치지직 채팅 세션을 연결한다.
    // (refreshToken은 현재 메모리에만 있고 자동 갱신은 아직 구현되어 있지 않음 — 토큰 만료 시
    //  관리자가 다시 로그인하면 재연결됩니다.)
    if (config.adminChannelId && user.channelId === config.adminChannelId) {
      room.connectAdminChat({ accessToken, channelId: user.channelId }).catch((e) => {
        console.error("[auth] 관리자 채팅 연동 실패:", e.message);
      });
    }
    void refreshToken; // 추후 토큰 자동 갱신 구현 시 사용

    // 쿠키가 아니라 URL 조각(fragment)으로 토큰을 넘긴다 - 서버 로그나 Referer로 새지 않는다.
    res.redirect(`${config.clientOrigin}#token=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("치지직 로그인 처리 중 오류가 발생했습니다.");
  }
});

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  const [scheme, value] = header.split(" ");
  return scheme === "Bearer" && value ? value : null;
}

app.get("/auth/me", (req, res) => {
  const token = getBearerToken(req);
  if (!token) return res.json({ user: null });
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    res.json({
      user: {
        channelId: payload.channelId,
        nickname: payload.nickname,
        profileImageUrl: payload.profileImageUrl,
        isAdmin: !!config.adminChannelId && payload.channelId === config.adminChannelId,
      },
    });
  } catch {
    res.json({ user: null });
  }
});

app.get("/health", (req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: config.clientOrigin },
});
registerSocketHandlers(io);

server.listen(config.port, () => {
  console.log(`레벨리오 마피아 서버가 http://localhost:${config.port} 에서 실행 중입니다.`);
});
