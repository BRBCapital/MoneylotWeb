"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { imagesAndIcons } from "@/constants/imagesAndIcons";
import { SearchableSelectField } from "@/components/molecules/forms/Field";
import {
  createWithdrawalAccount,
  getBanks,
  validateAccount,
} from "@/services/withdrawal";
import { ApiError } from "@/lib/apiClient";
import { isAbortError } from "@/lib/isAbortError";
import { showErrorToast, showSuccessToast } from "@/state/toastState";

export default function AddBankAccountModal({
  open,
  setOpen,
  onProceed,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onProceed?: (payload: {
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
  }) => void;
}) {
  const [banksLoading, setBanksLoading] = useState(false);
  const [banksError, setBanksError] = useState<string | null>(null);
  const [banks, setBanks] = useState<Array<{ bankCode: string; bankName: string }>>([]);

  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const lastResolvedKeyRef = useRef<string>("");
  const resolveSeqRef = useRef(0);

  const [resolveLoading, setResolveLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedBankName = useMemo(() => {
    const found = banks.find((b) => b.bankCode === bankCode);
    return found?.bankName || "";
  }, [banks, bankCode]);

  const bankOptions = useMemo(
    () => banks.map((b) => ({ label: b.bankName, value: b.bankCode })),
    [banks]
  );

  const canProceed =
    bankCode.trim() !== "" &&
    selectedBankName.trim() !== "" &&
    accountNumber.trim().length >= 10 &&
    accountName.trim() !== "" &&
    !submitLoading;

  useEffect(() => {
    if (!open) return;
    const ac = new AbortController();
    (async () => {
      try {
        setBanksError(null);
        setBanksLoading(true);
        const res = await getBanks(ac.signal);
        if (res?.status && Array.isArray(res.data)) {
          setBanks(res.data.map((b) => ({ bankCode: b.bankCode, bankName: b.bankName })));
        } else {
          setBanks([]);
          setBanksError(res?.message || "Unable to load banks");
        }
      } catch (e) {
        if (isAbortError(e)) return;
        const msg =
          e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Unable to load banks";
        setBanksError(msg);
        showErrorToast("Error", msg);
      } finally {
        setBanksLoading(false);
      }
    })();
    return () => ac.abort();
  }, [open]);

  useEffect(() => {
    if (!open) {
      setBanksError(null);
      setError(null);
      setBankCode("");
      setAccountNumber("");
      setAccountName("");
      setResolveLoading(false);
      setSubmitLoading(false);
      lastResolvedKeyRef.current = "";
      resolveSeqRef.current += 1;
    }
  }, [open]);

  // Auto-resolve account name when account number reaches 10 digits (onboarding-like UX).
  useEffect(() => {
    if (!open) return;
    const code = (bankCode || "").trim();
    const acct = (accountNumber || "").replace(/\D/g, "").trim();
    if (!code || acct.length !== 10) {
      setResolveLoading(false);
      lastResolvedKeyRef.current = "";
      return;
    }
    const key = `${code}:${acct}`;
    if (lastResolvedKeyRef.current === key && accountName.trim()) return;

    const seq = ++resolveSeqRef.current;
    setError(null);
    setResolveLoading(true);
    (async () => {
      try {
        const res = await validateAccount({ bankCode: code, accountNumber: acct });
        if (resolveSeqRef.current !== seq) return;
        console.log("[Profile] withdrawal/validate-account response:", res);
        const resolved = extractResolvedAccountName(res);
        if (!resolved) {
          setAccountName("");
          setError("Unable to resolve account name. Please confirm details.");
          return;
        }
        lastResolvedKeyRef.current = key;
        setAccountName(resolved);
      } catch (e) {
        if (resolveSeqRef.current !== seq) return;
        setAccountName("");
        const msg =
          e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Unable to validate account. Please try again.";
        setError(msg);
      } finally {
        if (resolveSeqRef.current === seq) setResolveLoading(false);
      }
    })();
  }, [accountName, accountNumber, bankCode, open]);

  function extractResolvedAccountName(resOrData: unknown) {
    const isRecord = (v: unknown): v is Record<string, unknown> =>
      !!v && typeof v === "object";

    if (!resOrData) return "";
    if (typeof resOrData === "string") return resOrData.trim();
    if (!isRecord(resOrData)) return "";

    // v2 validate-account can return account name in `message` with `data: null`
    const msg =
      typeof (resOrData as any).message === "string"
        ? String((resOrData as any).message).trim()
        : "";
    if (msg) return msg;

    const data = (resOrData as any).data ?? resOrData;
    if (typeof data === "string") return data.trim();
    if (!isRecord(data)) return "";

    const direct =
      typeof (data as any).accountName === "string"
        ? String((data as any).accountName).trim()
        : "";
    if (direct) return direct;

    const nested = (data as any).data;
    if (typeof nested === "string") return nested.trim();
    if (isRecord(nested)) {
      const deep = nested.data;
      if (typeof deep === "string") return deep.trim();
      const deepName = nested.accountName;
      if (typeof deepName === "string") return deepName.trim();
    }
    return "";
  }

  return (
    <Modal
      open={open}
      onClosed={() => setOpen(false)}
      setClose={setOpen}
      position="center"
      contentClassName="p-0"
    >
      <div className="w-[92vw] max-w-[560px] bg-white rounded-[16px] p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="text-[22px] font-semibold text-[#2E2E2E]">
            Add Bank Account
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center hover:opacity-80"
            aria-label="Close"
          >
            <Image src={imagesAndIcons.closeModal} alt="Close" width={22} height={22} />
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="space-y-5">
            {error ? (
              <div className="rounded-[10px] border border-[#F2C6C6] bg-[#FFF5F5] px-4 py-3 text-[12px] text-[#D32F2F]">
                {error}
              </div>
            ) : null}

            <div>
              <label className="block text-[12px] font-medium text-[#2E2E2E] mb-2">
                Bank Name
              </label>
              <SearchableSelectField
                label=" "
                placeholder={banksLoading ? "Loading banks..." : "Select bank name"}
                value={bankCode}
                onChange={(v) => {
                  setBankCode(v);
                  setAccountName("");
                  setError(null);
                }}
                options={bankOptions}
                searchPlaceholder="Search bank"
                disabled={banksLoading}
              />
              {banksError ? (
                <p className="mt-1 text-[11px] text-[#E53935]">{banksError}</p>
              ) : null}
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#2E2E2E] mb-2">
                Account Number
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => {
                  const digits = (e.target.value || "").replace(/\D/g, "").slice(0, 10);
                  setAccountNumber(digits);
                  setAccountName("");
                  setError(null);
                  lastResolvedKeyRef.current = "";
                }}
                placeholder="1234567890"
                className="h-[48px] w-full rounded-[10px] border border-[#E9E9E9] bg-white px-4 pr-[150px] text-[14px] text-[#2E2E2E] outline-none focus:border-[#89E081]"
              />
              <div className="pointer-events-none relative -mt-[48px] h-[48px] w-full">
                {resolveLoading ? (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[10px] text-[#5F6368]">
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#5F6368]/20 border-t-[#5F6368]/60" />
                    <span className="uppercase tracking-wide">Checking account</span>
                  </div>
                ) : accountName.trim() && accountNumber.trim().length === 10 ? (
                  <Image
                    src={imagesAndIcons.toastSuccessIcon}
                    alt="Resolved"
                    width={14}
                    height={14}
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-[14px] w-[14px]"
                  />
                ) : null}
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#2E2E2E] mb-2">
                Account Name (as registered)
              </label>
              <input
                type="text"
                value={accountName}
                readOnly
                className="h-[48px] w-full rounded-[10px] border border-[#E9E9E9] bg-[#F3F3F3] px-4 text-[14px] text-[#2E2E2E] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-5 pt-2">
              <Button.MdSecondary
                label="Cancel"
                onClick={() => setOpen(false)}
                disabled={submitLoading}
                className="h-[54px] rounded-[10px] text-[14px] font-semibold"
              />
              <Button.MdPrimary
                label="Proceed"
                loading={submitLoading ? "Please wait" : undefined}
                onClick={async () => {
                  setError(null);
                  const code = bankCode.trim();
                  const bank = selectedBankName.trim();
                  const acct = accountNumber.trim();
                  const name = accountName.trim();
                  if (!code || !bank) return setError("Select a bank first");
                  if (!acct || acct.length < 10) return setError("Enter a valid account number");
                  if (!name) return setError("Resolve account name to continue");
                  try {
                    setSubmitLoading(true);
                    const res = await createWithdrawalAccount({
                      bankCode: code,
                      bankName: bank,
                      accountNumber: acct,
                      accountName: name,
                    });
                    console.log("[Profile] withdrawal/create response:", res);
                    showSuccessToast("Success", res?.message || "Bank account added");
                    onProceed?.({
                      bankCode: code,
                      bankName: bank,
                      accountNumber: acct,
                      accountName: name,
                    });
                    setOpen(false);
                  } catch (e) {
                    const msg =
                      e instanceof ApiError
                        ? e.message
                        : e instanceof Error
                          ? e.message
                          : "Unable to save bank details. Please try again.";
                    setError(msg);
                    showErrorToast("Error", msg);
                  } finally {
                    setSubmitLoading(false);
                  }
                }}
                disabled={!canProceed}
                className="h-[54px] rounded-[10px] text-[14px] font-semibold"
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

