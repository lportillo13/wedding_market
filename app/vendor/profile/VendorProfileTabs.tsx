"use client";

import { useState } from "react";
import ProfileForm from "./profileForm";
import ImagesForm from "./ImagesForm";
import ContactForm from "./contactForm";
import PricingForm from "./pricingForm";
import AmenitiesForm from "./amenitiesForm";
import TeamForm from "./teamForm";
import AvailabilityForm from "./availabilityForm";
import ReviewsForm from "./reviewsForm";
import type { VendorImage } from "@/types/vendor";
import { useTranslation } from "@/contexts/LanguageContext";

type ProfileInitial = {
  slug: string;
  business_name: string;
  bio_en: string;
  bio_es: string;
  extra_info_en: string;
  extra_info_es: string;
};

type ContactInitial = {
  phone: string;
  website_url: string;
  map_url: string;
  address_label: string;
  starting_price: string;
  starting_price_currency: string;
  event_types: string;
  years_in_business: string;
  languages: string;
  team_size_range: string;
};

type PricingItemInitial = {
  itemKey: string;
  price: string;
  contactForPrice: boolean;
  notesEn: string;
  notesEs: string;
};

type PricingInitial = {
  items: PricingItemInitial[];
  typicalSpend: string;
  typicalSpendCurrency: string;
  peakSeasons: string;
};

type AmenityOption = {
  key: string;
  group_key: string;
  label: Record<string, unknown> | null;
};

type AmenitiesInitial = {
  selectedKeys: string[];
  capacityMax: string;
  eventTypes: string;
};

type TeamMemberInitial = {
  id: string;
  name: string;
  title: string;
  bio: string;
  headshotUrl: string;
  respondsWithinHours: string;
};

type AvailabilityInitial = {
  en: string;
  es: string;
};

type ReviewsInitial = {
  summary: string;
};

type TabId =
  | "details"
  | "contact"
  | "pricing"
  | "amenities"
  | "team"
  | "availability"
  | "reviews"
  | "images";

type VendorProfileTabsProps = {
  profileInitial: ProfileInitial;
  vendorName: string;
  heroImage: VendorImage | null;
  thumbnailImage: VendorImage | null;
  galleryImages: VendorImage[];
  contactInitial: ContactInitial;
  pricingInitial: PricingInitial;
  amenitiesInitial: AmenitiesInitial;
  amenityOptions: AmenityOption[];
  teamInitial: TeamMemberInitial[];
  availabilityInitial: AvailabilityInitial;
  reviewsInitial: ReviewsInitial;
};

export default function VendorProfileTabs({
  profileInitial,
  vendorName,
  heroImage,
  thumbnailImage,
  galleryImages,
  contactInitial,
  pricingInitial,
  amenitiesInitial,
  amenityOptions,
  teamInitial,
  availabilityInitial,
  reviewsInitial,
}: VendorProfileTabsProps) {
  const t = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>("details");

  const tabs: { id: TabId; label: string; controls: string }[] = [
    { id: "details", label: t("vendorDashboard.profileTabs.details"), controls: "vendor-profile-tab-details" },
    { id: "contact", label: t("vendorDashboard.profileTabs.contact"), controls: "vendor-profile-tab-contact" },
    { id: "pricing", label: t("vendorDashboard.profileTabs.pricing"), controls: "vendor-profile-tab-pricing" },
    { id: "amenities", label: t("vendorDashboard.profileTabs.amenities"), controls: "vendor-profile-tab-amenities" },
    { id: "team", label: t("vendorDashboard.profileTabs.team"), controls: "vendor-profile-tab-team" },
    { id: "availability", label: t("vendorDashboard.profileTabs.availability"), controls: "vendor-profile-tab-availability" },
    { id: "reviews", label: t("vendorDashboard.profileTabs.reviews"), controls: "vendor-profile-tab-reviews" },
    { id: "images", label: t("vendorDashboard.profileTabs.images"), controls: "vendor-profile-tab-images" },
  ];

  return (
    <section className="card">
      <div className="card-header border-0 pb-0">
        <ul className="nav nav-tabs card-header-tabs" id="vendor-profile-tablist" role="tablist">
          {tabs.map((tab) => (
            <li className="nav-item" key={tab.id} role="presentation">
              <button
                type="button"
                className={`nav-link ${activeTab === tab.id ? "active" : ""}`}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={tab.controls}
                id={`${tab.controls}-trigger`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="card-body">
        <div
          id="vendor-profile-tab-details"
          role="tabpanel"
          aria-labelledby="vendor-profile-tab-details-trigger"
          hidden={activeTab !== "details"}
        >
          {activeTab === "details" ? <ProfileForm initial={profileInitial} /> : null}
        </div>
        <div
          id="vendor-profile-tab-contact"
          role="tabpanel"
          aria-labelledby="vendor-profile-tab-contact-trigger"
          hidden={activeTab !== "contact"}
        >
          {activeTab === "contact" ? (
            <ContactForm key={JSON.stringify(contactInitial)} initial={contactInitial} />
          ) : null}
        </div>
        <div
          id="vendor-profile-tab-pricing"
          role="tabpanel"
          aria-labelledby="vendor-profile-tab-pricing-trigger"
          hidden={activeTab !== "pricing"}
        >
          {activeTab === "pricing" ? (
            <PricingForm key={JSON.stringify(pricingInitial)} initial={pricingInitial} />
          ) : null}
        </div>
        <div
          id="vendor-profile-tab-amenities"
          role="tabpanel"
          aria-labelledby="vendor-profile-tab-amenities-trigger"
          hidden={activeTab !== "amenities"}
        >
          {activeTab === "amenities" ? (
            <AmenitiesForm
              key={`${JSON.stringify(amenitiesInitial)}-${amenityOptions.length}`}
              initial={amenitiesInitial}
              options={amenityOptions}
            />
          ) : null}
        </div>
        <div
          id="vendor-profile-tab-team"
          role="tabpanel"
          aria-labelledby="vendor-profile-tab-team-trigger"
          hidden={activeTab !== "team"}
        >
          {activeTab === "team" ? (
            <TeamForm key={JSON.stringify(teamInitial)} initial={teamInitial} />
          ) : null}
        </div>
        <div
          id="vendor-profile-tab-availability"
          role="tabpanel"
          aria-labelledby="vendor-profile-tab-availability-trigger"
          hidden={activeTab !== "availability"}
        >
          {activeTab === "availability" ? (
            <AvailabilityForm key={JSON.stringify(availabilityInitial)} initial={availabilityInitial} />
          ) : null}
        </div>
        <div
          id="vendor-profile-tab-reviews"
          role="tabpanel"
          aria-labelledby="vendor-profile-tab-reviews-trigger"
          hidden={activeTab !== "reviews"}
        >
          {activeTab === "reviews" ? (
            <ReviewsForm key={JSON.stringify(reviewsInitial)} initial={reviewsInitial} />
          ) : null}
        </div>
        <div
          id="vendor-profile-tab-images"
          role="tabpanel"
          aria-labelledby="vendor-profile-tab-images-trigger"
          hidden={activeTab !== "images"}
        >
          {activeTab === "images" ? (
            <ImagesForm
              vendorName={vendorName}
              heroImage={heroImage}
              thumbnailImage={thumbnailImage}
              galleryImages={galleryImages}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
