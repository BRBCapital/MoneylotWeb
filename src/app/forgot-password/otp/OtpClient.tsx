"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/templates/auth/AuthShell";
import AuthCard from "@/components/organisms/auth/AuthCard";
import OtpInputs from "@/components/inputs/OtpInputs";
import Button from "@/components/ui/Button";
import useCountdown from "@/hooks/useCountdown";
import { webGenerateOtp, webValidateOtp } from "@/services/otp";
import { ApiError } from "@/lib/apiClient";
import { setUserEmail } from "@/state/appState";
import { showSuccessToast } from "@/state/toastState";

export default function OtpClient({ email, sent }: { email: string; sent?: boolean }) {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const { formatted, isActive, restart } = useCountdown(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    restart(60);
    const e = (email || "").trim();
    if (!e) return;
    setUserEmail(e);
    if (sent) return;
    (async () => {
      try {
        setError(null);
        setLoading(true);
        const res = await webGenerateOtp(e, 3);
        console.log("[Forgot Password] otp/web-generate-otp response:", res);
        showSuccessToast("Success", res?.message || "OTP generated successfully");
      } catch (err) {
        if (err instanceof ApiError) setError(err.message);
        else if (err instanceof Error) setError(err.message);
        else setError("Unable to send OTP. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthShell logo="moneylotIconOne" stackClassName="-translate-y-[15%]">
      <AuthCard className="px-8 py-8">
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

        <h1 className="text-[16px] font-semibold text-[#2E2E2E]">Enter OTP</h1>
        <p className="mt-1 text-[12px] text-[#7A7A7A]">
          We&apos;ve sent a 6-digit one-time PIN to{" "}
          <span className="font-medium text-[#2E2E2E]">{email}</span>
        </p>

        <button
          type="button"
          onClick={() => router.push("/forgot-password")}
          className="mt-2 text-[11px] font-medium text-[#89E081] hover:opacity-80"
        >
          Wrong email?
        </button>

        <div className="mt-6">
          <OtpInputs
            length={6}
            onComplete={(val) => setOtp(val)}
            onEnter={(val) => {
              setOtp(val);
            }}
          />

          <div className="mt-4 min-h-[16px]">
            {error ? <p className="text-[11px] text-[#E53935]">{error}</p> : null}
          </div>

          <p
            onClick={async () => {
              if (isActive) return;
              const e = (email || "").trim();
              if (!e) {
                setError("Missing email. Go back and try again.");
                return;
              }
              try {
                setError(null);
                setLoading(true);
                const res = await webGenerateOtp(e, 3);
                console.log("[Forgot Password] otp/web-generate-otp (resend) response:", res);
                showSuccessToast("Success", "OTP resent successfully");
                restart(60);
              } catch (err) {
                if (err instanceof ApiError) setError(err.message);
                else if (err instanceof Error) setError(err.message);
                else setError("Unable to resend OTP. Please try again.");
              } finally {
                setLoading(false);
              }
            }}
            className={`mt-5 cursor-pointer text-[12px] text-center text-[#2E2E2E] ${
              isActive ? "opacity-70" : "hover:opacity-80"
            }`}
          >
            Didn&apos;t get code?{" "}
            {isActive ? `Resend in ${formatted}` : "Resend OTP"}
          </p>

          <div className="mt-6">
            <Button.MdPrimary
              fullWidth
              label="Proceed"
              className="h-[46px] rounded-[10px] text-[14px]"
              disabled={otp.length !== 6 || loading}
              loading={loading ? "Please wait" : undefined}
              onClick={async () => {
                const e = (email || "").trim();
                if (!e) {
                  setError("Missing email. Go back and try again.");
                  return;
                }
                if (otp.length !== 6) {
                  setError("Enter a valid OTP.");
                  return;
                }
                try {
                  setError(null);
                  setLoading(true);
                  const res = await webValidateOtp(null, otp);
                  console.log("[Forgot Password] otp/web-validate-otp response:", res);
                  router.push(`/forgot-password/new-password?email=${encodeURIComponent(e)}`);
                } catch (err) {
                  if (err instanceof ApiError) setError(err.message);
                  else if (err instanceof Error) setError(err.message);
                  else setError("Invalid OTP. Please try again.");
                } finally {
                  setLoading(false);
                }
              }}
            />
          </div>
        </div>
      </AuthCard>
    </AuthShell>
  );
}

