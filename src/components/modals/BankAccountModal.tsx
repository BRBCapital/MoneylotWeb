"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Modal from "@/components/ui/Modal";
import { imagesAndIcons } from "@/constants/imagesAndIcons";

export type BankAccountModalData = {
  id: string;
  bankName: string;
  bankCode?: string;
  logo?: string;
  avatarText?: string;
  avatarBg?: string;
  accountNumber: string;
  accountName: string;
  active: boolean;
  isDefault: boolean;
  createdAt?: string | null;
};

function formatAddedDate(createdAt?: string | null) {
  const raw = (createdAt || "").trim();
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return `Added ${d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative h-[22px] w-[42px] rounded-full transition-colors cursor-pointer ${
        on ? "bg-[#89E081]" : "bg-[#E5E7EB]"
      }`}
      aria-label={on ? "Enabled" : "Disabled"}
    >
      <span
        className={`absolute left-[3px] top-[3px] h-[16px] w-[16px] rounded-full bg-white shadow-sm transition-transform ${
          on ? "translate-x-[20px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function Avatar({
  logo,
  bankName,
  avatarText = "BNK",
  avatarBg = "#E6532C",
}: {
  logo?: string;
  bankName: string;
  avatarText?: string;
  avatarBg?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!logo || failed) {
    return (
      <div
        className="h-12 w-12 rounded-full flex items-center justify-center text-white text-[11px] font-semibold shrink-0"
        style={{ backgroundColor: avatarBg }}
      >
        {avatarText}
      </div>
    );
  }
  return (
    <div className="h-12 w-12 rounded-full overflow-hidden border border-black/10 bg-white shrink-0 flex items-center justify-center">
      <Image
        src={logo}
        alt={bankName || "Bank"}
        width={48}
        height={48}
        unoptimized
        className="h-12 w-12 object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export default function BankAccountModal({
  open,
  setOpen,
  bank,
  onToggleDefault,
  onDelete,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  bank: BankAccountModalData | null;
  onToggleDefault: (next: boolean) => void;
  onDelete: () => void;
}) {
  const addedText = useMemo(() => formatAddedDate(bank?.createdAt), [bank?.createdAt]);
  if (!bank) return null;
  const showActive = bank.isDefault;
  const canDelete = !bank.isDefault;

  return (
    <Modal open={open} onClosed={() => setOpen(false)} setClose={setOpen} contentClassName="p-0">
      <div className="w-full lg:w-[560px] p-0">
        <div className="flex items-center justify-between px-6 py-5">
          <p className="text-[18px] font-semibold text-[#2E2E2E]">Bank Account</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-9 w-9 rounded-full bg-[#F2F2F2] flex items-center justify-center opacity-90 hover:opacity-100"
            aria-label="Close"
          >
            <Image
              src={imagesAndIcons.closeModal}
              alt="Close"
              width={18}
              height={18}
              className="h-[18px] w-[18px]"
            />
          </button>
        </div>
        <div className="h-px w-full bg-[#EEEEEE]" />

        <div className="px-6 py-6">
          <div>
            <Avatar
              logo={bank.logo}
              bankName={bank.bankName}
              avatarText={bank.avatarText}
              avatarBg={bank.avatarBg}
            />

            <div className="mt-4">
              <div className="flex items-center gap-3">
                <p className="text-[14px] font-semibold text-[#2E2E2E]">
                  {bank.bankName || "-"}
                </p>
                {showActive ? (
                  <span className="rounded-[6px] bg-[#E7F7E6] px-2 py-0.5 text-[12px] font-medium text-[#2F8A2E]">
                    Active
                  </span>
                ) : null}
              </div>

              <p className="mt-2 text-[20px] font-semibold text-[#5FCE55]">
                {bank.accountNumber || "-"}
              </p>
              <p className="mt-1 text-[14px] text-[#2E2E2E]">
                {bank.accountName || "-"}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-[12px] border border-[#EEEEEE] bg-white px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-semibold text-[#2E2E2E]">
                  Set as default
                </p>
                <p className="mt-0.5 text-[12px] text-[#979797]">
                  {addedText || "\u00A0"}
                </p>
              </div>
              <Toggle on={bank.isDefault} onChange={onToggleDefault} />
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[#EEEEEE]">
            <button
              type="button"
              onClick={() => {
                if (!canDelete) return;
                onDelete();
              }}
              className={`inline-flex items-center gap-3 px-1 py-2 text-left transition-opacity ${
                canDelete ? "hover:opacity-80" : "opacity-50 cursor-not-allowed"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M9 3h6m-7 4h8m-9 0 1 16h8l1-16M10 11v8m4-8v8"
                  stroke="#EB001B"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[14px] font-semibold text-[#EB001B]">
                Delete Account
              </span>
            </button>
            {!canDelete ? (
              <p className="mt-1 text-[12px] text-[#979797]">
                You can’t delete your default account. Set another account as default first.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </Modal>
  );
}

