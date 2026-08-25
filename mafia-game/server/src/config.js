import "dotenv/config";

export const config = {
  port: process.env.PORT || 4000,
  chzzk: {
    clientId: process.env.CHZZK_CLIENT_ID,
    clientSecret: process.env.CHZZK_CLIENT_SECRET,
    redirectUri: process.env.CHZZK_REDIRECT_URI,
  },
  jwtSecret: process.env.JWT_SECRET || "dev_secret_change_me",
  adminChannelId: process.env.ADMIN_CHZZK_CHANNEL_ID || "",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
};

if (!config.chzzk.clientId || !config.chzzk.clientSecret) {
  console.warn(
    "[경고] CHZZK_CLIENT_ID / CHZZK_CLIENT_SECRET 이 설정되지 않았습니다. .env 파일을 확인하세요."
  );
}
