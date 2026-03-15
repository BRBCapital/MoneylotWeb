import React, { useMemo } from "react";
import {
  addDays,
  computeSimpleInterest,
  formatDateLong,
  formatNGN,
  parseMoney,
} from "@/lib/investment";

export default function InvestmentConfirmationTable({
  investmentType = "Fixed Deposit",
  amountInput,
  tenorDays,
  ratePa,
  expectedReturnOverride,
  totalAtMaturityOverride,
  maturityDateOverride,
}: {
  investmentType?: string;
  amountInput: string;
  tenorDays: number;
  ratePa: number;
  expectedReturnOverride?: number | null;
  totalAtMaturityOverride?: number | null;
  maturityDateOverride?: string | null;
}) {
  const amount = useMemo(() => parseMoney(amountInput), [amountInput]);
  const { expectedReturns, totalAtMaturity, maturityDate } = useMemo(() => {
    const base = computeSimpleInterest({ principal: amount, ratePa, tenorDays });
    const override =
      typeof expectedReturnOverride === "number" && Number.isFinite(expectedReturnOverride)
        ? expectedReturnOverride
        : null;
    const expected = override ?? base.expectedReturns;

    const totalOverride =
      typeof totalAtMaturityOverride === "number" && Number.isFinite(totalAtMaturityOverride)
        ? totalAtMaturityOverride
        : null;

    return {
      expectedReturns: expected,
      totalAtMaturity: totalOverride ?? amount + expected,
      maturityDate: addDays(new Date(), tenorDays),
    };
  }, [amount, ratePa, tenorDays, expectedReturnOverride, totalAtMaturityOverride]);

  const rows: Array<[string, string, "normal" | "green"]> = [
    ["Investment Type", investmentType, "normal"],
    ["Tenor", `${tenorDays} Days`, "normal"],
    ["Rate", `${(ratePa * 100).toFixed(2)}% p.a`, "normal"],
    ["Investment Amount", formatNGN(amount), "normal"],
    ["Expected Returns", formatNGN(expectedReturns), "green"],
    ["Total at Maturity", formatNGN(totalAtMaturity), "green"],
    [
      "Maturity Date",
      maturityDateOverride?.trim() ? maturityDateOverride.trim() : formatDateLong(maturityDate),
      "normal",
    ],
  ];

  return (
    <div className="mt-4 rounded-[10px] border border-black/10 overflow-hidden">
      {rows.map(([label, value, tone], idx) => (
        <div
          key={label}
          className={`flex items-center justify-between px-5 py-3 text-[12px] ${
            idx === 0 ? "" : "border-t border-black/5"
          }`}
        >
          <span className="text-[#5F6368]">{label}</span>
          <span
            className={`font-medium ${
              tone === "green" ? "text-[#5FCE55]" : "text-[#2E2E2E]"
            }`}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

