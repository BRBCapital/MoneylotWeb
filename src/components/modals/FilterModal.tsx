"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { imagesAndIcons } from "@/constants/imagesAndIcons";

export type FilterPayload = {
  quickDate?: "Today" | "Yesterday" | "7D" | "30D" | "Custom" | "";
  startDate?: string;
  endDate?: string;
  investmentType?: number | null;
  minAmount?: string;
  maxAmount?: string;
  minRate?: string;
  maxRate?: string;
  status?: string;
};

const INVESTMENT_TYPES: Array<{ id: number; label: string }> = [
  { id: 1, label: "Short Term Investments" },
  { id: 2, label: "Mid Term Investments" },
  { id: 3, label: "Long Term Investments" },
];

function fmtISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default function FilterModal({
  open,
  setOpen,
  onApply,
  onReset,
  initial,
  variant = "modal",
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onApply: (payload: FilterPayload) => void;
  onReset?: () => void;
  initial?: FilterPayload;
  variant?: "modal" | "popover";
}) {
  const [openSection, setOpenSection] = useState<string | null>("date");
  const [payload, setPayload] = useState<FilterPayload>(initial || {});

  const statuses = useMemo(
    () => ["Active", "Inactive", "Matured", "Pending"],
    [],
  );

  const toggle = (section: string) =>
    setOpenSection((prev) => (prev === section ? null : section));

  const setQuickDate = (value: FilterPayload["quickDate"]) => {
    const today = new Date();
    let start = payload.startDate || "";
    let end = payload.endDate || "";

    switch (value) {
      case "Today": {
        start = fmtISODate(today);
        end = fmtISODate(today);
        break;
      }
      case "Yesterday": {
        const y = addDays(today, -1);
        start = fmtISODate(y);
        end = fmtISODate(y);
        break;
      }
      case "7D": {
        start = fmtISODate(addDays(today, -6));
        end = fmtISODate(today);
        break;
      }
      case "30D": {
        start = fmtISODate(addDays(today, -29));
        end = fmtISODate(today);
        break;
      }
      case "Custom":
      default:
        break;
    }

    setPayload((p) => ({
      ...p,
      quickDate: value || "",
      startDate: start,
      endDate: end,
    }));
  };

  const reset = () => {
    setPayload({});
    setOpenSection("date");
    onReset?.();
  };

  const Chevron = ({ open }: { open: boolean }) => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="text-[#5F6368]"
    >
      <path
        d={open ? "M6 12L10 8L14 12" : "M6 8L10 12L14 8"}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const content = (
    <div className="w-[344px] rounded-[10px] bg-white border border-[#E9E9E9] shadow-lg p-4">
      <div className="flex justify-between items-center border-b border-gray-200 pt-1 pb-2">
        <h4 className="font-semibold text-sm">Filter by</h4>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="p-1 hover:bg-[#F8F8F8] rounded transition-colors"
          aria-label="Close"
        >
          <Image
            src={imagesAndIcons.closeModal}
            alt="Close"
            width={18}
            height={18}
            className="w-[18px] h-[18px]"
          />
        </button>
      </div>

      <div className="space-y-2 mt-3 text-[12px]">
        {/* Date */}
        <div className="border-b border-gray-200 pb-2">
          <button
            type="button"
            onClick={() => toggle("date")}
            className="w-full flex justify-between items-center py-1"
          >
            <span className="font-medium">Date</span>
            <Chevron open={openSection === "date"} />
          </button>

          {openSection === "date" && (
            <div className="mt-2">
              <div className="flex flex-wrap gap-1 mb-2">
                {(["Today", "Yesterday", "7D", "30D", "Custom"] as const).map(
                  (label) => (
                    <button
                      type="button"
                      key={label}
                      onClick={() => setQuickDate(label)}
                      className={`text-[11px] px-2 py-1 rounded border ${
                        payload.quickDate === label
                          ? "bg-[#DFF5DD] border-[#5FCE55] text-[#5FCE55] font-semibold"
                          : "border-gray-200 text-gray-700 hover:border-[#5FCE55]"
                      }`}
                    >
                      {label}
                    </button>
                  ),
                )}
              </div>

              {payload.quickDate === "Custom" && (
                <div className="flex justify-between gap-2">
                  <input
                    type="date"
                    value={payload.startDate || ""}
                    onChange={(e) =>
                      setPayload((p) => ({ ...p, startDate: e.target.value }))
                    }
                    className="w-1/2 border border-gray-200 rounded-md px-2 py-1 text-[11px]"
                  />
                  <input
                    type="date"
                    value={payload.endDate || ""}
                    onChange={(e) =>
                      setPayload((p) => ({ ...p, endDate: e.target.value }))
                    }
                    className="w-1/2 border border-gray-200 rounded-md px-2 py-1 text-[11px]"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instruments */}
        <div>
          <button
            type="button"
            onClick={() => toggle("instruments")}
            className="w-full flex justify-between items-center py-1"
          >
            <span className="font-medium">Investment Type</span>
            <Chevron open={openSection === "instruments"} />
          </button>
          {openSection === "instruments" && (
            <select
              value={
                typeof payload.investmentType === "number"
                  ? String(payload.investmentType)
                  : ""
              }
              onChange={(e) => {
                const raw = e.target.value;
                const n = raw ? Number(raw) : null;
                setPayload((p) => ({
                  ...p,
                  investmentType: Number.isFinite(n as any)
                    ? (n as number)
                    : null,
                }));
              }}
              className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs mt-1 bg-white"
            >
              <option value="">All</option>
              {INVESTMENT_TYPES.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Amount */}
        <div>
          <button
            type="button"
            onClick={() => toggle("amount")}
            className="w-full flex justify-between items-center py-1"
          >
            <span className="font-medium">Amount</span>
            <Chevron open={openSection === "amount"} />
          </button>
          {openSection === "amount" && (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                placeholder="Min"
                value={payload.minAmount || ""}
                onChange={(e) =>
                  setPayload((p) => ({ ...p, minAmount: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
              />
              <span className="text-gray-500 text-xs">-</span>
              <input
                type="number"
                placeholder="Max"
                value={payload.maxAmount || ""}
                onChange={(e) =>
                  setPayload((p) => ({ ...p, maxAmount: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
              />
            </div>
          )}
        </div>

        {/* Rate */}
        <div>
          <button
            type="button"
            onClick={() => toggle("rate")}
            className="w-full flex justify-between items-center py-1"
          >
            <span className="font-medium">Rate</span>
            <Chevron open={openSection === "rate"} />
          </button>
          {openSection === "rate" && (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                placeholder="Min %"
                value={payload.minRate || ""}
                onChange={(e) =>
                  setPayload((p) => ({ ...p, minRate: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
              />
              <span className="text-gray-500 text-xs">-</span>
              <input
                type="number"
                placeholder="Max %"
                value={payload.maxRate || ""}
                onChange={(e) =>
                  setPayload((p) => ({ ...p, maxRate: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
              />
            </div>
          )}
        </div>

        {/* Status */}
        <div>
          <button
            type="button"
            onClick={() => toggle("status")}
            className="w-full flex justify-between items-center py-1"
          >
            <span className="font-medium">Status</span>
            <Chevron open={openSection === "status"} />
          </button>
          {openSection === "status" && (
            <div className="flex gap-2 flex-wrap mt-1">
              {statuses.map((st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() =>
                    setPayload((p) => ({
                      ...p,
                      status: p.status === st ? "" : st,
                    }))
                  }
                  className={`px-2 py-0.5 rounded-md cursor-pointer text-xs border ${
                    payload.status === st
                      ? "bg-[#DFF5DD] text-[#5FCE55] font-semibold border-[#5FCE55]"
                      : "bg-white text-gray-700 border-gray-300"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 mt-4">
          <Button.SmSecondary
            height="30px"
            width="80px"
            fontSize="text-[11px]"
            label="Reset"
            onClick={reset}
          />
          <Button.SmPrimary
            height="30px"
            width="110px"
            fontSize="text-[11px]"
            label="Apply Filter"
            onClick={() => {
              onApply(payload);
              setOpen(false);
            }}
          />
        </div>
      </div>
    </div>
  );

  return variant === "popover" ? (
    open ? (
      content
    ) : null
  ) : (
    <Modal open={open} onClosed={() => setOpen(false)} setClose={setOpen}>
      {content}
    </Modal>
  );
}
