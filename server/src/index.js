import express from "express";
import http from "http";
import cors from "cors";
import jwt from "jsonwebtoken";
import { Server as SocketIOServer } from "socket.io";
import crypto from "crypto";

import { config } from "./config.js";
import { getAuthorizeUrl, exchangeCodeForToken, getChzzkUser, getChzzkChannelImage } from "./chzzkAuth.js";
import { registerSocketHandlers } from "./socketHandlers.js";
import { flush as flushHonors } from "./honorStore.js";
import { flush as flushAchievements } from "./achievementStore.js";

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

// 예외 하나로 서버 프로세스가 죽으면 진행 중인 게임이 통째로 사라진다.
// 어떤 오류든 로그만 남기고 서버는 계속 살아 있게 한다.
process.on("uncaughtException", (err) => { console.error("[치명] 처리되지 않은 예외:", err); });
process.on("unhandledRejection", (reason) => { console.error("[치명] 처리되지 않은 비동기 오류:", reason); });

const app = express();
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

const stateStore = new Map(); // state -> createdAt (CSRF 방지용, 5분 후 만료)
function makeState() {
  const state = crypto.randomBytes(16).toString("hex");
  stateStore.set(state, Date.now());
  return state;
}
// 로그인을 시작만 하고 끝내지 않은 state가 계속 쌓이지 않도록 주기적으로 정리한다.
setInterval(() => {
  const now = Date.now();
  for (const [key, created] of stateStore.entries()) {
    if (now - created > 5 * 60 * 1000) stateStore.delete(key);
  }
}, 5 * 60 * 1000).unref();

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
    // 프로필 사진은 /users/me 에 없고 별도의 "채널 정보 조회" API에서만 제공된다 (Client 인증 방식).
    // 실패해도 로그인 자체는 계속 진행하고, 사진만 비워둔다 (닉네임 이니셜로 대체 표시됨).
    const profileImageUrl = await getChzzkChannelImage(user.channelId).catch((e) => {
      console.error("[auth] 채널 이미지 조회 실패:", e.message);
      return null;
    });
    const token = jwt.sign(
      { channelId: user.channelId, nickname: user.channelName, profileImageUrl },
      config.jwtSecret,
      { expiresIn: SESSION_TTL }
    );

    void refreshToken; // 치지직 채팅 중계는 쓰지 않는다 - 게임 내 채팅만 사용한다.

    // 쿠키가 아니라 URL 조각(fragment)으로 토큰을 넘긴다 - 서버 로그나 Referer로 새지 않는다.
    res.redirect(`${config.clientOrigin}#token=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("치지직 로그인 처리 중 오류가 발생했습니다.");
  }
});

// 로그인 유지 기간. 게임에 들어올 때마다(/auth/me) 하루 이상 지난 토큰은 새 토큰으로 바꿔 주므로,
// 30일 안에 한 번이라도 들어오는 사람은 다시 로그인할 일이 없다.
const SESSION_TTL = "30d";
const SESSION_REFRESH_AFTER_SEC = 24 * 60 * 60;

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
      ...(payload.iat && Date.now() / 1000 - payload.iat > SESSION_REFRESH_AFTER_SEC
        ? { token: jwt.sign({ channelId: payload.channelId, nickname: payload.nickname, profileImageUrl: payload.profileImageUrl }, config.jwtSecret, { expiresIn: SESSION_TTL }) }
        : {}),
    });
  } catch {
    res.json({ user: null });
  }
});

app.get("/health", (req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: config.clientOrigin },
  // 모바일은 화면이 꺼지거나 다른 앱으로 가면 브라우저가 소켓 응답을 늦춘다.
  // 기본값(20초)이면 잠깐만 딴 데 갔다 와도 끊긴 걸로 처리돼 튕기므로 여유를 둔다.
  pingInterval: 25000,
  pingTimeout: 60000,
});
registerSocketHandlers(io);

// 서버를 끌 때(재배포 등) 저장이 미뤄진 기록을 확실히 디스크에 남기고 종료한다.
let shuttingDown = false;
const shutdown = (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[종료] ${signal} 수신 - 기록을 저장하고 종료합니다.`);
  try { flushHonors(); } catch (e) { console.error("[종료] 명예 저장 실패:", e.message); }
  try { flushAchievements(); } catch (e) { console.error("[종료] 업적 저장 실패:", e.message); }
  try { io.close(); } catch { /* 이미 닫힘 */ }
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

server.listen(config.port, () => {
  console.log(`레벨리오 마피아 서버가 http://localhost:${config.port} 에서 실행 중입니다.`);
});
