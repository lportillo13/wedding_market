import { createAuthenticatedRequestClient } from '@/lib/supabase/request';
import { getBoutiqueCatalog } from '@/features/boutiques/server/service';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' };
export async function GET(request: Request) {
    const url = new URL(request.url), page = Number(url.searchParams.get('page') ?? 1), slug = url.searchParams.get('slug'), kind = url.searchParams.get('kind');
    if (!Number.isInteger(page) || page < 1 || page > 1000 || slug && slug.length > 160 || kind && !['dress', 'suit'].includes(kind))
        return Response.json({ error: 'Invalid filters.' }, { status: 400, headers });
    try {
        const db = await createAuthenticatedRequestClient(request);
        const result = await getBoutiqueCatalog(db, slug, page, kind);
        return Response.json(result, { status: result ? 200 : 404, headers });
    }
    catch {
        return Response.json({ error: 'The boutique collection is temporarily unavailable.' }, { status: 503, headers });
    }
}
