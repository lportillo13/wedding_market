export type VendorListItem = {
  id: string;
  slug: string;
  business_name: string;
  bio_en: string;
  bio_es?: string;
  categories: string[];
  rating_avg: number;
  rating_count: number;
  created_at: string;
};

export type VendorsResponse = {
  items: VendorListItem[];
  total: number;
  page: number;
  pageSize: number;
};
