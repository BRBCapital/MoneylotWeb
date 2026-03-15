export type FilestackStoreResponse = Partial<{
  url: string;
  handle: string;
  filename: string;
  mimetype: string;
  size: number;
  key: string;
}>;

const FILESTACK_STORE_S3_URL =
  "https://www.filestackapi.com/api/store/S3?key=AvAAxXFCT7CEcaQE74ks7z";

function extractUrl(x: unknown): string | null {
  if (!x || typeof x !== "object") return null;
  const obj: any = x;
  if (typeof obj.url === "string" && obj.url.trim()) return obj.url.trim();
  if (obj.data) return extractUrl(obj.data);
  return null;
}

export async function uploadToFilestackS3(file: File): Promise<{ url: string; raw: FilestackStoreResponse }> {
  const fd = new FormData();
  // Filestack expects multipart field name: fileUpload
  fd.append("fileUpload", file, file.name);

  console.log("[Filestack] uploading:", { name: file.name, type: file.type, size: file.size });
  const res = await fetch(FILESTACK_STORE_S3_URL, {
    method: "POST",
    body: fd,
  });

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }

  if (!res.ok) {
    throw new Error(
      (json && typeof json === "object" && "message" in (json as any) && typeof (json as any).message === "string"
        ? (json as any).message
        : null) || `Upload failed (${res.status})`
    );
  }

  const url = extractUrl(json);
  if (!url) {
    throw new Error("Upload succeeded but no file URL was returned.");
  }

  return { url, raw: (json || {}) as FilestackStoreResponse };
}

