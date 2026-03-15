"use client";

import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import OnboardingShell from "@/components/templates/onboarding/OnboardingShell";
import Button from "@/components/ui/Button";
import { imagesAndIcons } from "@/constants/imagesAndIcons";

export default function RolloverSuccessPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const amount = searchParams.get("amount") || "500,000.00";

  return (
    <OnboardingShell stage={4} totalStages={4} showProgress={false}>
      <div className="w-full">
        <div className="rounded-[8px] border border-black/10 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 text-[11px] font-medium text-[#5F6368]">
            Investment Rollover
          </div>
          <div className="h-px w-full bg-[#EEEEEE]" />

          <div className="px-6 py-10 text-center">
            <Image
              src={imagesAndIcons.successfulIcon}
              alt="Success"
              width={60}
              height={60}
              className="mx-auto h-[60px] w-[60px]"
            />

            <h1 className="mt-5 text-[14px] font-semibold text-[#2E2E2E]">
              Investment Rolled Over Successfully
            </h1>
            <p className="mt-1 text-[10px] text-[#5F6368]">
              ₦{amount} not rolled over will be credited to your bank account shortly
            </p>

            <div className="mt-6 flex justify-center">
              <Button.SmPrimary
                label="Close"
                height={40}
                width={240}
                fontSize="text-[12px]"
                className="rounded-[8px] font-medium"
                onClick={() => {
                  router.push("/dashboard");
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </OnboardingShell>
  );
}

