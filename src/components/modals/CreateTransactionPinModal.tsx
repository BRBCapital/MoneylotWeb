"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import OtpInputs from "@/components/inputs/OtpInputs";
import { imagesAndIcons } from "@/constants/imagesAndIcons";
import { ApiError } from "@/lib/apiClient";
import { createPin } from "@/services/pin";
import { showErrorToast, showSuccessToast } from "@/state/toastState";

export default function CreateTransactionPinModal({
  open,
  setOpen,
  onVerified,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onVerified: (pin: string) => void;
}) {
  const [pin, setPin] = useState("");
  const [verifyPin, setVerifyPin] = useState("");
  const [resetKey1, setResetKey1] = useState(0);
  const [resetKey2, setResetKey2] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPin("");
      setVerifyPin("");
      setError(null);
      setIsLoading(false);
      setResetKey1((k) => k + 1);
      setResetKey2((k) => k + 1);
    }
  }, [open]);

  const canVerify = useMemo(
    () => pin.length === 4 && verifyPin.length === 4 && pin === verifyPin,
    [pin, verifyPin]
  );
  const pinMismatch = pin.length === 4 && verifyPin.length === 4 && pin !== verifyPin;

  async function onSubmitPin(finalPin: string) {
    setError(null);
    if (finalPin.length !== 4) return;
    if (finalPin !== verifyPin) {
      setError("pin mismatch");
      return;
    }

    try {
      setIsLoading(true);
      const res = await createPin({ pin: finalPin, pinConfirmation: finalPin });
      console.log("[PIN] pin/create response:", res);
      showSuccessToast("Success", res?.message || "PIN Created Successfully");
      setOpen(false);
      onVerified(finalPin);
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Unable to create PIN. Please try again.";
      setError(msg);
      showErrorToast("Error", msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClosed={() => setOpen(false)}
      setClose={setOpen}
      contentClassName="p-0"
    >
      <div className="w-full lg:w-[560px] p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <p className="text-[16px] font-semibold text-[#2E2E2E]">
            Create Transaction PIN
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
        <div className="h-px w-full bg-[#EEEEEE]" />

        {/* Body */}
        <div className="px-8 py-7 text-center">
          <h3 className="text-[22px] font-bold text-[#2E2E2E]">Create PIN</h3>
          <p className="mt-1 text-[14px] text-[#5F6368]">
            Set a <span className="font-semibold">4-digit</span> PIN to verify
            your transactions.
          </p>

          <div className="mx-auto mt-6 w-full max-w-[320px]">
            <OtpInputs
              length={4}
              secure
              resetKey={resetKey1}
              onChange={(val) => {
                setError(null);
                setPin(val);
              }}
              onComplete={(val) => {
                setError(null);
                setPin(val);
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setError(null);
              setPin("");
              setVerifyPin("");
              setResetKey1((k) => k + 1);
              setResetKey2((k) => k + 1);
            }}
            className="mt-3 text-[11px] font-medium text-[#89E081] hover:opacity-80"
          >
            Clear PIN
          </button>

          <h3 className="mt-8 text-[22px] font-bold text-[#2E2E2E]">
            Verify PIN
          </h3>

          <div className="mx-auto mt-4 w-full max-w-[320px]">
            <OtpInputs
              length={4}
              secure
              resetKey={resetKey2}
              onChange={(val) => {
                setError(null);
                setVerifyPin(val);
              }}
              onComplete={(val) => {
                setError(null);
                setVerifyPin(val);
              }}
              onEnter={(val) => {
                setVerifyPin(val);
                if (pin.length === 4 && val.length === 4 && pin === val) {
                  void onSubmitPin(pin);
                }
              }}
            />
          </div>

          <div className="mx-auto mt-4 min-h-[16px] max-w-[420px]">
            {pinMismatch ? (
              <p className="text-[11px] font-bold text-[#E53935] text-center">
                pin mismatch
              </p>
            ) : error ? (
              <p className="text-[11px] text-[#E53935] text-center">{error}</p>
            ) : null}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <Button.MdSecondary
              label="Cancel"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="h-[54px] rounded-[10px] text-[14px] font-semibold"
            />
            <Button.MdPrimary
              label="Verify"
              loading={isLoading ? "Please wait" : undefined}
              onClick={() => void onSubmitPin(pin)}
              disabled={!canVerify}
              className="h-[54px] rounded-[10px] text-[14px] font-semibold"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

