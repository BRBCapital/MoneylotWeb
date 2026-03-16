"use client";

import React from "react";
import BackPillButton from "@/components/molecules/onboarding/BackPillButton";
import OnboardingCard from "@/components/organisms/onboarding/OnboardingCard";
import Button from "@/components/ui/Button";
import TenorCard from "@/components/molecules/onboarding/TenorCard";
import InvestmentSummary from "@/components/organisms/onboarding/InvestmentSummary";

export default function Stage4Investment({
  ratesError,
  expectedReturnError,
  isStage4Ready,
  expectedReturnLoading,
  ratesLoading,
  tenorOptions,
  selectedRateId,
  investmentAmount,
  minInvestmentText,
  selectedRatePa,
  selectedTenorDays,
  onGoDashboard,
  onReviewConfirm,
  onAmountChange,
  onSelectRate,
}: {
  ratesError: string | null;
  expectedReturnError: string | null;
  isStage4Ready: boolean;
  expectedReturnLoading: boolean;
  ratesLoading: boolean;
  tenorOptions: Array<{ id: number; days: number; rateLabel: string }>;
  selectedRateId: number | null;
  investmentAmount: string;
  minInvestmentText: string;
  selectedRatePa: number | null;
  selectedTenorDays: number | null;
  onGoDashboard: () => void;
  onReviewConfirm: () => void | Promise<void>;
  onAmountChange: (v: string) => void;
  onSelectRate: (id: number) => void;
}) {
  return (
    <>
      <div className="mx-auto w-full max-w-[640px]">
        <BackPillButton label="Go to Dashboard" onClick={onGoDashboard} />
      </div>

      <OnboardingCard
        stepLine={
          <p className="text-[18px] font-medium text-[#2E2E2E]">
            Step <span className="text-[#2E2E2E]">4/</span>
            <span className="text-[#979797]">4</span>
            <span className="text-[#2E2E2E]"> - Make an Investment</span>
          </p>
        }
        title="Fixed Term Deposits"
        footer={
          <div className="flex items-center justify-between gap-4">
            <div className="min-h-[16px]">
              {ratesError || expectedReturnError ? (
                <p className="text-[11px] text-[#E53935]">
                  {expectedReturnError || ratesError}
                </p>
              ) : null}
            </div>
            {isStage4Ready ? (
              <Button.SmPrimary
                label="Review & Confirm"
                width={170}
                height={38}
                fontSize="text-[12px]"
                loading={expectedReturnLoading ? "Please wait" : undefined}
                disabled={expectedReturnLoading}
                onClick={() => void onReviewConfirm()}
              />
            ) : (
              <Button.SmSecondary
                label="Review & Confirm"
                width={170}
                height={38}
                fontSize="text-[12px]"
                backgroundColor="bg-[#F2F2F2]"
                textColor="text-[#5F6368]"
                disabled
                onClick={() => {}}
              />
            )}
          </div>
        }
      >
        <p className="text-[12px] text-[#5F6368] -mt-2 mb-2 max-w-[520px]">
          Guaranteed returns with defined interest rates
        </p>

        <div className="mt-4">
          <p className="text-[14px] font-medium text-[#5F6368]">
            How much do you want to invest? (₦)
          </p>
          <input
            type="text"
            value={investmentAmount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="Enter investment amount"
            className="mt-1 h-[40px] w-full rounded-[6px] border border-black/10 bg-white px-3 text-[12px] text-[#2E2E2E] outline-none focus:border-[#89E081]"
          />
          <p className="mt-1 text-[12px] text-[#E53935]">{minInvestmentText}</p>
        </div>

        <div className="mt-4">
          <p className="text-[14px] font-medium text-[#5F6368]">Select Tenor</p>
          <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
            {tenorOptions.map((opt) => (
              <TenorCard
                key={opt.id}
                option={{ days: opt.days, rateLabel: opt.rateLabel }}
                selected={selectedRateId === opt.id}
                onSelect={() => onSelectRate(opt.id)}
              />
            ))}
          </div>
          {ratesLoading ? (
            <p className="mt-2 text-[10px] text-[#5F6368]">Loading rates...</p>
          ) : null}
        </div>

        {isStage4Ready && selectedRatePa && selectedTenorDays ? (
          <InvestmentSummary
            amountInput={investmentAmount}
            tenorDays={selectedTenorDays}
            ratePa={selectedRatePa}
          />
        ) : null}
      </OnboardingCard>
    </>
  );
}

