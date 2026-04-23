"use client";

import ContextualSponsoredUnits from "@/components/ads/ContextualSponsoredUnits";
import VendorAdsBanner from "@/components/ads/VendorAdsBanner";
import Breadcrumbs from "@/components/vendor/Breadcrumbs";
import VendorAbout from "@/components/vendor/VendorAbout";
import VendorAmenities from "@/components/vendor/VendorAmenities";
import VendorAvailability from "@/components/vendor/VendorAvailability";
import VendorContact from "@/components/vendor/VendorContact";
import VendorGallery from "@/components/vendor/VendorGallery";
import VendorHeader from "@/components/vendor/VendorHeader";
import VendorPricing from "@/components/vendor/VendorPricing";
import VendorReviews from "@/components/vendor/VendorReviews";
import VendorTabs from "@/components/vendor/VendorTabs";
import VendorTeam from "@/components/vendor/VendorTeam";
import { useLanguage } from "@/contexts/LanguageContext";
import type { VendorAdsConfig } from "@/lib/content/vendorAds";
import type { VendorProfileDTO } from "@/types/vendor-profile";
import type { VendorContactPrefill } from "./data";

export default function VendorPageShell({
  profile,
  contactPrefill,
  isVendor,
  isLoggedIn,
  adsConfig,
}: {
  profile: VendorProfileDTO;
  contactPrefill: VendorContactPrefill | null;
  isVendor: boolean;
  isLoggedIn: boolean;
  adsConfig: VendorAdsConfig;
}) {
  const { dictionary, language } = useLanguage();
  const categoryKeys = profile.breadcrumbs.categories.map((category) => category.key);
  const loginHref = `/login?next=${encodeURIComponent(`/vendors/${profile.vendor.slug}`)}`;

  // Determine which sections have data worth showing
  const hasPhotos = profile.media.length > 0;
  const hasAbout = !!(
    profile.vendor.description ||
    profile.vendor.summary ||
    profile.spaces.length > 0 ||
    profile.vendor.yearsInBusiness ||
    profile.vendor.languages.length > 0 ||
    profile.vendor.teamSizeRange ||
    profile.vendor.peakSeasons.length > 0 ||
    profile.vendor.eventTypes.length > 0
  );
  const hasPricing = profile.pricing.length > 0 || !!profile.vendor.startingPriceCents || !!profile.vendor.typicalSpendCents;
  const hasAmenities =
    profile.amenities.amenities.length > 0 ||
    profile.amenities.ceremonyTypes.length > 0 ||
    profile.amenities.settings.length > 0 ||
    profile.amenities.services.length > 0 ||
    !!profile.vendor.capacityMax;
  const hasTeam = profile.team.length > 0;
  const hasAvailability = profile.availability.dates.length > 0;
  const hasReviews = profile.reviews.summary.ratingCount > 0 || profile.reviews.items.length > 0;

  const sectionVisibility: Record<string, boolean> = {
    photos: hasPhotos,
    about: hasAbout,
    pricing: hasPricing,
    amenities: hasAmenities,
    team: hasTeam,
    availability: hasAvailability,
    reviews: hasReviews,
    contact: !isVendor,
  };

  const allSections = [
    { id: "photos", label: dictionary.vendorPublic.tabs.photos },
    { id: "about", label: dictionary.vendorPublic.tabs.about },
    { id: "pricing", label: dictionary.vendorPublic.tabs.pricing },
    { id: "amenities", label: dictionary.vendorPublic.tabs.amenities },
    { id: "team", label: dictionary.vendorPublic.tabs.team },
    { id: "availability", label: dictionary.vendorPublic.tabs.availability },
    { id: "reviews", label: dictionary.vendorPublic.tabs.reviews },
    { id: "contact", label: dictionary.vendorPublic.tabs.contact },
  ] as const;

  // Only show tabs for sections that have data (and respect isVendor for contact)
  const visibleSections = allSections.filter((section) => sectionVisibility[section.id]);

  return (
    <div className="wm-vendor-page">
      <div className="container py-3">
        <Breadcrumbs
          categories={profile.breadcrumbs.categories}
          vendorName={profile.vendor.name}
        />
      </div>
      <VendorHeader
        vendor={profile.vendor}
        media={profile.media}
        isVendor={isVendor}
        isLoggedIn={isLoggedIn}
        loginHref={loginHref}
      />

      {/* Sticky nav sits directly after the hero, sticks below the site navbar */}
      <div className="wm-vendor-tabs-shell position-sticky" style={{ zIndex: 100, top: 0 }}>
        <div className="container">
          <VendorTabs sections={visibleSections} />
        </div>
      </div>

      <div className="container wm-vendor-content-wrap">
        <div className="wm-vendor-ads-row">
          <VendorAdsBanner banner={adsConfig.profileBanner} language={language} variant="profile" />
        </div>
        <ContextualSponsoredUnits
          pageKey="vendor-profile"
          headline={profile.vendor.name}
          category={profile.breadcrumbs.categories[0]?.label ?? null}
          keywords={profile.breadcrumbs.categories.map((category) => category.label)}
          countries={profile.breadcrumbs.country ? [profile.breadcrumbs.country] : []}
          excludeVendorId={profile.vendor.id}
        />

        {hasPhotos && (
          <section id="photos" className="wm-vendor-section-block">
            <VendorGallery media={profile.media} vendorName={profile.vendor.name} />
          </section>
        )}
        {hasAbout && (
          <section id="about" className="wm-vendor-section-block wm-vendor-section">
            <VendorAbout vendor={profile.vendor} spaces={profile.spaces} categoryKeys={categoryKeys} />
          </section>
        )}
        {hasPricing && (
          <section id="pricing" className="wm-vendor-section-block wm-vendor-section">
            <VendorPricing
              vendor={profile.vendor}
              pricing={profile.pricing}
              isLoggedIn={isLoggedIn}
              loginHref={loginHref}
              categoryKeys={categoryKeys}
            />
          </section>
        )}
        {hasAmenities && (
          <section id="amenities" className="wm-vendor-section-block wm-vendor-section">
            <VendorAmenities
              amenities={profile.amenities}
              capacityMax={profile.vendor.capacityMax}
              categoryKeys={categoryKeys}
            />
          </section>
        )}
        {hasTeam && (
          <section id="team" className="wm-vendor-section-block wm-vendor-section">
            <VendorTeam team={profile.team} />
          </section>
        )}
        {hasAvailability && (
          <section id="availability" className="wm-vendor-section-block wm-vendor-section">
            <VendorAvailability
              dates={profile.availability.dates}
              isLoggedIn={isLoggedIn}
              loginHref={loginHref}
            />
          </section>
        )}
        {hasReviews && (
          <section id="reviews" className="wm-vendor-section-block wm-vendor-section">
            <VendorReviews reviews={profile.reviews} />
          </section>
        )}
        {!isVendor && (
          <section id="contact" className="wm-vendor-section-block wm-vendor-section wm-vendor-section-block--last">
            <VendorContact
              vendor={profile.vendor}
              prefill={contactPrefill}
              isVendor={isVendor}
              isLoggedIn={isLoggedIn}
              loginHref={loginHref}
            />
          </section>
        )}
      </div>
    </div>
  );
}
