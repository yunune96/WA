# WithoutAlone

프로젝트 요약: 위치 기반 취미 매칭 데모 애플리케이션. 실시간 초대/채팅, 지도 기반 주변 탐색, JWT 인증과 httpOnly 쿠키, Redis GEO + PostGIS 거리 계산을 통해 “빠르게 매칭되고 바로 대화”까지 이어지는 경험을 제공합니다.

## 하이라이트

- **위치 기반 매칭**: Redis GEO와 PostGIS를 조합하여 반경 검색과 거리 정렬을 안정적으로 처리
- **실시간 초대/채팅**: Socket.IO로 `invite:new`/`invite:update` 및 채팅 메시지 실시간 반영, 미연결 시 폴백 폴링
- **지도 UI/UX**: Mapbox GL 기반으로 주변 유저를 직관적으로 탐색, 팝업/배너로 행동 유도
- **안정적 인증 흐름**: JWT + httpOnly 쿠키, 미들웨어 기반 보호 라우트 가드 및 프리패치 캐시 이슈 대응
- **운영/배포**: Docker 이미지, ECR/ECS 롤링 배포, 태그 전략(불변 태그 + prod 포인터) 적용 가능 구조

## 나의 역할과 기술 선택 근거

- **역할**: 기획 → 아키텍처 설계 → 프론트엔드(Next.js) → 백엔드(NestJS) → 인프라(Docker/ECR/ECS)까지 단독 구현
- **선택 근거**
  - Next.js 14: 파일 기반 라우팅과 미들웨어, 서버/클라이언트 경계를 명확히 하여 인증/가드 구현이 용이
  - NestJS + Prisma: 모듈화/DI로 도메인 분리, 스키마 주도 개발과 타입 안정성
  - Redis GEO + PostGIS: 반경 검색 성능 및 정확도 균형, 캐싱과 정밀 계산 역할 분리
  - Socket.IO: 실시간 이벤트 전파가 간단하며 브라우저 호환성, 백오프 전략과 결합 용이

## 아키텍처 다이어그램

```mermaid
graph LR
  subgraph "클라이언트(Next.js)"
    CApp["Next.js 14 앱<br/>(React, Zustand, Mapbox GL)"]
    CMW["Next.js 미들웨어<br/>(보호 라우트 가드/리디렉션)"]
    CSock["socket.io-client"]
    CMap["Mapbox GL 뷰"]
  end

  subgraph "서버(NestJS)"
    SAPI["REST API(/api)"]
    SGW["Socket.IO 게이트웨이"]
    AUTH["인증(JWT, Passport-JWT)"]
    LOC["위치/매칭 서비스<br/>(Redis GEO + PostGIS)"]
    CHAT["채팅/초대 서비스"]
    PRISMA["Prisma ORM"]
  end

  subgraph "데이터/외부 서비스"
    REDIS["Redis(GEO, 캐시)"]
    PG["PostgreSQL(PostGIS)"]
    MAPT["Mapbox Tiles API"]
  end

  CApp -->|"HTTPS/JSON, credentials:true(CORS)"| SAPI
  CSock -->|"WebSocket 연결(JWT 인증)"| SGW
  CApp -.->|"보호 라우트 체크"| CMW
  CMap -->|"타일 로드"| MAPT

  SAPI --> AUTH
  SAPI --> LOC
  SAPI --> CHAT
  SGW --> CHAT
  LOC --> PRISMA
  CHAT --> PRISMA
  LOC --> REDIS
  PRISMA --> PG

  CHAT -. "invite:new / invite:update 브로드캐스트" .-> SGW
```

## 주요 실행 흐름(요약)

```mermaid
sequenceDiagram
  autonumber
  participant U as "브라우저"
  participant M as "미들웨어(Next.js)"
  participant C as "클라이언트(Next.js)"
  participant S as "서버(NestJS API)"
  participant G as "소켓 게이트웨이(Socket.IO)"
  participant R as "Redis(GEO)"
  participant D as "PostgreSQL(Prisma)"

  U->>M: "보호 라우트 요청(/map|/matches|/chat)"
  alt "비로그인"
    M-->>U: "로그인으로 리다이렉트(/login?redirect_to=...)"
    U->>C: "로그인 폼 제출"
    C->>S: "POST /api/auth/login"
    S-->>U: "Set-Cookie accessToken + 바디 토큰"
  else "로그인됨"
    M-->>C: "통과"
  end

  C->>S: "PATCH /api/users/me/location"
  S->>R: "현재 위치 업데이트(GEOSET)"
  R-->>S: "OK"

  C->>S: "GET /api/locations/nearby-users?radius=..."
  S->>R: "주변 사용자 조회(GEORADIUS)"
  R-->>S: "좌표/거리 리스트"
  S-->>C: "주변 사용자 응답"

  C->>G: "connectSocket(token)"
  G-->>C: "invite:new / invite:update 이벤트"
  note over C: "미연결 시 폴백 폴링(1.5s→최대 8s 백오프)"

  C->>S: "POST /api/chat/invites (초대 발송)"
  S-->>G: "상대에게 invite:new 브로드캐스트"

  C->>S: "POST /api/chat/invites/:id/accept|reject"
  S->>D: "수락 시 채팅방 생성/업데이트"
  S-->>G: "invite:update(양쪽 전송)"

  C<->>G: "채팅 메시지 송수신"
  G->>S: "메시지 처리"
  S->>D: "메시지 저장"
```

## 주요 기능

- **인증/인가**: JWT 기반 로그인, httpOnly 쿠키로 세션 유지, 미들웨어 가드
- **위치 업데이트/주변 탐색**: 로그인 직후 내 위치 업데이트 → 반경 내 사용자 조회
- **초대/응답/채팅**: 초대 생성/수락/거절 흐름과 실시간 업데이트, 채팅 저장
- **전역 상태 관리**: `nearbyStore`, `inviteStore`, `noticeStore`, `chatUnreadStore(persist)`
- **폴백 전략**: 소켓 미연결 시 주기적 폴링(백오프), 연결 시 자동 전환

## 사용 시나리오(3단계)

1. 로그인 후 자동으로 내 위치를 갱신하고 주변 사용자를 지도에서 확인합니다.
2. 관심 있는 사용자에게 초대를 보내고, 수락/거절 상태를 실시간으로 확인합니다.
3. 매칭되면 바로 채팅으로 전환하여 대화를 시작합니다.

위치 기반 취미 매칭 데모 웹사이트 타입스크립트(TypeScript) 기반 프론트엔드(Next.js)와 백엔드(NestJS)를 분리한 모노레포 구조의 프로젝트입니다.

## 기술 스택

- ![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)

## 빠른 시작

요약: `npm install` → `npm run server:dev` → `npm run client:dev`

```bash
# 가장 빠른 실행
npm install
npm run server:dev
npm run client:dev
```

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

## 트러블슈팅 요약

- **로그인 직후에도 보호 라우트로 리디렉션**: 미들웨어에서 prefetch 요청 우회, 보호 링크는 `prefetch={false}`, 로그인 성공 후 `router.replace` + `router.refresh`로 캐시 무효화
- **소켓 미연결로 초대/채팅 지연**: 토큰/CORS 확인, 폴백 폴링은 연결 시 자동 중단됨(백오프 유지)
- **accepted 404 / 거리 미표시**: `NEXT_PUBLIC_API_URL`이 서버(3001)인지 확인, 서버 최신 코드로 재기동, "내 위치 업데이트 → 주변 조회" 순서 유지

## 배포 요약(ECR/ECS)

- **클라이언트**: Docker build 시 `--build-arg NEXT_PUBLIC_API_URL=...`와 Mapbox 토큰 주입 → ECR 푸시(불변 태그 + 선택 `:prod`)
- **서버**: Docker build → ECR 푸시
- **ECS 반영**: `:prod` 포인터면 강제 롤아웃, 불변 태그면 새 태스크 정의로 업데이트
- **검증**: ECR `imageDigest` = 실행 중 태스크 `imageDigest`, 브라우저 `Request URL`이 API 도메인인지 확인

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
