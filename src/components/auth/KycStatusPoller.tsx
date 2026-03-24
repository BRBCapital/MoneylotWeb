"use client";

import { useEffect, useRef } from "react";
import { getKycStatus } from "@/services/kycStatus";
import { getAuthSession, setAuthSession, getSessionToken } from "@/state/appState";

export default function KycStatusPoller({
  intervalMs = 60_000,
}: {
  intervalMs?: number;
}) {
  const inflightRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const tick = async () => {
      if (inflightRef.current) return;
      if (!getSessionToken()) return;
      const current = getAuthSession();
      if (!current) return;

      inflightRef.current = true;
      const ac = new AbortController();
      try {
        const kycStatus = await getKycStatus(ac.signal);
        if (typeof kycStatus !== "number") return;
        const prev = getAuthSession();
        if (!prev) return;
        if (prev.kycStatus === kycStatus) return;
        setAuthSession({ ...prev, kycStatus });
      } catch {
        // silent: background poller
      } finally {
        inflightRef.current = false;
        ac.abort();
      }
    };

    void tick(); // initial fetch
    const id = window.setInterval(() => void tick(), Math.max(15_000, intervalMs));
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return null;
}

