// Api 응답 래퍼 타입
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}


