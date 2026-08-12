import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createQuoteAnsweredNotification } from "@/lib/notifications";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isMissingOwnerColumnError, type OwnerColumn } from "@/lib/supabase/ownerColumns";
import { createAuthenticatedRequestClient } from "@/lib/supabase/request";

const payloadSchema = z.object({
  rfqId: z.string().uuid(),
  vendorId: z.string().uuid(),
  amountCents: z.number().int().positive().max(100_000_000_00),
  message: z.string().trim().max(2000).optional().nullable(),
});

function isMissingThreadColumnsError(message: string | undefined) {
  return /last_activity_at|vendor_last_read_at/i.test(message ?? "");
}

async function loadRfq(client: SupabaseClient, rfqId: string) {
  const selectRfq = (column: OwnerColumn) =>
    client
      .from("rfqs")
      .select(column === "owner_id" ? "id, owner_id, accepted_quote_id" : "id, owner_id:owner_uuid, accepted_quote_id")
      .eq("id", rfqId)
      .maybeSingle<{ id: string; owner_id: string | null; accepted_quote_id: string | null }>();

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
    return NextResponse.json({ ok: false, message: "Enter a valid quote amount and message." }, { status: 400 });
  }

  const input = parsed.data;
  const selectVendor = (ownerId: string) =>
    supabase
      .from("vendors")
      .select("id, business_name")
      .eq("id", input.vendorId)
      .eq("owner_id", ownerId)
      .maybeSingle<{ id: string; business_name: string | null }>();

  let { data: vendor, error: vendorError } = await selectVendor(user.id);
  if ((!vendor || vendorError) && supabaseAdmin) {
    const retry = await supabaseAdmin
      .from("vendors")
      .select("id, business_name")
      .eq("id", input.vendorId)
      .eq("owner_id", user.id)
      .maybeSingle<{ id: string; business_name: string | null }>();
    vendor = retry.data;
    vendorError = retry.error;
  }

  if (vendorError) {
    return NextResponse.json({ ok: false, message: vendorError.message }, { status: 500 });
  }
  if (!vendor) {
    return NextResponse.json({ ok: false, message: "Vendor access required." }, { status: 403 });
  }

  let { data: invite, error: inviteError } = await supabase
    .from("rfq_invites")
    .select("rfq_id, vendor_id, status, expires_at")
    .eq("rfq_id", input.rfqId)
    .eq("vendor_id", input.vendorId)
    .maybeSingle<{ rfq_id: string; vendor_id: string; status: string | null; expires_at: string | null }>();

  if ((!invite || inviteError) && supabaseAdmin) {
    const retry = await supabaseAdmin
      .from("rfq_invites")
      .select("rfq_id, vendor_id, status, expires_at")
      .eq("rfq_id", input.rfqId)
      .eq("vendor_id", input.vendorId)
      .maybeSingle<{ rfq_id: string; vendor_id: string; status: string | null; expires_at: string | null }>();
    invite = retry.data;
    inviteError = retry.error;
  }

  if (inviteError) {
    return NextResponse.json({ ok: false, message: inviteError.message }, { status: 500 });
  }
  if (!invite) {
    return NextResponse.json({ ok: false, message: "Request not found." }, { status: 404 });
  }
  const inviteStatus = invite.status?.trim().toLowerCase();
  if (
    inviteStatus === "declined" ||
    inviteStatus === "expired" ||
    (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now())
  ) {
    return NextResponse.json({ ok: false, message: "This quote request is closed or expired." }, { status: 409 });
  }

  const workflowClient = supabaseAdmin ?? supabase;
  const { data: rfq, error: rfqError } = await loadRfq(workflowClient, input.rfqId);

  if (rfqError) {
    return NextResponse.json({ ok: false, message: rfqError.message }, { status: 500 });
  }
  if (!rfq) {
    return NextResponse.json({ ok: false, message: "Request not found." }, { status: 404 });
  }
  if (rfq.accepted_quote_id) {
    return NextResponse.json({ ok: false, message: "This request already has an accepted quote." }, { status: 409 });
  }

  const { data: latestQuote, error: latestQuoteError } = await workflowClient
    .from("quotes")
    .select("id, version")
    .eq("rfq_id", input.rfqId)
    .eq("vendor_id", input.vendorId)
    .order("version", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; version: number }>();

  if (latestQuoteError) {
    return NextResponse.json({ ok: false, message: latestQuoteError.message }, { status: 500 });
  }

  const isUpdate = Boolean(latestQuote);
  const version = (latestQuote?.version ?? 0) + 1;
  const { data: quote, error: quoteError } = await workflowClient
    .from("quotes")
    .insert([{
      rfq_id: input.rfqId,
      vendor_id: input.vendorId,
      version,
      amount_cents: input.amountCents,
      currency: "USD",
      message: input.message || null,
    }])
    .select("id, created_at")
    .single<{ id: string; created_at: string }>();

  if (quoteError || !quote) {
    return NextResponse.json({ ok: false, message: quoteError?.message ?? "Unable to send quote." }, { status: 500 });
  }

  const now = new Date().toISOString();
  let { error: updateError } = await workflowClient
    .from("rfq_invites")
    .update({ status: "responded", last_activity_at: now, vendor_last_read_at: now })
    .eq("rfq_id", input.rfqId)
    .eq("vendor_id", input.vendorId);

  if (updateError && isMissingThreadColumnsError(updateError.message)) {
    const fallback = await workflowClient
      .from("rfq_invites")
      .update({ status: "responded" })
      .eq("rfq_id", input.rfqId)
      .eq("vendor_id", input.vendorId);
    updateError = fallback.error;
  }

  // The quote has already been delivered. Do not encourage a duplicate retry
  // if only optional inbox activity metadata could not be updated.
  if (updateError && process.env.NODE_ENV !== "production") {
    console.warn("Quote sent but invite activity was not updated", updateError.message);
  }

  if (rfq.owner_id) {
    const { error: notificationError } = await createQuoteAnsweredNotification(workflowClient, {
      recipientId: rfq.owner_id,
      actorId: user.id,
      rfqId: input.rfqId,
      quoteId: quote.id,
      vendorId: input.vendorId,
      vendorName: vendor.business_name,
      amountCents: input.amountCents,
      isUpdate,
    });

    if (notificationError && process.env.NODE_ENV !== "production") {
      console.warn("Failed to create quote notification", notificationError.message);
    }
  }

  return NextResponse.json({
    ok: true,
    quote: {
      id: quote.id,
      version,
      amountCents: input.amountCents,
      currency: "USD",
      message: input.message || null,
      createdAt: quote.created_at,
    },
  });
}
