import type { VendorProfileDTO, VendorSpace } from "@/types/vendor-profile";

type VendorAboutProps = {
  vendor: VendorProfileDTO["vendor"];
  spaces: VendorSpace[];
};

function renderParagraphs(text: string | null) {
  if (!text) return null;
  return text.split(/\n+/).map((paragraph, index) => (
    <p key={index} className="mb-3">
      {paragraph.trim()}
    </p>
  ));
}

export default function VendorAbout({ vendor, spaces }: VendorAboutProps) {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2 className="h3">About {vendor.name}</h2>
          {vendor.teamSizeRange ? (
            <div className="text-muted small">Team size: {vendor.teamSizeRange}</div>
          ) : null}
        </div>
        {vendor.websiteUrl ? (
          <a href={vendor.websiteUrl} className="btn btn-outline-primary" target="_blank" rel="noreferrer">
            Visit Website
          </a>
        ) : null}
      </div>
      {vendor.summary ? <div className="lead text-body-secondary">{renderParagraphs(vendor.summary)}</div> : null}
      {vendor.description ? <div>{renderParagraphs(vendor.description)}</div> : null}

      {spaces.length ? (
        <div className="mt-5">
          <h3 className="h4 mb-3">Event Spaces</h3>
          <div className="row g-4">
            {spaces.map((space) => (
              <div className="col-12 col-md-6" key={space.id}>
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    <h4 className="card-title h5">{space.name}</h4>
                    {space.capacityMax ? (
                      <p className="text-muted small mb-2">Capacity up to {space.capacityMax} guests</p>
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
