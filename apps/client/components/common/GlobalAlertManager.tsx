"use client";

import { useModalStore } from "@/store/modalStore";

import CustomAlertModal from "./CustomAlertModal";

export default function GlobalAlertManager() {
  const { isOpen, message, hide } = useModalStore();

  if (!isOpen) {
    return null;
  }

  return <CustomAlertModal message={message} onClose={hide} />;
}
