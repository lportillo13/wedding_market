-- Example query to fetch a fully hydrated vendor profile by slug.
-- Replace `sample-slug` with the vendor slug you want to inspect.
select to_jsonb(vpv.*)
from public.vendor_profile_view vpv
where vpv.slug = 'sample-slug';
