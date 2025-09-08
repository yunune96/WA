# WithoutAlone

위치 기반 취미 매칭 데모 웹사이트 타입스크립트(TypeScript) 기반 프론트엔드(Next.js)와 백엔드(NestJS)를 분리한 모노레포 구조의 프로젝트입니다.

## 기술 스택

-  ![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
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

## 로컬 개발 체크리스트

- 서버 루트 `.env` 설정
  - `FRONTEND_URL=http://localhost:3000`
  - `DB_URL`, `JWT_SECRET`, `REDIS_*` 등 개발용 값
- 클라이언트 `apps/client/.env.local`
  - `NEXT_PUBLIC_API_URL=http://localhost:3001`
  - `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=...`
- 실행 순서
  - `npm run server:dev` → `npm run client:dev`
- 브라우저에 남아있는 이전 배포 쿠키/스토리지 영향이 있으면 `accessToken` 쿠키와 `localStorage`의 `accessToken`을 삭제하고 시도

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

## 배포(ECR/ECS) 가이드

### 1) 이미지 빌드 및 푸시(클라이언트)

클라이언트는 빌드타임에 `NEXT_PUBLIC_API_URL`을 번들에 주입합니다. 배포 시 반드시 빌드 인자를 넣어주세요.

```powershell
# 공통 변수
$REGION="ap-northeast-2"
$ACCOUNT_ID="<YOUR_ACCOUNT_ID>"
$ECR="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"
$CLIENT_REPO="$ECR/withoutalone-client"
$TAG="YYYY-MM-DD-N"                           # 불변 태그 권장(예: 2025-09-03-1)

# 클라이언트 빌드(빌드 인자 중요)
$API="https://api.withoutalone.com"
docker build -f apps/client/Dockerfile -t "$CLIENT_REPO:$TAG" `
  --build-arg "NEXT_PUBLIC_API_URL=$API" `
  --build-arg "NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=<TOKEN>" `
  .

# 선택: 운영 고정 태그(prod)로도 함께 태깅
docker tag "$CLIENT_REPO:$TAG" "$CLIENT_REPO:prod"

# 푸시
docker push "$CLIENT_REPO:$TAG"
docker push "$CLIENT_REPO:prod"   # 선택
```

### 2) 이미지 빌드 및 푸시(서버)

```powershell
$SERVER_REPO="$ECR/withoutalone-server"
docker build -f apps/server/Dockerfile -t "$SERVER_REPO:$TAG" .
docker push "$SERVER_REPO:$TAG"
```

### 3) ECS 반영

- 태스크 정의가 고정 태그(`:prod`)를 바라보는 경우: 새 이미지 푸시 후 강제 롤아웃만

```powershell
aws ecs update-service --cluster <CLUSTER> --service <SERVICE> --force-new-deployment
```

- 불변 태그를 직접 사용하는 경우: 태스크 정의의 컨테이너 이미지 태그를 새 태그로 바꾼 새 리비전을 생성 후 서비스에 적용

```powershell
aws ecs update-service --cluster <CLUSTER> --service <SERVICE> --task-definition <NEW_TD_ARN>
```

### 4) 확인 방법

- ECR의 해당 태그 `imageDigest`와, ECS 실행 중 태스크의 `imageDigest`가 일치하는지 확인
- 브라우저 Network 탭 `Request URL`이 `https://api.withoutalone.com/...` 인지 확인

## 태그 전략(권장)

- 단기: `latest` 또는 `prod` 고정 태그를 서비스가 참조 → 새 이미지 푸시 후 `force-new-deployment`
- 장기: 불변 태그(날짜/커밋 SHA) + 운영 포인터(`:prod`) 병행
  - 추적/롤백은 불변 태그로, 운영은 `:prod`만 바라보게 구성

## 로그인 리디렉션/캐시 이슈 가이드

- 증상: 로그인 전에 보호 페이지(`/map`, `/matches`, `/chat`)가 `prefetch`되면서 미들웨어 리디렉션(`/login?redirect_to=...`)이 캐시 → 로그인 직후에도 다시 로그인 화면으로 이동
- 대응:
  - 미들웨어에서 프리패치 요청 통과
    - `if (request.headers.get("next-router-prefetch") === "1") return NextResponse.next();`
  - 보호 탭 링크는 `prefetch={false}` 또는 비로그인 시 `href`를 `/login?redirect_to=...`로 렌더링
  - 로그인 성공 후 `router.replace(target); router.refresh();`로 캐시 무효화 보강

## 채팅 배지(persist) 이슈 팁

- `chatUnreadStore`는 `persist` 사용 → 로그아웃 시 카운트를 비우고, 네비게이션 배지는 로그인 상태에서만 표시하도록 렌더링 분기

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

## CI/CD 파이프라인(예시)

### GitHub Actions 요약

- 주요 단계: checkout → Node 세팅 → 클라이언트/서버 빌드(ECR 태그) → ECR 로그인/푸시 → ECS 롤아웃
- 핵심 포인트
  - 클라이언트 빌드 시 `--build-arg NEXT_PUBLIC_API_URL` 반드시 주입
  - 태그 전략: 불변 태그(`YYYY-MM-DD-N` 또는 `GIT_SHA`) + 운영 포인터(`:prod`) 병행 권장
  - 배포는 `force-new-deployment` 또는 새 태스크 정의 리비전 적용

### 배포 실패 시 롤백

- `:prod` 포인터 방식: 직전 불변 태그로 `docker tag <immutable> :prod` 후 푸시 → `force-new-deployment`
- 불변 태그 방식: ECS 서비스에 이전 태스크 정의(이전 리비전)로 업데이트

## 헬스체크 / 오토스케일링

- 헬스체크 권장
  - Client(Target Group): HTTP GET `/` 200, 응답 타임아웃 5s, 간격 30s, 비정상 임계 2~3
  - Server(Target Group): 전용 엔드포인트 `/api/health` 추가 권장(200 OK). 없다면 임시로 TCP 3000 레벨 체크 사용 가능
  - ALB Idle Timeout: WebSocket 고려 120s 이상 권장
- 오토스케일링(ECS Service Auto Scaling)
  - TargetTracking: 평균 CPUUtilization 50~60% 또는 ALB RequestCountPerTarget
  - 최소 1, 최대 N(트래픽 기준 산정). 배포 전략은 기본 롤링(헬시 퍼센트 100/200) 유지 권장

## 모니터링 / 로깅

- CloudWatch Logs
  - 클라이언트/서버 각각 로그 그룹 분리, 보존기간 설정(예: 7/30일)
  - 심각 레벨(에러) 필터링 지표화 → 알람 생성
- 메트릭/알람
  - ALB: 5XXError, TargetResponseTime, RejectedConnectionCount
  - ECS: CPUUtilization, MemoryUtilization, Desired/Running Tasks
  - RDS/Redis(해당 시): CPU, 연결 수, 메모리, 스왑
  - SNS/Slack 등으로 알림 연동

## 보안/설정 베스트 프랙티스

- 서버 비밀값(JWT_SECRET, DB_URL, SMTP 등)은 SSM Parameter Store 또는 Secrets Manager로 관리
- CORS/쿠키
  - 서버 `FRONTEND_URL`은 실제 프런트 도메인으로 설정, `credentials: true`
  - 쿠키 SameSite=Lax, 프로덕션에서는 Secure 적용
- 소켓
  - ALB 443 Listener 하에서 WebSocket 동작(HTTP/1.1), Idle Timeout 조정
  - 필요 시 Sticky Sessions 비활성(기본 라운드로빈) 또는 세션 고정 요구사항 검토

## 운영 팁

- 브라우저에서 보호 라우트 prefetch 캐시 이슈 발생 시: 미들웨어의 `next-router-prefetch` 헤더 우회 + 링크 `prefetch={false}` 적용 검토
- 채팅 뱃지 카운트 persist: 로그아웃 시 스토어 초기화, 로그인 상태 조건부 렌더링
- 이미지 태그 관리
  - 불변 태그 + `:prod` 포인터 추천. 실행 중 실제 다이제스트는 ECS "실행 중 태스크" 상세에서 확인 가능
