"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAtom } from "jotai";
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
import { useRouter } from "next/navigation";
import { accountCreationWeb } from "@/services/signup";
import { ApiError } from "@/lib/apiClient";
import { checkPasswordValidity } from "@/lib/password";
import { getAccountTypes } from "@/services/account";
import { securityLogin } from "@/services/auth";
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

  const stage2CanSubmit = useMemo(() => {
    if (!bvn.trim()) return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob.trim())) return false;
    if (!country.trim()) return false;
    if (!address.trim()) return false;
    if (!city.trim()) return false;
    if (!state.trim()) return false;
    return true;
  }, [bvn, dob, country, address, city, state]);

  const selectedBank = useMemo(() => {
    if (!bankName) return null;
    const b = banks.find((x) => x.bankCode === bankName);
    return b || null;
  }, [bankName, banks]);

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
    setAccountResolveLoading(true);

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

        lastResolvedKeyRef.current = key;
        setAccountName(resolved);
      } catch (e) {
        if (resolveSeqRef.current !== seq) return;
        setAccountName("");
        if (e instanceof ApiError) setStage3Error(e.message);
        else if (e instanceof Error) setStage3Error(e.message);
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
  }, [createdInvestmentId, investmentAmount, investmentTransactionPin, stage]);

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
          <>
            {/* Align title with the left edge of the form card */}
            <div className="mx-auto w-full max-w-[640px]">
              <h1 className="text-left text-[16px] font-bold text-[#2E2E2E]">
                Get Started!
              </h1>
            </div>

            <OnboardingCard
              stepLine={
                <p className="text-[18px] font-medium text-[#2E2E2E]">
                  Step <span className="text-[#2E2E2E]">1/</span>
                  <span className="text-[#979797]">4</span>
                  <span className="text-[#2E2E2E]"> - Account Creation</span>
                </p>
              }
              title="Personal Information"
              footer={
                <div className="flex items-center justify-between gap-4">
                  <div className="min-h-[16px]">
                    {stage1Error ? (
                      <p className="text-[11px] text-[#E53935]">
                        {stage1Error}
                      </p>
                    ) : null}
                  </div>
                  <Button.SmPrimary
                    label="Continue"
                    width={160}
                    height={38}
                    loading={stage1Loading ? "Please wait" : undefined}
                    disabled={stage1Loading}
                    onClick={async () => {
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
                        console.log(
                          "[Stage 1] account-creation-web response:",
                          res,
                        );
                        const userId = res?.data?.userId;
                        const accountId = res?.data?.accountId;
                        if (!userId || !accountId) {
                          return setStage1Error(
                            "Invalid signup response. Please try again.",
                          );
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
                        if (e instanceof ApiError) {
                          setStage1Error(e.message);
                        } else if (e instanceof Error) {
                          setStage1Error(e.message);
                        } else {
                          setStage1Error(
                            "Something went wrong. Please try again.",
                          );
                        }
                      } finally {
                        setStage1Loading(false);
                      }
                    }}
                  />
                </div>
              }
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <TextField
                  label="First Name"
                  value={firstName}
                  onChange={(v) => {
                    setFirstName(sanitizeNameInput(v));
                    if (stage1FieldErrors.firstName) {
                      setStage1FieldErrors((p) => ({ ...p, firstName: undefined }));
                    }
                  }}
                  error={stage1FieldErrors.firstName}
                />
                <TextField
                  label="Last Name"
                  value={lastName}
                  onChange={(v) => {
                    setLastName(sanitizeNameInput(v));
                    if (stage1FieldErrors.lastName) {
                      setStage1FieldErrors((p) => ({ ...p, lastName: undefined }));
                    }
                  }}
                  error={stage1FieldErrors.lastName}
                />
              </div>

              <div className="mt-4">
                <SelectField
                  label="Account Type"
                  placeholder={
                    accountTypesLoading
                      ? "Loading account types..."
                      : "Select account type"
                  }
                  value={accountType}
                  onChange={(v) => {
                    setAccountType(v);
                    if (stage1FieldErrors.accountType) {
                      setStage1FieldErrors((p) => ({ ...p, accountType: undefined }));
                    }
                  }}
                  options={accountTypeOptions}
                  error={stage1FieldErrors.accountType}
                />
                {accountTypesError ? (
                  <p className="mt-1 text-[10px] text-[#E53935]">
                    {accountTypesError}
                  </p>
                ) : null}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <PhoneNumberField
                  label="Phone Number"
                  countryCode={countryCode}
                  onCountryCodeChange={(v) => {
                    setCountryCode(v);
                    if (stage1FieldErrors.phoneNumber) {
                      setStage1FieldErrors((p) => ({ ...p, phoneNumber: undefined }));
                    }
                  }}
                  phoneNumber={phoneNumber}
                  onPhoneNumberChange={(v) => {
                    setPhoneNumber(v);
                    if (stage1FieldErrors.phoneNumber) {
                      setStage1FieldErrors((p) => ({ ...p, phoneNumber: undefined }));
                    }
                  }}
                  error={stage1FieldErrors.phoneNumber}
                />
                <TextField
                  label="Email Address"
                  value={email}
                  onChange={(v) => {
                    setEmail(v);
                    if (stage1FieldErrors.email) {
                      setStage1FieldErrors((p) => ({ ...p, email: undefined }));
                    }
                  }}
                  placeholder="Enter email address"
                  error={stage1FieldErrors.email}
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <PasswordField
                  label="Create Password"
                  value={password}
                  onChange={(v) => {
                    setPassword(v);
                    if (stage1FieldErrors.password) {
                      setStage1FieldErrors((p) => ({ ...p, password: undefined }));
                    }
                  }}
                  autoComplete="new-password"
                  error={stage1FieldErrors.password}
                />
                <PasswordField
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={(v) => {
                    setConfirmPassword(v);
                    if (stage1FieldErrors.confirmPassword) {
                      setStage1FieldErrors((p) => ({ ...p, confirmPassword: undefined }));
                    }
                  }}
                  autoComplete="new-password"
                  error={stage1FieldErrors.confirmPassword}
                />
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-[6px] border border-[#89E081] bg-[#5FCE551A] px-4 py-3 text-[12px] leading-[18px] text-[#2E2E2E]">
                <IconCheckbox
                  checked={acceptedTerms}
                  onChange={(next) => {
                    setAcceptedTerms(next);
                    if (stage1FieldErrors.acceptedTerms) {
                      setStage1FieldErrors((p) => ({ ...p, acceptedTerms: undefined }));
                    }
                  }}
                />
                <div>
                  By proceeding, I agree to Moneylot&apos;s{" "}
                  <button
                    type="button"
                    onClick={() => {}}
                    className="font-bold text-[#89E081] hover:opacity-80"
                  >
                    Terms of Use
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    onClick={() => {}}
                    className="font-bold text-[#89E081] hover:opacity-80"
                  >
                    Privacy Policy
                  </button>
                </div>
              </div>
              {stage1FieldErrors.acceptedTerms ? (
                <p className="mt-1 text-[11px] text-[#E53935]">
                  {stage1FieldErrors.acceptedTerms}
                </p>
              ) : null}
            </OnboardingCard>

            <div className="mt-4 text-center text-[12px] leading-[18px] text-[#5F6368]">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="font-semibold text-[#89E081] hover:opacity-80"
              >
                Sign In
              </button>
            </div>
          </>
        ) : stage === 2 ? (
          <>
            <div className="mx-auto w-full max-w-[640px]">
              <BackPillButton onClick={() => setStage(1)} />
            </div>

            <OnboardingCard
              stepLine={
                <p className="text-[18px] font-medium text-[#2E2E2E]">
                  Step <span className="text-[#2E2E2E]">2/</span>
                  <span className="text-[#979797]">4</span>
                  <span className="text-[#2E2E2E]"> - Verification</span>
                </p>
              }
              title="Identity & Address Verification"
              contentClassName="flex flex-col justify-between gap-6"
              footer={
                <div className="flex items-center justify-between gap-4">
                  <div className="min-h-[16px]">
                    {stage2Error ? (
                      <p className="text-[11px] text-[#E53935]">
                        {stage2Error}
                      </p>
                    ) : null}
                  </div>
                  <Button.SmPrimary
                    label="Continue"
                    width={160}
                    height={38}
                    loading={stage2Loading ? "Please wait" : undefined}
                    disabled={stage2Loading}
                    onClick={async () => {
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
                        console.log(
                          "[Stage 2] validate-identity-address response:",
                          res,
                        );

                        showSuccessToast(
                          "Success",
                          res?.message || "Identity verified successfully",
                        );
                        setStage(3);
                        // Clear Stage 2 inputs after successful submission.
                        clearStage2Form();
                      } catch (e) {
                        if (e instanceof ApiError) {
                          setStage2Error(e.message);
                        } else if (e instanceof Error) {
                          setStage2Error(e.message);
                        } else {
                          setStage2Error(
                            "Unable to validate identity. Please try again.",
                          );
                        }
                      } finally {
                        setStage2Loading(false);
                      }
                    }}
                  />
                </div>
              }
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DateField
                  label="Date of Birth"
                  value={dob}
                  onChange={(v) => {
                    setDob(v);
                    if (stage2FieldErrors.dob) {
                      setStage2FieldErrors((p) => ({ ...p, dob: undefined }));
                    }
                  }}
                  error={stage2FieldErrors.dob}
                />
                <TextField
                  label="BVN (Bank Verification Number)"
                  value={bvn}
                  onChange={(v) => {
                    setBvn(v);
                    if (stage2FieldErrors.bvn) {
                      setStage2FieldErrors((p) => ({ ...p, bvn: undefined }));
                    }
                  }}
                  placeholder="Enter your BVN"
                  error={stage2FieldErrors.bvn}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <SelectField
                  label="Country of Residence"
                  placeholder={
                    countriesLoading
                      ? "Loading countries..."
                      : "Select country of residence"
                  }
                  value={country}
                  onChange={(v) => {
                    setCountry(v);
                    setStateCode("");
                    setState_("");
                    setCity("");
                    if (stage2FieldErrors.country) {
                      setStage2FieldErrors((p) => ({ ...p, country: undefined }));
                    }
                  }}
                  options={countryOptions}
                  error={stage2FieldErrors.country}
                />
                {countriesError ? (
                  <p className="mt-1 text-[10px] text-[#E53935]">
                    {countriesError}
                  </p>
                ) : null}
                <TextField
                  label="Residential Address"
                  value={address}
                  onChange={(v) => {
                    setAddress(v);
                    if (stage2FieldErrors.address) {
                      setStage2FieldErrors((p) => ({ ...p, address: undefined }));
                    }
                  }}
                  placeholder="Enter residential address"
                  error={stage2FieldErrors.address}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <SelectField
                  label="State"
                  placeholder={country.trim() ? "Select State" : "Select country first"}
                  value={stateCode}
                  onChange={(code) => {
                    setStateCode(code);
                    const found = stateOptions.find((s) => s.value === code);
                    setState_(found?.label || "");
                    setCity("");
                    if (stage2FieldErrors.state) {
                      setStage2FieldErrors((p) => ({ ...p, state: undefined }));
                    }
                  }}
                  options={stateOptions}
                  error={stage2FieldErrors.state}
                />
                <SelectField
                  label="City"
                  placeholder={stateCode.trim() ? "Select City" : "Select state first"}
                  value={city}
                  onChange={(v) => {
                    setCity(v);
                    if (stage2FieldErrors.city) {
                      setStage2FieldErrors((p) => ({ ...p, city: undefined }));
                    }
                  }}
                  options={cityOptions}
                  error={stage2FieldErrors.city}
                />
              </div>
            </OnboardingCard>
          </>
        ) : stage === 3 ? (
          <>
            <div className="mx-auto w-full max-w-[640px]">
              <BackPillButton onClick={() => setStage(2)} />
            </div>

            <OnboardingCard
              stepLine={
                <p className="text-[18px] font-medium text-[#2E2E2E]">
                  Step <span className="text-[#2E2E2E]">3/</span>
                  <span className="text-[#979797]">4</span>
                  <span className="text-[#2E2E2E]"> - Bank Details</span>
                </p>
              }
              title="Bank Account Details"
              footer={
                <div className="flex items-center justify-between gap-4">
                  <div className="min-h-[16px]">
                    {stage3Error ? (
                      <p className="text-[11px] text-[#E53935]">
                        {stage3Error}
                      </p>
                    ) : null}
                  </div>
                  <Button.SmPrimary
                    label="Continue"
                    width={160}
                    height={38}
                    loading={stage3Loading ? "Please wait" : undefined}
                    disabled={stage3Loading}
                    onClick={async () => {
                      setStage3Error(null);
                      setStage3FieldErrors({});
                      const bankCode = bankName.trim();
                      const acctNo = accountNumber.trim();
                      const acctName = accountName.trim();
                      const bankLabel = selectedBank?.bankName?.trim() || "";

                      const errs: typeof stage3FieldErrors = {};
                      if (!bankCode) errs.bankName = "Select a bank";
                      if (!acctNo) errs.accountNumber = "Account number is required";
                      else if (acctNo.length < 10)
                        errs.accountNumber = "Enter a valid account number";
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
                        console.log(
                          "[Stage 3] withdrawal/create response:",
                          res,
                        );
                        showSuccessToast(
                          "Success",
                          res?.message || "Bank details saved successfully",
                        );
                        setPinOpen(true);
                        // Clear Stage 3 inputs after successful submission.
                        clearStage3Form();
                      } catch (e) {
                        if (e instanceof ApiError) setStage3Error(e.message);
                        else if (e instanceof Error) setStage3Error(e.message);
                        else
                          setStage3Error(
                            "Unable to save bank details. Please try again.",
                          );
                      } finally {
                        setStage3Loading(false);
                      }
                    }}
                  />
                </div>
              }
            >
              <p className="text-[12px] text-[#5F6368] -mt-3">
                Add your bank details for withdrawals
              </p>

              <div className="mt-4">
                <SearchableSelectField
                  label="Bank Name"
                  placeholder={
                    banksLoading ? "Loading banks..." : "Select bank name"
                  }
                  value={bankName}
                  onChange={(v) => {
                    setBankName(v);
                    if (stage3FieldErrors.bankName) {
                      setStage3FieldErrors((p) => ({ ...p, bankName: undefined }));
                    }
                  }}
                  options={bankOptions}
                  searchPlaceholder="Search bank"
                  disabled={banksLoading}
                  error={stage3FieldErrors.bankName}
                />
                {banksError ? (
                  <p className="mt-1 text-[10px] text-[#E53935]">
                    {banksError}
                  </p>
                ) : null}
              </div>

              <div className="mt-4">
                <div className="w-full">
                  <label className="block text-[11px] font-medium text-[#5F6368]">
                    Account Number
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      value={accountNumber}
                      onChange={(e) => {
                        const digits = (e.target.value || "").replace(/\D/g, "").slice(0, 10);
                        setAccountNumber(digits);
                        setAccountName("");
                        lastResolvedKeyRef.current = "";
                        if (stage3FieldErrors.accountNumber) {
                          setStage3FieldErrors((p) => ({ ...p, accountNumber: undefined }));
                        }
                      }}
                      placeholder="1234567890"
                      className="h-[40px] w-full rounded-[6px] border border-black/10 bg-white px-3 pr-[150px] text-[12px] text-[#2E2E2E] outline-none focus:border-[#89E081]"
                    />

                    {accountResolveLoading ? (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[10px] text-[#5F6368]">
                        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#5F6368]/20 border-t-[#5F6368]/60" />
                        <span className="uppercase tracking-wide">Checking account</span>
                      </div>
                    ) : accountName.trim() && accountNumber.trim().length === 10 ? (
                      <Image
                        src={imagesAndIcons.toastSuccessIcon}
                        alt="Resolved"
                        width={14}
                        height={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px]"
                      />
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <TextField
                  label="Account Name (as registered)"
                  value={accountName}
                  onChange={setAccountName}
                  disabled
                  error={stage3FieldErrors.accountName}
                />
              </div>
            </OnboardingCard>
          </>
        ) : stage === 4 ? (
          <>
            <div className="mx-auto w-full max-w-[640px]">
              <BackPillButton
                label="Go to Dashboard"
                onClick={() => {
                    void secureRemove(GET_STARTED_PERSIST_KEY);
                  router.push("/dashboard");
                }}
              />
            </div>

            <OnboardingCard
              stepLine={
                <p className="text-[18px] font-medium text-[#2E2E2E]">
                  Step <span className="text-[#2E2E2E]">4/</span>
                  <span className="text-[#979797]">4</span>
                  <span className="text-[#2E2E2E]"> - Make an Investment</span>
                </p>
              }
              title="Fixed Term Deposits"
              footer={
                <div className="flex items-center justify-between gap-4">
                  <div className="min-h-[16px]">
                    {ratesError || expectedReturnError ? (
                      <p className="text-[11px] text-[#E53935]">
                        {expectedReturnError || ratesError}
                      </p>
                    ) : null}
                  </div>
                  {isStage4Ready ? (
                    <Button.SmPrimary
                      label="Review & Confirm"
                      width={170}
                      height={38}
                      fontSize="text-[12px]"
                      loading={
                        expectedReturnLoading ? "Please wait" : undefined
                      }
                      disabled={expectedReturnLoading}
                      onClick={async () => {
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
                          console.log(
                            "[Stage 4] get-expected-return response:",
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
                          setAcknowledgeInvestment(false);
                          setCreateInvestmentError(null);
                          setStage(5);
                        } catch (e) {
                          if (e instanceof ApiError)
                            setExpectedReturnError(e.message);
                          else if (e instanceof Error)
                            setExpectedReturnError(e.message);
                          else
                            setExpectedReturnError(
                              "Unable to compute expected return.",
                            );
                        } finally {
                          setExpectedReturnLoading(false);
                        }
                      }}
                    />
                  ) : (
                    <Button.SmSecondary
                      label="Review & Confirm"
                      width={170}
                      height={38}
                      fontSize="text-[12px]"
                      backgroundColor="bg-[#F2F2F2]"
                      textColor="text-[#5F6368]"
                      disabled
                      onClick={() => {}}
                    />
                  )}
                </div>
              }
            >
              <p className="text-[12px] text-[#5F6368] -mt-2 mb-2 max-w-[520px]">
                Guaranteed returns with defined interest rates
              </p>

              <div className="mt-4">
                <p className="text-[14px] font-medium text-[#5F6368]">
                  How much do you want to invest? (₦)
                </p>
                <input
                  type="text"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder="Enter investment amount"
                  className="mt-1 h-[40px] w-full rounded-[6px] border border-black/10 bg-white px-3 text-[12px] text-[#2E2E2E] outline-none focus:border-[#89E081]"
                />
                <p className="mt-1 text-[12px] text-[#E53935]">
                  Minimum investment is ₦50
                </p>
              </div>

              <div className="mt-4">
                <p className="text-[14px] font-medium text-[#5F6368]">
                  Select Tenor
                </p>
                <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
                  {tenorOptions.map((opt) => (
                    <TenorCard
                      key={opt.id}
                      option={{ days: opt.days, rateLabel: opt.rateLabel }}
                      selected={selectedRateId === opt.id}
                      onSelect={() => {
                        setSelectedRateId(opt.id);
                        setExpectedReturnError(null);
                        setExpectedReturn(null);
                        setTotalAtMaturity(null);
                        setMaturityDateText(null);
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

              {isStage4Ready && selectedRatePa && selectedTenorDays ? (
                <InvestmentSummary
                  amountInput={investmentAmount}
                  tenorDays={selectedTenorDays}
                  ratePa={selectedRatePa}
                />
              ) : null}
            </OnboardingCard>
          </>
        ) : stage === 5 ? (
          <>
            <div className="mx-auto w-full max-w-[640px]">
              <BackPillButton onClick={() => setStage(4)} />
            </div>

            <OnboardingCard
              stepLine={
                <p className="text-[12px] font-medium text-[#5F6368]">
                  Almost There!
                </p>
              }
              title="Confirm Your Investment"
              footer={
                <div className="flex items-center justify-between gap-4">
                  <div className="min-h-[16px]">
                    {createInvestmentError ? (
                      <p className="text-[11px] text-[#E53935]">
                        {createInvestmentError}
                      </p>
                    ) : null}
                  </div>
                  <Button.SmPrimary
                    label="Proceed to Payment"
                    width={180}
                    height={38}
                    fontSize="text-[12px]"
                    loading={
                      createInvestmentLoading ? "Please wait" : undefined
                    }
                    disabled={createInvestmentLoading}
                    onClick={async () => {
                      setCreateInvestmentError(null);
                      if (!acknowledgeInvestment) {
                        setCreateInvestmentError("Please confirm to continue");
                        return;
                      }
                      if (!selectedTenorId || !selectedTypeId) {
                        setCreateInvestmentError(
                          "Missing tenor selection. Please go back.",
                        );
                        return;
                      }
                      if (
                        expectedReturn == null ||
                        !Number.isFinite(expectedReturn)
                      ) {
                        setCreateInvestmentError(
                          "Missing expected return. Please go back.",
                        );
                        return;
                      }
                      setInvestmentPinOpen(true);
                    }}
                  />
                </div>
              }
            >
              <p className="text-[12px] text-[#5F6368] -mt-1">
                Please review all details carefully before proceeding to payment
              </p>

              {isStage4Ready && selectedRatePa && selectedTenorDays ? (
                <InvestmentConfirmationTable
                  investmentType="Fixed Deposit"
                  amountInput={investmentAmount}
                  tenorDays={selectedTenorDays}
                  ratePa={selectedRatePa}
                  expectedReturnOverride={expectedReturn}
                  totalAtMaturityOverride={totalAtMaturity}
                  maturityDateOverride={maturityDateText}
                />
              ) : (
                <div className="mt-4 rounded-[10px] border border-black/10 px-5 py-8 text-[12px] text-[#5F6368]">
                  Select a tenor and enter an amount to review your investment.
                </div>
              )}

              <div className="mt-4 flex items-center gap-3 rounded-[6px] border border-[#89E081] bg-[#5FCE551A] px-4 py-3 text-[12px] leading-[18px] text-[#2E2E2E]">
                <IconCheckbox
                  checked={acknowledgeInvestment}
                  onChange={(next) => setAcknowledgeInvestment(next)}
                />
                <div className="text-[#5F6368]">
                  By proceeding, I agree that all returns accrued will be forfeited and a penalty fee incurred if funds are withdrawn before maturity
                </div>
              </div>
            </OnboardingCard>
          </>
        ) : stage === 6 ? (
          <>
            <div className="mx-auto w-full max-w-[640px]">
              <BackPillButton onClick={() => setStage(5)} />
            </div>

            <OnboardingCard
              stepLine={
                <p className="text-[12px] font-medium text-[#5F6368]">
                  Initiate Payment
                </p>
              }
              title="Make Payment To The Account Details Below"
              footer={
                <div className="flex justify-center">
                  <Button.SmPrimary
                    label="I have made this payment"
                    width={220}
                    height={38}
                    fontSize="text-[12px]"
                    loading={fundingLoading ? "Please wait" : undefined}
                    disabled={fundingLoading}
                    onClick={() => setStage(7)}
                  />
                </div>
              }
            >
              {fundingError ? (
                <div className="mb-3 rounded-[10px] border border-[#F2C6C6] bg-[#FFF5F5] px-4 py-3 text-[11px] text-[#D32F2F]">
                  {fundingError}
                </div>
              ) : null}

              <PaymentDetailsTable
                amountInput={investmentAmount}
                bankName={checkout?.bankName || "-"}
                accountNumber={checkout?.accountNumber || "-"}
                accountName={checkout?.accountName || "-"}
              />

              <p className="mt-4 text-center text-[11px] text-[#5F6368]">
                Account number provided expires after{" "}
                <span className="font-medium text-[#2E2E2E]">
                  {expiryCountdown.formatted} mins
                </span>
              </p>

              <p className="mt-2 text-center text-[11px] text-[#2E2E2E]">
                Transfer only{" "}
                <span className="font-semibold">
                  {formatNGN(parseMoney(investmentAmount) + 50)}
                </span>{" "}
                to the account number above within the validity time.
              </p>
            </OnboardingCard>
          </>
        ) : stage === 7 ? (
          <>
            <div className="mx-auto w-full max-w-[640px]">
              <div className="rounded-[10px] border border-black/10 bg-white px-6 py-10 text-center">
                <div className="mx-auto flex justify-center">
                  <Image
                    src={imagesAndIcons.successfulIcon}
                    alt="Success"
                    width={64}
                    height={64}
                  />
                </div>

                <h2 className="mt-6 text-[18px] font-semibold text-[#2E2E2E]">
                  Your Investment Is Being Processed
                </h2>
                <p className="mt-2 text-[12px] text-[#5F6368]">
                  Our team is reviewing your investment. An email confirmation
                  will be sent to you shortly.
                </p>

                <div className="mt-6 flex justify-center">
                  <Button.MdPrimary
                    label="Go to Dashboard"
                    fullWidth={false}
                    onClick={() => {
                      void secureRemove(GET_STARTED_PERSIST_KEY);
                      router.push("/dashboard");
                    }}
                    className="flex h-[46px] w-[320px] items-center justify-center rounded-[10px] py-0 text-[14px] leading-none"
                  />
                </div>

                <p className="mt-4 text-[11px] text-[#5F6368]">
                  Need help? Contact support{" "}
                  <button
                    type="button"
                    onClick={() => {}}
                    className="font-medium text-[#89E081] hover:opacity-80"
                  >
                    hello@moneylot.com
                  </button>
                </p>
              </div>
            </div>
          </>
        ) : null}

        <OtpModal
          open={otpOpen}
          setOpen={setOtpOpen}
          email={(stage1SignupContext.emailAddress || email || "").trim()}
          isLoading={otpLoading}
          confirmLabel="Verify"
          onResend={async () => {
            const e = (stage1SignupContext.emailAddress || email || "").trim();
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
            if (
              !stage1SignupContext.emailAddress ||
              !stage1SignupContext.password
            ) {
              setStage1Error(
                "Missing login details. Please submit Stage 1 again.",
              );
              return;
            }
            try {
              setOtpLoading(true);
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
                kycStatus:
                  typeof (loginRes.data as any).kycStatus === "number"
                    ? (loginRes.data as any).kycStatus
                    : Number.isFinite(Number((loginRes.data as any).kycStatus))
                      ? Number((loginRes.data as any).kycStatus)
                      : undefined,
                ninVerified: Boolean(
                  (loginRes.data as any).ninVerified ?? (loginRes.data as any).isNINVerified
                ),
              });

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
              setInvestmentTransactionPin(pin);
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
              setCreatedInvestmentId(id);
              setStage(6);
            } catch (e) {
              if (e instanceof ApiError) throw new Error(e.message);
              if (e instanceof Error) throw e;
              throw new Error("Unable to create investment. Please try again.");
            } finally {
              setCreateInvestmentLoading(false);
            }
          }}
        />
      </div>
    </OnboardingShell>
  );
}
