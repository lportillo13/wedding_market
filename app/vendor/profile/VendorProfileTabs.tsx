"use client";

import { useState } from "react";
import ProfileForm from "./profileForm";
import ImagesForm from "./ImagesForm";
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

type TabId = "details" | "images";

type VendorProfileTabsProps = {
  profileInitial: ProfileInitial;
  vendorName: string;
  heroImage: VendorImage | null;
  thumbnailImage: VendorImage | null;
  galleryImages: VendorImage[];
};

export default function VendorProfileTabs({
  profileInitial,
  vendorName,
  heroImage,
  thumbnailImage,
  galleryImages,
}: VendorProfileTabsProps) {
  const t = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>("details");

  const tabs: { id: TabId; label: string; controls: string }[] = [
    { id: "details", label: t("vendorDashboard.profileTabs.details"), controls: "vendor-profile-tab-details" },
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
