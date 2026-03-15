"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "@/components/templates/auth/AuthShell";
import AuthCard from "@/components/organisms/auth/AuthCard";
import Button from "@/components/ui/Button";
import { imagesAndIcons } from "@/constants/imagesAndIcons";

export default function AccountLockedPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const email = (sp.get("email") || "").trim();

  const resetHref = useMemo(() => {
    if (!email) return "/forgot-password";
    const q = new URLSearchParams();
    q.set("email", email);
    return `/forgot-password?${q.toString()}`;
  }, [email]);

  return (
    <AuthShell logo="moneylotIconOne" stackClassName="-translate-y-[15%]">
      <AuthCard className="max-w-[640px] px-8 py-10">
        <div className="mx-auto flex w-full max-w-[520px] flex-col items-center text-center">
          <Image
            src={imagesAndIcons.accountLocked}
            alt=""
            width={86}
            height={86}
            className="h-[86px] w-[86px]"
          />

          <h1 className="mt-4 text-[20px] font-bold text-[#2E2E2E]">
            Account Locked
          </h1>
          <p className="mt-1 text-[12px] leading-[18px] text-[#5F6368] max-w-[380px]">
            Your account has been temporarily locked due to multiple failed login attempts.
          </p>

          <div className="mt-6 w-full">
            <Button.MdPrimary
              fullWidth
              label="Reset Password"
              className="h-[50px] rounded-[10px] text-[14px] bg-[#89E081] hover:bg-[#76D770] text-[#1B332D]"
              onClick={() => router.push(resetHref)}
            />
          </div>
        </div>
      </AuthCard>
    </AuthShell>
  );
}

