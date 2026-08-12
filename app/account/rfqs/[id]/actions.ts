"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildThreadKey } from "@/lib/inbox";
import { createVendorQuoteAcceptedNotification } from "@/lib/notifications";
import { getRequestI18n } from "@/lib/i18n/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServer } from "@/lib/supabase/server";
import { isMissingOwnerColumnError, type OwnerColumn } from "@/lib/supabase/ownerColumns";

function isMissingThreadColumnsError(message: string | undefined) {
  return /reveal_email|reveal_phone|last_activity_at|viewed_at|client_last_read_at|vendor_last_read_at|closed_at|closed_reason/i.test(message ?? "");
}

function shouldUseAdminFallback(message: string | undefined) {
  return /policy|permission|row-level security|infinite recursion/i.test(message ?? "");
}

export async function acceptQuote(
  _prevState: unknown,
  form: FormData
): Promise<{ ok: boolean; message?: string }> {
  const { dictionary } = await getRequestI18n();
  const labels = dictionary.account.rfqsPage.acceptQuote;
  const rfq_id = form.get("rfq_id")?.toString();
  const quote_id = form.get("quote_id")?.toString();
  const reveal_email = form.get("reveal_email") === "on";
  const reveal_phone = form.get("reveal_phone") === "on";

  if (!rfq_id || !quote_id) {
    return { ok: false, message: labels.errors.missingIds };
  }

  const supabase = await getSupabaseServer();
  const supabaseAdmin = createSupabaseAdminClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return { ok: false, message: labels.errors.loginRequired };
  }

  const selectColumns = {
    owner_id: "id, owner_id, accepted_quote_id",
    owner_uuid: "id, owner_id:owner_uuid, accepted_quote_id",
  } as const satisfies Record<OwnerColumn, string>;

  const selectWithOwner = (client: SupabaseClient, column: OwnerColumn) =>
    client.from("rfqs").select(selectColumns[column]).eq("id", rfq_id).maybeSingle();

  let ownerColumn: OwnerColumn = "owner_id";
  let { data: rfq, error: rfqErr } = await selectWithOwner(supabase, ownerColumn);

  if (isMissingOwnerColumnError(rfqErr, ownerColumn)) {
    ownerColumn = "owner_uuid";
    const retry = await selectWithOwner(supabase, ownerColumn);
    rfq = retry.data;
    rfqErr = retry.error;
  }

  if (rfqErr && supabaseAdmin && shouldUseAdminFallback(rfqErr.message)) {
    const retry = await selectWithOwner(supabaseAdmin, ownerColumn);
    rfq = retry.data;
    rfqErr = retry.error;
  }

  if (rfqErr) {
    console.error("Failed to load request before accepting quote", rfqErr);
    return { ok: false, message: labels.errors.acceptFailed };
  }

  if (!rfq || rfq.owner_id !== user.id) {
    return { ok: false, message: labels.errors.notAllowed };
  }

  if (rfq.accepted_quote_id) {
    return { ok: false, message: labels.errors.alreadyAccepted };
  }

  const selectQuote = (client: SupabaseClient) =>
    client
      .from("quotes")
      .select("id, rfq_id, vendor_id")
      .eq("id", quote_id)
      .maybeSingle<{ id: string; rfq_id: string; vendor_id: string }>();

  let { data: quote, error: quoteErr } = await selectQuote(supabase);
  if (quoteErr && supabaseAdmin && shouldUseAdminFallback(quoteErr.message)) {
    const retry = await selectQuote(supabaseAdmin);
    quote = retry.data;
    quoteErr = retry.error;
  }

  if (quoteErr) {
    console.error("Failed to load quote before accepting it", quoteErr);
    return { ok: false, message: labels.errors.acceptFailed };
  }

  if (!quote || quote.rfq_id !== rfq_id) {
    return { ok: false, message: labels.errors.invalidQuote };
  }

  const selectInvite = (client: SupabaseClient) =>
    client
      .from("rfq_invites")
      .select("status, expires_at")
      .eq("rfq_id", rfq_id)
      .eq("vendor_id", quote.vendor_id)
      .maybeSingle<{ status: string | null; expires_at: string | null }>();

  let { data: invite, error: inviteErr } = await selectInvite(supabase);
  if ((inviteErr || !invite) && supabaseAdmin) {
    const retry = await selectInvite(supabaseAdmin);
    invite = retry.data;
    inviteErr = retry.error;
  }
  const inviteStatus = invite?.status?.trim().toLowerCase();
  const inviteExpiresAt = invite?.expires_at ? Date.parse(invite.expires_at) : Number.NaN;
  if (
    inviteErr ||
    !invite ||
    inviteStatus === "declined" ||
    inviteStatus === "expired" ||
    (Number.isFinite(inviteExpiresAt) && inviteExpiresAt <= Date.now())
  ) {
    return { ok: false, message: labels.errors.invalidQuote };
  }

  let { data: acceptedRfq, error: updateErr } = await supabase
    .from("rfqs")
    .update({ accepted_quote_id: quote_id, accepted_at: new Date().toISOString() })
    .eq("id", rfq_id)
    .is("accepted_quote_id", null)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (updateErr && supabaseAdmin && shouldUseAdminFallback(updateErr.message)) {
    const retry = await supabaseAdmin
      .from("rfqs")
      .update({ accepted_quote_id: quote_id, accepted_at: new Date().toISOString() })
      .eq("id", rfq_id)
      .is("accepted_quote_id", null)
      .select("id")
      .maybeSingle<{ id: string }>();
    acceptedRfq = retry.data;
    updateErr = retry.error;
  }

  if (updateErr) {
    console.error("Failed to accept quote", updateErr);
    return { ok: false, message: labels.errors.acceptFailed };
  }
  if (!acceptedRfq) {
    return { ok: false, message: labels.errors.alreadyAccepted };
  }

  const acceptedInvitePayload = {
    reveal_email,
    reveal_phone,
    status: "accepted",
    last_activity_at: new Date().toISOString(),
    client_last_read_at: new Date().toISOString(),
    closed_at: null,
    closed_reason: null,
  };

  let { error: revealErr } = await supabase
    .from("rfq_invites")
    .update(acceptedInvitePayload)
    .eq("rfq_id", rfq_id)
    .eq("vendor_id", quote.vendor_id);

  if (revealErr && supabaseAdmin && shouldUseAdminFallback(revealErr.message)) {
    const retry = await supabaseAdmin
      .from("rfq_invites")
      .update(acceptedInvitePayload)
      .eq("rfq_id", rfq_id)
      .eq("vendor_id", quote.vendor_id);
    revealErr = retry.error;
  }

  if (revealErr && isMissingThreadColumnsError(revealErr.message)) {
    const fallback = await supabase
      .from("rfq_invites")
      .update({ status: "accepted" })
      .eq("rfq_id", rfq_id)
      .eq("vendor_id", quote.vendor_id);
    revealErr = fallback.error;

    if (revealErr && supabaseAdmin && shouldUseAdminFallback(revealErr.message)) {
      const retry = await supabaseAdmin
        .from("rfq_invites")
        .update({ status: "accepted" })
        .eq("rfq_id", rfq_id)
        .eq("vendor_id", quote.vendor_id);
      revealErr = retry.error;
    }
  }

  if (revealErr) {
    await (supabaseAdmin ?? supabase)
      .from("rfqs")
      .update({ accepted_quote_id: null, accepted_at: null })
      .eq("id", rfq_id)
      .eq("accepted_quote_id", quote_id);
    console.error("Failed to reveal contact details for accepted quote", revealErr);
    return { ok: false, message: labels.errors.acceptFailed };
  }

  const closeOtherInvitesPayload = {
    status: "declined",
    closed_at: new Date().toISOString(),
    closed_reason: "accepted_other_vendor",
    last_activity_at: new Date().toISOString(),
  };

  let { error: closeOthersError } = await supabase
    .from("rfq_invites")
    .update(closeOtherInvitesPayload)
    .eq("rfq_id", rfq_id)
    .neq("vendor_id", quote.vendor_id);

  if (closeOthersError && supabaseAdmin && shouldUseAdminFallback(closeOthersError.message)) {
    const retry = await supabaseAdmin
      .from("rfq_invites")
      .update(closeOtherInvitesPayload)
      .eq("rfq_id", rfq_id)
      .neq("vendor_id", quote.vendor_id);
    closeOthersError = retry.error;
  }

  if (closeOthersError && isMissingThreadColumnsError(closeOthersError.message)) {
    const fallback = await supabase
      .from("rfq_invites")
      .update({ status: "declined" })
      .eq("rfq_id", rfq_id)
      .neq("vendor_id", quote.vendor_id);
    closeOthersError = fallback.error;

    if (closeOthersError && supabaseAdmin && shouldUseAdminFallback(closeOthersError.message)) {
      const retry = await supabaseAdmin
        .from("rfq_invites")
        .update({ status: "declined" })
        .eq("rfq_id", rfq_id)
        .neq("vendor_id", quote.vendor_id);
      closeOthersError = retry.error;
    }
  }

  if (closeOthersError) {
    console.error("Failed to close other vendor threads after acceptance", closeOthersError);
  }

  const notificationClient = supabaseAdmin ?? supabase;
  const [{ data: vendor }, { data: profile }] = await Promise.all([
    notificationClient.from("vendors").select("owner_id").eq("id", quote.vendor_id).maybeSingle(),
    notificationClient.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
  ]);

  if (vendor?.owner_id) {
    const { error: notificationError } = await createVendorQuoteAcceptedNotification(notificationClient, {
      recipientId: vendor.owner_id,
      actorId: user.id,
      rfqId: rfq_id,
      quoteId: quote_id,
      vendorId: quote.vendor_id,
      acceptedByName: profile?.full_name ?? null,
      revealEmail: reveal_email,
      revealPhone: reveal_phone,
    });

    if (notificationError && process.env.NODE_ENV !== "production") {
      console.warn("Failed to create vendor acceptance notification", notificationError.message);
    }
  }

  revalidatePath("/vendor/notifications");
  const threadKey = buildThreadKey(rfq_id, quote.vendor_id);
  revalidatePath("/account/inbox");
  revalidatePath(`/account/inbox/${encodeURIComponent(threadKey)}`);
  revalidatePath("/vendor/inbox");
  revalidatePath(`/vendor/inbox/${encodeURIComponent(threadKey)}`);

  redirect(`/account/inbox/${encodeURIComponent(threadKey)}?accepted=1`);
}
