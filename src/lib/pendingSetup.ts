import type { SetupRoute } from "@/lib/setupProgress";

const KEY = "moneylot_pending_setup_route_v1";

export function setPendingSetupRoute(route: SetupRoute) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(route));
  } catch {
    // ignore
  }
}

export function getPendingSetupRoute(): SetupRoute | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as any;
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.href !== "string" || !parsed.href.trim()) return null;
    return parsed as SetupRoute;
  } catch {
    return null;
  }
}

export function clearPendingSetupRoute() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

