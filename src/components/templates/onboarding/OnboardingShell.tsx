import Image from "next/image";
import React from "react";
import { imagesAndIcons } from "@/constants/imagesAndIcons";
import StageDots from "@/components/molecules/onboarding/StageDots";
import KycStatusPoller from "@/components/auth/KycStatusPoller";

export default function OnboardingShell({
  children,
  stage = 1,
  totalStages = 4,
  showProgress = true,
  pageBgClassName = "bg-white",
}: {
  children: React.ReactNode;
  stage?: number;
  totalStages?: number;
  showProgress?: boolean;
  pageBgClassName?: string;
}) {
  return (
    <div className={`scale-small-text min-h-screen ${pageBgClassName} overflow-hidden`}>
      <KycStatusPoller />
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="w-full bg-white">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5 lg:px-8">
            <Image
              src={imagesAndIcons.moneylotIconOne}
              alt="Moneylot"
              width={140}
              height={44}
              priority
              className="h-auto w-[120px] sm:w-[140px]"
            />
            {showProgress ? (
              <StageDots total={totalStages} current={stage} />
            ) : (
              <div />
            )}
          </div>
          <div className="h-px w-full bg-[#EEEEEE]" />
        </header>

        {/* Content */}
        <main className="flex flex-1 items-center justify-center overflow-x-hidden overflow-y-auto px-3 py-4 sm:px-4 sm:py-6">
          <div className="w-full max-w-[760px]">{children}</div>
        </main>

        {/* Footer */}
        <footer className="min-h-[70px] w-full bg-[#1B332D] py-3">
          <div className="mx-auto flex h-full w-full max-w-[1440px] flex-col items-center justify-center gap-2 px-4 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left lg:px-8">
            <div className="flex items-center">
              <Image
                src={imagesAndIcons.moneylotIconDarkBackground}
                alt="Moneylot"
                width={96}
                height={30}
                className="h-auto w-[88px] sm:w-[96px]"
              />
            </div>
            <p className="text-[10px] text-white/90 sm:text-[11px]">
              © 2026 BRB Capital Limited.
            </p>
            <div className="hidden w-0 sm:block sm:w-1/3" aria-hidden />
          </div>
        </footer>
      </div>
    </div>
  );
}

