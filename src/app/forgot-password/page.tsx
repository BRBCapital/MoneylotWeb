"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthShell from "@/components/templates/auth/AuthShell";
import AuthCard from "@/components/organisms/auth/AuthCard";
import AuthTextField from "@/components/molecules/auth/AuthTextField";
import Button from "@/components/ui/Button";
import { setUserEmail } from "@/state/appState";
import { webGenerateOtp } from "@/services/otp";
import { ApiError } from "@/lib/apiClient";
import { showSuccessToast } from "@/state/toastState";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <AuthShell logo="moneylotIconOne" stackClassName="-translate-y-[15%]">
      <AuthCard className="px-4 py-6 sm:px-8 sm:py-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-black/10 bg-white shadow-[0_1px_0_rgba(0,0,0,0.06)]"
          aria-label="Back"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 3.5L6 8L10 12.5"
              stroke="#2E2E2E"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <h1 className="text-[16px] font-semibold text-[#2E2E2E]">
          Reset Password
        </h1>
        <p className="mt-1 text-[12px] text-[#7A7A7A]">
          Enter your registered email address
        </p>

        <div className="mt-6 space-y-4">
          <AuthTextField
            label="Email"
            value={email}
            onChange={(v) => {
              setEmail(v);
              setError(null);
            }}
            placeholder="name@email.com"
            autoComplete="email"
          />
          <div className="min-h-[16px]">
            {error ? <p className="text-[11px] text-[#E53935]">{error}</p> : null}
          </div>

          <Button.MdPrimary
            fullWidth
            label="Proceed"
            className="h-[46px] rounded-[10px] text-[14px]"
            disabled={email.trim() === "" || loading}
            loading={loading ? "Please wait" : undefined}
            onClick={() => {
              const e = email.trim();
              if (!e) return;
              (async () => {
                try {
                  setError(null);
                  setLoading(true);
                  const res = await webGenerateOtp(e, 3);
                  console.log("[Forgot Password] otp/web-generate-otp response:", res);
                  showSuccessToast("Success", res?.message || "OTP generated successfully");
                  setUserEmail(e);
                  router.push(`/forgot-password/otp?email=${encodeURIComponent(e)}&sent=1`);
                } catch (err) {
                  if (err instanceof ApiError) setError(err.message);
                  else if (err instanceof Error) setError(err.message);
                  else setError("Unable to send OTP. Please try again.");
                } finally {
                  setLoading(false);
                }
              })();
            }}
          />
        </div>
      </AuthCard>
    </AuthShell>
  );
}

