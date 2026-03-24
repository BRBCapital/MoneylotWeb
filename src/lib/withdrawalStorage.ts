export type WithdrawalRequestData = Partial<{
  investmentId: number;
  investment: string;
  referenceNumber: string | null;
  bankAccountId: number;
  paymentoptionId: number;
  investmentAmount: number;
  investmentAmountFormatted: string;
  interestAccrued: number;
  interestAccruedFormatted: string;
  isEarlyWithdrawal: boolean;
  penaltyFeePercentage: number; // e.g. 2.5 (percent) or 0.025 (fraction)
  earlyWithdrawalFee: number;
  earlyWithdrawalFeeFormatted: string;
  netPayout: number;
  netPayoutFormatted: string;
  beneficiaryAccount: string;
  matured: boolean;
}>;

function keyFor(investmentId: string | number) {
  return `moneylot_withdrawal_request_${investmentId}`;
}

export function saveWithdrawalRequest(investmentId: string | number, data: WithdrawalRequestData) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(keyFor(investmentId), JSON.stringify(data || {}));
}

export function loadWithdrawalRequest(investmentId: string | number): WithdrawalRequestData | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(keyFor(investmentId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WithdrawalRequestData;
  } catch {
    return null;
  }
}

export function clearWithdrawalRequest(investmentId: string | number) {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(keyFor(investmentId));
}

