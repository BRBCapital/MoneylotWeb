import React from "react";

export type TenorOption = {
  days: number;
  rateLabel: string; // e.g. "17.50% p.a"
};

export default function TenorCard({
  option,
  selected,
  onSelect,
}: {
  option: TenorOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-[10px] border px-4 py-4 text-left transition-colors ${
        selected
          ? "border-[#89E081] bg-white shadow-[0_8px_18px_rgba(0,0,0,0.08)]"
          : "border-black/10 bg-white hover:border-[#89E081]/60"
      }`}
    >
      <div className="text-center">
        <div className="text-[16px] font-semibold text-[#89E081]">
          {option.days}
        </div>
        <div className="text-[11px] text-[#5F6368]">Days</div>
        <div className="mt-2 text-[11px] font-medium text-[#2E2E2E]">
          {option.rateLabel}
        </div>
      </div>
    </button>
  );
}

