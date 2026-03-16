import { apiGetJson, apiPostJson } from "@/lib/apiClient";

export type CountryDto = {
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
  const name =
    (typeof x.name === "string" && x.name.trim()) ||
    (typeof (x as any).countryName === "string" && (x as any).countryName.trim()) ||
    (typeof (x as any).country === "string" && (x as any).country.trim()) ||
    "";
  const code =
    (typeof (x as any).code === "string" && (x as any).code.trim()) ||
    (typeof (x as any).iso2 === "string" && (x as any).iso2.trim()) ||
    (typeof (x as any).countryCode === "string" && (x as any).countryCode.trim()) ||
    name;
  if (!name) return null;
  return { name, code };
}

export async function getCountries(signal?: AbortSignal) {
  const res = await apiGetJson<GetCountryResponse>("/api/v1/verification/get-country", {
    signal,
  });
  if (!res?.status) {
    throw new Error(res?.message || "Unable to load countries. Please try again.");
  }
  const list = Array.isArray(res.data) ? res.data.map(normalizeCountry).filter(Boolean) : [];
  return {
    status: res.status,
    message: res.message,
    data: list as CountryDto[],
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
    (typeof (x as any).identityType === "string" && (x as any).identityType.trim()) ||
    "";
  if (!Number.isFinite(id) || id <= 0) return null;
  if (!name) return null;
  return { id, name };
}

export async function getIdentityTypes(signal?: AbortSignal) {
  const res = await apiGetJson<GetIdentityTypeResponse>(
    "/api/v1/verification/get-identity-type",
    { signal }
  );
  if (!res?.status) {
    throw new Error(res?.message || "Unable to load identity types. Please try again.");
  }
  const root: any = res.data;
  const listRaw = Array.isArray(root) ? root : Array.isArray(root?.data) ? root.data : [];
  const list = listRaw.map(normalizeIdentityType).filter(Boolean) as IdentityTypeDto[];
  return { status: true, message: res.message, data: list };
}

export type VerifyNinRequest = {
  nin: string;
  ninUrl: string;
};

export type VerifyNinResponse = {
  status: boolean;
  message: string;
  data?: unknown;
};

export async function verifyNin(payload: VerifyNinRequest) {
  const res = await apiPostJson<VerifyNinResponse>(
    "/api/v1/verification/verify-nin",
    {
      nin: (payload.nin || "").trim(),
      ninUrl: payload.ninUrl,
    }
  );
  if (!res?.status) {
    throw new Error(res?.message || "Unable to verify NIN. Please try again.");
  }
  return res;
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
    { nin: (payload.nin || "").trim() }
  );
  const ok = Boolean(res?.status) || res?.statusCode === 200;
  if (!ok) {
    throw new Error(
      (typeof res?.message === "string" && res.message.trim())
        ? res.message
        : "Unable to verify NIN. Please try again."
    );
  }
  return res;
}

