import type { AuthSession } from "@/state/appState";

export type SetupRoute = {
  isComplete: boolean;
  stage: 1 | 2 | 3 | 4;
  openOtp: boolean;
  openPin: boolean;
  href: string;
};

function toBool(v: unknown) {
  return v === true;
}

export function resolveSetupRoute(session: AuthSession | null): SetupRoute {
  const s: any = session || {};
  const hasAnyStageFlag =
    "stage1" in s ||
    "stage1_5" in s ||
    "stage2" in s ||
    "stage3" in s ||
    "stage3_5" in s ||
    "stage4" in s ||
    "emailVerified" in s ||
    "hasPin" in s;

  const stage1 = toBool(s.stage1);
  const stage1_5 = toBool(s.stage1_5) || toBool(s.emailVerified);
  const stage2 = toBool(s.stage2);
  const stage3 = toBool(s.stage3);
  const stage3_5 = toBool(s.stage3_5) || toBool(s.hasPin);
  const stage4 = toBool(s.stage4);

  const isComplete = !hasAnyStageFlag ? true : stage4 === true;

  let stage: SetupRoute["stage"] = 1;
  let openOtp = false;
  let openPin = false;

  if (!stage1) {
    stage = 1;
  } else if (!stage1_5) {
    stage = 1;
    openOtp = true;
  } else if (!stage2) {
    stage = 2;
  } else if (!stage3) {
    stage = 3;
  } else if (!stage3_5) {
    stage = 3;
    openPin = true;
  } else {
    stage = 4;
  }

  const qs = new URLSearchParams();
  qs.set("stage", String(stage));
  if (openOtp) qs.set("openOtp", "1");
  if (openPin) qs.set("openPin", "1");

  return {
    isComplete,
    stage,
    openOtp,
    openPin,
    href: `/get-started?${qs.toString()}`,
  };
}

