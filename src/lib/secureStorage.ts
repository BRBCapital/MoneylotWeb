type EncryptedPayload = {
  v: 1;
  iv: string; // base64
  ct: string; // base64
};

const KEY_STORAGE = "moneylot_secure_storage_key_v1";

function isBrowser() {
  return typeof window !== "undefined";
}

function bytesToBase64(bytes: Uint8Array) {
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
}

function base64ToBytes(b64: string) {
  const s = atob(b64);
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return bytes;
}

function getOrCreateKeyBytes(): Uint8Array | null {
  if (!isBrowser()) return null;
  try {
    const existing = window.localStorage.getItem(KEY_STORAGE);
    if (existing && existing.trim()) return base64ToBytes(existing.trim());
    const raw = new Uint8Array(32);
    window.crypto.getRandomValues(raw);
    window.localStorage.setItem(KEY_STORAGE, bytesToBase64(raw));
    return raw;
  } catch {
    return null;
  }
}

let cryptoKeyPromise: Promise<CryptoKey> | null = null;
async function getCryptoKey(): Promise<CryptoKey> {
  if (!isBrowser()) throw new Error("secure storage not available");
  if (cryptoKeyPromise) return cryptoKeyPromise;
  cryptoKeyPromise = (async () => {
    const raw = getOrCreateKeyBytes();
    if (!raw) throw new Error("secure storage not available");
    if (!window.crypto?.subtle) throw new Error("secure storage not available");
    // Copy into an ArrayBuffer-backed view to satisfy strict DOM typings.
    const rawCopy = new Uint8Array(raw.byteLength);
    rawCopy.set(raw);
    return await window.crypto.subtle.importKey(
      "raw",
      rawCopy,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"],
    );
  })();
  return cryptoKeyPromise;
}

export async function secureSetJson(key: string, value: unknown) {
  if (!isBrowser()) return;
  const cryptoKey = await getCryptoKey();
  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);
  const enc = new TextEncoder().encode(JSON.stringify(value ?? null));
  const ctBuf = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, enc);
  const payload: EncryptedPayload = {
    v: 1,
    iv: bytesToBase64(iv),
    ct: bytesToBase64(new Uint8Array(ctBuf)),
  };
  window.localStorage.setItem(key, JSON.stringify(payload));
}

export async function secureGetJson<T = unknown>(key: string): Promise<T | null> {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EncryptedPayload;
    if (!parsed || parsed.v !== 1 || !parsed.iv || !parsed.ct) return null;
    const cryptoKey = await getCryptoKey();
    const iv = base64ToBytes(parsed.iv);
    const ct = base64ToBytes(parsed.ct);
    const ptBuf = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, ct);
    const text = new TextDecoder().decode(ptBuf);
    return (text ? (JSON.parse(text) as T) : null) ?? null;
  } catch {
    return null;
  }
}

export async function secureRemove(key: string) {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

