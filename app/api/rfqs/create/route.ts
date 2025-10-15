import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isMissingOwnerColumnError, type OwnerColumn } from "@/lib/supabase/ownerColumns";

const payloadSchema = z.object({
  vendor_id: z.string().uuid(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  guest_count_range: z.string().min(1),
  message: z.string().min(1),
  event_date: z.string().optional().nullable(),
  flexible: z.boolean().optional(),
});

const QUOTE_EXPIRES_DAYS = 14;

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
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
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user ?? null;

  const eventDate = input.event_date ? new Date(input.event_date).toISOString().slice(0, 10) : null;

  const basePayload = {
    event_date: eventDate,
    flexible_date: input.flexible ?? false,
    guest_count_range: input.guest_count_range,
    notes: input.message,
    contact_email: input.email,
    contact_phone: input.phone ?? null,
    guest_first_name: input.first_name,
    guest_last_name: input.last_name,
    guest_lead_email: input.email,
    guest_phone: input.phone ?? null,
    vendor_id: input.vendor_id,
  } as const;

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

  if (user) {
    const attempt = await insertRfq(supabase, user.id);
    rfqId = attempt.data?.id ?? null;
    insertError = attempt.error;

    if (insertError && supabaseAdmin && /policy/i.test(insertError.message ?? "")) {
      const retry = await insertRfq(supabaseAdmin, user.id);
      rfqId = retry.data?.id ?? null;
      insertError = retry.error;
    }
  } else {
    const guestAttempt = await insertRfq(supabase, null);
    rfqId = guestAttempt.data?.id ?? null;
    insertError = guestAttempt.error;

    if ((insertError || !rfqId) && supabaseAdmin) {
      const retry = await insertRfq(supabaseAdmin, null);
      rfqId = retry.data?.id ?? null;
      insertError = retry.error;
    }
  }

  if (insertError || !rfqId) {
    return NextResponse.json({ ok: false, message: insertError?.message || "Unable to create request." }, { status: 500 });
  }

  const expires_at = new Date(Date.now() + QUOTE_EXPIRES_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const invitePayload = { rfq_id: rfqId, vendor_id: input.vendor_id, expires_at };

  let inviteError = await supabase.from("rfq_invites").insert([invitePayload]).then((res) => res.error);

  if (inviteError && supabaseAdmin && /policy/i.test(inviteError.message ?? "")) {
    const retry = await supabaseAdmin.from("rfq_invites").insert([invitePayload]);
    inviteError = retry.error;
  }

  if (inviteError) {
    return NextResponse.json({ ok: false, message: inviteError.message || "Failed to notify vendor." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, rfq_id: rfqId });
}
