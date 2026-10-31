import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAuthenticatedRequestClient } from '@/lib/supabase/request';
import { readBoundedJson } from '@/shared/resources/read-json';
import { runOwnWorkspaceCommand } from '@/features/vendors/server/workspace-command';
import { invalidatePublicVendorCache } from '@/features/vendors/server/cache';
export async function POST(request: Request) {
    const headers = { 'Cache-Control': 'private, no-store' };
    const db = await createAuthenticatedRequestClient(request);
    const { data: { user }, error } = await db.auth.getUser();
    if (error || !user?.email_confirmed_at)
        return NextResponse.json({ error: 'Sign in to manage your business.' }, { status: 401, headers });
    try {
        const result = await runOwnWorkspaceCommand(db, user.id, await readBoundedJson(request));
        invalidatePublicVendorCache();
        revalidatePath('/vendors');
        if (result.slug)
            revalidatePath('/vendors/' + result.slug);
        return NextResponse.json({ ok: true }, { headers });
    }
    catch {
        return NextResponse.json({ error: 'Your changes could not be saved. Check your details and try again.' }, { status: 400, headers });
    }
}
