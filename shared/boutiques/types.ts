export type BoutiqueLanguage = 'en' | 'es';
export type LocalizedBoutiqueText = {
    en: string;
    es: string;
};
export type OutfitKind = 'dress' | 'suit';
export type Outfit = {
    id: string;
    vendor_id: string;
    kind: OutfitKind;
    name: LocalizedBoutiqueText;
    description: LocalizedBoutiqueText;
    designer: string;
    reference: string;
    offer: 'purchase' | 'rental' | 'both';
    details: Record<string, string>;
    sample_sizes: string;
    order_sizes: string;
    lead_time: string;
    price_cents: number | null;
    currency: 'USD' | 'CRC';
    media: unknown[];
    images: string[];
    videos: string[];
    is_published: boolean;
    updated_at: string;
};
export type Boutique = {
    vendor_id: string;
    slug: string;
    name: string;
    city: string;
    region: string;
    bio: LocalizedBoutiqueText;
    hero: string | null;
    logo: string | null;
    languages: string[];
    address: string | null;
    map_url: string | null;
    enabled: boolean;
    duration_minutes: number;
    companions_max: number;
    visit_fee_cents: number;
    currency: 'USD' | 'CRC';
    policies: LocalizedBoutiqueText;
    updated_at: string;
    items: Outfit[];
};
export type BoutiqueAppointment = {
    id: string;
    vendor_id: string;
    client_id: string;
    vendor_name: string;
    client_name: string;
    starts_at: string;
    duration_minutes: number;
    wedding_date: string | null;
    companions: number;
    size_note: string;
    budget: string;
    note: string;
    status: 'requested' | 'confirmed' | 'declined' | 'cancelled';
    version: number;
    store_note: string;
    items_snapshot: {
        id: string;
        name: LocalizedBoutiqueText;
    }[];
    policies_snapshot: {
        policies: LocalizedBoutiqueText;
        visit_fee_cents: number;
        currency: string;
    };
    created_at: string;
    messages?: {
        id: string;
        sender_id: string;
        body: string;
        created_at: string;
    }[];
};
export function boutiqueText(value: LocalizedBoutiqueText | null | undefined, language: BoutiqueLanguage) {
    return value?.[language] || value?.[language === 'en' ? 'es' : 'en'] || '';
}
export function costaRicaDateTime(date: string, time: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))
        return null;
    const value = `${date}T${time}:00-06:00`;
    const parsed = new Date(value);
    if (!Number.isFinite(parsed.getTime()))
        return null;
    // Check the calendar date without a timezone rollover accepting February 31.
    if (new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) !== date)
        return null;
    return value;
}
export function appointmentLabel(startsAt: string, language: BoutiqueLanguage) {
    return new Intl.DateTimeFormat(language === 'es' ? 'es-CR' : 'en-US', {
        dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Costa_Rica',
    }).format(new Date(startsAt));
}
export const outfitDetailKeys = {
    dress: ['silhouette', 'neckline', 'sleeves', 'fabric', 'color', 'train', 'back', 'embellishments'],
    suit: ['fit', 'fabric', 'color', 'lapel', 'pieces', 'jacket_sizes', 'trouser_sizes', 'included'],
} as const;
