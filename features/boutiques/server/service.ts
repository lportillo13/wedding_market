import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Boutique, Outfit } from '@/shared/boutiques/types';
const uuid = z.string().uuid();
const localized = (max: number) => z.object({ en: z.string().max(max), es: z.string().max(max) });
const money = z.number().int().min(0).max(100000000);
const settings = z.object({ enabled: z.boolean(), duration_minutes: z.number().int().min(15).max(180), companions_max: z.number().int().min(0).max(10), visit_fee_cents: money, currency: z.enum(['USD', 'CRC']), policies: localized(2500) });
const item = z.object({ kind: z.enum(['dress', 'suit']), name: localized(160), description: localized(2500), designer: z.string().max(160), reference: z.string().max(120), offer: z.enum(['purchase', 'rental', 'both']), details: z.record(z.string().max(40), z.string().max(300)), sample_sizes: z.string().max(300), order_sizes: z.string().max(300), lead_time: z.string().max(500), price_cents: money.nullable(), currency: z.enum(['USD', 'CRC']), media_indexes: z.array(z.number().int().min(0).max(99)).max(6), is_published: z.boolean() });
const request = z.object({ starts_at: z.string().datetime({ offset: true }), wedding_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal('')), companions: z.number().int().min(0).max(10), size_note: z.string().max(300), budget: z.string().max(120), note: z.string().max(2000), items: z.array(uuid).max(5), accepted: z.literal(true), policies_version: z.string().datetime({ offset: true }) });
const commands = z.discriminatedUnion('action', [
    z.object({ action: z.literal('settings'), vendor: uuid, data: settings }),
    z.object({ action: z.literal('item'), vendor: uuid, id: uuid.nullable(), data: item }),
    z.object({ action: z.literal('favorite'), id: uuid, saved: z.boolean() }),
    z.object({ action: z.literal('request'), vendor: uuid, submission: uuid, data: request }),
    z.object({ action: z.literal('decide'), id: uuid, status: z.enum(['confirmed', 'declined', 'cancelled']), version: z.number().int().positive(), note: z.string().max(2000) }),
    z.object({ action: z.literal('reply'), id: uuid, submission: uuid, body: z.string().trim().min(1).max(2000) }),
]);
export function mediaUrls(media: unknown) {
    const rows = Array.isArray(media) ? media : [];
    const images: string[] = [], videos: string[] = [];
    for (const asset of rows) {
        if (!asset || typeof asset !== 'object')
            continue;
        const a = asset as Record<string, unknown>;
        const url = typeof a.url === 'string' ? a.url : '';
        if (!/^https:\/\//i.test(url) || url.length > 2048)
            continue;
        (a.type === 'video' || /^(mp4|webm|mov)$/i.test(String(a.format)) ? videos : images).push(url);
    }
    return { images, videos };
}
export function normalizeOutfit(value: unknown): Outfit {
    const row = value as Outfit;
    return { ...row, ...mediaUrls(row.media) };
}
export function normalizeBoutique(value: unknown): Boutique {
    const row = value as Boutique & {
        hero_image?: unknown;
    };
    const hero = mediaUrls([row.hero_image]).images[0] ?? null;
    const bio = typeof row.bio === 'string' ? { en: row.bio, es: row.bio } : row.bio;
    return { ...row, bio, hero, items: (row.items ?? []).map(normalizeOutfit) };
}
export async function getBoutiqueCatalog(db: SupabaseClient, slug: string | null, page: number, kind: string | null, itemId: string | null = null) {
    const { data, error } = await db.rpc('boutique_storefront', { p_slug: slug, p_page: page, p_kind: kind, p_item: itemId }).abortSignal(AbortSignal.timeout(10000));
    if (error)
        throw error;
    return slug ? (data ? normalizeBoutique(data) : null) : { items: (data?.items ?? []).map(normalizeBoutique) };
}
export async function getBoutiqueAccount(db: SupabaseClient, userId: string, mode: string, page: number, id: string | null) {
    if (mode === 'workspace') {
        const { data: vendor, error } = await db.from('vendors').select('id,slug,business_name,gallery_images,hero_image,is_published').eq('owner_id', userId).limit(1).maybeSingle();
        if (error || !vendor)
            throw new Error('Vendor access required');
        const [shop, items] = await Promise.all([
            db.from('boutiques').select('*').eq('vendor_id', vendor.id).maybeSingle(),
            db.from('boutique_items').select('*').eq('vendor_id', vendor.id).order('updated_at', { ascending: false }).limit(60),
        ]);
        if (shop.error || items.error)
            throw shop.error ?? items.error;
        return { vendor, settings: shop.data, items: (items.data ?? []).map(normalizeOutfit) };
    }
    if (mode === 'favorites') {
        const { data, error } = await db.rpc('boutique_saved_outfits', { p_page: page }).abortSignal(AbortSignal.timeout(10000));
        if (error)
            throw error;
        return { items: (data ?? []).map(normalizeOutfit) };
    }
    if (mode === 'state') {
        const [saved, profile] = await Promise.all([db.from('boutique_favorites').select('item_id').eq('user_id', userId).limit(200), db.from('profiles').select('role,tentative_wedding_date,wedding_budget,language').eq('id', userId).maybeSingle()]);
        if (saved.error)
            throw saved.error;
        return { saved: (saved.data ?? []).map(row => row.item_id), profile: profile.data };
    }
    if (mode !== 'appointments' || id && !uuid.safeParse(id).success)
        throw new Error('Invalid request');
    const { data, error } = await db.rpc('boutique_appointment_inbox', { p_page: page, p_id: id }).abortSignal(AbortSignal.timeout(10000));
    if (error)
        throw error;
    return { items: data ?? [], userId };
}
export async function mutateBoutique(db: SupabaseClient, value: unknown) {
    const parsed = commands.safeParse(value);
    if (!parsed.success)
        return { ok: false, status: 400, error: 'Check the required fields and limits.' };
    const c = parsed.data;
    const call = c.action === 'settings' ? ['save_boutique', { p_vendor: c.vendor, p_data: c.data }] :
        c.action === 'item' ? ['save_boutique_item', { p_vendor: c.vendor, p_id: c.id, p_data: c.data }] :
            c.action === 'favorite' ? ['set_boutique_favorite', { p_item: c.id, p_saved: c.saved }] :
                c.action === 'request' ? ['request_boutique_appointment', { p_vendor: c.vendor, p_submission: c.submission, p_data: c.data }] :
                    c.action === 'decide' ? ['decide_boutique_appointment', { p_id: c.id, p_status: c.status, p_version: c.version, p_note: c.note }] :
                        ['reply_boutique_appointment', { p_id: c.id, p_submission: c.submission, p_body: c.body }];
    const { data, error } = await db.rpc(call[0] as string, call[1] as Record<string, unknown>).abortSignal(AbortSignal.timeout(15000));
    if (error) {
        const safe = /^(A retry|Review current|Another visit|Appointment changed|Invalid date|Select up to|An outfit|A photo|Outfit name|Reload your|Please manage|Collection limit|Favorite limit|This contact|Visit cannot|Accept the Terms)/.test(error.message);
        return { ok: false, status: error.code === '42501' ? 403 : error.code === '40001' ? 409 : 400, error: safe ? error.message : 'This action is unavailable. Check your account, store policies and selected outfits.' };
    }
    return { ok: true, data };
}
