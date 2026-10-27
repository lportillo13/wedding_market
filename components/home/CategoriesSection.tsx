import Link from "next/link";
import type { HomepageContent } from "@/lib/content/siteContent";

const CATEGORY_IMAGES: Record<string, string> = {
  venues: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80",
  photography: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=900&q=80",
  catering: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80",
  beauty: "https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?auto=format&fit=crop&w=900&q=80",
  entertainment: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=80",
  decor: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=900&q=80",
};

const CATEGORY_EYEBROW = {
  en: "Find your people",
  es: "Encuentra a tu equipo",
} as const;

type CategoriesSectionProps = {
  categories: HomepageContent["categories"];
  language: keyof typeof CATEGORY_EYEBROW;
};

export default function CategoriesSection({ categories, language }: CategoriesSectionProps) {
  return (
    <section className="wm-home-premium-categories" id="partnerships">
      <div className="container">
        <div className="wm-home-premium-section-head wm-home-premium-section-head--split" data-reveal-group>
          <div>
            <p className="wm-home-premium-eyebrow">{CATEGORY_EYEBROW[language]}</p>
            <h2>{categories.heading}</h2>
            <p>{categories.description}</p>
          </div>
          <Link href="/vendors" className="wm-home-premium-text-link">
            {categories.viewAll}
          </Link>
        </div>

        <div className="wm-home-premium-category-grid" data-reveal-group>
          {categories.items.map((category, index) => (
            <Link
              key={category.slug}
              href={`/vendors?category=${encodeURIComponent(category.slug)}`}
              className="wm-home-premium-category"
            >
              <span className="wm-home-premium-category__image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={CATEGORY_IMAGES[category.slug] ?? CATEGORY_IMAGES.venues} alt="" loading="lazy" />
              </span>
              <span className="wm-home-premium-category__copy">
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <h3>{category.label}</h3>
                <strong>{categories.seeVendors}</strong>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
