import React from "react";
import { formatNGN, parseMoney } from "@/lib/investment";

export default function PaymentDetailsTable({
  amountInput,
  bankName,
  accountNumber,
  accountName,
  feeNaira = 50,
}: {
  amountInput: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  feeNaira?: number;
}) {
  const amount = parseMoney(amountInput);
  const fee = Number.isFinite(feeNaira) ? feeNaira : 50;
  const totalToTransfer = amount + fee;

  const rows: Array<[string, string]> = [
    ["Amount", formatNGN(amount)],
    ["Service Fee", formatNGN(fee)],
    ["Amount to Transfer", formatNGN(totalToTransfer)],
    ["Bank Name", bankName || "-"],
    ["Account Number", accountNumber || "-"],
    ["Account Name", accountName || "-"],
  ];

  return (
    <div className="mt-4 rounded-[10px] border border-black/10 overflow-hidden">
      {rows.map(([label, value], idx) => (
        <div
          key={label}
          className={`flex items-center justify-between px-5 py-3 text-[12px] ${
            idx === 0 ? "" : "border-t border-black/5"
          }`}
        >
          <span className="text-[#5F6368]">{label}</span>
          <span className="font-medium text-[#2E2E2E]">{value}</span>
        </div>
      ))}
    </div>
  );
}

