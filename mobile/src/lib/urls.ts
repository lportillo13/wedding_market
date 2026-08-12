import { mobileConfig } from "./config";

const PRODUCTION_WEB_URL = "https://theweddingmarket.com";

export function normalizeBaseUrl(value: string | null | undefined, fallback = PRODUCTION_WEB_URL) {
  const normalized = value?.trim().replace(/\/+$/, "");
  return normalized || fallback;
}

export function joinWebPath(baseUrl: string, path: string) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const normalizedPath = path.trim();

  if (!normalizedPath) return normalizedBaseUrl;
  return `${normalizedBaseUrl}/${normalizedPath.replace(/^\/+/, "")}`;
}

export function publicWebUrl(path = "") {
  const baseUrl = mobileConfig.webUrl || mobileConfig.webApiUrl;
  return joinWebPath(normalizeBaseUrl(baseUrl), path);
}

export function vendorShareUrl(slug: string) {
  return publicWebUrl(`/vendors/${encodeURIComponent(slug.trim())}`);
}

export function externalMapUrl({
  businessName,
  lat,
  lng,
  location,
}: {
  businessName: string;
  lat?: number | null;
  lng?: number | null;
  location?: string | null;
}) {
  const hasCoordinates =
    typeof lat === "number" &&
    Number.isFinite(lat) &&
    typeof lng === "number" &&
    Number.isFinite(lng);
  const query = hasCoordinates ? `${lat},${lng}` : [businessName, location].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
