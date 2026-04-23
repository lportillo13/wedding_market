create table if not exists public.vendor_availability (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  available_on date not null,
  availability_status text not null default 'available',
  created_at timestamptz not null default now(),
  unique (vendor_id, available_on)
);

alter table public.vendor_availability
  add column if not exists availability_status text not null default 'available';

update public.vendor_availability
set availability_status = 'available'
where availability_status is null
   or availability_status not in ('available', 'busy');

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vendor_availability_status_check'
  ) then
    alter table public.vendor_availability
      add constraint vendor_availability_status_check
      check (availability_status in ('available', 'busy'));
  end if;
end $$;

create index if not exists idx_vendor_availability_vendor_date
  on public.vendor_availability(vendor_id, available_on);

drop policy if exists vendor_availability_owner_crud on public.vendor_availability;
drop policy if exists vendor_availability_public_read on public.vendor_availability;

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
