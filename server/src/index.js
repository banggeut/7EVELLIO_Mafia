import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { Server as SocketIOServer } from "socket.io";
import crypto from "crypto";

import { config } from "./config.js";
import { getAuthorizeUrl, exchangeCodeForToken, getChzzkUser } from "./chzzkAuth.js";
import { registerSocketHandlers } from "./socketHandlers.js";
import { room } from "./roomManager.js";

const app = express();
app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(cookieParser());
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

const isProd = process.env.NODE_ENV === "production";
const cookieOpts = {
  httpOnly: true,
  sameSite: isProd ? "none" : "lax",
  secure: isProd,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

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
    res.cookie("session", token, cookieOpts);

    // 관리자(스트리머) 본인이 로그인한 경우, 그 access token으로 치지직 채팅 세션을 연결한다.
    // (refreshToken은 현재 메모리에만 있고 자동 갱신은 아직 구현되어 있지 않음 — 토큰 만료 시
    //  관리자가 다시 로그인하면 재연결됩니다.)
    if (config.adminChannelId && user.channelId === config.adminChannelId) {
      room.connectAdminChat({ accessToken, channelId: user.channelId }).catch((e) => {
        console.error("[auth] 관리자 채팅 연동 실패:", e.message);
      });
    }
    void refreshToken; // 추후 토큰 자동 갱신 구현 시 사용

    res.redirect(config.clientOrigin);
  } catch (err) {
    console.error(err);
    res.status(500).send("치지직 로그인 처리 중 오류가 발생했습니다.");
  }
});

app.get("/auth/me", (req, res) => {
  const token = req.cookies?.session;
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

app.post("/auth/logout", (req, res) => {
  res.clearCookie("session", cookieOpts);
  res.json({ ok: true });
});

app.get("/health", (req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: config.clientOrigin, credentials: true },
});
registerSocketHandlers(io);

server.listen(config.port, () => {
  console.log(`레벨리오 마피아 서버가 http://localhost:${config.port} 에서 실행 중입니다.`);
});
