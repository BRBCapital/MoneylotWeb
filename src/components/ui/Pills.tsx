import React from "react";

type PillsProps = {
  text: string;
} & (
  | {
      type:
        | "success"
        | "warning"
        | "error"
        | "primary"
        | "secondary"
        | "delivered"
        | "active"
        | "inactive"
        | "matured"
        | "verified"
        | "completed"
        | "pending"
        | "failed"
        | "new"
        | "passed"
        | "paid"
        | "approved"
        | "cancelled"
        | "rejected";
      icon?: React.ReactElement<SVGElement>;
    }
  | {
      type: "primaryWithIcon" | "warningWithIcon" | "errorWithIcon";
      icon: React.ReactElement<SVGElement>;
    }
);

export default function Pills({ type, text, icon }: PillsProps) {
  const pillsClassName =
    "inline-flex items-center gap-1.5 text-xs whitespace-nowrap capitalize text-center rounded-full overflow-hidden";
  const pillsWithIconClassName =
    "text-xs px-1.5 py-[0.37rem] whitespace-nowrap capitalize text-center rounded-full overflow-hidden";

  const t = (type || "").toLowerCase() as PillsProps["type"];

  return (
    <>
      {[
        "success",
        "successful",
        "delivered",
        "verified",
        "completed",
        "active",
        "paid",
        "passed",
        "approved",
      ].includes(t) ? (
        <span
          className={`${pillsClassName} bg-[#5FCE551A] text-[#5FCE55] px-2.5 py-1 font-medium`}
        >
          <span className="w-2 h-2 bg-[#5FCE55] rounded-full" />
          {text}
        </span>
      ) : ["warning", "pending"].includes(t) ? (
        <span
          className={`${pillsClassName} text-[#F59E0B] bg-[#FEF3C7] px-2.5 py-1`}
        >
          <span className="w-2 h-2 bg-[#FDA803] rounded-full" />
          {text}
        </span>
      ) : ["failed"].includes(t) ? (
        <span
          className={`${pillsClassName} text-[#FD0303] bg-[#FD03031A] px-2.5 py-1.5`}
        >
          <span className="w-2 h-2 bg-[#FD0303] rounded-full" />
          {text}
        </span>
      ) : ["error", "failed", "cancelled", "inactive", "rejected"].includes(t) ? (
        <span
          className={`${pillsClassName} text-[#EB001B] bg-[#EB001B1A] px-2.5 py-1.5`}
        >
          <span className="w-2 h-2 bg-[#EB001B] rounded-full" />
          {text}
        </span>
      ) : ["new"].includes(t) ? (
        <span
          className={`${pillsClassName} text-[#1790DF] bg-[#1790DF1A] px-2.5 py-1`}
        >
          <span className="w-2 h-2 bg-[#1790DF] rounded-full" />
          {text}
        </span>
      ) : ["matured"].includes(t) ? (
        <span
          className={`${pillsClassName} text-[#1790DF] bg-[#1790DF1A] px-2.5 py-1 text-[13px] font-medium border border-transparent group-hover:border-[#1790DF]`}
        >
          <span className="w-2 h-2 bg-[#1790DF] rounded-full" />
          {text}
        </span>
      ) : t === "primary" ? (
        <span
          className={`${pillsClassName} text-[#1790DF] bg-[#1790DF1A] px-2.5 py-1`}
        >
          <span className="w-2 h-2 bg-[#1790DF] rounded-full" />
          {text}
        </span>
      ) : t === "secondary" ? (
        <span className={`${pillsClassName} text-[#0a7130] bg-[#ebf0f0] px-2.5 py-1`}>
          {text}
        </span>
      ) : t === "primaryWithIcon" ? (
        <span
          className={`${pillsWithIconClassName} w-[110px] flex justify-center gap-x-1 items-center text-[#008037] bg-[#E5E1F7]`}
        >
          {text}
          {icon}
        </span>
      ) : t === "warningWithIcon" ? (
        <span
          className={`${pillsWithIconClassName} flex gap-x-1 items-center text-[#008037] bg-[#FFD778]`}
        >
          {icon}
          {text}
        </span>
      ) : t === "errorWithIcon" ? (
        <span
          className={`${pillsWithIconClassName} flex gap-x-1 items-center text-[#008037] bg-[#FFBABA]`}
        >
          {icon}
          {text}
        </span>
      ) : (
        <span
          className={`${pillsClassName} text-[#313131] bg-[#ebf0f0c2] border border-[#ebf0f0] px-2 py-1.5`}
        >
          {text}
        </span>
      )}
    </>
  );
}

