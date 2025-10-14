-- Manual migration script to support localized client profile answers and AI-assisted translations.
-- Execute the statements below in Supabase SQL editor (or psql) in the order they appear.

-- 1. Create a shared languages lookup table so we can expand supported locales without
--    editing table constraints every time we add a new language.
CREATE TABLE IF NOT EXISTS public.languages (
    code text PRIMARY KEY,
    name text NOT NULL,
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed the table with the currently supported languages. Future languages can be added with
-- additional INSERT statements (e.g. INSERT INTO public.languages VALUES ('fr', 'French', false);).
INSERT INTO public.languages (code, name, is_default)
VALUES
    ('en', 'English', true),
    ('es', 'Spanish', false)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    is_default = EXCLUDED.is_default;

-- 2. Relax the profiles.language constraint so it references the lookup table instead of a hard-coded check.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_language_check;
ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_language_fkey
        FOREIGN KEY (language) REFERENCES public.languages(code)
        ON UPDATE CASCADE;

-- 3. Table to store localized answers for every translatable profile field.
--    Each (profile_id, field, language) tuple stores a single translated value. The "field"
--    column should match the profile column/answer key (e.g. 'full_name', 'wedding_theme', 'about').
CREATE TABLE IF NOT EXISTS public.profile_translated_fields (
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    field text NOT NULL CHECK (field ~ '^[a-z0-9_]+$'),
    language text NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
    value text NOT NULL,
    translated_via text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (profile_id, field, language)
);

-- Helper trigger to keep updated_at in sync on every UPDATE.
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_translated_fields_updated_at
    ON public.profile_translated_fields;
CREATE TRIGGER trg_profile_translated_fields_updated_at
    BEFORE UPDATE ON public.profile_translated_fields
    FOR EACH ROW
    EXECUTE FUNCTION public.touch_updated_at();

-- 4. Backfill existing profile data into the translation table so current answers appear as the
--    default translation for the user's selected language. Add more INSERT statements here for any
--    additional text columns you want to localize.
INSERT INTO public.profile_translated_fields (profile_id, field, language, value, translated_via)
SELECT id, 'full_name', language, full_name, 'manual'
FROM public.profiles
WHERE full_name IS NOT NULL
ON CONFLICT (profile_id, field, language) DO NOTHING;

INSERT INTO public.profile_translated_fields (profile_id, field, language, value, translated_via)
SELECT id, 'country', language, country, 'manual'
FROM public.profiles
WHERE country IS NOT NULL
ON CONFLICT (profile_id, field, language) DO NOTHING;

INSERT INTO public.profile_translated_fields (profile_id, field, language, value, translated_via)
SELECT id, 'wedding_theme', language, wedding_theme, 'manual'
FROM public.profiles
WHERE wedding_theme IS NOT NULL
ON CONFLICT (profile_id, field, language) DO NOTHING;

-- 5. Convenience function to upsert translations from the application layer. This can be called
--    after running an AI translation (or manual entry) to persist the localized value.
CREATE OR REPLACE FUNCTION public.upsert_profile_translation(
    p_profile_id uuid,
    p_field text,
    p_language text,
    p_value text,
    p_translated_via text DEFAULT NULL
) RETURNS public.profile_translated_fields
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

-- 6. Convenience function to fetch the preferred translation with graceful fallback to the
--    profile's stored/default answer.
CREATE OR REPLACE FUNCTION public.profile_field_translation(
    p_profile_id uuid,
    p_field text,
    p_language text,
    p_fallback_language text DEFAULT NULL
) RETURNS text
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

-- 7. Basic access controls (adjust as needed for your project roles).
GRANT SELECT ON public.languages TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_translated_fields TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_profile_translation(uuid, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.profile_field_translation(uuid, text, text, text) TO authenticated;

ALTER TABLE public.profile_translated_fields ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own profile translations" ON public.profile_translated_fields;
CREATE POLICY "Users manage their own profile translations"
    ON public.profile_translated_fields
    FOR ALL
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());
