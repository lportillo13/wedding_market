import { localizedText, type VendorEditorData } from '../../lib/vendorProfile';
import { type VendorDetail } from '../../lib/api';
import { resolveVendorHeroVideo } from '../../../../shared/vendors/hero';
/** Projection of the caller's RLS-protected saved data; never a public cache. */
export function savedVendorPreview(data: VendorEditorData, language: 'en' | 'es'): VendorDetail {
    const v = data.vendor;
    const gallery = (v.gallery_images ?? []).filter(item => typeof item.url === 'string');
    return { id: String(v.id), slug: v.slug ?? '', business_name: v.business_name ?? '', bio_en: localizedText(v.bio, language),
        extra_info_en: localizedText(v.extra_info, language), categories: data.categoryKeys, logo_url: v.logo_url,
        hero_image: v.hero_image, thumbnail_image: v.thumbnail_image, gallery_images: gallery,
        hero_video: resolveVendorHeroVideo(v.extra_info?.hero_presentation, gallery),
        phone: v.phone, website_url: v.website_url, location: { address_label: v.address_label, country: 'Costa Rica' },
        starting_price_cents: v.starting_price_cents, starting_price_currency: v.starting_price_currency,
        typical_spend_cents: v.pricing_typical_spend_cents, typical_spend_currency: v.pricing_typical_spend_currency,
        years_in_business: v.years_in_business, languages: v.languages, team_size_range: v.team_size_range, event_types: v.event_types,
        capacity_max: v.capacity_max, review_ai_summary: v.review_ai_summary, peak_seasons: v.pricing_peak_seasons,
        pricing: data.pricing.map(row => ({ ...row, currency: row.currency ?? 'USD', contact_for_price: Boolean(row.contact_for_price), notes: localizedText(row.notes, language) })),
        team: data.team.map((row, index) => ({ id: row.id ?? String(index), name: row.name ?? '', title: localizedText(row.title, language), bio: localizedText(row.bio, language), headshot_url: row.headshot_url ?? null, responds_within_hours: row.responds_within_hours ?? null })),
        availability: data.availability.filter(row => Boolean(row.available_on)).map((row, index) => ({ id: row.id ?? String(index), date: row.available_on!, status: row.availability_status === 'busy' ? 'busy' : 'available' })),
        amenities: { amenities: data.amenityOptions.filter(row => data.selectedAmenities.includes(row.key)).map(row => ({ key: row.key, label: localizedText(row.label, language) })), ceremony_types: [], settings: [], services: [] },
    };
}
