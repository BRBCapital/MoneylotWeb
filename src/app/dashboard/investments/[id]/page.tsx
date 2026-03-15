"use client";

import { useParams, useSearchParams } from "next/navigation";
import DashboardShell from "@/components/templates/dashboard/DashboardShell";
import InvestmentDetails, {
  InvestmentStatus,
} from "@/components/organisms/dashboard/InvestmentDetails";

export default function InvestmentDetailsPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const rawStatus = (searchParams.get("status") || "").toLowerCase();
  const status: InvestmentStatus =
    rawStatus === "matured" || rawStatus === "inactive" || rawStatus === "active"
      ? (rawStatus as InvestmentStatus)
      : "active";

  return (
    <DashboardShell>
      <InvestmentDetails investmentId={params.id} status={status} />
    </DashboardShell>
  );
}

