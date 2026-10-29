import { exampleBoutiques, EXAMPLE_CLIENT } from './examples';
import type { Boutique, BoutiqueAppointment, Outfit } from './types';
type RequestRecord = BoutiqueAppointment & {
    submission: string;
    fingerprint: string;
};
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
/** In-memory, explicitly fictional preview. Never reads or writes customer data. */
export class ExampleBoutiqueSession {
    shops: Boutique[];
    saved: string[] = [];
    requests: RequestRecord[] = [];
    role: 'couple' | 'store' = 'couple';
    storeId: string;
    private viewedStore: string;
    private sequence = 200;
    private replies = new Map<string, string>();
    private libraries: Map<string, unknown[]>;
    constructor(assetBase = '') { this.shops = exampleBoutiques(assetBase); this.storeId = this.shops[0].vendor_id; this.viewedStore = this.storeId; this.libraries = new Map(this.shops.map(s => [s.vendor_id, [...new Map(s.items.flatMap(i => i.media).map(asset=>[JSON.stringify(asset),clone(asset)])).values()]])); }
    setRole(role: 'couple' | 'store') { if (role === 'store' && this.role === 'couple')
        this.storeId = this.viewedStore; this.role = role; }
    setStore(id: string) { this.shop(id); this.storeId = id; }
    private id() { return `e0130000-0000-4000-8000-${String(++this.sequence).padStart(12, '0')}`; }
    private shop(id = this.storeId) { const result = this.shops.find(s => s.vendor_id === id); if (!result)
        throw Error('Example boutique unavailable.'); return result; }
    api = async <T>(path: string, body?: unknown): Promise<T> => {
        const url = new URL(path || '?', 'https://example.invalid');
        const page = Math.max(1, Math.min(Number(url.searchParams.get('page') ?? 1), 1000));
        const slice = <U>(items: U[]) => items.slice((page - 1) * 12, page * 12);
        if (!body) {
            if (!path.startsWith('/account')) {
                const slug = url.searchParams.get('slug');
                if (!slug) {
                    const kind = url.searchParams.get('kind');
                    return clone({ items: slice(this.shops.filter(s => s.enabled && (!kind || s.items.some(item => item.is_published && item.kind === kind)))) }) as T;
                }
                const store = this.shops.find(s => s.slug === slug && s.enabled);
                if (!store)
                    throw Error('Example boutique unavailable.');
                this.viewedStore = store.vendor_id;
                const kind = url.searchParams.get('kind');
                return clone({ ...store, items: slice(store.items.filter(i => i.is_published && (!kind || i.kind === kind))) }) as T;
            }
            const mode = url.searchParams.get('mode');
            if (mode === 'state')
                return clone({ saved: this.saved, profile: { role: this.role === 'couple' ? 'user' : 'vendor', tentative_wedding_date: null, wedding_budget: null } }) as T;
            if (mode === 'favorites')
                return clone({ items: slice(this.shops.filter(s => s.enabled).flatMap(s => s.items.filter(i => i.is_published && this.saved.includes(i.id)).map(i => ({ ...i, slug: s.slug, vendor_name: s.name })))) }) as T;
            if (mode === 'workspace') {
                if (this.role !== 'store')
                    throw Error('Switch to the boutique preview to manage this collection.');
                const store = this.shop();
                return clone({ vendor: { id: store.vendor_id, slug: store.slug, business_name: store.name, gallery_images: this.libraries.get(store.vendor_id) }, settings: store, items: store.items }) as T;
            }
            if (mode === 'appointments') {
                const id = url.searchParams.get('id');
                return clone({ items: slice(this.requests.filter(r => (this.role === 'couple' || r.vendor_id === this.storeId) && (!id || r.id === id))), userId: this.role === 'couple' ? EXAMPLE_CLIENT : this.storeId }) as T;
            }
            throw Error('Unsupported example view.');
        }
        const command = body as Record<string, unknown>, data = command.data as Record<string, unknown>;
        if (command.action === 'favorite') {
            const item = this.shops.flatMap(s => s.items).find(i => i.id === command.id);
            if (!item)
                throw Error('Example outfit unavailable.');
            this.saved = command.saved ? [...new Set([...this.saved, item.id])] : this.saved.filter(id => id !== item.id);
            return { ok: true } as T;
        }
        if (command.action === 'request') {
            if (this.role !== 'couple')
                throw Error('Switch to the couple preview to request a fitting.');
            const fingerprint = JSON.stringify(data), old = this.requests.find(r => r.submission === command.submission);
            if (old) {
                if (old.fingerprint !== fingerprint || old.vendor_id !== command.vendor)
                    throw Error('A retry cannot change an existing request.');
                return { ok: true, data: old.id } as T;
            }
            const store = this.shop(String(command.vendor)), ids = data.items as string[];
            const start = new Date(String(data.starts_at)).getTime();
            if (!store.enabled || !Number.isFinite(start) || start <= Date.now() || start > Date.now() + 2 * 365 * 86400000 || !data.accepted || data.policies_version !== store.updated_at || !Number.isInteger(data.companions) || Number(data.companions) < 0 || Number(data.companions) > store.companions_max || !Array.isArray(ids) || ids.length > 5 || ids.some(id => !store.items.some(i => i.id === id && i.is_published)))
                throw Error('Check your preferred date, companions, outfits and visit policies.');
            const request: RequestRecord = { id: this.id(), vendor_id: store.vendor_id, client_id: EXAMPLE_CLIENT, vendor_name: store.name, client_name: 'Example couple / Pareja de ejemplo', starts_at: String(data.starts_at), duration_minutes: store.duration_minutes, wedding_date: String(data.wedding_date) || null, companions: Number(data.companions), size_note: String(data.size_note), budget: String(data.budget), note: String(data.note), status: 'requested', version: 1, store_note: '', items_snapshot: store.items.filter(i => ids.includes(i.id)).map(i => ({ id: i.id, name: clone(i.name) })), policies_snapshot: { policies: clone(store.policies), visit_fee_cents: store.visit_fee_cents, currency: store.currency }, created_at: new Date().toISOString(), messages: [], submission: String(command.submission), fingerprint };
            this.requests.unshift(request);
            return { ok: true, data: request.id } as T;
        }
        if (command.action === 'decide' || command.action === 'reply') {
            const request = this.requests.find(r => r.id === command.id && (this.role === 'couple' || r.vendor_id === this.storeId));
            if (!request)
                throw Error('Example appointment unavailable.');
            if (command.action === 'reply') {
                const key = String(command.submission), signature = JSON.stringify([request.id, this.role, command.body]);
                if (this.replies.has(key)) {
                    if (this.replies.get(key) !== signature)
                        throw Error('A retry cannot replace a message.');
                    return { ok: true } as T;
                }
                const text = String(command.body).trim();
                if (!text || text.length > 2000)
                    throw Error('Enter a message up to 2,000 characters.');
                this.replies.set(key, signature);
                request.messages!.push({ id: this.id(), sender_id: this.role === 'couple' ? EXAMPLE_CLIENT : this.storeId, body: text, created_at: new Date().toISOString() });
                return { ok: true } as T;
            }
            const status = command.status as BoutiqueAppointment['status'];
            if (!['confirmed', 'declined', 'cancelled'].includes(status))
                throw Error('Invalid appointment decision.');
            if (status !== 'cancelled' && this.role !== 'store')
                throw Error('Switch to the boutique preview to confirm a visit.');
            if (request.status === status)
                return { ok: true } as T;
            if (request.version !== command.version || ['cancelled', 'declined'].includes(request.status) || (request.status === 'confirmed' && status !== 'cancelled'))
                throw Error('Appointment changed. Refresh before deciding.');
            if (status === 'confirmed' && this.requests.some(r => r.id !== request.id && r.vendor_id === request.vendor_id && r.status === 'confirmed' && new Date(r.starts_at).getTime() < new Date(request.starts_at).getTime() + request.duration_minutes * 60000 && new Date(r.starts_at).getTime() + r.duration_minutes * 60000 > new Date(request.starts_at).getTime()))
                throw Error('Another visit is already confirmed at that time.');
            request.status = status;
            request.version++;
            if (this.role === 'store')
                request.store_note = String(command.note ?? '');
            return { ok: true } as T;
        }
        if (this.role !== 'store')
            throw Error('Switch to the boutique preview to manage this collection.');
        const store = this.shop(String(command.vendor));
        if (store.vendor_id !== this.storeId)
            throw Error('Choose this boutique in the preview controls first.');
        if (command.action === 'settings') {
            if (Number(data.duration_minutes) < 15 || Number(data.duration_minutes) > 180 || Number(data.companions_max) < 0 || Number(data.companions_max) > 10 || Number(data.visit_fee_cents) < 0)
                throw Error('Check the visit duration, companions and fee.');
            Object.assign(store, clone(data), { updated_at: new Date().toISOString() });
            return { ok: true } as T;
        }
        if (command.action === 'item') {
            const old = store.items.find(i => i.id === command.id);
            if (command.id && !old)
                throw Error('Outfit unavailable.');
            if (!old && store.items.length >= 60)
                throw Error('Collection limit reached.');
            const name = data.name as {
                en?: string;
                es?: string;
            };
            if (!name?.en?.trim() && !name?.es?.trim())
                throw Error('Outfit name is required.');
            const library = this.libraries.get(store.vendor_id)!;
            const media = (data.media_indexes as number[]).map(index => library[index]);
            if (media.length > 6 || media.some(m => !m) || data.is_published && !media.some(m => (m as {
                type?: string;
            }).type !== 'video'))
                throw Error('Choose a photo before publishing.');
            const value = { ...clone(data), id: old?.id ?? this.id(), vendor_id: store.vendor_id, media, images: media.flatMap(m => { const a = m as {
                    url?: string;
                    type?: string;
                }; return a.type !== 'video' && a.url ? [a.url] : []; }), videos: media.flatMap(m => { const a = m as {
                    url?: string;
                    type?: string;
                }; return a.type === 'video' && a.url ? [a.url] : []; }), updated_at: new Date().toISOString() } as unknown as Outfit;
            if (old)
                Object.assign(old, value);
            else
                store.items.push(value);
            return { ok: true, data: value.id } as T;
        }
        throw Error('Unsupported example action.');
    };
}
