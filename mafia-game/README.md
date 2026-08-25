# 레벨리오 마피아 — 실제 플레이용 버전

치지직 로그인, 실시간 멀티플레이(Socket.io), 관리자 전용 스트리머 모드를 갖춘
"실제 플레이" 버전입니다. `server/`(백엔드)와 `client/`(프론트엔드) 두 프로젝트로
구성되어 있고, 각각 따로 배포합니다.

## 폴더 구조

```
mafia-game/
  server/   Node.js + Express + Socket.io (게임 상태를 서버가 관리)
  client/   React + Vite (플레이어 화면 + /broadcast 방송 화면)
```

## 1. 치지직 개발자센터 설정

1. https://developers.chzzk.naver.com 에서 만든 애플리케이션의
   **로그인 리디렉션 URL**을 `https://<백엔드 도메인>/auth/chzzk/callback` 으로 등록하세요.
   (로컬 개발 중이라면 `http://localhost:4000/auth/chzzk/callback`)
2. API Scope에 "유저 정보 조회"가 포함되어 있어야 닉네임/채널ID를 가져올 수 있습니다.
3. 본인(스트리머)의 치지직 `channelId`를 알아두세요 — `.env`의 `ADMIN_CHZZK_CHANNEL_ID`에
   넣으면 그 계정으로 로그인했을 때만 "관리자" 권한(게임 시작, 스트리머 모드 등)이 부여됩니다.
   - channelId는 로그인 후 서버 콘솔 로그나 `/auth/me` 응답에서 확인할 수 있습니다.
     처음엔 비워두고 한 번 로그인해본 뒤, 응답에 찍힌 channelId를 복사해 넣어도 됩니다.

⚠️ 치지직 오픈 API의 정확한 응답 필드명(특히 프로필 이미지 필드)은 문서에 다소 불명확하게
나와 있어 `server/src/chzzkAuth.js`에 방어적으로 처리해뒀습니다. 실제 로그인을 한 번
테스트해보고 콘솔에 찍히는 원본 응답을 보면서 필드명이 다르면 그 파일만 살짝 고치면 됩니다.

## 2. 로컬에서 실행해보기

```bash
# 백엔드
cd server
cp .env.example .env   # 값 채우기
npm install
npm run dev             # http://localhost:4000

# 프론트엔드 (새 터미널)
cd client
cp .env.example .env    # VITE_API_URL=http://localhost:4000
npm install
npm run dev              # http://localhost:5173
```

브라우저에서 `http://localhost:5173` 접속 → 치지직 로그인 → 대기열 참여 → (관리자 계정이면)
직업 선택 후 게임 시작.

방송 화면(OBS 브라우저 소스)은 `http://localhost:5173/broadcast` 입니다.
관리자가 대기실에서 "스트리머 모드"를 켜야 표시됩니다.

## 3. Render 배포 (무료/저가형 호스팅)

### 백엔드 (Web Service)
1. Render 대시보드 → New → Web Service → 이 저장소의 `server` 폴더를 루트로 지정
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Environment Variables에 `.env.example`의 항목을 모두 등록
   - `CHZZK_REDIRECT_URI` = `https://<이 서비스의 render 도메인>/auth/chzzk/callback`
   - `CLIENT_ORIGIN` = 프론트엔드 배포 주소 (아래에서 만들 도메인)
   - `NODE_ENV=production` 도 추가해주세요 (쿠키 secure 옵션에 사용됩니다)

### 프론트엔드 (Static Site)
1. Render 대시보드 → New → Static Site → `client` 폴더를 루트로 지정
2. Build Command: `npm install && npm run build`
3. Publish Directory: `dist`
4. Environment Variables: `VITE_API_URL` = 위 백엔드 서비스 주소
5. **Rewrite 규칙 추가 필수**: `/*` → `/index.html` (SPA이므로, `/broadcast` 같은 경로도
   index.html로 서빙되어야 라우팅이 동작합니다)
6. 배포 후, 백엔드 환경변수 `CLIENT_ORIGIN`을 이 도메인으로 다시 채워 재배포하세요
   (CORS/쿠키가 정확히 맞아야 로그인이 됩니다)

Railway를 쓰신다면 구조는 동일합니다 (서버는 Node 서비스, 클라이언트는 정적 빌드 + SPA rewrite).

## 4. 지금 버전에서 알아두어야 할 한계 (다음 단계로 개선 가능)

- **단일 방(room) 구조**: 지금은 서버 하나당 게임 하나만 진행됩니다. 여러 채널/여러 방을
  동시에 운영하려면 `roomManager.js`를 채널별 Map 구조로 바꾸면 됩니다.
- **메모리 저장**: 서버가 재시작되면 진행 중인 게임/대기열이 초기화됩니다. 실서비스로
  키우려면 Redis 등에 상태를 저장하는 걸 권장드려요.
- **치지직 채팅 연동**: 지금 낮 토론 화면은 "여기에 채팅이 표시됩니다" placeholder입니다.
  실제 치지직 채팅을 붙이려면 치지직 채팅 API(소켓 기반, 문서: chzzk.gitbook.io)를
  서버에서 구독해 프론트에 중계하는 작업이 추가로 필요합니다.
- **재접속 처리**: 플레이어가 새로고침하거나 연결이 끊겼다가 다시 붙는 경우에 대한
  처리가 아직 단순합니다(세션 쿠키로 같은 channelId면 자동으로 다시 이어집니다만,
  중간에 놓친 상태 갱신에 대한 별도 예외처리는 없습니다).
- **입력 검증/부정행위 방지**: 기본적인 자격 검증(내 직업이 아니면 능력 사용 불가 등)은
  서버에서 하고 있지만, 실제 운영 전에 rate limit이나 재요청 방지 등을 더 보강하면 좋습니다.

## 5. 코드 재사용 관계

`server/src/gameEngine.js`는 이전 단계에서 만든 클라이언트 전용 프로토타입의 리듀서
로직을 서버 권위 방식으로 그대로 이식한 것입니다. 규칙(직업 능력, 투표, 승리 조건)을
바꾸고 싶다면 이 파일 하나만 수정하면 서버 전체에 반영됩니다.
