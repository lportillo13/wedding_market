"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { getVendorServiceProfile } from "@/lib/vendorServiceProfile";
import type { VendorProfileDTO, VendorSpace } from "@/types/vendor-profile";

type VendorAboutProps = {
  vendor: VendorProfileDTO["vendor"];
  spaces: VendorSpace[];
  categoryKeys: readonly (string | null | undefined)[];
};

function fill(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

function renderParagraphs(text: string | null) {
  if (!text) return null;
  return text.split(/\n+/).map((paragraph, index) => (
    <p key={index} className="mb-3">
      {paragraph.trim()}
    </p>
  ));
}

export default function VendorAbout({ vendor, spaces, categoryKeys }: VendorAboutProps) {
  const { dictionary } = useLanguage();
  const labels = dictionary.vendorPublic.about;
  const headerLabels = dictionary.vendorPublic.header;
  const serviceProfile = getVendorServiceProfile(categoryKeys);
  const serviceDetailHeadings = labels.serviceDetailHeadings as Record<string, string>;
  const detailsHeading = serviceDetailHeadings[serviceProfile.key] ?? labels.spacesHeading;

  return (
    <div className="wm-profile-about">
      <div className="wm-profile-section-heading d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2 className="h3">{fill(labels.heading, { vendor: vendor.name })}</h2>
          {vendor.teamSizeRange ? (
            <div className="text-muted small">{fill(labels.teamSize, { size: vendor.teamSizeRange })}</div>
          ) : null}
        </div>
        {vendor.websiteUrl ? (
          <a href={vendor.websiteUrl} className="btn btn-outline-primary" target="_blank" rel="noreferrer">
            {fill(labels.visitWebsite, { vendor: vendor.name })}
          </a>
        ) : null}
      </div>
      {(vendor.yearsInBusiness || vendor.languages.length > 0 || vendor.eventTypes.length > 0) && <div className="wm-profile-about__facts" role="group" aria-label={dictionary.vendorPublic.editorial.atAGlance}>
        {vendor.yearsInBusiness ? <span>{fill(headerLabels.yearsInBusiness, { years: vendor.yearsInBusiness })}</span> : null}
        {vendor.languages.length > 0 && <span>{fill(headerLabels.languages, { languages: vendor.languages.join(', ') })}</span>}
        {vendor.eventTypes.length > 0 && <span>{vendor.eventTypes.join(' · ')}</span>}
      </div>}
      <div className="wm-profile-about__description">
        {vendor.summary ? <div className="lead text-body-secondary">{renderParagraphs(vendor.summary)}</div> : null}
        {vendor.description ? <div>{renderParagraphs(vendor.description)}</div> : null}
      </div>

      {spaces.length ? (
        <div className="mt-5">
          <h3 className="h4 mb-3">{detailsHeading}</h3>
          <div className="row g-4 wm-profile-services">
            {spaces.map((space, index) => (
              <div className="col-12 col-md-6" key={space.id}>
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    <span className="wm-profile-service-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                    <h4 className="card-title h5">{space.name}</h4>
                    {serviceProfile.supportsGuestCapacity && space.capacityMax ? (
                      <p className="text-muted small mb-2">{fill(labels.capacity, { count: space.capacityMax })}</p>
                    ) : null}
                    {renderParagraphs(space.description)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
