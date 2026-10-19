-- Recovered schema-only baseline from production catalogs, 2026-10-19.
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
