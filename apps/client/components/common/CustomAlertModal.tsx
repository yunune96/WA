"use client";

import styles from "@/styles/CustomAlertModal.module.css";
import { useEffect } from "react";

interface CustomAlertModalProps {
  message: string;
  onClose: () => void;
}

export default function CustomAlertModal({
  message,
  onClose,
}: CustomAlertModalProps) {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <p className={styles.message}>{message}</p>
        <button className={styles.closeButton} onClick={onClose}>
          확인
        </button>
      </div>
    </div>
  );
}
