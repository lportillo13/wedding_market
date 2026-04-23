import type { VendorImage } from "@/types/vendor";

export type CategoryOption = {
  key: string;
  label: Record<string, unknown> | null;
};

export type VendorListItem = {
  id: string;
  slug: string;
  business_name: string;
  bio_en: string;
  bio_es?: string;
  extra_info_en?: string | null;
  extra_info_es?: string | null;
  categories: string[];
  rating_avg: number;
  rating_count: number;
  created_at: string;
  hero_image?: VendorImage | null;
  thumbnail_image?: VendorImage | null;
  gallery_images?: VendorImage[] | null;
};

export type VendorsResponse = {
  items: VendorListItem[];
  total: number;
  page: number;
  pageSize: number;
};
