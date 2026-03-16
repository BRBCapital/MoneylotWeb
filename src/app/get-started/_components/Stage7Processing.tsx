"use client";

import React from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { imagesAndIcons } from "@/constants/imagesAndIcons";

export default function Stage7Processing({
  onGoDashboard,
}: {
  onGoDashboard: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-[640px]">
      <div className="rounded-[10px] border border-black/10 bg-white px-6 py-10 text-center">
        <div className="mx-auto flex justify-center">
          <Image
            src={imagesAndIcons.successfulIcon}
            alt="Success"
            width={64}
            height={64}
          />
        </div>

        <h2 className="mt-6 text-[18px] font-semibold text-[#2E2E2E]">
          Your Investment Is Being Processed
        </h2>
        <p className="mt-2 text-[12px] text-[#5F6368]">
          Our team is reviewing your investment. An email confirmation will be
          sent to you shortly.
        </p>

        <div className="mt-6 flex justify-center">
          <Button.MdPrimary
            label="Go to Dashboard"
            fullWidth={false}
            onClick={onGoDashboard}
            className="flex h-[46px] w-[320px] items-center justify-center rounded-[10px] py-0 text-[14px] leading-none"
          />
        </div>

        <p className="mt-4 text-[11px] text-[#5F6368]">
          Need help? Contact support{" "}
          <button
            type="button"
            onClick={() => {}}
            className="font-medium text-[#89E081] hover:opacity-80"
          >
            hello@moneylot.com
          </button>
        </p>
      </div>
    </div>
  );
}

