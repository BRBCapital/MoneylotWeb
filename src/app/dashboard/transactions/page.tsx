"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "@/components/templates/dashboard/DashboardShell";
import Table3, { Table3Row } from "@/components/table/Table3";
import Image from "next/image";
import { imagesAndIcons } from "@/constants/imagesAndIcons";
import TransactionsFilterPopover, {
  TransactionsFilterPayload,
} from "@/components/modals/TransactionsFilterPopover";
import { ApiError } from "@/lib/apiClient";
import { formatNGN } from "@/lib/investment";
import { getTransactionList } from "@/services/webinvestment";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { isAbortError } from "@/lib/isAbortError";

export default function TransactionsPage() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState<TransactionsFilterPayload>({
    date: "All",
    type: "All",
  });

  const [rows, setRows] = useState<Table3Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);

  const hasActiveFilter = useMemo(() => {
    const d = filter?.date || "All";
    const t = filter?.type || "All";
    const min = (filter?.minAmount || "").trim();
    const max = (filter?.maxAmount || "").trim();
    return d !== "All" || t !== "All" || Boolean(min) || Boolean(max);
  }, [filter]);

  function toIsoDate(d: Date) {
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  }

  function dateRangeFromPreset(preset?: TransactionsFilterPayload["date"]) {
    const p = preset || "All";
    if (p === "All") return { startDate: "", endDate: "" };
    const end = new Date();
    const start = new Date();
    if (p === "Today") {
      // start already today
    } else if (p === "Yesterday") {
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
    } else if (p === "7D") {
      start.setDate(start.getDate() - 7);
    } else if (p === "30D") {
      start.setDate(start.getDate() - 30);
    }
    return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
  }

  function mapApiRows(items: any[]): Table3Row[] {
    const title = (s: unknown) => {
      const t = typeof s === "string" ? s.trim() : "";
      if (!t) return "-";
      return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
    };
    const parseNum = (v: unknown) => {
      if (typeof v === "number" && Number.isFinite(v)) return v;
      if (typeof v === "string" && v.trim()) {
        const n = Number(v.replace(/[^\d.-]/g, ""));
        return Number.isFinite(n) ? n : 0;
      }
      return 0;
    };
    return items
      .filter((x) => x && typeof x === "object")
      .map((x: any) => {
        const typeRaw =
          typeof x.type === "string" && x.type.trim() ? x.type.trim() : "";
        const type = title(typeRaw);
        const isWithdrawal = typeRaw.trim().toLowerCase() === "withdrawal";
        const amt = parseNum(x.amount);
        const absAmt = Math.abs(amt);
        const amountText = formatNGN(absAmt);
        const amountNode = (
          <span
            className={`font-semibold ${
              isWithdrawal ? "text-[#E53935]" : "text-[#2E2E2E]"
            }`}
          >
            {isWithdrawal ? `-${amountText}` : amountText}
          </span>
        );

        const product =
          (typeof x.instrument === "string" && x.instrument.trim()
            ? x.instrument.trim()
            : null) ||
          (typeof x.product === "string" && x.product.trim()
            ? x.product.trim()
            : null) ||
          "-";
        const referenceNumber =
          (typeof x.referenceNumber === "string" && x.referenceNumber.trim()
            ? x.referenceNumber.trim()
            : null) ||
          (typeof x.reference === "string" && x.reference.trim()
            ? x.reference.trim()
            : null) ||
          (typeof x.ref === "string" && x.ref.trim() ? x.ref.trim() : null) ||
          "-";
        const dateUpdated =
          (typeof x.dateUpdatedFormatted === "string" &&
            x.dateUpdatedFormatted) ||
          (typeof x.dateUpdated === "string" && x.dateUpdated) ||
          (typeof x.transactionDate === "string" && x.transactionDate) ||
          (typeof x.createdAt === "string" && x.createdAt) ||
          "-";
        return {
          data: [referenceNumber, amountNode, product, type, dateUpdated],
        };
      });
  }

  async function fetchPage(
    nextPage: number,
    nextFilter: TransactionsFilterPayload,
  ) {
    const { startDate, endDate } = dateRangeFromPreset(nextFilter.date);
    const hasMin = Boolean(nextFilter.minAmount?.trim());
    const hasMax = Boolean(nextFilter.maxAmount?.trim());
    const minParsed = hasMin ? Number(nextFilter.minAmount) : NaN;
    const maxParsed = hasMax ? Number(nextFilter.maxAmount) : NaN;
    const minAmount =
      hasMin && Number.isFinite(minParsed) && minParsed > 0
        ? minParsed
        : undefined;
    const maxAmount =
      hasMax && Number.isFinite(maxParsed) && maxParsed > 0
        ? maxParsed
        : undefined;
    const payload = {
      ...(minAmount !== undefined ? { minAmount } : {}),
      ...(maxAmount !== undefined ? { maxAmount } : {}),
      type: nextFilter.type && nextFilter.type !== "All" ? nextFilter.type : "",
      startDate,
      endDate,
      pageSize,
      pageNumber: nextPage,
    };

    const ac = new AbortController();
    try {
      setError(null);
      setLoading(true);
      const res = await getTransactionList(payload, ac.signal);
      console.log("[Transactions] get-transaction-list payload:", payload);
      console.log("[Transactions] get-transaction-list response:", res);
      const items = (res as any)?.data;
      setRows(Array.isArray(items) ? mapApiRows(items) : []);
      setPageNumber((res as any)?.pageNumber || nextPage);
      setPageSize((res as any)?.pageSize || pageSize);
      setTotalRecords((res as any)?.totalRecords || 0);
    } catch (e) {
      if (isAbortError(e)) return;
      if (e instanceof ApiError) setError(e.message);
      else if (e instanceof Error) setError(e.message);
      else setError("Unable to load transactions.");
      setRows([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchPage(1, filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const headers = useMemo(
    () => [
      {
        text: "Transaction Reference",
        type: "text" as const,
        minWidth: "220px",
      },
      { text: "Amount", type: "component" as const, minWidth: "140px" },
      { text: "Product", type: "text" as const, minWidth: "160px" },
      { text: "Type", type: "text" as const, minWidth: "140px" },
      { text: "Date Updated", type: "text" as const, minWidth: "170px" },
    ],
    [],
  );

  return (
    <DashboardShell>
      <div className="w-full">
        <div className="px-6">
          <h1 className="text-[18px] font-semibold text-[#2E2E2E]">
            Transaction History
          </h1>
          <p className="mt-1 text-[14px] text-[#5F6368]">
            All investment placements and maturity payouts.
          </p>
        </div>

        <div className="mt-5 bg-white rounded-[10px] p-6 relative">
          <LoadingOverlay show={loading} label="Loading transactions..." />
          <div className="relative flex flex-wrap items-center justify-between gap-y-2">
            <p className="text-[17px] font-semibold text-[#2E2E2E]">
              All Transactions
            </p>

            <button
              type="button"
              onClick={() => setFilterOpen((v) => !v)}
              className="inline-flex h-[30px] items-center justify-center gap-2 rounded-[6px] border border-[#EEEEEE] bg-white px-3 leading-none hover:bg-[#FAFAFA] transition-colors"
            >
              <Image
                src={imagesAndIcons.filters}
                alt="Filter"
                width={16}
                height={16}
                className="h-4 w-4"
              />
              <span className="text-[11px] font-medium leading-none text-[#2E2E2E]">
                Filter
              </span>
            </button>

            {filterOpen ? (
              <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-20 sm:left-auto sm:right-0 sm:w-[min(344px,calc(100vw-3rem))]">
                <TransactionsFilterPopover
                  open={filterOpen}
                  setOpen={setFilterOpen}
                  initial={filter}
                  onReset={() => {
                    setFilter({ date: "All", type: "All" });
                    setPageNumber(1);
                  }}
                  onApply={(p) => {
                    setFilter({ ...(p || {}) });
                    setPageNumber(1);
                  }}
                />
              </div>
            ) : null}
          </div>

          <div className="mt-4">
            {error ? (
              <div className="mb-3 rounded-[10px] border border-[#F2C6C6] bg-[#FFF5F5] px-4 py-3 text-[11px] text-[#D32F2F]">
                {error}
              </div>
            ) : null}
            <Table3
              headers={headers}
              data={rows}
              loading={loading}
              emptyText={
                hasActiveFilter
                  ? "No transactions qualify for these options"
                  : "No transactions yet"
              }
              pagination={
                !loading && !error && rows.length === 0
                  ? undefined
                  : {
                      type: "asynchronous",
                      total: totalRecords,
                      current: pageNumber,
                      limit: pageSize,
                      onChange: async (p) => {
                        await fetchPage(p, filter);
                      },
                    }
              }
            />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
