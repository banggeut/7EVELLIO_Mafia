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
    const { accessToken } = await exchangeCodeForToken(String(code), String(state));
    const user = await getChzzkUser(accessToken);
    const token = jwt.sign(
      { channelId: user.channelId, nickname: user.channelName, profileImageUrl: user.profileImageUrl },
      config.jwtSecret,
      { expiresIn: "7d" }
    );
    res.cookie("session", token, cookieOpts);
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
