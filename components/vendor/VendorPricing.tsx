"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  humanizeVendorFieldKey,
  shouldShowPricingItem,
  sortPricingItemKeys,
} from "@/lib/vendorServiceProfile";
import type { VendorPricingItem, VendorProfileDTO } from "@/types/vendor-profile";

type VendorPricingProps = {
  vendor: VendorProfileDTO["vendor"];
  pricing: VendorPricingItem[];
  isLoggedIn: boolean;
  loginHref: string;
  categoryKeys: readonly (string | null | undefined)[];
};

function fill(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export default function VendorPricing({ vendor, pricing, isLoggedIn, loginHref, categoryKeys }: VendorPricingProps) {
  const { dictionary, language } = useLanguage();
  const labels = dictionary.vendorPublic.pricing;
  const itemLabels = labels.items as Record<string, string>;

  const formatPrice = (item: VendorPricingItem): string => {
    if (item.contactForPrice || (!item.priceCents && item.priceCents !== 0)) {
      return labels.contactForPrice;
    }
    const currency = item.currency || vendor.startingPriceCurrency || "USD";
    try {
      return new Intl.NumberFormat(language === "es" ? "es-ES" : "en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format((item.priceCents ?? 0) / 100);
    } catch {
      return `$${((item.priceCents ?? 0) / 100).toFixed(0)}`;
    }
  };

  const visiblePricing = pricing.filter((item) => shouldShowPricingItem(item.itemKey, categoryKeys));
  const sortedPricingKeys = sortPricingItemKeys(
    visiblePricing.map((item) => item.itemKey),
    categoryKeys,
  );
  const pricingRows = [...visiblePricing].sort(
    (a, b) => sortedPricingKeys.indexOf(a.itemKey) - sortedPricingKeys.indexOf(b.itemKey),
  );

  if (!isLoggedIn) {
    return (
      <div>
        <h2 className="h3 mb-3">{labels.heading}</h2>
        <div className="alert alert-light border mb-0" role="status">
          <p className="mb-3">{labels.loginRequired}</p>
          <Link href={loginHref} className="btn btn-outline-primary">
            {labels.logInAction}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2 className="h3">{labels.heading}</h2>
          {vendor.typicalSpendCents ? (
            <p className="text-muted mb-0">
              {fill(labels.typicalSpend, {
                price: formatPrice({
                  itemKey: "typical",
                  priceCents: vendor.typicalSpendCents,
                  currency: vendor.typicalSpendCurrency,
                  contactForPrice: false,
                  notes: null,
                }),
              })}
            </p>
          ) : null}
        </div>
        {vendor.peakSeasons.length ? (
          <div className="d-flex flex-wrap gap-2">
            {vendor.peakSeasons.map((season) => (
              <span key={season} className="badge text-bg-light border rounded-pill">
                {fill(labels.peakSeason, { season })}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {pricingRows.length ? (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th scope="col">{labels.package}</th>
                <th scope="col">{labels.price}</th>
                <th scope="col">{labels.details}</th>
              </tr>
            </thead>
            <tbody>
              {pricingRows.map((item) => {
                const normalizedKey = item.itemKey.toLowerCase();
                const label = itemLabels[normalizedKey] ?? humanizeVendorFieldKey(item.itemKey);
                return (
                  <tr key={item.itemKey}>
                    <th scope="row">{label}</th>
                    <td>{formatPrice(item)}</td>
                    <td className="text-muted small">{item.notes ?? labels.customQuote}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="alert alert-light border mb-0">{labels.customQuote}</div>
      )}
    </div>
  );
}
