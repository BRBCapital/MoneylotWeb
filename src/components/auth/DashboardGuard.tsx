"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSessionToken } from "@/state/appState";

function hasToken(): boolean {
  const t = getSessionToken();
  if (typeof t === "string" && t.trim()) return true;
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem("moneylot_auth_session");
    if (!raw) return false;
    const parsed = JSON.parse(raw) as any;
    const tok = parsed?.sessionToken;
    return typeof tok === "string" && tok.trim().length > 0;
  } catch {
    return false;
  }
}

export default function DashboardGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => {
      const ok = hasToken();
      setAuthed(ok);
      if (!ok) router.replace("/login");
    };

    check();

    // Covers browser back/forward cache restoring protected screens.
    const onPageShow = () => check();
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [router]);

  if (!authed) return null;
  return <>{children}</>;
}
