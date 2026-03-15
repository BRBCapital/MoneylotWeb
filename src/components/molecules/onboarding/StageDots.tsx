import React from "react";

export default function StageDots({
  total = 4,
  current = 1,
}: {
  total?: number;
  current?: number; // 1-indexed
}) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const active = i + 1 === current;
        return (
          <span
            key={i}
            className={`h-2.5 w-2.5 rounded-full ${
              active ? "bg-[#89E081]" : "bg-[#D9D9D9]"
            }`}
            aria-label={`Stage ${i + 1}${active ? " (current)" : ""}`}
          />
        );
      })}
    </div>
  );
}

