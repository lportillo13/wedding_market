import { NextResponse } from "next/server";
import { createAuthenticatedRequestClient } from "@/lib/supabase/request";
import { sendThreadMessage } from "@/features/conversations/server/messages";

export async function POST(request: Request) {
  const client = await createAuthenticatedRequestClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user)
    return NextResponse.json(
      { ok: false, message: "Authentication required." },
      { status: 401 },
    );
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid JSON body." },
      { status: 400 },
    );
  }
  const result = await sendThreadMessage(client, user.id, payload);
  return NextResponse.json(result, { status: result.ok ? 200 : result.status });
}
