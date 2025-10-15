export type VendorMediaItem = {
  id: string | number;
  type: 'photo' | 'video';
  url: string;
  caption: string | null;
  sort: number | null;
};

export type VendorSpace = {
  id: string;
  name: string | null;
  description: string | null;
  capacityMin: number | null;
  capacityMax: number | null;
};

export type VendorPricingItem = {
  itemKey: string;
  priceCents: number | null;
  currency: string;
  contactForPrice: boolean;
  notes: string | null;
};

export type VendorAmenity = {
  key: string;
  label: string;
};

export type VendorTeamMember = {
  id: string;
  name: string;
  title: string | null;
  bio: string | null;
  headshotUrl: string | null;
  respondsWithinHours: number | null;
};

export type VendorReviewItem = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: string;
  authorName: string | null;
  vendorReply: string | null;
  photos: { url: string; alt?: string }[];
};

export type VendorReviewSummary = {
  ratingAvg: number | null;
  ratingCount: number;
  aiSummary: string | null;
  distribution: { rating: number; count: number }[];
};

export type VendorBreadcrumb = {
  slug: string | null;
  label: string;
};

export type VendorProfileDTO = {
  vendor: {
    id: string;
    slug: string;
    name: string;
    summary: string | null;
    description: string | null;
    yearsInBusiness: number | null;
    languages: string[];
    teamSizeRange: string | null;
    phone: string | null;
    websiteUrl: string | null;
    logoUrl: string | null;
    startingPriceCents: number | null;
    startingPriceCurrency: string;
    capacityMax: number | null;
    eventTypes: string[];
    typicalSpendCents: number | null;
    typicalSpendCurrency: string;
    peakSeasons: string[];
    ratingAvg: number | null;
    ratingCount: number;
    reviewAiSummary: string | null;
    location: {
      city: string | null;
      region: string | null;
      country: string | null;
      state: string | null;
      address: string | null;
      addressLabel: string | null;
      mapUrl: string | null;
    };
  };
  media: VendorMediaItem[];
  spaces: VendorSpace[];
  pricing: VendorPricingItem[];
  amenities: {
    amenities: VendorAmenity[];
    ceremonyTypes: VendorAmenity[];
    settings: VendorAmenity[];
    services: VendorAmenity[];
  };
  team: VendorTeamMember[];
  availability: {
    note: string | null;
  };
  reviews: {
    summary: VendorReviewSummary;
    items: VendorReviewItem[];
  };
  breadcrumbs: {
    categories: VendorBreadcrumb[];
    region: string | null;
    city: string | null;
    country: string | null;
  };
};
