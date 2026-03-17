"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import OnboardingShell from "@/components/templates/onboarding/OnboardingShell";
import Button from "@/components/ui/Button";
import TenorCard from "@/components/molecules/onboarding/TenorCard";
import InvestmentSummary from "@/components/organisms/onboarding/InvestmentSummary";
import PaymentDetailsTable from "@/components/organisms/onboarding/PaymentDetailsTable";
import EnterTransactionPinModal from "@/components/modals/EnterTransactionPinModal";
import { imagesAndIcons } from "@/constants/imagesAndIcons";
import { formatDateLong, formatNGN, parseMoney } from "@/lib/investment";
import { ApiError } from "@/lib/apiClient";
import {
  createInvestment,
  getExpectedReturn,
  getRates,
  InvestmentRateDto,
} from "@/services/webinvestment";
import {
  fundInvestment,
  FundInvestmentCheckoutData,
} from "@/services/investment";
import { showSuccessToast } from "@/state/toastState";
import { getSessionToken } from "@/state/appState";
import useCountdown from "@/hooks/useCountdown";
import { isAbortError } from "@/lib/isAbortError";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import {
  secureGetJson,
  secureRemove,
  secureSetJson,
} from "@/lib/secureStorage";
import IconCheckbox from "@/components/ui/IconCheckbox";

type Step = 1 | 2 | 3 | 4;

const FUND_CTX_KEY = "moneylot_new_investment_fund_ctx";
const NEW_INVESTMENT_PERSIST_KEY = "moneylot_new_investment_flow_v1";

function safeJsonParse<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function extractInvestmentId(input: unknown): number | null {
  if (typeof input === "number" && Number.isFinite(input)) return input;
  if (typeof input === "string" && input.trim()) {
    const n = Number(input);
    return Number.isFinite(n) ? n : null;
  }
  if (!input || typeof input !== "object") return null;
  const obj: any = input;
  const direct =
    (typeof obj.id === "number" ? obj.id : null) ??
    (typeof obj.investmentId === "number" ? obj.investmentId : null) ??
    null;
  if (direct != null && Number.isFinite(direct)) return direct;
  if (obj.data) return extractInvestmentId(obj.data);
  return null;
}

function CardShell({
  headerLabel,
  title,
  subtitle,
  children,
}: {
  headerLabel: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[8px] border border-black/10 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 text-[14px] font-medium text-[#5F6368]">
        {headerLabel}
      </div>
      <div className="h-px w-full bg-[#EEEEEE]" />

      <div className="px-6 py-7">
        <h1 className="text-[18px] font-semibold text-[#2E2E2E]">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-[11px] text-[#5F6368] max-w-[560px]">
            {subtitle}
          </p>
        ) : null}

        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function KVTable({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="mt-5 rounded-[8px] border border-[#EEEEEE] px-4">
      {rows.map(([label, value], idx) => (
        <div
          key={label}
          className={`flex items-center justify-between py-3 ${
            idx === 0 ? "" : "border-t border-[#EEEEEE]"
          }`}
        >
          <span className="text-[14px] text-[#979797]">{label}</span>
          <span className="text-[14px] font-semibold text-[#2E2E2E]">
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function NewInvestmentPage() {
  const router = useRouter();
  const MIN_INVESTMENT_NGN = 50;
  const [step, setStep] = useState<Step>(1);
  const [pinOpen, setPinOpen] = useState(false);
  const [transactionPin, setTransactionPin] = useState("");
  const [createdInvestmentId, setCreatedInvestmentId] = useState<number | null>(
    null,
  );
  const [fundingLoading, setFundingLoading] = useState(false);
  const [fundingError, setFundingError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<FundInvestmentCheckoutData | null>(
    null,
  );
  const [checkoutRef, setCheckoutRef] = useState<string | null>(null);
  const [checkoutExpiryAtMs, setCheckoutExpiryAtMs] = useState<number | null>(
    null,
  );
  const fundCalledRef = useRef(false);
  const [flowHydrated, setFlowHydrated] = useState(false);

  const expirySeconds = useMemo(() => {
    if (
      typeof checkoutExpiryAtMs === "number" &&
      Number.isFinite(checkoutExpiryAtMs)
    ) {
      return Math.max(0, Math.floor((checkoutExpiryAtMs - Date.now()) / 1000));
    }
    const m = checkout?.expiryInMinutes;
    if (typeof m !== "number" || !Number.isFinite(m) || m <= 0) return 0;
    return Math.max(0, Math.floor(m * 60));
  }, [checkout?.expiryInMinutes, checkoutExpiryAtMs]);

  const expiryCountdown = useCountdown(0);
  useEffect(() => {
    if (expirySeconds <= 0) {
      expiryCountdown.clear();
      expiryCountdown.reset(0);
      return;
    }
    expiryCountdown.restart(expirySeconds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expirySeconds]);

  // Step 1 inputs (cleared once user leaves step 1)
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [rates, setRates] = useState<InvestmentRateDto[]>([]);
  const [selectedRateId, setSelectedRateId] = useState<number | null>(null);

  // Locked snapshot for steps 2+ (so step 1 can be cleared)
  const [confirmedAmountInput, setConfirmedAmountInput] = useState<string | null>(
    null,
  );
  const [confirmedRateId, setConfirmedRateId] = useState<number | null>(null);

  const effectiveAmountInput =
    step === 1 ? investmentAmount : confirmedAmountInput ?? investmentAmount;
  const effectiveRateId =
    step === 1 ? selectedRateId : confirmedRateId ?? selectedRateId;

  const selectedRate = useMemo(() => {
    if (effectiveRateId == null) return null;
    return rates.find((r) => r.id === effectiveRateId) || null;
  }, [rates, effectiveRateId]);

  const selectedTenorDays = selectedRate ? selectedRate.investmentPeriod : null;
  const selectedTenorId = selectedRate ? selectedRate.tenorId : null;
  const selectedTypeId = selectedRate ? selectedRate.typeId : null;
  const selectedRatePa = selectedRate ? selectedRate.rate / 100 : null;

  const tenorOptions = useMemo(() => {
    const sorted = [...rates].sort(
      (a, b) => a.investmentPeriod - b.investmentPeriod,
    );
    return sorted.map((r) => ({
      id: r.id,
      days: r.investmentPeriod,
      rateLabel: r.rateFormatted || `${r.rate}% p.a`,
    }));
  }, [rates]);

  const [expectedLoading, setExpectedLoading] = useState(false);
  const [expectedError, setExpectedError] = useState<string | null>(null);
  const [expectedReturn, setExpectedReturn] = useState<number | null>(null);
  const [totalAtMaturity, setTotalAtMaturity] = useState<number | null>(null);
  const [maturityDateText, setMaturityDateText] = useState<string | null>(null);
  const [investmentTypeText, setInvestmentTypeText] = useState<string | null>(
    null,
  );
  const [rateFormattedText, setRateFormattedText] = useState<string | null>(
    null,
  );
  const [tenorText, setTenorText] = useState<string | null>(null);
  const [acknowledge, setAcknowledge] = useState(false);

  const amount = useMemo(() => parseMoney(effectiveAmountInput), [effectiveAmountInput]);

  const isReady =
    effectiveAmountInput.trim() !== "" &&
    amount >= MIN_INVESTMENT_NGN &&
    selectedTenorDays !== null &&
    selectedTenorId !== null &&
    selectedTypeId !== null &&
    selectedRatePa !== null &&
    Number.isFinite(selectedRatePa);

  const confirmRows: Array<[string, string]> = useMemo(() => {
    if (!isReady || !selectedRatePa || !selectedTenorDays) return [];

    const expected =
      typeof expectedReturn === "number" && Number.isFinite(expectedReturn)
        ? expectedReturn
        : null;
    const total =
      typeof totalAtMaturity === "number" && Number.isFinite(totalAtMaturity)
        ? totalAtMaturity
        : expected != null
          ? amount + expected
          : null;

    return [
      ["Investment Type", investmentTypeText || "Fixed Deposit"],
      ["Investment Tenor", tenorText || `${selectedTenorDays} Days`],
      [
        "Interest Rate",
        rateFormattedText || `${(selectedRatePa * 100).toFixed(2)}% p.a`,
      ],
      ["Investment Amount", formatNGN(amount)],
      ["Expected Returns", expected != null ? formatNGN(expected) : "-"],
      ["Total at Maturity", total != null ? formatNGN(total) : "-"],
      [
        "Maturity Date",
        maturityDateText?.trim()
          ? maturityDateText.trim()
          : formatDateLong(
              new Date(Date.now() + selectedTenorDays * 24 * 60 * 60 * 1000),
            ),
      ],
    ];
  }, [
    amount,
    expectedReturn,
    investmentTypeText,
    isReady,
    maturityDateText,
    rateFormattedText,
    selectedRatePa,
    selectedTenorDays,
    tenorText,
    totalAtMaturity,
  ]);

  useEffect(() => {
    let mounted = true;
    const ac = new AbortController();
    (async () => {
      try {
        if (mounted) {
          setRatesError(null);
          setRatesLoading(true);
        }
        const res = await getRates(ac.signal);
        console.log("[New Investment] get-rate response:", res);
        if (!mounted) return;
        if (res?.status && Array.isArray(res.data)) setRates(res.data);
        else setRatesError(res?.message || "Unable to load rates");
      } catch (e) {
        if (isAbortError(e)) return;
        if (e instanceof ApiError) setRatesError(e.message);
        else if (e instanceof Error) setRatesError(e.message);
        else setRatesError("Unable to load rates");
      } finally {
        if (mounted) setRatesLoading(false);
      }
    })();
    return () => {
      mounted = false;
      ac.abort();
    };
  }, []);

  // Hydrate / persist flow state across refresh (encrypted local storage).
  useEffect(() => {
    let mounted = true;
    (async () => {
      const saved = await secureGetJson<any>(NEW_INVESTMENT_PERSIST_KEY);
      if (!mounted) return;
      if (saved && typeof saved === "object") {
        const s = Number(saved.step);
        if (Number.isFinite(s) && s >= 1 && s <= 4) setStep(s as Step);
        const savedInvestmentAmount =
          typeof saved.investmentAmount === "string" ? saved.investmentAmount : "";
        const savedSelectedRateId =
          typeof saved.selectedRateId === "number" ? saved.selectedRateId : null;
        setInvestmentAmount(savedInvestmentAmount);
        setSelectedRateId(savedSelectedRateId);

        // Prefer explicit confirmed snapshot; otherwise migrate from old keys when step >= 2
        const savedConfirmedAmount =
          typeof saved.confirmedAmountInput === "string" ? saved.confirmedAmountInput : null;
        const savedConfirmedRateId =
          typeof saved.confirmedRateId === "number" ? saved.confirmedRateId : null;
        const stepValue = Number.isFinite(s) ? (s as Step) : 1;
        setConfirmedAmountInput(
          savedConfirmedAmount ??
            (stepValue >= 2 ? savedInvestmentAmount : null),
        );
        setConfirmedRateId(
          savedConfirmedRateId ??
            (stepValue >= 2 ? savedSelectedRateId : null),
        );

        setExpectedReturn(
          typeof saved.expectedReturn === "number"
            ? saved.expectedReturn
            : null,
        );
        setTotalAtMaturity(
          typeof saved.totalAtMaturity === "number"
            ? saved.totalAtMaturity
            : null,
        );
        setMaturityDateText(
          typeof saved.maturityDateText === "string"
            ? saved.maturityDateText
            : null,
        );
        setInvestmentTypeText(
          typeof saved.investmentTypeText === "string"
            ? saved.investmentTypeText
            : null,
        );
        setRateFormattedText(
          typeof saved.rateFormattedText === "string"
            ? saved.rateFormattedText
            : null,
        );
        setTenorText(
          typeof saved.tenorText === "string" ? saved.tenorText : null,
        );
        setAcknowledge(Boolean(saved.acknowledge));
        setCreatedInvestmentId(
          typeof saved.createdInvestmentId === "number"
            ? saved.createdInvestmentId
            : null,
        );
        setTransactionPin(
          typeof saved.transactionPin === "string" ? saved.transactionPin : "",
        );
        setCheckout(
          saved.checkout && typeof saved.checkout === "object"
            ? (saved.checkout as any)
            : null,
        );
        setCheckoutRef(
          typeof saved.checkoutRef === "string" ? saved.checkoutRef : null,
        );
        setCheckoutExpiryAtMs(
          typeof saved.checkoutExpiryAtMs === "number"
            ? saved.checkoutExpiryAtMs
            : null,
        );
      }
      setFlowHydrated(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!flowHydrated) return;
    const payload = {
      step,
      investmentAmount,
      selectedRateId,
      confirmedAmountInput,
      confirmedRateId,
      expectedReturn,
      totalAtMaturity,
      maturityDateText,
      investmentTypeText,
      rateFormattedText,
      tenorText,
      acknowledge,
      createdInvestmentId,
      transactionPin,
      checkout,
      checkoutRef,
      checkoutExpiryAtMs,
    };
    void secureSetJson(NEW_INVESTMENT_PERSIST_KEY, payload);
  }, [
    flowHydrated,
    step,
    investmentAmount,
    selectedRateId,
    confirmedAmountInput,
    confirmedRateId,
    expectedReturn,
    totalAtMaturity,
    maturityDateText,
    investmentTypeText,
    rateFormattedText,
    tenorText,
    acknowledge,
    createdInvestmentId,
    transactionPin,
    checkout,
    checkoutRef,
    checkoutExpiryAtMs,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (createdInvestmentId != null && transactionPin.length === 4) return;
    const ctx = safeJsonParse<{
      investmentId: number;
      transactionPin: string;
      amount: number;
    }>(window.sessionStorage.getItem(FUND_CTX_KEY));
    if (!ctx) return;
    if (createdInvestmentId == null && typeof ctx.investmentId === "number") {
      setCreatedInvestmentId(ctx.investmentId);
    }
    if (!transactionPin && typeof ctx.transactionPin === "string") {
      setTransactionPin(ctx.transactionPin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (step !== 3) return;
    if (fundCalledRef.current) return;

    const investmentId = createdInvestmentId;
    if (investmentId == null) {
      setFundingError("Missing investment ID. Please restart the flow.");
      return;
    }
    if (!transactionPin || transactionPin.length !== 4) {
      setFundingError("Missing transaction PIN. Please restart the flow.");
      return;
    }

    const tokenPresent = !!getSessionToken();
    console.log("[New Investment] token present?", tokenPresent);
    if (!tokenPresent) {
      setFundingError("You are not logged in. Please login again and retry.");
      return;
    }

    fundCalledRef.current = true;
    setFundingError(null);
    setCheckout(null);
    setCheckoutRef(null);
    (async () => {
      try {
        setFundingLoading(true);
        const payload = {
          paymentOptionId: 2,
          investmentId,
          amount,
          transactionPin,
        };
        console.log("[New Investment] investment/fund payload:", payload);
        const res = await fundInvestment(payload);
        console.log("[New Investment] investment/fund response:", res);
        setCheckoutRef(typeof res?.message === "string" ? res.message : null);
        const raw = (res as any)?.data;
        const checkoutData =
          raw &&
          typeof raw === "object" &&
          (raw as any).data &&
          typeof (raw as any).data === "object"
            ? (raw as any).data
            : raw;
        if (checkoutData && typeof checkoutData === "object") {
          setCheckout(checkoutData as FundInvestmentCheckoutData);
          const mins = (checkoutData as any)?.expiryInMinutes;
          if (typeof mins === "number" && Number.isFinite(mins) && mins > 0) {
            setCheckoutExpiryAtMs(Date.now() + mins * 60 * 1000);
          }
        }
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(FUND_CTX_KEY);
        }
      } catch (e) {
        fundCalledRef.current = false; // allow retry if user stays on the screen
        if (e instanceof ApiError) setFundingError(e.message);
        else if (e instanceof Error) setFundingError(e.message);
        else setFundingError("Unable to fund investment. Please try again.");
      } finally {
        setFundingLoading(false);
      }
    })();
  }, [amount, createdInvestmentId, step, transactionPin]);

  return (
    <OnboardingShell stage={4} totalStages={4} showProgress={false}>
      <div className="w-full relative">
        <LoadingOverlay
          show={ratesLoading || expectedLoading || fundingLoading}
          label="Loading..."
        />
        {step !== 4 ? (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => {
                if (step === 1) router.push("/dashboard");
                else setStep((s) => (s === 1 ? 1 : ((s - 1) as Step)));
              }}
              className="inline-flex items-center gap-2 rounded-[8px] border border-[#EEEEEE] bg-white px-2.5 py-1 text-[12px] font-medium text-[#2E2E2E] shadow-sm hover:bg-[#FAFAFA]"
            >
              <span className="text-[14px] leading-none">‹</span>
              Back
            </button>
          </div>
        ) : null}

        {step === 1 ? (
          <CardShell
            headerLabel="New Investment"
            title="Fixed Term Deposits"
            subtitle="Guaranteed returns with defined interest rates"
          >
            {ratesError ? (
              <div className="mb-4 rounded-[10px] border border-[#F2C6C6] bg-[#FFF5F5] px-4 py-3 text-[11px] text-[#D32F2F]">
                {ratesError}
              </div>
            ) : null}
            {expectedError ? (
              <div className="mb-4 rounded-[10px] border border-[#F2C6C6] bg-[#FFF5F5] px-4 py-3 text-[11px] text-[#D32F2F]">
                {expectedError}
              </div>
            ) : null}

            <div>
              <p className="text-[14px] font-medium text-[#2E2E2E]">
                How much do you want to invest? (₦)
              </p>
              <input
                type="text"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                placeholder="Enter investment amount"
                className="mt-2 w-full h-[42px] rounded-[8px] border border-[#E9E9E9] px-4 text-[12px] text-[#2E2E2E] outline-none focus:border-[#89E081]"
              />
              <p className="mt-1 text-[12px] text-[#E53935]">
                Minimum investment is ₦50
              </p>
            </div>

            <div className="mt-5">
              <p className="text-[14px] font-medium text-[#2E2E2E]">
                Select Tenor
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                {tenorOptions.map((opt) => (
                  <TenorCard
                    key={opt.id}
                    option={{ days: opt.days, rateLabel: opt.rateLabel }}
                    selected={selectedRateId === opt.id}
                    onSelect={() => {
                      setSelectedRateId(opt.id);
                      setExpectedError(null);
                      setExpectedReturn(null);
                      setTotalAtMaturity(null);
                      setMaturityDateText(null);
                      setInvestmentTypeText(null);
                      setRateFormattedText(null);
                      setTenorText(null);
                    }}
                  />
                ))}
              </div>
              {ratesLoading ? (
                <p className="mt-2 text-[10px] text-[#5F6368]">
                  Loading rates...
                </p>
              ) : null}
            </div>

            {isReady && selectedRatePa && selectedTenorDays ? (
              <InvestmentSummary
                amountInput={investmentAmount}
                tenorDays={selectedTenorDays}
                ratePa={selectedRatePa}
              />
            ) : null}

            <div className="mt-6 flex justify-end">
              {isReady ? (
                <Button.SmPrimary
                  label="Review & Confirm"
                  height={38}
                  width={170}
                  fontSize="text-[11px]"
                  className="rounded-[8px] font-medium"
                  loading={expectedLoading ? "Please wait" : undefined}
                  disabled={expectedLoading}
                  onClick={async () => {
                    setExpectedError(null);
                    setExpectedReturn(null);
                    setTotalAtMaturity(null);
                    setMaturityDateText(null);
                    setInvestmentTypeText(null);
                    setRateFormattedText(null);
                    setTenorText(null);
                    if (!selectedTenorId) return;
                    if (amount < MIN_INVESTMENT_NGN) {
                      setExpectedError("Minimum investment is ₦50");
                      return;
                    }
                    try {
                      setExpectedLoading(true);
                      const res = await getExpectedReturn({
                        tenorId: selectedTenorId,
                        amount,
                      });
                      console.log(
                        "[New Investment] get-expected-return response:",
                        res,
                      );
                      setExpectedReturn(res.expectedReturn);
                      setTotalAtMaturity(
                        typeof res.totalAtMaturity === "number"
                          ? res.totalAtMaturity
                          : null,
                      );
                      setMaturityDateText(
                        typeof res.maturityDate === "string"
                          ? res.maturityDate
                          : null,
                      );
                      setInvestmentTypeText(
                        typeof res.investmentType === "string"
                          ? res.investmentType
                          : null,
                      );
                      setRateFormattedText(
                        typeof res.rateFormatted === "string"
                          ? res.rateFormatted
                          : null,
                      );
                      setTenorText(
                        typeof res.tenor === "string" ? res.tenor : null,
                      );
                      setAcknowledge(false);

                      // Lock snapshot for steps 2+, then clear step 1 inputs so back shows empty.
                      setConfirmedAmountInput(investmentAmount);
                      setConfirmedRateId(selectedRateId);
                      setInvestmentAmount("");
                      setSelectedRateId(null);

                      setStep(2);
                    } catch (e) {
                      if (e instanceof ApiError) setExpectedError(e.message);
                      else if (e instanceof Error) setExpectedError(e.message);
                      else
                        setExpectedError("Unable to compute expected return.");
                    } finally {
                      setExpectedLoading(false);
                    }
                  }}
                />
              ) : (
                <Button.SmSecondary
                  label="Review & Confirm"
                  height={38}
                  width={170}
                  fontSize="text-[11px]"
                  backgroundColor="bg-[#F2F2F2]"
                  textColor="text-[#5F6368]"
                  disabled
                  onClick={() => {}}
                />
              )}
            </div>
          </CardShell>
        ) : step === 2 ? (
          <CardShell
            headerLabel="New Investment"
            title="Confirm Your Investment"
            subtitle="Please review all details carefully before proceeding to payment"
          >
            {expectedError ? (
              <div className="mb-4 rounded-[10px] border border-[#F2C6C6] bg-[#FFF5F5] px-4 py-3 text-[11px] text-[#D32F2F]">
                {expectedError}
              </div>
            ) : null}

            <KVTable rows={confirmRows} />

            <div className="mt-5 flex items-center gap-3 rounded-[6px] border border-[#89E081] bg-[#5FCE551A] px-4 py-3 text-[14px] leading-[20px] text-[#5F6368]">
              <IconCheckbox
                checked={acknowledge}
                onChange={(next) => {
                  setAcknowledge(next);
                  if (next) setExpectedError(null);
                }}
              />
              <div>
                By proceeding, I agree that all returns accrued will be
                forfeited and a penalty fee incurred if funds are withdrawn
                before maturity
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button.SmPrimary
                label="Proceed to Payment"
                height={38}
                width={170}
                fontSize="text-[11px]"
                className="rounded-[8px] font-medium"
                onClick={() => {
                  if (!confirmedAmountInput?.trim() || confirmedRateId == null) {
                    setExpectedError("Please restart this investment.");
                    return;
                  }
                  if (!acknowledge) {
                    setExpectedError("Please confirm to continue");
                    return;
                  }
                  setPinOpen(true);
                }}
              />
            </div>
          </CardShell>
        ) : step === 3 ? (
          <CardShell
            headerLabel="Initiate Payment"
            title="Make Payment To The Account Details Below"
          >
            {fundingError ? (
              <div className="mb-4 rounded-[10px] border border-[#F2C6C6] bg-[#FFF5F5] px-4 py-3 text-[11px] text-[#D32F2F]">
                {fundingError}
              </div>
            ) : null}

            <PaymentDetailsTable
              amountInput={confirmedAmountInput ?? investmentAmount}
              bankName={checkout?.bankName || "-"}
              accountNumber={checkout?.accountNumber || "-"}
              accountName={checkout?.accountName || "-"}
            />

            <p className="mt-4 text-center text-[11px] text-[#5F6368]">
              Account number provided expires after{" "}
              <span className="font-semibold text-[#2E2E2E]">
                {expiryCountdown.formatted} mins
              </span>
            </p>
            <p className="mt-1 text-center text-[11px] text-[#5F6368]">
              Transfer only{" "}
              <span className="font-semibold text-[#2E2E2E]">
                {formatNGN(parseMoney(confirmedAmountInput ?? investmentAmount) + 50)}
              </span>{" "}
              to the account number above within the validity time
            </p>

            <div className="mt-5 flex justify-center">
              <Button.SmPrimary
                label="I have made this payment"
                height={38}
                width={220}
                fontSize="text-[11px]"
                className="rounded-[8px] font-medium"
                loading={fundingLoading ? "Please wait" : undefined}
                disabled={fundingLoading}
                onClick={() => setStep(4)}
              />
            </div>
          </CardShell>
        ) : (
          <div className="rounded-[8px] border border-black/10 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-14 text-center">
              <Image
                src={imagesAndIcons.successfulIcon}
                alt="Success"
                width={60}
                height={60}
                className="mx-auto h-[60px] w-[60px]"
              />

              <h1 className="mt-6 text-[16px] font-semibold text-[#2E2E2E]">
                Your Investment Is Being Processed
              </h1>
              <p className="mx-auto mt-1 max-w-[420px] text-[11px] text-[#5F6368]">
                Our team is reviewing your investment. An email confirmation
                will be sent to you shortly.
              </p>

              <div className="mt-6 flex justify-center">
                <Button.SmPrimary
                  label="Close"
                  height={40}
                  width={280}
                  fontSize="text-[12px]"
                  className="rounded-[8px] font-medium"
                  onClick={() => {
                    void secureRemove(NEW_INVESTMENT_PERSIST_KEY);
                    router.push("/dashboard");
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <EnterTransactionPinModal
          open={pinOpen}
          setOpen={setPinOpen}
          onProceed={async (pin) => {
            if (!selectedTenorId || !selectedTypeId) {
              throw new Error("Missing tenor selection. Please go back.");
            }
            if (expectedReturn == null || !Number.isFinite(expectedReturn)) {
              throw new Error("Missing expected return. Please go back.");
            }
            if (amount < MIN_INVESTMENT_NGN) {
              throw new Error("Minimum investment is ₦50");
            }
            if (!acknowledge) {
              throw new Error("Please confirm to continue.");
            }
            try {
              setTransactionPin(pin);
              const res = await createInvestment({
                amount,
                expectedReturn,
                typeId: selectedTypeId,
                tenorId: selectedTenorId,
                acknowledge: true,
              });
              console.log(
                "[New Investment] webinvestment/create response:",
                res,
              );
              const id = extractInvestmentId(res?.data);
              if (id != null) setCreatedInvestmentId(id);
              if (typeof window !== "undefined") {
                window.sessionStorage.setItem(
                  FUND_CTX_KEY,
                  JSON.stringify({
                    investmentId: id,
                    transactionPin: pin,
                    amount,
                  }),
                );
              }
              setStep(3);
            } catch (e) {
              if (e instanceof ApiError) throw new Error(e.message);
              if (e instanceof Error) throw e;
              throw new Error("Unable to create investment. Please try again.");
            }
          }}
        />
      </div>
    </OnboardingShell>
  );
}
