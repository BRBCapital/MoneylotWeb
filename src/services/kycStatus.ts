import { apiGetJson } from "@/lib/apiClient";

export type KycStatusResponse = {
  status?: boolean;
  message?: string | null;
  data?: unknown;
  statusCode?: number;
  error?: unknown;
};

function extractKycStatus(input: unknown): number | null {
  if (!input || typeof input !== "object") return null;
  const root: any = input;
  const d = root.data && typeof root.data === "object" ? root.data : root;
  const raw = (d as any)?.kycStatus ?? (d as any)?.KycStatus ?? (d as any)?.status;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

export async function getKycStatus(signal?: AbortSignal): Promise<number | null> {
  const res = await apiGetJson<KycStatusResponse>("/api/v1/verification/kyc-status", {
    signal,
  });
  const ok = Boolean((res as any)?.status) || (res as any)?.statusCode === 200;
  if (!ok) return null;
  return extractKycStatus(res);
}

