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

