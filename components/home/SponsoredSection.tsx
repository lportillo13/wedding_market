import ContextualSponsoredUnits from "@/components/ads/ContextualSponsoredUnits";
import type { HomepageContent } from "@/lib/content/siteContent";
import { VENDOR_ADS_PUBLICLY_VISIBLE } from "@/lib/content/vendorAds";

type SponsoredSectionProps = {
  hero: HomepageContent["hero"];
  categories: HomepageContent["categories"];
};

export default function SponsoredSection({ hero, categories }: SponsoredSectionProps) {
  if (!VENDOR_ADS_PUBLICLY_VISIBLE) return null;
  const keywords = categories.items.flatMap((item) => [item.slug, item.label]);

  return (
    <section className="wm-home-premium-sponsored" id="about">
      <div className="container">
        <ContextualSponsoredUnits pageKey="home" headline={hero.title} keywords={keywords} />
      </div>
    </section>
  );
}
