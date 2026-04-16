"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { imagesAndIcons } from "@/constants/imagesAndIcons";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export type TransactionsFilterPayload = {
  date?: "All" | "Today" | "Yesterday" | "7D" | "30D";
  minAmount?: string;
  maxAmount?: string;
  type?: "All" | "Deposit" | "Withdrawal";
};

const sectionOrder = ["date", "amount", "type"] as const;
type Section = (typeof sectionOrder)[number];

function Chevron({ open }: { open: boolean }) {
  return (
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
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[6px] border px-3 py-1 text-[10px] font-medium transition-colors ${
        active
          ? "border-[#89E081] bg-[#5FCE551A] text-[#2E2E2E]"
          : "border-[#EEEEEE] bg-white text-[#5F6368] hover:border-[#89E081]"
      }`}
    >
      {label}
    </button>
  );
}

export default function TransactionsFilterPopover({
  open,
  setOpen,
  initial,
  onApply,
  onReset,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  initial?: TransactionsFilterPayload;
  onApply: (payload: TransactionsFilterPayload) => void;
  onReset?: () => void;
}) {
  const isCompact = useMediaQuery("(max-width: 639px)");
  const [openSection, setOpenSection] = useState<Section>("date");
  const [payload, setPayload] = useState<TransactionsFilterPayload>({
    date: "All",
    type: "All",
    ...(initial || {}),
  });

  const digitsOnly = (v: string) => (v || "").replace(/[^\d]/g, "");

  const toggle = (s: Section) => setOpenSection((p) => (p === s ? s : s));

  const reset = () => {
    setPayload({ date: "All", type: "All" });
    setOpenSection("date");
    onReset?.();
  };

  const dateOptions = useMemo(() => ["All", "Today", "Yesterday", "7D", "30D"] as const, []);
  const typeOptions = useMemo(() => ["All", "Deposit", "Withdrawal"] as const, []);

  if (!open) return null;

  const panel = (
    <div className="w-full min-w-0 max-w-[344px] rounded-[10px] border border-[#E9E9E9] bg-white p-4 text-[#000000] shadow-lg sm:w-[344px]">
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

      <div className="space-y-2 mt-3 text-[12px] text-[#000000]">
        {/* Date */}
        <div className="border-b border-gray-200 pb-2">
          <button
            type="button"
            onClick={() => setOpenSection("date")}
            className="w-full flex justify-between items-center py-1"
          >
            <span className="font-medium">Date</span>
            <Chevron open={openSection === "date"} />
          </button>
          {openSection === "date" ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {dateOptions.map((d) => (
                <Chip
                  key={d}
                  label={d}
                  active={(payload.date || "All") === d}
                  onClick={() => setPayload((p) => ({ ...p, date: d }))}
                />
              ))}
            </div>
          ) : null}
        </div>

        {/* Amount */}
        <div className="border-b border-gray-200 pb-2">
          <button
            type="button"
            onClick={() => setOpenSection("amount")}
            className="w-full flex justify-between items-center py-1"
          >
            <span className="font-medium">Amount</span>
            <Chevron open={openSection === "amount"} />
          </button>
          {openSection === "amount" ? (
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Min"
                value={payload.minAmount || ""}
                onChange={(e) =>
                  setPayload((p) => ({
                    ...p,
                    minAmount: digitsOnly(e.target.value),
                  }))
                }
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs text-[#000000] placeholder:text-[#9CA3AF]"
              />
              <span className="hidden text-xs text-gray-500 sm:inline">-</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Max"
                value={payload.maxAmount || ""}
                onChange={(e) =>
                  setPayload((p) => ({
                    ...p,
                    maxAmount: digitsOnly(e.target.value),
                  }))
                }
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs text-[#000000] placeholder:text-[#9CA3AF]"
              />
            </div>
          ) : null}
        </div>

        {/* Type */}
        <div>
          <button
            type="button"
            onClick={() => setOpenSection("type")}
            className="w-full flex justify-between items-center py-1"
          >
            <span className="font-medium">Type</span>
            <Chevron open={openSection === "type"} />
          </button>
          {openSection === "type" ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {typeOptions.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  active={(payload.type || "All") === t}
                  onClick={() => setPayload((s) => ({ ...s, type: t }))}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <div className="w-full sm:w-[80px]">
            <Button.SmSecondary
              height="30px"
              fullWidth
              fontSize="text-[11px]"
              label="Cancel"
              className="flex items-center justify-center py-0 leading-none"
              onClick={() => {
                setOpen(false);
              }}
            />
          </div>
          <div className="w-full sm:w-[110px]">
            <Button.SmPrimary
              height="30px"
              fullWidth
              fontSize="text-[11px]"
              label="Apply Filter"
              className="flex items-center justify-center py-0 leading-none"
              onClick={() => {
                onApply(payload);
                setOpen(false);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  if (isCompact) {
    return (
      <Modal
        open={open}
        setClose={setOpen}
        contentClassName="p-0 w-full max-w-[min(400px,calc(100vw-2rem))]"
      >
        {panel}
      </Modal>
    );
  }

  return panel;
}

