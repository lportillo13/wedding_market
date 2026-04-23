"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { getVendorServiceProfile, type VendorAmenityGroupKey } from "@/lib/vendorServiceProfile";
import type { VendorAmenity } from "@/types/vendor-profile";

type VendorAmenitiesProps = {
  amenities: {
    amenities: VendorAmenity[];
    ceremonyTypes: VendorAmenity[];
    settings: VendorAmenity[];
    services: VendorAmenity[];
  };
  capacityMax: number | null;
  categoryKeys: readonly (string | null | undefined)[];
};

function fill(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export default function VendorAmenities({ amenities, capacityMax, categoryKeys }: VendorAmenitiesProps) {
  const { dictionary } = useLanguage();
  const labels = dictionary.vendorPublic.amenities;
  const serviceProfile = getVendorServiceProfile(categoryKeys);
  const categoryHeadings = labels.categoryHeadings as Record<string, string>;
  const groupLabelsByCategory = labels.groupLabelsByCategory as Record<
    string,
    Partial<Record<VendorAmenityGroupKey, string>>
  >;
  const categoryGroupLabels = groupLabelsByCategory[serviceProfile.key] ?? {};
  const groups = [
    { key: "amenities", label: categoryGroupLabels.amenities ?? labels.groups.amenities },
    { key: "ceremonyTypes", label: categoryGroupLabels.ceremonyTypes ?? labels.groups.ceremonyTypes },
    { key: "settings", label: categoryGroupLabels.settings ?? labels.groups.settings },
    { key: "services", label: categoryGroupLabels.services ?? labels.groups.services },
  ] as const;
  const hasData = groups.some((group) => amenities[group.key]?.length);
  const heading = categoryHeadings[serviceProfile.key] ?? labels.heading;

  return (
    <div>
      <h2 className="h3 mb-4">{heading}</h2>
      {serviceProfile.supportsGuestCapacity && capacityMax ? (
        <p className="text-muted">{fill(labels.capacity, { count: capacityMax })}</p>
      ) : null}
      {hasData ? (
        <div className="row g-4">
          {groups.map((group) => {
            const items = amenities[group.key] ?? [];
            if (!items.length) return null;
            return (
              <div className="col-12 col-md-6" key={group.key}>
                <h3 className="h5 mb-3">{group.label}</h3>
                <ul className="list-unstyled mb-0">
                  {items.map((item) => (
                    <li key={item.key} className="d-flex align-items-center gap-2 mb-2">
                      <span aria-hidden="true" className="text-success">✓</span>
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-muted">{labels.empty}</p>
      )}
    </div>
  );
}
