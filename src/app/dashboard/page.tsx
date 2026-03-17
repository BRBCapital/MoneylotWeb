"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DashboardShell from "@/components/templates/dashboard/DashboardShell";
import DashboardHeader from "@/components/organisms/dashboard/DashboardHeader";
import SummaryCard from "@/components/organisms/dashboard/SummaryCard";
import Table3, { Table3Row } from "@/components/table/Table3";
import FilterModal, { FilterPayload } from "@/components/modals/FilterModal";
import IdentityVerificationModal from "@/components/modals/IdentityVerificationModal";
import Image from "next/image";
import { imagesAndIcons } from "@/constants/imagesAndIcons";
import Pills from "@/components/ui/Pills";
import Button from "@/components/ui/Button";
import { getInvestmentList, getPortfolioSummary } from "@/services/webinvestment";
import { formatNGN } from "@/lib/investment";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { isAbortError } from "@/lib/isAbortError";
import { useAtomValue } from "jotai";
import { authSessionAtom } from "@/state/appState";
import { useSearchParams } from "next/navigation";

export default function DashboardPage() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [identityModalOpen, setIdentityModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterPayload>({});
  const session = useAtomValue(authSessionAtom);
  const searchParams = useSearchParams();

  const kycStatus = useMemo(() => {
    const raw = (session as any)?.kycStatus;
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
    // Backward compat: treat NIN verified as KYC approved.
    const ninOk = Boolean(session?.ninVerified ?? (session as any)?.isNINVerified);
    return ninOk ? 3 : 1;
  }, [session]);

  const kycVariant = useMemo<"new" | "pending" | "failed" | "none">(() => {
    if (kycStatus === 3) return "none"; // Approved
    if (kycStatus === 2) return "pending";
    if (kycStatus === 4) return "failed";
    return "new"; // New / Abandoned / unknown
  }, [kycStatus]);

  useEffect(() => {
    if (searchParams.get("verifyKyc") === "1") {
      setIdentityModalOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [totalInvested, setTotalInvested] = useState(0);
  const [earnedReturns, setEarnedReturns] = useState(0);
  const [investmentRows, setInvestmentRows] = useState<Table3Row[]>([]);
  const summaryLoadedRef = useRef(false);
  const listLoadedRef = useRef(false);
  const activeFilterRef = useRef<FilterPayload>({});
  const refreshInFlightRef = useRef(false);

  function normalizeNumber(v: unknown) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim()) {
      const n = Number(v.replace(/[^\d.-]/g, ""));
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  }

  function getSummaryNumbers(data: unknown) {
    if (!data || typeof data !== "object") {
      return { portfolioValue: 0, totalInvested: 0, earnedReturns: 0 };
    }
    const d: any = data;

    // Try common shapes/keys
    const pv =
      normalizeNumber(d.portfolioValue) ||
      normalizeNumber(d.portfolio_value) ||
      normalizeNumber(d.portfolioTotal) ||
      normalizeNumber(d.totalPortfolioValue) ||
      0;
    const ti =
      normalizeNumber(d.totalInvested) ||
      normalizeNumber(d.total_invested) ||
      normalizeNumber(d.investedAmount) ||
      normalizeNumber(d.totalInvestment) ||
      0;
    const er =
      normalizeNumber(d.earnedReturns) ||
      normalizeNumber(d.earned_returns) ||
      normalizeNumber(d.totalReturns) ||
      normalizeNumber(d.returns) ||
      0;

    return { portfolioValue: pv, totalInvested: ti, earnedReturns: er };
  }

  function titleCase(s: string) {
    const t = (s || "").trim();
    if (!t) return "";
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  const buildListPayload = (f: FilterPayload) => {
    const toOptionalNumber = (v?: string) => {
      if (!v || !v.trim()) return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    };

    const statusRaw = (f.status || "").trim();
    const status = statusRaw ? titleCase(statusRaw.toLowerCase()) : "";

    const minAmount = toOptionalNumber(f.minAmount);
    const maxAmount = toOptionalNumber(f.maxAmount);
    const minRate = toOptionalNumber(f.minRate);
    const maxRate = toOptionalNumber(f.maxRate);

    const startDate = (f.startDate || "").trim();
    const endDate = (f.endDate || "").trim();
    const hasDateRange = Boolean(startDate && endDate);

    return {
      // API expects enum id (number) or null, not a string
      ...(typeof f.investmentType === "number" && Number.isFinite(f.investmentType) && f.investmentType > 0
        ? { investmentType: f.investmentType }
        : { investmentType: null }),
      ...(typeof minAmount === "number" ? { minAmount } : {}),
      ...(typeof maxAmount === "number" ? { maxAmount } : {}),
      ...(typeof minRate === "number" ? { minRate } : {}),
      ...(typeof maxRate === "number" ? { maxRate } : {}),
      status: status,
      ...(hasDateRange ? { startDate, endDate } : {}),
      pageSize: 20,
      pageNumber: 1,
    };
  };

  const mapInvestmentRows = (items: any[]) => {
    const title = (s: string) => titleCase((s || "").trim().toLowerCase());
    return items
      .filter((x) => {
        if (!x || typeof x !== "object") return false;
        const rolled =
          (x as any).isRolledOver === true ||
          (x as any).isRolledover === true ||
          (x as any).isRolled_Over === true ||
          (x as any).rolledOver === true ||
          (x as any).isRollover === true;
        return !rolled;
      })
      .map((x: any) => {
        const id = Number(x.id);
        const statusRaw =
          typeof x.status === "string" ? x.status.trim().toLowerCase() : "";
        const pillType =
          statusRaw === "matured"
            ? "matured"
            : statusRaw === "active"
              ? "active"
              : statusRaw === "inactive"
                ? "inactive"
                : "inactive";

        const invType =
          typeof x.investmentType === "string" ? x.investmentType.trim() : "-";
        const period =
          typeof x.investmentPeriod === "string" ? x.investmentPeriod.trim() : "";
        const invLabel = period ? `${invType} (${period})` : invType;

        const currentBalance = normalizeNumber(
          (x as any).outstandingBalance ??
            (x as any).outstanding_balance ??
            (x as any).investmentBalance ??
            (x as any).balance ??
            (x as any).investment_balance ??
            x.amount
        );

        const yieldLabel =
          typeof x.expectedYield === "string"
            ? x.expectedYield.trim()
            : `${normalizeNumber(x.expectedYield)}%`;
        const createdAt =
          (typeof (x as any).createdAt === "string" && (x as any).createdAt.trim()
            ? (x as any).createdAt.trim()
            : null) ||
          (typeof (x as any).dateCreated === "string" && (x as any).dateCreated.trim()
            ? (x as any).dateCreated.trim()
            : null) ||
          (typeof (x as any).dateCreatedFormatted === "string" &&
          (x as any).dateCreatedFormatted.trim()
            ? (x as any).dateCreatedFormatted.trim()
            : null) ||
          "-";

        return {
          link:
            Number.isFinite(id) && id > 0
              ? `/dashboard/investments/${id}?status=${encodeURIComponent(
                  statusRaw || "inactive"
                )}`
              : undefined,
          data: [
            invLabel,
            formatNGN(currentBalance),
            yieldLabel,
            <Pills
              key={`${id}-${pillType}`}
              type={pillType as any}
              text={title(statusRaw) || "Inactive"}
            />,
            createdAt,
          ],
        };
      });
  };

  useEffect(() => {
    activeFilterRef.current = activeFilter || {};
  }, [activeFilter]);

  async function refreshAll(opts?: { showInitialLoading?: boolean }) {
    const showInitialLoading = opts?.showInitialLoading === true;
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;
    const ac = new AbortController();
    try {
      if (showInitialLoading && !summaryLoadedRef.current) setLoading(true);
      if (showInitialLoading && !listLoadedRef.current) setListLoading(true);

      const payload = buildListPayload(activeFilterRef.current);

      const [summary, list] = await Promise.all([
        getPortfolioSummary(ac.signal),
        getInvestmentList(payload as any, ac.signal),
      ]);

      // Summary
      if (summary?.status && summary.data) {
        const nums = getSummaryNumbers(summary.data);
        setPortfolioValue(nums.portfolioValue);
        setTotalInvested(nums.totalInvested);
        setEarnedReturns(nums.earnedReturns);
      } else if (!summaryLoadedRef.current) {
        // only force zeros on first load
        setPortfolioValue(0);
        setTotalInvested(0);
        setEarnedReturns(0);
      }

      // List
      const items = (list as any)?.data;
      if (Array.isArray(items)) {
        setInvestmentRows(mapInvestmentRows(items));
      } else if (!listLoadedRef.current) {
        setInvestmentRows([]);
      }
    } catch (e) {
      if (isAbortError(e)) return;
      console.log("[Dashboard] refresh error:", e);
      // keep existing UI during background refresh; only reset on first load
      if (!summaryLoadedRef.current) {
        setPortfolioValue(0);
        setTotalInvested(0);
        setEarnedReturns(0);
      }
      if (!listLoadedRef.current) {
        setInvestmentRows([]);
      }
    } finally {
      summaryLoadedRef.current = true;
      listLoadedRef.current = true;
      setLoading(false);
      setListLoading(false);
      refreshInFlightRef.current = false;
      ac.abort();
    }
  }

  useEffect(() => {
    // initial fetch
    void refreshAll({ showInitialLoading: true });
    // refresh every 5 minutes (background)
    const id = window.setInterval(() => {
      void refreshAll({ showInitialLoading: false });
    }, 60 * 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // refetch list when filter changes (no full-page overlay)
    void refreshAll({ showInitialLoading: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  const investments: Table3Row[] = useMemo(() => investmentRows, [investmentRows]);

  const tableHeaders = [
    { text: "Instruments", type: "text" as const },
    { text: "Current Balance", type: "text" as const },
    { text: "Expected Yield", type: "text" as const },
    { text: "Status", type: "component" as const },
    { text: "Date Created", type: "text" as const },
  ];

  return (
    <DashboardShell>
      <div className="relative">
        <LoadingOverlay
          show={(!summaryLoadedRef.current || !listLoadedRef.current) && (loading || listLoading)}
          label="Loading..."
        />
      </div>
      <DashboardHeader />

      {/* Profile Setup Alert */}
      {kycVariant !== "none" ? (
        <div
          className={`mt-6 mb-6 flex items-center justify-between gap-4 rounded-[8px] px-4 py-3 ${
            kycVariant === "failed" ? "bg-[#FFE8E8]" : "bg-[#FFF6DE]"
          }`}
        >
          <div className="flex items-center gap-3">
            <Image
              src={
                kycVariant === "pending"
                  ? imagesAndIcons.pending
                  : kycVariant === "failed"
                    ? imagesAndIcons.failed
                    : imagesAndIcons.completeProfile
              }
              alt="Alert"
              width={32}
              height={32}
              className="h-[32px] w-[32px] shrink-0"
            />
            <div>
              {kycVariant === "pending" ? (
                <>
                  <p className="text-[14px] font-bold text-[#684502] leading-5">
                    KYC Verification Pending
                  </p>
                  <p className="mt-0.5 text-[13px] font-normal text-[#684502] leading-5">
                    Your documents will be reviewed within 24 hours. You can start building your portfolio now.
                  </p>
                </>
              ) : kycVariant === "failed" ? (
                <>
                  <p className="text-[14px] font-bold text-[#EB001B] leading-5">
                    KYC Verification Failed
                  </p>
                  <p className="mt-0.5 text-[13px] font-normal text-[#EB001B] leading-5">
                    We couldn&apos;t verify your documents. Please try again
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[14px] font-bold text-[#684502] leading-5">
                    Complete your KYC verification
                  </p>
                  <p className="mt-0.5 text-[13px] font-normal text-[#684502] leading-5">
                    Verify Your Identity
                  </p>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIdentityModalOpen(true)}
            className={`text-[13px] font-medium hover:opacity-80 ${
              kycVariant === "failed" ? "text-[#EB001B]" : "text-[#684502]"
            }`}
          >
            Review
          </button>
        </div>
      ) : null}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <SummaryCard
          title="Portfolio Value"
          value={formatNGN(portfolioValue)}
          icon="portfolioValue"
        />
        <SummaryCard
          title="Total Invested"
          value={formatNGN(totalInvested)}
          icon="totalInvested"
        />
        <SummaryCard
          title="Earned Returns"
          value={formatNGN(earnedReturns)}
          icon="earnedReturns"
        />
      </div>

      {/* My Investments Section */}
      <div className="bg-white rounded-[10px] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[17px] font-semibold text-[#2E2E2E]">
            My Investments
          </h2>
          {investments.length > 0 ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setFilterOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] border border-[#EEEEEE] bg-white hover:bg-[#FAFAFA] transition-colors"
              >
                <Image
                  src={imagesAndIcons.filters}
                  alt="Filter"
                  width={18}
                  height={18}
                  className="w-[18px] h-[18px]"
                />
                <span className="text-[11px] font-medium text-[#2E2E2E]">
                  Filter
                </span>
              </button>

              {/* Popover filter (anchored under button) */}
              {filterOpen ? (
                <div className="absolute right-0 top-[calc(100%+10px)] z-20">
                  <FilterModal
                    open={filterOpen}
                    setOpen={setFilterOpen}
                    variant="popover"
                    initial={activeFilter}
                    onReset={() => setActiveFilter({})}
                    onApply={(payload) => setActiveFilter({ ...(payload || {}) })}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <Table3
          headers={tableHeaders}
          data={investments}
          emptyText="No active investments yet"
          pagination={investments.length > 0 ? { type: "sychronous", limit: 8 } : undefined}
        />
      </div>

      {/* Modals */}
      {kycVariant !== "none" ? (
        <IdentityVerificationModal
          open={identityModalOpen}
          setOpen={setIdentityModalOpen}
        />
      ) : null}
    </DashboardShell>
  );
}
