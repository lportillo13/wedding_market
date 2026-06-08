import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createThreadReplyNotification } from "@/lib/notifications";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { verifyClientQuoteReplyAccess, verifyVendorQuoteReplyAccess } from "@/lib/quote-messages";

const payloadSchema = z.object({
  quoteId: z.string().uuid(),
  rfqId: z.string().uuid(),
  vendorId: z.string().uuid(),
  body: z.string().trim().min(1),
  senderRole: z.enum(["client", "vendor"]),
});

function isMissingThreadColumnsError(message: string | undefined) {
  return /last_activity_at|viewed_at|client_last_read_at|vendor_last_read_at|closed_at|closed_reason/i.test(message ?? "");
}

export async function POST(request: Request) {
  const supabase = await createRequestSupabaseClient();
  const supabaseAdmin = createSupabaseAdminClient();
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
    return NextResponse.json({ ok: false, message: "Please enter a reply." }, { status: 400 });
  }

  const input = parsed.data;
  const access =
    input.senderRole === "vendor"
      ? await verifyVendorQuoteReplyAccess(input.quoteId, input.rfqId, input.vendorId, user.id)
      : await verifyClientQuoteReplyAccess(input.quoteId, input.rfqId, input.vendorId, user.id);

  if (!access.allowed) {
    return NextResponse.json(
      { ok: false, message: access.message ?? "You do not have access to this quote." },
      { status: 403 }
    );
  }

  let { error } = await supabase.from("quote_messages").insert([
    {
      quote_id: input.quoteId,
      sender_id: user.id,
      sender_role: input.senderRole,
      body: input.body,
    },
  ]);

  if (error && supabaseAdmin) {
    const retry = await supabaseAdmin.from("quote_messages").insert([
      {
        quote_id: input.quoteId,
        sender_id: user.id,
        sender_role: input.senderRole,
        body: input.body,
      },
    ]);
    error = retry.error;
  }

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  let { error: inviteUpdateError } = await supabase
    .from("rfq_invites")
    .update({
      last_activity_at: new Date().toISOString(),
      [input.senderRole === "vendor" ? "vendor_last_read_at" : "client_last_read_at"]: new Date().toISOString(),
    })
    .eq("rfq_id", input.rfqId)
    .eq("vendor_id", input.vendorId);

  if (inviteUpdateError && !isMissingThreadColumnsError(inviteUpdateError.message) && supabaseAdmin) {
    const retry = await supabaseAdmin
      .from("rfq_invites")
      .update({
        last_activity_at: new Date().toISOString(),
        [input.senderRole === "vendor" ? "vendor_last_read_at" : "client_last_read_at"]: new Date().toISOString(),
      })
      .eq("rfq_id", input.rfqId)
      .eq("vendor_id", input.vendorId);
    inviteUpdateError = retry.error;
  }

  const notificationClient = supabaseAdmin ?? supabase;

  if (input.senderRole === "vendor") {
    const [{ data: vendor }, { data: rfq }] = await Promise.all([
      notificationClient
        .from("vendors")
        .select("business_name")
        .eq("id", input.vendorId)
        .maybeSingle<{ business_name: string | null }>(),
      notificationClient
        .from("rfqs")
        .select("owner_id")
        .eq("id", input.rfqId)
        .maybeSingle<{ owner_id: string | null }>(),
    ]);

    if (rfq?.owner_id) {
      await createThreadReplyNotification(notificationClient, {
        recipientId: rfq.owner_id,
        actorId: user.id,
        rfqId: input.rfqId,
        quoteId: input.quoteId,
        vendorId: input.vendorId,
        senderRole: "vendor",
        senderName: vendor?.business_name ?? null,
        messagePreview: input.body,
      });
    }
  } else {
    const { data: vendor } = await notificationClient
      .from("vendors")
      .select("owner_id")
      .eq("id", input.vendorId)
      .maybeSingle<{ owner_id: string | null }>();

    if (vendor?.owner_id) {
      await createThreadReplyNotification(notificationClient, {
        recipientId: vendor.owner_id,
        actorId: user.id,
        rfqId: input.rfqId,
        quoteId: input.quoteId,
        vendorId: input.vendorId,
        senderRole: "client",
        senderName: null,
        messagePreview: input.body,
      });
    }
  }

  return NextResponse.json({ ok: true });
}

async function createRequestSupabaseClient() {
  const cookieClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await cookieClient.auth.getUser();

  if (user) {
    return cookieClient;
  }

  const authorization = await readBearerAuthorization();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!authorization || !url || !anonKey) {
    return cookieClient;
  }

  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: authorization,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function readBearerAuthorization() {
  try {
    const requestHeaders = await headers();
    const authorization = requestHeaders.get("authorization");
    return authorization?.startsWith("Bearer ") ? authorization : null;
  } catch {
    return null;
  }
}
