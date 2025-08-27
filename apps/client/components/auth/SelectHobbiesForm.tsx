"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiClient } from "@/lib/api";
import { HOBBY_CATEGORIES } from "@/lib/hobbyCategories";
import { useModalStore } from "@/store/modalStore";
import styles from "@/styles/SelectHobbies.module.css";

interface SelectHobbiesFormProps {
  userId: string;
  redirectTo?: string;
}

export default function SelectHobbiesForm({ userId, redirectTo }: SelectHobbiesFormProps) {
  const router = useRouter();
  const { show: showAlert } = useModalStore();

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedHobbies, setSelectedHobbies] = useState<Set<number>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const handleCategoryClick = (categoryName: string) => {
    setActiveCategory((prev) => (prev === categoryName ? null : categoryName));
  };

  const handleHobbyClick = (hobbyId: number) => {
    if (selectedHobbies.size >= 5 && !selectedHobbies.has(hobbyId)) {
      showAlert("관심분야는 최대 5개까지만 선택할 수 있습니다.");
      return;
    }
    setSelectedHobbies((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(hobbyId)) {
        newSelection.delete(hobbyId);
      } else {
        newSelection.add(hobbyId);
      }
      return newSelection;
    });
  };

  const handleSubmit = async () => {
    if (selectedHobbies.size === 0) {
      showAlert("하나 이상의 관심분야를 선택해주세요.");
      return;
    }

    setIsLoading(true);

    const hobbyIds = Array.from(selectedHobbies);
    const result = await apiClient.selectUserHobbies(userId, hobbyIds);

    if (result.error) {
      showAlert("저장에 실패했습니다: " + result.error);
    } else {
      showAlert("관심사 저장이 완료되었습니다.");
      router.push(redirectTo || "/");
    }
    setIsLoading(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>🔍당신의 관심사는?</h1>
        <p className={styles.description}>
          관심분야는 최대 5개만 선택할 수 있습니다
        </p>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <div className={styles.categoryContainer}>
          {HOBBY_CATEGORIES.map((category) => (
            <button
              key={category.categoryName}
              onClick={() => handleCategoryClick(category.categoryName)}
              className={`${styles.categoryButton} ${
                activeCategory === category.categoryName
                  ? styles.activeCategory
                  : ""
              }`}
            >
              {category.categoryName}
            </button>
          ))}
        </div>

        <div className={styles.hobbyGrid}>
          {activeCategory &&
            HOBBY_CATEGORIES.find(
              (cat) => cat.categoryName === activeCategory
            )?.hobbies.map((hobby) => (
              <button
                key={hobby.id}
                onClick={() => handleHobbyClick(hobby.id)}
                className={`${styles.hobbyButton} ${
                  selectedHobbies.has(hobby.id) ? styles.selected : ""
                }`}
              >
                {hobby.name}
              </button>
            ))}
        </div>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className={styles.submitButton}
        >
          {isLoading ? "저장 중..." : "선택 완료"}
        </button>
      </div>
    </div>
  );
}
