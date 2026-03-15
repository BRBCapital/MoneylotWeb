"use client";

import Image from "next/image";
import React from "react";
import { imagesAndIcons } from "@/constants/imagesAndIcons";

export default function IconCheckbox({
  checked,
  onChange,
  className = "",
  size = 16,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  className?: string;
  size?: number;
  disabled?: boolean;
}) {
  const toggle = () => {
    if (disabled) return;
    onChange(!checked);
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-disabled={disabled}
      onClick={toggle}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      }}
      className={`shrink-0 rounded bg-white outline-none focus-visible:ring-2 focus-visible:ring-[#89E081] focus-visible:ring-offset-2 ${
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
      } ${className}`}
      style={{ width: size, height: size }}
    >
      {checked ? (
        <span className="flex h-full w-full items-center justify-center">
          <Image
            src={imagesAndIcons.checkedIcon}
            alt=""
            width={size}
            height={size}
            className="h-full w-full"
          />
        </span>
      ) : null}
    </button>
  );
}

