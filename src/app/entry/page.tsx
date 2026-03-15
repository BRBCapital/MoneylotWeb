"use client";

import AuthCard from "@/components/organisms/auth/AuthCard";
import AuthShell from "@/components/templates/auth/AuthShell";
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { secureRemove } from "@/lib/secureStorage";

export default function EntryPage() {
  const router = useRouter();
  const GET_STARTED_PERSIST_KEY = "moneylot_get_started_flow_v1";
  return (
    <AuthShell
      logo="moneylotIconOne"
      stackClassName="-translate-y-[15%]"
      footerCopyrightClassName="text-[#979797]"
      footerCopyrightSpacingClassName="mt-2"
      scaleSmallText={false}
    >
      <AuthCard className="max-w-[640px] px-[30px] py-12">
        <div className="text-center">
          <h1 className="text-[30px] leading-[36px] font-semibold text-[#2E2E2E]">
            Grow Your Wealth With{" "}
            <span className="text-[#89E081]">Confidence</span>
          </h1>
          <p className="mt-3 text-[17px] leading-[26px] text-[#7A7A7A]">
            Clear rates. Guaranteed returns. Your funds, always protected.
          </p>
        </div>

        <div className="mt-[72px]">
          <Button.MdPrimary
            fullWidth
            label="Begin Your Investment Journey"
            className="h-[50px] rounded-[10px] text-[14px]"
            onClick={() => {
              // Always start onboarding fresh from Entry.
              void secureRemove(GET_STARTED_PERSIST_KEY);
              router.push("/get-started");
            }}
          />
        </div>
      </AuthCard>
    </AuthShell>
  );
}

