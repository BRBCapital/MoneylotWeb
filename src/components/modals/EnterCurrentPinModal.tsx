"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import OtpInputs from "@/components/inputs/OtpInputs";
import { imagesAndIcons } from "@/constants/imagesAndIcons";

export default function EnterCurrentPinModal({
  open,
  setOpen,
  onProceed,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onProceed: (pin: string) => void | Promise<void>;
}) {
  const [pin, setPin] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canProceed = useMemo(() => pin.length === 4, [pin]);

  useEffect(() => {
    if (!open) {
      setPin("");
      setResetKey((k) => k + 1);
      setIsSubmitting(false);
      setError(null);
    }
  }, [open]);

  async function handleProceed(nextPin: string) {
    if (isSubmitting) return;
    if ((nextPin || "").length !== 4) return;
    setError(null);
    try {
      setIsSubmitting(true);
      await onProceed(nextPin);
      setOpen(false);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Unable to validate PIN. Please try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

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
            Change Transaction PIN
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

        <div className="px-8 py-8 text-center">
          <h3 className="text-[18px] font-semibold text-[#2E2E2E]">
            Enter Current PIN
          </h3>

          <div className="mx-auto mt-6 w-full max-w-[320px]">
            <OtpInputs
              length={4}
              secure
              resetKey={resetKey}
              onChange={(val) => {
                setError(null);
                setPin(val);
              }}
              onComplete={(val) => {
                setError(null);
                setPin(val);
              }}
              onEnter={(val) => {
                setError(null);
                setPin(val);
                if ((val || "").length === 4) void handleProceed(val);
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setError(null);
              setPin("");
              setResetKey((k) => k + 1);
            }}
            className="mt-3 text-[11px] font-medium text-[#89E081] hover:opacity-80"
          >
            Clear PIN
          </button>

          <div className="mx-auto mt-4 min-h-[16px] max-w-[420px]">
            {error ? (
              <p className="text-[11px] font-bold text-[#E53935] text-center">
                {error}
              </p>
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
              label="Proceed"
              loading={isSubmitting ? "Please wait" : undefined}
              onClick={() => void handleProceed(pin)}
              disabled={!canProceed || isSubmitting}
              className="h-[54px] rounded-[10px] text-[14px] font-semibold"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

