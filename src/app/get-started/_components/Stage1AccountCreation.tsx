"use client";

import React from "react";
import {
  PasswordField,
  PhoneNumberField,
  SelectField,
  TextField,
} from "@/components/molecules/forms/Field";
import OnboardingCard from "@/components/organisms/onboarding/OnboardingCard";
import Button from "@/components/ui/Button";
import IconCheckbox from "@/components/ui/IconCheckbox";

export type Stage1FieldErrors = Partial<
  Record<
    | "firstName"
    | "lastName"
    | "accountType"
    | "phoneNumber"
    | "email"
    | "password"
    | "confirmPassword"
    | "acceptedTerms",
    string
  >
>;

export default function Stage1AccountCreation({
  firstName,
  lastName,
  accountType,
  countryCode,
  phoneNumber,
  email,
  password,
  confirmPassword,
  acceptedTerms,
  canSubmit,
  stage1Error,
  stage1Loading,
  stage1FieldErrors,
  accountTypeOptions,
  accountTypesLoading,
  accountTypesError,
  sanitizeNameInput,
  onFirstNameChange,
  onLastNameChange,
  onAccountTypeChange,
  onCountryCodeChange,
  onPhoneNumberChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onAcceptedTermsChange,
  onContinue,
  onSignIn,
}: {
  firstName: string;
  lastName: string;
  accountType: string;
  countryCode: string;
  phoneNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
  canSubmit: boolean;
  stage1Error: string | null;
  stage1Loading: boolean;
  stage1FieldErrors: Stage1FieldErrors;
  accountTypeOptions: Array<{ label: string; value: string }>;
  accountTypesLoading: boolean;
  accountTypesError: string | null;
  sanitizeNameInput: (v: string) => string;
  onFirstNameChange: (v: string) => void;
  onLastNameChange: (v: string) => void;
  onAccountTypeChange: (v: string) => void;
  onCountryCodeChange: (v: string) => void;
  onPhoneNumberChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onConfirmPasswordChange: (v: string) => void;
  onAcceptedTermsChange: (v: boolean) => void;
  onContinue: () => void | Promise<void>;
  onSignIn: () => void;
}) {
  return (
    <>
      <div className="mx-auto w-full max-w-[640px]">
        <h1 className="text-left text-[16px] font-bold text-[#2E2E2E]">
          Get Started!
        </h1>
      </div>

      <OnboardingCard
        stepLine={
          <p className="text-[18px] font-medium text-[#2E2E2E]">
            Step <span className="text-[#2E2E2E]">1/</span>
            <span className="text-[#979797]">4</span>
            <span className="text-[#2E2E2E]"> - Account Creation</span>
          </p>
        }
        title="Personal Information"
        contentTopClassName="mt-0.5"
        footer={
          <div className="flex items-center justify-between gap-4">
            <div className="min-h-[16px]">
              {stage1Error ? (
                <p className="text-[11px] text-[#E53935]">{stage1Error}</p>
              ) : null}
            </div>
            <Button.SmPrimary
              label="Continue"
              width={160}
              height={38}
              loading={stage1Loading ? "Please wait" : undefined}
              disabled={stage1Loading || !canSubmit}
              onClick={() => void onContinue()}
            />
          </div>
        }
      >
        <p className="mt-0 mb-5 text-[12px] text-[#5F6368]">
          Enter your name and details exactly as they appear on your BVN
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField
            label="First Name"
            value={firstName}
            onChange={(v) => onFirstNameChange(sanitizeNameInput(v))}
            error={stage1FieldErrors.firstName}
          />
          <TextField
            label="Last Name"
            value={lastName}
            onChange={(v) => onLastNameChange(sanitizeNameInput(v))}
            error={stage1FieldErrors.lastName}
          />
        </div>

        <div className="mt-4">
          <SelectField
            label="Account Type"
            placeholder={
              accountTypesLoading ? "Loading account types..." : "Select account type"
            }
            value={accountType}
            onChange={onAccountTypeChange}
            options={accountTypeOptions}
            error={stage1FieldErrors.accountType}
          />
          {accountTypesError ? (
            <p className="mt-1 text-[10px] text-[#E53935]">{accountTypesError}</p>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <PhoneNumberField
            label="Phone Number"
            countryCode={countryCode}
            onCountryCodeChange={onCountryCodeChange}
            phoneNumber={phoneNumber}
            onPhoneNumberChange={onPhoneNumberChange}
            error={stage1FieldErrors.phoneNumber}
          />
          <TextField
            label="Email Address"
            value={email}
            onChange={onEmailChange}
            placeholder="Enter email address"
            error={stage1FieldErrors.email}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <PasswordField
            label="Create Password"
            value={password}
            onChange={onPasswordChange}
            autoComplete="new-password"
            error={stage1FieldErrors.password}
          />
          <PasswordField
            label="Confirm Password"
            value={confirmPassword}
            onChange={onConfirmPasswordChange}
            autoComplete="new-password"
            error={stage1FieldErrors.confirmPassword}
          />
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-3 rounded-[6px] border border-[#89E081] bg-[#5FCE551A] px-4 py-3 text-[12px] leading-[18px] text-[#2E2E2E]">
            <IconCheckbox checked={acceptedTerms} onChange={onAcceptedTermsChange} />
            <div>
              By proceeding, I agree to Moneylot&apos;s{" "}
              <a
                href="https://moneylot.com/terms-of-use"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-[#89E081] hover:opacity-80"
              >
                Terms of Use
              </a>{" "}
              and{" "}
              <a
                href="https://moneylot.com/privacy-policy"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-[#89E081] hover:opacity-80"
              >
                Privacy Policy
              </a>
            </div>
          </div>
          {stage1FieldErrors.acceptedTerms ? (
            <p className="mt-1 text-[11px] text-[#E53935]">
              {stage1FieldErrors.acceptedTerms}
            </p>
          ) : null}
        </div>
      </OnboardingCard>

      <div className="mt-4 text-center text-[12px] leading-[18px] text-[#5F6368]">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSignIn}
          className="font-semibold text-[#89E081] hover:opacity-80"
        >
          Sign In
        </button>
      </div>
    </>
  );
}

