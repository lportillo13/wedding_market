import { NextResponse } from "next/server";
import { z } from "zod";
import { subscribeResendContact } from "@/lib/resend";

export const dynamic = "force-dynamic";

const subscribeSchema = z.object({
  email: z.string().trim().email().max(254),
  website: z.string().max(200).optional().default(""),
});

const recentRequests = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 10_000;

function getRequestIdentifier(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function isRateLimited(identifier: string) {
  const now = Date.now();
  const lastRequest = recentRequests.get(identifier) ?? 0;

  if (recentRequests.size > 500) {
    for (const [key, timestamp] of recentRequests) {
      if (now - timestamp > RATE_LIMIT_WINDOW_MS) {
        recentRequests.delete(key);
      }
    }
  }

  if (now - lastRequest < RATE_LIMIT_WINDOW_MS) {
    return true;
  }

  recentRequests.set(identifier, now);
  return false;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Enter a valid email address." }, { status: 400 });
  }

  // Silently accept bot submissions that fill the honeypot field.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  if (isRateLimited(getRequestIdentifier(request))) {
    return NextResponse.json(
      { ok: false, message: "Please wait before trying again." },
      { status: 429 }
    );
  }

  const result = await subscribeResendContact(parsed.data.email.toLowerCase());
  if (!result.ok) {
    console.warn("Resend newsletter subscription failed", result.error);
    return NextResponse.json(
      { ok: false, message: "Newsletter signup is temporarily unavailable." },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true });
}
