"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { useAtomValue } from "jotai";
import { authSessionAtom } from "@/state/appState";
import { resolveSetupRoute } from "@/lib/setupProgress";
import {
  clearPendingSetupRoute,
  getPendingSetupRoute,
} from "@/lib/pendingSetup";

export default function DashboardHeader() {
  const router = useRouter();
  const session = useAtomValue(authSessionAtom);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const firstName = useMemo(() => {
    const fn = session?.firstName ? String(session.firstName).trim() : "";
    return fn;
  }, [session?.firstName]);

  const kycStatus = useMemo(() => {
    const raw = (session as any)?.kycStatus;
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
    // Backward compat: treat NIN verified as KYC approved.
    const ninOk = Boolean(
      session?.ninVerified ?? (session as any)?.isNINVerified,
    );
    return ninOk ? 3 : 1;
  }, [session]);

  const isKycVerified = kycStatus === 3;

  const setup = useMemo(() => resolveSetupRoute(session as any), [session]);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    // Read any pending redirect saved at login time.
    const pending = getPendingSetupRoute();
    setPendingHref(pending?.href || null);
  }, []);

  useEffect(() => {
    // If user has completed setup, clear any stale pending redirect.
    if (!setup.isComplete) return;
    clearPendingSetupRoute();
    setPendingHref(null);
  }, [setup.isComplete]);

  const today = new Date();
  const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
  const dayNum = today.getDate();
  const monthName = today.toLocaleDateString("en-US", { month: "long" });
  const yearNum = today.getFullYear();
  const ordinal = (() => {
    const v = dayNum % 100;
    if (v >= 11 && v <= 13) return "th";
    switch (dayNum % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  })();
  const dateStr = `${dayNum}${ordinal} ${monthName} ${yearNum}`;
  const greeting = useMemo(() => {
    if (!mounted) return "Good day";
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "Good morning";
    if (h >= 12 && h < 17) return "Good afternoon";
    return "Good evening";
  }, [mounted]);

  return (
    <div className="flex items-center justify-between pb-5">
      {/* Left: Greeting */}
      <div>
        <h1 className="text-[20px] font-semibold text-[#2E2E2E]">
          {greeting}{mounted && firstName ? `, ${firstName}` : ""}
        </h1>
        {!setup.isComplete ? (
          <p className="mt-1 text-[12px] font-medium text-[#FFC130]">
            Your profile setup is incomplete
          </p>
        ) : (
          <p className="mt-1 text-[14px] text-[#5F6368]">
            {dayName} {dateStr}
          </p>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {!setup.isComplete ? (
          <Button.SmPrimary
            label="Continue Setup"
            height={40}
            width={170}
            fontSize="text-[13px]"
            className="rounded-[8px] font-medium"
            onClick={() => {
              const href = pendingHref || setup.href;
              clearPendingSetupRoute();
              setPendingHref(null);
              router.push(href);
            }}
          />
        ) : (
          <>
            <Button.SmSecondary
              label="Withdraw Funds"
              height={40}
              width={155}
              fontSize="text-[13px]"
              disabled={!isKycVerified}
              backgroundColor={!isKycVerified ? "bg-[#E5E7EB]" : "bg-white"}
              textColor={!isKycVerified ? "text-[#9CA3AF]" : "text-[#2E2E2E]"}
              className={`border rounded-[8px] font-medium ${
                !isKycVerified ? "border-[#D1D5DB]" : "border-[#EEEEEE]"
              }`}
              onClick={() => router.push("/dashboard/withdrawals")}
            />
            <Button.SmPrimary
              label="New Investment"
              height={40}
              width={155}
              fontSize="text-[13px]"
              className="rounded-[8px] font-medium"
              onClick={() => router.push("/dashboard/new-investment")}
            />
          </>
        )}
      </div>
    </div>
  );
}
