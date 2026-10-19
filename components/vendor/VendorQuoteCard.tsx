"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import type { VendorProfileDTO } from "@/types/vendor-profile";

export default function VendorQuoteCard({
  vendor,
  isLoggedIn,
  loginHref,
}: {
  vendor: VendorProfileDTO["vendor"];
  isLoggedIn: boolean;
  loginHref: string;
}) {
  const { dictionary, language } = useLanguage();
  const labels = dictionary.vendorPublic;
  let startingPrice: string | null = null;
  if (
    isLoggedIn &&
    vendor.startingPriceCents &&
    Number.isFinite(vendor.startingPriceCents)
  ) {
    try {
      startingPrice = new Intl.NumberFormat(
        language === "es" ? "es-CR" : "en-US",
        {
          style: "currency",
          currency: vendor.startingPriceCurrency,
          maximumFractionDigits: 0,
        },
      ).format(vendor.startingPriceCents / 100);
    } catch {
      startingPrice = `${vendor.startingPriceCurrency} ${(vendor.startingPriceCents / 100).toFixed(0)}`;
    }
  }

  return (
    <aside className="wm-profile-quote" aria-labelledby="profile-quote-title">
      <span className="wm-profile-quote__flourish" aria-hidden="true">
        ✧
      </span>
      <p className="wm-profile-eyebrow">{labels.editorial.quoteEyebrow}</p>
      <h2 id="profile-quote-title">{labels.editorial.quoteTitle}</h2>
      <p>{labels.editorial.quoteIntro}</p>
      <div className="wm-profile-quote__vendor">{vendor.name}</div>
      {startingPrice && (
        <p className="wm-profile-quote__price">
          {labels.header.startingPrice.replace("{price}", startingPrice)}
        </p>
      )}
      <Link
        className="btn btn-primary"
        href={isLoggedIn ? "#contact" : loginHref}
      >
        {labels.header.requestQuote}
        <span aria-hidden="true">↗︎</span>
      </Link>
      <small>
        {isLoggedIn ? labels.editorial.quoteNote : labels.editorial.signInHint}
      </small>
    </aside>
  );
}
