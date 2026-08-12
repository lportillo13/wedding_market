import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createVendorQuoteAcceptedNotification } from "@/lib/notifications";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isMissingOwnerColumnError, type OwnerColumn } from "@/lib/supabase/ownerColumns";
import { createAuthenticatedRequestClient } from "@/lib/supabase/request";

const payloadSchema = z.object({
  rfqId: z.string().uuid(),
  quoteId: z.string().uuid(),
  vendorId: z.string().uuid(),
  revealEmail: z.boolean().default(true),
  revealPhone: z.boolean().default(false),
});

function isMissingThreadColumnsError(message: string | undefined) {
  return /reveal_email|reveal_phone|last_activity_at|client_last_read_at|closed_at|closed_reason/i.test(
    message ?? ""
  );
}

async function loadOwnedRfq(client: SupabaseClient, rfqId: string, userId: string) {
  const selectRfq = (column: OwnerColumn) =>
    client
      .from("rfqs")
      .select(column === "owner_id" ? "id, owner_id, accepted_quote_id" : "id, owner_id:owner_uuid, accepted_quote_id")
      .eq("id", rfqId)
      .eq(column, userId)
      .maybeSingle<{ id: string; owner_id: string; accepted_quote_id: string | null }>();

  let ownerColumn: OwnerColumn = "owner_id";
  let result = await selectRfq(ownerColumn);
  if (isMissingOwnerColumnError(result.error, ownerColumn)) {
    ownerColumn = "owner_uuid";
    result = await selectRfq(ownerColumn);
  }
  return result;
}

export async function POST(request: Request) {
  const supabase = await createAuthenticatedRequestClient(request);
  const supabaseAdmin = createSupabaseAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "Authentication required." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid quote selection." }, { status: 400 });
  }

  const input = parsed.data;
  let { data: rfq, error: rfqError } = await loadOwnedRfq(supabase, input.rfqId, user.id);
  if ((!rfq || rfqError) && supabaseAdmin) {
    const retry = await loadOwnedRfq(supabaseAdmin, input.rfqId, user.id);
    rfq = retry.data;
    rfqError = retry.error;
  }

  if (rfqError) {
    return NextResponse.json({ ok: false, message: rfqError.message }, { status: 500 });
  }
  if (!rfq) {
    return NextResponse.json({ ok: false, message: "You do not have access to this request." }, { status: 403 });
  }
  if (rfq.accepted_quote_id) {
    if (rfq.accepted_quote_id === input.quoteId) {
      return NextResponse.json({ ok: true, alreadyAccepted: true });
    }
    return NextResponse.json({ ok: false, message: "A quote has already been accepted for this request." }, { status: 409 });
  }

  const workflowClient = supabaseAdmin ?? supabase;
  const { data: quote, error: quoteError } = await workflowClient
    .from("quotes")
    .select("id, rfq_id, vendor_id")
    .eq("id", input.quoteId)
    .maybeSingle<{ id: string; rfq_id: string; vendor_id: string }>();

  if (quoteError) {
    return NextResponse.json({ ok: false, message: quoteError.message }, { status: 500 });
  }
  if (!quote || quote.rfq_id !== input.rfqId || quote.vendor_id !== input.vendorId) {
    return NextResponse.json({ ok: false, message: "Quote not found." }, { status: 404 });
  }

  const { data: invite, error: inviteAccessError } = await workflowClient
    .from("rfq_invites")
    .select("status, expires_at")
    .eq("rfq_id", input.rfqId)
    .eq("vendor_id", input.vendorId)
    .maybeSingle<{ status: string | null; expires_at: string | null }>();

  if (inviteAccessError) {
    return NextResponse.json({ ok: false, message: inviteAccessError.message }, { status: 500 });
  }

  const inviteStatus = invite?.status?.trim().toLowerCase();
  const inviteExpiresAt = invite?.expires_at ? Date.parse(invite.expires_at) : Number.NaN;
  if (
    !invite ||
    inviteStatus === "declined" ||
    inviteStatus === "expired" ||
    (Number.isFinite(inviteExpiresAt) && inviteExpiresAt <= Date.now())
  ) {
    return NextResponse.json({ ok: false, message: "This quote request is closed or expired." }, { status: 409 });
  }

  const now = new Date().toISOString();
  const { data: acceptedRfq, error: acceptError } = await workflowClient
    .from("rfqs")
    .update({ accepted_quote_id: input.quoteId, accepted_at: now })
    .eq("id", input.rfqId)
    .is("accepted_quote_id", null)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (acceptError) {
    return NextResponse.json({ ok: false, message: acceptError.message }, { status: 500 });
  }
  if (!acceptedRfq) {
    return NextResponse.json({ ok: false, message: "A quote was accepted while this request was being updated." }, { status: 409 });
  }

  let { error: inviteError } = await workflowClient
    .from("rfq_invites")
    .update({
      status: "accepted",
      reveal_email: input.revealEmail,
      reveal_phone: input.revealPhone,
      last_activity_at: now,
      client_last_read_at: now,
      closed_at: null,
      closed_reason: null,
    })
    .eq("rfq_id", input.rfqId)
    .eq("vendor_id", input.vendorId);

  if (inviteError && isMissingThreadColumnsError(inviteError.message)) {
    const fallback = await workflowClient
      .from("rfq_invites")
      .update({ status: "accepted" })
      .eq("rfq_id", input.rfqId)
      .eq("vendor_id", input.vendorId);
    inviteError = fallback.error;
  }

  if (inviteError) {
    await workflowClient
      .from("rfqs")
      .update({ accepted_quote_id: null, accepted_at: null })
      .eq("id", input.rfqId)
      .eq("accepted_quote_id", input.quoteId);
    return NextResponse.json({ ok: false, message: inviteError.message }, { status: 500 });
  }

  let { error: closeOthersError } = await workflowClient
    .from("rfq_invites")
    .update({ status: "declined", closed_at: now, closed_reason: "accepted_other_vendor", last_activity_at: now })
    .eq("rfq_id", input.rfqId)
    .neq("vendor_id", input.vendorId);

  if (closeOthersError && isMissingThreadColumnsError(closeOthersError.message)) {
    const fallback = await workflowClient
      .from("rfq_invites")
      .update({ status: "declined" })
      .eq("rfq_id", input.rfqId)
      .neq("vendor_id", input.vendorId);
    closeOthersError = fallback.error;
  }

  if (closeOthersError && process.env.NODE_ENV !== "production") {
    console.warn("Quote accepted but other invites were not closed", closeOthersError.message);
  }

  const [{ data: vendor }, { data: profile }] = await Promise.all([
    workflowClient.from("vendors").select("owner_id").eq("id", input.vendorId).maybeSingle<{ owner_id: string | null }>(),
    workflowClient.from("profiles").select("full_name").eq("id", user.id).maybeSingle<{ full_name: string | null }>(),
  ]);

  if (vendor?.owner_id) {
    const { error: notificationError } = await createVendorQuoteAcceptedNotification(workflowClient, {
      recipientId: vendor.owner_id,
      actorId: user.id,
      rfqId: input.rfqId,
      quoteId: input.quoteId,
      vendorId: input.vendorId,
      acceptedByName: profile?.full_name ?? null,
      revealEmail: input.revealEmail,
      revealPhone: input.revealPhone,
    });

    if (notificationError && process.env.NODE_ENV !== "production") {
      console.warn("Failed to create quote acceptance notification", notificationError.message);
    }
  }

  return NextResponse.json({ ok: true });
}
