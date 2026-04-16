"use client";

import React from "react";
import BackPillButton from "@/components/molecules/onboarding/BackPillButton";
import OnboardingCard from "@/components/organisms/onboarding/OnboardingCard";
import Button from "@/components/ui/Button";
import {
  DateField,
  SearchableSelectField,
  SelectField,
  TextField,
} from "@/components/molecules/forms/Field";

export type Stage2FieldErrors = Partial<
  Record<"dob" | "bvn" | "country" | "address" | "state" | "city", string>
>;

export default function Stage2Verification({
  stage2Error,
  stage2Loading,
  stage2FieldErrors,
  dob,
  bvn,
  country,
  address,
  stateCode,
  city,
  countriesLoading,
  countriesError,
  statesLoading,
  statesError,
  citiesLoading,
  citiesError,
  countryOptions,
  stateOptions,
  cityOptions,
  onBack,
  onDobChange,
  onBvnChange,
  onCountryChange,
  onAddressChange,
  onStateCodeChange,
  onCityChange,
  onContinue,
}: {
  stage2Error: string | null;
  stage2Loading: boolean;
  stage2FieldErrors: Stage2FieldErrors;
  dob: string;
  bvn: string;
  country: string;
  address: string;
  stateCode: string;
  city: string;
  countriesLoading: boolean;
  countriesError: string | null;
  statesLoading: boolean;
  statesError: string | null;
  citiesLoading: boolean;
  citiesError: string | null;
  countryOptions: Array<{ label: string; value: string }>;
  stateOptions: Array<{ label: string; value: string }>;
  cityOptions: Array<{ label: string; value: string }>;
  onBack: () => void;
  onDobChange: (v: string) => void;
  onBvnChange: (v: string) => void;
  onCountryChange: (v: string) => void;
  onAddressChange: (v: string) => void;
  onStateCodeChange: (code: string) => void;
  onCityChange: (v: string) => void;
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
            Step <span className="text-[#2E2E2E]">2/</span>
            <span className="text-[#979797]">4</span>
            <span className="text-[#2E2E2E]"> - Verification</span>
          </p>
        }
        title="Identity & Address Verification"
        contentClassName="flex flex-col justify-between gap-6"
        footer={
          <div className="flex items-center justify-between gap-4">
            <div className="min-h-[16px]">
              {stage2Error ? (
                <p className="text-[11px] text-[#E53935]">{stage2Error}</p>
              ) : null}
            </div>
            <Button.SmPrimary
              label="Continue"
              width={160}
              height={38}
              loading={stage2Loading ? "Please wait" : undefined}
              disabled={stage2Loading}
              onClick={() => void onContinue()}
            />
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DateField
            label="Date of Birth"
            value={dob}
            onChange={onDobChange}
            error={stage2FieldErrors.dob}
          />
          <TextField
            label="BVN (Bank Verification Number)"
            value={bvn}
            onChange={onBvnChange}
            placeholder="Enter your BVN"
            error={stage2FieldErrors.bvn}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField
            label="Country of Residence"
            placeholder={
              countriesLoading ? "Loading countries..." : "Select country of residence"
            }
            value={country}
            onChange={onCountryChange}
            options={countryOptions}
            error={stage2FieldErrors.country}
          />
          {countriesError ? (
            <p className="mt-1 text-[10px] text-[#E53935]">{countriesError}</p>
          ) : null}
          <TextField
            label="Residential Address"
            value={address}
            onChange={onAddressChange}
            placeholder="Enter residential address"
            error={stage2FieldErrors.address}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="w-full">
            <SelectField
              label="State"
              placeholder={
                !country.trim()
                  ? "Select country first"
                  : statesLoading
                    ? "Loading states..."
                    : "Select state"
              }
              value={stateCode}
              onChange={onStateCodeChange}
              options={stateOptions}
              disabled={!country.trim() || statesLoading}
              error={stage2FieldErrors.state}
            />
            {statesError ? (
              <p className="mt-1 text-[10px] text-[#E53935]">{statesError}</p>
            ) : null}
          </div>
          <div className="w-full">
            <SearchableSelectField
              label="City"
              placeholder={
                !stateCode.trim()
                  ? "Select state first"
                  : citiesLoading
                    ? "Loading cities..."
                    : "Search or type your city"
              }
              searchPlaceholder="Search cities"
              value={city}
              onChange={onCityChange}
              options={cityOptions}
              disabled={!stateCode.trim() || citiesLoading}
              allowCustom
              error={stage2FieldErrors.city}
            />
            {citiesError ? (
              <p className="mt-1 text-[10px] text-[#E53935]">{citiesError}</p>
            ) : null}
          </div>
        </div>
      </OnboardingCard>
    </>
  );
}

