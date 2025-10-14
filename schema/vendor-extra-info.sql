-- Manual Supabase migration for vendor multilingual bios and extra info content.
-- Run these statements sequentially inside the Supabase SQL editor.

-- 1. Ensure vendors table can store translated extra info snippets.
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS extra_info jsonb DEFAULT '{}'::jsonb;

-- 2. Recreate the vendor_public_search view so search endpoints expose
--    the translated bio and extra info fields. We have to drop the view
--    first because CREATE OR REPLACE VIEW cannot add new columns.
DROP VIEW IF EXISTS public.vendor_public_search;

CREATE VIEW public.vendor_public_search AS
SELECT
  v.id,
  v.slug,
  v.business_name,
  v.hero_image,
  v.thumbnail_image,
  v.gallery_images,
  v.rating_avg,
  v.rating_count,
  v.is_published,
  v.created_at,
  COALESCE(v.bio ->> 'en', '') AS bio_en,
  COALESCE(v.bio ->> 'es', '') AS bio_es,
  COALESCE(v.extra_info ->> 'en', '') AS extra_info_en,
  COALESCE(v.extra_info ->> 'es', '') AS extra_info_es,
  loc.city,
  loc.region,
  loc.country,
  loc.lat,
  loc.lng,
  ARRAY_REMOVE(ARRAY_AGG(DISTINCT cat.key), NULL) AS categories
FROM public.vendors v
LEFT JOIN public.vendor_locations loc ON loc.vendor_id = v.id
LEFT JOIN public.vendor_categories vc ON vc.vendor_id = v.id
LEFT JOIN public.categories cat ON cat.id = vc.category_id
GROUP BY
  v.id,
  v.slug,
  v.business_name,
  v.hero_image,
  v.thumbnail_image,
  v.gallery_images,
  v.rating_avg,
  v.rating_count,
  v.is_published,
  v.created_at,
  loc.city,
  loc.region,
  loc.country,
  loc.lat,
  loc.lng;
