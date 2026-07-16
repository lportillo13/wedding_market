import ContextualSponsoredUnits from "@/components/ads/ContextualSponsoredUnits";
import type { HomepageContent } from "@/lib/content/siteContent";

type SponsoredSectionProps = {
  hero: HomepageContent["hero"];
  categories: HomepageContent["categories"];
};

export default function SponsoredSection({ hero, categories }: SponsoredSectionProps) {
  const keywords = categories.items.flatMap((item) => [item.slug, item.label]);

  return (
    <section className="container wm-home-premium-sponsored" id="about">
      <ContextualSponsoredUnits pageKey="home" headline={hero.title} keywords={keywords} />
    </section>
  );
}
