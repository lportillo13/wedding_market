import Image from "next/image";
import Link from "next/link";
import { Stars } from "@/components/Stars";
import type { VendorProfileDTO } from "@/types/vendor-profile";

type VendorHeaderProps = {
  vendor: VendorProfileDTO["vendor"];
};

function formatCurrency(value: number | null | undefined, currency: string): string | null {
  if (!value || Number.isNaN(value)) return null;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value / 100);
  } catch {
    return `$${(value / 100).toFixed(0)}`;
  }
}

export default function VendorHeader({ vendor }: VendorHeaderProps) {
  const startingPrice = formatCurrency(vendor.startingPriceCents, vendor.startingPriceCurrency);
  const typicalSpend = formatCurrency(vendor.typicalSpendCents, vendor.typicalSpendCurrency);
  const locationParts = [vendor.location.city, vendor.location.region, vendor.location.country]
    .filter(Boolean)
    .join(", ");

  return (
    <header className="py-4">
      <div className="d-flex flex-column flex-lg-row gap-4 align-items-lg-center">
        {vendor.logoUrl ? (
          <div className="flex-shrink-0">
            <Image
              src={vendor.logoUrl}
              alt={`${vendor.name} logo`}
              width={160}
              height={160}
              className="rounded border"
            />
          </div>
        ) : null}
        <div className="flex-grow-1">
          <h1 className="display-5 fw-semibold mb-2">{vendor.name}</h1>
          <div className="d-flex align-items-center flex-wrap gap-3 text-muted">
            {locationParts ? (
              <span className="d-flex align-items-center gap-2">
                <span aria-hidden="true">📍</span>
                <span>{locationParts}</span>
              </span>
            ) : null}
            {vendor.eventTypes.length ? (
              <span className="badge text-bg-light border rounded-pill">
                {vendor.eventTypes.join(" • ")}
              </span>
            ) : null}
            {vendor.yearsInBusiness ? (
              <span className="badge text-bg-light border rounded-pill">
                {vendor.yearsInBusiness}+ years in business
              </span>
            ) : null}
            {vendor.languages.length ? (
              <span className="badge text-bg-light border rounded-pill">
                Languages: {vendor.languages.join(", ")}
              </span>
            ) : null}
          </div>
          <div className="d-flex align-items-center gap-3 mt-3">
            {vendor.ratingAvg ? (
              <span className="d-inline-flex align-items-center gap-2">
                <Stars value={vendor.ratingAvg} />
                <strong>{vendor.ratingAvg.toFixed(1)}</strong>
                <span className="text-muted">({vendor.ratingCount} reviews)</span>
              </span>
            ) : (
              <span className="text-muted">No reviews yet</span>
            )}
          </div>
          <div className="text-muted mt-3">
            {startingPrice ? <div>Starting at {startingPrice}</div> : null}
            {typicalSpend ? <div>Couples usually spend {typicalSpend}</div> : null}
          </div>
        </div>
        <div className="d-flex flex-column flex-md-row align-items-stretch gap-2">
          <Link href="#contact" className="btn btn-primary btn-lg w-100">
            Request Quote
          </Link>
          <Link href="#contact" className="btn btn-outline-secondary btn-lg w-100">
            Message Vendor
          </Link>
        </div>
      </div>
    </header>
  );
}
