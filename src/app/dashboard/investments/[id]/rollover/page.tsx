"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import OnboardingShell from "@/components/templates/onboarding/OnboardingShell";
import Button from "@/components/ui/Button";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { ApiError } from "@/lib/apiClient";
import { isAbortError } from "@/lib/isAbortError";
import { parseMoney } from "@/lib/investment";
import { getExpectedReturn, getInvestmentDetail, getRates, InvestmentRateDto } from "@/services/webinvestment";

export default function RolloverFundsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [tenorId, setTenorId] = useState<number | null>(null);
  const [tenorLabel, setTenorLabel] = useState<string>("-");
  const [rateFormatted, setRateFormatted] = useState<string>("-");
  const [rates, setRates] = useState<InvestmentRateDto[]>([]);
  const [maxAmount, setMaxAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [expectedLoading, setExpectedLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const investmentId = Number(params.id);
    if (!Number.isFinite(investmentId) || investmentId <= 0) return;
    const ac = new AbortController();
    (async () => {
      try {
        setError(null);
        setLoading(true);
        const [ratesRes, detailRes] = await Promise.all([
          getRates(ac.signal),
          getInvestmentDetail(investmentId, ac.signal),
        ]);
        const rateList = Array.isArray(ratesRes?.data) ? ratesRes.data : [];
        setRates(rateList);
        const d = (detailRes as any)?.data;

        const invPeriod =
          d && typeof d === "object" && typeof (d as any).investmentPeriod === "string"
            ? ((d as any).investmentPeriod as string)
            : "";
        const normalize = (s: string) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");
        const invPeriodN = normalize(invPeriod);
        const invDays = (() => {
          const m = invPeriodN.match(/(\d+)/);
          const n = m ? Number(m[1]) : NaN;
          return Number.isFinite(n) ? n : null;
        })();

        const match =
          rateList.find((r) => normalize(r.investmentPeriodFormatted) === invPeriodN) ||
          (invDays != null
            ? rateList.find((r) => Number(r.investmentPeriod) === invDays)
            : null) ||
          null;

        if (match) {
          setTenorId(match.tenorId);
          setTenorLabel(match.investmentPeriodFormatted || invPeriod || "-");
          setRateFormatted(match.rateFormatted || "-");
        } else {
          // fallback: keep flow usable but block proceed until we can compute expected return
          setTenorId(null);
          setTenorLabel(invPeriod || "-");
          setRateFormatted("-");
        }

        const bal =
          d && typeof d === "object" && typeof (d as any).investmentBalance === "number"
            ? (d as any).investmentBalance
            : d && typeof d === "object" && typeof (d as any).investmentAmount === "number"
              ? (d as any).investmentAmount
              : 0;
        setMaxAmount(Number.isFinite(bal) ? bal : 0);
      } catch (e) {
        if (isAbortError(e)) return;
        if (e instanceof ApiError) setError(e.message);
        else if (e instanceof Error) setError(e.message);
        else setError("Unable to load rollover details.");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [params.id]);

  const tenorOptions = useMemo(() => {
    return (rates || []).map((r) => ({
      value: r.tenorId,
      label: `${r.investmentPeriodFormatted} • ${r.rateFormatted}`,
      raw: r,
    }));
  }, [rates]);

  return (
    <OnboardingShell stage={4} totalStages={4} showProgress={false}>
      <div className="w-full relative">
        <LoadingOverlay show={loading || expectedLoading} label="Loading..." />
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
            Rollover Funds
          </div>
          <div className="h-px w-full bg-[#EEEEEE]" />

          <div className="px-6 py-7">
            <h1 className="text-[22px] font-semibold text-[#2E2E2E]">
              Rollover Funds
            </h1>
            <p className="mt-3 text-[11px] text-[#5F6368]">
              How much do you want to reinvest?
            </p>

            {error ? (
              <div className="mt-4 rounded-[10px] border border-[#F2C6C6] bg-[#FFF5F5] px-4 py-3 text-[11px] text-[#D32F2F]">
                {error}
              </div>
            ) : null}

            <div className="mt-3 relative">
              <input
                type="text"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(null);
                }}
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
                disabled={amount.trim() === "" || tenorId == null || expectedLoading}
                onClick={async () => {
                  const investmentId = Number(params.id);
                  const amt = parseMoney(amount);
                  if (!Number.isFinite(investmentId) || investmentId <= 0) {
                    setError("Invalid investment selection.");
                    return;
                  }
                  if (!amt || amt <= 0) {
                    setError("Enter a valid amount.");
                    return;
                  }
                  if (maxAmount > 0 && amt > maxAmount) {
                    setError(`Maximum reinvest amount is ₦${maxAmount.toFixed(2)}`);
                    return;
                  }
                  if (tenorId == null) {
                    setError("Unable to determine investment tenor. Please try again.");
                    return;
                  }
                  try {
                    setExpectedLoading(true);
                    setError(null);
                    const exp = await getExpectedReturn({ tenorId, amount: amt });
                    console.log("[Rollover] get-expected-return response:", exp);
                    const selected = tenorOptions.find((o) => o.value === tenorId)?.raw;
                    const q = new URLSearchParams();
                    q.set("amount", String(amt));
                    q.set("tenorId", String(tenorId));
                    q.set("expectedReturn", String(exp.expectedReturn));
                    if (typeof exp.totalAtMaturity === "number") q.set("totalAtMaturity", String(exp.totalAtMaturity));
                    if (typeof exp.maturityDate === "string") q.set("maturityDate", exp.maturityDate);
                    if (typeof exp.rateFormatted === "string") q.set("rateFormatted", exp.rateFormatted);
                    if (typeof exp.tenor === "string") q.set("tenorLabel", exp.tenor);
                    if (selected?.investmentPeriodFormatted) q.set("tenorLabel", selected.investmentPeriodFormatted);
                    if (selected?.rateFormatted) q.set("rateFormatted", selected.rateFormatted);
                    router.push(`/dashboard/investments/${params.id}/rollover/confirm?${q.toString()}`);
                  } catch (e) {
                    if (e instanceof ApiError) setError(e.message);
                    else if (e instanceof Error) setError(e.message);
                    else setError("Unable to compute expected return.");
                  } finally {
                    setExpectedLoading(false);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </OnboardingShell>
  );
}

