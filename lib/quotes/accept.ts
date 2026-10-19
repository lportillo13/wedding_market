import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createVendorQuoteAcceptedNotification } from "@/lib/notifications";

const schema = z.object({
  rfqId: z.string().uuid(),
  quoteId: z.string().uuid(),
  revealEmail: z.boolean().default(false),
  revealPhone: z.boolean().default(false),
});
export async function acceptVendorQuote(
  client: SupabaseClient,
  userId: string,
  payload: unknown,
  notify = createVendorQuoteAcceptedNotification,
) {
  const parsed = schema.safeParse(payload);
  if (!parsed.success)
    return {
      ok: false as const,
      status: 400,
      message: "Invalid proposal selection.",
    };
  const input = parsed.data;
  let accepted: { vendorId: string; alreadyAccepted: boolean };
  try {
    const { data, error } = await client.rpc("accept_vendor_quote", {
      p_rfq: input.rfqId,
      p_quote: input.quoteId,
      p_reveal_email: input.revealEmail,
      p_reveal_phone: input.revealPhone,
    });
    if (error || !data?.vendorId)
      return {
        ok: false as const,
        status: error?.code === "42501" ? 403 : 409,
        message:
          "This proposal changed or the conversation is closed. Refresh before accepting.",
      };
    accepted = data;
  } catch {
    return {
      ok: false as const,
      status: 503,
      message:
        "Unable to connect. Refresh to check the proposal status before retrying.",
    };
  }
  if (!accepted.alreadyAccepted) {
    try {
      const [{ data: vendor }, { data: profile }] = await Promise.all([
        client
          .from("thread_vendors")
          .select("owner_id")
          .eq("id", accepted.vendorId)
          .maybeSingle(),
        client
          .from("profiles")
          .select("full_name")
          .eq("id", userId)
          .maybeSingle(),
      ]);
      if (vendor?.owner_id)
        await notify(client, {
          recipientId: vendor.owner_id,
          actorId: userId,
          rfqId: input.rfqId,
          quoteId: input.quoteId,
          vendorId: accepted.vendorId,
          acceptedByName: profile?.full_name ?? null,
          revealEmail: input.revealEmail,
          revealPhone: input.revealPhone,
        });
    } catch {
      console.warn("Proposal accepted; notification delivery failed.");
    }
  }
  return { ok: true as const, ...accepted };
}
