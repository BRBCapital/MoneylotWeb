import { apiGetJson, apiPostJson } from "@/lib/apiClient";

export type ValidateIdentityAddressRequest = {
  bvn: string;
  dateOfBirth: string; // YYYY-MM-DD e.g. 1995-10-19
  countryOfResidency: string;
  residentialAddress: string;
  city: string;
  state: string;
};

export type ValidateIdentityAddressResponse = {
  status: boolean;
  message: string;
  data?: unknown;
};

export async function validateIdentityAddress(
  payload: ValidateIdentityAddressRequest
): Promise<ValidateIdentityAddressResponse> {
  const res = await apiPostJson<ValidateIdentityAddressResponse>(
    "/api/v1/webinvestment/validate-identity-address",
    payload
  );
  if (!res?.status) {
    throw new Error(res?.message || "Unable to validate identity. Please try again.");
  }
  return res;
}

export async function getInvestmentRate(signal?: AbortSignal) {
  // Backwards compat wrapper (kept for any existing imports)
  return await apiGetJson<GetRateResponse>("/api/v1/webinvestment/get-rate", { signal });
}

export type InvestmentRateDto = {
  id: number;
  typeId: number;
  rate: number;
  rateFormatted: string; // "7.5% p.a"
  typeName: string | null;
  tenorId: number;
  investmentPeriod: number;
  investmentPeriodFormatted: string; // "60 days"
};

export type GetRateResponse = {
  status: boolean;
  message: string;
  data: InvestmentRateDto[];
};

export async function getRates(signal?: AbortSignal): Promise<GetRateResponse> {
  const res = await apiGetJson<GetRateResponse>("/api/v1/webinvestment/get-rate", { signal });
  if (!res?.status) {
    throw new Error(res?.message || "Unable to load rates. Please try again.");
  }
  return res;
}

export type GetExpectedReturnRequest = {
  tenorId: number;
  amount: number;
};

export type GetExpectedReturnResponse = {
  status: boolean;
  message: string;
  data: unknown;
};

export async function getExpectedReturn(
  payload: GetExpectedReturnRequest
): Promise<{
  status: boolean;
  message: string;
  expectedReturn: number;
  totalAtMaturity?: number;
  maturityDate?: string;
  investmentType?: string;
  rate?: number;
  rateFormatted?: string;
  tenor?: string;
}> {
  const res = await apiPostJson<GetExpectedReturnResponse>(
    "/api/v1/webinvestment/get-expected-return",
    payload
  );
  if (!res?.status) {
    throw new Error(res?.message || "Unable to compute expected return. Please try again.");
  }

  // Seen shapes:
  // - { data: 2500 }
  // - { data: { data: 2500 } }
  // - { data: { status, message, data: 2500 } }
  // - { data: { expectedReturn: 1775.34, totalAtMaturity: 401775.34, maturityDate: "26th March 2026", ... } }
  // - { data: { data: { expectedReturn: 1775.34, ... } } }
  const root = res.data as any;
  const obj =
    root && typeof root === "object" && root.data && typeof root.data === "object"
      ? root.data
      : root;

  const expected =
    (typeof obj === "number" ? obj : null) ??
    (typeof obj === "string" && obj.trim() ? Number(obj) : null) ??
    (obj && typeof obj === "object" && typeof obj.expectedReturn === "number"
      ? obj.expectedReturn
      : null) ??
    (obj && typeof obj === "object" && typeof obj.data === "number" ? obj.data : null) ??
    (obj &&
    typeof obj === "object" &&
    obj.data &&
    typeof obj.data === "object" &&
    typeof obj.data.expectedReturn === "number"
      ? obj.data.expectedReturn
      : null) ??
    (obj &&
    typeof obj === "object" &&
    obj.data &&
    typeof obj.data === "object" &&
    typeof obj.data.data === "number"
      ? obj.data.data
      : null) ??
    null;

  const expectedReturn = Number(expected);
  if (!Number.isFinite(expectedReturn)) {
    throw new Error(res?.message || "Unable to compute expected return. Please try again.");
  }

  const totalAtMaturity =
    obj && typeof obj === "object" && typeof obj.totalAtMaturity === "number"
      ? obj.totalAtMaturity
      : obj &&
        typeof obj === "object" &&
        obj.data &&
        typeof obj.data === "object" &&
        typeof obj.data.totalAtMaturity === "number"
      ? obj.data.totalAtMaturity
      : undefined;

  const maturityDate =
    obj && typeof obj === "object" && typeof obj.maturityDate === "string" && obj.maturityDate.trim()
      ? obj.maturityDate.trim()
      : obj &&
        typeof obj === "object" &&
        obj.data &&
        typeof obj.data === "object" &&
        typeof obj.data.maturityDate === "string" &&
        obj.data.maturityDate.trim()
      ? obj.data.maturityDate.trim()
      : undefined;

  const investmentType =
    obj && typeof obj === "object" && typeof obj.investmentType === "string" && obj.investmentType.trim()
      ? obj.investmentType.trim()
      : undefined;

  const rate =
    obj && typeof obj === "object" && typeof obj.rate === "number" ? obj.rate : undefined;

  const rateFormatted =
    obj && typeof obj === "object" && typeof obj.rateFormatted === "string" && obj.rateFormatted.trim()
      ? obj.rateFormatted.trim()
      : undefined;

  const tenor =
    obj && typeof obj === "object" && typeof obj.tenor === "string" && obj.tenor.trim()
      ? obj.tenor.trim()
      : undefined;

  return {
    status: true,
    message: res.message,
    expectedReturn,
    totalAtMaturity,
    maturityDate,
    investmentType,
    rate,
    rateFormatted,
    tenor,
  };
}

export type CreateInvestmentRequest = {
  amount: number;
  expectedReturn: number;
  typeId: number;
  tenorId: number;
  acknowledge: boolean;
};

export type CreateInvestmentResponse = {
  status: boolean;
  message: string;
  data?: unknown;
};

export async function createInvestment(
  payload: CreateInvestmentRequest
): Promise<CreateInvestmentResponse> {
  const res = await apiPostJson<CreateInvestmentResponse>("/api/v1/webinvestment/create", payload);
  if (!res?.status) {
    throw new Error(res?.message || "Unable to create investment. Please try again.");
  }
  return res;
}

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type ChangePasswordResponse = {
  status: boolean;
  message: string;
  data?: unknown;
};

export async function changePassword(payload: ChangePasswordRequest): Promise<ChangePasswordResponse> {
  const res = await apiPostJson<ChangePasswordResponse>(
    "/api/v1/webinvestment/change-password",
    payload
  );
  if (!res?.status) {
    throw new Error(res?.message || "Unable to change password. Please try again.");
  }
  return res;
}

export type GetPortfolioSummaryResponse = {
  status: boolean;
  message: string;
  data?: unknown;
};

export async function getPortfolioSummary(signal?: AbortSignal) {
  return await apiGetJson<GetPortfolioSummaryResponse>(
    "/api/v1/webinvestment/get-portfolio-summary",
    { signal }
  );
}

export type GetInvestmentListResponse = {
  pageNumber?: number;
  pageSize?: number;
  totalPages?: number;
  totalRecords?: number;
  hasNexPage?: boolean;
  hasPreviousPage?: boolean;
  status: boolean;
  message: string;
  data?: unknown;
};

export type InvestmentListFilter = {
  id: number;
  investmentType: number | null;
  investmentPeriod: string;
  minAmount: number;
  maxAmount: number;
  minRate: number;
  maxRate: number;
  status: string;
  startDate: string;
  endDate: string;
  pageSize: number;
  pageNumber: number;
};

export async function getInvestmentList(
  filter: Partial<InvestmentListFilter> = {},
  signal?: AbortSignal
) {
  // By default, only send the minimal required shape:
  // investmentType, investmentPeriod, status, pageSize, pageNumber.
  const investmentTypeRaw = (filter as any)?.investmentType;
  const investmentTypeNum =
    typeof investmentTypeRaw === "number"
      ? investmentTypeRaw
      : typeof investmentTypeRaw === "string" && investmentTypeRaw.trim()
        ? Number(investmentTypeRaw)
        : null;
  const investmentType =
    typeof investmentTypeNum === "number" && Number.isFinite(investmentTypeNum) && investmentTypeNum > 0
      ? investmentTypeNum
      : null;
  const investmentPeriod =
    typeof (filter as any)?.investmentPeriod === "string"
      ? String((filter as any).investmentPeriod).trim()
      : "";
  const status =
    typeof (filter as any)?.status === "string" ? String((filter as any).status).trim() : "";

  const payload: any = {
    investmentType,
    investmentPeriod,
    status,
    pageSize:
      typeof (filter as any)?.pageSize === "number" && Number.isFinite((filter as any).pageSize) && (filter as any).pageSize > 0
        ? (filter as any).pageSize
        : 20,
    pageNumber:
      typeof (filter as any)?.pageNumber === "number" && Number.isFinite((filter as any).pageNumber) && (filter as any).pageNumber > 0
        ? (filter as any).pageNumber
        : 1,
  };

  // Optional: id (only when > 0)
  if ("id" in filter) {
    const n = Number((filter as any).id);
    if (Number.isFinite(n) && n > 0) payload.id = n;
  }

  // Only send min/max when explicitly provided and meaningful (> 0)
  if ("minAmount" in filter) {
    const n = Number((filter as any).minAmount);
    if (Number.isFinite(n) && n > 0) payload.minAmount = n;
  }
  if ("maxAmount" in filter) {
    const n = Number((filter as any).maxAmount);
    if (Number.isFinite(n) && n > 0) payload.maxAmount = n;
  }

  // Only send min/max rate when explicitly provided and meaningful (> 0)
  if ("minRate" in filter) {
    const n = Number((filter as any).minRate);
    if (Number.isFinite(n) && n > 0) payload.minRate = n;
  }
  if ("maxRate" in filter) {
    const n = Number((filter as any).maxRate);
    if (Number.isFinite(n) && n > 0) payload.maxRate = n;
  }

  // Only send date range when explicitly provided and non-empty
  const sdRaw = "startDate" in filter ? String((filter as any).startDate ?? "").trim() : "";
  const edRaw = "endDate" in filter ? String((filter as any).endDate ?? "").trim() : "";
  if (sdRaw && edRaw) {
    payload.startDate = sdRaw;
    payload.endDate = edRaw;
  }

  return await apiPostJson<GetInvestmentListResponse>(
    "/api/v1/webinvestment/get-investment-list",
    payload,
    { signal }
  );
}

export type GetTransactionListResponse = {
  pageNumber?: number;
  pageSize?: number;
  totalPages?: number;
  totalRecords?: number;
  hasNexPage?: boolean;
  hasPreviousPage?: boolean;
  status: boolean;
  message: string;
  data?: unknown;
};

export type TransactionListFilter = {
  reference: string;
  minAmount?: number;
  maxAmount?: number;
  product: string;
  type: string;
  startDate: string;
  endDate: string;
  pageSize: number;
  pageNumber: number;
};

export async function getTransactionList(
  filter: Partial<TransactionListFilter> = {},
  signal?: AbortSignal
) {
  const payload: TransactionListFilter = {
    reference: "",
    product: "",
    type: "",
    startDate: "",
    endDate: "",
    pageSize: 20,
    pageNumber: 1,
    ...filter,
  };

  return await apiPostJson<GetTransactionListResponse>(
    "/api/v1/webinvestment/get-transaction-list",
    payload,
    { signal }
  );
}

export type GetInvestmentDetailResponse = {
  status: boolean;
  message: string;
  data?: unknown;
};

export type InvestmentDetailDto = {
  id: number;
  investmentAmount: number;
  investmentRate: string; // "6%"
  investmentBalance?: number;
  investmentType: string; // "Short Term Investments"
  investmentPeriod: string; // "60 days"
  expectedReturn: number;
  dateCreated: string; // "25 Feb, 2026 | 11:30 AM"
  maturityDate: string;
  dateRemaining: string; // "59 days"
  status: string; // "active" | "inactive" | "matured"
  kycStatus?: number; // enum: 1 New, 2 Pending, 3 Approved, 4 Rejected, 5 Abandoned
};

export async function getInvestmentDetail(investmentId: number, signal?: AbortSignal) {
  const res = await apiGetJson<GetInvestmentDetailResponse>(
    `/api/v1/webinvestment/get-investment-detail/${investmentId}`,
    { signal }
  );
  if (!res?.status) {
    throw new Error(res?.message || "Unable to load investment detail. Please try again.");
  }
  return res;
}

export type GetWithdrawalEligibleResponse = {
  status: boolean;
  message: string;
  data?: unknown;
};

export async function getWithdrawalEligible(signal?: AbortSignal) {
  const res = await apiGetJson<GetWithdrawalEligibleResponse>(
    "/api/v1/webinvestment/get-withdrawal-eligible",
    { signal }
  );
  if (!res?.status) {
    throw new Error(res?.message || "Unable to load withdrawal-eligible list.");
  }
  return res;
}

export type WithdrawalRequestRequest = {
  investmentId: number;
  amount: number;
};

export type WithdrawalRequestResponse = {
  status: boolean;
  message: string;
  data?: unknown;
};

export async function withdrawalRequest(payload: WithdrawalRequestRequest) {
  const res = await apiPostJson<WithdrawalRequestResponse>(
    "/api/v1/webinvestment/withdrawal-request",
    payload
  );
  if (!res?.status) {
    const err = new Error(res?.message || "Unable to submit withdrawal request.");
    (err as any).details = res;
    throw err;
  }
  return res;
}
