"use client";

import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/organisms/dashboard/Sidebar";
import { usePathname, useRouter } from "next/navigation";
import { getSessionToken } from "@/state/appState";
import KycStatusPoller from "@/components/auth/KycStatusPoller";

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileNavOpen]);

  const tokenPresent = useMemo(() => {
    const direct = getSessionToken();
    if (direct && String(direct).trim()) return true;
    if (typeof window === "undefined") return false;
    try {
      const raw = window.localStorage.getItem("moneylot_auth_session");
      if (!raw) return false;
      const parsed = JSON.parse(raw) as any;
      const t = parsed?.sessionToken;
      return typeof t === "string" && t.trim().length > 0;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const check = () => {
      const t = getSessionToken();
      const ok = typeof t === "string" && t.trim().length > 0;
      if (!ok) {
        setAuthed(false);
        router.replace("/login");
      } else {
        setAuthed(true);
      }
    };

    check();

    // Handle browser back/forward cache restoring a protected page after logout.
    const onPageShow = () => check();
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [router]);

  if (tokenPresent === false && authed !== true) {
    return null;
  }

  if (authed === false) return null;
  return (
    <div className="scale-small-text h-screen bg-[#F6F6F6] overflow-hidden">
      <KycStatusPoller />

      {/* Mobile drawer backdrop */}
      <button
        type="button"
        aria-label={mobileNavOpen ? "Close menu" : undefined}
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity lg:hidden ${
          mobileNavOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        tabIndex={mobileNavOpen ? 0 : -1}
        onClick={() => setMobileNavOpen(false)}
      />

      {/* Sidebar: off-canvas on small screens, fixed on lg+ */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-[210px] transition-transform duration-200 ease-out lg:translate-x-0 ${
          mobileNavOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"
        } lg:shadow-none`}
      >
        <Sidebar onNavigate={() => setMobileNavOpen(false)} />
      </div>

      {/* Right Content (scrollable) */}
      <main className="ml-0 h-screen overflow-y-auto overflow-x-hidden bg-white lg:ml-[210px]">
        <div className="sticky top-0 z-10 bg-white">
          <div className="relative flex min-h-10 items-center justify-end gap-3 px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] sm:px-6 sm:pb-5 lg:min-h-0 lg:px-8 lg:pb-5 lg:pt-[calc(1.25rem+env(safe-area-inset-top,0px))]">
            <button
              type="button"
              className="absolute left-4 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg border border-[#EEEEEE] text-[#2E2E2E] hover:bg-[#FAFAFA] lg:hidden"
              aria-label={mobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((v) => !v)}
            >
              <MenuIcon />
            </button>
            <button
              type="button"
              className="h-10 w-10 shrink-0 lg:h-10 lg:w-10"
              aria-label="Notifications"
            >
              {/* notifications placeholder */}
            </button>
          </div>
          <div className="h-px w-full bg-[#EEEEEE]" />
        </div>

        <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-6">{children}</div>
      </main>
    </div>
  );
}
