import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createVendorNewRequestNotification } from "@/lib/notifications";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isMissingOwnerColumnError, type OwnerColumn } from "@/lib/supabase/ownerColumns";
import { createAuthenticatedRequestClient } from "@/lib/supabase/request";

const payloadSchema = z.object({
  rfq_id: z.string().uuid().optional().nullable(),
  vendor_id: z.string().uuid().optional(),
  vendor_ids: z.array(z.string().uuid()).min(1).max(10).optional(),
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().min(1).max(100),
  email: z.string().email(),
  phone: z.string().trim().max(50).optional().nullable(),
  guest_count: z.number().int().positive().optional().nullable(),
  guest_count_range: z.string().optional().nullable(),
  budget: z.number().int().nonnegative().optional().nullable(),
  budget_min: z.number().int().nonnegative().optional().nullable(),
  budget_max: z.number().int().nonnegative().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  language: z.string().optional().nullable(),
  theme: z.string().optional().nullable(),
  message: z.string().trim().min(1).max(2000),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  flexible: z.boolean().optional(),
})
  .refine((input) => Boolean(input.vendor_id) || Boolean(input.vendor_ids?.length), {
    message: "Select at least one vendor.",
    path: ["vendor_ids"],
  })
  .refine(
    (input) => new Set([...(input.vendor_ids ?? []), ...(input.vendor_id ? [input.vendor_id] : [])]).size <= 10,
    {
      message: "You can request quotes from up to 10 vendors at a time.",
      path: ["vendor_ids"],
    },
  )
  .refine((input) => input.guest_count !== null && input.guest_count !== undefined || Boolean(input.guest_count_range?.trim()), {
    message: "Please fill in the required fields.",
    path: ["guest_count"],
  })
  .refine((input) => input.budget_min == null || input.budget_max == null || input.budget_min <= input.budget_max, {
    message: "Minimum budget cannot exceed maximum budget.",
    path: ["budget_max"],
  });

const QUOTE_EXPIRES_DAYS = 14;

export async function POST(request: Request) {
  const supabase = await createAuthenticatedRequestClient(request);
  const supabaseAdmin = createSupabaseAdminClient();

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Please fill in the required fields." }, { status: 400 });
  }

  const input = parsed.data;
  const vendorIds = Array.from(new Set([...(input.vendor_ids ?? []), ...(input.vendor_id ? [input.vendor_id] : [])]));
  const isMultiQuote = vendorIds.length > 1;
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user ?? null;

  if (!user) {
    return NextResponse.json({ ok: false, message: "Please log in to send a request." }, { status: 401 });
  }

  const eventDate = input.event_date ?? null;
  const singleBudget = input.budget ?? null;

  const basePayload = {
    event_date: eventDate,
    flexible_date: input.flexible ?? false,
    guest_count: input.guest_count ?? null,
    guest_count_range: input.guest_count_range?.trim() || (input.guest_count ? String(input.guest_count) : null),
    budget_min: singleBudget ?? input.budget_min ?? null,
    budget_max: singleBudget ?? input.budget_max ?? null,
    city: input.city?.trim() || null,
    state: null,
    country: "Costa Rica",
    language: input.language?.trim() || null,
    theme: input.theme?.trim() || null,
    notes: input.message,
    contact_email: input.email,
    contact_phone: input.phone ?? null,
    guest_first_name: input.first_name,
    guest_last_name: input.last_name,
    guest_lead_email: input.email,
    guest_phone: input.phone ?? null,
    // The legacy vendor_id shortcut is only meaningful for single-vendor requests.
    vendor_id: isMultiQuote ? null : vendorIds[0],
  } as const;

  const loadExistingEditableRfq = async (client: SupabaseClient, ownerId: string, rfqId?: string | null) => {
    let query = client
      .from("rfqs")
      .select("id")
      .eq("owner_id", ownerId)
      .eq("vendor_id", vendorIds[0])
      .is("accepted_quote_id", null)
      .order("created_at", { ascending: false })
      .limit(1);

    if (rfqId) {
      query = query.eq("id", rfqId);
    }

    return query.maybeSingle();
  };

  const hasVendorResponse = async (client: SupabaseClient, rfqId: string) => {
    const result = await client
      .from("quotes")
      .select("id", { count: "exact", head: true })
      .eq("rfq_id", rfqId)
      .eq("vendor_id", vendorIds[0]);

    return { count: result.count ?? 0, error: result.error };
  };

  const ownerColumns: OwnerColumn[] = ["owner_id", "owner_uuid"];

  const insertRfq = async (client: SupabaseClient, ownerId: string | null) => {
    let lastError: { message?: string } | null = null;
    for (const column of ownerColumns) {
      const payload = ownerId ? { ...basePayload, [column]: ownerId } : basePayload;
      const result = await client.from("rfqs").insert([payload]).select("id").single();
      if (!result.error) {
        return { data: result.data, error: null } as const;
      }
      lastError = result.error;
      if (!isMissingOwnerColumnError(result.error, column)) {
        break;
      }
    }
    return { data: null, error: lastError } as const;
  };

  let rfqId: string | null = null;
  let insertError: { message?: string } | null = null;

  let existingEditableRfq: { id: string } | null = null;
  let existingEditableRfqError: { message?: string } | null = null;

  if (!isMultiQuote) {
    const existingAttempt = await loadExistingEditableRfq(supabase, user.id, input.rfq_id);
    existingEditableRfq = existingAttempt.data;
    existingEditableRfqError = existingAttempt.error;
  }

  if (existingEditableRfqError && supabaseAdmin && /policy/i.test(existingEditableRfqError.message ?? "")) {
    const retry = await loadExistingEditableRfq(supabaseAdmin, user.id, input.rfq_id);
    existingEditableRfq = retry.data;
    existingEditableRfqError = retry.error;
  }

  if (existingEditableRfqError) {
    return NextResponse.json({ ok: false, message: existingEditableRfqError.message || "Unable to load request." }, { status: 500 });
  }

  if (existingEditableRfq?.id) {
    let vendorReplyCheck = await hasVendorResponse(supabase, existingEditableRfq.id);

    if (vendorReplyCheck.error && supabaseAdmin && /policy/i.test(vendorReplyCheck.error.message ?? "")) {
      vendorReplyCheck = await hasVendorResponse(supabaseAdmin, existingEditableRfq.id);
    }

    if (vendorReplyCheck.error) {
      return NextResponse.json({ ok: false, message: vendorReplyCheck.error.message || "Unable to load request." }, { status: 500 });
    }

    if (vendorReplyCheck.count === 0) {
      const updatePayload = { ...basePayload, updated_at: new Date().toISOString() };
      let updateError = await supabase
        .from("rfqs")
        .update(updatePayload)
        .eq("id", existingEditableRfq.id)
        .eq("owner_id", user.id)
        .then((res) => res.error);

      if (updateError && supabaseAdmin && /policy/i.test(updateError.message ?? "")) {
        const retry = await supabaseAdmin
          .from("rfqs")
          .update(updatePayload)
          .eq("id", existingEditableRfq.id)
          .eq("owner_id", user.id);
        updateError = retry.error;
      }

      if (updateError) {
        return NextResponse.json({ ok: false, message: updateError.message || "Unable to update request." }, { status: 500 });
      }

      return NextResponse.json({ ok: true, rfq_id: existingEditableRfq.id, updated: true });
    }
  }

  const attempt = await insertRfq(supabase, user.id);
  rfqId = attempt.data?.id ?? null;
  insertError = attempt.error;

  if (insertError && supabaseAdmin && /policy/i.test(insertError.message ?? "")) {
    const retry = await insertRfq(supabaseAdmin, user.id);
    rfqId = retry.data?.id ?? null;
    insertError = retry.error;
  }

  if (insertError || !rfqId) {
    return NextResponse.json({ ok: false, message: insertError?.message || "Unable to create request." }, { status: 500 });
  }

  const expires_at = new Date(Date.now() + QUOTE_EXPIRES_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const invitePayload = vendorIds.map((vendorId) => ({ rfq_id: rfqId, vendor_id: vendorId, expires_at }));

  let inviteError = await supabase.from("rfq_invites").insert(invitePayload).then((res) => res.error);

  if (inviteError && supabaseAdmin && /policy/i.test(inviteError.message ?? "")) {
    const retry = await supabaseAdmin.from("rfq_invites").insert(invitePayload);
    inviteError = retry.error;
  }

  if (inviteError) {
    // Avoid leaving an orphan request when the invite batch fails atomically.
    await (supabaseAdmin ?? supabase).from("rfqs").delete().eq("id", rfqId);
    return NextResponse.json({ ok: false, message: inviteError.message || "Failed to notify vendor." }, { status: 500 });
  }

  const vendorLookupClient = supabaseAdmin ?? supabase;
  const { data: vendorRecipients } = await vendorLookupClient
    .from("vendors")
    .select("id, owner_id")
    .in("id", vendorIds);

  for (const vendorRecipient of vendorRecipients ?? []) {
    if (!vendorRecipient.owner_id) continue;
    const requesterName = `${input.first_name} ${input.last_name}`.trim() || null;
    const { error: notificationError } = await createVendorNewRequestNotification(vendorLookupClient, {
      recipientId: vendorRecipient.owner_id,
      actorId: user?.id ?? null,
      rfqId,
      vendorId: vendorRecipient.id,
      requesterName,
      city: basePayload.city,
      state: basePayload.state,
      country: basePayload.country,
      eventDate,
    });

    if (notificationError && process.env.NODE_ENV !== "production") {
      console.warn("Failed to create vendor request notification", notificationError.message);
    }
  }

  return NextResponse.json({ ok: true, rfq_id: rfqId, vendor_count: vendorIds.length });
}
