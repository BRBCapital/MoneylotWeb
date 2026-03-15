import { apiPostJson } from "@/lib/apiClient";

export type FundInvestmentRequest = {
  paymentOptionId: number; // per backend: 2
  investmentId: number;
  amount: number;
  transactionPin: string;
};

export type FundInvestmentCheckoutData = {
  accountNumber: string;
  accountName: string;
  bankCode?: string;
  bankName: string;
  accountType?: string;
  accountStatus?: string;
  expiryInMinutes?: number;
};

export type FundInvestmentResponse = {
  status: boolean;
  message: string; // often a reference/transaction id
  data?:
    | FundInvestmentCheckoutData
    | { amount?: string | number; data?: FundInvestmentCheckoutData | unknown }
    | unknown;
};

export async function fundInvestment(payload: FundInvestmentRequest) {
  const res = await apiPostJson<FundInvestmentResponse>(
    "/api/v1/investment/fund",
    payload,
  );
  if (!res?.status) {
    throw new Error(
      res?.message || "Unable to fund investment. Please try again.",
    );
  }
  return res;
}

export type InvestmentWithdrawalRequest = {
  investmentId: number;
  amount: number;
  bankAccountId: number;
  transactionPin: string;
  emergencySavings: boolean;
  paymentoptionId: number;
};

export type InvestmentWithdrawalResponse = {
  status: boolean;
  message: string;
  data?: unknown;
};

export async function withdrawInvestment(payload: InvestmentWithdrawalRequest) {
  const res = await apiPostJson<InvestmentWithdrawalResponse>(
    "/api/v1/investment/withdrawal",
    payload
  );
  if (!res?.status) {
    const err = new Error(res?.message || "Unable to complete withdrawal. Please try again.");
    (err as any).details = res;
    throw err;
  }
  return res;
}

export type InvestmentReinvestRequest = {
  investmentId: number;
  transactionPin: string;
  amount: number;
  tenorId: number;
  expectedReturn: number;
};

export type InvestmentReinvestResponse = {
  status: boolean;
  message: string;
  data?: unknown;
};

export async function reinvestInvestment(payload: InvestmentReinvestRequest) {
  const res = await apiPostJson<InvestmentReinvestResponse>(
    "/api/v1/investment/reinvest",
    payload
  );
  if (!res?.status) {
    throw new Error(res?.message || "Unable to rollover investment. Please try again.");
  }
  return res;
}
