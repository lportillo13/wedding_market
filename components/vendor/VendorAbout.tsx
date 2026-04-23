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
  const serviceProfile = getVendorServiceProfile(categoryKeys);
  const serviceDetailHeadings = labels.serviceDetailHeadings as Record<string, string>;
  const detailsHeading = serviceDetailHeadings[serviceProfile.key] ?? labels.spacesHeading;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start mb-4">
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
      {vendor.summary ? <div className="lead text-body-secondary">{renderParagraphs(vendor.summary)}</div> : null}
      {vendor.description ? <div>{renderParagraphs(vendor.description)}</div> : null}

      {spaces.length ? (
        <div className="mt-5">
          <h3 className="h4 mb-3">{detailsHeading}</h3>
          <div className="row g-4">
            {spaces.map((space) => (
              <div className="col-12 col-md-6" key={space.id}>
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
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
