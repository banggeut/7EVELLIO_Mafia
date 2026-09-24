import "dotenv/config";

export const config = {
  port: process.env.PORT || 4000,
  chzzk: {
    clientId: process.env.CHZZK_CLIENT_ID,
    clientSecret: process.env.CHZZK_CLIENT_SECRET,
    redirectUri: process.env.CHZZK_REDIRECT_URI,
  },
  jwtSecret: process.env.JWT_SECRET || "dev_secret_change_me", // 운영에서는 아래 검사로 반드시 직접 설정하게 강제한다
  adminChannelId: process.env.ADMIN_CHZZK_CHANNEL_ID || "",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
};

if (!config.chzzk.clientId || !config.chzzk.clientSecret) {
  console.warn(
    "[경고] CHZZK_CLIENT_ID / CHZZK_CLIENT_SECRET 이 설정되지 않았습니다. .env 파일을 확인하세요."
  );
}

/**
 * JWT_SECRET은 로그인 토큰을 서명하는 열쇠다.
 * 이 값이 없으면 소스에 적힌 기본값으로 서명하게 되는데, 관리자 판정이 "치지직 채널 ID가 같은가"
 * 하나뿐이고 채널 ID는 공개 정보라, 누구나 관리자 토큰을 만들어낼 수 있게 된다.
 * 그래서 운영(NODE_ENV=production)에서는 값이 없거나 기본값 그대로면 아예 서버를 켜지 않는다.
 */
const isProduction = process.env.NODE_ENV === "production";
const jwtSecretMissing = !process.env.JWT_SECRET || process.env.JWT_SECRET === "dev_secret_change_me";
if (isProduction && jwtSecretMissing) {
  console.error(
    "\n[중단] 환경변수 JWT_SECRET 이 설정되지 않았습니다.\n" +
    "       이대로 켜면 누구나 관리자 권한을 위조할 수 있어서 서버를 시작하지 않습니다.\n" +
    "       배포 설정(Render → Environment)에 아무도 모르는 긴 문자열을 JWT_SECRET 으로 넣어주세요.\n" +
    "       예) node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"\n" +
    "       ※ 이 값을 나중에 바꾸면 모두가 한 번씩 다시 로그인해야 합니다.\n"
  );
  process.exit(1);
}
if (jwtSecretMissing) {
  console.warn("[경고] JWT_SECRET 이 기본값입니다. 로컬 개발용으로만 쓰고, 배포 전에는 반드시 직접 설정하세요.");
}
if (isProduction && !process.env.CLIENT_ORIGIN) {
  console.warn("[경고] CLIENT_ORIGIN 이 설정되지 않아 http://localhost:5173 으로 동작합니다. 실제 프론트엔드 주소를 넣어주세요.");
}
