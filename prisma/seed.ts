import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const hobbyData = [
  // 스포츠 및 아웃도어
  { name: "축구" },
  { name: "농구" },
  { name: "야구" },
  { name: "등산" },
  { name: "캠핑" },
  { name: "자전거" },
  { name: "조깅" },
  { name: "수영" },
  { name: "테니스" },
  { name: "클라이밍" },
  { name: "서핑" },
  { name: "낚시" },
  { name: "요가" },
  { name: "골프" },
  { name: "헬스" },
  { name: "국내여행" },
  { name: "해외여행" },
  // 예술 및 창작
  { name: "그림 그리기" },
  { name: "사진 촬영" },
  { name: "글쓰기" },
  { name: "디지털 드로잉" },
  { name: "캘리그라피" },
  { name: "뜨개질" },
  { name: "POP" },
  // 음악 및 공연
  { name: "기타" },
  { name: "피아노" },
  { name: "바이올린" },
  { name: "타악기" },
  { name: "노래" },
  { name: "춤" },
  { name: "음악 감상" },
  { name: "콘서트 관람" },
  // 지식 및 학습
  { name: "독서" },
  { name: "국어" },
  { name: "일어" },
  { name: "영어" },
  { name: "중국어" },
  { name: "불어" },
  { name: "라틴어" },
  { name: "아랍어" },
  { name: "스페인어" },
  { name: "한국사" },
  { name: "한문" },
  { name: "코딩" },
  { name: "재테크" },
  // 기술 및 제작
  { name: "목공예" },
  { name: "가죽공예" },
  { name: "도예" },
  { name: "3D프린팅" },
  { name: "프라모델" },
  { name: "레고" },
  { name: "영상 편집" },
  { name: "드론" },
  { name: "PC" },
  { name: "키보드" },
  // 요리 및 미식
  { name: "한식" },
  { name: "중식" },
  { name: "일식" },
  { name: "양식" },
  { name: "수산물" },
  { name: "베이킹" },
  { name: "커피" },
  { name: "맛집 탐방" },
  { name: "칵테일" },
  // 사회 및 휴식
  { name: "사회봉사" },
  { name: "명상" },
  { name: "보드게임" },
  { name: "영화관람" },
  // 애완 동물
  { name: "강아지" },
  { name: "고양이" },
  { name: "토끼" },
  { name: "조류" },
  { name: "거북류" },
  { name: "파충류" },
  { name: "복족류" },
  { name: "갑각류" },
  { name: "관상어" },
];

async function main() {
  console.log(`시드 입력 실행`);

  const result = await prisma.hobby.createMany({
    data: hobbyData,
    skipDuplicates: true,
  });

  console.log(`${result.count}개의 취미가 성공적으로 추가되었습니다.`);
  console.log(`시드 입력 완료`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// npx prisma db seed : 시드 입력 명령어
// npx prisma migrate reset : 데이터베이스 리셋 후 시드 입력
