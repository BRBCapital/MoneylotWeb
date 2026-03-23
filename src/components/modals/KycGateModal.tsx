"use client";

import React from "react";
import Image from "next/image";
import Modal from "@/components/ui/Modal";
import { imagesAndIcons } from "@/constants/imagesAndIcons";

export type KycGateVariant = "required" | "rejected";

export default function KycGateModal({
  open,
  setOpen,
  variant = "required",
  onVerifyIdentity,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  variant?: KycGateVariant;
  onVerifyIdentity: () => void | Promise<void>;
}) {
  if (!open) return null;

  const heading = "Verification Required";
  const title = "Account Verification";
  const subtitle =
    variant === "rejected"
      ? "Your KYC verification was rejected. Please resubmit your documents to proceed"
      : "Complete your KYC verification to proceed";

  return (
    <Modal open={open} setClose={setOpen} position="center" contentClassName="p-0">
      <div className="w-[92vw] max-w-[560px] rounded-[14px] bg-white p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <h3 className="text-[16px] font-semibold text-[#2E2E2E]">{heading}</h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="rounded-full p-1 hover:bg-[#F6F6F6]"
          >
            <Image
              src={imagesAndIcons.closeModal}
              alt="Close"
              width={20}
              height={20}
              className="h-5 w-5"
            />
          </button>
        </div>
        <div className="h-px w-full bg-[#EEEEEE]" />

        <div className="px-6 py-10 text-center">
          <div className="mx-auto h-[72px] w-[72px]">
            <Image
              src={imagesAndIcons.warn}
              alt="Warning"
              width={72}
              height={72}
              className="h-[72px] w-[72px]"
            />
          </div>

          <p className="mt-5 text-[18px] font-semibold text-[#2E2E2E]">
            {title}
          </p>
          <p className="mt-2 text-[14px] text-[#5F6368]">{subtitle}</p>
        </div>

        <div className="px-6 pb-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-[52px] rounded-[10px] bg-[#F2F2F2] text-[14px] font-semibold text-[#2E2E2E] hover:opacity-90"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void onVerifyIdentity()}
              className="h-[52px] rounded-[10px] bg-[#89E081] text-[14px] font-semibold text-[#1B332D] hover:opacity-90"
            >
              Verify Identity
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

