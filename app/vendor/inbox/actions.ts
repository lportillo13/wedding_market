// app/vendor/inbox/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { buildThreadKey, markVendorThreadViewed, parseThreadKey } from "@/lib/inbox";
import { getSupabaseServer } from "@/lib/supabase/server";

import { parseQuoteAmountCents } from "@/lib/quotes/input";
import { submitVendorQuote } from "@/lib/quotes/submit";

export type SendQuoteState = { ok: boolean; message?: string };

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

  const { data: vendors, error } = await supabase.from("vendors").select("id").eq("owner_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  const vendorIds = new Set((vendors ?? []).map((vendor) => vendor.id));
  const validPairs = threadKeys
    .map((threadKey) => parseThreadKey(threadKey))
    .filter((pair): pair is { rfqId: string; vendorId: string } => Boolean(pair))
    .filter((pair) => vendorIds.has(pair.vendorId));

  for (const pair of validPairs) {
    const { error: updateError } = await supabase
      .from("rfq_invites")
      .update({
        closed_at: new Date().toISOString(),
        closed_reason: "archived_by_vendor",
      })
      .eq("rfq_id", pair.rfqId)
      .eq("vendor_id", pair.vendorId);

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

  const { data: vendors, error } = await supabase.from("vendors").select("id").eq("owner_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  const vendorIds = new Set((vendors ?? []).map((vendor) => vendor.id));
  const validPairs = threadKeys
    .map((threadKey) => parseThreadKey(threadKey))
    .filter((pair): pair is { rfqId: string; vendorId: string } => Boolean(pair))
    .filter((pair) => vendorIds.has(pair.vendorId));

  for (const pair of validPairs) {
    const { error: updateError } = await supabase
      .from("rfq_invites")
      .update({ closed_at: null, closed_reason: null })
      .eq("rfq_id", pair.rfqId)
      .eq("vendor_id", pair.vendorId);

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
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { ok: false, message: "Not authenticated." };

  const rfqId = String(form.get("rfq_id") ?? "");
  const vendorId = String(form.get("vendor_id") ?? "");
  const result = await submitVendorQuote(supabase, user.id, {
    rfqId,
    vendorId,
    amountCents: parseQuoteAmountCents(String(form.get("amount_usd") ?? "")),
    message: String(form.get("message") ?? "").trim() || null,
  });
  if (!result.ok) return { ok: false, message: result.message };

  const threadKey = buildThreadKey(rfqId, vendorId);
  for (const path of [
    "/account/notifications", "/account/inbox", `/account/inbox/${encodeURIComponent(threadKey)}`,
    `/account/rfqs/${rfqId}`, "/account/quotes", "/vendor/inbox",
    `/vendor/inbox/${encodeURIComponent(threadKey)}`, "/vendor/quotes", "/vendor/rfqs",
  ]) revalidatePath(path);
  return { ok: true };
}
