import { NextResponse } from "next/server";
import { createAuthenticatedRequestClient } from "@/lib/supabase/request";
import { createInquiry } from "@/lib/inquiries";

export async function POST(request: Request) {
  const client = await createAuthenticatedRequestClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user)
    return NextResponse.json(
      { ok: false, message: "Please log in to send a request." },
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
  const contact = payload as {first_name?:unknown;last_name?:unknown} | null;
  const fields = (["first_name","last_name"] as const).filter(key=>typeof contact?.[key] !== "string" || !String(contact[key]).trim());
  if (fields.length) return NextResponse.json({ok:false,message:"Enter your first and last name.",fields},{status:400});
  const result = await createInquiry(client, user.id, payload);
  return NextResponse.json(result, { status: result.ok ? 200 : result.status });
}
