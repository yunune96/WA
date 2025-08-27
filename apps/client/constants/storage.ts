// storage.ts
// 브라우저 로컬스토리지에서 사용하는 키를 한 곳에서 관리합니다.
// - ACCESS_TOKEN_KEY: JWT 토큰 저장 키
// - RECENT_MATCHED_USER_IDS_KEY: 최근 매칭 사용자 ID 리스트 캐시
// - IGNORE_PIN_ONCE_KEY: 다음 진입 시 핀 우선순위 무시 1회 플래그
export const ACCESS_TOKEN_KEY = "accessToken";
export const RECENT_MATCHED_USER_IDS_KEY = "recentMatchedUserIds";
export const IGNORE_PIN_ONCE_KEY = "ignorePinOnce";


