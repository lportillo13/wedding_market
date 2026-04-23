// components/shortlist/ShortlistFavorites.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ContextualSponsoredUnits from "@/components/ads/ContextualSponsoredUnits";
import { useLanguage } from "@/contexts/LanguageContext";
import { getShortlist, removeFromShortlist } from "@/lib/shortlist";
import { useVendorSummaries } from "@/lib/useVendorSummaries";

export default function ShortlistFavorites() {
  const [ids, setIds] = useState<string[]>(() => (typeof window !== "undefined" ? getShortlist() : []));
  const { vendorsById, loading, error } = useVendorSummaries(ids);
  const { dictionary } = useLanguage();
  const labels = dictionary.shortlistPage;
  const shortlistAdKeywords = useMemo(
    () =>
      ids.flatMap((id) => {
        const vendor = vendorsById[id];
        if (!vendor) {
          return [];
        }

        return [vendor.business_name, ...(vendor.categories ?? [])];
      }),
    [ids, vendorsById],
  );
  const shortlistCategory = useMemo(() => {
    const firstVendor = ids.map((id) => vendorsById[id]).find((vendor) => Boolean(vendor));
    return firstVendor?.categories?.[0] ?? null;
  }, [ids, vendorsById]);

  useEffect(() => {
    const sync = () => setIds(getShortlist());

    sync();
    window.addEventListener("wm-shortlist-changed", sync);
    return () => window.removeEventListener("wm-shortlist-changed", sync);
  }, []);

  if (ids.length === 0) {
    return (
      <div className="border rounded p-4 bg-body-secondary">
        <p className="mb-2">{labels.empty.title}</p>
        <p className="mb-0">
          {labels.empty.descriptionBeforeLink}
          <Link href="/vendors">{labels.empty.directoryLink}</Link>
          {labels.empty.descriptionAfterLink}
        </p>
      </div>
    );
  }

  return (
    <div className="vstack gap-4">
      <div className="border rounded bg-body p-3">
        <p className="fw-semibold mb-3">{labels.saved.heading}</p>
        {error && <div className="alert alert-warning">{labels.saved.loadError}</div>}
        <ul className="list-group">
          {ids.map((id) => {
            const vendor = vendorsById[id];
            const vendorName = vendor?.business_name ?? (loading ? labels.saved.loading : labels.saved.unavailable);

            return (
              <li key={id} className="list-group-item d-flex justify-content-between align-items-center gap-3">
                <span className="text-truncate" style={{ maxWidth: "70%" }} title={vendorName}>
                  {vendor ? (
                    vendor.slug ? (
                      <Link href={`/vendors/${vendor.slug}`} className="text-decoration-none text-reset">
                        {vendor.business_name}
                      </Link>
                    ) : (
                      vendor.business_name
                    )
                  ) : (
                    vendorName
                  )}
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => {
                    removeFromShortlist(id);
                    setIds((current) => current.filter((value) => value !== id));
                  }}
                >
                  {labels.saved.remove}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <ContextualSponsoredUnits
        pageKey="shortlist"
        headline={labels.saved.heading}
        category={shortlistCategory}
        keywords={shortlistAdKeywords}
      />

      <div className="border rounded p-3 bg-body-secondary">
        <p className="mb-2">{labels.cta.title}</p>
        <p className="mb-3">{labels.cta.description}</p>
        <Link href="/rfq/new" className="btn btn-primary" role="button">
          {labels.cta.button}
        </Link>
      </div>
    </div>
  );
}
