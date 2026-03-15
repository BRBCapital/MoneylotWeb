"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import OnboardingShell from "@/components/templates/onboarding/OnboardingShell";
import Button from "@/components/ui/Button";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { getInvestmentDetail, withdrawalRequest } from "@/services/webinvestment";
import { ApiError } from "@/lib/apiClient";
import { isAbortError } from "@/lib/isAbortError";
import { saveWithdrawalRequest } from "@/lib/withdrawalStorage";
import KycGateModal from "@/components/modals/KycGateModal";

export default function WithdrawAmountPage() {
  const router = useRouter();
  const MIN_WITHDRAWAL_NGN = 50;
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const status = (searchParams.get("status") || "active").toLowerCase();
  const early = searchParams.get("early") === "1";
  const isMaturedFlow = status === "matured" && !early;
  const autoTriggeredRef = useRef(false);

  const [amount, setAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  function parseAmount(input: string) {
    const cleaned = (input || "").replace(/[^\d.]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }

  useEffect(() => {
    const id = Number(params.id);
    if (!Number.isFinite(id) || id <= 0) return;
    const ac = new AbortController();
    (async () => {
      try {
        setError(null);
        setLoading(true);
        const res = await getInvestmentDetail(id, ac.signal);
        console.log("[Withdraw Amount] get-investment-detail response:", res);
        const data = (res as any)?.data;
        const invAmount =
          data && typeof data === "object" && typeof (data as any).investmentBalance === "number"
            ? (data as any).investmentBalance
            : data && typeof data === "object" && typeof (data as any).investmentAmount === "number"
              ? (data as any).investmentAmount
              : 0;
        setMaxAmount(Number.isFinite(invAmount) ? invAmount : 0);
      } catch (e) {
        if (isAbortError(e)) return;
        if (e instanceof ApiError) setError(e.message);
        else if (e instanceof Error) setError(e.message);
        else setError("Unable to load investment.");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [params.id]);

  useEffect(() => {
    if (!isMaturedFlow) {
      autoTriggeredRef.current = false;
      return;
    }
    const investmentId = Number(params.id);
    if (!Number.isFinite(investmentId) || investmentId <= 0) return;
    if (loading) return;
    if (autoTriggeredRef.current) return;
    if (!maxAmount || maxAmount <= 0) return;
    if (maxAmount < MIN_WITHDRAWAL_NGN) {
      setError(`Minimum withdrawal is ₦${MIN_WITHDRAWAL_NGN.toFixed(2)}`);
      return;
    }

    const ac = new AbortController();
    autoTriggeredRef.current = true;
    (async () => {
      try {
        setError(null);
        setLoading(true);
        const amt = maxAmount;
        const res = await withdrawalRequest({ investmentId, amount: amt });
        console.log("[Withdraw Amount] (matured) withdrawal-request response:", res);
        saveWithdrawalRequest(investmentId, (res as any)?.data || {});
        const q = new URLSearchParams();
        q.set("amount", String(amt));
        q.set("status", status);
        router.replace(`/dashboard/withdrawals/${params.id}/confirm?${q.toString()}`);
      } catch (e) {
        autoTriggeredRef.current = false; // allow retry on same screen
        if (handleKycGate(e)) {
          setError(null);
          return;
        }
        if (e instanceof ApiError) setError(e.message);
        else if (e instanceof Error) setError(e.message);
        else setError("Unable to submit withdrawal request.");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [isMaturedFlow, loading, maxAmount, params.id, router, status]);

  return (
    <OnboardingShell stage={4} totalStages={4} showProgress={false}>
      <div className="w-full relative">
        <LoadingOverlay show={loading} label="Loading..." />
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
          <div className="px-6 py-4 text-[14px] font-medium text-[#5F6368]">
            Withdraw Funds
          </div>
          <div className="h-px w-full bg-[#EEEEEE]" />

          <div className="px-6 py-7">
            <h1 className="text-[22px] font-semibold text-[#2E2E2E]">
              Withdraw Funds
            </h1>
            <p className="mt-3 text-[11px] text-[#5F6368]">
              {isMaturedFlow
                ? "Preparing your full withdrawal for the maximum available amount..."
                : "How much do you want to withdraw?"}
            </p>

            {error ? (
              <div className="mt-4 rounded-[10px] border border-[#F2C6C6] bg-[#FFF5F5] px-4 py-3 text-[11px] text-[#D32F2F]">
                {error}
              </div>
            ) : null}

            {!isMaturedFlow ? (
              <>
                <div className="mt-3 relative">
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter Amount"
                    className="w-full h-[42px] border-b border-[#E9E9E9] bg-transparent pr-12 text-[12px] text-[#2E2E2E] outline-none focus:border-[#89E081]"
                  />
                  <button
                    type="button"
                    onClick={() => setAmount(String(maxAmount || 0))}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[#89E081] hover:opacity-80"
                  >
                    MAX
                  </button>
                </div>

                <div className="mt-8 flex justify-end">
                  <Button.SmPrimary
                    label="Continue"
                    height={40}
                    width={120}
                    fontSize="text-[12px]"
                    className="rounded-[8px] font-medium"
                    disabled={amount.trim() === ""}
                    loading={loading ? "Please wait" : undefined}
                    onClick={async () => {
                      const investmentId = Number(params.id);
                      const amt = parseAmount(amount);
                      if (!Number.isFinite(investmentId) || investmentId <= 0) {
                        setError("Invalid investment selection.");
                        return;
                      }
                      if (!amt || amt <= 0) {
                        setError("Enter a valid amount.");
                        return;
                      }
                      if (amt < MIN_WITHDRAWAL_NGN) {
                        setError(`Minimum withdrawal is ₦${MIN_WITHDRAWAL_NGN.toFixed(2)}`);
                        return;
                      }
                      if (maxAmount > 0 && amt > maxAmount) {
                        setError(`Maximum withdrawable amount is ₦${maxAmount.toFixed(2)}`);
                        return;
                      }

                      try {
                        setError(null);
                        setLoading(true);
                        const res = await withdrawalRequest({ investmentId, amount: amt });
                        console.log("[Withdraw Amount] withdrawal-request response:", res);
                        saveWithdrawalRequest(investmentId, (res as any)?.data || {});
                        const q = new URLSearchParams();
                        q.set("amount", String(amt));
                        q.set("status", status);
                        if (early) q.set("early", "1");
                        router.push(`/dashboard/withdrawals/${params.id}/confirm?${q.toString()}`);
                      } catch (e) {
                        if (handleKycGate(e)) {
                          setError(null);
                          return;
                        }
                        if (e instanceof ApiError) setError(e.message);
                        else if (e instanceof Error) setError(e.message);
                        else setError("Unable to submit withdrawal request.");
                      } finally {
                        setLoading(false);
                      }
                    }}
                  />
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

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

