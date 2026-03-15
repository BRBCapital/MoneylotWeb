"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingShell from "@/components/templates/onboarding/OnboardingShell";
import { getWithdrawalEligible } from "@/services/webinvestment";
import { ApiError } from "@/lib/apiClient";
import { isAbortError } from "@/lib/isAbortError";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { formatNGN } from "@/lib/investment";

type InvestmentItem = {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
  status: "matured" | "active";
};

function StatusDot({
  label,
  color,
}: {
  label: "Matured" | "Active";
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-1 text-[10px] font-medium"
      style={{ color }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </div>
  );
}

function MaturedPill() {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-transparent bg-[#1790DF1A] px-2 py-0.5 text-[10px] font-medium text-[#1790DF] group-hover:border-[#1790DF]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#1790DF]" />
      Matured
    </div>
  );
}

export default function WithdrawalsSelectPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [investments, setInvestments] = useState<InvestmentItem[]>([]);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setError(null);
        setLoading(true);
        const res = await getWithdrawalEligible(ac.signal);
        console.log("[Withdrawals] get-withdrawal-eligible response:", res);

        const items = (res as any)?.data;
        if (Array.isArray(items)) {
          const mapped = (items as any[])
            .filter((x) => x && typeof x === "object")
            .map<InvestmentItem>((x: any) => {
              const id = String(x.id ?? "");
              const investmentType =
                typeof x.investmentType === "string" ? x.investmentType.trim() : "Investment";
              const tenor = typeof x.tenor === "string" ? x.tenor.trim() : "";
              const amountNum =
                typeof x.amount === "number" && Number.isFinite(x.amount) ? x.amount : 0;
              const isMatured = !!x.isMatured;
              const elapsed =
                typeof x.elapsedFormatted === "string" ? x.elapsedFormatted.trim() : "";

              return {
                id,
                title: tenor ? `${investmentType} - ${tenor}` : investmentType,
                subtitle: isMatured
                  ? formatNGN(amountNum)
                  : `${elapsed || "In progress"} - Early exit penalty applies`,
                amount: formatNGN(amountNum),
                status: isMatured ? "matured" : "active",
              };
            })
            .filter((x) => x.id);
          setInvestments(mapped);
        } else {
          setInvestments([]);
        }
      } catch (e) {
        if (isAbortError(e)) return;
        if (e instanceof ApiError) {
          console.log("[Withdrawals] get-withdrawal-eligible error:", e.message, e.details);
          setError(e.message);
        } else if (e instanceof Error) {
          console.log("[Withdrawals] get-withdrawal-eligible error:", e.message);
          setError(e.message);
        } else {
          console.log("[Withdrawals] get-withdrawal-eligible error:", e);
          setError("Unable to load investments.");
        }
        setInvestments([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  const ready = useMemo(() => investments.filter((i) => i.status === "matured"), [investments]);
  const active = useMemo(() => investments.filter((i) => i.status === "active"), [investments]);

  return (
    <OnboardingShell stage={4} totalStages={4} showProgress={false}>
      <div className="w-full relative">
        <LoadingOverlay show={loading} label="Loading investments..." />
        <div className="mx-auto w-full max-w-[640px]">
          <div className="mb-4">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
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
                Select Investment
              </h1>
              <p className="mt-1 text-[11px] text-[#5F6368]">
                Choose the investment you wish to withdraw from
              </p>

              {error ? (
                <div className="mt-4 rounded-[10px] border border-[#F2C6C6] bg-[#FFF5F5] px-4 py-3 text-[11px] text-[#D32F2F]">
                  {error}
                </div>
              ) : null}

              {/* Ready for withdrawal */}
              <p className="mt-5 text-[10px] font-medium text-[#89E081]">
                Ready for Withdrawal
              </p>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                {ready.length === 0 ? (
                  <div className="md:col-span-2 rounded-[10px] border border-dashed border-[#EEEEEE] bg-white px-4 py-10 text-center">
                    <p className="text-[11px] font-medium text-[#5F6368]">
                      No matured investment
                    </p>
                  </div>
                ) : (
                  ready.map((i) => (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => router.push(`/dashboard/withdrawals/${i.id}?status=matured`)}
                      className="group rounded-[8px] border border-[#EEEEEE] bg-white px-4 py-3 text-left transition-colors hover:bg-[#FAFAFA]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[10px] font-semibold text-[#2E2E2E]">
                          {i.title}
                        </p>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] font-semibold text-[#5FCE55]">
                            {i.amount}
                          </span>
                          <MaturedPill />
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Active investments */}
              <p className="mt-6 text-[10px] font-medium text-[#2E2E2E]">
                Active Investments
              </p>
              <div className="mt-2 space-y-3">
                {active.map((i) => (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() =>
                      router.push(`/dashboard/withdrawals/${i.id}?status=active&early=1`)
                    }
                    className="w-full rounded-[8px] border border-[#EEEEEE] bg-white px-4 py-4 text-left transition-colors hover:border-[#89E081]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold text-[#2E2E2E]">
                          {i.title}
                        </p>
                        <p className="mt-1 text-[9px] text-[#5F6368]">
                          {i.subtitle}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-semibold text-[#2E2E2E]">
                          {i.amount}
                        </span>
                        <StatusDot label="Active" color="#5FCE55" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="rounded-[8px] bg-[#F2F2F2] px-6 py-2 text-[11px] font-semibold text-[#2E2E2E] hover:opacity-80"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OnboardingShell>
  );
}

