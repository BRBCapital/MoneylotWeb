"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import OnboardingShell from "@/components/templates/onboarding/OnboardingShell";
import {
  DateField,
  PasswordField,
  PhoneNumberField,
  SearchableSelectField,
  SelectField,
  TextField,
} from "@/components/molecules/forms/Field";
import Button from "@/components/ui/Button";
import OtpModal from "@/components/modals/OtpModal";
import BackPillButton from "@/components/molecules/onboarding/BackPillButton";
import OnboardingCard from "@/components/organisms/onboarding/OnboardingCard";
import TenorCard from "@/components/molecules/onboarding/TenorCard";
import InvestmentSummary from "@/components/organisms/onboarding/InvestmentSummary";
import CreateTransactionPinModal from "@/components/modals/CreateTransactionPinModal";
import EnterTransactionPinModal from "@/components/modals/EnterTransactionPinModal";
import InvestmentConfirmationTable from "@/components/organisms/onboarding/InvestmentConfirmationTable";
import PaymentDetailsTable from "@/components/organisms/onboarding/PaymentDetailsTable";
import Image from "next/image";
import { imagesAndIcons } from "@/constants/imagesAndIcons";
import { useRouter, useSearchParams } from "next/navigation";
import { accountCreationWeb } from "@/services/signup";
import { ApiError } from "@/lib/apiClient";
import { checkPasswordValidity } from "@/lib/password";
import { getAccountTypes } from "@/services/account";
import { securityLogin, verifyEmailAddress } from "@/services/auth";
import { webGenerateOtp, webValidateOtp } from "@/services/otp";
import {
  createInvestment,
  getExpectedReturn,
  getRates,
  InvestmentRateDto,
  validateIdentityAddress,
} from "@/services/webinvestment";
import {
  createWithdrawalAccount,
  getBanks,
  validateAccount,
} from "@/services/withdrawal";
import { getCountries } from "@/services/verification";
import {
  setAuthSession,
  getAuthSession,
  getUserEmail,
  authSessionAtom,
  stage1SignupContextAtom,
  setUserEmail,
} from "@/state/appState";
import { showErrorToast, showSuccessToast } from "@/state/toastState";
import { formatNGN, parseMoney } from "@/lib/investment";
import {
  fundInvestment,
  FundInvestmentCheckoutData,
} from "@/services/investment";
import useCountdown from "@/hooks/useCountdown";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { isAbortError } from "@/lib/isAbortError";
import { secureGetJson, secureRemove, secureSetJson } from "@/lib/secureStorage";
import IconCheckbox from "@/components/ui/IconCheckbox";
import { City, State } from "country-state-city";
import Stage1AccountCreation from "@/app/get-started/_components/Stage1AccountCreation";
import Stage2Verification from "@/app/get-started/_components/Stage2Verification";
import Stage3BankDetails from "@/app/get-started/_components/Stage3BankDetails";
import Stage4Investment from "@/app/get-started/_components/Stage4Investment";
import Stage5ConfirmInvestment from "@/app/get-started/_components/Stage5ConfirmInvestment";
import Stage6Payment from "@/app/get-started/_components/Stage6Payment";
import Stage7Processing from "@/app/get-started/_components/Stage7Processing";

const GET_STARTED_PERSIST_KEY = "moneylot_get_started_flow_v1";

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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function sanitizeNameInput(value: string) {
  // Allow letters, spaces, hyphen (-) and apostrophe (')
  return String(value || "")
    .replace(/[^A-Za-z\s'-]/g, "")
    .replace(/\s{2,}/g, " ");
}

function isValidPersonName(value: string) {
  const v = String(value || "").trim();
  if (!v) return false;
  // Letters with optional internal separators (space, hyphen, apostrophe)
  return /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(v);
}

function normalizePhone(countryCode: string, phoneNumber: string) {
  const cc = (countryCode || "").trim();
  const pnDigits = (phoneNumber || "").replace(/\s+/g, "").replace(/[^\d]/g, "").trim();
  // Don't allow country code alone to pass validation
  if (!pnDigits) return "";
  return `${cc}${pnDigits}`;
}

export default function GetStartedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const MIN_INVESTMENT_NGN = 50;
  const [stage, setStage] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);
  const [otpOpen, setOtpOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [investmentPinOpen, setInvestmentPinOpen] = useState(false);
  const [investmentTransactionPin, setInvestmentTransactionPin] = useState("");
  const [createdInvestmentId, setCreatedInvestmentId] = useState<number | null>(
    null,
  );
  const [checkout, setCheckout] = useState<FundInvestmentCheckoutData | null>(
    null,
  );
  const [checkoutRef, setCheckoutRef] = useState<string | null>(null);
  const [checkoutExpiryAtMs, setCheckoutExpiryAtMs] = useState<number | null>(null);
  const [fundingLoading, setFundingLoading] = useState(false);
  const [fundingError, setFundingError] = useState<string | null>(null);
  const fundCalledRef = useRef(false);
  const [flowHydrated, setFlowHydrated] = useState(false);

  const expirySeconds = useMemo(() => {
    if (typeof checkoutExpiryAtMs === "number" && Number.isFinite(checkoutExpiryAtMs)) {
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

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [accountType, setAccountType] = useState("");
  const [countryCode, setCountryCode] = useState("+234");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [stage1Loading, setStage1Loading] = useState(false);
  const [stage1Error, setStage1Error] = useState<string | null>(null);
  const [stage1FieldErrors, setStage1FieldErrors] = useState<
    Partial<
      Record<
        | "firstName"
        | "lastName"
        | "accountType"
        | "phoneNumber"
        | "email"
        | "password"
        | "confirmPassword"
        | "acceptedTerms",
        string
      >
    >
  >({});
  const [otpLoading, setOtpLoading] = useState(false);
  const [stage2Loading, setStage2Loading] = useState(false);
  const [stage2Error, setStage2Error] = useState<string | null>(null);
  const [stage2FieldErrors, setStage2FieldErrors] = useState<
    Partial<
      Record<
        | "dob"
        | "bvn"
        | "country"
        | "address"
        | "state"
        | "city",
        string
      >
    >
  >({});
  const [accountTypesLoading, setAccountTypesLoading] = useState(false);
  const [accountTypesError, setAccountTypesError] = useState<string | null>(
    null,
  );
  const [accountTypes, setAccountTypes] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [stage1SignupContext, setStage1SignupContext] = useAtom(
    stage1SignupContextAtom,
  );
  const session = useAtomValue(authSessionAtom);

  const [bvn, setBvn] = useState("");
  const [dob, setDob] = useState(""); // YYYY-MM-DD
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState_] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [countries, setCountries] = useState<
    Array<{ code: string; name: string }>
  >([]);

  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [banksLoading, setBanksLoading] = useState(false);
  const [banksError, setBanksError] = useState<string | null>(null);
  const [banks, setBanks] = useState<
    Array<{ bankCode: string; bankName: string }>
  >([]);
  const [stage3Loading, setStage3Loading] = useState(false);
  const [stage3Error, setStage3Error] = useState<string | null>(null);
  const [stage3FieldErrors, setStage3FieldErrors] = useState<
    Partial<Record<"bankName" | "accountNumber" | "accountName", string>>
  >({});
  const [accountResolveLoading, setAccountResolveLoading] = useState(false);
  const lastResolvedKeyRef = useRef<string>("");
  const resolveSeqRef = useRef(0);

  const [investmentAmount, setInvestmentAmount] = useState("");
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [rates, setRates] = useState<InvestmentRateDto[]>([]);
  const [selectedRateId, setSelectedRateId] = useState<number | null>(null);

  const selectedRate = useMemo(() => {
    if (selectedRateId == null) return null;
    return rates.find((r) => r.id === selectedRateId) || null;
  }, [rates, selectedRateId]);

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

  const [expectedReturnLoading, setExpectedReturnLoading] = useState(false);
  const [expectedReturnError, setExpectedReturnError] = useState<string | null>(
    null,
  );
  const [expectedReturn, setExpectedReturn] = useState<number | null>(null);
  const [totalAtMaturity, setTotalAtMaturity] = useState<number | null>(null);
  const [maturityDateText, setMaturityDateText] = useState<string | null>(null);

  const [createInvestmentLoading, setCreateInvestmentLoading] = useState(false);
  const [createInvestmentError, setCreateInvestmentError] = useState<
    string | null
  >(null);
  const [acknowledgeInvestment, setAcknowledgeInvestment] = useState(false);

  const clearStage1Form = () => {
    setFirstName("");
    setLastName("");
    setAccountType("");
    setCountryCode("+234");
    setPhoneNumber("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setAcceptedTerms(false);
    setStage1Error(null);
    setStage1FieldErrors({});
  };

  const clearStage2Form = () => {
    setBvn("");
    setDob("");
    setCountry("");
    setAddress("");
    setCity("");
    setState_("");
    setStateCode("");
    setStage2Error(null);
    setStage2FieldErrors({});
  };

  const clearStage3Form = () => {
    setBankName("");
    setAccountNumber("");
    setAccountName("");
    setStage3Error(null);
    setStage3FieldErrors({});
    setAccountResolveLoading(false);
    lastResolvedKeyRef.current = "";
    resolveSeqRef.current += 1; // invalidate any in-flight resolve attempt
  };

  // Hydrate / persist flow state across refresh (encrypted local storage).
  useEffect(() => {
    let mounted = true;
    (async () => {
      // If the user refreshes this page, reset the flow instead of restoring
      // potentially stale/incomplete state (testing requirement).
      try {
        const nav = (performance.getEntriesByType?.("navigation")?.[0] ||
          null) as PerformanceNavigationTiming | null;
        const isReload = nav?.type === "reload";
        if (isReload) {
          await secureRemove(GET_STARTED_PERSIST_KEY);
          if (!mounted) return;
          setFlowHydrated(true);
          return;
        }
      } catch {
        // ignore and fall back to normal hydration
      }

      const saved = await secureGetJson<any>(GET_STARTED_PERSIST_KEY);
      if (!mounted) return;
      if (saved && typeof saved === "object") {
        const s = Number((saved as any).stage);
        if (Number.isFinite(s) && s >= 1 && s <= 7) setStage(s as any);

        setFirstName(typeof saved.firstName === "string" ? saved.firstName : "");
        setLastName(typeof saved.lastName === "string" ? saved.lastName : "");
        setAccountType(typeof saved.accountType === "string" ? saved.accountType : "");
        setCountryCode(typeof saved.countryCode === "string" ? saved.countryCode : "+234");
        setPhoneNumber(typeof saved.phoneNumber === "string" ? saved.phoneNumber : "");
        setEmail(typeof saved.email === "string" ? saved.email : "");
        setPassword(typeof saved.password === "string" ? saved.password : "");
        setConfirmPassword(typeof saved.confirmPassword === "string" ? saved.confirmPassword : "");
        setAcceptedTerms(Boolean(saved.acceptedTerms));

        setBvn(typeof saved.bvn === "string" ? saved.bvn : "");
        setDob(typeof saved.dob === "string" ? saved.dob : "");
        setCountry(typeof saved.country === "string" ? saved.country : "");
        setAddress(typeof saved.address === "string" ? saved.address : "");
        setCity(typeof saved.city === "string" ? saved.city : "");
        setState_(typeof saved.state === "string" ? saved.state : "");
        setStateCode(typeof saved.stateCode === "string" ? saved.stateCode : "");

        setBankName(typeof saved.bankName === "string" ? saved.bankName : "");
        setAccountNumber(typeof saved.accountNumber === "string" ? saved.accountNumber : "");
        setAccountName(typeof saved.accountName === "string" ? saved.accountName : "");

        setInvestmentAmount(typeof saved.investmentAmount === "string" ? saved.investmentAmount : "");
        setSelectedRateId(typeof saved.selectedRateId === "number" ? saved.selectedRateId : null);
        setExpectedReturn(typeof saved.expectedReturn === "number" ? saved.expectedReturn : null);
        setTotalAtMaturity(typeof saved.totalAtMaturity === "number" ? saved.totalAtMaturity : null);
        setMaturityDateText(typeof saved.maturityDateText === "string" ? saved.maturityDateText : null);
        setAcknowledgeInvestment(Boolean(saved.acknowledgeInvestment));

        setCreatedInvestmentId(typeof saved.createdInvestmentId === "number" ? saved.createdInvestmentId : null);
        setInvestmentTransactionPin(typeof saved.investmentTransactionPin === "string" ? saved.investmentTransactionPin : "");
        setCheckout(saved.checkout && typeof saved.checkout === "object" ? (saved.checkout as any) : null);
        setCheckoutRef(typeof saved.checkoutRef === "string" ? saved.checkoutRef : null);
        setCheckoutExpiryAtMs(typeof saved.checkoutExpiryAtMs === "number" ? saved.checkoutExpiryAtMs : null);

        if (saved.stage1SignupContext && typeof saved.stage1SignupContext === "object") {
          setStage1SignupContext((prev) => ({
            ...prev,
            ...saved.stage1SignupContext,
          }));
        }
      }
      setFlowHydrated(true);
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Support resuming onboarding after timeout/logout from server-provided stage flags.
  useEffect(() => {
    if (!flowHydrated) return;
    const raw = searchParams.get("resumeStage");
    if (!raw) return;
    const n = Number(raw);
    if (n === 35) {
      setStage(3);
      setPinOpen(true);
      return;
    }
    if (Number.isFinite(n) && n >= 1 && n <= 7) {
      setStage(n as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowHydrated, searchParams]);

  // Support deep-linking to a stage from login ("Continue setup").
  useEffect(() => {
    if (!flowHydrated) return;
    const rawStage = searchParams.get("stage");
    const openOtp = searchParams.get("openOtp") === "1";
    const openPin = searchParams.get("openPin") === "1";

    const n = rawStage ? Number(rawStage) : NaN;
    if (Number.isFinite(n) && n >= 1 && n <= 7) {
      setStage(n as any);
    }

    if (openPin) {
      setStage(3);
      setPinOpen(true);
    }

    if (openOtp) {
      // ensure stage 1 and email are available for display + resend
      setStage(1);
      const storedEmail = getUserEmail();
      if (storedEmail && !email) setEmail(storedEmail);
      setOtpOpen(true);

      // proactively send OTP if we have an email
      const e = (storedEmail || email || "").trim();
      if (e) {
        setStage1Error(null);
        setOtpLoading(true);
        webGenerateOtp(e, 1)
          .then(() => showSuccessToast("Success", "OTP sent"))
          .catch((err) => {
            const msg =
              err instanceof ApiError
                ? err.message
                : err instanceof Error
                  ? err.message
                  : "Unable to send OTP. Please try again.";
            setStage1Error(msg);
          })
          .finally(() => setOtpLoading(false));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowHydrated, searchParams]);

  useEffect(() => {
    if (!flowHydrated) return;
    const payload = {
      stage,
      firstName,
      lastName,
      accountType,
      countryCode,
      phoneNumber,
      email,
      password,
      confirmPassword,
      acceptedTerms,
      stage1SignupContext,
      bvn,
      dob,
      country,
      address,
      city,
      state,
      stateCode,
      bankName,
      accountNumber,
      accountName,
      investmentAmount,
      selectedRateId,
      expectedReturn,
      totalAtMaturity,
      maturityDateText,
      acknowledgeInvestment,
      createdInvestmentId,
      investmentTransactionPin,
      checkout,
      checkoutRef,
      checkoutExpiryAtMs,
    };
    void secureSetJson(GET_STARTED_PERSIST_KEY, payload);
  }, [
    flowHydrated,
    stage,
    firstName,
    lastName,
    accountType,
    countryCode,
    phoneNumber,
    email,
    password,
    confirmPassword,
    acceptedTerms,
    stage1SignupContext,
    bvn,
    dob,
    country,
    address,
    city,
    state,
    stateCode,
    bankName,
    accountNumber,
    accountName,
    investmentAmount,
    selectedRateId,
    expectedReturn,
    totalAtMaturity,
    maturityDateText,
    acknowledgeInvestment,
    createdInvestmentId,
    investmentTransactionPin,
    checkout,
    checkoutRef,
    checkoutExpiryAtMs,
  ]);

  const isStage4Ready =
    investmentAmount.trim() !== "" &&
    parseMoney(investmentAmount) >= MIN_INVESTMENT_NGN &&
    selectedTenorDays !== null &&
    selectedTenorId !== null &&
    selectedTypeId !== null &&
    selectedRatePa !== null &&
    Number.isFinite(selectedRatePa);

  const onStage4GoDashboard = () => {
    void secureRemove(GET_STARTED_PERSIST_KEY);
    router.push("/dashboard");
  };

  const onStage4AmountChange = (v: string) => {
    setInvestmentAmount(v);
  };

  const onStage4SelectRate = (id: number) => {
    setSelectedRateId(id);
    setExpectedReturnError(null);
    setExpectedReturn(null);
    setTotalAtMaturity(null);
    setMaturityDateText(null);
  };

  const onStage4ReviewConfirm = async () => {
    setExpectedReturnError(null);
    setExpectedReturn(null);
    setTotalAtMaturity(null);
    setMaturityDateText(null);
    const amt = parseMoney(investmentAmount);
    if (!selectedTenorId) return;
    if (amt < MIN_INVESTMENT_NGN) {
      setExpectedReturnError("Minimum investment is ₦50");
      return;
    }
    try {
      setExpectedReturnLoading(true);
      const res = await getExpectedReturn({
        tenorId: selectedTenorId,
        amount: amt,
      });
      console.log("[Stage 4] get-expected-return response:", res);
      setExpectedReturn(res.expectedReturn);
      setTotalAtMaturity(
        typeof res.totalAtMaturity === "number" ? res.totalAtMaturity : null
      );
      setMaturityDateText(
        typeof res.maturityDate === "string" ? res.maturityDate : null
      );
      setAcknowledgeInvestment(false);
      setCreateInvestmentError(null);
      setStage(5);
    } catch (e) {
      if (e instanceof ApiError) setExpectedReturnError(e.message);
      else if (e instanceof Error) setExpectedReturnError(e.message);
      else setExpectedReturnError("Unable to compute expected return.");
    } finally {
      setExpectedReturnLoading(false);
    }
  };

  const onStage5ProceedToPayment = async () => {
    setCreateInvestmentError(null);
    if (!acknowledgeInvestment) {
      setCreateInvestmentError("Please confirm to continue");
      return;
    }
    if (!selectedTenorId || !selectedTypeId) {
      setCreateInvestmentError("Missing tenor selection. Please go back.");
      return;
    }
    if (expectedReturn == null || !Number.isFinite(expectedReturn)) {
      setCreateInvestmentError("Missing expected return. Please go back.");
      return;
    }
    setInvestmentPinOpen(true);
  };

  const onStage6MadePayment = () => setStage(7);

  const onStage7GoDashboard = () => {
    void secureRemove(GET_STARTED_PERSIST_KEY);
    router.push("/dashboard");
  };

  const progressStage = stage <= 4 ? stage : 4;

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setAccountTypesError(null);
        setAccountTypesLoading(true);
        const res = await getAccountTypes(ac.signal);
        if (res?.status && Array.isArray(res.data)) {
          setAccountTypes(res.data);
        } else {
          setAccountTypesError("Unable to load account types");
        }
      } catch (e) {
        // Keep UX resilient: show fallback options below.
        setAccountTypesError("Unable to load account types");
      } finally {
        setAccountTypesLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  const accountTypeOptions = useMemo(() => {
    const fetched = accountTypes
      .filter((x) => x && typeof x.name === "string" && x.name.trim() !== "")
      .map((x) => ({ label: x.name, value: x.name }));

    // Fallback (matches API currently returning Personal/Business)
    const fallback = [
      { label: "Personal", value: "Personal" },
      { label: "Business", value: "Business" },
    ];

    return fetched.length > 0 ? fetched : fallback;
  }, [accountTypes]);

  const stage1Phone = useMemo(
    () => normalizePhone(countryCode, phoneNumber),
    [countryCode, phoneNumber],
  );

  const stage1CanSubmit = useMemo(() => {
    if (!firstName.trim() || !lastName.trim()) return false;
    if (!accountType.trim()) return false;
    if (!stage1Phone.trim()) return false;
    if (!isValidEmail(email)) return false;
    if (!acceptedTerms) return false;
    if (checkPasswordValidity(password) !== true) return false;
    if (confirmPassword.trim() === "" || confirmPassword !== password)
      return false;
    return true;
  }, [
    firstName,
    lastName,
    accountType,
    stage1Phone,
    email,
    acceptedTerms,
    password,
    confirmPassword,
  ]);

  const onStage1FirstNameChange = (v: string) => {
    setFirstName(v);
    if (stage1FieldErrors.firstName) {
      setStage1FieldErrors((p) => ({ ...p, firstName: undefined }));
    }
  };
  const onStage1LastNameChange = (v: string) => {
    setLastName(v);
    if (stage1FieldErrors.lastName) {
      setStage1FieldErrors((p) => ({ ...p, lastName: undefined }));
    }
  };
  const onStage1AccountTypeChange = (v: string) => {
    setAccountType(v);
    if (stage1FieldErrors.accountType) {
      setStage1FieldErrors((p) => ({ ...p, accountType: undefined }));
    }
  };
  const onStage1CountryCodeChange = (v: string) => {
    setCountryCode(v);
    if (stage1FieldErrors.phoneNumber) {
      setStage1FieldErrors((p) => ({ ...p, phoneNumber: undefined }));
    }
  };
  const onStage1PhoneNumberChange = (v: string) => {
    setPhoneNumber(v);
    if (stage1FieldErrors.phoneNumber) {
      setStage1FieldErrors((p) => ({ ...p, phoneNumber: undefined }));
    }
  };
  const onStage1EmailChange = (v: string) => {
    setEmail(v);
    if (stage1FieldErrors.email) {
      setStage1FieldErrors((p) => ({ ...p, email: undefined }));
    }
  };
  const onStage1PasswordChange = (v: string) => {
    setPassword(v);
    if (stage1FieldErrors.password) {
      setStage1FieldErrors((p) => ({ ...p, password: undefined }));
    }
  };
  const onStage1ConfirmPasswordChange = (v: string) => {
    setConfirmPassword(v);
    if (stage1FieldErrors.confirmPassword) {
      setStage1FieldErrors((p) => ({ ...p, confirmPassword: undefined }));
    }
  };
  const onStage1AcceptedTermsChange = (next: boolean) => {
    setAcceptedTerms(next);
    if (stage1FieldErrors.acceptedTerms) {
      setStage1FieldErrors((p) => ({ ...p, acceptedTerms: undefined }));
    }
  };

  const onStage1Continue = async () => {
    setStage1Error(null);
    setStage1FieldErrors({});

    // Client-side checks (mirror backend expectations)
    const errs: typeof stage1FieldErrors = {};
    if (!firstName.trim()) errs.firstName = "First name is required";
    else if (!isValidPersonName(firstName))
      errs.firstName =
        "First name can only contain letters, hyphen (-) and apostrophe (')";

    if (!lastName.trim()) errs.lastName = "Last name is required";
    else if (!isValidPersonName(lastName))
      errs.lastName =
        "Last name can only contain letters, hyphen (-) and apostrophe (')";

    if (!accountType.trim()) errs.accountType = "Account type is required";
    if (!stage1Phone.trim()) errs.phoneNumber = "Phone number is required";
    if (!isValidEmail(email)) errs.email = "Enter a valid email address";
    if (!acceptedTerms) errs.acceptedTerms = "Please confirm to continue";

    const pwdCheck = checkPasswordValidity(password);
    if (pwdCheck !== true) errs.password = pwdCheck;
    if (!confirmPassword.trim()) errs.confirmPassword = "Confirm your password";
    else if (confirmPassword !== password)
      errs.confirmPassword = "Passwords do not match";

    if (Object.keys(errs).length > 0) {
      setStage1FieldErrors(errs);
      return;
    }

    try {
      setStage1Loading(true);
      const res = await accountCreationWeb({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        accountType: accountType.trim(),
        phoneNumber: stage1Phone,
        emailAddress: email.trim(),
        password,
        confirmPassword,
      });
      console.log("[Stage 1] account-creation-web response:", res);

      const msgLower = String(res?.message || "").toLowerCase();
      const looksLikeExistingEmail =
        msgLower.includes("email") &&
        (msgLower.includes("already exist") ||
          msgLower.includes("already exists") ||
          msgLower.includes("already registered") ||
          msgLower.includes("already in use"));

      // Some backend versions return existing-email as { status: false, statusCode: 400/409 }
      // without throwing. Treat it as a resume-onboarding signal.
      const statusCode = (res as any)?.statusCode;
      if (
        !res?.status &&
        (looksLikeExistingEmail || statusCode === 400 || statusCode === 409)
      ) {
        try {
          const emailValue = email.trim();
          const v = await verifyEmailAddress({
            type: "personal",
            emailAddress: emailValue,
            businessName: "",
          });
          const d: any = v?.data || null;

          // If PIN is already created, user should just login normally.
          if (Boolean(d?.stage3_5)) {
            showSuccessToast("Success", "Continue your onboarding process");
            router.push("/login");
            return;
          }

          // Attempt background login to continue onboarding.
          let resumeUserId: number | null = null;
          let resumeAccountId: number | null = null;
          try {
            const loginRes = await securityLogin({
              emailAddress: emailValue,
              password,
            });
            console.log("[Stage 1] auth/login (resume) response:", loginRes);
            if (!loginRes?.status || !loginRes?.data?.sessionToken) {
              throw new Error("Unable to create login session");
            }

            setUserEmail(emailValue);
            resumeUserId = loginRes.data.userId;
            resumeAccountId = loginRes.data.accountId;
            setAuthSession({
              accountId: loginRes.data.accountId,
              userId: loginRes.data.userId,
              firstName: loginRes.data.firstName,
              lastName: loginRes.data.lastName,
              refreshToken: loginRes.data.refreshToken,
              sessionToken: loginRes.data.sessionToken,
              expires: loginRes.data.expires,
              refreshTokenExpiryTime: loginRes.data.refreshTokenExpiryTime,
              enforcePassword: loginRes.data.enforcePassword,
              stage1: Boolean((loginRes.data as any).stage1),
              stage1_5: Boolean((loginRes.data as any).stage1_5),
              stage2: Boolean((loginRes.data as any).stage2),
              stage3: Boolean((loginRes.data as any).stage3),
              stage3_5: Boolean((loginRes.data as any).stage3_5),
              stage4: Boolean((loginRes.data as any).stage4),
              kycStatus:
                typeof (loginRes.data as any).kycStatus === "number"
                  ? (loginRes.data as any).kycStatus
                  : Number.isFinite(Number((loginRes.data as any).kycStatus))
                    ? Number((loginRes.data as any).kycStatus)
                    : undefined,
              ninVerified: Boolean(
                (loginRes.data as any).ninVerified ??
                  (loginRes.data as any).isNINVerified,
              ),
            });
          } catch {
            setStage1FieldErrors((p) => ({ ...p, password: "Wrong password" }));
            return;
          }

          showSuccessToast("Success", "Continue your onboarding process");

          const stage1Done = Boolean(d?.stage1);
          const stage1_5Done = Boolean(d?.stage1_5 ?? d?.emailVerified);
          const stage2Done = Boolean(d?.stage2);
          const stage3Done = Boolean(d?.stage3);

          if (stage1Done && !stage1_5Done) {
            setStage1SignupContext((prev) => ({
              ...prev,
              userId:
                typeof d?.userId === "number"
                  ? d.userId
                  : resumeUserId ?? prev.userId,
              accountId: resumeAccountId ?? prev.accountId,
              emailAddress: emailValue,
              password,
            }));
            setEmail(emailValue);
            try {
              setOtpLoading(true);
              await webGenerateOtp(emailValue, 1);
            } finally {
              setOtpLoading(false);
            }
            setOtpOpen(true);
            clearStage1Form();
            return;
          }
          if (stage1Done && !stage2Done) {
            setStage(2);
            clearStage1Form();
            return;
          }
          if (stage2Done && !stage3Done) {
            setStage(3);
            clearStage1Form();
            clearStage2Form();
            return;
          }
          if (stage3Done && !Boolean(d?.stage3_5)) {
            setStage(3);
            setPinOpen(true);
            clearStage1Form();
            clearStage2Form();
            clearStage3Form();
            return;
          }

          router.push("/login");
          return;
        } catch (inner) {
          const msg =
            inner instanceof Error
              ? inner.message
              : "Something went wrong. Please try again.";
          setStage1Error(msg);
          return;
        }
      }

      if (!res?.status) {
        setStage1Error(res?.message || "Unable to create account. Please try again.");
        return;
      }

      const userId = res?.data?.userId;
      const accountId = res?.data?.accountId;
      if (!userId || !accountId) {
        return setStage1Error("Invalid signup response. Please try again.");
      }
      setStage1SignupContext({
        userId,
        accountId,
        emailAddress: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      setUserEmail(email.trim());
      setOtpOpen(true);
      // Persist needed context, but clear Stage 1 inputs
      // so navigating back shows an empty form.
      clearStage1Form();
    } catch (e) {
      // If the email already exists, treat it as a resume onboarding flow.
      if (e instanceof ApiError && (e.status === 409 || e.status === 400)) {
        try {
          const emailValue = email.trim();
          const msgLower = String(e.message || "").toLowerCase();
          const looksLikeExistingEmail =
            msgLower.includes("email") &&
            (msgLower.includes("already exist") ||
              msgLower.includes("already exists") ||
              msgLower.includes("already registered") ||
              msgLower.includes("already in use"));
          if (!looksLikeExistingEmail && e.status !== 409) {
            // Not an "email exists" case; fall back to normal error handling below.
            throw e;
          }
          const v = await verifyEmailAddress({
            type: "personal",
            emailAddress: emailValue,
            businessName: "",
          });
          const d: any = v?.data || null;

          // If PIN is already created, user should just login normally.
          if (Boolean(d?.stage3_5)) {
            showSuccessToast("Success", "Continue your onboarding process");
            router.push("/login");
            return;
          }

          // Attempt background login to continue onboarding.
          let resumeUserId: number | null = null;
          let resumeAccountId: number | null = null;
          try {
            const loginRes = await securityLogin({
              emailAddress: emailValue,
              password,
            });
            console.log("[Stage 1] auth/login (resume) response:", loginRes);
            if (!loginRes?.status || !loginRes?.data?.sessionToken) {
              throw new Error("Unable to create login session");
            }

            setUserEmail(emailValue);
            resumeUserId = loginRes.data.userId;
            resumeAccountId = loginRes.data.accountId;
            setAuthSession({
              accountId: loginRes.data.accountId,
              userId: loginRes.data.userId,
              firstName: loginRes.data.firstName,
              lastName: loginRes.data.lastName,
              refreshToken: loginRes.data.refreshToken,
              sessionToken: loginRes.data.sessionToken,
              expires: loginRes.data.expires,
              refreshTokenExpiryTime: loginRes.data.refreshTokenExpiryTime,
              enforcePassword: loginRes.data.enforcePassword,
              stage1: Boolean((loginRes.data as any).stage1),
              stage1_5: Boolean((loginRes.data as any).stage1_5),
              stage2: Boolean((loginRes.data as any).stage2),
              stage3: Boolean((loginRes.data as any).stage3),
              stage3_5: Boolean((loginRes.data as any).stage3_5),
              stage4: Boolean((loginRes.data as any).stage4),
              kycStatus:
                typeof (loginRes.data as any).kycStatus === "number"
                  ? (loginRes.data as any).kycStatus
                  : Number.isFinite(Number((loginRes.data as any).kycStatus))
                    ? Number((loginRes.data as any).kycStatus)
                    : undefined,
              ninVerified: Boolean(
                (loginRes.data as any).ninVerified ??
                  (loginRes.data as any).isNINVerified,
              ),
            });
          } catch {
            setStage1FieldErrors((p) => ({ ...p, password: "Wrong password" }));
            return;
          }

          showSuccessToast("Success", "Continue your onboarding process");

          const stage1Done = Boolean(d?.stage1);
          const stage1_5Done = Boolean(d?.stage1_5 ?? d?.emailVerified);
          const stage2Done = Boolean(d?.stage2);
          const stage3Done = Boolean(d?.stage3);

          if (stage1Done && !stage1_5Done) {
            setStage1SignupContext((prev) => ({
              ...prev,
              userId:
                typeof d?.userId === "number"
                  ? d.userId
                  : resumeUserId ?? prev.userId,
              accountId: resumeAccountId ?? prev.accountId,
              emailAddress: emailValue,
              password,
            }));
            setEmail(emailValue);
            try {
              setOtpLoading(true);
              await webGenerateOtp(emailValue, 1);
            } finally {
              setOtpLoading(false);
            }
            setOtpOpen(true);
            clearStage1Form();
            return;
          }
          if (stage1Done && !stage2Done) {
            setStage(2);
            clearStage1Form();
            return;
          }
          if (stage2Done && !stage3Done) {
            setStage(3);
            clearStage1Form();
            clearStage2Form();
            return;
          }
          if (stage3Done && !Boolean(d?.stage3_5)) {
            setStage(3);
            setPinOpen(true);
            clearStage1Form();
            clearStage2Form();
            clearStage3Form();
            return;
          }

          // Fallback: send user to login.
          router.push("/login");
          return;
        } catch (inner) {
          const msg =
            inner instanceof Error
              ? inner.message
              : "Something went wrong. Please try again.";
          setStage1Error(msg);
          return;
        }
      }

      if (e instanceof ApiError) setStage1Error(e.message);
      else if (e instanceof Error) setStage1Error(e.message);
      else setStage1Error("Something went wrong. Please try again.");
    } finally {
      setStage1Loading(false);
    }
  };

  const stage2CanSubmit = useMemo(() => {
    if (!bvn.trim()) return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob.trim())) return false;
    if (!country.trim()) return false;
    if (!address.trim()) return false;
    if (!city.trim()) return false;
    if (!state.trim()) return false;
    return true;
  }, [bvn, dob, country, address, city, state]);

  const onStage2DobChange = (v: string) => {
    setDob(v);
    if (stage2FieldErrors.dob) {
      setStage2FieldErrors((p) => ({ ...p, dob: undefined }));
    }
  };
  const onStage2BvnChange = (v: string) => {
    setBvn(v);
    if (stage2FieldErrors.bvn) {
      setStage2FieldErrors((p) => ({ ...p, bvn: undefined }));
    }
  };
  const onStage2CountryChange = (v: string) => {
    setCountry(v);
    setStateCode("");
    setState_("");
    setCity("");
    if (stage2FieldErrors.country) {
      setStage2FieldErrors((p) => ({ ...p, country: undefined }));
    }
  };
  const onStage2AddressChange = (v: string) => {
    setAddress(v);
    if (stage2FieldErrors.address) {
      setStage2FieldErrors((p) => ({ ...p, address: undefined }));
    }
  };
  const onStage2StateCodeChange = (code: string) => {
    setStateCode(code);
    const found = stateOptions.find((s) => s.value === code);
    setState_(found?.label || "");
    setCity("");
    if (stage2FieldErrors.state) {
      setStage2FieldErrors((p) => ({ ...p, state: undefined }));
    }
  };
  const onStage2CityChange = (v: string) => {
    setCity(v);
    if (stage2FieldErrors.city) {
      setStage2FieldErrors((p) => ({ ...p, city: undefined }));
    }
  };

  const onStage2Continue = async () => {
    setStage2Error(null);
    setStage2FieldErrors({});

    const dobValue = dob.trim();
    const errs: typeof stage2FieldErrors = {};
    if (!bvn.trim()) errs.bvn = "BVN is required";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dobValue)) {
      errs.dob = "Date of birth must be in YYYY-MM-DD format";
    }
    if (!country.trim()) errs.country = "Country of residence is required";
    if (!address.trim()) errs.address = "Residential address is required";
    if (!state.trim()) errs.state = "State is required";
    if (!city.trim()) errs.city = "City is required";
    if (Object.keys(errs).length > 0) {
      setStage2FieldErrors(errs);
      return;
    }

    try {
      setStage2Loading(true);
      const res = await validateIdentityAddress({
        bvn: bvn.trim(),
        dateOfBirth: dobValue,
        countryOfResidency: country.trim(),
        residentialAddress: address.trim(),
        city: city.trim(),
        state: state.trim(),
      });
      console.log("[Stage 2] validate-identity-address response:", res);

      showSuccessToast("Success", res?.message || "Identity verified successfully");
      setStage(3);
      // Clear Stage 2 inputs after successful submission.
      clearStage2Form();
    } catch (e) {
      if (e instanceof ApiError) {
        setStage2Error(e.message);
      } else if (e instanceof Error) {
        setStage2Error(e.message);
      } else {
        setStage2Error("Unable to validate identity. Please try again.");
      }
    } finally {
      setStage2Loading(false);
    }
  };

  const selectedBank = useMemo(() => {
    if (!bankName) return null;
    const b = banks.find((x) => x.bankCode === bankName);
    return b || null;
  }, [bankName, banks]);

  const onStage3BankNameChange = (v: string) => {
    setBankName(v);
    setStage3Error(null);
    setAccountName("");
    lastResolvedKeyRef.current = "";
    if (stage3FieldErrors.bankName) {
      setStage3FieldErrors((p) => ({ ...p, bankName: undefined }));
    }
    if (stage3FieldErrors.accountName) {
      setStage3FieldErrors((p) => ({ ...p, accountName: undefined }));
    }
  };

  const onStage3AccountNumberChange = (digits: string) => {
    setAccountNumber(digits);
    setStage3Error(null);
    setAccountName("");
    lastResolvedKeyRef.current = "";
    if (stage3FieldErrors.accountNumber) {
      setStage3FieldErrors((p) => ({ ...p, accountNumber: undefined }));
    }
    if (stage3FieldErrors.accountName) {
      setStage3FieldErrors((p) => ({ ...p, accountName: undefined }));
    }
  };

  const onStage3Continue = async () => {
    setStage3Error(null);
    setStage3FieldErrors({});
    const bankCode = bankName.trim();
    const acctNo = accountNumber.trim();
    const acctName = accountName.trim();
    const bankLabel = selectedBank?.bankName?.trim() || "";

    const errs: typeof stage3FieldErrors = {};
    if (!bankCode) errs.bankName = "Select a bank";
    if (!acctNo) errs.accountNumber = "Account number is required";
    else if (acctNo.length < 10) errs.accountNumber = "Enter a valid account number";
    if (!acctName) errs.accountName = "Resolve account name to continue";
    if (Object.keys(errs).length > 0) {
      setStage3FieldErrors(errs);
      return;
    }

    try {
      setStage3Loading(true);
      const res = await createWithdrawalAccount({
        bankCode,
        bankName: bankLabel || bankCode,
        accountName: acctName,
        accountNumber: acctNo,
      });
      console.log("[Stage 3] withdrawal/create response:", res);
      showSuccessToast("Success", res?.message || "Bank details saved successfully");
      setPinOpen(true);
      // Clear Stage 3 inputs after successful submission.
      clearStage3Form();
    } catch (e) {
      if (e instanceof ApiError) setStage3Error(e.message);
      else if (e instanceof Error) setStage3Error(e.message);
      else setStage3Error("Unable to save bank details. Please try again.");
    } finally {
      setStage3Loading(false);
    }
  };

  const bankOptions = useMemo(() => {
    return banks
      .filter(
        (b) =>
          b &&
          typeof b.bankCode === "string" &&
          b.bankCode.trim() !== "" &&
          typeof b.bankName === "string" &&
          b.bankName.trim() !== "",
      )
      .map((b) => ({ label: b.bankName, value: b.bankCode }));
  }, [banks]);

  const countryOptions = useMemo(() => {
    const fetched = countries
      .filter((c) => c && typeof c.name === "string" && c.name.trim() !== "")
      .map((c) => ({ label: c.name, value: c.code || c.name }));

    const fallback = [
      { label: "Nigeria", value: "NG" },
      { label: "Ghana", value: "GH" },
    ];

    return fetched.length > 0 ? fetched : fallback;
  }, [countries]);

  const stateOptions = useMemo(() => {
    const cc = (country || "").trim();
    if (!cc) return [];
    try {
      return State.getStatesOfCountry(cc).map((s) => ({
        label: s.name,
        value: s.isoCode,
      }));
    } catch {
      return [];
    }
  }, [country]);

  const cityOptions = useMemo(() => {
    const cc = (country || "").trim();
    const sc = (stateCode || "").trim();
    if (!cc || !sc) return [];
    try {
      return City.getCitiesOfState(cc, sc).map((c) => ({
        label: c.name,
        value: c.name,
      }));
    } catch {
      return [];
    }
  }, [country, stateCode]);

  // If we have a saved state name but no stateCode yet, try to infer it.
  useEffect(() => {
    if (!country.trim()) return;
    if (!state.trim()) return;
    if (stateCode.trim()) return;
    const match = stateOptions.find(
      (s) => s.label.trim().toLowerCase() === state.trim().toLowerCase(),
    );
    if (match) setStateCode(match.value);
  }, [country, state, stateCode, stateOptions]);

  useEffect(() => {
    if (stage !== 3) return;
    const ac = new AbortController();
    (async () => {
      try {
        setBanksError(null);
        setBanksLoading(true);
        const res = await getBanks(ac.signal);
        if (res?.status && Array.isArray(res.data)) {
          setBanks(res.data);
        } else {
          setBanksError(res?.message || "Unable to load banks");
        }
      } catch (e) {
        if (isAbortError(e)) return;
        if (e instanceof ApiError) setBanksError(e.message);
        else if (e instanceof Error) setBanksError(e.message);
        else setBanksError("Unable to load banks");
      } finally {
        setBanksLoading(false);
      }
    })();
    return () => ac.abort();
  }, [stage]);

  useEffect(() => {
    if (stage !== 2) return;
    const ac = new AbortController();
    (async () => {
      try {
        setCountriesError(null);
        setCountriesLoading(true);
        const res = await getCountries(ac.signal);
        if (res?.status && Array.isArray(res.data)) {
          setCountries(res.data);
        } else {
          setCountriesError(res?.message || "Unable to load countries");
        }
      } catch (e) {
        if (isAbortError(e)) return;
        if (e instanceof ApiError) setCountriesError(e.message);
        else if (e instanceof Error) setCountriesError(e.message);
        else setCountriesError("Unable to load countries");
      } finally {
        setCountriesLoading(false);
      }
    })();
    return () => ac.abort();
  }, [stage]);

  useEffect(() => {
    if (stage !== 4) return;
    const ac = new AbortController();
    (async () => {
      try {
        setRatesError(null);
        setRatesLoading(true);
        const res = await getRates(ac.signal);
        console.log("[Stage 4] webinvestment/get-rate response:", res);
        if (res?.status && Array.isArray(res.data)) {
          setRates(res.data);
        } else {
          setRatesError(res?.message || "Unable to load rates");
        }
      } catch (e) {
        if (isAbortError(e)) return;
        if (e instanceof ApiError) setRatesError(e.message);
        else if (e instanceof Error) setRatesError(e.message);
        else setRatesError("Unable to load rates");
      } finally {
        setRatesLoading(false);
      }
    })();
    return () => ac.abort();
  }, [stage]);

  // Stage 3: auto-resolve account name when account number reaches 10 digits.
  useEffect(() => {
    if (stage !== 3) return;
    const bankCode = (bankName || "").trim();
    const acctNo = (accountNumber || "").replace(/\D/g, "").trim();
    if (!bankCode || acctNo.length !== 10) {
      setAccountResolveLoading(false);
      lastResolvedKeyRef.current = "";
      return;
    }

    const key = `${bankCode}:${acctNo}`;
    if (lastResolvedKeyRef.current === key && accountName.trim()) return;

    const seq = ++resolveSeqRef.current;
    setStage3Error(null);
    setStage3FieldErrors((p) => ({ ...p, accountName: undefined }));
    setAccountResolveLoading(true);
    // Cache the attempted key immediately to avoid duplicate calls
    // (e.g. React StrictMode dev double-invokes effects).
    lastResolvedKeyRef.current = key;

    (async () => {
      try {
        const res = await validateAccount({
          bankCode,
          accountNumber: acctNo,
        });
        if (resolveSeqRef.current !== seq) return;
        console.log("[Stage 3] withdrawal/validate-account response:", res);

        const data = res?.data as any;
        const resolved = (() => {
          // v2 validate-account can return account name in `message` with `data: null`
          const msg =
            typeof (res as any)?.message === "string"
              ? String((res as any).message).trim()
              : "";
          if (msg && !/^\s*successful\s*$/i.test(msg)) return msg;

          if (!data) return "";
          if (typeof data === "string") return data.trim();
          if (typeof data !== "object") return "";
          const direct = typeof data.accountName === "string" ? data.accountName.trim() : "";
          if (direct) return direct;
          const nestedData = (data as any).data;
          if (typeof nestedData === "string") return nestedData.trim();
          if (nestedData && typeof nestedData === "object") {
            const deep = (nestedData as any).data;
            if (typeof deep === "string") return deep.trim();
            const deepName = (nestedData as any).accountName;
            if (typeof deepName === "string") return deepName.trim();
          }
          return "";
        })();

        if (!resolved) {
          setAccountName("");
          setStage3Error("Unable to resolve account name. Please confirm details.");
          return;
        }

        setAccountName(resolved);
        setStage3FieldErrors((p) => ({ ...p, accountName: undefined }));
      } catch (e) {
        if (resolveSeqRef.current !== seq) return;
        setAccountName("");
        if (e instanceof ApiError) setStage3Error(e.message);
        else if (e instanceof TypeError && /failed to fetch/i.test(String(e.message || ""))) {
          setStage3Error("Unable to validate account. Please check your connection and try again.");
        } else if (e instanceof Error) setStage3Error(e.message);
        else setStage3Error("Unable to validate account. Please try again.");
      } finally {
        if (resolveSeqRef.current === seq) setAccountResolveLoading(false);
      }
    })();
  }, [accountName, accountNumber, bankName, stage]);

  useEffect(() => {
    if (stage !== 6) {
      fundCalledRef.current = false;
      return;
    }
    if (fundCalledRef.current) return;
    if (checkout || checkoutRef) return;

    const investmentId = createdInvestmentId;
    if (investmentId == null) {
      setFundingError("Missing investment ID. Please go back and try again.");
      return;
    }
    if (!investmentTransactionPin || investmentTransactionPin.length !== 4) {
      setFundingError("Missing transaction PIN. Please go back and try again.");
      return;
    }

    fundCalledRef.current = true;
    setFundingError(null);
    setCheckout(null);
    setCheckoutRef(null);

    (async () => {
      try {
        setFundingLoading(true);
        const amt = parseMoney(investmentAmount);
        const payload = {
          paymentOptionId: 2,
          investmentId,
          amount: amt,
          transactionPin: investmentTransactionPin,
        };
        console.log("[Stage 6] investment/fund payload:", payload);
        const res = await fundInvestment(payload);
        console.log("[Stage 6] investment/fund response:", res);
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
      } catch (e) {
        fundCalledRef.current = false; // allow retry if user stays on stage 6
        if (e instanceof ApiError) setFundingError(e.message);
        else if (e instanceof Error) setFundingError(e.message);
        else setFundingError("Unable to fund investment. Please try again.");
      } finally {
        setFundingLoading(false);
      }
    })();
  }, [
    checkout,
    checkoutRef,
    createdInvestmentId,
    investmentAmount,
    investmentTransactionPin,
    stage,
  ]);

  return (
    <OnboardingShell stage={progressStage} totalStages={4}>
      <div className="w-full relative get-started-labels-black">
        <LoadingOverlay
          show={
            stage1Loading ||
            otpLoading ||
            stage2Loading ||
            stage3Loading ||
            accountResolveLoading ||
            ratesLoading ||
            expectedReturnLoading ||
            createInvestmentLoading ||
            fundingLoading
          }
          label="Loading..."
        />
        {stage === 1 ? (
          <Stage1AccountCreation
            firstName={firstName}
            lastName={lastName}
            accountType={accountType}
            countryCode={countryCode}
            phoneNumber={phoneNumber}
            email={email}
            password={password}
            confirmPassword={confirmPassword}
            acceptedTerms={acceptedTerms}
            stage1Error={stage1Error}
            stage1Loading={stage1Loading}
            stage1FieldErrors={stage1FieldErrors}
            accountTypeOptions={accountTypeOptions}
            accountTypesLoading={accountTypesLoading}
            accountTypesError={accountTypesError}
            sanitizeNameInput={sanitizeNameInput}
            onFirstNameChange={onStage1FirstNameChange}
            onLastNameChange={onStage1LastNameChange}
            onAccountTypeChange={onStage1AccountTypeChange}
            onCountryCodeChange={onStage1CountryCodeChange}
            onPhoneNumberChange={onStage1PhoneNumberChange}
            onEmailChange={onStage1EmailChange}
            onPasswordChange={onStage1PasswordChange}
            onConfirmPasswordChange={onStage1ConfirmPasswordChange}
            onAcceptedTermsChange={onStage1AcceptedTermsChange}
            onContinue={onStage1Continue}
            onSignIn={() => router.push("/login")}
          />
        ) : stage === 2 ? (
          <Stage2Verification
            stage2Error={stage2Error}
            stage2Loading={stage2Loading}
            stage2FieldErrors={stage2FieldErrors}
            dob={dob}
            bvn={bvn}
            country={country}
            address={address}
            stateCode={stateCode}
            city={city}
            countriesLoading={countriesLoading}
            countriesError={countriesError}
            countryOptions={countryOptions}
            stateOptions={stateOptions}
            cityOptions={cityOptions}
            onBack={() => setStage(1)}
            onDobChange={onStage2DobChange}
            onBvnChange={onStage2BvnChange}
            onCountryChange={onStage2CountryChange}
            onAddressChange={onStage2AddressChange}
            onStateCodeChange={onStage2StateCodeChange}
            onCityChange={onStage2CityChange}
            onContinue={onStage2Continue}
          />
        ) : stage === 3 ? (
          <Stage3BankDetails
            stage3Error={stage3Error}
            stage3Loading={stage3Loading}
            stage3FieldErrors={stage3FieldErrors}
            banksLoading={banksLoading}
            banksError={banksError}
            bankName={bankName}
            bankOptions={bankOptions}
            accountNumber={accountNumber}
            accountName={accountName}
            accountResolveLoading={accountResolveLoading}
            canContinue={
              Boolean(bankName.trim()) &&
              (accountNumber || "").replace(/\D/g, "").trim().length === 10 &&
              Boolean(accountName.trim()) &&
              !accountResolveLoading
            }
            onBack={() => setStage(2)}
            onBankNameChange={onStage3BankNameChange}
            onAccountNumberChange={onStage3AccountNumberChange}
            onContinue={onStage3Continue}
          />
        ) : stage === 4 ? (
          <Stage4Investment
            ratesError={ratesError}
            expectedReturnError={expectedReturnError}
            isStage4Ready={isStage4Ready}
            expectedReturnLoading={expectedReturnLoading}
            ratesLoading={ratesLoading}
            tenorOptions={tenorOptions}
            selectedRateId={selectedRateId}
            investmentAmount={investmentAmount}
            minInvestmentText="Minimum investment is ₦50"
            selectedRatePa={selectedRatePa}
            selectedTenorDays={selectedTenorDays}
            onGoDashboard={onStage4GoDashboard}
            onReviewConfirm={onStage4ReviewConfirm}
            onAmountChange={onStage4AmountChange}
            onSelectRate={onStage4SelectRate}
          />
        ) : stage === 5 ? (
          <Stage5ConfirmInvestment
            createInvestmentError={createInvestmentError}
            createInvestmentLoading={createInvestmentLoading}
            isStage4Ready={isStage4Ready}
            selectedRatePa={selectedRatePa}
            selectedTenorDays={selectedTenorDays}
            investmentAmount={investmentAmount}
            expectedReturn={expectedReturn}
            totalAtMaturity={totalAtMaturity}
            maturityDateText={maturityDateText}
            acknowledgeInvestment={acknowledgeInvestment}
            onBack={() => setStage(4)}
            onAcknowledgeChange={setAcknowledgeInvestment}
            onProceedToPayment={onStage5ProceedToPayment}
          />
        ) : stage === 6 ? (
          <Stage6Payment
            fundingError={fundingError}
            fundingLoading={fundingLoading}
            investmentAmount={investmentAmount}
            bankName={checkout?.bankName || "-"}
            accountNumber={checkout?.accountNumber || "-"}
            accountName={checkout?.accountName || "-"}
            expiryFormatted={expiryCountdown.formatted}
            totalToTransferFormatted={formatNGN(parseMoney(investmentAmount) + 50)}
            onBack={() => setStage(5)}
            onMadePayment={onStage6MadePayment}
          />
        ) : stage === 7 ? (
          <Stage7Processing onGoDashboard={onStage7GoDashboard} />
        ) : null}

        <OtpModal
          open={otpOpen}
          setOpen={setOtpOpen}
          email={(stage1SignupContext.emailAddress || getUserEmail() || email || "").trim()}
          isLoading={otpLoading}
          confirmLabel="Verify"
          onResend={async () => {
            const e = (stage1SignupContext.emailAddress || getUserEmail() || email || "").trim();
            if (!e) {
              setStage1Error("Missing email. Please submit Stage 1 again.");
              return;
            }
            try {
              setStage1Error(null);
              setOtpLoading(true);
              const res = await webGenerateOtp(e, 1);
              console.log(
                "[Stage 1] otp/web-generate-otp (resend) response:",
                res,
              );
              showSuccessToast("Success", "OTP resent successfully");
            } catch (err) {
              if (err instanceof ApiError) setStage1Error(err.message);
              else if (err instanceof Error) setStage1Error(err.message);
              else setStage1Error("Unable to resend OTP. Please try again.");
            } finally {
              setOtpLoading(false);
            }
          }}
          onConfirm={async (otp) => {
            try {
              setOtpLoading(true);
              const authMode =
                Boolean(stage1SignupContext.emailAddress) &&
                Boolean(stage1SignupContext.password);

              if (authMode) {
                const otpRes = await webValidateOtp(stage1SignupContext.userId, otp);
                console.log("[Stage 1] otp/web-validate-otp response:", otpRes);

                // Login in the background with Stage 1 credentials.
                const loginRes = await securityLogin({
                  emailAddress: stage1SignupContext.emailAddress,
                  password: stage1SignupContext.password,
                });
                console.log("[Stage 1] auth/login response:", loginRes);

                if (!loginRes?.status || !loginRes?.data?.sessionToken) {
                  throw new Error("Unable to create login session");
                }

                setAuthSession({
                  accountId: loginRes.data.accountId,
                  userId: loginRes.data.userId,
                  firstName: loginRes.data.firstName,
                  lastName: loginRes.data.lastName,
                  refreshToken: loginRes.data.refreshToken,
                  sessionToken: loginRes.data.sessionToken,
                  expires: loginRes.data.expires,
                  refreshTokenExpiryTime: loginRes.data.refreshTokenExpiryTime,
                  enforcePassword: loginRes.data.enforcePassword,
                  stage1: Boolean((loginRes.data as any).stage1),
                  stage1_5: Boolean((loginRes.data as any).stage1_5),
                  stage2: Boolean((loginRes.data as any).stage2),
                  stage3: Boolean((loginRes.data as any).stage3),
                  stage3_5: Boolean((loginRes.data as any).stage3_5),
                  stage4: Boolean((loginRes.data as any).stage4),
                  kycStatus:
                    typeof (loginRes.data as any).kycStatus === "number"
                      ? (loginRes.data as any).kycStatus
                      : Number.isFinite(Number((loginRes.data as any).kycStatus))
                        ? Number((loginRes.data as any).kycStatus)
                        : undefined,
                  ninVerified: Boolean(
                    (loginRes.data as any).ninVerified ??
                      (loginRes.data as any).isNINVerified
                  ),
                });
              } else {
                const ses = getAuthSession();
                if (!ses?.userId) {
                  throw new Error("Missing user session. Please login again.");
                }
                const otpRes = await webValidateOtp(ses.userId, otp);
                console.log("[Stage 1] otp/web-validate-otp response:", otpRes);
                setAuthSession({
                  ...ses,
                  stage1: true,
                  stage1_5: true,
                });
              }

              setStage1Error(null);
              setOtpOpen(false);
              showSuccessToast("Success", "OTP Verified Successfully");
              setStage(2);
            } catch (e) {
              if (e instanceof ApiError) {
                setStage1Error(e.message);
              } else if (e instanceof Error) {
                setStage1Error(e.message);
              } else {
                setStage1Error("OTP verification failed. Please try again.");
              }
            } finally {
              setOtpLoading(false);
            }
          }}
        />

        <CreateTransactionPinModal
          open={pinOpen}
          setOpen={setPinOpen}
          onVerified={() => {
            setStage(4);
          }}
        />

        <EnterTransactionPinModal
          open={investmentPinOpen}
          setOpen={setInvestmentPinOpen}
          onProceed={async (pin) => {
            setCreateInvestmentError(null);
            const amt = parseMoney(investmentAmount);
            if (!selectedTenorId || !selectedTypeId) {
              throw new Error("Missing tenor selection. Please go back.");
            }
            if (expectedReturn == null || !Number.isFinite(expectedReturn)) {
              throw new Error("Missing expected return. Please go back.");
            }
            if (amt < MIN_INVESTMENT_NGN) {
              throw new Error("Minimum investment is ₦50");
            }
            if (!acknowledgeInvestment) {
              throw new Error("Please confirm to continue");
            }
            try {
              setCreateInvestmentLoading(true);
              setFundingError(null);
              setFundingLoading(true);
              setCheckout(null);
              setCheckoutRef(null);
              setCheckoutExpiryAtMs(null);
              setInvestmentTransactionPin(pin);
              let investmentId = createdInvestmentId;
              if (investmentId == null) {
                const res = await createInvestment({
                  amount: amt,
                  expectedReturn,
                  typeId: selectedTypeId,
                  tenorId: selectedTenorId,
                  acknowledge: true,
                });
                console.log("[Stage 5] webinvestment/create response:", res);
                const id = extractInvestmentId(res?.data);
                if (id == null) {
                  throw new Error("Missing investment ID from create response.");
                }
                investmentId = id;
                setCreatedInvestmentId(id);
              }

              const payload = {
                paymentOptionId: 2,
                investmentId,
                amount: amt,
                transactionPin: pin,
              };
              console.log("[Stage 5] investment/fund payload:", payload);
              const fundRes = await fundInvestment(payload);
              console.log("[Stage 5] investment/fund response:", fundRes);

              setCheckoutRef(typeof fundRes?.message === "string" ? fundRes.message : null);
              const raw = (fundRes as any)?.data;
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

              // prevent stage 6 auto-fund effect from running again
              fundCalledRef.current = true;
              setStage(6);
            } catch (e) {
              if (e instanceof ApiError) throw new Error(e.message);
              if (e instanceof Error) throw e;
              throw new Error("Unable to create investment. Please try again.");
            } finally {
              setCreateInvestmentLoading(false);
              setFundingLoading(false);
            }
          }}
        />
      </div>
    </OnboardingShell>
  );
}
