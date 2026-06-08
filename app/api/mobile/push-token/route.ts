import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const registerSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["ios", "android", "web", "unknown"]).default("unknown"),
  deviceId: z.string().optional().nullable(),
});

const unregisterSchema = z.object({
  token: z.string().min(1),
});

export async function POST(request: Request) {
  const supabase = await createRequestSupabaseClient();
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

  const parsed = registerSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid push token." }, { status: 400 });
  }

  const input = parsed.data;
  const client = createSupabaseAdminClient() ?? supabase;
  const { error } = await client
    .from("user_push_tokens")
    .upsert(
      {
        user_id: user.id,
        token: input.token,
        platform: input.platform,
        device_id: input.deviceId ?? null,
        is_active: true,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "token" }
    );

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const supabase = await createRequestSupabaseClient();
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

  const parsed = unregisterSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid push token." }, { status: 400 });
  }

  const client = createSupabaseAdminClient() ?? supabase;
  const { error } = await client
    .from("user_push_tokens")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("token", parsed.data.token);

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
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
