import React, { useMemo } from "react";
import Image from "next/image";
import {
  applyWithholdingToTotal,
  computeSimpleInterest,
  formatDateLong,
  formatNGN,
  parseMoney,
} from "@/lib/investment";

export default function InvestmentSummary({
  amountInput,
  tenorDays,
  ratePa,
}: {
  amountInput: string;
  tenorDays: number;
  ratePa: number; // e.g. 0.175 for 17.5%
}) {
  const amount = useMemo(() => parseMoney(amountInput), [amountInput]);

  const { expectedReturns, totalAtMaturity, maturityDate } = useMemo(() => {
    return computeSimpleInterest({ principal: amount, ratePa, tenorDays });
  }, [amount, ratePa, tenorDays]);

  const { netExpected, netTotal } = useMemo(() => {
    return applyWithholdingToTotal({
      grossExpected: expectedReturns,
      grossTotal: totalAtMaturity,
    });
  }, [expectedReturns, totalAtMaturity]);

  return (
    <div className="fade-in mt-5 rounded-[10px] border border-[#89E081] bg-[#5FCE551A]">
      <div className="grid grid-cols-1">
        {[
          ["Investment Amount", formatNGN(amount)],
          ["Interest Rate (p.a)", `${(ratePa * 100).toFixed(2)}%`],
          ["Tenor", `${tenorDays} Days`],
          ["Expected Returns", formatNGN(netExpected)],
          ["Total at Maturity", formatNGN(netTotal)],
          ["Maturity Date", formatDateLong(maturityDate)],
        ].map(([label, value], idx) => (
          <div
            key={label}
            className={`flex items-center justify-between px-4 py-3 text-[12px] ${
              idx === 0 ? "" : "border-t border-[#89E081]/20"
            }`}
          >
            <span className="text-[#5F6368]">
              {label === "Expected Returns" ? (
                <span className="inline-flex items-center gap-2">
                  <span>{label}</span>
                  <span className="relative inline-flex items-center group">
                    <Image
                      src="/assets/Info.png"
                      alt="Info"
                      width={14}
                      height={14}
                      className="h-[14px] w-[14px] opacity-80 group-hover:opacity-100"
                    />
                    <span className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-20 w-[260px] -translate-x-1/2 rounded-[10px] border border-black/10 bg-white px-3 py-2 text-[11px] text-[#2E2E2E] shadow-[0_10px_25px_rgba(0,0,0,0.10)] opacity-0 translate-y-1 transition-all group-hover:opacity-100 group-hover:translate-y-0">
                      Expected returns due are after Withholding Tax deductions.
                    </span>
                  </span>
                </span>
              ) : (
                label
              )}
            </span>
            <span
              className={`font-medium ${
                label === "Expected Returns" || label === "Total at Maturity"
                  ? "text-[#5FCE55]"
                  : "text-[#2E2E2E]"
              }`}
            >
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

