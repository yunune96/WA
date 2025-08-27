export function toKoreanTime(date: Date | string): Date {
  const utcDate = new Date(date);
  return new Date(utcDate.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
}

export function formatKoreanTime(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const koreanDate = toKoreanTime(date);
  return koreanDate.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    ...options,
  });
}

export function getRelativeTime(date: Date | string): string {
  const koreanDate = toKoreanTime(date);
  const now = new Date();
  const diffInSeconds = Math.floor(
    (now.getTime() - koreanDate.getTime()) / 1000
  );

  if (diffInSeconds < 60) {
    return "방금 전";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}분 전`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}시간 전`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}일 전`;
  }
}
