"use client";

import Link from "next/link";
import { useEffect, useState } from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import type { VendorProfileDTO } from "@/types/vendor-profile";
import { getVendorNavigationHeight } from '@/features/vendors/client/viewport';

export default function VendorQuoteCard({
  vendor,
  isLoggedIn,
  loginHref,
}: {
  vendor: VendorProfileDTO["vendor"];
  isLoggedIn: boolean;
  loginHref: string;
  isExample?: boolean;
}) {
  const { dictionary, language } = useLanguage();
  const labels = dictionary.vendorPublic;
  const [heroPast, setHeroPast] = useState(false);
  const [contactReached, setContactReached] = useState(false);
  useEffect(() => {
    const hero = document.querySelector('.wm-profile-hero');
    const contact = document.getElementById('contact');
    const navigationHeight = getVendorNavigationHeight();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.target === hero) setHeroPast(!entry.isIntersecting && entry.boundingClientRect.bottom <= navigationHeight);
        if (entry.target === contact) setContactReached(entry.boundingClientRect.top <= (entry.rootBounds?.bottom ?? window.innerHeight));
      }
    }, { rootMargin: `-${navigationHeight}px 0px 0px 0px` });
    if (hero) observer.observe(hero);
    if (contact) observer.observe(contact);
    return () => observer.disconnect();
  }, [vendor.id]);
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
    <aside className="wm-profile-quote-dock" aria-label={labels.header.requestQuote} hidden={!heroPast || contactReached}>
      <div className="wm-profile-quote-dock__copy">
        <span className="wm-profile-quote-dock__name" title={vendor.name}>{vendor.name}</span>
        <span className="wm-profile-quote-dock__detail">{startingPrice ? labels.header.startingPrice.replace('{price}', startingPrice) : isLoggedIn ? labels.editorial.quoteEyebrow : labels.editorial.signInHint}</span>
      </div>
      <Link
        className="btn btn-primary"
        href={isLoggedIn ? "#contact" : loginHref}
      >
        {labels.header.requestQuote}
        <span aria-hidden="true">↗︎</span>
      </Link>
    </aside>
  );
}
