-- One transaction; the recovered baseline is recorded, not executed over live data.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations(version text PRIMARY KEY, statements text[], name text);
ALTER TABLE supabase_migrations.schema_migrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON SCHEMA supabase_migrations FROM PUBLIC,anon,authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA supabase_migrations FROM PUBLIC,anon,authenticated;
INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES ('202610190000','live_schema_baseline',ARRAY[$wm_17ad9fd094fe$-- Recovered schema-only baseline from production catalogs, 2026-10-19.
-- Existing production: record as applied; never execute this baseline over live tables.
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

CREATE TYPE public."rfq_invite_status" AS ENUM ('invited','viewed','responded','declined','expired','accepted');

CREATE SEQUENCE public."vendor_media_id_seq";

CREATE SEQUENCE public."categories_id_seq";

CREATE TABLE public."amenity_lookup"(
  "key" text NOT NULL,
  "group_key" text NOT NULL,
  "label" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."blog_posts"(
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "slug" text NOT NULL,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "excerpt" text,
  "hero_image_url" text,
  "body" text,
  "published_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."categories"(
  "id" bigint DEFAULT nextval('categories_id_seq'::regclass) NOT NULL,
  "key" text NOT NULL,
  "label" jsonb NOT NULL,
  "slug" text
);

CREATE TABLE public."languages"(
  "code" text NOT NULL,
  "name" text NOT NULL,
  "is_default" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."notifications"(
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "recipient_id" uuid NOT NULL,
  "actor_id" uuid,
  "type" text NOT NULL,
  "title" text NOT NULL,
  "body" text,
  "data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "read_at" timestamp with time zone,
  "email_status" text DEFAULT 'pending'::text NOT NULL,
  "email_sent_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);

CREATE TABLE public."profile_translated_fields"(
  "profile_id" uuid NOT NULL,
  "field" text NOT NULL,
  "language" text NOT NULL,
  "value" text NOT NULL,
  "translated_via" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."profiles"(
  "id" uuid NOT NULL,
  "full_name" text,
  "role" text DEFAULT 'user'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "phone" text,
  "country" text,
  "tentative_wedding_date" date,
  "guest_count" integer,
  "wedding_budget" numeric,
  "wedding_theme" text,
  "language" text DEFAULT 'en'::text NOT NULL
);

CREATE TABLE public."quote_messages"(
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "quote_id" uuid NOT NULL,
  "sender_id" uuid NOT NULL,
  "sender_role" text NOT NULL,
  "body" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."quotes"(
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "rfq_id" uuid NOT NULL,
  "vendor_id" uuid NOT NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "amount_cents" integer,
  "currency" text DEFAULT 'USD'::text,
  "message" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."reviews"(
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "rfq_id" uuid NOT NULL,
  "vendor_id" uuid NOT NULL,
  "author_id" uuid NOT NULL,
  "stars" smallint NOT NULL,
  "title" text,
  "body" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."rfq_invites"(
  "rfq_id" uuid NOT NULL,
  "vendor_id" uuid NOT NULL,
  "status" rfq_invite_status DEFAULT 'invited'::rfq_invite_status NOT NULL,
  "expires_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "reveal_email" boolean DEFAULT false NOT NULL,
  "reveal_phone" boolean DEFAULT false NOT NULL,
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "viewed_at" timestamp with time zone,
  "last_activity_at" timestamp with time zone DEFAULT now(),
  "closed_at" timestamp with time zone,
  "closed_reason" text,
  "client_last_read_at" timestamp with time zone,
  "vendor_last_read_at" timestamp with time zone
);

CREATE TABLE public."rfqs"(
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "event_date" date,
  "guest_count" integer,
  "budget_min" integer,
  "budget_max" integer,
  "city" text,
  "state" text,
  "country" text,
  "language" text,
  "theme" text,
  "notes" text,
  "accepted_quote_id" uuid,
  "accepted_at" timestamp with time zone,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "contact_email" text,
  "contact_phone" text,
  "flexible_date" boolean DEFAULT false,
  "guest_count_range" text,
  "guest_first_name" text,
  "guest_last_name" text,
  "guest_lead_email" text,
  "guest_phone" text,
  "vendor_id" uuid
);

CREATE TABLE public."site_settings"(
  "key" text NOT NULL,
  "value" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."user_push_tokens"(
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "token" text NOT NULL,
  "platform" text NOT NULL,
  "device_id" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."vendor_amenities"(
  "vendor_id" uuid NOT NULL,
  "amenity_key" text NOT NULL
);

CREATE TABLE public."vendor_availability"(
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "vendor_id" uuid NOT NULL,
  "available_on" date NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "availability_status" text DEFAULT 'available'::text NOT NULL
);

CREATE TABLE public."vendor_categories"(
  "vendor_id" uuid NOT NULL,
  "category_id" bigint NOT NULL
);

CREATE TABLE public."vendor_locations"(
  "vendor_id" uuid NOT NULL,
  "country" text,
  "region" text,
  "city" text,
  "lat" double precision,
  "lng" double precision,
  "address" text,
  "state" text,
  "service_radius_km" integer DEFAULT 50 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."vendor_media"(
  "id" bigint DEFAULT nextval('vendor_media_id_seq'::regclass) NOT NULL,
  "vendor_id" uuid NOT NULL,
  "kind" text NOT NULL,
  "url" text NOT NULL,
  "is_cover" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "caption" jsonb DEFAULT '{}'::jsonb,
  "sort_order" integer DEFAULT 0,
  "media_type" text
);

CREATE TABLE public."vendor_pricing"(
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "vendor_id" uuid NOT NULL,
  "item_key" text NOT NULL,
  "price_cents" bigint,
  "currency" text DEFAULT 'USD'::text,
  "contact_for_price" boolean DEFAULT false NOT NULL,
  "notes" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."vendor_spaces"(
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "vendor_id" uuid NOT NULL,
  "name" jsonb NOT NULL,
  "description" jsonb DEFAULT '{}'::jsonb,
  "capacity_min" integer,
  "capacity_max" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."vendor_team"(
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "vendor_id" uuid NOT NULL,
  "name" text NOT NULL,
  "title" jsonb DEFAULT '{}'::jsonb,
  "bio" jsonb DEFAULT '{}'::jsonb,
  "headshot_url" text,
  "responds_within_hours" integer,
  "sort_order" integer DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."vendors"(
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" uuid NOT NULL,
  "slug" text NOT NULL,
  "business_name" text NOT NULL,
  "bio" jsonb DEFAULT '{}'::jsonb,
  "rating_avg" numeric(3,2) DEFAULT 0,
  "rating_count" integer DEFAULT 0,
  "is_published" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "hero_image" jsonb DEFAULT '{}'::jsonb,
  "thumbnail_image" jsonb DEFAULT '{}'::jsonb,
  "gallery_images" jsonb DEFAULT '[]'::jsonb,
  "extra_info" jsonb DEFAULT '{}'::jsonb,
  "address_label" text,
  "map_url" text,
  "phone" text,
  "website_url" text,
  "logo_url" text,
  "starting_price_cents" bigint,
  "starting_price_currency" text DEFAULT 'USD'::text,
  "capacity_max" integer,
  "event_types" text[] DEFAULT '{}'::text[],
  "years_in_business" integer,
  "languages" text[] DEFAULT '{}'::text[],
  "team_size_range" text,
  "pricing_typical_spend_cents" bigint,
  "pricing_typical_spend_currency" text DEFAULT 'USD'::text,
  "pricing_peak_seasons" text[] DEFAULT '{}'::text[],
  "review_ai_summary" text,
  "carousel_logo_url" text
);

ALTER TABLE public."blog_posts" ADD CONSTRAINT "blog_posts_pkey" PRIMARY KEY (id);

ALTER TABLE public."blog_posts" ADD CONSTRAINT "blog_posts_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text])));

ALTER TABLE public."categories" ADD CONSTRAINT "categories_key_key" UNIQUE (key);

ALTER TABLE public."categories" ADD CONSTRAINT "categories_pkey" PRIMARY KEY (id);

ALTER TABLE public."categories" ADD CONSTRAINT "categories_slug_key" UNIQUE (slug);



ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_pkey" PRIMARY KEY (id);

ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_role_check" CHECK ((role = ANY (ARRAY['user'::text, 'vendor'::text, 'admin'::text])));

ALTER TABLE public."quote_messages" ADD CONSTRAINT "quote_messages_pkey" PRIMARY KEY (id);



ALTER TABLE public."quote_messages" ADD CONSTRAINT "quote_messages_sender_role_check" CHECK ((sender_role = ANY (ARRAY['client'::text, 'vendor'::text])));


ALTER TABLE public."vendor_amenities" ADD CONSTRAINT "vendor_amenities_pkey" PRIMARY KEY (vendor_id, amenity_key);


ALTER TABLE public."vendor_availability" ADD CONSTRAINT "vendor_availability_pkey" PRIMARY KEY (id);

ALTER TABLE public."vendor_availability" ADD CONSTRAINT "vendor_availability_status_check" CHECK ((availability_status = ANY (ARRAY['available'::text, 'busy'::text])));

ALTER TABLE public."vendor_availability" ADD CONSTRAINT "vendor_availability_vendor_id_available_on_key" UNIQUE (vendor_id, available_on);



ALTER TABLE public."rfqs" ADD CONSTRAINT "rfqs_pkey" PRIMARY KEY (id);

ALTER TABLE public."site_settings" ADD CONSTRAINT "site_settings_pkey" PRIMARY KEY (key);

ALTER TABLE public."profile_translated_fields" ADD CONSTRAINT "profile_translated_fields_field_check" CHECK ((field ~ '^[a-z0-9_]+$'::text));


ALTER TABLE public."profile_translated_fields" ADD CONSTRAINT "profile_translated_fields_pkey" PRIMARY KEY (profile_id, field, language);


ALTER TABLE public."amenity_lookup" ADD CONSTRAINT "amenity_lookup_pkey" PRIMARY KEY (key);


ALTER TABLE public."vendor_categories" ADD CONSTRAINT "vendor_categories_pkey" PRIMARY KEY (vendor_id, category_id);


ALTER TABLE public."languages" ADD CONSTRAINT "languages_pkey" PRIMARY KEY (code);

ALTER TABLE public."quotes" ADD CONSTRAINT "quotes_pkey" PRIMARY KEY (id);




ALTER TABLE public."reviews" ADD CONSTRAINT "reviews_pkey" PRIMARY KEY (id);


ALTER TABLE public."reviews" ADD CONSTRAINT "reviews_stars_check" CHECK (((stars >= 1) AND (stars <= 5)));

ALTER TABLE public."reviews" ADD CONSTRAINT "reviews_unique_author_vendor_rfq" UNIQUE (author_id, vendor_id, rfq_id);


ALTER TABLE public."reviews" ADD CONSTRAINT "unique_author_per_rfq" UNIQUE (rfq_id, author_id);

ALTER TABLE public."rfq_invites" ADD CONSTRAINT "rfq_invites_pkey" PRIMARY KEY (rfq_id, vendor_id);



ALTER TABLE public."vendor_locations" ADD CONSTRAINT "vendor_locations_pkey" PRIMARY KEY (vendor_id);

ALTER TABLE public."vendor_locations" ADD CONSTRAINT "vendor_locations_radius_chk" CHECK (((service_radius_km >= 1) AND (service_radius_km <= 500)));


ALTER TABLE public."vendor_locations" ADD CONSTRAINT "vendor_locations_vendor_id_key" UNIQUE (vendor_id);

ALTER TABLE public."vendor_media" ADD CONSTRAINT "vendor_media_kind_check" CHECK ((kind = ANY (ARRAY['image'::text, 'video'::text])));

ALTER TABLE public."vendor_media" ADD CONSTRAINT "vendor_media_pkey" PRIMARY KEY (id);


ALTER TABLE public."vendor_pricing" ADD CONSTRAINT "vendor_pricing_pkey" PRIMARY KEY (id);


ALTER TABLE public."vendor_spaces" ADD CONSTRAINT "vendor_spaces_pkey" PRIMARY KEY (id);


ALTER TABLE public."vendor_team" ADD CONSTRAINT "vendor_team_pkey" PRIMARY KEY (id);



ALTER TABLE public."vendors" ADD CONSTRAINT "vendors_pkey" PRIMARY KEY (id);

ALTER TABLE public."vendors" ADD CONSTRAINT "vendors_slug_key" UNIQUE (slug);


ALTER TABLE public."notifications" ADD CONSTRAINT "notifications_email_status_check" CHECK ((email_status = ANY (ARRAY['pending'::text, 'queued'::text, 'sent'::text, 'failed'::text, 'skipped'::text])));

ALTER TABLE public."notifications" ADD CONSTRAINT "notifications_pkey" PRIMARY KEY (id);


ALTER TABLE public."notifications" ADD CONSTRAINT "notifications_type_check" CHECK ((type = ANY (ARRAY['quote_answered'::text, 'vendor_new_request'::text, 'vendor_quote_accepted'::text, 'thread_reply'::text])));

ALTER TABLE public."user_push_tokens" ADD CONSTRAINT "user_push_tokens_pkey" PRIMARY KEY (id);

ALTER TABLE public."user_push_tokens" ADD CONSTRAINT "user_push_tokens_platform_check" CHECK ((platform = ANY (ARRAY['ios'::text, 'android'::text, 'web'::text, 'unknown'::text])));

ALTER TABLE public."user_push_tokens" ADD CONSTRAINT "user_push_tokens_token_key" UNIQUE (token);


ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_language_fkey" FOREIGN KEY (language) REFERENCES languages(code) ON UPDATE CASCADE;
ALTER TABLE public."quote_messages" ADD CONSTRAINT "quote_messages_quote_id_fkey" FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE;
ALTER TABLE public."quote_messages" ADD CONSTRAINT "quote_messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public."vendor_amenities" ADD CONSTRAINT "vendor_amenities_amenity_key_fkey" FOREIGN KEY (amenity_key) REFERENCES amenity_lookup(key) ON DELETE CASCADE;
ALTER TABLE public."vendor_amenities" ADD CONSTRAINT "vendor_amenities_vendor_id_fkey" FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;
ALTER TABLE public."vendor_availability" ADD CONSTRAINT "vendor_availability_vendor_id_fkey" FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;
ALTER TABLE public."rfqs" ADD CONSTRAINT "rfqs_accepted_quote_id_fkey" FOREIGN KEY (accepted_quote_id) REFERENCES quotes(id);
ALTER TABLE public."profile_translated_fields" ADD CONSTRAINT "profile_translated_fields_language_fkey" FOREIGN KEY (language) REFERENCES languages(code) ON DELETE CASCADE;
ALTER TABLE public."profile_translated_fields" ADD CONSTRAINT "profile_translated_fields_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public."vendor_categories" ADD CONSTRAINT "vendor_categories_category_id_fkey" FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;
ALTER TABLE public."vendor_categories" ADD CONSTRAINT "vendor_categories_vendor_id_fkey" FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;
ALTER TABLE public."quotes" ADD CONSTRAINT "quotes_rfq_id_fkey" FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE CASCADE;
ALTER TABLE public."quotes" ADD CONSTRAINT "quotes_vendor_id_fkey" FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;
ALTER TABLE public."reviews" ADD CONSTRAINT "reviews_author_id_fkey" FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."reviews" ADD CONSTRAINT "reviews_rfq_id_fkey" FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE CASCADE;
ALTER TABLE public."reviews" ADD CONSTRAINT "reviews_vendor_id_fkey" FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;
ALTER TABLE public."rfq_invites" ADD CONSTRAINT "rfq_invites_rfq_id_fkey" FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE CASCADE;
ALTER TABLE public."rfq_invites" ADD CONSTRAINT "rfq_invites_vendor_id_fkey" FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;
ALTER TABLE public."vendor_locations" ADD CONSTRAINT "vendor_locations_vendor_id_fkey" FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;
ALTER TABLE public."vendor_media" ADD CONSTRAINT "vendor_media_vendor_id_fkey" FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;
ALTER TABLE public."vendor_pricing" ADD CONSTRAINT "vendor_pricing_vendor_id_fkey" FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;
ALTER TABLE public."vendor_spaces" ADD CONSTRAINT "vendor_spaces_vendor_id_fkey" FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;
ALTER TABLE public."vendor_team" ADD CONSTRAINT "vendor_team_vendor_id_fkey" FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;
ALTER TABLE public."vendors" ADD CONSTRAINT "vendors_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public."notifications" ADD CONSTRAINT "notifications_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public."notifications" ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY (recipient_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public."user_push_tokens" ADD CONSTRAINT "user_push_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

CREATE VIEW public."profiles_resolved" AS  SELECT id AS user_id,
    role
   FROM profiles;

CREATE VIEW public."reviews_public" AS  SELECT id,
    vendor_id,
    rfq_id,
        CASE
            WHEN author_id = auth.uid() THEN author_id
            ELSE NULL::uuid
        END AS rater_user_id,
    stars AS rating,
    title,
    body,
    created_at
   FROM reviews r;

CREATE VIEW public."vendor_latest_quotes" AS  SELECT DISTINCT ON (rfq_id, vendor_id) id,
    rfq_id,
    vendor_id,
    version,
    amount_cents,
    currency,
    message,
    created_at,
    updated_at
   FROM quotes q
  ORDER BY rfq_id, vendor_id, version DESC;

CREATE VIEW public."vendor_profile_view" AS  SELECT v.id,
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
           FROM vendor_media m
          WHERE m.vendor_id = v.id), '[]'::json) AS media,
    COALESCE(( SELECT json_agg(json_build_object('id', s.id, 'name', s.name, 'description', s.description, 'capacity_min', s.capacity_min, 'capacity_max', s.capacity_max) ORDER BY s.created_at) AS json_agg
           FROM vendor_spaces s
          WHERE s.vendor_id = v.id), '[]'::json) AS spaces,
    COALESCE(( SELECT json_agg(json_build_object('item_key', p.item_key, 'price_cents', p.price_cents, 'currency', p.currency, 'contact_for_price', p.contact_for_price, 'notes', p.notes) ORDER BY p.created_at) AS json_agg
           FROM vendor_pricing p
          WHERE p.vendor_id = v.id), '[]'::json) AS pricing,
    COALESCE(( SELECT json_agg(json_build_object('key', al.key, 'group', al.group_key, 'label', al.label) ORDER BY al.group_key, al.key) AS json_agg
           FROM vendor_amenities va
             JOIN amenity_lookup al ON al.key = va.amenity_key
          WHERE va.vendor_id = v.id), '[]'::json) AS amenity_items,
    COALESCE(( SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'title', t.title, 'bio', t.bio, 'headshot_url', t.headshot_url, 'responds_within_hours', t.responds_within_hours, 'sort', t.sort_order) ORDER BY t.sort_order, t.created_at) AS json_agg
           FROM vendor_team t
          WHERE t.vendor_id = v.id), '[]'::json) AS team,
    COALESCE(( SELECT json_agg(json_build_object('id', c.id, 'slug', c.slug, 'label', c.label)) AS json_agg
           FROM vendor_categories vc
             JOIN categories c ON c.id = vc.category_id
          WHERE vc.vendor_id = v.id), '[]'::json) AS categories,
    COALESCE(( SELECT json_agg(json_build_object('id', a.id, 'available_on', a.available_on, 'availability_status', a.availability_status) ORDER BY a.available_on) AS json_agg
           FROM vendor_availability a
          WHERE a.vendor_id = v.id), '[]'::json) AS availability_dates
   FROM vendors v
     LEFT JOIN vendor_locations vl ON vl.vendor_id = v.id
  WHERE COALESCE(v.is_published, false) = true;

CREATE VIEW public."vendor_public_search" AS  SELECT v.id,
    v.slug,
    v.business_name,
    v.hero_image,
    v.thumbnail_image,
    v.gallery_images,
    v.rating_avg,
    v.rating_count,
    v.is_published,
    v.created_at,
    v.bio ->> 'en'::text AS bio_en,
    v.bio ->> 'es'::text AS bio_es,
    v.extra_info ->> 'en'::text AS extra_info_en,
    v.extra_info ->> 'es'::text AS extra_info_es,
    vl.city,
    vl.region,
    vl.country,
    vl.lat,
    vl.lng,
    COALESCE(array_agg(c.key ORDER BY c.key) FILTER (WHERE c.key IS NOT NULL), '{}'::text[]) AS categories
   FROM vendors v
     LEFT JOIN vendor_locations vl ON vl.vendor_id = v.id
     LEFT JOIN vendor_categories vc ON vc.vendor_id = v.id
     LEFT JOIN categories c ON c.id = vc.category_id
  WHERE COALESCE(v.is_published, false) = true
  GROUP BY v.id, vl.city, vl.region, vl.country, vl.lat, vl.lng;

CREATE VIEW public."vendor_ratings" AS  SELECT vendor_id,
    COALESCE(round(avg(stars), 2), 0::numeric)::numeric(4,2) AS rating_avg,
    count(*) AS rating_count
   FROM reviews
  GROUP BY vendor_id;

CREATE OR REPLACE FUNCTION public.is_user(_uid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  select exists(
    select 1 from public.profiles_resolved p
    where p.user_id = _uid and p.role = 'user'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_vendor(_uid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  -- Either explicitly marked vendor OR owns a vendor row
  select exists(
    select 1 from public.profiles_resolved p
    where p.user_id = _uid and p.role = 'vendor'
  )
  or exists(
    select 1 from public.vendors v
    where v.owner_id = _uid
  );
$function$
;

CREATE OR REPLACE FUNCTION public.touch_rfq_invite_activity_from_message()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
  target_rfq_id uuid;
  target_vendor_id uuid;
begin
  select q.rfq_id, q.vendor_id
    into target_rfq_id, target_vendor_id
  from public.quotes q
  where q.id = new.quote_id;

  if target_rfq_id is not null and target_vendor_id is not null then
    update public.rfq_invites
    set last_activity_at = coalesce(new.created_at, now())
    where rfq_id = target_rfq_id
      and vendor_id = target_vendor_id;
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.touch_rfq_invite_activity_from_quote()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  update public.rfq_invites
  set last_activity_at = coalesce(new.created_at, now())
  where rfq_id = new.rfq_id
    and vendor_id = new.vendor_id;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.can_user_review(_uid uuid, _vendor_id uuid, _rfq_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  select exists(
    select 1
    from public.rfqs r
    join public.quotes q on q.id = r.accepted_quote_id
    where r.id = _rfq_id
      and q.vendor_id = _vendor_id
      and r.owner_id  = _uid
      and r.accepted_quote_id is not null
  );
$function$
;

CREATE OR REPLACE FUNCTION public.tg_reviews_after_write()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  perform public.recalc_vendor_rating(coalesce(new.vendor_id, old.vendor_id));
  return null;
end$function$
;

CREATE OR REPLACE FUNCTION public.recalc_vendor_rating(p_vendor_id uuid)
 RETURNS void
 LANGUAGE sql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.upsert_profile_translation(p_profile_id uuid, p_field text, p_language text, p_value text, p_translated_via text DEFAULT NULL::text)
 RETURNS profile_translated_fields
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at := now();
  return new;
end$function$
;

CREATE OR REPLACE FUNCTION public.user_hired_vendor(_uid uuid, _vendor_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  select exists(
    select 1
    from public.rfqs r
    join public.quotes q on q.id = r.accepted_quote_id
    where q.vendor_id = _vendor_id
      and r.owner_id  = _uid
      and r.accepted_quote_id is not null
  );
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.can_vendor_view_rfq(_uid uuid, _rfq_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.first_eligible_review_rfq(_uid uuid, _vendor_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.has_user_reviewed(_uid uuid, _vendor_id uuid, _rfq_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  select exists(
    select 1
    from public.reviews v
    where v.author_id = _uid
      and v.vendor_id = _vendor_id
      and v.rfq_id    = _rfq_id
  );
$function$
;

CREATE OR REPLACE FUNCTION public.profile_field_translation(p_profile_id uuid, p_field text, p_language text, p_fallback_language text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE sql
AS $function$
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
$function$
;

CREATE TRIGGER quote_messages_touch_rfq_invite_activity AFTER INSERT ON quote_messages FOR EACH ROW EXECUTE FUNCTION touch_rfq_invite_activity_from_message();

CREATE TRIGGER quotes_set_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();

CREATE TRIGGER quotes_touch_rfq_invite_activity AFTER INSERT ON quotes FOR EACH ROW EXECUTE FUNCTION touch_rfq_invite_activity_from_quote();

CREATE TRIGGER reviews_after_write AFTER INSERT OR DELETE OR UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION tg_reviews_after_write();

CREATE TRIGGER reviews_set_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();

CREATE TRIGGER rfq_invites_set_updated_at BEFORE UPDATE ON rfq_invites FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();

CREATE TRIGGER rfqs_set_updated_at BEFORE UPDATE ON rfqs FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();

CREATE TRIGGER set_timestamp BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER trg_profile_translated_fields_updated_at BEFORE UPDATE ON profile_translated_fields FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER trg_quotes_touch BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE UNIQUE INDEX blog_posts_slug_idx ON public.blog_posts USING btree (slug);

CREATE INDEX quote_messages_quote_created_idx ON public.quote_messages USING btree (quote_id, created_at);

CREATE INDEX quote_messages_quote_id_created_at_idx ON public.quote_messages USING btree (quote_id, created_at);

CREATE INDEX idx_vendor_availability_vendor_date ON public.vendor_availability USING btree (vendor_id, available_on);

CREATE INDEX rfqs_accepted_quote_id_idx ON public.rfqs USING btree (accepted_quote_id);

CREATE INDEX rfqs_owner_id_idx ON public.rfqs USING btree (owner_id);

CREATE UNIQUE INDEX site_settings_key_idx ON public.site_settings USING btree (key);

CREATE INDEX quotes_rfq_id_idx ON public.quotes USING btree (rfq_id);

CREATE INDEX quotes_rfq_vendor_idx ON public.quotes USING btree (rfq_id, vendor_id, version);

CREATE INDEX quotes_vendor_id_idx ON public.quotes USING btree (vendor_id);

CREATE INDEX reviews_author_id_idx ON public.reviews USING btree (author_id);

CREATE INDEX reviews_author_vendor_rfq_idx ON public.reviews USING btree (author_id, vendor_id, rfq_id);

CREATE INDEX reviews_rfq_id_idx ON public.reviews USING btree (rfq_id);

CREATE INDEX reviews_vendor_id_idx ON public.reviews USING btree (vendor_id);

CREATE UNIQUE INDEX rfq_invites_id_idx ON public.rfq_invites USING btree (id);

CREATE INDEX rfq_invites_rfq_last_activity_idx ON public.rfq_invites USING btree (rfq_id, last_activity_at DESC);

CREATE INDEX rfq_invites_vendor_last_activity_idx ON public.rfq_invites USING btree (vendor_id, last_activity_at DESC);

CREATE INDEX idx_vendor_media_vendor_sort ON public.vendor_media USING btree (vendor_id, sort_order);

CREATE UNIQUE INDEX idx_vendor_pricing_vendor_item ON public.vendor_pricing USING btree (vendor_id, item_key);

CREATE INDEX idx_vendor_team_vendor_sort ON public.vendor_team USING btree (vendor_id, sort_order);

CREATE INDEX vendors_name_trgm ON public.vendors USING gin (business_name gin_trgm_ops);

CREATE INDEX vendors_owner_id_idx ON public.vendors USING btree (owner_id);

CREATE INDEX vendors_published_idx ON public.vendors USING btree (is_published);

CREATE INDEX notifications_recipient_created_idx ON public.notifications USING btree (recipient_id, created_at DESC);

CREATE INDEX notifications_recipient_deleted_idx ON public.notifications USING btree (recipient_id, deleted_at, created_at DESC);

CREATE INDEX notifications_recipient_unread_idx ON public.notifications USING btree (recipient_id, read_at, created_at DESC);

CREATE INDEX user_push_tokens_user_active_idx ON public.user_push_tokens USING btree (user_id, is_active, last_seen_at DESC);

ALTER TABLE public."blog_posts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."categories" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."notifications" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."profile_translated_fields" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."profiles" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."quote_messages" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."quotes" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."reviews" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."rfq_invites" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."rfqs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."site_settings" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."user_push_tokens" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."vendor_availability" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."vendor_categories" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."vendor_locations" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."vendor_media" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."vendors" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admins to manage blog posts" ON public."blog_posts" AS PERMISSIVE FOR ALL TO "public" USING (((auth.role() = 'service_role'::text) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))))) WITH CHECK (((auth.role() = 'service_role'::text) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))));

CREATE POLICY "Allow service role to manage blog posts" ON public."blog_posts" AS PERMISSIVE FOR ALL TO "public" USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));

CREATE POLICY "categories_public_read" ON public."categories" AS PERMISSIVE FOR SELECT TO "public" USING (true);

CREATE POLICY "notifications_recipient_delete" ON public."notifications" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((recipient_id = auth.uid()));

CREATE POLICY "notifications_recipient_insert" ON public."notifications" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((actor_id = auth.uid()) OR (auth.role() = 'service_role'::text)));

CREATE POLICY "notifications_recipient_select" ON public."notifications" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((recipient_id = auth.uid()));

CREATE POLICY "notifications_recipient_update" ON public."notifications" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((recipient_id = auth.uid())) WITH CHECK ((recipient_id = auth.uid()));

CREATE POLICY "Users manage their own profile translations" ON public."profile_translated_fields" AS PERMISSIVE FOR ALL TO "public" USING ((profile_id = auth.uid())) WITH CHECK ((profile_id = auth.uid()));

CREATE POLICY "profiles_admin_all" ON public."profiles" AS PERMISSIVE FOR ALL TO "authenticated" USING ((COALESCE((auth.jwt() ->> 'role'::text), ''::text) = 'admin'::text)) WITH CHECK ((COALESCE((auth.jwt() ->> 'role'::text), ''::text) = 'admin'::text));

CREATE POLICY "profiles_self_insert" ON public."profiles" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((auth.uid() = id));

CREATE POLICY "profiles_self_select" ON public."profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((auth.uid() = id));

CREATE POLICY "profiles_self_update" ON public."profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));

CREATE POLICY "quote_messages_client_insert" ON public."quote_messages" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((sender_id = auth.uid()) AND (sender_role = 'client'::text) AND (EXISTS ( SELECT 1
   FROM (quotes q
     JOIN rfqs r ON ((r.id = q.rfq_id)))
  WHERE ((q.id = quote_messages.quote_id) AND (r.owner_id = auth.uid()))))));

CREATE POLICY "quote_messages_client_select" ON public."quote_messages" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM (quotes q
     JOIN rfqs r ON ((r.id = q.rfq_id)))
  WHERE ((q.id = quote_messages.quote_id) AND (r.owner_id = auth.uid())))));

CREATE POLICY "quote_messages_vendor_insert" ON public."quote_messages" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((sender_id = auth.uid()) AND (sender_role = 'vendor'::text) AND (EXISTS ( SELECT 1
   FROM (quotes q
     JOIN vendors v ON ((v.id = q.vendor_id)))
  WHERE ((q.id = quote_messages.quote_id) AND (v.owner_id = auth.uid()))))));

CREATE POLICY "quote_messages_vendor_select" ON public."quote_messages" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM (quotes q
     JOIN vendors v ON ((v.id = q.vendor_id)))
  WHERE ((q.id = quote_messages.quote_id) AND (v.owner_id = auth.uid())))));

CREATE POLICY "quotes_owner_read" ON public."quotes" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM rfqs r
  WHERE ((r.id = quotes.rfq_id) AND (r.owner_id = auth.uid())))));

CREATE POLICY "quotes_owner_select" ON public."quotes" AS PERMISSIVE FOR SELECT TO "public" USING ((EXISTS ( SELECT 1
   FROM rfqs r
  WHERE ((r.id = quotes.rfq_id) AND (r.owner_id = auth.uid())))));

CREATE POLICY "quotes_vendor_crud" ON public."quotes" AS PERMISSIVE FOR ALL TO "public" USING ((EXISTS ( SELECT 1
   FROM vendors v
  WHERE ((v.id = quotes.vendor_id) AND (v.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM vendors v
  WHERE ((v.id = quotes.vendor_id) AND (v.owner_id = auth.uid())))));

CREATE POLICY "quotes_vendor_insert" ON public."quotes" AS PERMISSIVE FOR INSERT TO "public" WITH CHECK (((EXISTS ( SELECT 1
   FROM vendors v
  WHERE ((v.id = quotes.vendor_id) AND (v.owner_id = auth.uid())))) AND (EXISTS ( SELECT 1
   FROM rfqs r
  WHERE ((r.id = quotes.rfq_id) AND (r.accepted_quote_id IS NULL))))));

CREATE POLICY "quotes_vendor_read" ON public."quotes" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM vendors v
  WHERE ((v.id = quotes.vendor_id) AND (v.owner_id = auth.uid())))));

CREATE POLICY "quotes_vendor_select" ON public."quotes" AS PERMISSIVE FOR SELECT TO "public" USING ((EXISTS ( SELECT 1
   FROM vendors v
  WHERE ((v.id = quotes.vendor_id) AND (v.owner_id = auth.uid())))));

CREATE POLICY "quotes_vendor_update" ON public."quotes" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM (vendors v
     JOIN rfq_invites i ON ((i.vendor_id = v.id)))
  WHERE ((v.owner_id = auth.uid()) AND (i.rfq_id = quotes.rfq_id) AND (i.vendor_id = quotes.vendor_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (vendors v
     JOIN rfq_invites i ON ((i.vendor_id = v.id)))
  WHERE ((v.owner_id = auth.uid()) AND (i.rfq_id = quotes.rfq_id) AND (i.vendor_id = quotes.vendor_id)))));

CREATE POLICY "reviews_delete_author" ON public."reviews" AS PERMISSIVE FOR DELETE TO "public" USING ((author_id = auth.uid()));

CREATE POLICY "reviews_delete_owner_7d" ON public."reviews" AS PERMISSIVE FOR DELETE TO "public" USING (((auth.uid() = author_id) AND is_user(auth.uid()) AND ((now() - created_at) <= '7 days'::interval)));

CREATE POLICY "reviews_insert_if_hired" ON public."reviews" AS PERMISSIVE FOR INSERT TO "public" WITH CHECK (((auth.uid() = author_id) AND is_user(auth.uid()) AND can_user_review(auth.uid(), vendor_id, rfq_id) AND (NOT has_user_reviewed(auth.uid(), vendor_id, rfq_id))));

CREATE POLICY "reviews_insert_owner_post_hire" ON public."reviews" AS PERMISSIVE FOR INSERT TO "public" WITH CHECK (((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM (rfqs r
     JOIN quotes q ON ((q.id = r.accepted_quote_id)))
  WHERE ((r.id = q.rfq_id) AND (r.owner_id = auth.uid()) AND (q.vendor_id = q.vendor_id))))));

CREATE POLICY "reviews_read_all" ON public."reviews" AS PERMISSIVE FOR SELECT TO "public" USING (true);

CREATE POLICY "reviews_select_all" ON public."reviews" AS PERMISSIVE FOR SELECT TO "public" USING (true);

CREATE POLICY "reviews_update_author" ON public."reviews" AS PERMISSIVE FOR UPDATE TO "public" USING ((author_id = auth.uid()));

CREATE POLICY "reviews_update_owner_7d" ON public."reviews" AS PERMISSIVE FOR UPDATE TO "public" USING (((auth.uid() = author_id) AND is_user(auth.uid()) AND ((now() - created_at) <= '7 days'::interval))) WITH CHECK (((auth.uid() = author_id) AND is_user(auth.uid()) AND ((now() - created_at) <= '7 days'::interval)));

CREATE POLICY "rfq_invites_owner_insert" ON public."rfq_invites" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM rfqs r
  WHERE ((r.id = rfq_invites.rfq_id) AND (r.owner_id = auth.uid())))));

CREATE POLICY "rfq_invites_owner_read" ON public."rfq_invites" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM rfqs r
  WHERE ((r.id = rfq_invites.rfq_id) AND (r.owner_id = auth.uid())))));

CREATE POLICY "rfq_invites_owner_update" ON public."rfq_invites" AS PERMISSIVE FOR UPDATE TO "public" USING ((EXISTS ( SELECT 1
   FROM rfqs r
  WHERE ((r.id = rfq_invites.rfq_id) AND (r.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM rfqs r
  WHERE ((r.id = rfq_invites.rfq_id) AND (r.owner_id = auth.uid())))));

CREATE POLICY "rfq_invites_vendor_read" ON public."rfq_invites" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM vendors v
  WHERE ((v.id = rfq_invites.vendor_id) AND (v.owner_id = auth.uid())))));

CREATE POLICY "rfq_invites_vendor_update" ON public."rfq_invites" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM vendors v
  WHERE ((v.id = rfq_invites.vendor_id) AND (v.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM vendors v
  WHERE ((v.id = rfq_invites.vendor_id) AND (v.owner_id = auth.uid())))));

CREATE POLICY "rfqs_owner_delete" ON public."rfqs" AS PERMISSIVE FOR DELETE TO "public" USING (((owner_id = auth.uid()) AND is_user(auth.uid())));

CREATE POLICY "rfqs_owner_insert" ON public."rfqs" AS PERMISSIVE FOR INSERT TO "public" WITH CHECK (((owner_id = auth.uid()) AND is_user(auth.uid())));

CREATE POLICY "rfqs_owner_select" ON public."rfqs" AS PERMISSIVE FOR SELECT TO "public" USING ((owner_id = auth.uid()));

CREATE POLICY "rfqs_owner_update" ON public."rfqs" AS PERMISSIVE FOR UPDATE TO "public" USING (((owner_id = auth.uid()) AND is_user(auth.uid()))) WITH CHECK (((owner_id = auth.uid()) AND is_user(auth.uid())));

CREATE POLICY "rfqs_vendor_select" ON public."rfqs" AS PERMISSIVE FOR SELECT TO "public" USING (can_vendor_view_rfq(auth.uid(), id));

CREATE POLICY "Allow service role to manage site settings" ON public."site_settings" AS PERMISSIVE FOR ALL TO "public" USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));

CREATE POLICY "user_push_tokens_owner_delete" ON public."user_push_tokens" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((user_id = auth.uid()));

CREATE POLICY "user_push_tokens_owner_insert" ON public."user_push_tokens" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "user_push_tokens_owner_select" ON public."user_push_tokens" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((user_id = auth.uid()));

CREATE POLICY "user_push_tokens_owner_update" ON public."user_push_tokens" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "vendor_availability_owner_crud" ON public."vendor_availability" AS PERMISSIVE FOR ALL TO "public" USING ((EXISTS ( SELECT 1
   FROM vendors v
  WHERE ((v.id = vendor_availability.vendor_id) AND (v.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM vendors v
  WHERE ((v.id = vendor_availability.vendor_id) AND (v.owner_id = auth.uid())))));

CREATE POLICY "vendor_availability_public_read" ON public."vendor_availability" AS PERMISSIVE FOR SELECT TO "public" USING ((EXISTS ( SELECT 1
   FROM vendors v
  WHERE ((v.id = vendor_availability.vendor_id) AND (v.is_published = true)))));

CREATE POLICY "vendor_categories_admin_all" ON public."vendor_categories" AS PERMISSIVE FOR ALL TO "public" USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text)))));

CREATE POLICY "vendor_categories_auth_read_published" ON public."vendor_categories" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM vendors v
  WHERE ((v.id = vendor_categories.vendor_id) AND (v.is_published = true)))));

CREATE POLICY "vendor_categories_owner_all" ON public."vendor_categories" AS PERMISSIVE FOR ALL TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM vendors v
  WHERE ((v.id = vendor_categories.vendor_id) AND (v.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM vendors v
  WHERE ((v.id = vendor_categories.vendor_id) AND (v.owner_id = auth.uid())))));

CREATE POLICY "vendor_categories_owner_crud" ON public."vendor_categories" AS PERMISSIVE FOR ALL TO "public" USING ((EXISTS ( SELECT 1
   FROM vendors v
  WHERE ((v.id = vendor_categories.vendor_id) AND (v.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM vendors v
  WHERE ((v.id = vendor_categories.vendor_id) AND (v.owner_id = auth.uid())))));

CREATE POLICY "vendor_categories_public_read" ON public."vendor_categories" AS PERMISSIVE FOR SELECT TO "public" USING ((EXISTS ( SELECT 1
   FROM vendors v
  WHERE ((v.id = vendor_categories.vendor_id) AND (v.is_published = true)))));

CREATE POLICY "vendor_categories_public_read_published" ON public."vendor_categories" AS PERMISSIVE FOR SELECT TO "anon" USING ((EXISTS ( SELECT 1
   FROM vendors v
  WHERE ((v.id = vendor_categories.vendor_id) AND (v.is_published = true)))));

CREATE POLICY "vendor_locations_admin_all" ON public."vendor_locations" AS PERMISSIVE FOR ALL TO "public" USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text)))));

CREATE POLICY "vendor_locations_auth_read_published" ON public."vendor_locations" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM vendors v
  WHERE ((v.id = vendor_locations.vendor_id) AND (v.is_published = true)))));

CREATE POLICY "vendor_locations_owner_all" ON public."vendor_locations" AS PERMISSIVE FOR ALL TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM vendors v
  WHERE ((v.id = vendor_locations.vendor_id) AND (v.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM vendors v
  WHERE ((v.id = vendor_locations.vendor_id) AND (v.owner_id = auth.uid())))));

CREATE POLICY "vendor_locations_owner_crud" ON public."vendor_locations" AS PERMISSIVE FOR ALL TO "public" USING ((EXISTS ( SELECT 1
   FROM vendors v
  WHERE ((v.id = vendor_locations.vendor_id) AND (v.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM vendors v
  WHERE ((v.id = vendor_locations.vendor_id) AND (v.owner_id = auth.uid())))));

CREATE POLICY "vendor_locations_public_read" ON public."vendor_locations" AS PERMISSIVE FOR SELECT TO "public" USING ((EXISTS ( SELECT 1
   FROM vendors v
  WHERE ((v.id = vendor_locations.vendor_id) AND (v.is_published = true)))));

CREATE POLICY "vendor_locations_public_read_published" ON public."vendor_locations" AS PERMISSIVE FOR SELECT TO "anon" USING ((EXISTS ( SELECT 1
   FROM vendors v
  WHERE ((v.id = vendor_locations.vendor_id) AND (v.is_published = true)))));

CREATE POLICY "vendor_media_admin_all" ON public."vendor_media" AS PERMISSIVE FOR ALL TO "public" USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text)))));

CREATE POLICY "vendor_media_owner_crud" ON public."vendor_media" AS PERMISSIVE FOR ALL TO "public" USING ((EXISTS ( SELECT 1
   FROM vendors v
  WHERE ((v.id = vendor_media.vendor_id) AND (v.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM vendors v
  WHERE ((v.id = vendor_media.vendor_id) AND (v.owner_id = auth.uid())))));

CREATE POLICY "vendor_media_public_read" ON public."vendor_media" AS PERMISSIVE FOR SELECT TO "public" USING ((EXISTS ( SELECT 1
   FROM vendors v
  WHERE ((v.id = vendor_media.vendor_id) AND (v.is_published = true)))));

CREATE POLICY "vendors_admin_all" ON public."vendors" AS PERMISSIVE FOR ALL TO "public" USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text)))));

CREATE POLICY "vendors_auth_read_published" ON public."vendors" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((is_published = true));

CREATE POLICY "vendors_owner_all" ON public."vendors" AS PERMISSIVE FOR ALL TO "authenticated" USING ((auth.uid() = owner_id)) WITH CHECK ((auth.uid() = owner_id));

CREATE POLICY "vendors_owner_crud" ON public."vendors" AS PERMISSIVE FOR ALL TO "public" USING ((auth.uid() = owner_id)) WITH CHECK ((auth.uid() = owner_id));

CREATE POLICY "vendors_owner_cud" ON public."vendors" AS PERMISSIVE FOR ALL TO "public" USING ((owner_id = auth.uid())) WITH CHECK ((owner_id = auth.uid()));

CREATE POLICY "vendors_public_read" ON public."vendors" AS PERMISSIVE FOR SELECT TO "public" USING ((is_published = true));

CREATE POLICY "vendors_public_read_published" ON public."vendors" AS PERMISSIVE FOR SELECT TO "anon" USING ((is_published = true));

CREATE POLICY "vendors_read_all" ON public."vendors" AS PERMISSIVE FOR SELECT TO "public" USING (true);

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon,authenticated,service_role;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon,authenticated,service_role;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO PUBLIC;
$wm_17ad9fd094fe$]);
-- Authorization repair for the live 2026-10-19 catalog. Does not delete application rows.
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

REVOKE CREATE ON SCHEMA public FROM PUBLIC, anon, authenticated;
-- TRUNCATE is not subject to RLS. API clients never need schema-level privileges.
REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON ALL TABLES IN SCHEMA public FROM PUBLIC,anon,authenticated;
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM PUBLIC,anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.wm_is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;
REVOKE ALL ON FUNCTION public.wm_is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wm_is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.wm_guard_profile_role() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF current_user NOT IN ('postgres', 'supabase_admin', 'service_role') THEN
    IF (TG_OP = 'INSERT' AND NEW.role NOT IN ('user', 'vendor')) OR
       (TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role
        AND (NEW.role = 'admin' OR OLD.role = 'admin')) THEN
      RAISE EXCEPTION 'Administrative roles require a trusted server operation.' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.wm_guard_profile_role() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS wm_guard_profile_role ON public.profiles;
CREATE TRIGGER wm_guard_profile_role BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.wm_guard_profile_role();

-- Auth creates a safe default profile even when email confirmation is required.
-- Never trust a role supplied in user-editable Auth metadata.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE m jsonb := coalesce(NEW.raw_user_meta_data, '{}'::jsonb);
  guests integer; budget numeric; wedding_date date;
BEGIN
  BEGIN guests:=(m->>'guest_count')::integer;
  EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN guests:=NULL; END;
  BEGIN budget:=(m->>'wedding_budget')::numeric;
  EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN budget:=NULL; END;
  BEGIN wedding_date:=(m->>'tentative_wedding_date')::date;
  EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow THEN wedding_date:=NULL; END;
  INSERT INTO public.profiles
    (id, role, full_name, phone, country, tentative_wedding_date, guest_count, wedding_budget, wedding_theme, language)
  VALUES
    (NEW.id, 'user', left(coalesce(m->>'full_name', ''), 200),
     left(m->>'phone',40), left(m->>'country',120),
     wedding_date, CASE WHEN guests BETWEEN 1 AND 100000 THEN guests END,
     CASE WHEN budget BETWEEN 0 AND 1000000000 THEN budget END,
     left(m->>'wedding_theme',120), CASE WHEN m->>'language' = 'es' THEN 'es' ELSE 'en' END)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS wm_create_profile ON auth.users;
CREATE TRIGGER wm_create_profile AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Replace overlapping permissive policies, rather than adding another OR branch.
DO $$ DECLARE p record; BEGIN
  FOR p IN SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public'
    AND tablename IN ('profiles','vendors','amenity_lookup','languages','vendor_amenities',
      'vendor_pricing','vendor_spaces','vendor_team','quotes','rfqs','rfq_invites','reviews','notifications')
  LOOP EXECUTE format('DROP POLICY %I ON public.%I',p.policyname,p.tablename); END LOOP;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_self_select ON public.profiles FOR SELECT TO authenticated USING (id = (SELECT auth.uid()));
CREATE POLICY profiles_self_insert ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY profiles_self_update ON public.profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY vendors_published_select ON public.vendors FOR SELECT TO anon, authenticated USING (is_published);
CREATE POLICY vendors_owner_manage ON public.vendors FOR ALL TO authenticated
  USING (owner_id = (SELECT auth.uid()) OR (SELECT public.wm_is_admin()))
  WITH CHECK (owner_id = (SELECT auth.uid()) OR (SELECT public.wm_is_admin()));

CREATE OR REPLACE FUNCTION public.wm_guard_vendor_rating() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF current_user NOT IN ('postgres','supabase_admin','service_role') THEN
    IF TG_OP='INSERT' THEN NEW.rating_avg:=0; NEW.rating_count:=0;
    ELSIF ROW(NEW.rating_avg,NEW.rating_count) IS DISTINCT FROM ROW(OLD.rating_avg,OLD.rating_count) THEN
      RAISE EXCEPTION 'Ratings are computed from reviews.' USING ERRCODE='42501';
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.wm_guard_vendor_rating() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER wm_guard_vendor_rating BEFORE INSERT OR UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.wm_guard_vendor_rating();

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['amenity_lookup','languages'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM anon, authenticated',t);
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated',t);
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated',t);
    EXECUTE format('CREATE POLICY lookup_public_read ON public.%I FOR SELECT TO anon,authenticated USING (true)',t);
    EXECUTE format('CREATE POLICY lookup_admin_manage ON public.%I FOR ALL TO authenticated USING ((SELECT public.wm_is_admin())) WITH CHECK ((SELECT public.wm_is_admin()))',t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['vendor_amenities','vendor_pricing','vendor_spaces','vendor_team'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated',t);
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated',t);
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated',t);
    EXECUTE format('CREATE POLICY vendor_detail_public_read ON public.%I FOR SELECT TO anon,authenticated USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.is_published))',t);
    EXECUTE format('CREATE POLICY vendor_detail_owner_manage ON public.%I FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND (v.owner_id = (SELECT auth.uid()) OR (SELECT public.wm_is_admin())))) WITH CHECK (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND (v.owner_id = (SELECT auth.uid()) OR (SELECT public.wm_is_admin()))))',t);
  END LOOP;
END $$;

-- No public proposal or profile-role enumeration through owner-executed views.
ALTER VIEW public.profiles_resolved SET (security_invoker = true);
ALTER VIEW public.vendor_latest_quotes SET (security_invoker = true);
REVOKE ALL ON public.profiles_resolved, public.vendor_latest_quotes FROM anon, authenticated;
GRANT SELECT ON public.profiles_resolved, public.vendor_latest_quotes TO authenticated;
ALTER VIEW public.vendor_public_search SET (security_invoker = true);
ALTER VIEW public.vendor_profile_view SET (security_invoker = true);
ALTER VIEW public.vendor_ratings SET (security_invoker = true);
ALTER VIEW public.reviews_public SET (security_invoker = true);

CREATE OR REPLACE FUNCTION public.is_user(_uid uuid) RETURNS boolean
LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT _uid = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = _uid AND role = 'user');
$$;
CREATE OR REPLACE FUNCTION public.is_vendor(_uid uuid) RETURNS boolean
LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT _uid = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = _uid AND role = 'vendor');
$$;
REVOKE ALL ON FUNCTION public.is_user(uuid), public.is_vendor(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_user(uuid), public.is_vendor(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.can_vendor_view_rfq(_uid uuid, _rfq_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT _uid = auth.uid() AND EXISTS (
    SELECT 1 FROM public.rfq_invites i JOIN public.vendors v ON v.id = i.vendor_id
    WHERE i.rfq_id = _rfq_id AND v.owner_id = _uid
  );
$$;
REVOKE ALL ON FUNCTION public.can_vendor_view_rfq(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_vendor_view_rfq(uuid,uuid) TO authenticated;

ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY rfqs_owner_select ON public.rfqs FOR SELECT TO authenticated USING (owner_id = (SELECT auth.uid()));
CREATE POLICY rfqs_vendor_select ON public.rfqs FOR SELECT TO authenticated USING (public.can_vendor_view_rfq((SELECT auth.uid()),id));
CREATE POLICY rfqs_owner_insert ON public.rfqs FOR INSERT TO authenticated WITH CHECK (owner_id = (SELECT auth.uid()) AND public.is_user((SELECT auth.uid())));
CREATE POLICY rfqs_owner_update ON public.rfqs FOR UPDATE TO authenticated
  USING (owner_id = (SELECT auth.uid())) WITH CHECK (owner_id = (SELECT auth.uid()));
CREATE POLICY rfqs_owner_delete ON public.rfqs FOR DELETE TO authenticated USING (owner_id = (SELECT auth.uid()));

ALTER TABLE public.rfq_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY invites_members_read ON public.rfq_invites FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.rfqs r WHERE r.id=rfq_id AND r.owner_id=(SELECT auth.uid())) OR
  EXISTS (SELECT 1 FROM public.vendors v WHERE v.id=vendor_id AND v.owner_id=(SELECT auth.uid())));
CREATE POLICY invites_owner_insert ON public.rfq_invites FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.rfqs r WHERE r.id=rfq_id AND r.owner_id=(SELECT auth.uid()) AND r.accepted_quote_id IS NULL) AND
  EXISTS (SELECT 1 FROM public.vendors v WHERE v.id=vendor_id AND v.is_published));
CREATE POLICY invites_members_update ON public.rfq_invites FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.rfqs r WHERE r.id=rfq_id AND r.owner_id=(SELECT auth.uid())) OR
  EXISTS (SELECT 1 FROM public.vendors v WHERE v.id=vendor_id AND v.owner_id=(SELECT auth.uid()))) WITH CHECK (
  EXISTS (SELECT 1 FROM public.rfqs r WHERE r.id=rfq_id AND r.owner_id=(SELECT auth.uid())) OR
  EXISTS (SELECT 1 FROM public.vendors v WHERE v.id=vendor_id AND v.owner_id=(SELECT auth.uid())));

CREATE OR REPLACE FUNCTION public.wm_guard_invite() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE is_client boolean;
BEGIN
  IF current_user IN ('postgres','supabase_admin','service_role') THEN RETURN NEW; END IF;
  IF TG_OP='INSERT' THEN
    NEW.created_at := now();
    NEW.expires_at := least(coalesce(NEW.expires_at,now()+interval '14 days'),now()+interval '14 days');
    NEW.status := 'invited';
    NEW.reveal_email := false; NEW.reveal_phone := false;
    RETURN NEW;
  END IF;
  IF ROW(NEW.rfq_id,NEW.vendor_id,NEW.id,NEW.created_at,NEW.expires_at) IS DISTINCT FROM
     ROW(OLD.rfq_id,OLD.vendor_id,OLD.id,OLD.created_at,OLD.expires_at) THEN
    RAISE EXCEPTION 'Invitation identity and expiry cannot be changed.' USING ERRCODE='42501';
  END IF;
  SELECT EXISTS (SELECT 1 FROM public.rfqs WHERE id=OLD.rfq_id AND owner_id=auth.uid()) INTO is_client;
  IF NOT is_client THEN
    IF ROW(NEW.reveal_email,NEW.reveal_phone,NEW.client_last_read_at) IS DISTINCT FROM
       ROW(OLD.reveal_email,OLD.reveal_phone,OLD.client_last_read_at) OR
       (NEW.status IS DISTINCT FROM OLD.status AND
         (NEW.status NOT IN ('viewed','responded','declined') OR OLD.status IN ('declined','expired','accepted'))) THEN
      RAISE EXCEPTION 'Vendors cannot change client consent or reopen a closed invitation.' USING ERRCODE='42501';
    END IF;
    IF ROW(NEW.closed_at,NEW.closed_reason) IS DISTINCT FROM ROW(OLD.closed_at,OLD.closed_reason) AND
      (OLD.closed_reason IN ('archived_by_client','accepted_other_vendor') OR
       (NEW.closed_reason IS NOT NULL AND NEW.closed_reason <> 'archived_by_vendor')) THEN
      RAISE EXCEPTION 'Only the client can change this closure.' USING ERRCODE='42501';
    END IF;
  ELSIF NEW.vendor_last_read_at IS DISTINCT FROM OLD.vendor_last_read_at THEN
    RAISE EXCEPTION 'Clients cannot change vendor read markers.' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.wm_guard_invite() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER wm_guard_invite BEFORE INSERT OR UPDATE ON public.rfq_invites
  FOR EACH ROW EXECUTE FUNCTION public.wm_guard_invite();

CREATE OR REPLACE FUNCTION public.wm_can_submit_quote(p_rfq uuid,p_vendor uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.rfq_invites i
    JOIN public.vendors v ON v.id=i.vendor_id JOIN public.rfqs r ON r.id=i.rfq_id
    WHERE i.rfq_id=p_rfq AND i.vendor_id=p_vendor AND v.owner_id=auth.uid()
      AND r.accepted_quote_id IS NULL AND i.status NOT IN ('declined','expired','accepted')
      AND i.closed_at IS NULL AND (i.expires_at IS NULL OR i.expires_at>now()));
$$;
REVOKE ALL ON FUNCTION public.wm_can_submit_quote(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.wm_can_submit_quote(uuid,uuid) TO authenticated;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.quotes FROM anon,authenticated;
CREATE POLICY quotes_members_select ON public.quotes FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.rfqs r WHERE r.id=rfq_id AND r.owner_id=(SELECT auth.uid())) OR
  (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id=vendor_id AND v.owner_id=(SELECT auth.uid()))
   AND public.can_vendor_view_rfq((SELECT auth.uid()),rfq_id)));
CREATE POLICY quotes_invited_insert ON public.quotes FOR INSERT TO authenticated WITH CHECK (public.wm_can_submit_quote(rfq_id,vendor_id));

CREATE OR REPLACE FUNCTION public.wm_allocate_quote_version() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(NEW.rfq_id::text||'/'||NEW.vendor_id::text,0));
  SELECT coalesce(max(version),0)+1 INTO NEW.version FROM public.quotes WHERE rfq_id=NEW.rfq_id AND vendor_id=NEW.vendor_id;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.wm_allocate_quote_version() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER wm_allocate_quote_version BEFORE INSERT ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.wm_allocate_quote_version();
CREATE UNIQUE INDEX quotes_thread_version_unique ON public.quotes(rfq_id,vendor_id,version);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY reviews_published_read ON public.reviews FOR SELECT TO anon,authenticated USING (
  EXISTS (SELECT 1 FROM public.vendors v WHERE v.id=vendor_id AND v.is_published));
CREATE POLICY reviews_author_read ON public.reviews FOR SELECT TO authenticated USING (author_id=(SELECT auth.uid()));
CREATE POLICY reviews_eligible_insert ON public.reviews FOR INSERT TO authenticated WITH CHECK (
  author_id=(SELECT auth.uid()) AND public.can_user_review((SELECT auth.uid()),vendor_id,rfq_id));
CREATE POLICY reviews_author_update ON public.reviews FOR UPDATE TO authenticated
  USING (author_id=(SELECT auth.uid()) AND created_at>=now()-interval '7 days')
  WITH CHECK (author_id=(SELECT auth.uid()) AND created_at>=now()-interval '7 days');
CREATE POLICY reviews_author_delete ON public.reviews FOR DELETE TO authenticated
  USING (author_id=(SELECT auth.uid()) AND created_at>=now()-interval '7 days');
CREATE OR REPLACE FUNCTION public.wm_guard_review_identity() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    IF current_user NOT IN ('postgres','supabase_admin','service_role') THEN NEW.created_at:=now(); END IF;
    RETURN NEW;
  END IF;
  IF current_user NOT IN ('postgres','supabase_admin','service_role') AND
    ROW(NEW.id,NEW.rfq_id,NEW.vendor_id,NEW.author_id,NEW.created_at) IS DISTINCT FROM
    ROW(OLD.id,OLD.rfq_id,OLD.vendor_id,OLD.author_id,OLD.created_at) THEN
    RAISE EXCEPTION 'Review ownership and booking linkage are immutable.' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.wm_guard_review_identity() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER wm_guard_review_identity BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.wm_guard_review_identity();

-- Ratings run with narrowly scoped trigger authority, not the review author's UPDATE rights.
CREATE OR REPLACE FUNCTION public.recalc_vendor_rating(p_vendor_id uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  UPDATE public.vendors v SET rating_avg=a.avg_rating,rating_count=a.cnt
  FROM (SELECT coalesce(avg(stars),0) AS avg_rating,count(*)::integer AS cnt
        FROM public.reviews WHERE vendor_id=p_vendor_id) a WHERE v.id=p_vendor_id;
$$;
CREATE OR REPLACE FUNCTION public.tg_reviews_after_write() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP='DELETE' THEN PERFORM public.recalc_vendor_rating(OLD.vendor_id);
  ELSE
    PERFORM public.recalc_vendor_rating(NEW.vendor_id);
    IF TG_OP='UPDATE' AND OLD.vendor_id IS DISTINCT FROM NEW.vendor_id THEN PERFORM public.recalc_vendor_rating(OLD.vendor_id); END IF;
  END IF;
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.recalc_vendor_rating(uuid),public.tg_reviews_after_write() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.wm_notification_allowed(p_recipient uuid,p_actor uuid,p_type text,p_data jsonb) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE r_id uuid; v_id uuid; q_id uuid; client_id uuid; vendor_owner uuid; accepted_id uuid;
BEGIN
  IF auth.uid() IS NULL OR p_actor IS DISTINCT FROM auth.uid() OR p_type NOT IN
    ('quote_answered','vendor_new_request','vendor_quote_accepted','thread_reply') THEN RETURN false; END IF;
  BEGIN r_id:=(p_data->>'rfqId')::uuid; v_id:=(p_data->>'vendorId')::uuid; q_id:=(p_data->>'quoteId')::uuid;
  EXCEPTION WHEN invalid_text_representation THEN RETURN false; END;
  SELECT r.owner_id,v.owner_id,r.accepted_quote_id INTO client_id,vendor_owner,accepted_id
    FROM public.rfqs r JOIN public.rfq_invites i ON i.rfq_id=r.id JOIN public.vendors v ON v.id=i.vendor_id
    WHERE r.id=r_id AND v.id=v_id;
  IF NOT FOUND THEN RETURN false; END IF;
  IF p_type<>'vendor_new_request' AND NOT EXISTS
    (SELECT 1 FROM public.quotes WHERE id=q_id AND rfq_id=r_id AND vendor_id=v_id) THEN RETURN false; END IF;
  IF p_type='vendor_new_request' THEN RETURN p_actor=client_id AND p_recipient=vendor_owner; END IF;
  IF p_type='vendor_quote_accepted' THEN RETURN p_actor=client_id AND p_recipient=vendor_owner AND accepted_id=q_id; END IF;
  IF p_type='quote_answered' THEN RETURN p_actor=vendor_owner AND p_recipient=client_id; END IF;
  RETURN ((p_actor=client_id AND p_recipient=vendor_owner AND p_data->>'senderRole'='client') OR
          (p_actor=vendor_owner AND p_recipient=client_id AND p_data->>'senderRole'='vendor')) AND EXISTS
    (SELECT 1 FROM public.quote_messages WHERE quote_id=q_id AND sender_id=p_actor AND created_at>=now()-interval '5 minutes');
END $$;
REVOKE ALL ON FUNCTION public.wm_notification_allowed(uuid,uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.wm_notification_allowed(uuid,uuid,text,jsonb) TO authenticated;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_recipient_select ON public.notifications FOR SELECT TO authenticated USING (recipient_id=(SELECT auth.uid()));
CREATE POLICY notifications_member_insert ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.wm_notification_allowed(recipient_id,actor_id,type,data));
CREATE POLICY notifications_recipient_update ON public.notifications FOR UPDATE TO authenticated
  USING (recipient_id=(SELECT auth.uid())) WITH CHECK (recipient_id=(SELECT auth.uid()));
CREATE POLICY notifications_recipient_delete ON public.notifications FOR DELETE TO authenticated USING (recipient_id=(SELECT auth.uid()));
REVOKE UPDATE ON public.notifications FROM authenticated;
GRANT UPDATE(read_at,deleted_at) ON public.notifications TO authenticated;

CREATE INDEX IF NOT EXISTS vendor_spaces_vendor_id_idx ON public.vendor_spaces(vendor_id);
CREATE INDEX IF NOT EXISTS quote_messages_sender_id_idx ON public.quote_messages(sender_id);
CREATE INDEX IF NOT EXISTS vendor_amenities_amenity_key_idx ON public.vendor_amenities(amenity_key);
CREATE INDEX IF NOT EXISTS vendor_categories_category_id_idx ON public.vendor_categories(category_id);
CREATE INDEX IF NOT EXISTS notifications_actor_created_idx ON public.notifications(actor_id,created_at);
CREATE INDEX IF NOT EXISTS rfq_invites_vendor_activity_idx ON public.rfq_invites(vendor_id,last_activity_at DESC);
CREATE INDEX IF NOT EXISTS notifications_recipient_unread_idx ON public.notifications(recipient_id,created_at DESC) WHERE read_at IS NULL AND deleted_at IS NULL;
-- Remove duplicate timestamp work; keep the canonical quotes_set_updated_at trigger.
DROP TRIGGER IF EXISTS trg_quotes_touch ON public.quotes;
NOTIFY pgrst, 'reload schema';
INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES ('202610190001','security_hardening',ARRAY[$wm_4a960a418ed6$-- Authorization repair for the live 2026-10-19 catalog. Does not delete application rows.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

REVOKE CREATE ON SCHEMA public FROM PUBLIC, anon, authenticated;
-- TRUNCATE is not subject to RLS. API clients never need schema-level privileges.
REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON ALL TABLES IN SCHEMA public FROM PUBLIC,anon,authenticated;
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM PUBLIC,anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.wm_is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;
REVOKE ALL ON FUNCTION public.wm_is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wm_is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.wm_guard_profile_role() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF current_user NOT IN ('postgres', 'supabase_admin', 'service_role') THEN
    IF (TG_OP = 'INSERT' AND NEW.role NOT IN ('user', 'vendor')) OR
       (TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role
        AND (NEW.role = 'admin' OR OLD.role = 'admin')) THEN
      RAISE EXCEPTION 'Administrative roles require a trusted server operation.' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.wm_guard_profile_role() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS wm_guard_profile_role ON public.profiles;
CREATE TRIGGER wm_guard_profile_role BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.wm_guard_profile_role();

-- Auth creates a safe default profile even when email confirmation is required.
-- Never trust a role supplied in user-editable Auth metadata.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE m jsonb := coalesce(NEW.raw_user_meta_data, '{}'::jsonb);
  guests integer; budget numeric; wedding_date date;
BEGIN
  BEGIN guests:=(m->>'guest_count')::integer;
  EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN guests:=NULL; END;
  BEGIN budget:=(m->>'wedding_budget')::numeric;
  EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN budget:=NULL; END;
  BEGIN wedding_date:=(m->>'tentative_wedding_date')::date;
  EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow THEN wedding_date:=NULL; END;
  INSERT INTO public.profiles
    (id, role, full_name, phone, country, tentative_wedding_date, guest_count, wedding_budget, wedding_theme, language)
  VALUES
    (NEW.id, 'user', left(coalesce(m->>'full_name', ''), 200),
     left(m->>'phone',40), left(m->>'country',120),
     wedding_date, CASE WHEN guests BETWEEN 1 AND 100000 THEN guests END,
     CASE WHEN budget BETWEEN 0 AND 1000000000 THEN budget END,
     left(m->>'wedding_theme',120), CASE WHEN m->>'language' = 'es' THEN 'es' ELSE 'en' END)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS wm_create_profile ON auth.users;
CREATE TRIGGER wm_create_profile AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Replace overlapping permissive policies, rather than adding another OR branch.
DO $$ DECLARE p record; BEGIN
  FOR p IN SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public'
    AND tablename IN ('profiles','vendors','amenity_lookup','languages','vendor_amenities',
      'vendor_pricing','vendor_spaces','vendor_team','quotes','rfqs','rfq_invites','reviews','notifications')
  LOOP EXECUTE format('DROP POLICY %I ON public.%I',p.policyname,p.tablename); END LOOP;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_self_select ON public.profiles FOR SELECT TO authenticated USING (id = (SELECT auth.uid()));
CREATE POLICY profiles_self_insert ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY profiles_self_update ON public.profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY vendors_published_select ON public.vendors FOR SELECT TO anon, authenticated USING (is_published);
CREATE POLICY vendors_owner_manage ON public.vendors FOR ALL TO authenticated
  USING (owner_id = (SELECT auth.uid()) OR (SELECT public.wm_is_admin()))
  WITH CHECK (owner_id = (SELECT auth.uid()) OR (SELECT public.wm_is_admin()));

CREATE OR REPLACE FUNCTION public.wm_guard_vendor_rating() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF current_user NOT IN ('postgres','supabase_admin','service_role') THEN
    IF TG_OP='INSERT' THEN NEW.rating_avg:=0; NEW.rating_count:=0;
    ELSIF ROW(NEW.rating_avg,NEW.rating_count) IS DISTINCT FROM ROW(OLD.rating_avg,OLD.rating_count) THEN
      RAISE EXCEPTION 'Ratings are computed from reviews.' USING ERRCODE='42501';
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.wm_guard_vendor_rating() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER wm_guard_vendor_rating BEFORE INSERT OR UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.wm_guard_vendor_rating();

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['amenity_lookup','languages'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM anon, authenticated',t);
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated',t);
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated',t);
    EXECUTE format('CREATE POLICY lookup_public_read ON public.%I FOR SELECT TO anon,authenticated USING (true)',t);
    EXECUTE format('CREATE POLICY lookup_admin_manage ON public.%I FOR ALL TO authenticated USING ((SELECT public.wm_is_admin())) WITH CHECK ((SELECT public.wm_is_admin()))',t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['vendor_amenities','vendor_pricing','vendor_spaces','vendor_team'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated',t);
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated',t);
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated',t);
    EXECUTE format('CREATE POLICY vendor_detail_public_read ON public.%I FOR SELECT TO anon,authenticated USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.is_published))',t);
    EXECUTE format('CREATE POLICY vendor_detail_owner_manage ON public.%I FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND (v.owner_id = (SELECT auth.uid()) OR (SELECT public.wm_is_admin())))) WITH CHECK (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND (v.owner_id = (SELECT auth.uid()) OR (SELECT public.wm_is_admin()))))',t);
  END LOOP;
END $$;

-- No public proposal or profile-role enumeration through owner-executed views.
ALTER VIEW public.profiles_resolved SET (security_invoker = true);
ALTER VIEW public.vendor_latest_quotes SET (security_invoker = true);
REVOKE ALL ON public.profiles_resolved, public.vendor_latest_quotes FROM anon, authenticated;
GRANT SELECT ON public.profiles_resolved, public.vendor_latest_quotes TO authenticated;
ALTER VIEW public.vendor_public_search SET (security_invoker = true);
ALTER VIEW public.vendor_profile_view SET (security_invoker = true);
ALTER VIEW public.vendor_ratings SET (security_invoker = true);
ALTER VIEW public.reviews_public SET (security_invoker = true);

CREATE OR REPLACE FUNCTION public.is_user(_uid uuid) RETURNS boolean
LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT _uid = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = _uid AND role = 'user');
$$;
CREATE OR REPLACE FUNCTION public.is_vendor(_uid uuid) RETURNS boolean
LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT _uid = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = _uid AND role = 'vendor');
$$;
REVOKE ALL ON FUNCTION public.is_user(uuid), public.is_vendor(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_user(uuid), public.is_vendor(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.can_vendor_view_rfq(_uid uuid, _rfq_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT _uid = auth.uid() AND EXISTS (
    SELECT 1 FROM public.rfq_invites i JOIN public.vendors v ON v.id = i.vendor_id
    WHERE i.rfq_id = _rfq_id AND v.owner_id = _uid
  );
$$;
REVOKE ALL ON FUNCTION public.can_vendor_view_rfq(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_vendor_view_rfq(uuid,uuid) TO authenticated;

ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY rfqs_owner_select ON public.rfqs FOR SELECT TO authenticated USING (owner_id = (SELECT auth.uid()));
CREATE POLICY rfqs_vendor_select ON public.rfqs FOR SELECT TO authenticated USING (public.can_vendor_view_rfq((SELECT auth.uid()),id));
CREATE POLICY rfqs_owner_insert ON public.rfqs FOR INSERT TO authenticated WITH CHECK (owner_id = (SELECT auth.uid()) AND public.is_user((SELECT auth.uid())));
CREATE POLICY rfqs_owner_update ON public.rfqs FOR UPDATE TO authenticated
  USING (owner_id = (SELECT auth.uid())) WITH CHECK (owner_id = (SELECT auth.uid()));
CREATE POLICY rfqs_owner_delete ON public.rfqs FOR DELETE TO authenticated USING (owner_id = (SELECT auth.uid()));

ALTER TABLE public.rfq_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY invites_members_read ON public.rfq_invites FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.rfqs r WHERE r.id=rfq_id AND r.owner_id=(SELECT auth.uid())) OR
  EXISTS (SELECT 1 FROM public.vendors v WHERE v.id=vendor_id AND v.owner_id=(SELECT auth.uid())));
CREATE POLICY invites_owner_insert ON public.rfq_invites FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.rfqs r WHERE r.id=rfq_id AND r.owner_id=(SELECT auth.uid()) AND r.accepted_quote_id IS NULL) AND
  EXISTS (SELECT 1 FROM public.vendors v WHERE v.id=vendor_id AND v.is_published));
CREATE POLICY invites_members_update ON public.rfq_invites FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.rfqs r WHERE r.id=rfq_id AND r.owner_id=(SELECT auth.uid())) OR
  EXISTS (SELECT 1 FROM public.vendors v WHERE v.id=vendor_id AND v.owner_id=(SELECT auth.uid()))) WITH CHECK (
  EXISTS (SELECT 1 FROM public.rfqs r WHERE r.id=rfq_id AND r.owner_id=(SELECT auth.uid())) OR
  EXISTS (SELECT 1 FROM public.vendors v WHERE v.id=vendor_id AND v.owner_id=(SELECT auth.uid())));

CREATE OR REPLACE FUNCTION public.wm_guard_invite() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE is_client boolean;
BEGIN
  IF current_user IN ('postgres','supabase_admin','service_role') THEN RETURN NEW; END IF;
  IF TG_OP='INSERT' THEN
    NEW.created_at := now();
    NEW.expires_at := least(coalesce(NEW.expires_at,now()+interval '14 days'),now()+interval '14 days');
    NEW.status := 'invited';
    NEW.reveal_email := false; NEW.reveal_phone := false;
    RETURN NEW;
  END IF;
  IF ROW(NEW.rfq_id,NEW.vendor_id,NEW.id,NEW.created_at,NEW.expires_at) IS DISTINCT FROM
     ROW(OLD.rfq_id,OLD.vendor_id,OLD.id,OLD.created_at,OLD.expires_at) THEN
    RAISE EXCEPTION 'Invitation identity and expiry cannot be changed.' USING ERRCODE='42501';
  END IF;
  SELECT EXISTS (SELECT 1 FROM public.rfqs WHERE id=OLD.rfq_id AND owner_id=auth.uid()) INTO is_client;
  IF NOT is_client THEN
    IF ROW(NEW.reveal_email,NEW.reveal_phone,NEW.client_last_read_at) IS DISTINCT FROM
       ROW(OLD.reveal_email,OLD.reveal_phone,OLD.client_last_read_at) OR
       (NEW.status IS DISTINCT FROM OLD.status AND
         (NEW.status NOT IN ('viewed','responded','declined') OR OLD.status IN ('declined','expired','accepted'))) THEN
      RAISE EXCEPTION 'Vendors cannot change client consent or reopen a closed invitation.' USING ERRCODE='42501';
    END IF;
    IF ROW(NEW.closed_at,NEW.closed_reason) IS DISTINCT FROM ROW(OLD.closed_at,OLD.closed_reason) AND
      (OLD.closed_reason IN ('archived_by_client','accepted_other_vendor') OR
       (NEW.closed_reason IS NOT NULL AND NEW.closed_reason <> 'archived_by_vendor')) THEN
      RAISE EXCEPTION 'Only the client can change this closure.' USING ERRCODE='42501';
    END IF;
  ELSIF NEW.vendor_last_read_at IS DISTINCT FROM OLD.vendor_last_read_at THEN
    RAISE EXCEPTION 'Clients cannot change vendor read markers.' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.wm_guard_invite() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER wm_guard_invite BEFORE INSERT OR UPDATE ON public.rfq_invites
  FOR EACH ROW EXECUTE FUNCTION public.wm_guard_invite();

CREATE OR REPLACE FUNCTION public.wm_can_submit_quote(p_rfq uuid,p_vendor uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.rfq_invites i
    JOIN public.vendors v ON v.id=i.vendor_id JOIN public.rfqs r ON r.id=i.rfq_id
    WHERE i.rfq_id=p_rfq AND i.vendor_id=p_vendor AND v.owner_id=auth.uid()
      AND r.accepted_quote_id IS NULL AND i.status NOT IN ('declined','expired','accepted')
      AND i.closed_at IS NULL AND (i.expires_at IS NULL OR i.expires_at>now()));
$$;
REVOKE ALL ON FUNCTION public.wm_can_submit_quote(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.wm_can_submit_quote(uuid,uuid) TO authenticated;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.quotes FROM anon,authenticated;
CREATE POLICY quotes_members_select ON public.quotes FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.rfqs r WHERE r.id=rfq_id AND r.owner_id=(SELECT auth.uid())) OR
  (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id=vendor_id AND v.owner_id=(SELECT auth.uid()))
   AND public.can_vendor_view_rfq((SELECT auth.uid()),rfq_id)));
CREATE POLICY quotes_invited_insert ON public.quotes FOR INSERT TO authenticated WITH CHECK (public.wm_can_submit_quote(rfq_id,vendor_id));

CREATE OR REPLACE FUNCTION public.wm_allocate_quote_version() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(NEW.rfq_id::text||'/'||NEW.vendor_id::text,0));
  SELECT coalesce(max(version),0)+1 INTO NEW.version FROM public.quotes WHERE rfq_id=NEW.rfq_id AND vendor_id=NEW.vendor_id;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.wm_allocate_quote_version() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER wm_allocate_quote_version BEFORE INSERT ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.wm_allocate_quote_version();
CREATE UNIQUE INDEX quotes_thread_version_unique ON public.quotes(rfq_id,vendor_id,version);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY reviews_published_read ON public.reviews FOR SELECT TO anon,authenticated USING (
  EXISTS (SELECT 1 FROM public.vendors v WHERE v.id=vendor_id AND v.is_published));
CREATE POLICY reviews_author_read ON public.reviews FOR SELECT TO authenticated USING (author_id=(SELECT auth.uid()));
CREATE POLICY reviews_eligible_insert ON public.reviews FOR INSERT TO authenticated WITH CHECK (
  author_id=(SELECT auth.uid()) AND public.can_user_review((SELECT auth.uid()),vendor_id,rfq_id));
CREATE POLICY reviews_author_update ON public.reviews FOR UPDATE TO authenticated
  USING (author_id=(SELECT auth.uid()) AND created_at>=now()-interval '7 days')
  WITH CHECK (author_id=(SELECT auth.uid()) AND created_at>=now()-interval '7 days');
CREATE POLICY reviews_author_delete ON public.reviews FOR DELETE TO authenticated
  USING (author_id=(SELECT auth.uid()) AND created_at>=now()-interval '7 days');
CREATE OR REPLACE FUNCTION public.wm_guard_review_identity() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    IF current_user NOT IN ('postgres','supabase_admin','service_role') THEN NEW.created_at:=now(); END IF;
    RETURN NEW;
  END IF;
  IF current_user NOT IN ('postgres','supabase_admin','service_role') AND
    ROW(NEW.id,NEW.rfq_id,NEW.vendor_id,NEW.author_id,NEW.created_at) IS DISTINCT FROM
    ROW(OLD.id,OLD.rfq_id,OLD.vendor_id,OLD.author_id,OLD.created_at) THEN
    RAISE EXCEPTION 'Review ownership and booking linkage are immutable.' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.wm_guard_review_identity() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER wm_guard_review_identity BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.wm_guard_review_identity();

-- Ratings run with narrowly scoped trigger authority, not the review author's UPDATE rights.
CREATE OR REPLACE FUNCTION public.recalc_vendor_rating(p_vendor_id uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  UPDATE public.vendors v SET rating_avg=a.avg_rating,rating_count=a.cnt
  FROM (SELECT coalesce(avg(stars),0) AS avg_rating,count(*)::integer AS cnt
        FROM public.reviews WHERE vendor_id=p_vendor_id) a WHERE v.id=p_vendor_id;
$$;
CREATE OR REPLACE FUNCTION public.tg_reviews_after_write() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP='DELETE' THEN PERFORM public.recalc_vendor_rating(OLD.vendor_id);
  ELSE
    PERFORM public.recalc_vendor_rating(NEW.vendor_id);
    IF TG_OP='UPDATE' AND OLD.vendor_id IS DISTINCT FROM NEW.vendor_id THEN PERFORM public.recalc_vendor_rating(OLD.vendor_id); END IF;
  END IF;
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.recalc_vendor_rating(uuid),public.tg_reviews_after_write() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.wm_notification_allowed(p_recipient uuid,p_actor uuid,p_type text,p_data jsonb) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE r_id uuid; v_id uuid; q_id uuid; client_id uuid; vendor_owner uuid; accepted_id uuid;
BEGIN
  IF auth.uid() IS NULL OR p_actor IS DISTINCT FROM auth.uid() OR p_type NOT IN
    ('quote_answered','vendor_new_request','vendor_quote_accepted','thread_reply') THEN RETURN false; END IF;
  BEGIN r_id:=(p_data->>'rfqId')::uuid; v_id:=(p_data->>'vendorId')::uuid; q_id:=(p_data->>'quoteId')::uuid;
  EXCEPTION WHEN invalid_text_representation THEN RETURN false; END;
  SELECT r.owner_id,v.owner_id,r.accepted_quote_id INTO client_id,vendor_owner,accepted_id
    FROM public.rfqs r JOIN public.rfq_invites i ON i.rfq_id=r.id JOIN public.vendors v ON v.id=i.vendor_id
    WHERE r.id=r_id AND v.id=v_id;
  IF NOT FOUND THEN RETURN false; END IF;
  IF p_type<>'vendor_new_request' AND NOT EXISTS
    (SELECT 1 FROM public.quotes WHERE id=q_id AND rfq_id=r_id AND vendor_id=v_id) THEN RETURN false; END IF;
  IF p_type='vendor_new_request' THEN RETURN p_actor=client_id AND p_recipient=vendor_owner; END IF;
  IF p_type='vendor_quote_accepted' THEN RETURN p_actor=client_id AND p_recipient=vendor_owner AND accepted_id=q_id; END IF;
  IF p_type='quote_answered' THEN RETURN p_actor=vendor_owner AND p_recipient=client_id; END IF;
  RETURN ((p_actor=client_id AND p_recipient=vendor_owner AND p_data->>'senderRole'='client') OR
          (p_actor=vendor_owner AND p_recipient=client_id AND p_data->>'senderRole'='vendor')) AND EXISTS
    (SELECT 1 FROM public.quote_messages WHERE quote_id=q_id AND sender_id=p_actor AND created_at>=now()-interval '5 minutes');
END $$;
REVOKE ALL ON FUNCTION public.wm_notification_allowed(uuid,uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.wm_notification_allowed(uuid,uuid,text,jsonb) TO authenticated;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_recipient_select ON public.notifications FOR SELECT TO authenticated USING (recipient_id=(SELECT auth.uid()));
CREATE POLICY notifications_member_insert ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.wm_notification_allowed(recipient_id,actor_id,type,data));
CREATE POLICY notifications_recipient_update ON public.notifications FOR UPDATE TO authenticated
  USING (recipient_id=(SELECT auth.uid())) WITH CHECK (recipient_id=(SELECT auth.uid()));
CREATE POLICY notifications_recipient_delete ON public.notifications FOR DELETE TO authenticated USING (recipient_id=(SELECT auth.uid()));
REVOKE UPDATE ON public.notifications FROM authenticated;
GRANT UPDATE(read_at,deleted_at) ON public.notifications TO authenticated;

CREATE INDEX IF NOT EXISTS vendor_spaces_vendor_id_idx ON public.vendor_spaces(vendor_id);
CREATE INDEX IF NOT EXISTS quote_messages_sender_id_idx ON public.quote_messages(sender_id);
CREATE INDEX IF NOT EXISTS vendor_amenities_amenity_key_idx ON public.vendor_amenities(amenity_key);
CREATE INDEX IF NOT EXISTS vendor_categories_category_id_idx ON public.vendor_categories(category_id);
CREATE INDEX IF NOT EXISTS notifications_actor_created_idx ON public.notifications(actor_id,created_at);
CREATE INDEX IF NOT EXISTS rfq_invites_vendor_activity_idx ON public.rfq_invites(vendor_id,last_activity_at DESC);
CREATE INDEX IF NOT EXISTS notifications_recipient_unread_idx ON public.notifications(recipient_id,created_at DESC) WHERE read_at IS NULL AND deleted_at IS NULL;
-- Remove duplicate timestamp work; keep the canonical quotes_set_updated_at trigger.
DROP TRIGGER IF EXISTS trg_quotes_touch ON public.quotes;
NOTIFY pgrst, 'reload schema';
COMMIT;
$wm_4a960a418ed6$]);
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';

-- All section writes, including settings, commit together. Invoker authority
-- preserves RLS, and the vendor row lock serializes concurrent replacements.
CREATE FUNCTION public.replace_vendor_section(p_vendor uuid,p_section text,p_rows jsonb,p_settings jsonb DEFAULT '{}'::jsonb)
RETURNS void LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  PERFORM 1 FROM public.vendors WHERE id=p_vendor AND owner_id=auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Vendor ownership required.' USING ERRCODE='42501'; END IF;
  IF jsonb_typeof(p_rows) IS DISTINCT FROM 'array' OR jsonb_typeof(p_settings) IS DISTINCT FROM 'object'
     OR pg_column_size(p_rows)>131072 OR pg_column_size(p_settings)>16384 OR jsonb_array_length(p_rows)>366 THEN
    RAISE EXCEPTION 'Invalid or oversized section.' USING ERRCODE='22023'; END IF;
  IF p_section='pricing' THEN
    IF jsonb_array_length(p_rows)>100 THEN RAISE EXCEPTION 'Too many pricing items.'; END IF;
    DELETE FROM public.vendor_pricing WHERE vendor_id=p_vendor;
    INSERT INTO public.vendor_pricing(vendor_id,item_key,price_cents,currency,contact_for_price,notes)
      SELECT p_vendor,x.item_key,x.price_cents,coalesce(x.currency,'USD'),coalesce(x.contact_for_price,false),coalesce(x.notes,'{}'::jsonb)
      FROM jsonb_to_recordset(p_rows) AS x(item_key text,price_cents bigint,currency text,contact_for_price boolean,notes jsonb);
    IF EXISTS (SELECT 1 FROM public.vendor_pricing WHERE vendor_id=p_vendor AND
      (length(item_key)>120 OR length(currency)<>3 OR price_cents<0)) THEN RAISE EXCEPTION 'Invalid pricing item.'; END IF;
    UPDATE public.vendors SET
      pricing_typical_spend_cents=(p_settings->>'pricing_typical_spend_cents')::bigint,
      pricing_typical_spend_currency=coalesce(p_settings->>'pricing_typical_spend_currency','USD'),
      pricing_peak_seasons=ARRAY(SELECT jsonb_array_elements_text(coalesce(p_settings->'pricing_peak_seasons','[]'::jsonb))) WHERE id=p_vendor;
  ELSIF p_section='amenities' THEN
    DELETE FROM public.vendor_amenities WHERE vendor_id=p_vendor;
    INSERT INTO public.vendor_amenities(vendor_id,amenity_key)
      SELECT p_vendor,x.amenity_key FROM jsonb_to_recordset(p_rows) AS x(amenity_key text);
    UPDATE public.vendors SET capacity_max=(p_settings->>'capacity_max')::integer,
      event_types=ARRAY(SELECT jsonb_array_elements_text(coalesce(p_settings->'event_types','[]'::jsonb))) WHERE id=p_vendor;
  ELSIF p_section='team' THEN
    IF jsonb_array_length(p_rows)>50 THEN RAISE EXCEPTION 'Too many team members.'; END IF;
    DELETE FROM public.vendor_team WHERE vendor_id=p_vendor;
    INSERT INTO public.vendor_team(vendor_id,name,title,bio,headshot_url,responds_within_hours,sort_order)
      SELECT p_vendor,x.name,x.title,x.bio,x.headshot_url,x.responds_within_hours,x.sort_order
      FROM jsonb_to_recordset(p_rows) AS x(name text,title jsonb,bio jsonb,headshot_url text,responds_within_hours integer,sort_order integer);
  ELSIF p_section='availability' THEN
    DELETE FROM public.vendor_availability WHERE vendor_id=p_vendor;
    INSERT INTO public.vendor_availability(vendor_id,available_on,availability_status)
      SELECT p_vendor,x.available_on,coalesce(x.availability_status,'available')
      FROM jsonb_to_recordset(p_rows) AS x(available_on date,availability_status text);
  ELSE RAISE EXCEPTION 'Unknown vendor section.' USING ERRCODE='22023'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.replace_vendor_section(uuid,text,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.replace_vendor_section(uuid,text,jsonb,jsonb) TO authenticated;

CREATE FUNCTION public.accept_vendor_quote(p_rfq uuid,p_quote uuid,p_reveal_email boolean DEFAULT false,p_reveal_phone boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.rfqs; q public.quotes; i public.rfq_invites;
BEGIN
  SELECT * INTO r FROM public.rfqs WHERE id=p_rfq AND owner_id=auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request ownership required.' USING ERRCODE='42501'; END IF;
  SELECT * INTO q FROM public.quotes WHERE id=p_quote AND rfq_id=p_rfq;
  IF NOT FOUND THEN RAISE EXCEPTION 'Quote does not belong to this request.' USING ERRCODE='22023'; END IF;
  IF r.accepted_quote_id IS NOT NULL THEN
    IF r.accepted_quote_id=p_quote THEN RETURN jsonb_build_object('vendorId',q.vendor_id,'alreadyAccepted',true); END IF;
    RAISE EXCEPTION 'A quote has already been accepted.' USING ERRCODE='23505';
  END IF;
  SELECT * INTO i FROM public.rfq_invites WHERE rfq_id=p_rfq AND vendor_id=q.vendor_id FOR UPDATE;
  IF NOT FOUND OR i.status IN ('declined','expired') OR i.closed_at IS NOT NULL OR i.expires_at<=now() THEN
    RAISE EXCEPTION 'This invitation is closed or expired.' USING ERRCODE='22023'; END IF;
  UPDATE public.rfqs SET accepted_quote_id=p_quote,accepted_at=now() WHERE id=p_rfq;
  UPDATE public.rfq_invites SET status='accepted',reveal_email=coalesce(p_reveal_email,false),reveal_phone=coalesce(p_reveal_phone,false),
    last_activity_at=now(),client_last_read_at=now(),closed_at=NULL,closed_reason=NULL WHERE rfq_id=p_rfq AND vendor_id=q.vendor_id;
  UPDATE public.rfq_invites SET status='declined',closed_at=now(),closed_reason='accepted_other_vendor',last_activity_at=now()
    WHERE rfq_id=p_rfq AND vendor_id<>q.vendor_id;
  RETURN jsonb_build_object('vendorId',q.vendor_id,'alreadyAccepted',false);
END $$;
REVOKE ALL ON FUNCTION public.accept_vendor_quote(uuid,uuid,boolean,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.accept_vendor_quote(uuid,uuid,boolean,boolean) TO authenticated;

-- A valid accepted quote must always belong to the same RFQ and invitation.
CREATE FUNCTION public.wm_guard_rfq_booking() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  IF current_user IN ('postgres','supabase_admin','service_role') THEN RETURN NEW; END IF;
  IF TG_OP='UPDATE' AND OLD.accepted_quote_id IS NOT NULL AND
     ROW(NEW.accepted_quote_id,NEW.accepted_at) IS DISTINCT FROM ROW(OLD.accepted_quote_id,OLD.accepted_at) THEN
    RAISE EXCEPTION 'An accepted booking cannot be replaced.' USING ERRCODE='42501'; END IF;
  IF NEW.accepted_quote_id IS NOT NULL AND (TG_OP='INSERT' OR NEW.accepted_quote_id IS DISTINCT FROM OLD.accepted_quote_id) THEN
    IF NOT EXISTS (SELECT 1 FROM public.quotes q JOIN public.rfq_invites i ON i.rfq_id=q.rfq_id AND i.vendor_id=q.vendor_id
      WHERE q.id=NEW.accepted_quote_id AND q.rfq_id=NEW.id AND i.status NOT IN ('declined','expired')
      AND i.closed_at IS NULL AND (i.expires_at IS NULL OR i.expires_at>now())) THEN
      RAISE EXCEPTION 'Invalid booking linkage.' USING ERRCODE='42501'; END IF;
    NEW.accepted_at:=now();
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.wm_guard_rfq_booking() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER wm_guard_rfq_booking BEFORE INSERT OR UPDATE ON public.rfqs FOR EACH ROW EXECUTE FUNCTION public.wm_guard_rfq_booking();

CREATE FUNCTION public.wm_guard_message() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  IF current_user IN ('postgres','supabase_admin','service_role') THEN RETURN NEW; END IF;
  IF length(trim(NEW.body)) NOT BETWEEN 1 AND 10000 OR NOT EXISTS (
    SELECT 1 FROM public.quotes q JOIN public.rfqs r ON r.id=q.rfq_id
    JOIN public.rfq_invites i ON i.rfq_id=q.rfq_id AND i.vendor_id=q.vendor_id
    WHERE q.id=NEW.quote_id AND i.closed_at IS NULL AND i.status NOT IN ('declined','expired') AND
      ((r.accepted_quote_id IS NULL AND (i.expires_at IS NULL OR i.expires_at>now())) OR
       EXISTS (SELECT 1 FROM public.quotes winning WHERE winning.id=r.accepted_quote_id AND winning.vendor_id=q.vendor_id))) THEN
    RAISE EXCEPTION 'This conversation is closed or the message is invalid.' USING ERRCODE='42501'; END IF;
  NEW.created_at:=now(); NEW.updated_at:=now();
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.wm_guard_message() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER wm_guard_message BEFORE INSERT ON public.quote_messages FOR EACH ROW EXECUTE FUNCTION public.wm_guard_message();
NOTIFY pgrst,'reload schema';
INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES ('202610190002','atomic_workflows',ARRAY[$wm_6285d3cfb3bd$BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';

-- All section writes, including settings, commit together. Invoker authority
-- preserves RLS, and the vendor row lock serializes concurrent replacements.
CREATE FUNCTION public.replace_vendor_section(p_vendor uuid,p_section text,p_rows jsonb,p_settings jsonb DEFAULT '{}'::jsonb)
RETURNS void LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  PERFORM 1 FROM public.vendors WHERE id=p_vendor AND owner_id=auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Vendor ownership required.' USING ERRCODE='42501'; END IF;
  IF jsonb_typeof(p_rows) IS DISTINCT FROM 'array' OR jsonb_typeof(p_settings) IS DISTINCT FROM 'object'
     OR pg_column_size(p_rows)>131072 OR pg_column_size(p_settings)>16384 OR jsonb_array_length(p_rows)>366 THEN
    RAISE EXCEPTION 'Invalid or oversized section.' USING ERRCODE='22023'; END IF;
  IF p_section='pricing' THEN
    IF jsonb_array_length(p_rows)>100 THEN RAISE EXCEPTION 'Too many pricing items.'; END IF;
    DELETE FROM public.vendor_pricing WHERE vendor_id=p_vendor;
    INSERT INTO public.vendor_pricing(vendor_id,item_key,price_cents,currency,contact_for_price,notes)
      SELECT p_vendor,x.item_key,x.price_cents,coalesce(x.currency,'USD'),coalesce(x.contact_for_price,false),coalesce(x.notes,'{}'::jsonb)
      FROM jsonb_to_recordset(p_rows) AS x(item_key text,price_cents bigint,currency text,contact_for_price boolean,notes jsonb);
    IF EXISTS (SELECT 1 FROM public.vendor_pricing WHERE vendor_id=p_vendor AND
      (length(item_key)>120 OR length(currency)<>3 OR price_cents<0)) THEN RAISE EXCEPTION 'Invalid pricing item.'; END IF;
    UPDATE public.vendors SET
      pricing_typical_spend_cents=(p_settings->>'pricing_typical_spend_cents')::bigint,
      pricing_typical_spend_currency=coalesce(p_settings->>'pricing_typical_spend_currency','USD'),
      pricing_peak_seasons=ARRAY(SELECT jsonb_array_elements_text(coalesce(p_settings->'pricing_peak_seasons','[]'::jsonb))) WHERE id=p_vendor;
  ELSIF p_section='amenities' THEN
    DELETE FROM public.vendor_amenities WHERE vendor_id=p_vendor;
    INSERT INTO public.vendor_amenities(vendor_id,amenity_key)
      SELECT p_vendor,x.amenity_key FROM jsonb_to_recordset(p_rows) AS x(amenity_key text);
    UPDATE public.vendors SET capacity_max=(p_settings->>'capacity_max')::integer,
      event_types=ARRAY(SELECT jsonb_array_elements_text(coalesce(p_settings->'event_types','[]'::jsonb))) WHERE id=p_vendor;
  ELSIF p_section='team' THEN
    IF jsonb_array_length(p_rows)>50 THEN RAISE EXCEPTION 'Too many team members.'; END IF;
    DELETE FROM public.vendor_team WHERE vendor_id=p_vendor;
    INSERT INTO public.vendor_team(vendor_id,name,title,bio,headshot_url,responds_within_hours,sort_order)
      SELECT p_vendor,x.name,x.title,x.bio,x.headshot_url,x.responds_within_hours,x.sort_order
      FROM jsonb_to_recordset(p_rows) AS x(name text,title jsonb,bio jsonb,headshot_url text,responds_within_hours integer,sort_order integer);
  ELSIF p_section='availability' THEN
    DELETE FROM public.vendor_availability WHERE vendor_id=p_vendor;
    INSERT INTO public.vendor_availability(vendor_id,available_on,availability_status)
      SELECT p_vendor,x.available_on,coalesce(x.availability_status,'available')
      FROM jsonb_to_recordset(p_rows) AS x(available_on date,availability_status text);
  ELSE RAISE EXCEPTION 'Unknown vendor section.' USING ERRCODE='22023'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.replace_vendor_section(uuid,text,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.replace_vendor_section(uuid,text,jsonb,jsonb) TO authenticated;

CREATE FUNCTION public.accept_vendor_quote(p_rfq uuid,p_quote uuid,p_reveal_email boolean DEFAULT false,p_reveal_phone boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.rfqs; q public.quotes; i public.rfq_invites;
BEGIN
  SELECT * INTO r FROM public.rfqs WHERE id=p_rfq AND owner_id=auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request ownership required.' USING ERRCODE='42501'; END IF;
  SELECT * INTO q FROM public.quotes WHERE id=p_quote AND rfq_id=p_rfq;
  IF NOT FOUND THEN RAISE EXCEPTION 'Quote does not belong to this request.' USING ERRCODE='22023'; END IF;
  IF r.accepted_quote_id IS NOT NULL THEN
    IF r.accepted_quote_id=p_quote THEN RETURN jsonb_build_object('vendorId',q.vendor_id,'alreadyAccepted',true); END IF;
    RAISE EXCEPTION 'A quote has already been accepted.' USING ERRCODE='23505';
  END IF;
  SELECT * INTO i FROM public.rfq_invites WHERE rfq_id=p_rfq AND vendor_id=q.vendor_id FOR UPDATE;
  IF NOT FOUND OR i.status IN ('declined','expired') OR i.closed_at IS NOT NULL OR i.expires_at<=now() THEN
    RAISE EXCEPTION 'This invitation is closed or expired.' USING ERRCODE='22023'; END IF;
  UPDATE public.rfqs SET accepted_quote_id=p_quote,accepted_at=now() WHERE id=p_rfq;
  UPDATE public.rfq_invites SET status='accepted',reveal_email=coalesce(p_reveal_email,false),reveal_phone=coalesce(p_reveal_phone,false),
    last_activity_at=now(),client_last_read_at=now(),closed_at=NULL,closed_reason=NULL WHERE rfq_id=p_rfq AND vendor_id=q.vendor_id;
  UPDATE public.rfq_invites SET status='declined',closed_at=now(),closed_reason='accepted_other_vendor',last_activity_at=now()
    WHERE rfq_id=p_rfq AND vendor_id<>q.vendor_id;
  RETURN jsonb_build_object('vendorId',q.vendor_id,'alreadyAccepted',false);
END $$;
REVOKE ALL ON FUNCTION public.accept_vendor_quote(uuid,uuid,boolean,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.accept_vendor_quote(uuid,uuid,boolean,boolean) TO authenticated;

-- A valid accepted quote must always belong to the same RFQ and invitation.
CREATE FUNCTION public.wm_guard_rfq_booking() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  IF current_user IN ('postgres','supabase_admin','service_role') THEN RETURN NEW; END IF;
  IF TG_OP='UPDATE' AND OLD.accepted_quote_id IS NOT NULL AND
     ROW(NEW.accepted_quote_id,NEW.accepted_at) IS DISTINCT FROM ROW(OLD.accepted_quote_id,OLD.accepted_at) THEN
    RAISE EXCEPTION 'An accepted booking cannot be replaced.' USING ERRCODE='42501'; END IF;
  IF NEW.accepted_quote_id IS NOT NULL AND (TG_OP='INSERT' OR NEW.accepted_quote_id IS DISTINCT FROM OLD.accepted_quote_id) THEN
    IF NOT EXISTS (SELECT 1 FROM public.quotes q JOIN public.rfq_invites i ON i.rfq_id=q.rfq_id AND i.vendor_id=q.vendor_id
      WHERE q.id=NEW.accepted_quote_id AND q.rfq_id=NEW.id AND i.status NOT IN ('declined','expired')
      AND i.closed_at IS NULL AND (i.expires_at IS NULL OR i.expires_at>now())) THEN
      RAISE EXCEPTION 'Invalid booking linkage.' USING ERRCODE='42501'; END IF;
    NEW.accepted_at:=now();
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.wm_guard_rfq_booking() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER wm_guard_rfq_booking BEFORE INSERT OR UPDATE ON public.rfqs FOR EACH ROW EXECUTE FUNCTION public.wm_guard_rfq_booking();

CREATE FUNCTION public.wm_guard_message() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  IF current_user IN ('postgres','supabase_admin','service_role') THEN RETURN NEW; END IF;
  IF length(trim(NEW.body)) NOT BETWEEN 1 AND 10000 OR NOT EXISTS (
    SELECT 1 FROM public.quotes q JOIN public.rfqs r ON r.id=q.rfq_id
    JOIN public.rfq_invites i ON i.rfq_id=q.rfq_id AND i.vendor_id=q.vendor_id
    WHERE q.id=NEW.quote_id AND i.closed_at IS NULL AND i.status NOT IN ('declined','expired') AND
      ((r.accepted_quote_id IS NULL AND (i.expires_at IS NULL OR i.expires_at>now())) OR
       EXISTS (SELECT 1 FROM public.quotes winning WHERE winning.id=r.accepted_quote_id AND winning.vendor_id=q.vendor_id))) THEN
    RAISE EXCEPTION 'This conversation is closed or the message is invalid.' USING ERRCODE='42501'; END IF;
  NEW.created_at:=now(); NEW.updated_at:=now();
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.wm_guard_message() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER wm_guard_message BEFORE INSERT ON public.quote_messages FOR EACH ROW EXECUTE FUNCTION public.wm_guard_message();
NOTIFY pgrst,'reload schema';
COMMIT;
$wm_6285d3cfb3bd$]);
SELECT json_build_object('result','authorization repair applied','version',version(),
 'protected_tables',(SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity),
 'anon_quote_view',has_table_privilege('anon','public.vendor_latest_quotes','SELECT'),
 'anon_truncate_vendors',has_table_privilege('anon','public.vendors','TRUNCATE'),
 'auth_truncate_rfqs',has_table_privilege('authenticated','public.rfqs','TRUNCATE'),
 'auth_schema_create',has_schema_privilege('authenticated','public','CREATE'),
 'migrations',(SELECT json_agg(version ORDER BY version) FROM supabase_migrations.schema_migrations)) AS verification;
COMMIT;
