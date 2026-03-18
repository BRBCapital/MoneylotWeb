export function parseMoney(input: string) {
  const digits = (input || "").replace(/[^\d.]/g, "");
  const n = Number(digits);
  return Number.isFinite(n) ? n : 0;
}

export function formatNGN(amount: number) {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `₦${amount.toFixed(2)}`;
  }
}

export function addDays(d: Date, days: number) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function formatDateLong(d: Date) {
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function computeSimpleInterest({
  principal,
  ratePa,
  tenorDays,
}: {
  principal: number;
  ratePa: number; // 0.175
  tenorDays: number;
}) {
  const expectedReturns = principal * ratePa * (tenorDays / 365);
  const totalAtMaturity = principal + expectedReturns;
  const maturityDate = addDays(new Date(), tenorDays);
  return { expectedReturns, totalAtMaturity, maturityDate };
}

export const WITHHOLDING_TAX_RATE = 0.1;

export function applyWithholdingTax(gross: number, rate = WITHHOLDING_TAX_RATE) {
  const g = typeof gross === "number" && Number.isFinite(gross) ? gross : 0;
  const r = typeof rate === "number" && Number.isFinite(rate) ? rate : WITHHOLDING_TAX_RATE;
  const clamped = Math.min(Math.max(r, 0), 1);
  return g * (1 - clamped);
}

export function applyWithholdingToTotal({
  grossExpected,
  grossTotal,
  rate = WITHHOLDING_TAX_RATE,
}: {
  grossExpected: number;
  grossTotal: number;
  rate?: number;
}) {
  const netExpected = applyWithholdingTax(grossExpected, rate);
  const tax = (typeof grossExpected === "number" && Number.isFinite(grossExpected) ? grossExpected : 0) - netExpected;
  const total = typeof grossTotal === "number" && Number.isFinite(grossTotal) ? grossTotal : 0;
  const netTotal = total - tax;
  return { netExpected, netTotal };
}

