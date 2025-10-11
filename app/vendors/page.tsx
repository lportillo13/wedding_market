// app/vendors/page.tsx
import { headers } from "next/headers";
import ShortlistButton from "@/components/shortlist/ShortlistButton";

type VendorItem = {
  id: string;
  slug: string;
  business_name: string;
  bio_en: string;
  bio_es?: string;
  categories: string[];
  rating_avg: number;
  rating_count: number;
  created_at: string;
};

type VendorsResponse = {
  items: VendorItem[];
  total: number;
  page: number;
  pageSize: number;
};

async function fetchVendors(sp: Record<string, string>): Promise<VendorsResponse> {
  const qs = new URLSearchParams();
  if (sp.q) qs.set("q", sp.q);
  if (sp.category) qs.set("category", sp.category);
  if (sp.page) qs.set("page", sp.page);

  // 🔧 Build absolute URL (relative fails on the server)
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const base = process.env.NEXT_PUBLIC_APP_URL ?? `${proto}://${host}`;

  const url = `${base}/api/vendors${qs.toString() ? `?${qs.toString()}` : ""}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load vendors (${res.status})`);
  return res.json();
}

export default async function VendorsPage({
  searchParams,
}: {
  // Next.js 15: searchParams is async
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const { items, total } = await fetchVendors(sp);

  const page = Number(sp.page || 1);
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

  return (
    <main className="container py-4">
      <h1 className="mb-3">Vendors</h1>

      <form className="row g-2 mb-4" action="/vendors" method="get">
        <div className="col-md-6">
          <input
            className="form-control"
            name="q"
            placeholder="Search vendors (name, bio)…"
            defaultValue={sp.q || ""}
          />
        </div>
        <div className="col-md-4">
          <input
            className="form-control"
            name="category"
            placeholder="Filter by category slug (e.g. photography)"
            defaultValue={sp.category || ""}
          />
        </div>
        <div className="col-md-2 d-grid">
          <button className="btn btn-primary" type="submit">Search</button>
        </div>
      </form>

      {items.length === 0 ? (
        <div className="alert alert-warning">No vendors found.</div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
          {items.map((v) => (
            <div className="col" key={v.id}>
              <div className="card h-100">
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title mb-1">
                    <a href={`/vendors/${v.slug}`} className="stretched-link text-decoration-none">
                      {v.business_name}
                    </a>
                  </h5>
                  {v.categories?.length > 0 && (
                    <div className="mb-2 small text-secondary">
                      {v.categories.join(" • ")}
                    </div>
                  )}
                  {v.bio_en && (
                    <p className="card-text flex-grow-1">
                      {v.bio_en.length > 140 ? v.bio_en.slice(0, 140) + "…" : v.bio_en}
                    </p>
                  )}
                  <div className="d-flex align-items-center justify-content-between mt-2">
                    <div className="small text-secondary">
                      ⭐ {Number(v.rating_avg || 0).toFixed(1)} ({v.rating_count || 0})
                    </div>
                    <ShortlistButton vendorId={v.id} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <nav className="mt-4" aria-label="Page navigation">
        <ul className="pagination">
          <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
            <a
              className="page-link"
              href={`/vendors?${new URLSearchParams({ ...sp, page: String(Math.max(1, page - 1)) }).toString()}`}
            >
              Prev
            </a>
          </li>
          <li className="page-item disabled">
            <span className="page-link">Page {page} / {Math.max(1, totalPages)}</span>
          </li>
          <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
            <a
              className="page-link"
              href={`/vendors?${new URLSearchParams({ ...sp, page: String(Math.min(totalPages, page + 1)) }).toString()}`}
            >
              Next
            </a>
          </li>
        </ul>
      </nav>
    </main>
  );
}
