import React from "react";

export default function OnboardingCard({
  stepLine,
  title,
  children,
  footer,
  contentClassName = "",
  contentTopClassName = "mt-4",
  contentWrapClassName = "",
}: {
  stepLine: React.ReactNode;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  contentClassName?: string;
  contentTopClassName?: string;
  contentWrapClassName?: string;
}) {
  return (
    <div className="mx-auto mt-4 w-full max-w-[640px] rounded-[10px] border border-black/10 bg-white">
      <div className="border-b border-[#EEEEEE] px-5 py-4">{stepLine}</div>

      <div className="px-5 py-5">
        <h2 className="text-[19px] font-medium text-[#2E2E2E]">{title}</h2>

        <div
          className={`${contentTopClassName} min-h-[320px] flex flex-col ${contentWrapClassName}`}
        >
          <div className={`flex-1 ${contentClassName}`}>{children}</div>
          {footer ? <div className="mt-5">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}

