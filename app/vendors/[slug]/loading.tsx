export default function LoadingVendorProfile() {
  return (
    <div className="container py-5">
      <div className="placeholder-glow mb-4">
        <div className="placeholder col-3" style={{ height: "1.25rem" }} />
      </div>
      <div className="placeholder-glow mb-3">
        <div className="placeholder col-6" style={{ height: "2.5rem" }} />
      </div>
      <div className="placeholder-glow mb-4 d-flex gap-2">
        <div className="placeholder col-2" style={{ height: "2rem" }} />
        <div className="placeholder col-2" style={{ height: "2rem" }} />
        <div className="placeholder col-2" style={{ height: "2rem" }} />
      </div>
      <div className="row g-3">
        {[...Array(6)].map((_, index) => (
          <div className="col-12 col-md-4" key={index}>
            <div className="ratio ratio-4x3 bg-light-subtle rounded" />
          </div>
        ))}
      </div>
      <div className="placeholder-glow mt-5">
        <div className="placeholder col-7 mb-2" style={{ height: "1rem" }} />
        <div className="placeholder col-5 mb-2" style={{ height: "1rem" }} />
        <div className="placeholder col-9 mb-2" style={{ height: "1rem" }} />
      </div>
    </div>
  );
}
