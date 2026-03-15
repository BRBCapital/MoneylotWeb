import React from "react";

export default function Spinner({
  size = 28,
  className = "",
  label = "Loading",
}: {
  size?: number;
  className?: string;
  label?: string;
}) {
  const s = Math.max(12, size);
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span
        aria-hidden="true"
        className="animate-spin rounded-full border-2 border-[#89E081] border-t-transparent"
        style={{ width: s, height: s }}
      />
      {label ? (
        <span className="text-[12px] text-[#5F6368]">{label}</span>
      ) : null}
    </div>
  );
}

