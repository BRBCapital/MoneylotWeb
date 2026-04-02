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
          <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-8 py-5">
            <Image
              src={imagesAndIcons.moneylotIconOne}
              alt="Moneylot"
              width={140}
              height={44}
              priority
              className="h-auto w-[140px]"
            />
            {showProgress ? <StageDots total={totalStages} current={stage} /> : <div />}
          </div>
          <div className="h-px w-full bg-[#EEEEEE]" />
        </header>

        {/* Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-6 overflow-hidden">
          <div className="w-full max-w-[760px]">{children}</div>
        </main>

        {/* Footer */}
        <footer className="h-[70px] w-full bg-[#1B332D]">
          <div className="mx-auto flex h-full w-full max-w-[1440px] items-center px-8">
            <div className="flex w-1/3 items-center">
              <Image
                src={imagesAndIcons.moneylotIconDarkBackground}
                alt="Moneylot"
                width={96}
                height={30}
                className="h-auto w-[96px]"
              />
            </div>
            <div className="flex w-1/3 items-center justify-center text-[11px] text-white/90">
              © 2026 BRB Capital Limited.
            </div>
            <div className="w-1/3" />
          </div>
        </footer>
      </div>
    </div>
  );
}

