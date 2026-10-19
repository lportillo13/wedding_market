"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRequestI18n } from "@/lib/i18n/server";
import { sendThreadMessage } from "@/lib/thread-messages";

export type QuoteReplyState = { ok: boolean; message?: string };
async function send(
  form: FormData,
  senderRole: "client" | "vendor",
): Promise<QuoteReplyState> {
  const client = await createSupabaseServerClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  const { language } = await getRequestI18n();
  if (!user)
    return {
      ok: false,
      message:
        language === "es"
          ? "Inicia sesión para enviar un mensaje."
          : "Please log in first.",
    };
  const text = (key: string) => form.get(key)?.toString().trim() || "";
  const rfqId = text("rfq_id"),
    vendorId = text("vendor_id");
  const result = await sendThreadMessage(client, user.id, {
    quoteId: text("quote_id") || null,
    rfqId,
    vendorId,
    senderRole,
    clientMessageId: text("client_message_id") || undefined,
    body: text("body"),
  });
  if (!result.ok)
    return {
      ok: false,
      message:
        language === "es"
          ? "No se pudo enviar el mensaje. Revisa que la conversación siga abierta e inténtalo de nuevo. Tu texto se conserva."
          : result.message,
    };
  for (const scope of ["account", "vendor"]) {
    revalidatePath(`/${scope}/inbox`);
    revalidatePath(
      `/${scope}/inbox/${encodeURIComponent(`${rfqId}__${vendorId}`)}`,
    );
    revalidatePath(`/${scope}/notifications`);
  }
  return { ok: true };
}
export async function sendClientQuoteReply(_: QuoteReplyState, form: FormData) {
  return send(form, "client");
}
export async function sendVendorQuoteReply(_: QuoteReplyState, form: FormData) {
  return send(form, "vendor");
}
