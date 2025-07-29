# Node.js TypeScript Server

Express.js와 TypeScript를 기반으로 한 서버 애플리케이션입니다.

## 🚀 시작하기

### 필수 요구사항
- Node.js 18.0.0 이상
- npm 또는 yarn

### 설치

```bash
# 의존성 설치
npm install

# 또는 yarn 사용 시
yarn install
```

### 환경 변수 설정

```bash
# 환경 변수 파일 복사
cp env.example .env

# .env 파일을 편집하여 필요한 설정을 추가
```

### 개발 서버 실행

```bash
# 개발 모드 (자동 재시작)
npm run dev:watch

# 또는 일반 개발 모드
npm run dev
```

### 프로덕션 빌드 및 실행

```bash
# TypeScript 컴파일
npm run build

# 프로덕션 서버 실행
npm start
```

## 📁 프로젝트 구조

```
src/
├── main.ts          # 애플리케이션 진입점
├── auth/            # 인증 관련 모듈
├── common/          # 공통 유틸리티
├── locations/       # 위치 관련 모듈
└── users/           # 사용자 관련 모듈
```

## 🔧 스크립트

- `npm run dev`: ts-node로 개발 서버 실행
- `npm run dev:watch`: nodemon으로 파일 변경 감지하며 개발 서버 실행
- `npm run build`: TypeScript 컴파일
- `npm start`: 컴파일된 JavaScript 실행
- `npm run clean`: dist 폴더 정리
- `npm run lint`: ESLint로 코드 검사
- `npm run lint:fix`: ESLint로 코드 검사 및 자동 수정

## 🌐 API 엔드포인트

- `GET /`: 서버 상태 확인
- `GET /health`: 헬스 체크
- `GET /api/users`: 사용자 목록 (예시)

## 🔒 보안

- Helmet.js를 통한 보안 헤더 설정
- CORS 설정으로 허용된 도메인만 접근 가능
- 환경 변수를 통한 민감한 정보 관리

## 📝 로깅

모든 HTTP 요청은 자동으로 로깅됩니다:
```
2024-01-01T00:00:00.000Z - GET /health
2024-01-01T00:00:01.000Z - POST /api/users
```

## 🛠️ 개발 가이드

### 새로운 라우트 추가

1. `src/` 폴더에 해당 기능의 폴더 생성
2. 라우터 파일 생성 (예: `userRoutes.ts`)
3. `main.ts`의 `getApiRoutes()` 메서드에 라우터 등록

### 미들웨어 추가

`main.ts`의 `initializeMiddlewares()` 메서드에 미들웨어를 추가하세요.

### 에러 처리

전역 에러 핸들러가 `initializeErrorHandling()` 메서드에 정의되어 있습니다. 