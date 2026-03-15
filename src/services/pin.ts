import { apiPostJson } from "@/lib/apiClient";

export type CreatePinRequest = {
  pin: string;
  pinConfirmation: string;
};

export type CreatePinResponse = {
  status: boolean;
  message: string;
  data?: unknown;
};

export async function createPin(payload: CreatePinRequest): Promise<CreatePinResponse> {
  const res = await apiPostJson<CreatePinResponse>("/api/v1/pin/create", payload);
  if (!res?.status) {
    throw new Error(res?.message || "Unable to create PIN. Please try again.");
  }
  return res;
}

export type ResetPinRequest = {
  otp: string;
  pin: string;
  pinConfirmation: string;
};

export type ResetPinResponse = {
  status: boolean;
  message: string;
  data?: unknown;
};

export async function resetPin(payload: ResetPinRequest): Promise<ResetPinResponse> {
  const res = await apiPostJson<ResetPinResponse>("/api/v1/pin/reset-pin", payload);
  if (!res?.status) {
    throw new Error(res?.message || "Unable to reset PIN. Please try again.");
  }
  return res;
}

export type UpdatePinRequest = {
  currentPin: string;
  newPin: string;
};

export type UpdatePinResponse = {
  status: boolean;
  message: string;
  data?: unknown;
};

export async function updatePin(payload: UpdatePinRequest): Promise<UpdatePinResponse> {
  const res = await apiPostJson<UpdatePinResponse>("/api/v1/pin/update", payload);
  if (!res?.status) {
    throw new Error(res?.message || "Unable to update PIN. Please try again.");
  }
  return res;
}

export type ValidatePinRequest = {
  pin: string;
};

export type ValidatePinResponse = {
  status: boolean;
  message: string;
  data?: unknown;
};

export async function validatePin(
  payload: ValidatePinRequest
): Promise<ValidatePinResponse> {
  const res = await apiPostJson<ValidatePinResponse>(
    "/api/v1/pin/validate-pin",
    { pin: String(payload?.pin || "").trim() }
  );
  if (!res?.status) {
    throw new Error(res?.message || "Invalid PIN. Please try again.");
  }
  return res;
}

