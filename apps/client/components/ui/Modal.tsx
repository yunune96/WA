"use client";

import styles from "@/styles/ModalBase.module.css";

interface ModalProps {
  id?: string;
  isOpen: boolean;
  title?: string;
  children: React.ReactNode;
}

export default function Modal({ id, isOpen, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent("wa-modal-close", { detail: { id: id ?? null } })
        )
      }
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button
            className={styles.closeBtn}
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("wa-modal-close", {
                  detail: { id: id ?? null },
                })
              )
            }
            aria-label="close"
          >
            ×
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
