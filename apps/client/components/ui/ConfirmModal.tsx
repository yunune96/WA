"use client";

import { useEffect } from "react";

import styles from "@/styles/ConfirmModal.module.css";

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  description?: React.ReactNode;
  footer?: React.ReactNode;
}

export default function ConfirmModal({
  open,
  title = "확인",
  description,
  footer,
}: ConfirmModalProps) {
  useEffect(() => {}, [open]);

  if (!open) return null;

  return (
    <div className={styles.backdrop}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
        </div>
        <div className={styles.body}>{description}</div>
        {footer && <div className={styles.actions}>{footer}</div>}
      </div>
    </div>
  );
}
