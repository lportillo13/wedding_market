"use client";
/* eslint-disable @next/next/no-img-element -- Reuse the admitted company logo without adding an optimizer cache. */

import { useState } from 'react';
import HeaderIcon from '@/components/HeaderIcon';
import { useLanguage } from "@/contexts/LanguageContext";
import { getVendorServiceProfile } from "@/lib/vendorServiceProfile";
import { resolveMediaUrl } from '@/lib/media-url';
import { localizeVendorCategory } from '@/shared/vendors/category-label';
import type { VendorProfileDTO, VendorSpace } from "@/types/vendor-profile";

type VendorAboutProps = {
  vendor: VendorProfileDTO["vendor"];
  spaces: VendorSpace[];
  categoryKeys: readonly (string | null | undefined)[];
  categories?: VendorProfileDTO['breadcrumbs']['categories'];
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

export default function VendorAbout({ vendor, spaces, categoryKeys, categories = [] }: VendorAboutProps) {
  const { dictionary, language } = useLanguage();
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const labels = dictionary.vendorPublic.about;
  const headerLabels = dictionary.vendorPublic.header;
  const serviceProfile = getVendorServiceProfile(categoryKeys);
  const serviceDetailHeadings = labels.serviceDetailHeadings as Record<string, string>;
  const detailsHeading = serviceDetailHeadings[serviceProfile.key] ?? labels.spacesHeading;
  const initials = vendor.name.trim().split(/\s+/).slice(0, 2).map(word => Array.from(word)[0]).join('').toLocaleUpperCase(language);
  const hasFacts = vendor.teamSizeRange || vendor.yearsInBusiness || vendor.languages.length > 0 || vendor.eventTypes.length > 0;

  return (
    <div className="wm-profile-about wm-profile-about--signature">
      <div className="wm-profile-about__signature">
        <div className="wm-profile-about__logo">
          {vendor.logoUrl && failedLogo !== vendor.logoUrl ? <img src={resolveMediaUrl(vendor.logoUrl)} alt={fill(headerLabels.logoAlt, { vendor: vendor.name })} width={112} height={112} loading="lazy" onError={() => setFailedLogo(vendor.logoUrl)}/> : <span aria-hidden="true">{initials}</span>}
        </div>
        <p className="wm-profile-eyebrow">{dictionary.vendorPublic.editorial.story}</p>
        <h2>{fill(labels.heading, { vendor: vendor.name })}</h2>
        {categories.length > 0 && <p className="wm-profile-about__category">{categories.map(category => localizeVendorCategory(category, dictionary.home.categories.items, dictionary.vendorPublic.categoryLabels)).join(' · ')}</p>}
        {vendor.websiteUrl ? (
          <a href={vendor.websiteUrl} className="wm-profile-about__website" target="_blank" rel="noreferrer">
            {fill(labels.visitWebsite, { vendor: vendor.name })}<HeaderIcon name="arrow"/>
          </a>
        ) : null}
      </div>
      {hasFacts && <div className="wm-profile-about__facts" role="group" aria-label={dictionary.vendorPublic.editorial.atAGlance}>
        {vendor.teamSizeRange && <span><HeaderIcon name="users"/><span>{fill(labels.teamSize, { size: vendor.teamSizeRange })}</span></span>}
        {vendor.yearsInBusiness ? <span><HeaderIcon name="calendar"/><span>{fill(headerLabels.yearsInBusiness, { years: vendor.yearsInBusiness })}</span></span> : null}
        {vendor.languages.length > 0 && <span><HeaderIcon name="globe"/><span>{fill(headerLabels.languages, { languages: vendor.languages.join(', ') })}</span></span>}
        {vendor.eventTypes.length > 0 && <span><HeaderIcon name="rings"/><span>{vendor.eventTypes.join(' · ')}</span></span>}
      </div>}
      <div className="wm-profile-about__description">
        {vendor.summary ? <div className="lead">{renderParagraphs(vendor.summary)}</div> : null}
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
