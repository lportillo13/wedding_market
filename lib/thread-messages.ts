import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createThreadReplyNotification } from "./notifications";

export const threadMessageSchema = z.object({
  quoteId: z.string().uuid().nullish(),
  rfqId: z.string().uuid(),
  vendorId: z.string().uuid(),
  clientMessageId: z.string().uuid().optional(),
  body: z.string().trim().min(1).max(2000),
  senderRole: z.enum(["client", "vendor"]),
});

export async function sendThreadMessage(
  client: SupabaseClient,
  userId: string,
  payload: unknown,
  notify = createThreadReplyNotification,
) {
  const parsed = threadMessageSchema.safeParse(payload);
  if (!parsed.success)
    return {
      ok: false as const,
      status: 400,
      message: "Enter a message of 1–2,000 characters.",
    };
  const input = parsed.data;
  try {
    const { error } = await client.from("quote_messages").insert({
      ...(input.clientMessageId ? { id: input.clientMessageId } : {}),
      quote_id: input.quoteId ?? null,
      rfq_id: input.rfqId,
      vendor_id: input.vendorId,
      sender_id: userId,
      sender_role: input.senderRole,
      body: input.body,
    });
    if (error) {
      if (input.clientMessageId) {
        const { data: prior } = await client
          .from("quote_messages")
          .select("sender_id,sender_role,rfq_id,vendor_id,body")
          .eq("id", input.clientMessageId)
          .maybeSingle();
        if (
          prior?.sender_id === userId &&
          prior.sender_role === input.senderRole &&
          prior.rfq_id === input.rfqId &&
          prior.vendor_id === input.vendorId &&
          prior.body === input.body
        )
          return { ok: true as const, replayed: true };
      }
      return {
        ok: false as const,
        status: error.code === "42501" ? 403 : 409,
        message:
          "This message could not be sent. Refresh the conversation and try again.",
      };
    }
  } catch {
    return {
      ok: false as const,
      status: 503,
      message:
        "Unable to connect. Your message has not been cleared; try again.",
    };
  }

  try {
    const [{ data: vendor }, { data: rfq }] = await Promise.all([
      client
        .from("thread_vendors")
        .select("owner_id,business_name")
        .eq("id", input.vendorId)
        .maybeSingle(),
      client
        .from("rfqs_visible")
        .select("owner_id")
        .eq("id", input.rfqId)
        .maybeSingle(),
    ]);
    const recipient =
      input.senderRole === "client" ? vendor?.owner_id : rfq?.owner_id;
    if (recipient)
      await notify(client, {
        recipientId: recipient,
        actorId: userId,
        rfqId: input.rfqId,
        vendorId: input.vendorId,
        quoteId: input.quoteId ?? null,
        senderRole: input.senderRole,
        senderName:
          input.senderRole === "vendor"
            ? (vendor?.business_name ?? null)
            : null,
        messagePreview: input.body,
      });
  } catch {
    console.warn("Message saved; notification delivery failed.");
  }
  return { ok: true as const, replayed: false };
}
