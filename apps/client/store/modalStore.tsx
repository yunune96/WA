import { create } from "zustand";

interface ModalState {
  isOpen: boolean;
  message: string;
  onCloseCallback: (() => void) | null;
  show: (message: string, onCloseCallback?: () => void) => void;
  hide: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  message: "",
  onCloseCallback: null,

  show: (message, onCloseCallback = undefined) => {
    set({
      isOpen: true,
      message,
      onCloseCallback,
    });
  },

  hide: () => {
    const { onCloseCallback } = useModalStore.getState();
    if (onCloseCallback) {
      onCloseCallback();
    }
    set({ isOpen: false, message: "", onCloseCallback: null });
  },
}));
