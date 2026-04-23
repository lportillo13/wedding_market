// app/vendor/inbox/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { buildThreadKey, markVendorThreadViewed, parseThreadKey } from "@/lib/inbox";
import { getSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createQuoteAnsweredNotification } from "@/lib/notifications";
import { isMissingOwnerColumnError, type OwnerColumn } from "@/lib/supabase/ownerColumns";

export type SendQuoteState = { ok: boolean; message?: string };

function shouldUseAdminReadFallback(message: string | undefined) {
  return /policy|permission|row-level security|infinite recursion detected/i.test(message ?? "");
}

function isMissingThreadColumnsError(message: string | undefined) {
  return /last_activity_at|viewed_at|client_last_read_at|vendor_last_read_at|closed_at|closed_reason/i.test(message ?? "");
}

function getThreadKeys(formData: FormData) {
  const onlyThreadKey = formData.get("onlyThreadKey")?.toString();
  if (onlyThreadKey) {
    return [onlyThreadKey];
  }

  return formData
    .getAll("threadKeys")
    .map((value) => value.toString())
    .filter(Boolean);
}

export async function markVendorInboxThreadRead(threadKey: string) {
  if (!threadKey) {
    return;
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await markVendorThreadViewed(user.id, threadKey);

  revalidatePath("/vendor/inbox");
  revalidatePath(`/vendor/inbox/${encodeURIComponent(threadKey)}`);
}

export async function closeVendorInboxThreads(formData: FormData) {
  const supabase = await getSupabaseServer();
  const supabaseAdmin = createSupabaseAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const threadKeys = getThreadKeys(formData);
  if (!threadKeys.length) {
    return;
  }

  let { data: vendors, error } = await supabase.from("vendors").select("id").eq("owner_id", user.id);
  if (error && supabaseAdmin && shouldUseAdminReadFallback(error.message)) {
    const retry = await supabaseAdmin.from("vendors").select("id").eq("owner_id", user.id);
    vendors = retry.data;
    error = retry.error;
  }
  if (error) {
    throw new Error(error.message);
  }

  const vendorIds = new Set((vendors ?? []).map((vendor) => vendor.id));
  const validPairs = threadKeys
    .map((threadKey) => parseThreadKey(threadKey))
    .filter((pair): pair is { rfqId: string; vendorId: string } => Boolean(pair))
    .filter((pair) => vendorIds.has(pair.vendorId));

  for (const pair of validPairs) {
    let { error: updateError } = await supabase
      .from("rfq_invites")
      .update({
        closed_at: new Date().toISOString(),
        closed_reason: "archived_by_vendor",
      })
      .eq("rfq_id", pair.rfqId)
      .eq("vendor_id", pair.vendorId);

    if (updateError && supabaseAdmin && shouldUseAdminReadFallback(updateError.message)) {
      const retry = await supabaseAdmin
        .from("rfq_invites")
        .update({
          closed_at: new Date().toISOString(),
          closed_reason: "archived_by_vendor",
        })
        .eq("rfq_id", pair.rfqId)
        .eq("vendor_id", pair.vendorId);
      updateError = retry.error;
    }

    if (updateError) {
      throw new Error(updateError.message);
    }

    revalidatePath(`/account/inbox/${encodeURIComponent(buildThreadKey(pair.rfqId, pair.vendorId))}`);
    revalidatePath(`/vendor/inbox/${encodeURIComponent(buildThreadKey(pair.rfqId, pair.vendorId))}`);
  }

  revalidatePath("/account/inbox");
  revalidatePath("/vendor/inbox");
}

export async function restoreVendorInboxThreads(formData: FormData) {
  const supabase = await getSupabaseServer();
  const supabaseAdmin = createSupabaseAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const threadKeys = getThreadKeys(formData);
  if (!threadKeys.length) {
    return;
  }

  let { data: vendors, error } = await supabase.from("vendors").select("id").eq("owner_id", user.id);
  if (error && supabaseAdmin && shouldUseAdminReadFallback(error.message)) {
    const retry = await supabaseAdmin.from("vendors").select("id").eq("owner_id", user.id);
    vendors = retry.data;
    error = retry.error;
  }
  if (error) {
    throw new Error(error.message);
  }

  const vendorIds = new Set((vendors ?? []).map((vendor) => vendor.id));
  const validPairs = threadKeys
    .map((threadKey) => parseThreadKey(threadKey))
    .filter((pair): pair is { rfqId: string; vendorId: string } => Boolean(pair))
    .filter((pair) => vendorIds.has(pair.vendorId));

  for (const pair of validPairs) {
    let { error: updateError } = await supabase
      .from("rfq_invites")
      .update({ closed_at: null, closed_reason: null })
      .eq("rfq_id", pair.rfqId)
      .eq("vendor_id", pair.vendorId);

    if (updateError && supabaseAdmin && shouldUseAdminReadFallback(updateError.message)) {
      const retry = await supabaseAdmin
        .from("rfq_invites")
        .update({ closed_at: null, closed_reason: null })
        .eq("rfq_id", pair.rfqId)
        .eq("vendor_id", pair.vendorId);
      updateError = retry.error;
    }

    if (updateError) {
      throw new Error(updateError.message);
    }

    revalidatePath(`/account/inbox/${encodeURIComponent(buildThreadKey(pair.rfqId, pair.vendorId))}`);
    revalidatePath(`/vendor/inbox/${encodeURIComponent(buildThreadKey(pair.rfqId, pair.vendorId))}`);
  }

  revalidatePath("/account/inbox");
  revalidatePath("/vendor/inbox");
}

export async function sendQuote(_: SendQuoteState, form: FormData): Promise<SendQuoteState> {
  const supabase = await getSupabaseServer();
  const supabaseAdmin = createSupabaseAdminClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) return { ok: false, message: "Not authenticated." };

  const uidArg = { _uid: user.id } satisfies { _uid: string };
  const { data: isVendor, error: roleErr } = await supabase.rpc("is_vendor", uidArg);
  if (roleErr) return { ok: false, message: roleErr.message };
  if (!isVendor) return { ok: false, message: "Vendor access required." };

  const rfq_id = form.get("rfq_id")?.toString();
  const vendor_id = form.get("vendor_id")?.toString();
  const amount_usd = form.get("amount_usd")?.toString();
  const message = form.get("message")?.toString() ?? null;

  if (!rfq_id || !vendor_id) return { ok: false, message: "Missing request or vendor." };

  const { data: vendor, error: vendorErr } = await supabase
    .from("vendors")
    .select("id, business_name")
    .eq("id", vendor_id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (vendorErr) return { ok: false, message: vendorErr.message };
  if (!vendor) return { ok: false, message: "You don't own this vendor." };

  const readInvite = (client: typeof supabase) =>
    client
      .from("rfq_invites")
      .select("rfq_id, vendor_id, status")
      .eq("rfq_id", rfq_id)
      .eq("vendor_id", vendor_id)
      .maybeSingle();

  let { data: invite, error: inviteErr } = await readInvite(supabase);

  if (inviteErr && supabaseAdmin && shouldUseAdminReadFallback(inviteErr.message)) {
    const retry = await readInvite(supabaseAdmin);
    invite = retry.data;
    inviteErr = retry.error;
  }

  if (inviteErr) return { ok: false, message: inviteErr.message };
  if (!invite) return { ok: false, message: "Request not found." };

  const selectRfq = (client: typeof supabase, column: OwnerColumn) =>
    client
      .from("rfqs")
      .select(column === "owner_id" ? "accepted_quote_id, owner_id" : "accepted_quote_id, owner_id:owner_uuid")
      .eq("id", rfq_id)
      .maybeSingle();

  let ownerColumn: OwnerColumn = "owner_id";
  let { data: rfq, error: rfqErr } = await selectRfq(supabase, ownerColumn);

  if (isMissingOwnerColumnError(rfqErr, ownerColumn)) {
    ownerColumn = "owner_uuid";
    const retry = await selectRfq(supabase, ownerColumn);
    rfq = retry.data;
    rfqErr = retry.error;
  }

  if ((!rfq || (rfqErr && supabaseAdmin && shouldUseAdminReadFallback(rfqErr.message))) && supabaseAdmin) {
    const retry = await selectRfq(supabaseAdmin, ownerColumn);
    rfq = retry.data;
    rfqErr = retry.error;
  }

  if (rfqErr) return { ok: false, message: rfqErr.message };
  if (!rfq) return { ok: false, message: "Request not found." };
  if (rfq.accepted_quote_id) return { ok: false, message: "This request is already accepted." };

  const dollars = Number((amount_usd ?? "").replace(/[^0-9.]/g, ""));
  if (!isFinite(dollars) || dollars <= 0) return { ok: false, message: "Invalid amount." };
  const amount_cents = Math.round(dollars * 100);

  let { data: existingQuote, error: existingQuoteErr } = await supabase
    .from("quotes")
    .select("id, version")
    .eq("rfq_id", rfq_id)
    .eq("vendor_id", vendor_id)
    .order("version", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; version: number }>();

  if (existingQuoteErr && supabaseAdmin && /infinite recursion detected in policy/i.test(existingQuoteErr.message)) {
    const retry = await supabaseAdmin
      .from("quotes")
      .select("id, version")
      .eq("rfq_id", rfq_id)
      .eq("vendor_id", vendor_id)
      .order("version", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string; version: number }>();
    existingQuote = retry.data;
    existingQuoteErr = retry.error;
  }

  if (existingQuoteErr) return { ok: false, message: existingQuoteErr.message };

  let qErr: { message?: string } | null = null;
  let quoteId: string | null = null;
  const isUpdate = Boolean(existingQuote?.id);
  const nextVersion = (existingQuote?.version ?? 0) + 1;

  const insertResult = await supabase
    .from("quotes")
    .insert([{ rfq_id, vendor_id, version: nextVersion, amount_cents, currency: "USD", message }])
    .select("id")
    .single();

  qErr = insertResult.error;
  quoteId = insertResult.data?.id ?? null;

  if (qErr && supabaseAdmin && /infinite recursion detected in policy/i.test(qErr.message ?? "")) {
    const retry = await supabaseAdmin
      .from("quotes")
      .insert([{ rfq_id, vendor_id, version: nextVersion, amount_cents, currency: "USD", message }])
      .select("id")
      .single();
    qErr = retry.error;
    quoteId = retry.data?.id ?? quoteId;
  }

  if (qErr) return { ok: false, message: qErr.message };

  const inviteUpdatePayload = {
    status: "responded",
    last_activity_at: new Date().toISOString(),
    vendor_last_read_at: new Date().toISOString(),
  };

  let { error: inviteUpdateErr } = await supabase
    .from("rfq_invites")
    .update(inviteUpdatePayload)
    .eq("rfq_id", rfq_id)
    .eq("vendor_id", vendor_id);

  if (inviteUpdateErr && supabaseAdmin && /infinite recursion detected in policy/i.test(inviteUpdateErr.message)) {
    const retry = await supabaseAdmin
      .from("rfq_invites")
      .update(inviteUpdatePayload)
      .eq("rfq_id", rfq_id)
      .eq("vendor_id", vendor_id);
    inviteUpdateErr = retry.error;
  }

  if (inviteUpdateErr && isMissingThreadColumnsError(inviteUpdateErr.message)) {
    const fallback = await supabase
      .from("rfq_invites")
      .update({ status: "responded" })
      .eq("rfq_id", rfq_id)
      .eq("vendor_id", vendor_id);
    inviteUpdateErr = fallback.error;

    if (inviteUpdateErr && supabaseAdmin && /infinite recursion detected in policy/i.test(inviteUpdateErr.message)) {
      const retry = await supabaseAdmin
        .from("rfq_invites")
        .update({ status: "responded" })
        .eq("rfq_id", rfq_id)
        .eq("vendor_id", vendor_id);
      inviteUpdateErr = retry.error;
    }
  }

  if (inviteUpdateErr) return { ok: false, message: inviteUpdateErr.message };

  if (rfq.owner_id && quoteId) {
    const notificationClient = supabaseAdmin ?? supabase;
    const { error: notificationErr } = await createQuoteAnsweredNotification(notificationClient, {
      recipientId: rfq.owner_id,
      actorId: user.id,
      rfqId: rfq_id,
      quoteId,
      vendorId: vendor_id,
      vendorName: vendor.business_name ?? null,
      amountCents: amount_cents,
      isUpdate,
    });

    if (notificationErr && process.env.NODE_ENV !== "production") {
      console.warn("Failed to create notification", notificationErr.message);
    }
  }

  const threadKey = buildThreadKey(rfq_id, vendor_id);

  revalidatePath("/account/notifications");
  revalidatePath("/account/inbox");
  revalidatePath(`/account/inbox/${encodeURIComponent(threadKey)}`);
  revalidatePath(`/account/rfqs/${rfq_id}`);
  revalidatePath("/account/quotes");
  revalidatePath("/vendor/inbox");
  revalidatePath(`/vendor/inbox/${encodeURIComponent(threadKey)}`);
  revalidatePath("/vendor/quotes");
  revalidatePath("/vendor/rfqs");

  return { ok: true };
}
