import { NextResponse } from 'next/server';
import { checkSignupEmailAvailability } from '@/features/auth/server/signup-email';
import { readBoundedJson } from '@/shared/resources/read-json';
export async function POST(request: Request) {
    const headers = { 'Cache-Control': 'private, no-store' };
    try {
        const body = await readBoundedJson(request, 1024);
        const email = body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>).email : undefined;
        const identifier = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-real-ip') ?? 'unknown';
        const result = await checkSignupEmailAvailability(email, identifier);
        return NextResponse.json({ ...result, ...(!result.ok ? { message: result.feedback } : {}) }, { status: result.ok ? 200 : result.feedback === 'rateLimited' ? 429 : result.feedback === 'emailTaken' ? 409 : 503, headers });
    }
    catch {
        return NextResponse.json({ ok: false, feedback: 'unavailable' }, { status: 400, headers });
    }
}
