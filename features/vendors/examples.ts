import { getExampleVendor } from '../../shared/vendors/examples';
import type { VendorProfileDTO } from '../../types/vendor-profile';

/** Presentation adapter only; example IDs have no database account or invitations. */
export function exampleVendorProfile(slug: string, language: 'en' | 'es'): VendorProfileDTO | null {
  const row = getExampleVendor(slug, language);
  if (!row) return null;
  return {
    vendor: {
      id: row.id, slug, name: row.business_name,
      summary: language === 'es' ? row.bio_es : row.bio_en,
      description: language === 'es' ? row.extra_info_es : row.extra_info_en,
      yearsInBusiness: row.years_in_business, languages: row.languages, teamSizeRange: row.team_size_range,
      phone: null, websiteUrl: null, logoUrl: null,
      startingPriceCents: row.starting_price_cents, startingPriceCurrency: 'USD',
      typicalSpendCents: row.typical_spend_cents, typicalSpendCurrency: 'USD', capacityMax: row.capacity_max,
      eventTypes: row.event_types, peakSeasons: [], ratingAvg: row.rating_avg, ratingCount: row.rating_count, reviewAiSummary: null,
      location: { ...row.location, state: null, address: null, addressLabel: null, mapUrl: null },
    },
    heroVideo: row.hero_video,
    media: row.media.map(item => ({ id: item.public_id, type: item.type === 'video' ? 'video' : 'photo', url: item.url, caption: item.caption, sort: item.sort })),
    spaces: row.spaces.map(item => ({ id: item.id, name: item.name, description: item.description, capacityMin: item.capacity_min, capacityMax: item.capacity_max })),
    pricing: row.pricing.map(item => ({ itemKey: item.item_key, priceCents: item.price_cents, currency: item.currency, contactForPrice: false, notes: item.notes })),
    amenities: { amenities: [], ceremonyTypes: [], settings: [], services: row.amenities.services },
    team: row.team.map(item => ({ id: item.id, name: item.name, title: item.title, bio: item.bio, headshotUrl: null, respondsWithinHours: item.responds_within_hours })),
    availability: { dates: row.availability },
    reviews: { source: 'internal', externalUrl: null, summary: { ratingAvg: row.rating_avg, ratingCount: row.rating_count, aiSummary: null, distribution: row.review_distribution }, items: row.reviews.map(item => ({ ...item, createdAt: item.created_at, authorName: language === 'es' ? 'Pareja de ejemplo' : 'Sample couple', vendorReply: null, photos: [] })) },
    breadcrumbs: { categories: row.category_details, city: row.city, region: row.region, country: 'Costa Rica' },
  };
}
