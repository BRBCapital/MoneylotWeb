"use client";

import React from "react";
import BackPillButton from "@/components/molecules/onboarding/BackPillButton";
import OnboardingCard from "@/components/organisms/onboarding/OnboardingCard";
import Button from "@/components/ui/Button";
import InvestmentConfirmationTable from "@/components/organisms/onboarding/InvestmentConfirmationTable";
import IconCheckbox from "@/components/ui/IconCheckbox";

export default function Stage5ConfirmInvestment({
  createInvestmentError,
  createInvestmentLoading,
  isStage4Ready,
  selectedRatePa,
  selectedTenorDays,
  investmentAmount,
  expectedReturn,
  totalAtMaturity,
  maturityDateText,
  acknowledgeInvestment,
  onBack,
  onAcknowledgeChange,
  onProceedToPayment,
}: {
  createInvestmentError: string | null;
  createInvestmentLoading: boolean;
  isStage4Ready: boolean;
  selectedRatePa: number | null;
  selectedTenorDays: number | null;
  investmentAmount: string;
  expectedReturn: number | null;
  totalAtMaturity: number | null;
  maturityDateText: string | null;
  acknowledgeInvestment: boolean;
  onBack: () => void;
  onAcknowledgeChange: (v: boolean) => void;
  onProceedToPayment: () => void | Promise<void>;
}) {
  return (
    <>
      <div className="mx-auto w-full max-w-[640px]">
        <BackPillButton onClick={onBack} />
      </div>

      <OnboardingCard
        stepLine={
          <p className="text-[12px] font-medium text-[#5F6368]">
            Almost There!
          </p>
        }
        title="Confirm Your Investment"
        footer={
          <div className="flex items-center justify-between gap-4">
            <div className="min-h-[16px]">
              {createInvestmentError ? (
                <p className="text-[11px] text-[#E53935]">
                  {createInvestmentError}
                </p>
              ) : null}
            </div>
            <Button.SmPrimary
              label="Proceed to Payment"
              width={180}
              height={38}
              fontSize="text-[12px]"
              loading={createInvestmentLoading ? "Please wait" : undefined}
              disabled={createInvestmentLoading}
              onClick={() => void onProceedToPayment()}
            />
          </div>
        }
      >
        <p className="text-[12px] text-[#5F6368] -mt-1">
          Please review all details carefully before proceeding to payment
        </p>

        {isStage4Ready && selectedRatePa && selectedTenorDays ? (
          <InvestmentConfirmationTable
            investmentType="Fixed Deposit"
            amountInput={investmentAmount}
            tenorDays={selectedTenorDays}
            ratePa={selectedRatePa}
            expectedReturnOverride={expectedReturn}
            totalAtMaturityOverride={totalAtMaturity}
            maturityDateOverride={maturityDateText}
          />
        ) : (
          <div className="mt-4 rounded-[10px] border border-black/10 px-5 py-8 text-[12px] text-[#5F6368]">
            Select a tenor and enter an amount to review your investment.
          </div>
        )}

        <div className="mt-4 flex items-center gap-3 rounded-[6px] border border-[#89E081] bg-[#5FCE551A] px-4 py-3 text-[12px] leading-[18px] text-[#2E2E2E]">
          <IconCheckbox
            checked={acknowledgeInvestment}
            onChange={onAcknowledgeChange}
          />
          <div className="text-[#5F6368]">
            By proceeding, I agree that all returns accrued will be forfeited
            and a penalty fee incurred if funds are withdrawn before maturity
          </div>
        </div>
      </OnboardingCard>
    </>
  );
}
