import { createAuthenticatedRequestClient } from '@/lib/supabase/request';
import { getBoutiqueAccount, mutateBoutique } from '@/features/boutiques/server/service';
import { getSiteUrl } from '@/lib/site-url';
import { readBoundedJson } from '@/shared/resources/read-json';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' };
async function caller(request: Request) { const db = await createAuthenticatedRequestClient(request); const { data: { user } } = await db.auth.getUser(); return { db, user }; }
export async function GET(request: Request) {
    const { db, user } = await caller(request);
    if (!user)
        return Response.json({ error: 'Sign in required.' }, { status: 401, headers });
    const url = new URL(request.url), page = Number(url.searchParams.get('page') ?? 1);
    if (!Number.isInteger(page) || page < 1 || page > 1000)
        return Response.json({ error: 'Invalid page.' }, { status: 400, headers });
    try {
        return Response.json(await getBoutiqueAccount(db, user.id, url.searchParams.get('mode') ?? 'state', page, url.searchParams.get('id')), { headers });
    }
    catch {
        return Response.json({ error: 'Unable to load this boutique workspace.' }, { status: 403, headers });
    }
}
export async function POST(request: Request) {
    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin && origin !== new URL(getSiteUrl()).origin)
        return Response.json({ error: 'Origin not allowed.' }, { status: 403, headers });
    const { db, user } = await caller(request);
    if (!user)
        return Response.json({ error: 'Sign in required.' }, { status: 401, headers });
    try {
        const result = await mutateBoutique(db, await readBoundedJson(request,30000,5000));
        return Response.json(result, { status: result.ok ? 200 : result.status, headers });
    }
    catch {
        return Response.json({ error: 'Unable to save. Check your connection and try again.' }, { status: 400, headers });
    }
}
