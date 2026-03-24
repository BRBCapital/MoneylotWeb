"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Sidebar from "@/components/organisms/dashboard/Sidebar";
import { imagesAndIcons } from "@/constants/imagesAndIcons";
import { useRouter } from "next/navigation";
import { getSessionToken } from "@/state/appState";
import KycStatusPoller from "@/components/auth/KycStatusPoller";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const SIDEBAR_WIDTH = 210;
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);

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
      {/* Left Sidebar (fixed, full height) */}
      <div className="fixed inset-y-0 left-0 z-20">
        <Sidebar />
      </div>

      {/* Right Content (scrollable) */}
      <main
        className="h-screen overflow-y-auto bg-white"
        style={{ marginLeft: SIDEBAR_WIDTH }}
      >
        {/* Sticky top row + divider */}
        <div className="sticky top-0 z-10 bg-white">
          <div className="flex items-center justify-end px-8 py-5">
            <button type="button" aria-label="Notifications">
              {/* <Image
                src={imagesAndIcons.notif}
                alt="Notifications"
                width={20}
                height={20}
                className="h-[34px] w-[34px]"
              /> */}
            </button>
          </div>
          <div className="h-px w-full bg-[#EEEEEE]" />
        </div>

        {/* Page content */}
        <div className="px-8 py-6">{children}</div>
      </main>
    </div>
  );
}
