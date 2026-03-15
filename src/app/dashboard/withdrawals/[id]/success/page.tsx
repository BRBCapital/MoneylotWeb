"use client";

import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import OnboardingShell from "@/components/templates/onboarding/OnboardingShell";
import Button from "@/components/ui/Button";
import { imagesAndIcons } from "@/constants/imagesAndIcons";
import { loadWithdrawalRequest, clearWithdrawalRequest } from "@/lib/withdrawalStorage";
import { useEffect, useMemo } from "react";

export default function WithdrawalSuccessPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const status = (searchParams.get("status") || "active").toLowerCase();
  const early = status === "matured" ? false : (searchParams.get("early") === "1" || status !== "matured");
  const isMatured = status === "matured" && !early;

  const apiData = useMemo(() => loadWithdrawalRequest(params.id), [params.id]);
  const amountText = apiData?.investmentAmountFormatted || `₦${searchParams.get("amount") || "0"}`;

  useEffect(() => {
    // cleanup after showing success
    clearWithdrawalRequest(params.id);
  }, [params.id]);

  return (
    <OnboardingShell stage={4} totalStages={4} showProgress={false}>
      <div className="w-full">
        <div className="rounded-[8px] border border-black/10 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-12 text-center">
            <Image
              src={imagesAndIcons.successfulIcon}
              alt="Success"
              width={60}
              height={60}
              className="mx-auto h-[60px] w-[60px]"
            />

            <h1 className="mt-6 text-[16px] font-semibold text-[#2E2E2E]">
              {isMatured ? "Withdrawal Confirmed" : "Withdrawal Request Submitted"}
            </h1>
            <p className="mx-auto mt-1 max-w-[420px] text-[11px] text-[#5F6368]">
              {isMatured
                ? "Your withdrawal request is being processed. Funds will be credited to your account shortly"
                : `Your withdrawal request for ${amountText} has been received and is being processed.`}
            </p>

            <div className="mt-6 flex justify-center">
              <Button.SmPrimary
                label="Close"
                height={40}
                width={280}
                fontSize="text-[12px]"
                className="rounded-[8px] font-medium"
                onClick={() => router.push("/dashboard")}
              />
            </div>
          </div>
        </div>
      </div>
    </OnboardingShell>
  );
}

