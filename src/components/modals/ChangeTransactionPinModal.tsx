"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import OtpInputs from "@/components/inputs/OtpInputs";
import { imagesAndIcons } from "@/constants/imagesAndIcons";

export default function ChangeTransactionPinModal({
  open,
  setOpen,
  onVerified,
  title = "Change Transaction PIN",
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onVerified: (newPin: string, confirmNewPin: string) => void | Promise<void>;
  title?: string;
}) {
  const [pin, setPin] = useState("");
  const [verifyPin, setVerifyPin] = useState("");
  const [resetKey1, setResetKey1] = useState(0);
  const [resetKey2, setResetKey2] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPin("");
      setVerifyPin("");
      setResetKey1((k) => k + 1);
      setResetKey2((k) => k + 1);
      setIsSubmitting(false);
      setError(null);
    }
  }, [open]);

  const canVerify = useMemo(
    () => pin.length === 4 && verifyPin.length === 4 && pin === verifyPin,
    [pin, verifyPin]
  );
  const pinMismatch = pin.length === 4 && verifyPin.length === 4 && pin !== verifyPin;

  return (
    <Modal
      open={open}
      onClosed={() => setOpen(false)}
      setClose={setOpen}
      contentClassName="p-0"
    >
      <div className="w-full lg:w-[520px] p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <p className="text-[12px] font-semibold text-[#2E2E2E]">
            {title}
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
              width={24}
              height={24}
              className="h-6 w-6"
            />
          </button>
        </div>
        <div className="h-px w-full bg-[#EEEEEE]" />

        <div className="px-8 py-7 text-center">
          <h3 className="text-[18px] font-semibold text-[#2E2E2E]">
            Enter New Transaction PIN
          </h3>

          <div className="mx-auto mt-5 w-full max-w-[320px]">
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

          <h3 className="mt-7 text-[18px] font-semibold text-[#2E2E2E]">
            Verify Transaction PIN
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
                // Submit via enter on last field
                if (pin.length === 4 && val.length === 4 && pin === val) {
                  if (isSubmitting) return;
                  setError(null);
                  setIsSubmitting(true);
                  Promise.resolve(onVerified(pin, val))
                    .then(() => setOpen(false))
                    .catch((e) => {
                      if (e instanceof Error) setError(e.message);
                      else setError("Unable to proceed. Please try again.");
                    })
                    .finally(() => setIsSubmitting(false));
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
              disabled={isSubmitting}
              className="h-[54px] rounded-[10px] text-[14px] font-semibold"
            />
            <Button.MdPrimary
              label="Verify"
              disabled={!canVerify}
              loading={isSubmitting ? "Please wait" : undefined}
              onClick={async () => {
                if (!canVerify || isSubmitting) return;
                setError(null);
                try {
                  setIsSubmitting(true);
                  await onVerified(pin, verifyPin);
                  setOpen(false);
                } catch (e) {
                  if (e instanceof Error) setError(e.message);
                  else setError("Unable to proceed. Please try again.");
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="h-[54px] rounded-[10px] text-[14px] font-semibold"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

