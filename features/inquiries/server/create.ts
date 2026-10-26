import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { parseCalendarDate } from "../../../shared/calendar/date";
import { createVendorNewRequestNotification } from "../../notifications/server/notifications";

const optionalText = (max: number) => z.string().trim().max(max).nullish();
export const inquiryInputSchema = z
  .object({
    request_id: z.string().uuid().nullish(),
    rfq_id: z.string().uuid().nullish(),
    vendor_id: z.string().uuid().optional(),
    vendor_ids: z.array(z.string().uuid()).max(10).optional(),
    first_name: z.string().trim().max(100).default(""),
    last_name: z.string().trim().max(100).default(""),
    email: z.string().trim().email().max(254),
    phone: optionalText(50),
    guest_count: z.number().int().min(1).max(2147483647),
    budget: z.number().int().min(0).max(2147483647).nullish(),
    budget_min: z.number().int().min(0).max(2147483647).nullish(),
    budget_max: z.number().int().min(0).max(2147483647).nullish(),
    event_date: z
      .string()
      .refine((v) => parseCalendarDate(v) !== null)
      .nullish(),
    flexible: z.boolean().default(false),
    city: optionalText(200),
    language: optionalText(10),
    theme: optionalText(120),
    message: z.string().trim().min(1).max(2000),
  })
  .superRefine((input, ctx) => {
    const ids = new Set([
      ...(input.vendor_ids ?? []),
      ...(input.vendor_id ? [input.vendor_id] : []),
    ]);
    if (!ids.size || ids.size > 10)
      ctx.addIssue({
        code: "custom",
        path: ["vendor_ids"],
        message: "Select between 1 and 10 vendors.",
      });
    if (
      input.budget == null &&
      input.budget_min != null &&
      input.budget_max != null &&
      input.budget_min > input.budget_max
    )
      ctx.addIssue({
        code: "custom",
        path: ["budget"],
        message: "Enter a valid budget.",
      });
  });

export async function createInquiry(
  client: SupabaseClient,
  userId: string,
  payload: unknown,
  notify = createVendorNewRequestNotification,
) {
  const parsed = inquiryInputSchema.safeParse(payload);
  if (!parsed.success)
    return {
      ok: false as const,
      status: 400,
      message: "Check the required fields and try again.",
      fields: parsed.error.issues.map((i) => String(i.path[0])),
    };
  const input = parsed.data;
  const vendorIds = [
    ...new Set([
      ...(input.vendor_ids ?? []),
      ...(input.vendor_id ? [input.vendor_id] : []),
    ]),
  ];
  let saved: {
    rfq_id: string;
    vendor_count: number;
    updated: boolean;
    replayed: boolean;
  };
  try {
    const { data, error } = await client.rpc("create_inquiry", {
      p_vendors: vendorIds,
      p_payload: {
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        phone: input.phone || null,
        guest_count: input.guest_count,
        budget: input.budget ?? input.budget_min ?? input.budget_max ?? null,
        event_date: input.event_date ?? null,
        flexible: input.flexible,
        city: input.city || null,
        language: input.language || null,
        theme: input.theme || null,
        notes: input.message,
      },
      ...(input.request_id ? { p_request_id: input.request_id } : {}),
      p_existing: input.rfq_id ?? null,
    });
    if (error || !data?.rfq_id)
      return {
        ok: false as const,
        status:
          error?.code === "42501"
            ? 403
            : error?.code === "23505"
              ? 409
              : error?.code === "22023"
                ? 400
                : 503,
        message:
          error?.code === "23505"
            ? "This request already has a conversation. Continue in your inbox."
            : "Unable to send this request. Check the selected vendors and try again.",
      };
    saved = data;
  } catch {
    return {
      ok: false as const,
      status: 503,
      message:
        "The request service is temporarily unavailable. Please try again.",
    };
  }
  // Notification delivery cannot turn a committed request into an apparent failure.
  if (!saved.replayed) {
    try {
      const { data: vendors } = await client
        .from("thread_vendors")
        .select("id,owner_id")
        .in("id", vendorIds);
      await Promise.allSettled(
        (vendors ?? [])
          .filter((v) => v.owner_id)
          .map((v) =>
            notify(client, {
              recipientId: v.owner_id,
              actorId: userId,
              rfqId: saved.rfq_id,
              vendorId: v.id,
              requesterName:
                `${input.first_name} ${input.last_name}`.trim() || null,
              city: input.city || null,
              state: null,
              country: "Costa Rica",
              eventDate: input.event_date ?? null,
            }),
          ),
      );
    } catch {
      console.warn("Inquiry saved; notification delivery failed.");
    }
  }
  return { ok: true as const, ...saved };
}
