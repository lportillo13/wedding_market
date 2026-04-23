import Link from "next/link";
import { fillTemplate, getLanguageLocale } from "@/lib/i18n";
import { getRequestI18n } from "@/lib/i18n/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export default async function MyReviewsPage() {
  const supabase = await getSupabaseServer();
  const { dictionary, language } = await getRequestI18n();
  const labels = dictionary.account.reviewsPage;
  const locale = getLanguageLocale(language);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="container py-4">
        <div className="alert alert-warning">{labels.loginRequired}</div>
        <Link className="btn btn-primary" href="/login?next=/account/reviews">
          {labels.loginAction}
        </Link>
      </main>
    );
  }

  const { data: rows, error } = await supabase
    .from("reviews")
    .select("id, rfq_id, vendor_id, stars, title, created_at")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="container py-4">
      <h1 className="mb-3">{labels.title}</h1>
      {!rows?.length ? (
        <div className="alert alert-secondary">{labels.empty}</div>
      ) : (
        <div className="vstack gap-3">
          {rows.map((review) => (
            <div className="card" key={review.id}>
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div>
                    <div className="fw-semibold">{fillTemplate(labels.requestLabel, { rfq: review.rfq_id.slice(0, 8) })}</div>
                    <div className="small text-secondary">{new Date(review.created_at!).toLocaleString(locale)}</div>
                  </div>
                  <div className="fs-5">{"★".repeat(review.stars)}{"☆".repeat(5 - review.stars)}</div>
                </div>
                {review.title && <div className="mt-2">{review.title}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
