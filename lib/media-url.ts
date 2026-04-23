import { getR2ObjectKeyFromUrl } from "@/lib/r2";

export function isR2Url(url: string | null | undefined) {
  if (!url) return false;
  return (
    url.includes(".r2.cloudflarestorage.com/") ||
    url.includes(".r2.dev/")
  );
}

export function isSvgMediaUrl(url: string | null | undefined) {
  if (!url) return false;

  const trimmed = url.trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed);
    const segments = parsed.pathname.toLowerCase().split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1] ?? "";
    return lastSegment.endsWith(".svg") || segments.includes("svg");
  } catch {
    const path = trimmed.toLowerCase().split(/[?#]/, 1)[0] ?? "";
    const segments = path.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1] ?? "";
    return lastSegment.endsWith(".svg") || segments.includes("svg");
  }
}

export function shouldRenderUnoptimizedMedia(url: string | null | undefined) {
  return isR2Url(url) || isSvgMediaUrl(url);
}

export function resolveMediaUrl(url: string | null | undefined) {
  if (!url) {
    return "";
  }

  if (!isR2Url(url)) {
    return url;
  }

  const key = getR2ObjectKeyFromUrl(url);
  const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.replace(/\/+$/, "");

  if (key && publicBase) {
    const normalizedKey = key.split("/").map(encodeURIComponent).join("/");
    return `${publicBase}/${normalizedKey}`;
  }

  if (!key) {
    return url;
  }

  return `/media/${key}`;
}
