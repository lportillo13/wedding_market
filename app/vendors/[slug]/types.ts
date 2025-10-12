import type { VendorImage } from "@/types/vendor";

export type VendorProfile = {
  id: string;
  slug: string;
  business_name: string;
  bio_en: string | null;
  bio_es: string | null;
  categories: string[] | null;
  created_at: string;
  is_published: boolean;
  hero_image: VendorImage | null;
  thumbnail_image: VendorImage | null;
  gallery_images: VendorImage[] | null;
};

export type VendorRating = {
  rating_avg: number | null;
  rating_count: number | null;
};
