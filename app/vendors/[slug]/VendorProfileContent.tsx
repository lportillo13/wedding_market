"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import ShortlistButton from "@/components/shortlist/ShortlistButton";
import { Stars } from "@/components/Stars";
import { useLanguage } from "@/contexts/LanguageContext";
import type { VendorProfile } from "./types";

type VendorProfileContentProps = {
  vendor: VendorProfile;
  averageRating: number;
  ratingCount: number;
  reviewRfqId: string | null;
  children: ReactNode;
};

export default function VendorProfileContent({
  vendor,
  averageRating,
  ratingCount,
  reviewRfqId,
  children,
}: VendorProfileContentProps) {
  const { dictionary, language } = useLanguage();
  const labels = dictionary.vendorProfile;

  const bio = language === "es" ? vendor.bio_es || vendor.bio_en : vendor.bio_en || vendor.bio_es;

  return (
    <main className="container py-4" style={{ maxWidth: 960 }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="mb-0">{vendor.business_name}</h1>
        <ShortlistButton vendorId={vendor.id} />
      </div>

      {vendor.categories?.length ? (
        <div className="mb-2 small text-secondary">{vendor.categories.join(" • ")}</div>
      ) : null}

      <div className="d-flex align-items-center gap-2 my-3">
        <Stars value={averageRating} />
        <span className="text-muted">({ratingCount})</span>
      </div>

      {reviewRfqId && (
        <div className="my-3">
          <Link className="btn btn-primary" href={`/account/reviews/new/${reviewRfqId}`}>
            {labels.writeReview}
          </Link>
        </div>
      )}

      {bio ? <p className="lead">{bio}</p> : null}

      <hr className="my-4" />

      {children}

      <div className="alert alert-info mt-4">{labels.moreComing}</div>
    </main>
  );
}
