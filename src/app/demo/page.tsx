"use client";

import { useMemo, useState } from "react";
import Table3, { Table3Props } from "@/components/table/Table3";
import FilterModal, { FilterPayload } from "@/components/modals/FilterModal";
import OtpModal from "@/components/modals/OtpModal";
import Button from "@/components/ui/Button";

export default function DemoPage() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterPayload>({});

  const table: Pick<Table3Props, "headers" | "data" | "pagination"> = useMemo(
    () => ({
      headers: [
        { text: "Investment Type", type: "text", minWidth: "240px" },
        { text: "Amount", type: "text" },
        { text: "Rate", type: "text" },
        { text: "Status", type: "pills" },
        { text: "Maturity Date", type: "text", minWidth: "200px" },
      ],
      data: [
        {
          data: ["Treasury Bills · 90 Days", "₦1,000,000", "17.50%", "Matured", "24 Jun, 2024 | 5:24 PM"],
        },
        {
          data: ["Treasury Bills · 90 Days", "₦5,000,000", "17.50%", "Active", "14 Jun, 2024 | 5:24 PM"],
        },
        {
          data: ["Fixed Deposit · 180 Days", "₦3,500,000", "14.00%", "Active", "24 Jun, 2024 | 5:24 PM"],
        },
        {
          data: ["Treasury Bills · 360 Days", "₦1,000,000", "17.50%", "Inactive", "24 Jun, 2024 | 5:24 PM"],
        },
      ],
      pagination: { type: "sychronous", limit: 8 },
    }),
    []
  );

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">
              Moneylot Components Demo
            </h1>
            <p className="text-sm text-zinc-600">
              Ported from <span className="font-medium">moneylot-portal-v1</span>:
              Table3, Filter modal, OTP modal.
            </p>
          </div>
          <div className="flex gap-2">
            <Button.SmSecondary label="Open OTP Modal" onClick={() => setOtpOpen(true)} />
            <Button.SmPrimary label="Open Filter" onClick={() => setFilterOpen(true)} />
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-white p-5 border border-zinc-200">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">My Investments</h2>
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="text-xs rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-50"
            >
              Filter
            </button>
          </div>

          <div className="mt-4">
            <Table3 headers={table.headers} data={table.data} pagination={table.pagination} />
          </div>
        </div>
      </div>

      <FilterModal
        open={filterOpen}
        setOpen={setFilterOpen}
        initial={activeFilter}
        onReset={() => setActiveFilter({})}
        onApply={(payload) => setActiveFilter(payload)}
      />

      <OtpModal
        open={otpOpen}
        setOpen={setOtpOpen}
        email="sonma@gmail.com"
        confirmLabel="Verify"
        onConfirm={(otp) => {
          // eslint-disable-next-line no-alert
          alert(`OTP entered: ${otp}`);
          setOtpOpen(false);
        }}
      />
    </div>
  );
}

