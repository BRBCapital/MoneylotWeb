"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import DashboardShell from "@/components/templates/dashboard/DashboardShell";
import Button from "@/components/ui/Button";
import AddBankAccountModal from "@/components/modals/AddBankAccountModal";
import Pills from "@/components/ui/Pills";
import {
  getPersonalDetail,
  PersonalDetailDto,
} from "@/services/accountManagement";
import { ApiError } from "@/lib/apiClient";
import { isAbortError } from "@/lib/isAbortError";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import {
  deleteWithdrawalAccount,
  getWithdrawalAccounts,
  updateWithdrawalAccount,
} from "@/services/withdrawal";
import { showErrorToast, showSuccessToast } from "@/state/toastState";
import BankAccountModal, {
  BankAccountModalData,
} from "@/components/modals/BankAccountModal";
import { API_BASE_URL } from "@/lib/apiClient";
import { verifyNinOnly } from "@/services/verification";

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="w-full">
      <label className="block text-[14px] font-medium text-[#5F6368]">
        {label}
      </label>
      <div className="mt-2 h-[42px] w-full rounded-[8px] border border-[#EEEEEE] bg-[#F3F3F3] px-4 flex items-center text-[14px] text-[#2E2E2E]">
        {value}
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="w-full">
      <label className="block text-[14px] font-medium text-[#5F6368]">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 h-[42px] w-full rounded-[8px] border border-[#EEEEEE] bg-white px-4 text-[12px] text-[#2E2E2E] outline-none focus:border-[#89E081]"
      />
    </div>
  );
}

function BankAvatar({ text, bg }: { text: string; bg: string }) {
  return (
    <div
      className="h-10 w-10 rounded-full flex items-center justify-center text-white text-[10px] font-semibold"
      style={{ backgroundColor: bg }}
    >
      {text}
    </div>
  );
}

function BankLogo({
  src,
  alt,
  fallbackText,
  fallbackBg,
}: {
  src: string;
  alt: string;
  fallbackText: string;
  fallbackBg: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <BankAvatar text={fallbackText} bg={fallbackBg} />;
  return (
    <div className="h-10 w-10 rounded-full overflow-hidden border border-black/10 bg-white shrink-0 flex items-center justify-center">
      <Image
        src={src}
        alt={alt}
        width={40}
        height={40}
        unoptimized
        className="h-10 w-10 object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function maskAccountNumber(x: string) {
  const s = String(x || "").trim();
  if (!s) return "";
  const last4 = s.slice(-4);
  return `***${last4}`;
}

function initialsFromBankName(x: string) {
  const s = String(x || "").trim();
  if (!s) return "BNK";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "B";
  const b = parts[1]?.[0] || parts[0]?.[1] || "N";
  const c = parts[2]?.[0] || parts[0]?.[2] || "K";
  return `${a}${b}${c}`.toUpperCase();
}

const BANK_COLOR_PALETTE = [
  "#E6532C",
  "#4C1D95",
  "#0EA5E9",
  "#16A34A",
  "#D97706",
  "#DC2626",
] as const;

export default function ProfilePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [email, setEmail] = useState("");
  const [bvn, setBvn] = useState("");
  const [nin, setNin] = useState("");
  const [ninError, setNinError] = useState<string | null>(null);
  const [ninSaving, setNinSaving] = useState(false);
  const [ninLocked, setNinLocked] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);
  const [withdrawalAccounts, setWithdrawalAccounts] = useState<any[]>([]);
  const [bankActionLoading, setBankActionLoading] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const ac = new AbortController();
    (async () => {
      try {
        if (mounted) {
          setError(null);
          setLoading(true);
        }
        const res = await getPersonalDetail(ac.signal);
        console.log("[Profile] get-personal-detail response:", res);
        if (!res?.status) {
          throw new Error(res?.message || "Unable to load personal details");
        }

        const root = res.data as any;
        const data: PersonalDetailDto =
          root &&
          typeof root === "object" &&
          root.data &&
          typeof root.data === "object"
            ? (root.data as any)
            : (root as any);

        const fn = typeof data?.firstName === "string" ? data.firstName : "";
        const ln = typeof data?.lastName === "string" ? data.lastName : "";
        const ph =
          typeof data?.phoneNumber === "string" ? data.phoneNumber : "";
        const em =
          typeof data?.emailAddress === "string" ? data.emailAddress : "";
        const bv = typeof data?.bvn === "string" ? data.bvn : "";
        const ni = typeof data?.nin === "string" ? data.nin : "";

        if (mounted) {
          setFirstName(fn);
          setLastName(ln);
          setPhoneDisplay(ph);
          setEmail(em);
          setBvn(bv);
          setNin(ni);
          setNinLocked(Boolean((ni || "").trim()));
        }
      } catch (e) {
        if (isAbortError(e)) return;
        if (e instanceof ApiError) setError(e.message);
        else if (e instanceof Error) setError(e.message);
        else setError("Unable to load personal details");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
      ac.abort();
    };
  }, []);

  function validateNin(ninRaw: string): string | null {
    const v = (ninRaw || "").trim();
    if (!v) return "Enter your NIN";
    if (/[^0-9]/.test(v)) return "NIN must contain only digits";
    if (v.length !== 11) return "NIN must be 11 digits";
    return null;
  }

  async function refreshWithdrawalList() {
    const ac = new AbortController();
    try {
      const res = await getWithdrawalAccounts(ac.signal);
      const list = (res as any)?.data;
      setWithdrawalAccounts(Array.isArray(list) ? list : []);
    } finally {
      ac.abort();
    }
  }

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setBankError(null);
        setBankLoading(true);
        const res = await getWithdrawalAccounts(ac.signal);
        console.log("[Profile] withdrawal/get response:", res);
        const list = (res as any)?.data;
        if (Array.isArray(list)) setWithdrawalAccounts(list);
        else setWithdrawalAccounts([]);
      } catch (e) {
        if (isAbortError(e)) return;
        setWithdrawalAccounts([]);
        const msg =
          e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Unable to load bank accounts";
        setBankError(msg);
        console.error("[Profile] withdrawal/get error:", e);
      } finally {
        setBankLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  const bankCards = useMemo(() => {
    return (withdrawalAccounts || []).map((x: any, idx: number) => {
      const bankName = typeof x?.bankName === "string" ? x.bankName : "";
      const bankCode = typeof x?.bankCode === "string" ? x.bankCode : "";
      const accountNumber =
        typeof x?.accountNumber === "string" ? x.accountNumber : "";
      const logoRaw = typeof x?.logo === "string" ? x.logo : "";
      const logo =
        logoRaw && !logoRaw.startsWith("http")
          ? `${API_BASE_URL.replace(/\/$/, "")}/logo/${logoRaw.replace(/^\/+/, "")}`
          : logoRaw;
      // v2: `default` indicates active/default account
      const isDefault = Boolean(x?.default ?? x?.isDefault ?? x?.isActive);
      const active = isDefault;
      const hash = (bankCode || `${idx}`)
        .split("")
        .reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
      const bg = BANK_COLOR_PALETTE[Math.abs(hash) % BANK_COLOR_PALETTE.length];
      return {
        id:
          typeof x?.id === "number" || typeof x?.id === "string"
            ? String(x.id)
            : `${idx}`,
        bankName,
        bankCode,
        accountNumber,
        masked: maskAccountNumber(accountNumber),
        logo,
        active,
        isDefault,
        avatarText: initialsFromBankName(bankName),
        bg,
      };
    });
  }, [withdrawalAccounts]);

  const selectedBank = useMemo<BankAccountModalData | null>(() => {
    const id = selectedBankId;
    if (!id) return null;
    const raw =
      (withdrawalAccounts || []).find((x: any) => String(x?.id) === id) ?? null;
    if (!raw || typeof raw !== "object") return null;

    const bankName =
      typeof (raw as any).bankName === "string" ? (raw as any).bankName : "";
    const bankCode =
      typeof (raw as any).bankCode === "string" ? (raw as any).bankCode : "";
    const accountNumber =
      typeof (raw as any).accountNumber === "string"
        ? (raw as any).accountNumber
        : "";
    const accountName =
      typeof (raw as any).accountName === "string"
        ? (raw as any).accountName
        : typeof (raw as any).account_name === "string"
          ? (raw as any).account_name
          : "";
    const logoRaw =
      typeof (raw as any).logo === "string" ? (raw as any).logo : "";
    const logo =
      logoRaw && !logoRaw.startsWith("http")
        ? `${API_BASE_URL.replace(/\/$/, "")}/logo/${logoRaw.replace(/^\/+/, "")}`
        : logoRaw;
    // v2: `default` indicates active/default account
    const isDefault = Boolean(
      (raw as any).default ?? (raw as any).isDefault ?? (raw as any).isActive,
    );
    const active = isDefault;
    const createdAt =
      typeof (raw as any).createdAt === "string"
        ? (raw as any).createdAt
        : null;

    // Reuse the computed card avatar styles (fallback-safe)
    const card = bankCards.find((b) => b.id === id);

    return {
      id,
      bankName,
      bankCode,
      logo,
      avatarText: card?.avatarText || initialsFromBankName(bankName),
      avatarBg: card?.bg || BANK_COLOR_PALETTE[0],
      accountNumber,
      accountName,
      active,
      isDefault,
      createdAt,
    };
  }, [bankCards, selectedBankId, withdrawalAccounts]);

  return (
    <DashboardShell>
      <div className="w-full max-w-[884px]">
        <div className="relative">
          <LoadingOverlay
            show={loading || bankLoading || bankActionLoading || ninSaving}
            label={ninSaving ? "Verifying NIN..." : "Loading details..."}
          />
        </div>
        <h1 className="text-[18px] font-semibold text-[#2E2E2E]">My Account</h1>
        <p className="mt-1 text-[14px] text-[#5F6368]">
          Your registered account information
        </p>

        {/* Personal Details */}
        <div className="mt-5 rounded-[10px] border border-black/10 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 text-[15px] font-bold text-[#2E2E2E]">
            Personal Details
          </div>
          <div className="h-px w-full bg-[#EEEEEE]" />

          <div className="px-6 py-6">
            {error ? (
              <div className="mb-4 rounded-[10px] border border-[#F2C6C6] bg-[#FFF5F5] px-4 py-3 text-[12px] text-[#D32F2F]">
                {error}
              </div>
            ) : null}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ReadOnlyField
                label="First Name"
                value={loading ? "Loading..." : firstName || "-"}
              />
              <ReadOnlyField
                label="Last Name"
                value={loading ? "Loading..." : lastName || "-"}
              />
              <ReadOnlyField
                label="Phone Number"
                value={loading ? "Loading..." : phoneDisplay || "-"}
              />
              <ReadOnlyField
                label="Email Address"
                value={loading ? "Loading..." : email || "-"}
              />
              <ReadOnlyField
                label="BVN (Bank Verification Number)"
                value={loading ? "Loading..." : bvn || "-"}
              />
              <div className="w-full">
                <label className="block text-[14px] font-medium text-[#5F6368]">
                  National Identity Number (NIN)
                </label>
                <input
                  value={nin}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={11}
                  disabled={ninLocked}
                  onChange={(e) => {
                    setNin(e.target.value);
                    setNinError(null);
                  }}
                  placeholder="Enter NIN"
                  className={`mt-2 h-[42px] w-full rounded-[8px] border border-[#EEEEEE] px-4 text-[12px] text-[#2E2E2E] outline-none focus:border-[#89E081] ${
                    ninLocked ? "bg-[#F3F3F3] text-[#5F6368]" : "bg-white"
                  }`}
                />
                {ninError ? (
                  <p className="mt-1 text-[12px] text-[#D32F2F]">{ninError}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button.SmPrimary
                label="Save Update"
                height={40}
                width={140}
                fontSize="text-[14px]"
                className="rounded-[8px] font-medium"
                disabled={
                  loading ||
                  bankLoading ||
                  bankActionLoading ||
                  ninSaving ||
                  ninLocked
                }
                onClick={async () => {
                  const msg = validateNin(nin);
                  if (msg) {
                    setNinError(msg);
                    showErrorToast("Error", msg);
                    return;
                  }
                  try {
                    setNinError(null);
                    setNinSaving(true);
                    const res = await verifyNinOnly({ nin });
                    console.log(
                      "[Profile] verification/verify-NIN response:",
                      res,
                    );
                    showSuccessToast(
                      "Success",
                      (res?.message as any) || "NIN verified successfully",
                    );
                  } catch (err) {
                    const msg =
                      err instanceof ApiError
                        ? err.message
                        : err instanceof Error
                          ? err.message
                          : "Unable to verify NIN. Please try again.";
                    setNinError(msg);
                    showErrorToast("Error", msg);
                  } finally {
                    setNinSaving(false);
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="mt-5 rounded-[10px] border border-black/10 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="text-[15px] font-bold text-[#2E2E2E]">
              Bank Details
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="text-[14px] font-medium text-[#89E081] hover:opacity-80"
            >
              Add New Account
            </button>
          </div>
          <div className="h-px w-full bg-[#EEEEEE]" />

          <div className="px-6 py-4 space-y-3">
            {bankError ? (
              <div className="rounded-[10px] border border-[#F2C6C6] bg-[#FFF5F5] px-4 py-3 text-[12px] text-[#D32F2F]">
                {bankError}
              </div>
            ) : null}

            {!bankLoading && bankCards.length === 0 ? (
              <div className="py-8 text-center text-[12px] text-[#5F6368]">
                No bank accounts yet.
              </div>
            ) : null}

            {bankCards.map((b) => (
              <button
                type="button"
                key={b.id}
                onClick={() => {
                  setSelectedBankId(b.id);
                  setBankModalOpen(true);
                }}
                className="w-full text-left rounded-[10px] border border-[#EEEEEE] bg-white px-4 py-4 hover:bg-[#FAFAFA] transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <BankLogo
                      src={b.logo}
                      alt={b.bankName || "Bank"}
                      fallbackText={b.avatarText}
                      fallbackBg={b.bg}
                    />
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-[#2E2E2E] truncate">
                        {b.bankName || "-"}
                      </p>
                      <p className="mt-0.5 text-[14px] text-[#5F6368]">
                        {b.masked || "-"}
                        {b.isDefault ? (
                          <span className="ml-2 text-[#2E2E2E] font-medium">
                            • Default
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </div>

                  {b.active ? <Pills type="active" text="Active" /> : null}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <BankAccountModal
        open={bankModalOpen}
        setOpen={setBankModalOpen}
        bank={selectedBank}
        onToggleDefault={async (next) => {
          const selId = selectedBankId;
          if (!selId) return;
          // "Default" is a single-select. We only allow setting to true.
          if (!next) return;
          try {
            setBankActionLoading(true);
            // API toggles/updates default status by id
            const res = await updateWithdrawalAccount(selId);
            console.log("[Profile] withdrawal/update response:", res);
            showSuccessToast("Success", res?.message || "Bank account updated");
            await refreshWithdrawalList();
            // if user turned off default, keep modal open but reflect server state
          } catch (e) {
            if (e instanceof ApiError) setBankError(e.message);
            else if (e instanceof Error) setBankError(e.message);
            else setBankError("Unable to update bank account.");
          } finally {
            setBankActionLoading(false);
          }
        }}
        onDelete={async () => {
          const selId = selectedBankId;
          if (!selId) return;
          const isDefault = (withdrawalAccounts || []).some(
            (x: any) =>
              String(x?.id) === selId &&
              Boolean(x?.default ?? x?.isDefault ?? x?.isActive),
          );
          if (isDefault) return;
          try {
            setBankActionLoading(true);
            const res = await deleteWithdrawalAccount(selId);
            console.log("[Profile] withdrawal/delete response:", res);
            showSuccessToast("Success", res?.message || "Bank account deleted");
            await refreshWithdrawalList();
            setBankModalOpen(false);
            setSelectedBankId(null);
          } catch (e) {
            if (e instanceof ApiError) setBankError(e.message);
            else if (e instanceof Error) setBankError(e.message);
            else setBankError("Unable to delete bank account.");
          } finally {
            setBankActionLoading(false);
          }
        }}
      />

      <AddBankAccountModal
        open={modalOpen}
        setOpen={setModalOpen}
        onProceed={(payload) => {
          console.log("[Profile] bank account added:", payload);
          setWithdrawalAccounts((prev) => [
            ...(Array.isArray(prev) ? prev : []),
            {
              id: `new_${Date.now()}`,
              bankCode: payload.bankCode,
              bankName: payload.bankName,
              accountNumber: payload.accountNumber,
              accountName: payload.accountName,
              isActive: false,
              default: false,
              isDefault: false,
              active: false,
            },
          ]);
        }}
      />
    </DashboardShell>
  );
}
