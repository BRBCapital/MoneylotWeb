"use client";

import { useEffect, useRef } from "react";
import { setAuthSession } from "@/state/appState";

const IDLE_MS = 5 * 60 * 1000; // 5 minutes
const LAST_ACTIVITY_KEY = "moneylot_last_activity_ts";
const FORCE_LOGOUT_KEY = "moneylot_force_logout_ts";
const WRITE_THROTTLE_MS = 5000;

function readTs(key: string): number | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeTs(key: string, ts: number) {
  try {
    window.localStorage.setItem(key, String(ts));
  } catch {
    // ignore
  }
}

function clearAllRecords() {
  try {
    setAuthSession(null);
  } catch {
    // ignore
  }
  try {
    window.sessionStorage?.clear();
  } catch {
    // ignore
  }
  try {
    window.localStorage?.clear();
  } catch {
    // ignore
  }
}

export default function InactivityWatcher() {
  const didLogoutRef = useRef(false);
  const lastActivityRef = useRef<number>(Date.now());
  const lastWriteRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const logout = () => {
      if (didLogoutRef.current) return;
      didLogoutRef.current = true;
      const ts = Date.now();

      // Broadcast logout to other tabs, then wipe storage.
      writeTs(FORCE_LOGOUT_KEY, ts);
      clearAllRecords();
      // Re-broadcast after clear (since clear removes the key).
      writeTs(FORCE_LOGOUT_KEY, ts);

      try {
        window.location.replace("/login");
      } catch {
        // ignore
      }
    };

    const markActivity = () => {
      if (didLogoutRef.current) return;
      const ts = Date.now();
      lastActivityRef.current = ts;
      if (ts - lastWriteRef.current > WRITE_THROTTLE_MS) {
        lastWriteRef.current = ts;
        writeTs(LAST_ACTIVITY_KEY, ts);
      }
    };

    const checkIdle = () => {
      if (didLogoutRef.current) return;
      const shared = readTs(LAST_ACTIVITY_KEY);
      const last = shared ?? lastActivityRef.current;
      if (Date.now() - last >= IDLE_MS) logout();
    };

    // Seed localStorage timestamp if absent.
    const shared0 = readTs(LAST_ACTIVITY_KEY);
    if (!shared0) writeTs(LAST_ACTIVITY_KEY, lastActivityRef.current);
    else lastActivityRef.current = Math.max(lastActivityRef.current, shared0);

    // Activity events
    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];
    const opts: AddEventListenerOptions = { passive: true };
    events.forEach((e) => window.addEventListener(e, markActivity, opts));

    // When returning to the tab, check idle *before* counting it as activity.
    const onFocus = () => {
      checkIdle();
      markActivity();
    };
    const onPageShow = () => {
      checkIdle();
      markActivity();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        checkIdle();
        markActivity();
      }
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibility);

    // Cross-tab sync
    const onStorage = (e: StorageEvent) => {
      if (didLogoutRef.current) return;
      if (e.storageArea !== window.localStorage) return;

      // If another tab clears storage or forces logout, logout here too.
      if (e.key === FORCE_LOGOUT_KEY || e.key === null) {
        logout();
        return;
      }
      if (e.key === LAST_ACTIVITY_KEY && e.newValue) {
        const n = Number(e.newValue);
        if (Number.isFinite(n)) lastActivityRef.current = Math.max(lastActivityRef.current, n);
      }
    };
    window.addEventListener("storage", onStorage);

    const interval = window.setInterval(checkIdle, 15000);

    return () => {
      window.clearInterval(interval);
      events.forEach((e) => window.removeEventListener(e, markActivity as any));
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return null;
}

