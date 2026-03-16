"use client";

import React from "react";
import Image from "next/image";
import BackPillButton from "@/components/molecules/onboarding/BackPillButton";
import OnboardingCard from "@/components/organisms/onboarding/OnboardingCard";
import Button from "@/components/ui/Button";
import { SearchableSelectField, TextField } from "@/components/molecules/forms/Field";
import { imagesAndIcons } from "@/constants/imagesAndIcons";

export type Stage3FieldErrors = Partial<
  Record<"bankName" | "accountNumber" | "accountName", string>
>;

export default function Stage3BankDetails({
  stage3Error,
  stage3Loading,
  stage3FieldErrors,
  banksLoading,
  banksError,
  bankName,
  bankOptions,
  accountNumber,
  accountName,
  accountResolveLoading,
  canContinue,
  onBack,
  onBankNameChange,
  onAccountNumberChange,
  onContinue,
}: {
  stage3Error: string | null;
  stage3Loading: boolean;
  stage3FieldErrors: Stage3FieldErrors;
  banksLoading: boolean;
  banksError: string | null;
  bankName: string;
  bankOptions: Array<{ label: string; value: string }>;
  accountNumber: string;
  accountName: string;
  accountResolveLoading: boolean;
  canContinue: boolean;
  onBack: () => void;
  onBankNameChange: (v: string) => void;
  onAccountNumberChange: (digits: string) => void;
  onContinue: () => void | Promise<void>;
}) {
  return (
    <>
      <div className="mx-auto w-full max-w-[640px]">
        <BackPillButton onClick={onBack} />
      </div>

      <OnboardingCard
        stepLine={
          <p className="text-[18px] font-medium text-[#2E2E2E]">
            Step <span className="text-[#2E2E2E]">3/</span>
            <span className="text-[#979797]">4</span>
            <span className="text-[#2E2E2E]"> - Bank Details</span>
          </p>
        }
        title="Bank Account Details"
        footer={
          <div className="flex items-center justify-between gap-4">
            <div className="min-h-[16px]">
              {stage3Error ? (
                <p className="text-[11px] text-[#E53935]">{stage3Error}</p>
              ) : null}
            </div>
            <Button.SmPrimary
              label="Continue"
              width={160}
              height={38}
              loading={stage3Loading ? "Please wait" : undefined}
              disabled={!canContinue || stage3Loading}
              onClick={() => void onContinue()}
            />
          </div>
        }
      >
        <p className="text-[12px] text-[#5F6368] -mt-3">
          Add your bank details for withdrawals
        </p>

        <div className="mt-4">
          <SearchableSelectField
            label="Bank Name"
            placeholder={banksLoading ? "Loading banks..." : "Select bank name"}
            value={bankName}
            onChange={onBankNameChange}
            options={bankOptions}
            searchPlaceholder="Search bank"
            disabled={banksLoading}
            error={stage3FieldErrors.bankName}
          />
          {banksError ? (
            <p className="mt-1 text-[10px] text-[#E53935]">{banksError}</p>
          ) : null}
        </div>

        <div className="mt-4">
          <div className="w-full">
            <label className="block text-[11px] font-medium text-[#5F6368]">
              Account Number
            </label>
            <div className="relative mt-1">
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                value={accountNumber}
                onChange={(e) => {
                  const digits = (e.target.value || "")
                    .replace(/\D/g, "")
                    .slice(0, 10);
                  onAccountNumberChange(digits);
                }}
                placeholder="1234567890"
                className="h-[40px] w-full rounded-[6px] border border-black/10 bg-white px-3 pr-[150px] text-[12px] text-[#2E2E2E] outline-none focus:border-[#89E081]"
              />

              {accountResolveLoading ? (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[10px] text-[#5F6368]">
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#5F6368]/20 border-t-[#5F6368]/60" />
                  <span className="uppercase tracking-wide">Checking account</span>
                </div>
              ) : accountName.trim() && accountNumber.trim().length === 10 ? (
                <Image
                  src={imagesAndIcons.toastSuccessIcon}
                  alt="Resolved"
                  width={14}
                  height={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px]"
                />
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <TextField
            label="Account Name (as registered)"
            value={accountName}
            onChange={() => {}}
            disabled
            error={stage3FieldErrors.accountName}
          />
        </div>
      </OnboardingCard>
    </>
  );
}

