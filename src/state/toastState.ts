import { atom, getDefaultStore } from "jotai";

export type AppToast = {
  id: number;
  type: "success" | "error";
  title: string;
  message: string;
};

export const appToastAtom = atom<AppToast | null>(null);

const store = getDefaultStore();

export function showSuccessToast(title: string, message: string) {
  store.set(appToastAtom, {
    id: Date.now(),
    type: "success",
    title,
    message,
  });
}

export function showErrorToast(title: string, message: string) {
  store.set(appToastAtom, {
    id: Date.now(),
    type: "error",
    title,
    message,
  });
}

export function clearToast() {
  store.set(appToastAtom, null);
}

