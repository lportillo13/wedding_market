"use client";

import ShortlistFavorites from "@/components/shortlist/ShortlistFavorites";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ShortlistPage() {
  const { dictionary } = useLanguage();

  return (
    <main>
      <section className="wm-shortlist-hero">
        <div className="container">
          <p className="wm-shortlist-hero__eyebrow">Your collection</p>
          <h1 className="wm-shortlist-hero__title">
            {dictionary.shortlistPage.title}
          </h1>
          <p className="wm-shortlist-hero__sub">
            Vendors you&apos;ve saved — compare, share with your partner, and request quotes.
          </p>
        </div>
      </section>
      <div className="wm-shortlist-content">
        <div className="container">
          <ShortlistFavorites />
        </div>
      </div>
    </main>
  );
}
