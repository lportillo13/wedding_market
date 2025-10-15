import type { VendorPricingItem, VendorProfileDTO } from "@/types/vendor-profile";

type VendorPricingProps = {
  vendor: VendorProfileDTO["vendor"];
  pricing: VendorPricingItem[];
};

const PRICING_ORDER: { key: string; label: string }[] = [
  { key: "reception", label: "Reception" },
  { key: "ceremony", label: "Ceremony" },
  { key: "bar", label: "Bar Service" },
  { key: "catering", label: "Catering" },
];

function formatPrice(item: VendorPricingItem, vendor: VendorProfileDTO["vendor"]): string {
  if (item.contactForPrice || (!item.priceCents && item.priceCents !== 0)) {
    return "Contact for price";
  }
  const currency = item.currency || vendor.startingPriceCurrency || "USD";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format((item.priceCents ?? 0) / 100);
  } catch {
    return `$${((item.priceCents ?? 0) / 100).toFixed(0)}`;
  }
}

export default function VendorPricing({ vendor, pricing }: VendorPricingProps) {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2 className="h3">Pricing</h2>
          {vendor.typicalSpendCents ? (
            <p className="text-muted mb-0">
              Couples usually spend {formatPrice({
                itemKey: "typical",
                priceCents: vendor.typicalSpendCents,
                currency: vendor.typicalSpendCurrency,
                contactForPrice: false,
                notes: null,
              }, vendor)}
            </p>
          ) : null}
        </div>
        {vendor.peakSeasons.length ? (
          <div className="d-flex flex-wrap gap-2">
            {vendor.peakSeasons.map((season) => (
              <span key={season} className="badge text-bg-light border rounded-pill">
                Peak: {season}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th scope="col">Package</th>
              <th scope="col">Price</th>
              <th scope="col">Details</th>
            </tr>
          </thead>
          <tbody>
            {PRICING_ORDER.map((row) => {
              const item = pricing.find((entry) => entry.itemKey.toLowerCase() === row.key) ?? null;
              return (
                <tr key={row.key}>
                  <th scope="row">{row.label}</th>
                  <td>{item ? formatPrice(item, vendor) : "Contact for price"}</td>
                  <td className="text-muted small">{item?.notes ?? "Reach out for a custom quote."}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
