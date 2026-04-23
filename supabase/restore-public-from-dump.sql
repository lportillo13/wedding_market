set check_function_bodies = off;
set client_min_messages = warning;
drop schema if exists public cascade;
create schema public;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists pgjwt with schema extensions;
create extension if not exists pg_trgm with schema public;
create extension if not exists "uuid-ossp" with schema extensions;
grant usage on schema public to postgres, anon, authenticated, service_role;
grant create on schema public to postgres, authenticated, service_role;

CREATE TYPE public.rfq_invite_status AS ENUM (
    'invited',
    'viewed',
    'responded',
    'declined',
    'expired',
    'accepted'
);


ALTER TYPE public.rfq_invite_status OWNER TO postgres;

CREATE SEQUENCE public.categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

CREATE SEQUENCE public.vendor_media_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vendor_media_id_seq OWNER TO postgres;

CREATE TABLE public.profile_translated_fields (
    profile_id uuid NOT NULL,
    field text NOT NULL,
    language text NOT NULL,
    value text NOT NULL,
    translated_via text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT profile_translated_fields_field_check CHECK ((field ~ '^[a-z0-9_]+$'::text))
);


ALTER TABLE public.profile_translated_fields OWNER TO postgres;

CREATE TABLE public.amenity_lookup (
    key text NOT NULL,
    group_key text NOT NULL,
    label jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.amenity_lookup OWNER TO postgres;

CREATE TABLE public.blog_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    excerpt text,
    hero_image_url text,
    body text,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT blog_posts_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text])))
);


ALTER TABLE public.blog_posts OWNER TO postgres;

CREATE TABLE public.categories (
    id bigint NOT NULL,
    key text NOT NULL,
    label jsonb NOT NULL,
    slug text
);


ALTER TABLE public.categories OWNER TO postgres;

CREATE TABLE public.languages (
    code text NOT NULL,
    name text NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.languages OWNER TO postgres;

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text,
    role text DEFAULT 'user'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    phone text,
    country text,
    tentative_wedding_date date,
    guest_count integer,
    wedding_budget numeric,
    wedding_theme text,
    language text DEFAULT 'en'::text NOT NULL,
    CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['user'::text, 'vendor'::text, 'admin'::text])))
);


ALTER TABLE public.profiles OWNER TO postgres;

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recipient_id uuid NOT NULL,
    actor_id uuid,
    type text NOT NULL,
    title text NOT NULL,
    body text,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    read_at timestamp with time zone,
    deleted_at timestamp with time zone,
    email_status text DEFAULT 'pending'::text NOT NULL,
    email_sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT notifications_email_status_check CHECK ((email_status = ANY (ARRAY['pending'::text, 'queued'::text, 'sent'::text, 'failed'::text, 'skipped'::text]))),
    CONSTRAINT notifications_type_check CHECK ((type = ANY (ARRAY['quote_answered'::text, 'vendor_new_request'::text, 'vendor_quote_accepted'::text])))
);


ALTER TABLE public.notifications OWNER TO postgres;

GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE public.notifications TO authenticated;

GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE public.notifications TO service_role;

CREATE TABLE public.quotes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rfq_id uuid NOT NULL,
    vendor_id uuid NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    amount_cents integer,
    currency text DEFAULT 'USD'::text,
    message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.quotes OWNER TO postgres;

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rfq_id uuid NOT NULL,
    vendor_id uuid NOT NULL,
    author_id uuid NOT NULL,
    stars smallint NOT NULL,
    title text,
    body text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT reviews_stars_check CHECK (((stars >= 1) AND (stars <= 5)))
);


ALTER TABLE public.reviews OWNER TO postgres;

CREATE TABLE public.rfq_invites (
    rfq_id uuid NOT NULL,
    vendor_id uuid NOT NULL,
    status public.rfq_invite_status DEFAULT 'invited'::public.rfq_invite_status NOT NULL,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    reveal_email boolean DEFAULT false NOT NULL,
    reveal_phone boolean DEFAULT false NOT NULL
);


ALTER TABLE public.rfq_invites OWNER TO postgres;

CREATE TABLE public.rfqs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    event_date date,
    guest_count integer,
    budget_min integer,
    budget_max integer,
    city text,
    state text,
    country text,
    language text,
    theme text,
    notes text,
    accepted_quote_id uuid,
    accepted_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    contact_email text,
    contact_phone text,
    flexible_date boolean DEFAULT false,
    guest_count_range text,
    guest_first_name text,
    guest_last_name text,
    guest_lead_email text,
    guest_phone text,
    vendor_id uuid
);


ALTER TABLE public.rfqs OWNER TO postgres;

CREATE TABLE public.site_settings (
    key text NOT NULL,
    value jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.site_settings OWNER TO postgres;

CREATE TABLE public.vendor_amenities (
    vendor_id uuid NOT NULL,
    amenity_key text NOT NULL
);


ALTER TABLE public.vendor_amenities OWNER TO postgres;

CREATE TABLE public.vendor_categories (
    vendor_id uuid NOT NULL,
    category_id bigint NOT NULL
);


ALTER TABLE public.vendor_categories OWNER TO postgres;

CREATE TABLE public.vendor_locations (
    vendor_id uuid NOT NULL,
    country text,
    region text,
    city text,
    lat double precision,
    lng double precision,
    address text,
    state text,
    service_radius_km integer DEFAULT 50 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT vendor_locations_radius_chk CHECK (((service_radius_km >= 1) AND (service_radius_km <= 500)))
);


ALTER TABLE public.vendor_locations OWNER TO postgres;

CREATE TABLE public.vendor_media (
    id bigint NOT NULL,
    vendor_id uuid NOT NULL,
    kind text NOT NULL,
    url text NOT NULL,
    is_cover boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    caption jsonb DEFAULT '{}'::jsonb,
    sort_order integer DEFAULT 0,
    media_type text,
    CONSTRAINT vendor_media_kind_check CHECK ((kind = ANY (ARRAY['image'::text, 'video'::text])))
);


ALTER TABLE public.vendor_media OWNER TO postgres;

CREATE TABLE public.vendor_pricing (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vendor_id uuid NOT NULL,
    item_key text NOT NULL,
    price_cents bigint,
    currency text DEFAULT 'USD'::text,
    contact_for_price boolean DEFAULT false NOT NULL,
    notes jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.vendor_pricing OWNER TO postgres;

CREATE TABLE public.vendor_spaces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vendor_id uuid NOT NULL,
    name jsonb NOT NULL,
    description jsonb DEFAULT '{}'::jsonb,
    capacity_min integer,
    capacity_max integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.vendor_spaces OWNER TO postgres;

CREATE TABLE public.vendor_team (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vendor_id uuid NOT NULL,
    name text NOT NULL,
    title jsonb DEFAULT '{}'::jsonb,
    bio jsonb DEFAULT '{}'::jsonb,
    headshot_url text,
    responds_within_hours integer,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.vendor_team OWNER TO postgres;

CREATE TABLE public.vendor_availability (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vendor_id uuid NOT NULL,
    available_on date NOT NULL,
    availability_status text DEFAULT 'available'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.vendor_availability OWNER TO postgres;

CREATE TABLE public.vendors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    slug text NOT NULL,
    business_name text NOT NULL,
    bio jsonb DEFAULT '{}'::jsonb,
    rating_avg numeric(3,2) DEFAULT 0,
    rating_count integer DEFAULT 0,
    is_published boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    hero_image jsonb DEFAULT '{}'::jsonb,
    thumbnail_image jsonb DEFAULT '{}'::jsonb,
    gallery_images jsonb DEFAULT '[]'::jsonb,
    extra_info jsonb DEFAULT '{}'::jsonb,
    address_label text,
    map_url text,
    phone text,
    website_url text,
    logo_url text,
    starting_price_cents bigint,
    starting_price_currency text DEFAULT 'USD'::text,
    capacity_max integer,
    event_types text[] DEFAULT '{}'::text[],
    years_in_business integer,
    languages text[] DEFAULT '{}'::text[],
    team_size_range text,
    pricing_typical_spend_cents bigint,
    pricing_typical_spend_currency text DEFAULT 'USD'::text,
    pricing_peak_seasons text[] DEFAULT '{}'::text[],
    review_ai_summary text
);


ALTER TABLE public.vendors OWNER TO postgres;

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);

ALTER TABLE ONLY public.vendor_media ALTER COLUMN id SET DEFAULT nextval('public.vendor_media_id_seq'::regclass);

-- data inserted programmatically

CREATE FUNCTION public.can_user_review(_uid uuid, _vendor_id uuid, _rfq_id uuid) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  select exists(
    select 1
    from public.rfqs r
    join public.quotes q on q.id = r.accepted_quote_id
    where r.id = _rfq_id
      and q.vendor_id = _vendor_id
      and r.owner_id  = _uid
      and r.accepted_quote_id is not null
  );
$$;


ALTER FUNCTION public.can_user_review(_uid uuid, _vendor_id uuid, _rfq_id uuid) OWNER TO postgres;

CREATE FUNCTION public.can_vendor_view_rfq(_uid uuid, _rfq_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  return exists (
    select 1
    from public.quotes q
    join public.vendors v on v.id = q.vendor_id
    where q.rfq_id = _rfq_id
      and v.owner_id = _uid
  )
  -- Uncomment to also allow invited-but-not-yet-quoted vendors:
  -- or exists (
  --   select 1
  --   from public.rfq_invites ri
  --   join public.vendors v2 on v2.id = ri.vendor_id
  --   where ri.rfq_id = _rfq_id
  --     and v2.owner_id = _uid
  -- )
  ;
end;
$$;


ALTER FUNCTION public.can_vendor_view_rfq(_uid uuid, _rfq_id uuid) OWNER TO postgres;

CREATE FUNCTION public.first_eligible_review_rfq(_uid uuid, _vendor_id uuid) RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select r.id
  from public.rfqs r
  join public.quotes q on q.id = r.accepted_quote_id
  left join public.reviews v
    on v.rfq_id = r.id and v.vendor_id = _vendor_id and v.author_id = _uid
  where q.vendor_id = _vendor_id
    and r.owner_id  = _uid
    and r.accepted_quote_id is not null
    and v.id is null
  order by r.created_at desc nulls last
  limit 1;
$$;


ALTER FUNCTION public.first_eligible_review_rfq(_uid uuid, _vendor_id uuid) OWNER TO postgres;

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;


ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

CREATE FUNCTION public.has_user_reviewed(_uid uuid, _vendor_id uuid, _rfq_id uuid) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  select exists(
    select 1
    from public.reviews v
    where v.author_id = _uid
      and v.vendor_id = _vendor_id
      and v.rfq_id    = _rfq_id
  );
$$;


ALTER FUNCTION public.has_user_reviewed(_uid uuid, _vendor_id uuid, _rfq_id uuid) OWNER TO postgres;

CREATE FUNCTION public.is_user(_uid uuid) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  select exists(
    select 1 from public.profiles_resolved p
    where p.user_id = _uid and p.role = 'user'
  );
$$;


ALTER FUNCTION public.is_user(_uid uuid) OWNER TO postgres;

CREATE FUNCTION public.is_vendor(_uid uuid) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  -- Either explicitly marked vendor OR owns a vendor row
  select exists(
    select 1 from public.profiles_resolved p
    where p.user_id = _uid and p.role = 'vendor'
  )
  or exists(
    select 1 from public.vendors v
    where v.owner_id = _uid
  );
$$;


ALTER FUNCTION public.is_vendor(_uid uuid) OWNER TO postgres;

CREATE FUNCTION public.profile_field_translation(p_profile_id uuid, p_field text, p_language text, p_fallback_language text DEFAULT NULL::text) RETURNS text
    LANGUAGE sql
    AS $$
    SELECT COALESCE(
        (SELECT value
         FROM public.profile_translated_fields
         WHERE profile_id = p_profile_id
           AND field = p_field
           AND language = p_language),
        (SELECT value
         FROM public.profile_translated_fields
         WHERE profile_id = p_profile_id
           AND field = p_field
           AND language = COALESCE(p_fallback_language, (SELECT language FROM public.profiles WHERE id = p_profile_id))),
        (SELECT CASE p_field
                    WHEN 'full_name' THEN full_name
                    WHEN 'country' THEN country
                    WHEN 'wedding_theme' THEN wedding_theme
                    ELSE NULL
                END
         FROM public.profiles
         WHERE id = p_profile_id)
    );
$$;


ALTER FUNCTION public.profile_field_translation(p_profile_id uuid, p_field text, p_language text, p_fallback_language text) OWNER TO postgres;

CREATE FUNCTION public.recalc_vendor_rating(p_vendor_id uuid) RETURNS void
    LANGUAGE sql
    AS $$
  with agg as (
    select
      coalesce(avg(stars)::numeric(10,2), 0)::numeric as avg_rating,
      count(*)::int as cnt
    from public.reviews
    where vendor_id = p_vendor_id
  )
  update public.vendors v
  set rating_avg = a.avg_rating,
      rating_count = a.cnt
  from agg a
  where v.id = p_vendor_id;
$$;


ALTER FUNCTION public.recalc_vendor_rating(p_vendor_id uuid) OWNER TO postgres;

CREATE FUNCTION public.tg_reviews_after_write() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  perform public.recalc_vendor_rating(coalesce(new.vendor_id, old.vendor_id));
  return null;
end$$;


ALTER FUNCTION public.tg_reviews_after_write() OWNER TO postgres;

CREATE FUNCTION public.tg_set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at := now();
  return new;
end$$;


ALTER FUNCTION public.tg_set_updated_at() OWNER TO postgres;

CREATE FUNCTION public.touch_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.touch_updated_at() OWNER TO postgres;

CREATE FUNCTION public.trigger_set_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION public.trigger_set_timestamp() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

CREATE FUNCTION public.upsert_profile_translation(p_profile_id uuid, p_field text, p_language text, p_value text, p_translated_via text DEFAULT NULL::text) RETURNS public.profile_translated_fields
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_record public.profile_translated_fields;
BEGIN
    INSERT INTO public.profile_translated_fields (profile_id, field, language, value, translated_via)
    VALUES (p_profile_id, p_field, p_language, p_value, p_translated_via)
    ON CONFLICT (profile_id, field, language) DO UPDATE
    SET value = EXCLUDED.value,
        translated_via = COALESCE(EXCLUDED.translated_via, public.profile_translated_fields.translated_via),
        updated_at = now()
    RETURNING * INTO v_record;

    RETURN v_record;
END;
$$;


ALTER FUNCTION public.upsert_profile_translation(p_profile_id uuid, p_field text, p_language text, p_value text, p_translated_via text) OWNER TO postgres;

CREATE FUNCTION public.user_hired_vendor(_uid uuid, _vendor_id uuid) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  select exists(
    select 1
    from public.rfqs r
    join public.quotes q on q.id = r.accepted_quote_id
    where q.vendor_id = _vendor_id
      and r.owner_id  = _uid
      and r.accepted_quote_id is not null
  );
$$;


ALTER FUNCTION public.user_hired_vendor(_uid uuid, _vendor_id uuid) OWNER TO postgres;

CREATE VIEW public.profiles_resolved AS
 SELECT id AS user_id,
    role
   FROM public.profiles;


ALTER VIEW public.profiles_resolved OWNER TO postgres;

CREATE VIEW public.reviews_public AS
 SELECT id,
    vendor_id,
    rfq_id,
        CASE
            WHEN (author_id = auth.uid()) THEN author_id
            ELSE NULL::uuid
        END AS rater_user_id,
    stars AS rating,
    title,
    body,
    created_at
   FROM public.reviews r;


ALTER VIEW public.reviews_public OWNER TO postgres;

CREATE VIEW public.vendor_latest_quotes AS
 SELECT DISTINCT ON (rfq_id, vendor_id) id,
    rfq_id,
    vendor_id,
    version,
    amount_cents,
    currency,
    message,
    created_at,
    updated_at
   FROM public.quotes q
  ORDER BY rfq_id, vendor_id, version DESC;


ALTER VIEW public.vendor_latest_quotes OWNER TO postgres;

CREATE VIEW public.vendor_profile_view AS
 SELECT v.id,
    v.slug,
    v.business_name AS name,
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
    COALESCE(( SELECT json_agg(json_build_object('id', m.id, 'type', COALESCE(m.media_type, m.kind), 'url', m.url, 'caption', m.caption, 'sort', m.sort_order) ORDER BY m.sort_order, m.created_at) AS json_agg
           FROM public.vendor_media m
          WHERE (m.vendor_id = v.id)), '[]'::json) AS media,
    COALESCE(( SELECT json_agg(json_build_object('id', s.id, 'name', s.name, 'description', s.description, 'capacity_min', s.capacity_min, 'capacity_max', s.capacity_max) ORDER BY s.created_at) AS json_agg
           FROM public.vendor_spaces s
          WHERE (s.vendor_id = v.id)), '[]'::json) AS spaces,
    COALESCE(( SELECT json_agg(json_build_object('item_key', p.item_key, 'price_cents', p.price_cents, 'currency', p.currency, 'contact_for_price', p.contact_for_price, 'notes', p.notes) ORDER BY p.created_at) AS json_agg
           FROM public.vendor_pricing p
          WHERE (p.vendor_id = v.id)), '[]'::json) AS pricing,
    COALESCE(( SELECT json_agg(json_build_object('key', al.key, 'group', al.group_key, 'label', al.label) ORDER BY al.group_key, al.key) AS json_agg
           FROM (public.vendor_amenities va
             JOIN public.amenity_lookup al ON ((al.key = va.amenity_key)))
          WHERE (va.vendor_id = v.id)), '[]'::json) AS amenity_items,
    COALESCE(( SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'title', t.title, 'bio', t.bio, 'headshot_url', t.headshot_url, 'responds_within_hours', t.responds_within_hours, 'sort', t.sort_order) ORDER BY t.sort_order, t.created_at) AS json_agg
           FROM public.vendor_team t
          WHERE (t.vendor_id = v.id)), '[]'::json) AS team,
    COALESCE(( SELECT json_agg(json_build_object('id', c.id, 'slug', c.slug, 'label', c.label)) AS json_agg
           FROM (public.vendor_categories vc
             JOIN public.categories c ON ((c.id = vc.category_id)))
          WHERE (vc.vendor_id = v.id)), '[]'::json) AS categories,
    COALESCE(( SELECT json_agg(json_build_object('id', a.id, 'available_on', a.available_on, 'availability_status', a.availability_status) ORDER BY a.available_on) AS json_agg
           FROM public.vendor_availability a
          WHERE (a.vendor_id = v.id)), '[]'::json) AS availability_dates
   FROM (public.vendors v
     LEFT JOIN public.vendor_locations vl ON ((vl.vendor_id = v.id)))
  WHERE (COALESCE(v.is_published, false) = true);


ALTER VIEW public.vendor_profile_view OWNER TO postgres;

CREATE VIEW public.vendor_public_search AS
SELECT
    NULL::uuid AS id,
    NULL::text AS slug,
    NULL::text AS business_name,
    NULL::jsonb AS hero_image,
    NULL::jsonb AS thumbnail_image,
    NULL::jsonb AS gallery_images,
    NULL::numeric(3,2) AS rating_avg,
    NULL::integer AS rating_count,
    NULL::boolean AS is_published,
    NULL::timestamp with time zone AS created_at,
    NULL::text AS bio_en,
    NULL::text AS bio_es,
    NULL::text AS extra_info_en,
    NULL::text AS extra_info_es,
    NULL::text AS city,
    NULL::text AS region,
    NULL::text AS country,
    NULL::double precision AS lat,
    NULL::double precision AS lng,
    NULL::text[] AS categories;


ALTER VIEW public.vendor_public_search OWNER TO postgres;

CREATE VIEW public.vendor_ratings AS
 SELECT vendor_id,
    (COALESCE(round(avg(stars), 2), (0)::numeric))::numeric(4,2) AS rating_avg,
    count(*) AS rating_count
   FROM public.reviews
  GROUP BY vendor_id;


ALTER VIEW public.vendor_ratings OWNER TO postgres;

SELECT pg_catalog.setval('public.categories_id_seq', 46, true);

SELECT pg_catalog.setval('public.vendor_media_id_seq', 1, false);

ALTER TABLE ONLY public.amenity_lookup
    ADD CONSTRAINT amenity_lookup_pkey PRIMARY KEY (key);

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_key_key UNIQUE (key);

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);

ALTER TABLE ONLY public.languages
    ADD CONSTRAINT languages_pkey PRIMARY KEY (code);

ALTER TABLE ONLY public.profile_translated_fields
    ADD CONSTRAINT profile_translated_fields_pkey PRIMARY KEY (profile_id, field, language);

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_unique_author_vendor_rfq UNIQUE (author_id, vendor_id, rfq_id);

ALTER TABLE ONLY public.rfq_invites
    ADD CONSTRAINT rfq_invites_pkey PRIMARY KEY (rfq_id, vendor_id);

ALTER TABLE ONLY public.rfqs
    ADD CONSTRAINT rfqs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (key);

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT unique_author_per_rfq UNIQUE (rfq_id, author_id);

ALTER TABLE ONLY public.vendor_amenities
    ADD CONSTRAINT vendor_amenities_pkey PRIMARY KEY (vendor_id, amenity_key);

ALTER TABLE ONLY public.vendor_categories
    ADD CONSTRAINT vendor_categories_pkey PRIMARY KEY (vendor_id, category_id);

ALTER TABLE ONLY public.vendor_locations
    ADD CONSTRAINT vendor_locations_pkey PRIMARY KEY (vendor_id);

ALTER TABLE ONLY public.vendor_locations
    ADD CONSTRAINT vendor_locations_vendor_id_key UNIQUE (vendor_id);

ALTER TABLE ONLY public.vendor_media
    ADD CONSTRAINT vendor_media_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.vendor_pricing
    ADD CONSTRAINT vendor_pricing_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.vendor_spaces
    ADD CONSTRAINT vendor_spaces_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.vendor_team
    ADD CONSTRAINT vendor_team_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.vendor_availability
    ADD CONSTRAINT vendor_availability_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.vendor_availability
    ADD CONSTRAINT vendor_availability_vendor_id_available_on_key UNIQUE (vendor_id, available_on);

ALTER TABLE ONLY public.vendor_availability
    ADD CONSTRAINT vendor_availability_status_check CHECK ((availability_status = ANY (ARRAY['available'::text, 'busy'::text])));

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_slug_key UNIQUE (slug);

ALTER TABLE ONLY public.profile_translated_fields
    ADD CONSTRAINT profile_translated_fields_language_fkey FOREIGN KEY (language) REFERENCES public.languages(code) ON DELETE CASCADE;

ALTER TABLE ONLY public.profile_translated_fields
    ADD CONSTRAINT profile_translated_fields_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_language_fkey FOREIGN KEY (language) REFERENCES public.languages(code) ON UPDATE CASCADE;

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_rfq_id_fkey FOREIGN KEY (rfq_id) REFERENCES public.rfqs(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_rfq_id_fkey FOREIGN KEY (rfq_id) REFERENCES public.rfqs(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.rfq_invites
    ADD CONSTRAINT rfq_invites_rfq_id_fkey FOREIGN KEY (rfq_id) REFERENCES public.rfqs(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.rfq_invites
    ADD CONSTRAINT rfq_invites_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.rfqs
    ADD CONSTRAINT rfqs_accepted_quote_id_fkey FOREIGN KEY (accepted_quote_id) REFERENCES public.quotes(id);

ALTER TABLE ONLY public.vendor_amenities
    ADD CONSTRAINT vendor_amenities_amenity_key_fkey FOREIGN KEY (amenity_key) REFERENCES public.amenity_lookup(key) ON DELETE CASCADE;

ALTER TABLE ONLY public.vendor_amenities
    ADD CONSTRAINT vendor_amenities_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.vendor_categories
    ADD CONSTRAINT vendor_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.vendor_categories
    ADD CONSTRAINT vendor_categories_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.vendor_locations
    ADD CONSTRAINT vendor_locations_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.vendor_media
    ADD CONSTRAINT vendor_media_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.vendor_pricing
    ADD CONSTRAINT vendor_pricing_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.vendor_spaces
    ADD CONSTRAINT vendor_spaces_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.vendor_team
    ADD CONSTRAINT vendor_team_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.vendor_availability
    ADD CONSTRAINT vendor_availability_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX blog_posts_slug_idx ON public.blog_posts USING btree (slug);

CREATE INDEX idx_vendor_media_vendor_sort ON public.vendor_media USING btree (vendor_id, sort_order);

CREATE UNIQUE INDEX idx_vendor_pricing_vendor_item ON public.vendor_pricing USING btree (vendor_id, item_key);

CREATE INDEX idx_vendor_team_vendor_sort ON public.vendor_team USING btree (vendor_id, sort_order);

CREATE INDEX idx_vendor_availability_vendor_date ON public.vendor_availability USING btree (vendor_id, available_on);

CREATE INDEX notifications_recipient_created_idx ON public.notifications USING btree (recipient_id, created_at DESC);

CREATE INDEX notifications_recipient_unread_idx ON public.notifications USING btree (recipient_id, read_at, created_at DESC);

CREATE INDEX notifications_recipient_deleted_idx ON public.notifications USING btree (recipient_id, deleted_at, created_at DESC);

CREATE INDEX quotes_rfq_id_idx ON public.quotes USING btree (rfq_id);

CREATE INDEX quotes_rfq_vendor_idx ON public.quotes USING btree (rfq_id, vendor_id, version);

CREATE INDEX quotes_vendor_id_idx ON public.quotes USING btree (vendor_id);

CREATE INDEX reviews_author_id_idx ON public.reviews USING btree (author_id);

CREATE INDEX reviews_author_vendor_rfq_idx ON public.reviews USING btree (author_id, vendor_id, rfq_id);

CREATE INDEX reviews_rfq_id_idx ON public.reviews USING btree (rfq_id);

CREATE INDEX reviews_vendor_id_idx ON public.reviews USING btree (vendor_id);

CREATE INDEX rfqs_accepted_quote_id_idx ON public.rfqs USING btree (accepted_quote_id);

CREATE INDEX rfqs_owner_id_idx ON public.rfqs USING btree (owner_id);

CREATE UNIQUE INDEX site_settings_key_idx ON public.site_settings USING btree (key);

CREATE INDEX vendors_name_trgm ON public.vendors USING gin (business_name public.gin_trgm_ops);

CREATE INDEX vendors_owner_id_idx ON public.vendors USING btree (owner_id);

CREATE INDEX vendors_published_idx ON public.vendors USING btree (is_published);

CREATE TRIGGER quotes_set_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER reviews_after_write AFTER INSERT OR DELETE OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.tg_reviews_after_write();

CREATE TRIGGER reviews_set_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER rfq_invites_set_updated_at BEFORE UPDATE ON public.rfq_invites FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER rfqs_set_updated_at BEFORE UPDATE ON public.rfqs FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER trg_profile_translated_fields_updated_at BEFORE UPDATE ON public.profile_translated_fields FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_quotes_touch BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profile_translated_fields ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.rfq_invites ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.vendor_categories ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.vendor_locations ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.vendor_media ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.vendor_availability ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admins to manage blog posts" ON public.blog_posts USING (((auth.role() = 'service_role'::text) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))))) WITH CHECK (((auth.role() = 'service_role'::text) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))));

CREATE POLICY "Allow service role to manage blog posts" ON public.blog_posts USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));

CREATE POLICY "Allow service role to manage site settings" ON public.site_settings USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));

CREATE POLICY "Users manage their own profile translations" ON public.profile_translated_fields USING ((profile_id = auth.uid())) WITH CHECK ((profile_id = auth.uid()));

CREATE POLICY categories_public_read ON public.categories FOR SELECT USING (true);

CREATE POLICY profiles_admin_all ON public.profiles TO authenticated USING ((COALESCE((auth.jwt() ->> 'role'::text), ''::text) = 'admin'::text)) WITH CHECK ((COALESCE((auth.jwt() ->> 'role'::text), ''::text) = 'admin'::text));

CREATE POLICY profiles_self_insert ON public.profiles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = id));

CREATE POLICY profiles_self_select ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = id));

CREATE POLICY profiles_self_update ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));

CREATE POLICY notifications_recipient_delete ON public.notifications FOR DELETE TO authenticated USING (recipient_id = auth.uid());

CREATE POLICY notifications_recipient_insert ON public.notifications FOR INSERT TO authenticated WITH CHECK (((actor_id = auth.uid()) OR (auth.role() = 'service_role'::text)));

CREATE POLICY notifications_recipient_select ON public.notifications FOR SELECT TO authenticated USING (recipient_id = auth.uid());

CREATE POLICY notifications_recipient_update ON public.notifications FOR UPDATE TO authenticated USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());

CREATE POLICY quotes_owner_read ON public.quotes FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.rfqs r
  WHERE ((r.id = quotes.rfq_id) AND (r.owner_id = auth.uid())))));

CREATE POLICY quotes_owner_select ON public.quotes FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.rfqs r
  WHERE ((r.id = quotes.rfq_id) AND (r.owner_id = auth.uid())))));

CREATE POLICY quotes_vendor_crud ON public.quotes USING ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = quotes.vendor_id) AND (v.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = quotes.vendor_id) AND (v.owner_id = auth.uid())))));

CREATE POLICY quotes_vendor_insert ON public.quotes FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = quotes.vendor_id) AND (v.owner_id = auth.uid())))) AND (EXISTS ( SELECT 1
   FROM public.rfqs r
  WHERE ((r.id = quotes.rfq_id) AND (r.accepted_quote_id IS NULL))))));

CREATE POLICY quotes_vendor_read ON public.quotes FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = quotes.vendor_id) AND (v.owner_id = auth.uid())))));

CREATE POLICY quotes_vendor_select ON public.quotes FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = quotes.vendor_id) AND (v.owner_id = auth.uid())))));

CREATE POLICY quotes_vendor_update ON public.quotes FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.vendors v
     JOIN public.rfq_invites i ON ((i.vendor_id = v.id)))
  WHERE ((v.owner_id = auth.uid()) AND (i.rfq_id = quotes.rfq_id) AND (i.vendor_id = quotes.vendor_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.vendors v
     JOIN public.rfq_invites i ON ((i.vendor_id = v.id)))
  WHERE ((v.owner_id = auth.uid()) AND (i.rfq_id = quotes.rfq_id) AND (i.vendor_id = quotes.vendor_id)))));

CREATE POLICY reviews_delete_author ON public.reviews FOR DELETE USING ((author_id = auth.uid()));

CREATE POLICY reviews_delete_owner_7d ON public.reviews FOR DELETE USING (((auth.uid() = author_id) AND public.is_user(auth.uid()) AND ((now() - created_at) <= '7 days'::interval)));

CREATE POLICY reviews_insert_if_hired ON public.reviews FOR INSERT WITH CHECK (((auth.uid() = author_id) AND public.is_user(auth.uid()) AND public.can_user_review(auth.uid(), vendor_id, rfq_id) AND (NOT public.has_user_reviewed(auth.uid(), vendor_id, rfq_id))));

CREATE POLICY reviews_insert_owner_post_hire ON public.reviews FOR INSERT WITH CHECK (((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM (public.rfqs r
     JOIN public.quotes q ON ((q.id = r.accepted_quote_id)))
  WHERE ((r.id = q.rfq_id) AND (r.owner_id = auth.uid()) AND (q.vendor_id = q.vendor_id))))));

CREATE POLICY reviews_read_all ON public.reviews FOR SELECT USING (true);

CREATE POLICY reviews_select_all ON public.reviews FOR SELECT USING (true);

CREATE POLICY reviews_update_author ON public.reviews FOR UPDATE USING ((author_id = auth.uid()));

CREATE POLICY reviews_update_owner_7d ON public.reviews FOR UPDATE USING (((auth.uid() = author_id) AND public.is_user(auth.uid()) AND ((now() - created_at) <= '7 days'::interval))) WITH CHECK (((auth.uid() = author_id) AND public.is_user(auth.uid()) AND ((now() - created_at) <= '7 days'::interval)));

CREATE POLICY rfq_invites_owner_insert ON public.rfq_invites FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.rfqs r
  WHERE ((r.id = rfq_invites.rfq_id) AND (r.owner_id = auth.uid())))));

CREATE POLICY rfq_invites_owner_read ON public.rfq_invites FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.rfqs r
  WHERE ((r.id = rfq_invites.rfq_id) AND (r.owner_id = auth.uid())))));

CREATE POLICY rfq_invites_owner_update ON public.rfq_invites FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.rfqs r
  WHERE ((r.id = rfq_invites.rfq_id) AND (r.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.rfqs r
  WHERE ((r.id = rfq_invites.rfq_id) AND (r.owner_id = auth.uid())))));

CREATE POLICY rfq_invites_vendor_read ON public.rfq_invites FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = rfq_invites.vendor_id) AND (v.owner_id = auth.uid())))));

CREATE POLICY rfq_invites_vendor_update ON public.rfq_invites FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = rfq_invites.vendor_id) AND (v.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = rfq_invites.vendor_id) AND (v.owner_id = auth.uid())))));

CREATE POLICY rfqs_owner_delete ON public.rfqs FOR DELETE USING (((owner_id = auth.uid()) AND public.is_user(auth.uid())));

CREATE POLICY rfqs_owner_insert ON public.rfqs FOR INSERT WITH CHECK (((owner_id = auth.uid()) AND public.is_user(auth.uid())));

CREATE POLICY rfqs_owner_select ON public.rfqs FOR SELECT USING ((owner_id = auth.uid()));

CREATE POLICY rfqs_owner_update ON public.rfqs FOR UPDATE USING (((owner_id = auth.uid()) AND public.is_user(auth.uid()))) WITH CHECK (((owner_id = auth.uid()) AND public.is_user(auth.uid())));

CREATE POLICY rfqs_vendor_select ON public.rfqs FOR SELECT USING (public.can_vendor_view_rfq(auth.uid(), id));

CREATE POLICY vendor_categories_admin_all ON public.vendor_categories USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text)))));

CREATE POLICY vendor_categories_auth_read_published ON public.vendor_categories FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = vendor_categories.vendor_id) AND (v.is_published = true)))));

CREATE POLICY vendor_categories_owner_all ON public.vendor_categories TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = vendor_categories.vendor_id) AND (v.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = vendor_categories.vendor_id) AND (v.owner_id = auth.uid())))));

CREATE POLICY vendor_categories_owner_crud ON public.vendor_categories USING ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = vendor_categories.vendor_id) AND (v.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = vendor_categories.vendor_id) AND (v.owner_id = auth.uid())))));

CREATE POLICY vendor_categories_public_read ON public.vendor_categories FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = vendor_categories.vendor_id) AND (v.is_published = true)))));

CREATE POLICY vendor_categories_public_read_published ON public.vendor_categories FOR SELECT TO anon USING ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = vendor_categories.vendor_id) AND (v.is_published = true)))));

CREATE POLICY vendor_locations_admin_all ON public.vendor_locations USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text)))));

CREATE POLICY vendor_locations_auth_read_published ON public.vendor_locations FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = vendor_locations.vendor_id) AND (v.is_published = true)))));

CREATE POLICY vendor_locations_owner_all ON public.vendor_locations TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = vendor_locations.vendor_id) AND (v.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = vendor_locations.vendor_id) AND (v.owner_id = auth.uid())))));

CREATE POLICY vendor_locations_owner_crud ON public.vendor_locations USING ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = vendor_locations.vendor_id) AND (v.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = vendor_locations.vendor_id) AND (v.owner_id = auth.uid())))));

CREATE POLICY vendor_locations_public_read ON public.vendor_locations FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = vendor_locations.vendor_id) AND (v.is_published = true)))));

CREATE POLICY vendor_locations_public_read_published ON public.vendor_locations FOR SELECT TO anon USING ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = vendor_locations.vendor_id) AND (v.is_published = true)))));

CREATE POLICY vendor_media_admin_all ON public.vendor_media USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text)))));

CREATE POLICY vendor_media_owner_crud ON public.vendor_media USING ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = vendor_media.vendor_id) AND (v.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = vendor_media.vendor_id) AND (v.owner_id = auth.uid())))));

CREATE POLICY vendor_media_public_read ON public.vendor_media FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = vendor_media.vendor_id) AND (v.is_published = true)))));

CREATE POLICY vendor_availability_owner_crud ON public.vendor_availability USING ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = vendor_availability.vendor_id) AND (v.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = vendor_availability.vendor_id) AND (v.owner_id = auth.uid())))));

CREATE POLICY vendor_availability_public_read ON public.vendor_availability FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = vendor_availability.vendor_id) AND (v.is_published = true)))));

GRANT SELECT ON TABLE public.vendor_availability TO anon;
GRANT SELECT, INSERT, DELETE, UPDATE ON TABLE public.vendor_availability TO authenticated;

CREATE POLICY vendors_admin_all ON public.vendors USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text)))));

CREATE POLICY vendors_auth_read_published ON public.vendors FOR SELECT TO authenticated USING ((is_published = true));

CREATE POLICY vendors_owner_all ON public.vendors TO authenticated USING ((auth.uid() = owner_id)) WITH CHECK ((auth.uid() = owner_id));

CREATE POLICY vendors_owner_crud ON public.vendors USING ((auth.uid() = owner_id)) WITH CHECK ((auth.uid() = owner_id));

CREATE POLICY vendors_owner_cud ON public.vendors USING ((owner_id = auth.uid())) WITH CHECK ((owner_id = auth.uid()));

CREATE POLICY vendors_public_read ON public.vendors FOR SELECT USING ((is_published = true));

CREATE POLICY vendors_public_read_published ON public.vendors FOR SELECT TO anon USING ((is_published = true));

CREATE POLICY vendors_read_all ON public.vendors FOR SELECT USING (true);
