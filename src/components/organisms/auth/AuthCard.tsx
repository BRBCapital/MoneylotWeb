import React from "react";

export default function AuthCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`w-full max-w-[520px] rounded-[16px] border border-black/10 bg-white shadow-[0_6px_18px_rgba(0,0,0,0.05)] ${className}`}
    >
      {children}
    </div>
  );
}

