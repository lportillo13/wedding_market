import { NextResponse } from "next/server";
import { z } from "zod";
import { createVendorQuoteAcceptedNotification } from "@/lib/notifications";

import { createAuthenticatedRequestClient } from "@/lib/supabase/request";

const payloadSchema = z.object({
  rfqId: z.string().uuid(),
  quoteId: z.string().uuid(),
  vendorId: z.string().uuid(),
  revealEmail: z.boolean().default(true),
  revealPhone: z.boolean().default(false),
});

export async function POST(request: Request) {
  const supabase = await createAuthenticatedRequestClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "Authentication required." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid quote selection." }, { status: 400 });
  }

  const input = parsed.data;
  const { data: accepted, error: acceptError } = await supabase.rpc("accept_vendor_quote", {
    p_rfq: input.rfqId, p_quote: input.quoteId, p_reveal_email: input.revealEmail, p_reveal_phone: input.revealPhone,
  });
  if (acceptError || !accepted?.vendorId) {
    return NextResponse.json({ ok: false, message: "This quote could not be accepted." },
      { status: acceptError?.code === "42501" ? 403 : 409 });
  }
  if (accepted.alreadyAccepted) return NextResponse.json({ ok: true, alreadyAccepted: true });
  input.vendorId = String(accepted.vendorId);
  const workflowClient = supabase;
  const [{ data: vendor }, { data: profile }] = await Promise.all([
    workflowClient.from("vendors").select("owner_id").eq("id", input.vendorId).maybeSingle<{ owner_id: string | null }>(),
    workflowClient.from("profiles").select("full_name").eq("id", user.id).maybeSingle<{ full_name: string | null }>(),
  ]);

  if (vendor?.owner_id) {
    const { error: notificationError } = await createVendorQuoteAcceptedNotification(workflowClient, {
      recipientId: vendor.owner_id,
      actorId: user.id,
      rfqId: input.rfqId,
      quoteId: input.quoteId,
      vendorId: input.vendorId,
      acceptedByName: profile?.full_name ?? null,
      revealEmail: input.revealEmail,
      revealPhone: input.revealPhone,
    });

    if (notificationError && process.env.NODE_ENV !== "production") {
      console.warn("Failed to create quote acceptance notification", notificationError.message);
    }
  }

  return NextResponse.json({ ok: true });
}
