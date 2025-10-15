import type { VendorProfileDTO } from "@/types/vendor-profile";

type VendorAvailabilityProps = {
  note: VendorProfileDTO["availability"]["note"];
};

export default function VendorAvailability({ note }: VendorAvailabilityProps) {
  return (
    <div>
      <h2 className="h3 mb-3">Availability</h2>
      {note ? (
        <p className="mb-0">{note}</p>
      ) : (
        <div className="alert alert-info mb-0" role="status">
          Availability calendar coming soon. Contact the vendor for current openings.
        </div>
      )}
    </div>
  );
}
