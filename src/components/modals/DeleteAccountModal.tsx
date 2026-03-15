"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { imagesAndIcons } from "@/constants/imagesAndIcons";
import IconCheckbox from "@/components/ui/IconCheckbox";

const REASONS = [
  "I no longer need the account",
  "I found a better alternative",
  "I have privacy/security concerns",
  "The app is difficult to use",
  "Other",
] as const;

export default function DeleteAccountModal({
  open,
  setOpen,
  onSubmit,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onSubmit?: (payload: {
    reason: string;
    comment: string;
    disableInstead: boolean;
  }) => void | Promise<void>;
}) {
  const [reason, setReason] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [disableInstead, setDisableInstead] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setReason("");
      setComment("");
      setDisableInstead(false);
      setLoading(false);
      setError(null);
    }
  }, [open]);

  const actionLabel = useMemo(
    () => (disableInstead ? "Disable Account" : "Delete Account"),
    [disableInstead],
  );

  return (
    <Modal open={open} onClosed={() => setOpen(false)} setClose={setOpen} contentClassName="p-0">
      <div className="w-full lg:w-[560px] p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <p className="text-[12px] font-semibold text-[#2E2E2E]">Delete Account</p>
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

        <div className="px-6 py-6">
          <p className="text-[14px] font-semibold text-[#2E2E2E]">
            Tell us why you’re leaving
          </p>
          <p className="mt-1 text-[12px] text-[#5F6368]">
            This helps us improve your experience.
          </p>

          {error ? (
            <div className="mt-4 rounded-[10px] border border-[#F2C6C6] bg-[#FFF5F5] px-4 py-3 text-[12px] text-[#D32F2F]">
              {error}
            </div>
          ) : null}

          <div className="mt-4">
            <label className="block text-[12px] font-medium text-[#2E2E2E]">
              Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-2 w-full h-[44px] rounded-[10px] border border-[#E9E9E9] bg-white px-4 text-[14px] text-[#2E2E2E] outline-none focus:border-[#89E081]"
            >
              <option value="">Select a reason</option>
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <label className="block text-[12px] font-medium text-[#2E2E2E]">
              Additional comment (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="mt-2 w-full resize-none rounded-[10px] border border-[#E9E9E9] bg-white px-4 py-3 text-[14px] text-[#2E2E2E] outline-none focus:border-[#89E081]"
              placeholder="Tell us more..."
            />
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-[10px] border border-[#EEEEEE] bg-[#FAFAFA] px-4 py-3">
            <IconCheckbox checked={disableInstead} onChange={setDisableInstead} />
            <div>
              <p className="text-[12px] font-semibold text-[#2E2E2E]">
                Disable account instead
              </p>
              <p className="mt-0.5 text-[12px] text-[#5F6368]">
                You can temporarily disable your account and come back later.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <Button.MdSecondary
              label="Cancel"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="h-[54px] rounded-[10px] text-[14px] font-semibold"
            />
            <Button.MdPrimary
              label={actionLabel}
              loading={loading ? "Please wait" : undefined}
              disabled={loading}
              onClick={async () => {
                try {
                  setError(null);
                  if (!reason.trim()) {
                    setError("Select a reason to continue.");
                    return;
                  }
                  setLoading(true);
                  await onSubmit?.({ reason, comment, disableInstead });
                  setOpen(false);
                } catch (e) {
                  if (e instanceof Error) setError(e.message);
                  else setError("Unable to proceed. Please try again.");
                } finally {
                  setLoading(false);
                }
              }}
              className={`h-[54px] rounded-[10px] text-[14px] font-semibold ${
                disableInstead ? "" : "bg-[#EB001B] hover:bg-[#C80016]"
              }`}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

