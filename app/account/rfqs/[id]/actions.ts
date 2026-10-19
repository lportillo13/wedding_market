"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildThreadKey } from "@/lib/inbox";
import { acceptVendorQuote } from "@/lib/quotes/accept";
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

  const result = await acceptVendorQuote(supabase,user.id,{rfqId:rfq_id,quoteId:quote_id,revealEmail:reveal_email,revealPhone:reveal_phone});
  if (!result.ok) return {ok:false,message:labels.errors.acceptFailed};
  const quote = {vendor_id:result.vendorId};

  revalidatePath("/vendor/notifications");
  const threadKey = buildThreadKey(rfq_id, quote.vendor_id);
  revalidatePath("/account/inbox");
  revalidatePath(`/account/inbox/${encodeURIComponent(threadKey)}`);
  revalidatePath("/vendor/inbox");
  revalidatePath(`/vendor/inbox/${encodeURIComponent(threadKey)}`);

  redirect(`/account/inbox/${encodeURIComponent(threadKey)}?accepted=1`);
}
