"use server";

import { redirect } from "next/navigation";
import { getRequestI18n } from "@/lib/i18n/server";
import { createVendorNewRequestNotification } from "@/lib/notifications";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServer } from "@/lib/supabase/server";
import { isMissingOwnerColumnError, type OwnerColumn } from "@/lib/supabase/ownerColumns";

export type CreateRfqState = { ok: boolean; message?: string };

const MAX_INVITES = 10;
const QUOTE_EXPIRES_DAYS = 14;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function trimmedFormValue(formData: FormData, key: string) {
  return formData.get(key)?.toString().trim() ?? "";
}

function optionalNonNegativeInteger(value: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : Number.NaN;
}

function validDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export async function createRfqAndInvites(_: CreateRfqState, formData: FormData): Promise<CreateRfqState> {
  const { dictionary } = await getRequestI18n();
  const labels = dictionary.rfq.newPage.errors;
  const supabase = await getSupabaseServer();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return { ok: false, message: labels.loginRequired };
  }

  let parsedVendorIds: unknown;
  try {
    parsedVendorIds = JSON.parse(trimmedFormValue(formData, "vendor_ids_json") || "[]");
  } catch {
    return { ok: false, message: labels.invalidVendorList };
  }

  if (!Array.isArray(parsedVendorIds) || parsedVendorIds.some((vendorId) => typeof vendorId !== "string" || !UUID_PATTERN.test(vendorId))) {
    return { ok: false, message: labels.invalidVendorList };
  }

  const vendorIds = Array.from(new Set(parsedVendorIds));
  if (!vendorIds.length) {
    return { ok: false, message: labels.emptyShortlist };
  }
  if (vendorIds.length > MAX_INVITES) {
    return { ok: false, message: labels.invalidVendorList };
  }

  const eventDate = trimmedFormValue(formData, "event_date");
  const guestCount = optionalNonNegativeInteger(trimmedFormValue(formData, "guest_count"));
  const budgetMin = optionalNonNegativeInteger(trimmedFormValue(formData, "budget_min"));
  const budgetMax = optionalNonNegativeInteger(trimmedFormValue(formData, "budget_max"));
  const notes = trimmedFormValue(formData, "notes");

  if (
    (eventDate && !validDateOnly(eventDate)) ||
    (guestCount !== null && (!Number.isFinite(guestCount) || guestCount < 1)) ||
    (budgetMin !== null && !Number.isFinite(budgetMin)) ||
    (budgetMax !== null && !Number.isFinite(budgetMax)) ||
    (budgetMin !== null && budgetMax !== null && budgetMin > budgetMax) ||
    notes.length > 2000
  ) {
    return { ok: false, message: labels.submitFailed };
  }

  const basePayload = {
    event_date: eventDate || null,
    guest_count: guestCount,
    budget_min: budgetMin,
    budget_max: budgetMax,
    city: trimmedFormValue(formData, "city") || null,
    state: trimmedFormValue(formData, "state") || null,
    country: trimmedFormValue(formData, "country") || null,
    language: trimmedFormValue(formData, "language") || "en",
    theme: trimmedFormValue(formData, "theme") || null,
    notes: notes || null,
  } satisfies Record<string, unknown>;

  const supabaseAdmin = createSupabaseAdminClient();
  const dbClient = supabaseAdmin ?? supabase;
  const profileClient = supabaseAdmin ?? supabase;
  const { data: profile } = await profileClient
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .maybeSingle<{ full_name: string | null; phone: string | null }>();

  const fullName = profile?.full_name?.trim() ?? "";
  const [firstName = "", ...restName] = fullName ? fullName.split(/\s+/) : [];
  const lastName = restName.join(" ");
  const contact_email = user.email ?? null;
  const contact_phone = profile?.phone ?? null;

  const ownerColumns: OwnerColumn[] = ["owner_id", "owner_uuid"];
  let rfq: { id: string } | null = null;
  let rfqErr: { message?: string } | null = null;

  for (const column of ownerColumns) {
    const insertPayload = {
      ...basePayload,
      contact_email,
      contact_phone,
      guest_first_name: firstName || null,
      guest_last_name: lastName || null,
      [column]: user.id,
    };
    const result = await dbClient.from("rfqs").insert([insertPayload]).select("id").single();
    rfq = result.data;
    rfqErr = result.error;
    if (!rfqErr) {
      break;
    }
    if (!isMissingOwnerColumnError(rfqErr, column)) {
      break;
    }
  }

  if (rfqErr || !rfq) {
    if (!supabaseAdmin && /policy for relation "rfqs"/i.test(rfqErr?.message ?? "")) {
      console.warn(
        "RFQ creation blocked by row-level security. Configure SUPABASE_SERVICE_ROLE_KEY to allow server-side RFQ creation."
      );
    }
    if (rfqErr) {
      console.error("Failed to create RFQ", rfqErr);
    }
    return { ok: false, message: labels.submitFailed };
  }

  const expires_at = new Date(Date.now() + QUOTE_EXPIRES_DAYS * 86400_000).toISOString();
  const invites = vendorIds.map((vendor_id) => ({ rfq_id: rfq.id, vendor_id, expires_at }));
  const { error: inviteErr } = await dbClient.from("rfq_invites").insert(invites);

  if (inviteErr) {
    if (!supabaseAdmin && /policy for relation "rfq_invites"/i.test(inviteErr.message ?? "")) {
      console.warn(
        "RFQ invite creation blocked by row-level security. Configure SUPABASE_SERVICE_ROLE_KEY to allow server-side RFQ creation."
      );
    }
    console.error("Failed to create RFQ invites", inviteErr);
    await dbClient.from("rfqs").delete().eq("id", rfq.id);
    return { ok: false, message: labels.inviteFailed };
  }

  const { data: vendors } = await profileClient
    .from("vendors")
    .select("id, owner_id")
    .in("id", vendorIds);

  for (const vendor of vendors ?? []) {
    if (!vendor.owner_id) {
      continue;
    }

    const { error: notificationError } = await createVendorNewRequestNotification(profileClient, {
      recipientId: vendor.owner_id,
      actorId: user.id,
      rfqId: rfq.id,
      vendorId: vendor.id,
      requesterName: fullName || null,
      city: typeof basePayload.city === "string" ? basePayload.city : null,
      state: typeof basePayload.state === "string" ? basePayload.state : null,
      country: typeof basePayload.country === "string" ? basePayload.country : null,
      eventDate: typeof basePayload.event_date === "string" ? basePayload.event_date : null,
    });

    if (notificationError && process.env.NODE_ENV !== "production") {
      console.warn("Failed to create vendor request notification", notificationError.message);
    }
  }

  redirect(`/rfq/sent?rfq=${rfq.id}&count=${vendorIds.length}`);
}
