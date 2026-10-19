"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildThreadKey } from "@/lib/inbox";
import { createVendorQuoteAcceptedNotification } from "@/lib/notifications";
import { getRequestI18n } from "@/lib/i18n/server";

import { getSupabaseServer } from "@/lib/supabase/server";

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

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return { ok: false, message: labels.errors.loginRequired };
  }

  const { data: accepted, error: acceptError } = await supabase.rpc("accept_vendor_quote", {
    p_rfq: rfq_id, p_quote: quote_id, p_reveal_email: reveal_email, p_reveal_phone: reveal_phone,
  });
  if (acceptError || !accepted?.vendorId) {
    return { ok: false, message: acceptError?.code === "23505" ? labels.errors.alreadyAccepted : labels.errors.acceptFailed };
  }
  const quote = { vendor_id: String(accepted.vendorId) };

  const notificationClient = supabase;
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
