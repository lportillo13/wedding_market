import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
const location = z.object({ address: z.string().trim().max(500), city: z.string().trim().max(120), state: z.string().trim().max(120), lat: z.number().min(-90).max(90).nullable(), lng: z.number().min(-180).max(180).nullable(), service_radius_km: z.number().min(0).max(10000) });
const command = z.discriminatedUnion('action', [
    z.object({ action: z.literal('invalidate') }),
    z.object({ action: z.literal('publication'), published: z.boolean() }),
    z.object({ action: z.literal('categories'), keys: z.array(z.string().min(1).max(80)).max(40) }),
    z.object({ action: z.literal('location'), values: location }),
]);
/** Caller must supply its verified session client. Every write remains under RLS. */
export async function runOwnWorkspaceCommand(db: SupabaseClient, ownerId: string, input: unknown) {
    const parsed = command.safeParse(input);
    if (!parsed.success)
        throw Error('Check your business details.');
    const own = await db.from('vendors').select('id,slug').eq('owner_id', ownerId).maybeSingle();
    if (own.error || !own.data)
        throw Error('Your business is unavailable.');
    const vendor = own.data, action = parsed.data;
    if (action.action === 'publication') {
        const result = await db.from('vendors').update({ is_published: action.published }).eq('id', vendor.id).eq('owner_id', ownerId);
        if (result.error)
            throw result.error;
    }
    if (action.action === 'location') {
        const result = await db.from('vendor_locations').upsert({ vendor_id: vendor.id, ...action.values, country: 'Costa Rica' }, { onConflict: 'vendor_id' });
        if (result.error)
            throw result.error;
    }
    if (action.action === 'categories') {
        const keys = [...new Set(action.keys)];
        const lookup = keys.length ? await db.from('categories').select('id,key').in('key', keys).limit(40) : { data: [], error: null };
        if (lookup.error || lookup.data?.length !== keys.length)
            throw Error('Choose available service categories.');
        const current = await db.from('vendor_categories').select('category_id').eq('vendor_id', vendor.id).limit(101);
        if (current.error || !current.data || current.data.length > 100)
            throw Error('Your categories could not be loaded.');
        const ids = (lookup.data ?? []).map(row => row.id);
        // Add first, remove only obsolete links after success. Retrying either phase
        // is idempotent and cannot erase all categories after a failed insertion.
        if (ids.length) {
            const added = await db.from('vendor_categories').upsert(ids.map(id => ({ vendor_id: vendor.id, category_id: id })), { onConflict: 'vendor_id,category_id', ignoreDuplicates: true });
            if (added.error)
                throw added.error;
        }
        const removed = current.data.map(row => row.category_id).filter(id => !ids.includes(id));
        if (removed.length) {
            const result = await db.from('vendor_categories').delete().eq('vendor_id', vendor.id).in('category_id', removed);
            if (result.error)
                throw result.error;
        }
    }
    return { slug: String(vendor.slug ?? '') };
}
