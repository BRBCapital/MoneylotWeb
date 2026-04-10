import { apiGetJson, apiPostJson } from "@/lib/apiClient";

export type CountryDto = {
  id?: number;
  code: string;
  name: string;
};

type RawCountry = Record<string, unknown>;

type GetCountryResponse = {
  status: boolean;
  message: string;
  data: RawCountry[];
};

function normalizeCountry(x: RawCountry): CountryDto | null {
  if (!x || typeof x !== "object") return null;
  if (
    typeof (x as { isActive?: boolean }).isActive === "boolean" &&
    !(x as { isActive?: boolean }).isActive
  ) {
    return null;
  }
  const countryNameAlt = x.countryName;
  const countryAlt = x.country;
  const name =
    (typeof x.name === "string" && x.name.trim()) ||
    (typeof countryNameAlt === "string" && countryNameAlt.trim()) ||
    (typeof countryAlt === "string" && countryAlt.trim()) ||
    "";
  const codeRaw = x.code;
  const iso2 = x.iso2;
  const cc = x.countryCode;
  const code =
    (typeof codeRaw === "string" && codeRaw.trim()) ||
    (typeof iso2 === "string" && iso2.trim()) ||
    (typeof cc === "string" && cc.trim()) ||
    name;
  if (!name) return null;
  const idRaw = (x as { id?: unknown }).id;
  const id =
    typeof idRaw === "number"
      ? idRaw
      : typeof idRaw === "string"
        ? Number(idRaw)
        : NaN;
  return {
    name,
    code,
    ...(Number.isFinite(id) && id > 0 ? { id } : {}),
  };
}

export async function getCountries(signal?: AbortSignal) {
  const res = await apiGetJson<GetCountryResponse>(
    "/api/v1/verification/get-country",
    {
      signal,
    },
  );
  if (!res?.status) {
    throw new Error(
      res?.message || "Unable to load countries. Please try again.",
    );
  }
  const list = Array.isArray(res.data)
    ? res.data.map(normalizeCountry).filter(Boolean)
    : [];
  return {
    status: res.status,
    message: res.message,
    data: list as CountryDto[],
  };
}

export type StateDto = {
  id: number;
  countryCode: string;
  name: string;
};

type GetStateResponse = {
  status: boolean;
  message: string;
  data: RawCountry[];
};

function normalizeState(x: RawCountry): StateDto | null {
  if (!x || typeof x !== "object") return null;
  const idRaw = (x as { id?: unknown }).id;
  const id = typeof idRaw === "number" ? idRaw : Number(idRaw);
  const name =
    typeof (x as { name?: string }).name === "string"
      ? (x as { name: string }).name.trim()
      : "";
  const countryCode =
    typeof (x as { countryCode?: string }).countryCode === "string"
      ? (x as { countryCode: string }).countryCode.trim()
      : "";
  if (!Number.isFinite(id) || id <= 0) return null;
  if (!name) return null;
  return { id, name, countryCode };
}

export async function getStatesByCountryCode(
  countryCode: string,
  signal?: AbortSignal,
) {
  const cc = (countryCode || "").trim();
  if (!cc) {
    return { status: true as const, message: "", data: [] as StateDto[] };
  }
  const res = await apiGetJson<GetStateResponse>(
    `/api/v1/verification/get-state/${encodeURIComponent(cc)}`,
    { signal },
  );
  if (!res?.status) {
    throw new Error(
      res?.message || "Unable to load states. Please try again.",
    );
  }
  const list = Array.isArray(res.data)
    ? res.data.map(normalizeState).filter(Boolean)
    : [];
  return {
    status: res.status,
    message: res.message,
    data: list as StateDto[],
  };
}

export type CityDto = {
  id: number;
  stateId: number;
  name: string;
};

type GetCityResponse = {
  status: boolean;
  message: string;
  data: RawCountry[];
};

function normalizeCity(x: RawCountry): CityDto | null {
  if (!x || typeof x !== "object") return null;
  const idRaw = (x as { id?: unknown }).id;
  const id = typeof idRaw === "number" ? idRaw : Number(idRaw);
  const stateIdRaw = (x as { stateId?: unknown }).stateId;
  const stateId =
    typeof stateIdRaw === "number" ? stateIdRaw : Number(stateIdRaw);
  const name =
    typeof (x as { name?: string }).name === "string"
      ? (x as { name: string }).name.trim()
      : "";
  if (!Number.isFinite(id) || id <= 0) return null;
  if (!Number.isFinite(stateId) || stateId <= 0) return null;
  if (!name) return null;
  return { id, stateId, name };
}

export async function getCitiesByStateId(
  stateId: number | string,
  signal?: AbortSignal,
) {
  const sid =
    typeof stateId === "number" ? stateId : Number(String(stateId).trim());
  if (!Number.isFinite(sid) || sid <= 0) {
    return { status: true as const, message: "", data: [] as CityDto[] };
  }
  const res = await apiGetJson<GetCityResponse>(
    `/api/v1/verification/get-city/${encodeURIComponent(String(sid))}`,
    { signal },
  );
  if (!res?.status) {
    throw new Error(res?.message || "Unable to load cities. Please try again.");
  }
  const list = Array.isArray(res.data)
    ? res.data.map(normalizeCity).filter(Boolean)
    : [];
  return {
    status: res.status,
    message: res.message,
    data: list as CityDto[],
  };
}

export type IdentityTypeDto = {
  id: number;
  name: string;
};

type GetIdentityTypeResponse = {
  status: boolean;
  message: string;
  data?: unknown;
};

function normalizeIdentityType(x: any): IdentityTypeDto | null {
  if (!x || typeof x !== "object") return null;
  const idRaw = (x as any).id ?? (x as any).typeId ?? (x as any).identityTypeId;
  const id = typeof idRaw === "number" ? idRaw : Number(idRaw);
  const name =
    (typeof (x as any).name === "string" && (x as any).name.trim()) ||
    (typeof (x as any).typeName === "string" && (x as any).typeName.trim()) ||
    (typeof (x as any).identityType === "string" &&
      (x as any).identityType.trim()) ||
    "";
  if (!Number.isFinite(id) || id <= 0) return null;
  if (!name) return null;
  return { id, name };
}

export async function getIdentityTypes(signal?: AbortSignal) {
  const res = await apiGetJson<GetIdentityTypeResponse>(
    "/api/v1/verification/get-identity-type",
    { signal },
  );
  if (!res?.status) {
    throw new Error(
      res?.message || "Unable to load identity types. Please try again.",
    );
  }
  const root: any = res.data;
  const listRaw = Array.isArray(root)
    ? root
    : Array.isArray(root?.data)
      ? root.data
      : [];
  const list = listRaw
    .map(normalizeIdentityType)
    .filter(Boolean) as IdentityTypeDto[];
  return { status: true, message: res.message, data: list };
}

export type VerifyNinRequest = {
  nin: string;
  ninUrl: string;
  proofOfAddressType?: number | null;
  proofOfAddressUrl?: string | null;
};

export type VerifyNinResponse = {
  status: boolean;
  message: string;
  data?: unknown;
};

export async function verifyNin(payload: VerifyNinRequest) {
  const res = await apiPostJson<VerifyNinResponse>(
    "/api/v1/verification/verify-me",
    {
      nin: (payload.nin || "").trim(),
      ninUrl: payload.ninUrl,
      ...(typeof payload.proofOfAddressType === "number" &&
      Number.isFinite(payload.proofOfAddressType)
        ? { proofOfAddressType: payload.proofOfAddressType }
        : {}),
      ...(payload.proofOfAddressUrl
        ? { proofOfAddressUrl: payload.proofOfAddressUrl }
        : {}),
    },
  );
  if (!res?.status) {
    throw new Error(res?.message || "Unable to verify NIN. Please try again.");
  }
  return res;
}

export type ProofOfAddressTypeDto = {
  id: number;
  name: string;
};

type GetProofOfAddressTypesResponse = {
  status: boolean;
  message: string;
  data?: unknown;
};

function normalizeProofOfAddressType(x: any): ProofOfAddressTypeDto | null {
  if (!x || typeof x !== "object") return null;
  const idRaw =
    (x as any).id ?? (x as any).typeId ?? (x as any).proofOfAddressTypeId;
  const id = typeof idRaw === "number" ? idRaw : Number(idRaw);
  const name =
    (typeof (x as any).name === "string" && (x as any).name.trim()) ||
    (typeof (x as any).typeName === "string" && (x as any).typeName.trim()) ||
    (typeof (x as any).proofOfAddressType === "string" &&
      (x as any).proofOfAddressType.trim()) ||
    "";
  if (!Number.isFinite(id) || id <= 0) return null;
  if (!name) return null;
  return { id, name };
}

export async function getProofOfAddressTypes(signal?: AbortSignal) {
  const res = await apiGetJson<GetProofOfAddressTypesResponse>(
    "/api/v1/verification/proof-of-address-types",
    { signal },
  );
  if (!res?.status) {
    throw new Error(
      res?.message ||
        "Unable to load proof of address types. Please try again.",
    );
  }
  const root: any = res.data;
  const listRaw = Array.isArray(root)
    ? root
    : Array.isArray(root?.data)
      ? root.data
      : [];
  const list = listRaw
    .map(normalizeProofOfAddressType)
    .filter(Boolean) as ProofOfAddressTypeDto[];
  return { status: true, message: res.message, data: list };
}

export type VerifyNinOnlyRequest = {
  nin: string;
};

export type VerifyNinOnlyResponse = {
  status?: boolean;
  message?: string | null;
  data?: unknown;
  statusCode?: number;
  error?: unknown;
};

export async function verifyNinOnly(payload: VerifyNinOnlyRequest) {
  const res = await apiPostJson<VerifyNinOnlyResponse>(
    "/api/v1/verification/verify-NIN",
    { nin: (payload.nin || "").trim() },
  );
  const ok = Boolean(res?.status) || res?.statusCode === 200;
  if (!ok) {
    throw new Error(
      typeof res?.message === "string" && res.message.trim()
        ? res.message
        : "Unable to verify NIN. Please try again.",
    );
  }
  return res;
}
