"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import AuthCard from "@/components/organisms/auth/AuthCard";
import AuthShell from "@/components/templates/auth/AuthShell";
import AuthTextField from "@/components/molecules/auth/AuthTextField";
import Button from "@/components/ui/Button";
import { imagesAndIcons } from "@/constants/imagesAndIcons";
import { securityLogin } from "@/services/auth";
import { ApiError } from "@/lib/apiClient";
import { setAuthSession, setUserEmail } from "@/state/appState";
import { showErrorToast, showSuccessToast } from "@/state/toastState";
import { resolveSetupRoute } from "@/lib/setupProgress";
import { setPendingSetupRoute } from "@/lib/pendingSetup";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function getAttemptsLeft(details: unknown): number | null {
  if (!details || typeof details !== "object") return null;
  const d: any = details;
  const data = d?.data && typeof d.data === "object" ? d.data : d;
  const raw = (data as any)?.attemptsLeft ?? (data as any)?.attempts_left;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

function getIsLocked(details: unknown): boolean {
  if (!details || typeof details !== "object") return false;
  const d: any = details;
  const data = d?.data && typeof d.data === "object" ? d.data : d;
  return Boolean((data as any)?.isLocked ?? (data as any)?.is_locked);
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canProceed = useMemo(
    () => isValidEmail(email) && password.trim().length > 0,
    [email, password]
  );

  return (
    <AuthShell logo="moneylotIconOne" stackClassName="-translate-y-[15%]">
      <AuthCard className="px-8 py-8">
        <h1 className="text-[16px] font-semibold text-[#2E2E2E]">Welcome,</h1>
        <p className="mt-1 text-[12px] text-[#7A7A7A]">
          Enter your login credentials
        </p>

        <div className="mt-6 space-y-4">
          <AuthTextField
            label="Email"
            value={email}
            onChange={(v) => {
              setEmail(v);
              setError(null);
            }}
            placeholder="e.g. name@email.com"
            autoComplete="email"
          />

          <AuthTextField
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(v) => {
              setPassword(v);
              setError(null);
            }}
            placeholder="••••••••••••"
            autoComplete="current-password"
            rightIcon={{
              src: showPassword
                ? imagesAndIcons.hidePassword
                : imagesAndIcons.showPassword,
              alt: showPassword ? "Hide password" : "Show password",
            }}
            onRightIconClick={() => setShowPassword((v) => !v)}
          />

          <div className="flex items-center justify-between">
            <Link
              className="text-[12px] font-medium text-[#89E081] hover:opacity-80"
              href="/forgot-password"
            >
              Forgot Password?
            </Link>
          </div>

          <div className="min-h-[16px]">
            {error ? (
              <p className="text-[11px] text-[#E53935]">{error}</p>
            ) : null}
          </div>

          <div className="pt-2">
            <Button.MdPrimary
              fullWidth
              label="Proceed"
              disabled={!canProceed || isLoading}
              loading={isLoading ? "Please wait" : undefined}
              className="h-[46px] rounded-[10px] text-[14px]"
              onClick={async () => {
                setError(null);
                const emailValue = email.trim();
                if (!isValidEmail(emailValue)) {
                  setError("Enter a valid email address");
                  return;
                }
                if (!password.trim()) {
                  setError("Password is required");
                  return;
                }
                try {
                  setIsLoading(true);
                  const res = await securityLogin({
                    emailAddress: emailValue,
                    password,
                  });
                  console.log("[Login] auth/login response:", res);
                  if (!res?.status || !res?.data?.sessionToken) {
                    throw new Error(res?.message || "Unable to login");
                  }

                  setUserEmail(emailValue);
                  setAuthSession({
                    accountId: res.data.accountId,
                    userId: res.data.userId,
                    firstName: res.data.firstName,
                    lastName: res.data.lastName,
                    refreshToken: res.data.refreshToken,
                    sessionToken: res.data.sessionToken,
                    expires: res.data.expires,
                    refreshTokenExpiryTime: res.data.refreshTokenExpiryTime,
                    enforcePassword: res.data.enforcePassword,
                    stage1: Boolean((res.data as any).stage1),
                    stage1_5: Boolean((res.data as any).stage1_5),
                    stage2: Boolean((res.data as any).stage2),
                    stage3: Boolean((res.data as any).stage3),
                    stage3_5: Boolean((res.data as any).stage3_5),
                    stage4: Boolean((res.data as any).stage4),
                    kycStatus:
                      typeof (res.data as any).kycStatus === "number"
                        ? (res.data as any).kycStatus
                        : Number.isFinite(Number((res.data as any).kycStatus))
                          ? Number((res.data as any).kycStatus)
                          : undefined,
                    ninVerified: Boolean(
                      (res.data as any).ninVerified ?? (res.data as any).isNINVerified
                    ),
                  });

                  showSuccessToast("Success", res?.message || "Login successful");
                  const next = resolveSetupRoute(res.data as any);
                  if (!next.isComplete) setPendingSetupRoute(next);
                  router.push("/dashboard");
                } catch (e) {
                  // Account locked flow (failed attempts)
                  if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
                    const attemptsLeft = getAttemptsLeft(e.details);
                    const isLocked = getIsLocked(e.details);
                    const msgLower = (e.message || "").toLowerCase();
                    // Only treat as locked when the message indicates the account is ALREADY locked,
                    // not a warning like "will be locked after X more attempts".
                    const looksLocked =
                      /\blocked out\b/.test(msgLower) ||
                      /\baccount locked\b/.test(msgLower) ||
                      /\bhas been locked\b/.test(msgLower) ||
                      (/\btemporarily locked\b/.test(msgLower) &&
                        !/\bwill be temporarily locked\b/.test(msgLower));
                    // If the backend explicitly tells us attempts are remaining, never redirect.
                    const hasRemainingAttempts =
                      typeof attemptsLeft === "number" && attemptsLeft > 0;
                    if (
                      (isLocked && !hasRemainingAttempts) ||
                      (!hasRemainingAttempts &&
                        (looksLocked ||
                          (typeof attemptsLeft === "number" && attemptsLeft <= 0)))
                    ) {
                      const q = new URLSearchParams();
                      const emailValue = email.trim();
                      if (emailValue) q.set("email", emailValue);
                      // Use push (not replace) so browser Back returns to /login.
                      router.push(`/account-locked${q.toString() ? `?${q.toString()}` : ""}`);
                      return;
                    }

                    const base = e.message || "Invalid email or password";
                    const msg =
                      typeof attemptsLeft === "number"
                        ? `${base} (${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} left)`
                        : base;
                    setError(msg);
                    showErrorToast("Error", msg);
                    return;
                  }

                  const msg =
                    e instanceof Error ? e.message : "Login failed. Please try again.";
                  setError(msg);
                  showErrorToast("Error", msg);
                } finally {
                  setIsLoading(false);
                }
              }}
            />
          </div>

          <p className="pt-2 text-center text-[12px] text-[#7A7A7A]">
            Don&apos;t have an account?{" "}
            <Link
              className="font-medium text-[#89E081] hover:opacity-80"
              href="/entry"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </AuthCard>
    </AuthShell>
  );
}

