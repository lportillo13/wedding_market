import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isMissingOwnerColumnError, type OwnerColumn } from "@/lib/supabase/ownerColumns";
import { createReview, type CreateReviewState } from "@/app/account/reviews/actions";
import ReviewForm from "./ReviewForm";

export default async function NewReviewPage({
  params,
}: {
  params: Promise<{ rfq_id: string }>;
}) {
  const { rfq_id } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) {
    throw new Error(userErr.message);
  }

  if (!user) {
    redirect("/signup");
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const selectColumns = {
    owner_id: "id, accepted_quote_id, owner_id",
    owner_uuid: "id, accepted_quote_id, owner_id:owner_uuid",
  } as const satisfies Record<OwnerColumn, string>;

  const selectRfq = (client: SupabaseClient, column: OwnerColumn) =>
    client
      .from("rfqs")
      .select(selectColumns[column])
      .eq("id", rfq_id)
      .maybeSingle<{ id: string; accepted_quote_id: string | null; owner_id: string }>();

  let ownerColumn: OwnerColumn = "owner_id";
  let {
    data: rfq,
    error: rfqErr,
  } = await selectRfq(supabase, ownerColumn);

  if (isMissingOwnerColumnError(rfqErr, ownerColumn)) {
    ownerColumn = "owner_uuid";
    const retry = await selectRfq(supabase, ownerColumn);
    rfq = retry.data;
    rfqErr = retry.error;
  }

  if (rfqErr && supabaseAdmin && /infinite recursion detected in policy/i.test(rfqErr.message)) {
    const retry = await selectRfq(supabaseAdmin, ownerColumn);
    rfq = retry.data;
    rfqErr = retry.error;
  }

  if (rfqErr) throw new Error(rfqErr.message);
  if (!rfq || rfq.owner_id !== user.id) {
    return (
      <main className="container py-4" style={{ maxWidth: 720 }}>
        <h1 className="mb-3">Write a review</h1>
        <div className="alert alert-warning">You can only review your own RFQs.</div>
        <Link className="btn btn-outline-secondary mt-3" href="/account/rfqs">
          Back to my RFQs
        </Link>
      </main>
    );
  }

  let vendorId: string | null = null;
  if (rfq?.accepted_quote_id) {
    const { data: quote, error: quoteErr } = await supabase
      .from("quotes")
      .select("vendor_id")
      .eq("id", rfq.accepted_quote_id)
      .maybeSingle<{ vendor_id: string }>();

    if (quoteErr) throw new Error(quoteErr.message);
    vendorId = quote?.vendor_id ?? null;
  }

  if (!vendorId) {
    return (
      <main className="container py-4" style={{ maxWidth: 720 }}>
        <h1 className="mb-3">Write a review</h1>
        <div className="alert alert-warning">You can only review vendors you hired.</div>
        <Link className="btn btn-outline-secondary mt-3" href="/account/rfqs">
          Back to my RFQs
        </Link>
      </main>
    );
  }

  const { data: allowed, error: allowedErr } = await supabase.rpc("can_user_review", {
    _uid: user.id,
    _vendor_id: vendorId,
    _rfq_id: rfq_id,
  });
  if (allowedErr) throw new Error(allowedErr.message);

  const { data: done, error: doneErr } = await supabase.rpc("has_user_reviewed", {
    _uid: user.id,
    _vendor_id: vendorId,
    _rfq_id: rfq_id,
  });
  if (doneErr) throw new Error(doneErr.message);

  const hasReviewed = !!done;
  const canWrite = !!allowed && !hasReviewed;

  if (!canWrite) {
    return (
      <main className="container py-4" style={{ maxWidth: 720 }}>
        <h1 className="mb-3">Write a review</h1>
        <div className="alert alert-info">
          You can only review vendors you hired and haven’t already reviewed.
        </div>
        <Link className="btn btn-outline-secondary mt-3" href="/account/reviews">
          See my reviews
        </Link>
      </main>
    );
  }

  async function action(prev: CreateReviewState, fd: FormData): Promise<CreateReviewState> {
    const res = await createReview(prev, fd);
    if (res.ok) {
      revalidatePath("/vendors");
    }
    return res;
  }

  return (
    <main className="container py-4" style={{ maxWidth: 720 }}>
      <h1 className="mb-3">Write a review</h1>
      <ReviewForm rfq_id={rfq_id} vendor_id={vendorId} action={action} />
    </main>
  );
}
