"use client";

import React, { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import OtpInputs from "@/components/inputs/OtpInputs";
import Image from "next/image";
import { imagesAndIcons } from "@/constants/imagesAndIcons";
import useCountdown from "@/hooks/useCountdown";

export default function OtpModal({
  open,
  setOpen,
  onConfirm,
  email,
  isLoading,
  error,
  confirmLabel = "Verify",
  headerText = "Verify Email to Proceed",
  resendSeconds = 60,
  onResend,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onConfirm: (otp: string) => void;
  email?: string;
  isLoading?: boolean;
  error?: string | null;
  confirmLabel?: string;
  headerText?: string;
  resendSeconds?: number;
  onResend?: () => void | Promise<void>;
}) {
  const [otp, setOtp] = useState("");
  const { formatted, isActive, restart, clear, reset } = useCountdown(resendSeconds);

  useEffect(() => {
    if (!open) {
      setOtp("");
      clear();
      reset(resendSeconds);
      return;
    }
    // start countdown when opened
    restart(resendSeconds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Modal
      open={open}
      onClosed={() => setOpen(false)}
      setClose={setOpen}
      contentClassName="p-3"
    >
      <div className="w-full lg:w-[520px]">
        <div className="flex justify-between items-center">
          <p className="text-[14px] font-bold text-[#2E2E2E]">
            {headerText}
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="opacity-80 hover:opacity-100"
            aria-label="Close"
          >
            <Image
              src={imagesAndIcons.closeModal}
              alt="Close"
              width={28}
              height={28}
            />
          </button>
        </div>

        <div className="mt-3 h-px w-full bg-[#EEEEEE]" />

        <h4 className="mt-5 text-[20px] font-bold text-[#2E2E2E]">
          Enter OTP
        </h4>

        <p className="text-[14px] text-[#5F6368] mt-1.5">
          We&apos;ve sent a 6-digit one-time PIN to{" "}
          <span className="font-medium">{email || "your email"}</span>
        </p>

        <div className="mt-6">
          <OtpInputs
            length={6}
            onChange={() => {}}
            onComplete={(val) => setOtp(val)}
            onEnter={(val) => {
              setOtp(val);
              if (isLoading) return;
              onConfirm(val);
            }}
          />

          <div className="mx-auto mt-4 min-h-[16px] max-w-[440px]">
            {error ? (
              <p className="text-[12px] text-[#E53935] text-center">{error}</p>
            ) : null}
          </div>

          <p
            onClick={async () => {
              if (isActive) return;
              await onResend?.();
              restart(resendSeconds);
            }}
            className={`mt-5 cursor-pointer text-[14px] text-center text-[#2E2E2E] ${
              isActive ? "opacity-70" : "hover:opacity-80"
            }`}
          >
            Didn&apos;t get code?{" "}
            {isActive ? `Resend in ${formatted}` : <span className="cursor-pointer text-[#89E081] hover:opacity-80 font-medium" onClick={() => onResend?.()}>Resend OTP</span>}
          </p>

          <div className="grid grid-cols-2 gap-4 mt-7">
            <Button.MdSecondary
              onClick={() => setOpen(false)}
              label="Cancel"
              disabled={isLoading}
              className="h-[50px] rounded-[10px] text-[14px] font-semibold"
            />
            <Button.MdPrimary
              onClick={() => onConfirm(otp)}
              label={confirmLabel}
              loading={isLoading ? "Verifying..." : undefined}
              disabled={!otp || otp.length < 6 || isLoading}
              className="h-[50px] rounded-[10px] text-[14px] font-semibold bg-[#89E081]"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

