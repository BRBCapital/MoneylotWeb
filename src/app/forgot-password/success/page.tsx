"use client";

import { useRouter } from "next/navigation";
import AuthShell from "@/components/templates/auth/AuthShell";
import Button from "@/components/ui/Button";
import AuthCard from "@/components/organisms/auth/AuthCard";

export default function PasswordResetSuccessPage() {
  const router = useRouter();
  return (
    <AuthShell logo="moneylotIconOne" stackClassName="-translate-y-[15%]">
      <AuthCard className="px-8 py-8 text-center">
        <h1 className="text-[16px] font-semibold text-[#2E2E2E]">
          Password Reset Successful
        </h1>
        <p className="mt-1 text-[12px] text-[#7A7A7A]">
          Your new password has been updated.
        </p>

        <div className="mt-6">
          <Button.MdPrimary
            fullWidth
            label="Return to Login"
            onClick={() => router.push("/login")}
            className="h-[46px] rounded-[10px] text-[14px]"
          />
        </div>
      </AuthCard>
    </AuthShell>
  );
}

