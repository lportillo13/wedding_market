// app/vendors/[slug]/page.tsx
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import ShortlistButton from "@/components/shortlist/ShortlistButton";
import ReviewsList from "./Reviews"; // 👈 add this

function supabasePublic() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

type Vendor = {
  id: string;
  slug: string;
  business_name: string;
  bio_en: string | null;
  bio_es: string | null;
  categories: string[] | null;
  rating_avg: number | null;
  rating_count: number | null;
  created_at: string;
  is_published: boolean;
};

export default async function VendorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // ✅ Next 15: await params

  const supabase = supabasePublic();
  const { data: vendor, error } = await supabase
    .from("vendor_public_search")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<Vendor>();

  if (error) {
    throw new Error(error.message);
  }
  if (!vendor) {
    notFound();
  }

  const avg = Number(vendor.rating_avg || 0);
  const count = Number(vendor.rating_count || 0);
  const rounded = Math.round(avg);

  return (
    <main className="container py-4" style={{ maxWidth: 960 }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="mb-0">{vendor.business_name}</h1>
        <ShortlistButton vendorId={vendor.id} />
      </div>

      {vendor.categories?.length ? (
        <div className="mb-2 small text-secondary">
          {vendor.categories.join(" • ")}
        </div>
      ) : null}

      {/* Rating summary */}
      <div className="mb-3 d-flex align-items-center gap-2">
        <div className="fs-5">
          {"★".repeat(rounded)}
          {"☆".repeat(5 - rounded)}
        </div>
        <div className="small text-secondary">
          {avg.toFixed(2)} ({count} review{count === 1 ? "" : "s"})
        </div>
      </div>

      {vendor.bio_en ? <p className="lead">{vendor.bio_en}</p> : null}

      <hr className="my-4" />

      {/* Reviews list (public) */}
      <ReviewsList vendor_id={vendor.id} />

      {/* Placeholder for gallery, FAQs, coupons, etc. */}
      <div className="alert alert-info mt-4">
        More details (gallery, FAQs, coupons) coming soon.
      </div>
    </main>
  );
}
