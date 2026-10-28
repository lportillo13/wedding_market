"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import type { VendorProfileDTO } from "@/types/vendor-profile";
import { exampleVendorCopy } from "@/shared/vendors/examples";

export default function VendorQuoteCard({
  vendor,
  isLoggedIn,
  loginHref,
  isExample = false,
}: {
  vendor: VendorProfileDTO["vendor"];
  isLoggedIn: boolean;
  loginHref: string;
  isExample?: boolean;
}) {
  const { dictionary, language } = useLanguage();
  const labels = dictionary.vendorPublic;
  const exampleLabels = exampleVendorCopy[language === 'es' ? 'es' : 'en'];
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
        {isExample ? exampleLabels.form : labels.header.requestQuote}
        <span aria-hidden="true">↗︎</span>
      </Link>
      <small>
        {isExample ? exampleLabels.disabled : isLoggedIn ? labels.editorial.quoteNote : labels.editorial.signInHint}
      </small>
    </aside>
  );
}
