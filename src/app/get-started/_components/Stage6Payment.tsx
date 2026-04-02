"use client";

import React from "react";
import BackPillButton from "@/components/molecules/onboarding/BackPillButton";
import OnboardingCard from "@/components/organisms/onboarding/OnboardingCard";
import Button from "@/components/ui/Button";
import PaymentDetailsTable from "@/components/organisms/onboarding/PaymentDetailsTable";

export default function Stage6Payment({
  fundingError,
  fundingLoading,
  investmentAmount,
  bankName,
  accountNumber,
  accountName,
  expiryFormatted,
  totalToTransferFormatted,
  onBack,
  onMadePayment,
}: {
  fundingError: string | null;
  fundingLoading: boolean;
  investmentAmount: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  expiryFormatted: string;
  totalToTransferFormatted: string;
  onBack: () => void;
  onMadePayment: () => void;
}) {
  return (
    <>
      <div className="mx-auto w-full max-w-[640px]">
        <BackPillButton onClick={onBack} />
      </div>

      <OnboardingCard
        stepLine={
          <p className="text-[12px] font-medium text-[#5F6368]">
            Initiate Payment
          </p>
        }
        title="Make Payment To The Account Details Below"
        footer={
          <div className="flex justify-center">
            <Button.SmPrimary
              label="I have made this payment"
              width={220}
              height={38}
              fontSize="text-[12px]"
              loading={fundingLoading ? "Please wait" : undefined}
              disabled={fundingLoading}
              onClick={onMadePayment}
            />
          </div>
        }
      >
        {fundingError ? (
          <div className="mb-3 rounded-[10px] border border-[#F2C6C6] bg-[#FFF5F5] px-4 py-3 text-[11px] text-[#D32F2F]">
            {fundingError}
          </div>
        ) : null}

        <PaymentDetailsTable
          amountInput={investmentAmount}
          bankName={bankName}
          accountNumber={accountNumber}
          accountName={accountName}
        />

        <p className="mt-4 text-center text-[11px] text-[#5F6368]">
          Account number provided expires after{" "}
          <span className="font-medium text-[#2E2E2E]">
            {expiryFormatted} mins
          </span>
        </p>

        <p className="mt-2 text-center text-[11px] text-[#2E2E2E]">
          Transfer only{" "}
          <span className="font-semibold">{totalToTransferFormatted}</span> to
          the account number above within the validity time.
        </p>
      </OnboardingCard>
    </>
  );
}
