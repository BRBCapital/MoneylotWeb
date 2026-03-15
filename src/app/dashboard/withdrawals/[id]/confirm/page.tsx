"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import OnboardingShell from "@/components/templates/onboarding/OnboardingShell";
import Button from "@/components/ui/Button";
import EnterTransactionPinModal from "@/components/modals/EnterTransactionPinModal";
import KycGateModal from "@/components/modals/KycGateModal";
import { loadWithdrawalRequest } from "@/lib/withdrawalStorage";
import { withdrawInvestment } from "@/services/investment";
import { ApiError } from "@/lib/apiClient";
import { showSuccessToast } from "@/state/toastState";
import { getWithdrawalAccounts } from "@/services/withdrawal";
import { isAbortError } from "@/lib/isAbortError";
import { imagesAndIcons } from "@/constants/imagesAndIcons";

function parseAmount(input: string) {
  const cleaned = (input || "").replace(/[^\d.]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function formatNGN(n: number) {
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ConfirmWithdrawalPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const status = (searchParams.get("status") || "active").toLowerCase();
  const amountInput = searchParams.get("amount") || "0";
  const amount = useMemo(() => parseAmount(amountInput), [amountInput]);

  const [apiData, setApiData] = useState<ReturnType<typeof loadWithdrawalRequest> | null>(null);
  const [defaultBankAccountId, setDefaultBankAccountId] = useState<number | null>(null);

  useEffect(() => {
    setApiData(loadWithdrawalRequest(params.id));
  }, [params.id]);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const res = await getWithdrawalAccounts(ac.signal);
        const list = (res as any)?.data;
        if (!Array.isArray(list) || list.length === 0) {
          setDefaultBankAccountId(null);
          return;
        }
        // Prefer: default === true, else active === true, else first item
        const pick =
          list.find((x: any) => x && typeof x === "object" && (x.default === true || x.isDefault === true)) ||
          list.find((x: any) => x && typeof x === "object" && (x.active === true || x.isActive === true)) ||
          list[0];
        const id =
          (pick && typeof pick === "object" && typeof (pick as any).id === "number" && Number.isFinite((pick as any).id))
            ? (pick as any).id
            : null;
        setDefaultBankAccountId(id);
      } catch (e) {
        if (isAbortError(e)) return;
        setDefaultBankAccountId(null);
      }
    })();
    return () => ac.abort();
  }, []);

  const early = useMemo(() => {
    // If URL says matured, never show early-withdrawal UI (even if API flags it wrongly).
    if (status === "matured") return false;
    if (typeof apiData?.isEarlyWithdrawal === "boolean") return apiData.isEarlyWithdrawal;
    return searchParams.get("early") === "1" || status !== "matured";
  }, [apiData?.isEarlyWithdrawal, searchParams, status]);

  const isMatured = useMemo(() => {
    if (typeof apiData?.matured === "boolean") return apiData.matured;
    return status === "matured" && !early;
  }, [apiData?.matured, early, status]);

  const [reason, setReason] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [kycOpen, setKycOpen] = useState(false);
  const [kycVariant, setKycVariant] = useState<"required" | "rejected">("required");

  function extractKycStatus(x: unknown): number | null {
    const readNum = (v: unknown) => {
      if (typeof v === "number" && Number.isFinite(v)) return v;
      if (typeof v === "string" && v.trim()) {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      }
      return null;
    };
    const o: any = x as any;
    const candidates = [
      o?.kycStatus,
      o?.data?.kycStatus,
      o?.data?.data?.kycStatus,
      o?.details?.kycStatus,
      o?.details?.data?.kycStatus,
      o?.details?.data?.data?.kycStatus,
      o?.details?.details?.data?.kycStatus,
    ];
    for (const c of candidates) {
      const n = readNum(c);
      if (n !== null) return n;
    }
    return null;
  }

  function handleKycGate(maybe: unknown) {
    const k = extractKycStatus(maybe);
    if (k === 3) return false; // Approved
    if (k === 4) {
      setKycVariant("rejected");
      setKycOpen(true);
      return true;
    }
    if (k === 1 || k === 2 || k === 5) {
      setKycVariant("required");
      setKycOpen(true);
      return true;
    }
    return false;
  }

  const rows: Array<[string, string, "normal" | "positive" | "negative"]> = [
    ["Investment", apiData?.investment || (isMatured ? "Investment" : "Investment"), "normal"],
    ["Withdrawal Amount", formatNGN(amount), "normal"],
    ["Net Payout", apiData?.netPayoutFormatted || formatNGN(amount), "positive"],
    ["Beneficiary Account", apiData?.beneficiaryAccount || "-", "normal"],
  ];

  if (early) {
    rows.splice(4, 0, [
      "Early Withdrawal Fee (2.5%)",
      apiData?.earlyWithdrawalFeeFormatted || `-${formatNGN(amount * 0.025)}`,
      "negative",
    ]);
  }

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
            Withdraw Funds
          </div>
          <div className="h-px w-full bg-[#EEEEEE]" />

          <div className="px-6 py-7">
            <h1 className="text-[18px] font-semibold text-[#2E2E2E]">
              Confirm Withdrawal
            </h1>
            <p className="mt-1 text-[11px] text-[#5F6368]">
              Review your withdrawal details below.
            </p>

            {early ? (
              <div className="mt-4 rounded-[8px] bg-[#EB001B1A] px-4 py-3 border-l-2 border-l-[#EB001B]">
                <div className="flex items-start gap-3">
                  <Image
                    src={imagesAndIcons.warnIcon}
                    alt="Warning"
                    width={24}
                    height={24}
                    className="mt-0.5 h-6 w-6 shrink-0"
                  />
                  <div>
                    <p className="text-[11px] font-semibold text-[#EB001B]">
                      Early Withdrawal
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#EB001B]">
                      This investment has not yet matured. A penalty of 2.5% will be deducted from your payout.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-4 rounded-[10px] border border-[#89E081] bg-[#5FCE551A] overflow-hidden">
              {rows.map(([label, value, tone], idx) => (
                <div
                  key={label}
                  className={`flex items-center justify-between px-4 py-3 text-[10px] ${
                    idx === 0 ? "" : "border-t border-[#89E081]/20"
                  }`}
                >
                  <span className="text-[#5F6368]">{label}</span>
                  <span
                    className={`font-semibold ${
                      tone === "negative"
                        ? "text-[#E53935]"
                        : tone === "positive"
                          ? "text-[#5FCE55]"
                          : "text-[#2E2E2E]"
                    }`}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <label className="block text-[10px] font-medium text-[#2E2E2E]">
                Reason for Withdrawal (optional)
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-2 w-full h-[42px] rounded-[8px] border border-[#E9E9E9] bg-white px-4 text-[12px] text-[#2E2E2E] outline-none focus:border-[#89E081]"
              >
                <option value="">Select a reason</option>
                <option value="emergency">Emergency</option>
                <option value="reinvestment">Reinvestment elsewhere</option>
                <option value="personal">Personal reasons</option>
              </select>
            </div>

            <div className="mt-6 flex justify-end">
              <Button.SmPrimary
                label="Confirm Withdrawal"
                height={40}
                width={170}
                fontSize="text-[11px]"
                className="rounded-[8px] font-medium"
                onClick={() => setPinOpen(true)}
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
          const amt = amount;

          const toInt = (v: unknown) => {
            if (typeof v === "number" && Number.isFinite(v)) return v;
            if (typeof v === "string" && v.trim()) {
              const n = Number(v);
              return Number.isFinite(n) ? n : null;
            }
            return null;
          };

          const bankAccountIdFromRequest =
            toInt((apiData as any)?.bankAccountId) ??
            toInt((apiData as any)?.bankAccountID) ??
            toInt((apiData as any)?.accountId) ??
            toInt((apiData as any)?.withdrawalAccountId) ??
            null;

          const bankAccountId = bankAccountIdFromRequest || defaultBankAccountId || null;

          const paymentoptionId =
            toInt((apiData as any)?.paymentoptionId) ??
            toInt((apiData as any)?.paymentOptionId) ??
            2;

          const emergencySavings = reason === "emergency";

          try {
            if (!bankAccountId || bankAccountId <= 0) {
              throw new Error("Missing bank account. Please add a withdrawal account in Profile and try again.");
            }
            if (!amt || amt <= 0) throw new Error("Missing withdrawal amount. Please go back and try again.");
            const payload = {
              investmentId,
              amount: amt,
              bankAccountId,
              transactionPin: pin,
              emergencySavings,
              paymentoptionId,
            };
            console.log("[Withdrawal] investment/withdrawal payload:", payload);
            const res = await withdrawInvestment(payload);
            console.log("[Withdrawal] investment/withdrawal response:", res);
            showSuccessToast("Success", res?.message || "Withdrawal submitted");
          } catch (e) {
            if (handleKycGate(e)) {
              throw new Error("Verification required");
            }
            if (e instanceof ApiError) throw new Error(e.message);
            if (e instanceof Error) throw e;
            throw new Error("Unable to complete withdrawal. Please try again.");
          }
          const q = new URLSearchParams();
          q.set("amount", amountInput);
          q.set("status", status);
          if (early) q.set("early", "1");
          if (reason) q.set("reason", reason);
          router.push(`/dashboard/withdrawals/${params.id}/success?${q.toString()}`);
        }}
      />

      <KycGateModal
        open={kycOpen}
        setOpen={setKycOpen}
        variant={kycVariant}
        onVerifyIdentity={() => {
          setKycOpen(false);
          router.push("/dashboard?verifyKyc=1");
        }}
      />
    </OnboardingShell>
  );
}

