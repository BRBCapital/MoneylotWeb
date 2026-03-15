import React from "react";

export default function BackPillButton({
  onClick,
  label = "Back",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-[8px] border border-black/10 bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#2E2E2E] shadow-[0_1px_0_rgba(0,0,0,0.06)] hover:opacity-90"
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path
          d="M10 3.5L6 8L10 12.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </button>
  );
}

