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
import VendorQuoteCard from "@/components/vendor/VendorQuoteCard";
import VendorReviews from "@/components/vendor/VendorReviews";
import VendorTabs from "@/components/vendor/VendorTabs";
import VendorTeam from "@/components/vendor/VendorTeam";
import { useLanguage } from "@/contexts/LanguageContext";
import type { VendorAdsConfig } from "@/lib/content/vendorAds";
import { getVendorServiceProfile } from "@/lib/vendorServiceProfile";
import type { VendorProfileDTO } from "@/types/vendor-profile";
import type { VendorContactPrefill } from "./data";
import { exampleVendorCopy } from "@/shared/vendors/examples";

export default function VendorPageShell({
  profile,
  contactPrefill,
  isVendor,
  isLoggedIn,
  adsConfig,
  isExample = false,
}: {
  profile: VendorProfileDTO;
  contactPrefill: VendorContactPrefill | null;
  isVendor: boolean;
  isLoggedIn: boolean;
  adsConfig: VendorAdsConfig;
  isExample?: boolean;
}) {
  const { dictionary, language } = useLanguage();
  const labels = dictionary.vendorPublic;
  const exampleLabels = exampleVendorCopy[language === 'es' ? 'es' : 'en'];
  const categoryKeys = profile.breadcrumbs.categories.map(
    (category) => category.key,
  );
  const loginHref = `/login?next=${encodeURIComponent(`/vendors/${profile.vendor.slug}`)}`;
  const serviceProfile = getVendorServiceProfile(categoryKeys);
  const sections = [
    {
      id: "about",
      label: labels.tabs.about,
      kicker: labels.editorial.story,
      visible: !!(
        profile.vendor.description ||
        profile.vendor.summary ||
        profile.spaces.length ||
        profile.vendor.teamSizeRange ||
        profile.vendor.yearsInBusiness ||
        profile.vendor.languages.length ||
        profile.vendor.eventTypes.length
      ),
      content: (
        <>
        <div className="wm-profile-breadcrumbs">
          <Breadcrumbs isExample={isExample} categories={profile.breadcrumbs.categories} vendorName={profile.vendor.name} />
        </div>
        <VendorAbout
          vendor={profile.vendor}
          spaces={profile.spaces}
          categoryKeys={categoryKeys}
        />
        </>
      ),
    },
    {
      id: "photos",
      label: labels.tabs.photos,
      kicker: labels.editorial.photos,
      visible: profile.media.length > 0,
      content: (
        <VendorGallery media={profile.media} vendorName={profile.vendor.name} />
      ),
    },
    {
      id: "pricing",
      label: labels.tabs.pricing,
      kicker: labels.editorial.pricing,
      visible:
        profile.pricing.length > 0 ||
        !!profile.vendor.startingPriceCents ||
        !!profile.vendor.typicalSpendCents,
      content: (
        <VendorPricing
          vendor={profile.vendor}
          pricing={profile.pricing}
          isLoggedIn={isLoggedIn}
          loginHref={loginHref}
          categoryKeys={categoryKeys}
        />
      ),
    },
    {
      id: "amenities",
      label: labels.tabs.amenities,
      kicker: labels.editorial.amenities,
      visible: !!(
        profile.amenities.amenities.length ||
        profile.amenities.ceremonyTypes.length ||
        profile.amenities.settings.length ||
        profile.amenities.services.length ||
        (serviceProfile.supportsGuestCapacity && profile.vendor.capacityMax)
      ),
      content: (
        <VendorAmenities
          amenities={profile.amenities}
          capacityMax={profile.vendor.capacityMax}
          categoryKeys={categoryKeys}
        />
      ),
    },
    {
      id: "team",
      label: labels.tabs.team,
      kicker: labels.editorial.team,
      visible: profile.team.length > 0,
      content: <VendorTeam team={profile.team} />,
    },
    {
      id: "availability",
      label: labels.tabs.availability,
      kicker: labels.editorial.availability,
      visible: profile.availability.dates.length > 0,
      content: (
        <VendorAvailability
          dates={profile.availability.dates}
          isLoggedIn={isLoggedIn}
          loginHref={loginHref}
        />
      ),
    },
    {
      id: "reviews",
      label: labels.tabs.reviews,
      kicker: labels.editorial.reviews,
      visible:
        profile.reviews.summary.ratingCount > 0 ||
        profile.reviews.items.length > 0,
      content: <VendorReviews reviews={profile.reviews} />,
    },
    {
      id: "contact",
      label: labels.tabs.contact,
      kicker: labels.editorial.contact,
      visible: !isVendor,
      content: (
        <VendorContact
          isExample={isExample}
          vendor={profile.vendor}
          prefill={contactPrefill}
          isVendor={isVendor}
          isLoggedIn={isLoggedIn}
          loginHref={loginHref}
        />
      ),
    },
  ].filter((section) => section.visible);

  return (
    <main className="wm-vendor-page wm-profile-editorial">
      <VendorHeader
        heroVideo={profile.heroVideo}
        isExample={isExample}
        vendor={profile.vendor}
        media={profile.media}
        categories={profile.breadcrumbs.categories}
        isVendor={isVendor}
        isLoggedIn={isLoggedIn}
        loginHref={loginHref}
      />
      <div className="wm-vendor-tabs-shell position-sticky">
        <div className="container">
          <VendorTabs sections={sections} />
        </div>
      </div>
      <div className="container wm-vendor-content-wrap">
        <div className="wm-vendor-ads-row">
          <VendorAdsBanner
            banner={adsConfig.profileBanner}
            language={language}
            variant="profile"
          />
        </div>
        <ContextualSponsoredUnits
          pageKey="vendor-profile"
          headline={profile.vendor.name}
          category={profile.breadcrumbs.categories[0]?.label ?? null}
          keywords={profile.breadcrumbs.categories.map(
            (category) => category.label,
          )}
          countries={
            profile.breadcrumbs.country ? [profile.breadcrumbs.country] : []
          }
          excludeVendorId={profile.vendor.id}
        />
        <div
          className={`wm-profile-layout${isVendor ? " wm-profile-layout--full" : ""}`}
        >
          <div className="wm-profile-sections">
            {sections.map((section, index) => (
              <section
                id={section.id}
                aria-label={section.label}
                className={`wm-vendor-section-block wm-vendor-section wm-profile-section wm-profile-section--${section.id}`}
                key={section.id}
              >
                <p className="wm-profile-eyebrow">
                  <span aria-hidden="true">
                    {String(index + 1).padStart(2, "0")} /{" "}
                  </span>
                  {section.kicker}
                </p>
                {section.content}
              </section>
            ))}
          </div>
          {!isVendor && (
            <div className="wm-profile-sidebar">
              <VendorQuoteCard
                isExample={isExample}
                vendor={profile.vendor}
                isLoggedIn={isLoggedIn}
                loginHref={loginHref}
              />
            </div>
          )}
        </div>
      </div>
      {!isVendor && (
        <div className="wm-vendor-mobile-action">
          <div>
            <strong>{profile.vendor.name}</strong>
            <span>{labels.editorial.quoteEyebrow}</span>
          </div>
          <a
            className="btn btn-primary"
            href={isLoggedIn ? "#contact" : loginHref}
          >
            {isExample ? exampleLabels.form : labels.header.requestQuote}
            <span aria-hidden="true">↗︎</span>
          </a>
        </div>
      )}
    </main>
  );
}
