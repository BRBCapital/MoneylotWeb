import { apiGetJson, apiPostJson } from "@/lib/apiClient";

export type BankDto = {
  bankCode: string;
  bankName: string;
  logo?: string;
};

export type GetBanksResponse = {
  status: boolean;
  message: string;
  data: BankDto[];
};

type RawBankDto =
  | { bank_code: string; bank_name: string; logo?: string }
  | { bankCode: string; bankName: string; logo?: string }
  | { code: string; name: string; logo?: string };

type RawGetBanksResponse = {
  status: boolean;
  message: string;
  data: RawBankDto[];
};

function normalizeBank(x: RawBankDto): BankDto | null {
  if (!x || typeof x !== "object") return null;
  // v2 shape: { id, name, code, logo }
  if ("code" in x && "name" in x) {
    const bankCode = String((x as any).code || "").trim();
    const bankName = String((x as any).name || "").trim();
    const logo =
      typeof (x as any).logo === "string" && (x as any).logo.trim()
        ? (x as any).logo.trim()
        : undefined;
    if (!bankCode || !bankName) return null;
    return { bankCode, bankName, logo };
  }
  // snake_case (API)
  if ("bank_code" in x && "bank_name" in x) {
    const bankCode = String((x as any).bank_code || "").trim();
    const bankName = String((x as any).bank_name || "").trim();
    const logo =
      typeof (x as any).logo === "string" && (x as any).logo.trim()
        ? (x as any).logo.trim()
        : undefined;
    if (!bankCode || !bankName) return null;
    return { bankCode, bankName, logo };
  }
  // camelCase (fallback)
  if ("bankCode" in x && "bankName" in x) {
    const bankCode = String((x as any).bankCode || "").trim();
    const bankName = String((x as any).bankName || "").trim();
    const logo =
      typeof (x as any).logo === "string" && (x as any).logo.trim()
        ? (x as any).logo.trim()
        : undefined;
    if (!bankCode || !bankName) return null;
    return { bankCode, bankName, logo };
  }
  return null;
}

export async function getBanks(signal?: AbortSignal): Promise<GetBanksResponse> {
  const res = await apiGetJson<RawGetBanksResponse>("/api/v1/withdrawal/get-banks", {
    signal,
  });
  if (!res?.status) {
    throw new Error(res?.message || "Unable to load banks. Please try again.");
  }
  const normalized = Array.isArray(res.data)
    ? res.data.map(normalizeBank).filter(Boolean)
    : [];
  return {
    status: res.status,
    message: res.message,
    data: normalized as BankDto[],
  };
}

export type ValidateAccountRequest = {
  bankCode: string;
  accountNumber: string;
};

export type ValidateAccountResponse = {
  status: boolean;
  message: string;
  data?: unknown;
};

export async function validateAccount(
  payload: ValidateAccountRequest
): Promise<ValidateAccountResponse> {
  const res = await apiPostJson<ValidateAccountResponse>(
    "/api/v1/withdrawal/validate-account",
    payload
  );
  if (!res?.status) {
    throw new Error(res?.message || "Unable to validate account. Please try again.");
  }
  return res;
}

export type CreateWithdrawalAccountRequest = {
  bankCode: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
};

export type CreateWithdrawalAccountResponse = {
  status: boolean;
  message: string;
  data?: unknown;
};

export async function createWithdrawalAccount(
  payload: CreateWithdrawalAccountRequest
): Promise<CreateWithdrawalAccountResponse> {
  const res = await apiPostJson<CreateWithdrawalAccountResponse>(
    "/api/v1/withdrawal/create",
    payload
  );
  if (!res?.status) {
    throw new Error(res?.message || "Unable to save bank details. Please try again.");
  }
  return res;
}

export type GetWithdrawalAccountsResponse = {
  status?: boolean;
  message?: string | null;
  data?: unknown;
  statusCode?: number;
  error?: unknown;
};

export async function getWithdrawalAccounts(
  signal?: AbortSignal
): Promise<GetWithdrawalAccountsResponse> {
  const res = await apiGetJson<GetWithdrawalAccountsResponse>("/api/v1/withdrawal/get", {
    signal,
  });
  const ok =
    Boolean(res?.status) ||
    (res?.statusCode === 200 && Array.isArray((res as any)?.data));
  if (!ok) {
    throw new Error(
      (typeof res?.message === "string" && res.message.trim())
        ? res.message
        : "Unable to load bank accounts. Please try again."
    );
  }
  return res;
}

export type UpdateWithdrawalAccountResponse = {
  status?: boolean;
  message?: string | null;
  data?: unknown;
  statusCode?: number;
  error?: unknown;
};

export async function updateWithdrawalAccount(
  id: number | string
): Promise<UpdateWithdrawalAccountResponse> {
  const res = await apiPostJson<UpdateWithdrawalAccountResponse>(
    "/api/v1/withdrawal/update",
    { id }
  );
  const ok = Boolean(res?.status) || res?.statusCode === 200;
  if (!ok) {
    throw new Error(
      (typeof res?.message === "string" && res.message.trim())
        ? res.message
        : "Unable to update bank account. Please try again."
    );
  }
  return res;
}

export type DeleteWithdrawalAccountResponse = {
  status?: boolean;
  message?: string | null;
  data?: unknown;
  statusCode?: number;
  error?: unknown;
};

export async function deleteWithdrawalAccount(
  id: number | string
): Promise<DeleteWithdrawalAccountResponse> {
  const res = await apiPostJson<DeleteWithdrawalAccountResponse>(
    "/api/v1/withdrawal/delete",
    { id }
  );
  const ok = Boolean(res?.status) || res?.statusCode === 200;
  if (!ok) {
    throw new Error(
      (typeof res?.message === "string" && res.message.trim())
        ? res.message
        : "Unable to delete bank account. Please try again."
    );
  }
  return res;
}

