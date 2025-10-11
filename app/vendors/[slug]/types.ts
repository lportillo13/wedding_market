export type VendorProfile = {
  id: string;
  slug: string;
  business_name: string;
  bio_en: string | null;
  bio_es: string | null;
  categories: string[] | null;
  created_at: string;
  is_published: boolean;
};

export type VendorRating = {
  rating_avg: number | null;
  rating_count: number | null;
};
