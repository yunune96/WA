# WithoutAlone Monorepo

위치 기반 취미 매칭 데모 애플리케이션. 프론트엔드(Next.js)와 백엔드(NestJS)를 분리한 모노레포 구성입니다.

## 기술 스택

- Client: Next.js 14, React, Zustand, socket.io-client, Mapbox GL
- Server: NestJS, Prisma, PostgreSQL, Redis, socket.io, Passport-JWT

## 빠른 시작

1. 의존성 설치

```bash
npm install
```

2. 환경 변수

- 루트의 `.env`는 서버에서 사용합니다. 예시는 `env.example` 참고
- 클라이언트 전용 환경 변수는 `apps/client/.env.local` 등에 설정하세요

서버(.env 예시)

```bash
PORT=3001
NODE_ENV=development
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:3000
DB_URL=postgresql://user:pass@localhost:5432/mydatabase?schema=main
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
# 게이트웨이 CORS용(선택): 프론트 오리진
NEXT_PUBLIC_CLIENT_URL=http://localhost:3000
```

클라이언트(.env.local 예시)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=YOUR_MAPBOX_TOKEN
```

3. 개발 서버 실행

```bash
# 서버 (마이그레이션+시드 포함)
npm run server:dev

# 클라이언트
npm run client:dev
```

4. 프로덕션 빌드/실행

```bash
npm run server:build && npm run server:start
npm run client:build && npm run client:start
```

## 폴더 구조(요약)

```
apps/
  client/  # Next.js 앱 (UI, 배너/지도/매칭)
  server/  # NestJS 앱 (REST API, WebSocket, Prisma)
prisma/    # Prisma 스키마 및 마이그레이션
```

## 백엔드 요약

- 글로벌 프리픽스: `/api`
- 인증(JWT)
  - 로그인 성공 시 `accessToken`을 바디와 httpOnly 쿠키로 반환
  - `JwtStrategy`가 Authorization Bearer 또는 쿠키에서 토큰 추출
  - 만료시간: `JWT_EXPIRES_IN`(기본 24h)
- 위치/매칭
  - `PATCH /api/users/me/location` 내 위치 업데이트
  - `GET /api/locations/nearby-users?radius=500..5000` 주변 사용자 조회
  - Redis GEO + PostGIS 거리 계산
- 초대/채팅(소켓)
  - 초대 생성: `POST /api/chat/invites`
  - 수락: `POST /api/chat/invites/:inviteId/accept` → 채팅방 생성, `invite:update`
  - 거절: `POST /api/chat/invites/:inviteId/reject` → `invite:update`
  - 보낸 초대 동기화: `POST /api/chat/invites/sent/rejected`, `POST /api/chat/invites/sent/accepted`
  - WebSocket CORS: `NEXT_PUBLIC_CLIENT_URL` 오리진 허용

## 프론트엔드 요약

- API 베이스: `NEXT_PUBLIC_API_URL`(예: http://localhost:3001)
- 인증
  - 로그인/검증 성공 시 쿠키 재설정으로 보호 라우트(`/map`, `/matches`, `/chat`) 진입 보장
- 지도/매칭
  - 첫 로딩 시 내 위치 업데이트 → 주변 사용자 조회(거리 보장)
- 소켓 흐름
  - 로그인 시 `connectSocket()` 호출 → 연결되면 `invite:new`/`invite:update` 실시간 반영
  - 미연결 시 폴백 폴링(초기 1.5s, 실패 시 최대 8s 백오프)
- 전역 스토어
  - `nearbyStore`: 주변 사용자 캐시(로그인/초기화 시 1회)
  - `inviteStore`: 받은 초대 큐(소켓/폴백)
  - `noticeStore`: 수락/거절 알림 이력(persist)
  - `/matches`: 대기중(미응답)인 발신자는 숨김, 응답 후 자동 복귀

## CORS/연결 체크리스트

- REST: `FRONTEND_URL`에서 오는 요청만 허용, `credentials: true`
- Socket.IO: 클라이언트는 `auth: { token }`, 서버 게이트웨이는 동일 `JWT_SECRET`로 검증
- 네트워크 탭에서 WebSocket이 101 Switching Protocols이면 접속 성공

## 문제 해결 가이드

- accepted 404:
  - 요청이 프론트(3000)로 가지 않도록 `NEXT_PUBLIC_API_URL`이 서버(3001)를 가리키는지 확인
  - 서버 최신 코드로 재기동 후 `POST /api/chat/invites/sent/accepted` 200 확인
- pending이 계속 보임:
  - 소켓 미연결 상태에서의 폴링. 연결되면 중단됨(토큰/CORS 확인)
- 최초 거리 미표시:
  - 로그인/초기화 시 내 위치 업데이트 후 주변 사용자 조회 순서 유지

## 라이선스

개인 포트폴리오 데모 용도.
