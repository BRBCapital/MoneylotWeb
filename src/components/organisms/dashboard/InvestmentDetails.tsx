"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Pills from "@/components/ui/Pills";
import { imagesAndIcons } from "@/constants/imagesAndIcons";
import KycGateModal from "@/components/modals/KycGateModal";
import { useAtomValue } from "jotai";
import { authSessionAtom } from "@/state/appState";
import {
  getInvestmentDetail,
  InvestmentDetailDto,
} from "@/services/webinvestment";
import { ApiError } from "@/lib/apiClient";
import { applyWithholdingTax, formatNGN } from "@/lib/investment";
import { isAbortError } from "@/lib/isAbortError";
import LoadingOverlay from "@/components/ui/LoadingOverlay";

export type InvestmentStatus = "matured" | "active" | "inactive";

export default function InvestmentDetails({
  investmentId,
  status = "active",
}: {
  investmentId: string;
  status?: InvestmentStatus;
}) {
  const router = useRouter();
  const session = useAtomValue(authSessionAtom);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<InvestmentDetailDto | null>(null);
  const [kycOpen, setKycOpen] = useState(false);

  useEffect(() => {
    const id = Number(investmentId);
    if (!Number.isFinite(id) || id <= 0) return;
    const ac = new AbortController();
    (async () => {
      try {
        setError(null);
        setLoading(true);
        const res = await getInvestmentDetail(id, ac.signal);
        console.log("[Investment Detail] get-investment-detail response:", res);
        const data = (res as any)?.data;
        if (data && typeof data === "object") {
          setDetail(data as InvestmentDetailDto);
        } else {
          setDetail(null);
        }
      } catch (e) {
        if (isAbortError(e)) return;
        if (e instanceof ApiError) {
          console.log(
            "[Investment Detail] get-investment-detail error:",
            e.message,
            e.details,
          );
          setError(e.message);
        } else if (e instanceof Error) {
          console.log(
            "[Investment Detail] get-investment-detail error:",
            e.message,
          );
          setError(e.message);
        } else {
          console.log("[Investment Detail] get-investment-detail error:", e);
          setError("Unable to load investment detail");
        }
        setDetail(null);
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [investmentId]);

  const effectiveStatus = useMemo<InvestmentStatus>(() => {
    const raw = (
      typeof detail?.status === "string" ? detail.status : status || "active"
    )
      .toLowerCase()
      .trim();
    return raw === "matured"
      ? "matured"
      : raw === "inactive"
        ? "inactive"
        : "active";
  }, [detail?.status, status]);

  const isMatured = effectiveStatus === "matured";

  const kycStatus = useMemo(() => {
    const raw = (session as any)?.kycStatus ?? (detail as any)?.kycStatus;
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [detail, session]);

  // Enum: 1 New, 2 Pending, 3 Approved, 4 Rejected, 5 Abandoned
  const isKycApproved = kycStatus === 3;
  const isKycPending = kycStatus === 2;
  const isKycRejected = kycStatus === 4;
  const needsKyc = kycStatus === 1 || kycStatus === 5 || kycStatus == null;

  const kycVariant = isKycRejected ? "rejected" : "required";

  const handleWithdrawClick = (href: string) => {
    if (isKycApproved) {
      router.push(href);
      return;
    }
    if (isKycPending) return; // button is disabled, but keep safe-guard
    // New/Abandoned/Unknown => show modal. Rejected => show rejected modal.
    if (needsKyc || isKycRejected) {
      setKycOpen(true);
      return;
    }
    setKycOpen(true);
  };

  const rows: Array<{ label: string; value: React.ReactNode }> = useMemo(() => {
    const d = detail;
    const safeText = (v: unknown) =>
      typeof v === "string" && v.trim() ? v.trim() : "-";
    const safeNum = (v: unknown) =>
      typeof v === "number" && Number.isFinite(v) ? v : 0;
    return [
      {
        label: "Investment Amount",
        value: d ? formatNGN(safeNum(d.investmentAmount)) : "-",
      },
      {
        label: "Current Balance",
        value: d
          ? formatNGN(
              safeNum(
                (d as any).outstandingBalance ??
                  (d as any).outstanding_balance ??
                  (d as any).investmentBalance ??
                  d.investmentAmount,
              ),
            )
          : "-",
      },
      { label: "Interest Rate", value: d ? safeText(d.investmentRate) : "-" },
      { label: "Investment Type", value: d ? safeText(d.investmentType) : "-" },
      {
        label: "Investment Period",
        value: d ? safeText(d.investmentPeriod) : "-",
      },
      {
        label: "Expected Returns",
        value: d ? formatNGN(applyWithholdingTax(safeNum(d.expectedReturn))) : "-",
      },
      { label: "Date Created", value: d ? safeText(d.dateCreated) : "-" },
      { label: "Maturity Date", value: d ? safeText(d.maturityDate) : "-" },
      {
        label: "Days Remaining",
        value: d ? safeText(d.dateRemaining) : isMatured ? "0 days" : "-",
      },
      {
        label: "Status",
        value: (
          <div className="flex justify-end">
            <Pills
              type={effectiveStatus}
              text={
                effectiveStatus === "matured"
                  ? "Matured"
                  : effectiveStatus === "active"
                    ? "Active"
                    : "Inactive"
              }
            />
          </div>
        ),
      },
    ];
  }, [detail, effectiveStatus, isMatured]);

  return (
    <div className="w-full relative">
      <LoadingOverlay show={loading} label="Loading details..." />
      {/* Back */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-[8px] border border-[#EEEEEE] bg-white px-2.5 py-1 text-[12px] font-medium text-[#2E2E2E] shadow-sm hover:bg-[#FAFAFA]"
        >
          <span className="text-[14px] leading-none">‹</span>
          Back
        </button>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4">
        <Image
          src={imagesAndIcons.fixedDeposit}
          alt="Fixed Deposit"
          width={52}
          height={52}
          className="h-[52px] w-[52px] shrink-0"
        />
        <div className="min-w-0">
          <h1 className="text-[18px] font-semibold text-[#2E2E2E] leading-6">
            {detail?.investmentType || "Fixed Deposit"}
          </h1>
          <p className="mt-0.5 text-[12px] text-[#5F6368]">
            {detail?.investmentPeriod || ""}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="mt-6">
        <p className="text-[11px] font-semibold text-[#2E2E2E]">
          Investment Details
        </p>

        {error ? (
          <div className="mt-3 rounded-[10px] border border-[#F2C6C6] bg-[#FFF5F5] px-4 py-3 text-[11px] text-[#D32F2F]">
            {error}
          </div>
        ) : null}

        <div className="mt-3 rounded-[10px] border border-transparent">
          {rows.map((r, idx) => (
            <div
              key={r.label}
              className={`flex items-center justify-between py-3 ${
                idx === 0 ? "" : "border-t border-[#EEEEEE]"
              }`}
            >
              <span className="text-[14px] font-medium text-[#979797]">
                {r.label}
              </span>
              {r.label === "Status" ? (
                <div className="text-right">{r.value}</div>
              ) : (
                <span className="text-[15px] font-semibold text-[#2E2E2E] leading-[20px]">
                  {r.value}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex justify-end gap-3">
        {isMatured ? (
          <>
            {status !== "inactive" ? (
              <Button.SmSecondary
                label="Withdraw Funds"
                height={40}
                width={155}
                fontSize="text-[13px]"
                disabled={isKycPending}
                backgroundColor={isKycPending ? "bg-[#E5E7EB]" : "bg-white"}
                textColor={isKycPending ? "text-[#9CA3AF]" : "text-[#2E2E2E]"}
                className={`border rounded-[8px] font-medium ${
                  isKycPending ? "border-[#D1D5DB]" : "border-[#EEEEEE]"
                }`}
                onClick={() =>
                  handleWithdrawClick(
                    `/dashboard/withdrawals/${investmentId}?status=matured`,
                  )
                }
              />
            ) : null}
            <Button.SmPrimary
              label="Rollover Funds"
              height={40}
              width={155}
              fontSize="text-[13px]"
              className="rounded-[8px] font-medium"
              onClick={() =>
                router.push(`/dashboard/investments/${investmentId}/rollover`)
              }
            />
          </>
        ) : effectiveStatus !== "inactive" ? (
          <Button.SmPrimary
            label="Withdraw Funds"
            height={40}
            width={155}
            fontSize="text-[13px]"
            className="rounded-[8px] font-medium"
            disabled={isKycPending}
            onClick={() =>
              handleWithdrawClick(
                `/dashboard/withdrawals/${investmentId}?status=${effectiveStatus}&early=1`,
              )
            }
          />
        ) : null}
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
    </div>
  );
}
