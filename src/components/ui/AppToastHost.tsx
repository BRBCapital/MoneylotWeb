"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useAtom } from "jotai";
import { appToastAtom, clearToast } from "@/state/toastState";
import { imagesAndIcons } from "@/constants/imagesAndIcons";

export default function AppToastHost() {
  const [toast] = useAtom(appToastAtom);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => {
      clearToast();
    }, 4200);
    return () => window.clearTimeout(t);
  }, [toast]);

  if (!toast) return null;

  const isError = toast.type === "error";
  const border = isError ? "border-[#EB001B]" : "border-[#89E081]";
  const bg = isError ? "bg-[#FFF5F5]" : "bg-[#EAF6E8]";
  const titleColor = isError ? "text-[#EB001B]" : "text-[#5FCE55]";
  const msgColor = isError ? "text-[#EB001B]" : "text-[#5FCE55]";
  const iconSrc = isError ? imagesAndIcons.warnIcon : imagesAndIcons.toastSuccessIcon;

  return (
    <div className="pointer-events-none fixed top-5 left-1/2 z-100 -translate-x-1/2 w-[min(344px,92vw)]">
      <div
        className={`pointer-events-auto flex items-start justify-between rounded-[16px] border ${border} ${bg} px-4 py-4 shadow-lg fade-in`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Image
            src={iconSrc}
            alt={isError ? "Error" : "Success"}
            width={32}
            height={32}
            className="h-8 w-8 shrink-0"
          />
          <div className="min-w-0">
            <p className={`text-[14px] leading-5 font-semibold ${titleColor}`}>
              {toast.title || (isError ? "Error" : "Success")}
            </p>
            <p className={`mt-0.5 text-[12px] leading-4 ${msgColor}`}>
              {toast.message}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => clearToast()}
          className={`ml-4 -mt-0.5 ${titleColor} hover:opacity-80 text-[18px] leading-none`}
          aria-label="Close toast"
        >
          ×
        </button>
      </div>
    </div>
  );
}

