"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import OnboardingShell from "@/components/templates/onboarding/OnboardingShell";
import Button from "@/components/ui/Button";
import EnterTransactionPinModal from "@/components/modals/EnterTransactionPinModal";
import IconCheckbox from "@/components/ui/IconCheckbox";
import { reinvestInvestment } from "@/services/investment";
import { ApiError } from "@/lib/apiClient";
import { showSuccessToast } from "@/state/toastState";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-t border-[#EEEEEE]">
      <span className="text-[12px] text-[#979797]">{label}</span>
      <span className="text-[12px] font-semibold text-[#2E2E2E]">{value}</span>
    </div>
  );
}

export default function RolloverConfirmPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const amountInput = searchParams.get("amount") || "0";
  const tenorLabel = searchParams.get("tenorLabel") || "-";
  const rateFormatted = searchParams.get("rateFormatted") || "-";
  const maturityDate = searchParams.get("maturityDate") || "-";
  const expectedReturnInput = searchParams.get("expectedReturn") || "0";
  const totalAtMaturityInput = searchParams.get("totalAtMaturity") || "0";
  const tenorIdInput = searchParams.get("tenorId") || "0";
  const [pinOpen, setPinOpen] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const toNumber = (v: string) => {
    const n = Number((v || "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  const amount = useMemo(() => toNumber(amountInput), [amountInput]);
  const expectedReturn = useMemo(
    () => toNumber(expectedReturnInput),
    [expectedReturnInput],
  );
  const totalAtMaturity = useMemo(
    () => toNumber(totalAtMaturityInput),
    [totalAtMaturityInput],
  );
  const tenorId = useMemo(() => Number(tenorIdInput) || 0, [tenorIdInput]);
  const fmt = (n: number) =>
    `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <OnboardingShell stage={4} totalStages={4} showProgress={false}>
      <div className="w-full">
        <div className="mb-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-[8px] border border-[#EEEEEE] bg-white px-2.5 py-1 text-[12px] font-medium text-[#2E2E2E] shadow-sm hover:bg-[#FAFAFA]"
          >
            <span className="text-[14px] leading-none">‹</span>
            Back
          </button>
        </div>

        <div className="rounded-[8px] border border-black/10 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 text-[11px] font-medium text-[#5F6368]">
            Investment Rollover
          </div>
          <div className="h-px w-full bg-[#EEEEEE]" />

          <div className="px-6 py-7">
            <h1 className="text-[20px] font-semibold text-[#2E2E2E]">
              Confirm Your Investment
            </h1>
            <p className="mt-1 text-[11px] text-[#5F6368]">
              Please review all details carefully before proceeding
            </p>

            <div className="mt-5 rounded-[8px] border border-[#EEEEEE] px-4">
              <div className="py-3 flex items-center justify-between">
                <span className="text-[12px] text-[#979797]">
                  Investment Type
                </span>
                <span className="text-[12px] font-semibold text-[#2E2E2E]">
                  Fixed Deposit
                </span>
              </div>
              <Row label="Tenor" value={tenorLabel} />
              <Row label="Rate" value={rateFormatted} />
              <Row label="Investment Amount" value={fmt(amount)} />
              <Row label="Expected Returns" value={fmt(expectedReturn)} />
              <Row label="Total at Maturity" value={fmt(totalAtMaturity)} />
              <Row label="Maturity Date" value={maturityDate} />
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-[6px] border border-[#89E081] bg-[#5FCE551A] px-4 py-3 text-[14px] leading-[20px] text-[#5F6368]">
              <IconCheckbox checked={agreeTerms} onChange={setAgreeTerms} />
              <div>
                By proceeding, I agree that all returns accrued will be
                forfeited and a penalty fee incurred if funds are withdrawn
                before maturity
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button.SmPrimary
                label="Proceed"
                height={40}
                width={120}
                fontSize="text-[12px]"
                className="rounded-[8px] font-medium"
                disabled={!agreeTerms}
                onClick={() => {
                  setPinOpen(true);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <EnterTransactionPinModal
        open={pinOpen}
        setOpen={setPinOpen}
        onProceed={async (pin) => {
          const investmentId = Number(params.id);
          if (!Number.isFinite(investmentId) || investmentId <= 0) {
            throw new Error("Invalid investment selection.");
          }
          if (!amount || amount <= 0) {
            throw new Error("Invalid amount.");
          }
          if (!tenorId || tenorId <= 0) {
            throw new Error("Missing tenor selection.");
          }
          if (!expectedReturn || expectedReturn < 0) {
            throw new Error("Missing expected return.");
          }
          try {
            const payload = {
              investmentId,
              transactionPin: pin,
              amount,
              tenorId,
              expectedReturn,
            };
            console.log("[Rollover] investment/reinvest payload:", payload);
            const res = await reinvestInvestment(payload);
            console.log("[Rollover] investment/reinvest response:", res);
            const remainingBalanceRaw = (res as any)?.data?.remainingBalance;
            const remainingBalance =
              typeof remainingBalanceRaw === "number"
                ? remainingBalanceRaw
                : Number(remainingBalanceRaw);

            showSuccessToast(
              "Success",
              res?.message || "Investment rolled over",
            );
            const q = new URLSearchParams();
            if (Number.isFinite(remainingBalance) && remainingBalance > 0) {
              q.set("amount", String(remainingBalance.toFixed(2)));
            } else {
              q.set("hideSubtext", "1");
            }
            if (typeof res?.message === "string") q.set("ref", res.message);
            router.push(
              `/dashboard/investments/${params.id}/rollover/success?${q.toString()}`,
            );
          } catch (e) {
            if (e instanceof ApiError) throw new Error(e.message);
            if (e instanceof Error) throw e;
            throw new Error("Unable to rollover investment. Please try again.");
          }
        }}
      />
    </OnboardingShell>
  );
}
