import { apiPostJson } from "@/lib/apiClient";

export type GenerateOtpRequest = {
  category: number; // category 4 = reset transaction pin
};

export type GenerateOtpResponse = {
  status: boolean;
  message: string;
  data?: unknown;
};

export async function generateOtp(payload: GenerateOtpRequest) {
  const res = await apiPostJson<GenerateOtpResponse>(
    "/api/v1/otp/generate",
    payload,
  );
  if (!res?.status) {
    throw new Error(res?.message || "Unable to send OTP. Please try again.");
  }
  return res;
}

export type WebGenerateOtpRequest = {
  email: string;
  otpType?: number;
};

export type WebGenerateOtpResponse = {
  status: boolean;
  message: string;
  data?: string | null;
};

const inflightWebGenerateOtp = new Map<string, Promise<WebGenerateOtpResponse>>();
const cooldownWebGenerateOtp = new Map<string, { at: number; res: WebGenerateOtpResponse }>();

export async function webGenerateOtp(email: string, otpType?: number) {
  const normalizedEmail = (email || "").trim();
  const payload: WebGenerateOtpRequest = {
    email: normalizedEmail,
    otpType,
  };
  if (!payload.email) throw new Error("Email is required");

  const key = `${normalizedEmail.toLowerCase()}|${typeof otpType === "number" ? otpType : "na"}`;

  const cached = cooldownWebGenerateOtp.get(key);
  if (cached && Date.now() - cached.at < 2000) return cached.res;
  if (cached) cooldownWebGenerateOtp.delete(key);

  const existing = inflightWebGenerateOtp.get(key);
  if (existing) return await existing;

  const p = (async () => {
    const res = await apiPostJson<WebGenerateOtpResponse>(
      "/api/v1/otp/web-generate-otp",
      payload,
    );
    if (!res?.status) {
      throw new Error(res?.message || "Unable to send OTP. Please try again.");
    }
    cooldownWebGenerateOtp.set(key, { at: Date.now(), res });
    return res;
  })();

  inflightWebGenerateOtp.set(key, p);
  try {
    return await p;
  } finally {
    inflightWebGenerateOtp.delete(key);
  }
}

export type WebValidateOtpRequest = {
  userId?: number | null;
  otp: string;
};

export type WebValidateOtpResponse = {
  status: boolean;
  message: string;
  data?: unknown;
  error?: string | null;
  statusCode?: number;
};

export async function webValidateOtp(
  userId: number | null | undefined,
  otp: string,
) {
  const payload: WebValidateOtpRequest = {
    userId: userId ?? null,
    otp: (otp || "").trim(),
  };
  if (!payload.otp) throw new Error("OTP is required");
  const res = await apiPostJson<WebValidateOtpResponse>(
    "/api/v1/otp/web-validate-otp",
    payload,
  );
  // v2 has been observed returning HTTP 200 + message:"Success" even when status/data are false.
  // Treat as success when there's no error and statusCode/message indicate success.
  const msg =
    typeof (res as any)?.message === "string" ? String((res as any).message).trim() : "";
  const ok =
    Boolean((res as any)?.status) ||
    Boolean((res as any)?.data) ||
    (Number((res as any)?.statusCode) === 200 &&
      (!("error" in (res as any)) ||
        (res as any).error == null ||
        String((res as any).error).trim() === "") &&
      msg.toLowerCase() === "success");
  if (!ok) throw new Error("Invalid OTP");
  return res;
}
