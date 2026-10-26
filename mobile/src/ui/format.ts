import { copy } from "../i18n/copy";
import { type VendorListItem } from "../lib/api";

export function formatCategory(category: string) {
  return category
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}


export function formatMoney(cents?: number | null, currency = "USD", language: "en" | "es" = "en") {
  if (typeof cents !== "number" || !Number.isFinite(cents)) {
    return copy[language].contactForPrice;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}


export function vendorLocationLabel(vendor: VendorListItem) {
  return [vendor.city, vendor.region, vendor.country].filter(Boolean).join(", ");
}


export function hasVendorCoordinates(vendor: VendorListItem) {
  return (
    typeof vendor.lat === "number" &&
    Number.isFinite(vendor.lat) &&
    typeof vendor.lng === "number" &&
    Number.isFinite(vendor.lng)
  );
}
