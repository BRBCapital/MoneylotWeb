"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import AuthShell from "@/components/templates/auth/AuthShell";
import AuthCard from "@/components/organisms/auth/AuthCard";
import Button from "@/components/ui/Button";
import { PasswordField } from "@/components/molecules/forms/Field";
import PasswordStrengthChecklist from "@/components/molecules/auth/PasswordStrengthChecklist";
import { checkPasswordValidity } from "@/lib/password";
import { resetWebPassword } from "@/services/auth";
import { ApiError } from "@/lib/apiClient";
import { showErrorToast, showSuccessToast } from "@/state/toastState";

export default function NewPasswordClient({ email }: { email: string }) {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const passwordStrength = useMemo(
    () => checkPasswordValidity(password),
    [password]
  );
  const matchError = useMemo(() => {
    if (!confirmPassword) return "";
    if (passwordStrength !== true) return String(passwordStrength);
    if (password !== confirmPassword) return "Passwords do not match.";
    return "";
  }, [password, confirmPassword, passwordStrength]);

  const canProceed =
    passwordStrength === true &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  return (
    <AuthShell logo="moneylotIconOne" stackClassName="-translate-y-[15%]">
      <AuthCard className="px-8 py-8">
        <h1 className="text-[16px] font-semibold text-[#2E2E2E]">
          Create a new password
        </h1>
        <p className="mt-1 text-[12px] text-[#7A7A7A]">
          Secure your account by creating a new password
        </p>

        <div className="mt-6 space-y-4">
          <PasswordField
            label="New Password"
            value={password}
            onChange={(v) => {
              setPassword(v);
              setSubmitError(null);
            }}
            autoComplete="new-password"
          />

          <PasswordStrengthChecklist password={password} />

          <PasswordField
            label="Confirm Password"
            value={confirmPassword}
            onChange={(v) => {
              setConfirmPassword(v);
              setSubmitError(null);
            }}
            autoComplete="new-password"
          />

          <div className="min-h-[16px]">
            {submitError ? (
              <p className="text-[11px] text-[#E53935]">{submitError}</p>
            ) : matchError ? (
              <p className="text-[11px] text-[#E53935]">{matchError}</p>
            ) : null}
          </div>

          <Button.MdPrimary
            fullWidth
            label="Reset Password"
            className="h-[46px] rounded-[10px] text-[14px]"
            disabled={!canProceed || loading}
            loading={loading ? "Please wait" : undefined}
            onClick={async () => {
              const e = (email || "").trim();
              if (!e) {
                const msg = "Missing email. Please restart forgot password flow.";
                setSubmitError(msg);
                showErrorToast("Error", msg);
                return;
              }
              if (!canProceed) return;
              try {
                setSubmitError(null);
                setLoading(true);
                const res = await resetWebPassword({ email: e, password });
                console.log("[Forgot Password] auth/reset-web-password response:", res);
                showSuccessToast("Success", res?.message || "Password reset successful");
                router.push(`/forgot-password/success?email=${encodeURIComponent(e)}`);
              } catch (err) {
                const msg =
                  err instanceof ApiError
                    ? err.message
                    : err instanceof Error
                      ? err.message
                      : "Unable to reset password. Please try again.";
                setSubmitError(msg);
                showErrorToast("Error", msg);
              } finally {
                setLoading(false);
              }
            }}
          />
        </div>
      </AuthCard>
    </AuthShell>
  );
}

