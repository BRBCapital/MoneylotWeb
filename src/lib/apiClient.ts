import { getSessionToken, setAuthSession } from "@/state/appState";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

const DEFAULT_BASE_URL =
  "https://moneylotv2webapi-aedchvaqddhaaneb.southafricanorth-01.azurewebsites.net";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_BASE_URL
).replace(/\/$/, "");

function buildUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${API_BASE_URL}${path}`;
}

async function safeParseJson(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function handleUnauthorized() {
  if (typeof window === "undefined") return;
  try {
    setAuthSession(null);
    window.localStorage.removeItem("moneylot_auth_session");
  } catch {
    // ignore
  }
  try {
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  } catch {
    // ignore
  }
}

function makeHeaders(initHeaders?: HeadersInit, hasJsonBody?: boolean): Headers {
  const headers = new Headers(initHeaders || {});
  if (hasJsonBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = getSessionToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}

export async function apiPostJson<TResponse>(
  pathOrUrl: string,
  body: unknown,
  init?: RequestInit
): Promise<TResponse> {
  const url = buildUrl(pathOrUrl);
  const tokenAtRequest = getSessionToken();
  const headers = makeHeaders(init?.headers, true);
  const res = await fetch(url, {
    method: "POST",
    ...init,
    // Ensure our computed headers aren't overwritten by init.headers
    headers,
    // Ensure JSON body isn't overwritten by init.body
    body: JSON.stringify(body),
  });

  const data = await safeParseJson(res);

  if (!res.ok) {
    if (res.status === 401) {
      const isPublicAuthRoute =
        /\/api\/v1\/auth\/login\b/i.test(url) ||
        /\/api\/v1\/auth\/reset-web-password\b/i.test(url);
      // Only force logout/redirect if we *had* a session token.
      // Login / public flows can legitimately return 401 without a token.
      const authHeader = headers.get("Authorization") || "";
      if (!isPublicAuthRoute && tokenAtRequest && authHeader.trim()) handleUnauthorized();
    }
    const msg =
      (data &&
        typeof data === "object" &&
        "message" in data &&
        typeof (data as any).message === "string" &&
        (data as any).message) ||
      `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, data);
  }

  return data as TResponse;
}

export async function apiGetJson<TResponse>(
  pathOrUrl: string,
  init?: RequestInit
): Promise<TResponse> {
  const url = buildUrl(pathOrUrl);
  const tokenAtRequest = getSessionToken();
  const headers = makeHeaders(init?.headers);
  const res = await fetch(url, {
    method: "GET",
    ...init,
    // Ensure our computed headers aren't overwritten by init.headers
    headers,
  });

  const data = await safeParseJson(res);

  if (!res.ok) {
    if (res.status === 401) {
      const isPublicAuthRoute =
        /\/api\/v1\/auth\/login\b/i.test(url) ||
        /\/api\/v1\/auth\/reset-web-password\b/i.test(url);
      const authHeader = headers.get("Authorization") || "";
      if (!isPublicAuthRoute && tokenAtRequest && authHeader.trim()) handleUnauthorized();
    }
    const msg =
      (data &&
        typeof data === "object" &&
        "message" in data &&
        typeof (data as any).message === "string" &&
        (data as any).message) ||
      `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, data);
  }

  return data as TResponse;
}

