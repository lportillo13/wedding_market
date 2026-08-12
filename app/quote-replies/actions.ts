"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildThreadKey } from "@/lib/inbox";
import { createThreadReplyNotification } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { verifyClientQuoteReplyAccess, verifyVendorQuoteReplyAccess } from "@/lib/quote-messages";

export type QuoteReplyState = {
  ok: boolean;
  message?: string;
};

const MAX_REPLY_LENGTH = 2000;

function getTrimmedValue(form: FormData, key: string) {
  return form.get(key)?.toString().trim() ?? "";
}

function isMissingThreadColumnsError(message: string | undefined) {
  return /last_activity_at|viewed_at|client_last_read_at|vendor_last_read_at|closed_at|closed_reason/i.test(message ?? "");
}

export async function sendClientQuoteReply(_: QuoteReplyState, form: FormData): Promise<QuoteReplyState> {
  const supabase = await createSupabaseServerClient();
  const supabaseAdmin = createSupabaseAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Please log in first." };
  }

  const quoteId = getTrimmedValue(form, "quote_id");
  const rfqId = getTrimmedValue(form, "rfq_id");
  const vendorId = getTrimmedValue(form, "vendor_id");
  const body = getTrimmedValue(form, "body");

  if (!quoteId || !rfqId || !vendorId || !body) {
    return { ok: false, message: "Please enter a reply." };
  }
  if (body.length > MAX_REPLY_LENGTH) {
    return { ok: false, message: "Replies must be 2,000 characters or fewer." };
  }

  const access = await verifyClientQuoteReplyAccess(quoteId, rfqId, vendorId, user.id);
  if (!access.allowed) {
    return { ok: false, message: access.message ?? "You do not have access to this quote." };
  }

  let { error } = await supabase.from("quote_messages").insert([
    {
      quote_id: quoteId,
      sender_id: user.id,
      sender_role: "client",
      body,
    },
  ]);

  if (error && supabaseAdmin) {
    const retry = await supabaseAdmin.from("quote_messages").insert([
      {
        quote_id: quoteId,
        sender_id: user.id,
        sender_role: "client",
        body,
      },
    ]);
    error = retry.error;
  }

  if (error) {
    return { ok: false, message: error.message };
  }

  let { error: inviteUpdateError } = await supabase
    .from("rfq_invites")
    .update({ last_activity_at: new Date().toISOString(), client_last_read_at: new Date().toISOString() })
    .eq("rfq_id", rfqId)
    .eq("vendor_id", vendorId);

  if (inviteUpdateError && !isMissingThreadColumnsError(inviteUpdateError.message) && supabaseAdmin) {
    const retry = await supabaseAdmin
      .from("rfq_invites")
      .update({ last_activity_at: new Date().toISOString(), client_last_read_at: new Date().toISOString() })
      .eq("rfq_id", rfqId)
      .eq("vendor_id", vendorId);
    inviteUpdateError = retry.error;
  }

  const notificationClient = supabaseAdmin ?? supabase;
  const { data: vendor } = await notificationClient
    .from("vendors")
    .select("owner_id")
    .eq("id", vendorId)
    .maybeSingle<{ owner_id: string | null }>();

  if (vendor?.owner_id) {
    const { error: notificationError } = await createThreadReplyNotification(notificationClient, {
      recipientId: vendor.owner_id,
      actorId: user.id,
      rfqId,
      quoteId,
      vendorId,
      senderRole: "client",
      senderName: null,
      messagePreview: body,
    });

    if (notificationError && process.env.NODE_ENV !== "production") {
      console.warn("Failed to create thread reply notification", notificationError.message);
    }
  }

  const threadKey = buildThreadKey(rfqId, vendorId);

  revalidatePath("/account/inbox");
  revalidatePath(`/account/inbox/${encodeURIComponent(threadKey)}`);
  revalidatePath("/account/notifications");
  revalidatePath("/vendor/inbox");
  revalidatePath(`/vendor/inbox/${encodeURIComponent(threadKey)}`);
  revalidatePath("/vendor/notifications");
  revalidatePath("/account/quotes");
  revalidatePath(`/account/rfqs/${rfqId}`);
  revalidatePath("/vendor/quotes");
  revalidatePath("/vendor/rfqs");

  return { ok: true };
}

export async function sendVendorQuoteReply(_: QuoteReplyState, form: FormData): Promise<QuoteReplyState> {
  const supabase = await createSupabaseServerClient();
  const supabaseAdmin = createSupabaseAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  const quoteId = getTrimmedValue(form, "quote_id");
  const rfqId = getTrimmedValue(form, "rfq_id");
  const vendorId = getTrimmedValue(form, "vendor_id");
  const body = getTrimmedValue(form, "body");

  if (!quoteId || !rfqId || !vendorId || !body) {
    return { ok: false, message: "Please enter a reply." };
  }
  if (body.length > MAX_REPLY_LENGTH) {
    return { ok: false, message: "Replies must be 2,000 characters or fewer." };
  }

  const access = await verifyVendorQuoteReplyAccess(quoteId, rfqId, vendorId, user.id);
  if (!access.allowed) {
    return { ok: false, message: access.message ?? "Vendor access required." };
  }

  let { error } = await supabase.from("quote_messages").insert([
    {
      quote_id: quoteId,
      sender_id: user.id,
      sender_role: "vendor",
      body,
    },
  ]);

  if (error && supabaseAdmin) {
    const retry = await supabaseAdmin.from("quote_messages").insert([
      {
        quote_id: quoteId,
        sender_id: user.id,
        sender_role: "vendor",
        body,
      },
    ]);
    error = retry.error;
  }

  if (error) {
    return { ok: false, message: error.message };
  }

  let { error: inviteUpdateError } = await supabase
    .from("rfq_invites")
    .update({ last_activity_at: new Date().toISOString(), vendor_last_read_at: new Date().toISOString() })
    .eq("rfq_id", rfqId)
    .eq("vendor_id", vendorId);

  if (inviteUpdateError && !isMissingThreadColumnsError(inviteUpdateError.message) && supabaseAdmin) {
    const retry = await supabaseAdmin
      .from("rfq_invites")
      .update({ last_activity_at: new Date().toISOString(), vendor_last_read_at: new Date().toISOString() })
      .eq("rfq_id", rfqId)
      .eq("vendor_id", vendorId);
    inviteUpdateError = retry.error;
  }

  const notificationClient = supabaseAdmin ?? supabase;
  const [{ data: vendor }, { data: rfq }] = await Promise.all([
    notificationClient
      .from("vendors")
      .select("business_name")
      .eq("id", vendorId)
      .maybeSingle<{ business_name: string | null }>(),
    notificationClient
      .from("rfqs")
      .select("owner_id")
      .eq("id", rfqId)
      .maybeSingle<{ owner_id: string | null }>(),
  ]);

  if (rfq?.owner_id) {
    const { error: notificationError } = await createThreadReplyNotification(notificationClient, {
      recipientId: rfq.owner_id,
      actorId: user.id,
      rfqId,
      quoteId,
      vendorId,
      senderRole: "vendor",
      senderName: vendor?.business_name ?? null,
      messagePreview: body,
    });

    if (notificationError && process.env.NODE_ENV !== "production") {
      console.warn("Failed to create thread reply notification", notificationError.message);
    }
  }

  const threadKey = buildThreadKey(rfqId, vendorId);

  revalidatePath("/account/inbox");
  revalidatePath(`/account/inbox/${encodeURIComponent(threadKey)}`);
  revalidatePath("/account/notifications");
  revalidatePath("/vendor/inbox");
  revalidatePath(`/vendor/inbox/${encodeURIComponent(threadKey)}`);
  revalidatePath("/vendor/notifications");
  revalidatePath("/account/quotes");
  revalidatePath(`/account/rfqs/${rfqId}`);
  revalidatePath("/vendor/quotes");
  revalidatePath("/vendor/rfqs");

  return { ok: true };
}
