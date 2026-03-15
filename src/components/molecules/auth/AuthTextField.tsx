import Image from "next/image";
import React from "react";

export default function AuthTextField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  rightIcon,
  onRightIconClick,
  autoComplete,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rightIcon?: { src: string; alt: string };
  onRightIconClick?: () => void;
  autoComplete?: string;
}) {
  return (
    <div className="w-full">
      <label className="block text-[12px] font-medium text-[#4A4A4A]">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="h-[44px] w-full rounded-[8px] border border-black/10 bg-[#F3F3F3] px-3.5 pr-11 text-[14px] text-[#2E2E2E] outline-none transition-colors focus:border-[#89E081] focus:bg-white"
        />
        {rightIcon ? (
          <button
            type="button"
            onClick={onRightIconClick}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 opacity-80 hover:opacity-100"
            aria-label={rightIcon.alt}
          >
            <Image
              src={rightIcon.src}
              alt={rightIcon.alt}
              width={18}
              height={18}
            />
          </button>
        ) : null}
      </div>
    </div>
  );
}

