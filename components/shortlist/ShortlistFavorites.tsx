// components/shortlist/ShortlistFavorites.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getShortlist, removeFromShortlist } from "@/lib/shortlist";
import { useVendorSummaries } from "@/lib/useVendorSummaries";

export default function ShortlistFavorites() {
  const [ids, setIds] = useState<string[]>(() => (typeof window !== "undefined" ? getShortlist() : []));
  const { vendorsById, loading, error } = useVendorSummaries(ids);

  useEffect(() => {
    const sync = () => setIds(getShortlist());

    sync();
    window.addEventListener("wm-shortlist-changed", sync);
    return () => window.removeEventListener("wm-shortlist-changed", sync);
  }, []);

  if (ids.length === 0) {
    return (
      <div className="border rounded p-4 bg-body-secondary">
        <p className="mb-2">You haven&apos;t favorited any vendors yet.</p>
        <p className="mb-0">
          Browse the <Link href="/vendors">vendor directory</Link> to add favorites, then request quotes when you&apos;re ready.
        </p>
      </div>
    );
  }

  return (
    <div className="vstack gap-4">
      <div className="border rounded bg-body p-3">
        <p className="fw-semibold mb-3">Favorited vendors</p>
        {error && <div className="alert alert-warning">We couldn&apos;t load vendor details. Please try again later.</div>}
        <ul className="list-group">
          {ids.map((id) => {
            const vendor = vendorsById[id];
            const vendorName = vendor?.business_name ?? (loading ? "Loading…" : "Vendor unavailable");

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
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="border rounded p-3 bg-body-secondary">
        <p className="mb-2">Ready to contact your favorites?</p>
        <p className="mb-3">Use the request quotes form to share your event details with these vendors.</p>
        <Link href="/rfq/new" className="btn btn-primary" role="button">
          Request quotes
        </Link>
      </div>
    </div>
  );
}
