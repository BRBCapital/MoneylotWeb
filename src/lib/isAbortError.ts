export function isAbortError(e: unknown) {
  if (!e) return false;
  if (typeof e === "object" && "name" in e && (e as any).name === "AbortError") return true;
  if (e instanceof DOMException && e.name === "AbortError") return true;
  return false;
}

