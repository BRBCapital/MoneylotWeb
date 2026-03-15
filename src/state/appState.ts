import { atom, getDefaultStore } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

export type AuthSession = {
  accountId: number;
  userId: number;
  firstName: string;
  lastName: string;
  refreshToken: string;
  sessionToken: string;
  expires: string;
  refreshTokenExpiryTime: string;
  enforcePassword: boolean;
  kycStatus?: number;
  ninVerified?: boolean;
  /** @deprecated v1 field name kept for backward compatibility */
  isNINVerified?: boolean;
};

export type Stage1SignupContext = {
  userId: number | null;
  accountId: number | null;
  emailAddress: string;
  password: string;
  firstName: string;
  lastName: string;
};

const noopStorage = {
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => {},
  removeItem: (_key: string) => {},
};

function getBrowserStorage(): Storage {
  if (typeof window === "undefined") return noopStorage as unknown as Storage;
  return window.localStorage;
}

export const authSessionAtom = atomWithStorage<AuthSession | null>(
  "moneylot_auth_session",
  null,
  createJSONStorage(getBrowserStorage),
  { getOnInit: true }
);

export const userEmailAtom = atomWithStorage<string>(
  "moneylot_user_email",
  "",
  createJSONStorage(getBrowserStorage),
  { getOnInit: true }
);

export const stage1SignupContextAtom = atom<Stage1SignupContext>({
  userId: null,
  accountId: null,
  emailAddress: "",
  password: "",
  firstName: "",
  lastName: "",
});

const store = getDefaultStore();

export function setAuthSession(session: AuthSession | null) {
  store.set(authSessionAtom, session);
}

export function setUserEmail(email: string) {
  store.set(userEmailAtom, (email || "").trim());
}

export function getUserEmail() {
  const v = store.get(userEmailAtom);
  return (v || "").trim() || null;
}

export function getAuthSession() {
  return store.get(authSessionAtom);
}

export function getSessionToken() {
  return getAuthSession()?.sessionToken || null;
}

export function getUserId() {
  return getAuthSession()?.userId ?? null;
}

export function getAccountId() {
  return getAuthSession()?.accountId ?? null;
}

