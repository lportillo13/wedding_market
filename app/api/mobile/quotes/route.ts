import { NextResponse } from "next/server";
import { createAuthenticatedRequestClient } from "@/lib/supabase/request";
import { submitVendorQuote } from "@/features/proposals/server/submit";

export async function POST(request: Request) {
  const supabase = await createAuthenticatedRequestClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, message: "Authentication required." }, { status: 401 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON body." }, { status: 400 });
  }
  const result = await submitVendorQuote(supabase, user.id, payload);
  return NextResponse.json(result.ok ? result : { ok: false, message: result.message },
    { status: result.ok ? 200 : result.status });
}
