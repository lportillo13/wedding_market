-- migrations/vendor_profile.sql
-- Schema updates required for the vendor profile page experience.

-- 1) Lookup table for amenity metadata.
create table if not exists public.amenity_lookup (
  key text primary key,
  group_key text not null,
  label jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 2) Junction table linking vendors to amenities.
create table if not exists public.vendor_amenities (
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  amenity_key text not null references public.amenity_lookup (key) on delete cascade,
  primary key (vendor_id, amenity_key)
);

-- 3) Extend vendor_media with structured metadata while keeping existing rows intact.
alter table public.vendor_media
  add column if not exists caption jsonb default '{}'::jsonb,
  add column if not exists sort_order int default 0,
  add column if not exists media_type text;

update public.vendor_media set media_type = coalesce(media_type, kind) where media_type is null;

-- 4) Sub-venue spaces per vendor.
create table if not exists public.vendor_spaces (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  name jsonb not null,
  description jsonb default '{}'::jsonb,
  capacity_min int,
  capacity_max int,
  created_at timestamptz not null default now()
);

-- 5) Vendor team members.
create table if not exists public.vendor_team (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  name text not null,
  title jsonb default '{}'::jsonb,
  bio jsonb default '{}'::jsonb,
  headshot_url text,
  responds_within_hours int,
  sort_order int default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_vendor_team_vendor_sort on public.vendor_team(vendor_id, sort_order);

-- 6) Vendor pricing rows (per category item).
create table if not exists public.vendor_pricing (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  item_key text not null,
  price_cents bigint,
  currency text default 'USD',
  contact_for_price boolean not null default false,
  notes jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create unique index if not exists idx_vendor_pricing_vendor_item on public.vendor_pricing(vendor_id, item_key);

-- 7) Vendor availability dates surfaced on the profile page.
create table if not exists public.vendor_availability (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  available_on date not null,
  availability_status text not null default 'available',
  created_at timestamptz not null default now(),
  unique (vendor_id, available_on),
  constraint vendor_availability_status_check check (availability_status in ('available', 'busy'))
);
create index if not exists idx_vendor_availability_vendor_date
  on public.vendor_availability(vendor_id, available_on);

-- 8) Optional vendor metadata surfaced on the profile page.
alter table public.vendors
  add column if not exists address_label text,
  add column if not exists map_url text,
  add column if not exists phone text,
  add column if not exists website_url text,
  add column if not exists logo_url text,
  add column if not exists starting_price_cents bigint,
  add column if not exists starting_price_currency text default 'USD',
  add column if not exists capacity_max int,
  add column if not exists event_types text[] default '{}',
  add column if not exists years_in_business int,
  add column if not exists languages text[] default '{}',
  add column if not exists team_size_range text,
  add column if not exists pricing_typical_spend_cents bigint,
  add column if not exists pricing_typical_spend_currency text default 'USD',
  add column if not exists pricing_peak_seasons text[] default '{}',
  add column if not exists review_ai_summary text;

-- 9) RFQ guest support + metadata captured by the public contact form.
alter table public.rfqs
  add column if not exists flexible_date boolean default false,
  add column if not exists guest_count_range text,
  add column if not exists guest_first_name text,
  add column if not exists guest_last_name text,
  add column if not exists guest_lead_email text,
  add column if not exists guest_phone text,
  add column if not exists vendor_id uuid,
  alter column owner_id drop not null;

-- 10) Materialized JSON view used by the Next.js page. Recreate for the new shape.
create or replace view public.vendor_profile_view as
select
  v.id,
  v.slug,
  v.business_name as name,
  v.bio,
  v.extra_info,
  v.address_label,
  v.map_url,
  v.phone,
  v.website_url,
  v.logo_url,
  v.starting_price_cents,
  v.starting_price_currency,
  v.capacity_max,
  v.event_types,
  v.years_in_business,
  v.languages,
  v.team_size_range,
  v.pricing_typical_spend_cents,
  v.pricing_typical_spend_currency,
  v.pricing_peak_seasons,
  v.rating_avg,
  v.rating_count,
  v.review_ai_summary,
  vl.city,
  vl.region,
  vl.country,
  vl.state,
  vl.address,
  coalesce((
    select json_agg(json_build_object(
      'id', m.id,
      'type', coalesce(m.media_type, m.kind),
      'url', m.url,
      'caption', m.caption,
      'sort', m.sort_order
    ) order by m.sort_order, m.created_at)
    from public.vendor_media m
    where m.vendor_id = v.id
  ), '[]'::json) as media,
  coalesce((
    select json_agg(json_build_object(
      'id', s.id,
      'name', s.name,
      'description', s.description,
      'capacity_min', s.capacity_min,
      'capacity_max', s.capacity_max
    ) order by s.created_at)
    from public.vendor_spaces s
    where s.vendor_id = v.id
  ), '[]'::json) as spaces,
  coalesce((
    select json_agg(json_build_object(
      'item_key', p.item_key,
      'price_cents', p.price_cents,
      'currency', p.currency,
      'contact_for_price', p.contact_for_price,
      'notes', p.notes
    ) order by p.created_at)
    from public.vendor_pricing p
    where p.vendor_id = v.id
  ), '[]'::json) as pricing,
  coalesce((
    select json_agg(json_build_object(
      'key', al.key,
      'group', al.group_key,
      'label', al.label
    ) order by al.group_key, al.key)
    from public.vendor_amenities va
    join public.amenity_lookup al on al.key = va.amenity_key
    where va.vendor_id = v.id
  ), '[]'::json) as amenity_items,
  coalesce((
    select json_agg(json_build_object(
      'id', t.id,
      'name', t.name,
      'title', t.title,
      'bio', t.bio,
      'headshot_url', t.headshot_url,
      'responds_within_hours', t.responds_within_hours,
      'sort', t.sort_order
    ) order by t.sort_order, t.created_at)
    from public.vendor_team t
    where t.vendor_id = v.id
  ), '[]'::json) as team,
  coalesce((
    select json_agg(json_build_object(
      'id', c.id,
      'key', c.key,
      'slug', c.slug,
      'label', c.label
    ))
    from public.vendor_categories vc
    join public.categories c on c.id = vc.category_id
    where vc.vendor_id = v.id
  ), '[]'::json) as categories,
  coalesce((
    select json_agg(json_build_object(
      'id', a.id,
      'available_on', a.available_on,
      'availability_status', a.availability_status
    ) order by a.available_on)
    from public.vendor_availability a
    where a.vendor_id = v.id
  ), '[]'::json) as availability_dates
from public.vendors v
left join public.vendor_locations vl on vl.vendor_id = v.id
where coalesce(v.is_published, false) = true;

alter table public.vendor_availability enable row level security;

create policy vendor_availability_owner_crud on public.vendor_availability
using (
  exists (
    select 1
    from public.vendors v
    where v.id = vendor_availability.vendor_id
      and v.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.vendors v
    where v.id = vendor_availability.vendor_id
      and v.owner_id = auth.uid()
  )
);

create policy vendor_availability_public_read on public.vendor_availability
for select
using (
  exists (
    select 1
    from public.vendors v
    where v.id = vendor_availability.vendor_id
      and v.is_published = true
  )
);

grant select on public.vendor_availability to anon;
grant select, insert, update, delete on public.vendor_availability to authenticated;

-- 11) Ensure helper index for vendor_media ordering.
create index if not exists idx_vendor_media_vendor_sort on public.vendor_media(vendor_id, sort_order);

