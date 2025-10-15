import type { VendorAmenity } from "@/types/vendor-profile";

type VendorAmenitiesProps = {
  amenities: {
    amenities: VendorAmenity[];
    ceremonyTypes: VendorAmenity[];
    settings: VendorAmenity[];
    services: VendorAmenity[];
  };
  capacityMax: number | null;
};

const GROUPS: { key: keyof VendorAmenitiesProps["amenities"]; label: string }[] = [
  { key: "amenities", label: "Amenities" },
  { key: "ceremonyTypes", label: "Ceremony Types" },
  { key: "settings", label: "Settings" },
  { key: "services", label: "Services" },
];

export default function VendorAmenities({ amenities, capacityMax }: VendorAmenitiesProps) {
  const hasData = GROUPS.some((group) => amenities[group.key]?.length);

  return (
    <div>
      <h2 className="h3 mb-4">Amenities & Details</h2>
      {capacityMax ? <p className="text-muted">Maximum capacity: {capacityMax} guests</p> : null}
      {hasData ? (
        <div className="row g-4">
          {GROUPS.map((group) => {
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
        <p className="text-muted">Amenities are being updated.</p>
      )}
    </div>
  );
}
