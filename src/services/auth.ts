import { apiPostJson, ApiError } from "@/lib/apiClient";
import type { AuthTokenResponse } from "@/services/signup";

export type ValidateOtpRequest = {
  otp: string;
};

export type LoginRequest = {
  emailAddress: string;
  password: string;
};

export async function validateOtp(userId: number, payload: ValidateOtpRequest) {
  return await apiPostJson<AuthTokenResponse>(`/api/v1/otp/validate/${userId}`, payload);
}

export async function securityLogin(payload: LoginRequest) {
  // Ensure login is treated as a public call (no bearer token attached),
  // so 401 responses can be handled in the UI (e.g. account locked flow).
  return await apiPostJson<AuthTokenResponse>("/api/v1/auth/login", payload, {
    headers: { Authorization: "" },
  });
}

export type VerifyEmailAddressRequest = {
  type: "personal" | "business";
  emailAddress: string;
  businessName: string;
};

export type VerifyEmailAddressData = {
  userId?: number;
  emailVerified?: boolean;
  completed?: boolean;
  verified?: boolean;
  hasPin?: boolean;
  bvn?: boolean;
  stage1?: boolean;
  stage2?: boolean;
  stage3?: boolean;
  stage3_5?: boolean;
  stage4?: boolean;
};

export type VerifyEmailAddressResponse = {
  status?: boolean;
  data?: VerifyEmailAddressData | null;
  message?: string | null;
  error?: unknown;
  statusCode?: number;
};

// Note: Backend may return 409 for "email exists" with useful stage flags.
// We treat that as a normal response (not an error) for onboarding resume.
export async function verifyEmailAddress(
  payload: VerifyEmailAddressRequest,
): Promise<VerifyEmailAddressResponse> {
  try {
    return await apiPostJson<VerifyEmailAddressResponse>(
      "/api/v1/auth/verify-email-address",
      {
        type: payload.type,
        emailAddress: (payload.emailAddress || "").trim(),
        businessName: payload.businessName ?? "",
      },
      { headers: { Authorization: "" } },
    );
  } catch (e) {
    if (e instanceof ApiError) {
      const details = e.details;
      if (details && typeof details === "object") {
        return details as VerifyEmailAddressResponse;
      }
    }
    throw e;
  }
}

export type ResetWebPasswordRequest = {
  email: string;
  password: string;
};

export type ResetWebPasswordResponse = {
  status?: boolean;
  message?: string | null;
  data?: unknown;
  statusCode?: number;
  error?: unknown;
};

export async function resetWebPassword(payload: ResetWebPasswordRequest) {
  const res = await apiPostJson<ResetWebPasswordResponse>(
    "/api/v1/auth/reset-web-password",
    {
      email: (payload.email || "").trim(),
      password: payload.password,
    },
    { headers: { Authorization: "" } },
  );
  const ok = Boolean(res?.status) || res?.statusCode === 200;
  if (!ok) {
    throw new Error(
      (typeof res?.message === "string" && res.message.trim())
        ? res.message
        : "Unable to reset password. Please try again.",
    );
  }
  return res;
}

