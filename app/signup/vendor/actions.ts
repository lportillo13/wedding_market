'use server';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';
import { parseMediaAsset } from '@/lib/images';
import { buildStorageKey, processCarouselLogoUpload, processImageUpload, validateImageUpload } from '@/lib/media-processing';
import { deleteFromR2, getR2ObjectKeyFromUrl, isR2Configured, uploadToR2 } from '@/lib/r2';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/slugify';
import type { MediaAsset } from '@/types/images';

const VendorSignupSchema = z.object({
  owner_name: z.string().trim().max(200, 'Name is too long.').optional(),
  email: z.string().trim().email('Enter a valid email address.').optional(),
  password: z.string().trim().min(6, 'Password must be at least 6 characters.').optional(),
  account_language: z.enum(['en', 'es']).optional().default('en'),
  business_name: z.string().trim().min(2, 'Business name is required.').max(120, 'Business name is too long.'),
  tagline: z.string().trim().min(12, 'Add a short intro for couples.').max(320, 'Intro is too long.'),
  categories: z.array(z.string().trim().min(1)).max(12),
  city: z.string().trim().max(120, 'City is too long.').optional(),
  state: z.string().trim().max(120, 'State is too long.').optional(),
  country: z.string().trim().min(1, 'Country is required.').max(120, 'Country is too long.'),
  service_radius_km: z.number().int().min(1, 'Service radius must be at least 1 km.').max(500, 'Service radius is too large.'),
  event_types: z.array(z.string().trim().min(1).max(60)).max(8),
  service_style: z.string().trim().max(160, 'Service style is too long.').optional(),
  phone: z.string().trim().max(40, 'Phone number is too long.').optional(),
  website_url: z.string().trim().max(200, 'Website URL is too long.').optional(),
  address_label: z.string().trim().max(200, 'Address is too long.').optional(),
  languages: z.array(z.string().trim().min(1).max(60)).max(8),
  years_in_business: z.number().int().min(0, 'Years in business must be 0 or more.').max(80, 'Years in business is too large.').nullable(),
  team_size_range: z.string().trim().max(80, 'Team size is too long.').optional(),
  starting_price: z.number().min(0, 'Starting price must be 0 or more.').nullable(),
  starting_price_currency: z.string().trim().min(3).max(3),
  typical_spend: z.number().min(0, 'Typical spend must be 0 or more.').nullable(),
  peak_seasons: z.array(z.string().trim().min(1).max(40)).max(4),
  booking_lead_time: z.string().trim().max(120, 'Booking lead time is too long.').optional(),
  instagram_handle: z.string().trim().max(100, 'Instagram handle is too long.').optional(),
});

export type VendorSignUpState =
  | { ok: false; message?: string }
  | { ok: true; redirectTo: string };

type UploadedVendorAssets = {
  hero: MediaAsset;
  logo: MediaAsset;
  carouselLogo: MediaAsset;
};

function parseInteger(value: FormDataEntryValue | null, fallback: number | null = null): number | null {
  const text = String(value ?? '').trim();
  if (!text) return fallback;
  const parsed = Number.parseInt(text, 10);
  return Number.isInteger(parsed) ? parsed : fallback;
}

function parseAmount(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? '').trim();
  if (!text) return null;
  const normalized = text.replace(/[^0-9,.-]/g, '').replace(/,/g, '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function toCents(value: number | null): number | null {
  return value === null ? null : Math.round(value * 100);
}

function parseCsv(value: FormDataEntryValue | null): string[] {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function dedupe(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function readRequiredImageFile(entry: FormDataEntryValue | null, missingMessage: string) {
  if (!(entry instanceof File)) {
    return { file: null, error: missingMessage };
  }

  const validation = validateImageUpload(entry);
  if (validation) {
    return { file: null, error: validation };
  }

  return { file: entry, error: null };
}

async function uploadVendorImage(parts: string[], file: File): Promise<MediaAsset> {
  const processed = await processImageUpload(file);
  const key = buildStorageKey(parts, processed.extension);
  const uploaded = await uploadToR2({
    key,
    body: processed.buffer,
    contentType: processed.contentType,
  });

  return {
    ...processed.asset,
    type: 'image',
    url: uploaded.url,
    public_id: key,
  };
}

async function uploadVendorCarouselLogo(parts: string[], file: File): Promise<MediaAsset> {
  const processed = await processCarouselLogoUpload(file);
  const key = buildStorageKey(parts, processed.extension);
  const uploaded = await uploadToR2({
    key,
    body: processed.buffer,
    contentType: processed.contentType,
  });

  return {
    ...processed.asset,
    type: 'image',
    url: uploaded.url,
    public_id: key,
  };
}

async function cleanupUploadedAssets(assets: MediaAsset[]) {
  await Promise.all(
    assets
      .map((asset) => asset.public_id)
      .filter(Boolean)
      .map(async (publicId) => {
        try {
          await deleteFromR2(publicId);
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('Failed to clean up uploaded vendor asset', error);
          }
        }
      }),
  );
}

async function removePreviousVendorAssets(
  previousLogoUrl: string | null | undefined,
  previousCarouselLogoUrl: string | null | undefined,
  previousHero: unknown,
) {
  const previousHeroAsset = parseMediaAsset(previousHero);
  const keys = [
    previousLogoUrl ? getR2ObjectKeyFromUrl(previousLogoUrl) : null,
    previousCarouselLogoUrl ? getR2ObjectKeyFromUrl(previousCarouselLogoUrl) : null,
    previousHeroAsset?.url ? getR2ObjectKeyFromUrl(previousHeroAsset.url) : null,
  ]
    .filter((value): value is string => Boolean(value))
    .filter((value, index, items) => items.indexOf(value) === index);

  await Promise.all(
    keys.map(async (key) => {
      try {
        await deleteFromR2(key);
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Failed to remove previous vendor asset', error);
        }
      }
    }),
  );
}

async function uploadRequiredVendorAssets(params: {
  businessName: string;
  slug: string;
  heroFile: File;
  logoFile: File;
}) {
  const vendorFolder = slugify(params.businessName || params.slug) || params.slug;
  const [hero, logo, carouselLogo] = await Promise.all([
    uploadVendorImage(['vendors', vendorFolder, 'hero'], params.heroFile),
    uploadVendorImage(['vendors', vendorFolder, 'logo'], params.logoFile),
    uploadVendorCarouselLogo(['vendors', vendorFolder, 'carousel-logo'], params.logoFile),
  ]);

  return { hero, logo, carouselLogo } satisfies UploadedVendorAssets;
}

export async function createVendor(_: VendorSignUpState, formData: FormData): Promise<VendorSignUpState> {
  const parsed = VendorSignupSchema.safeParse({
    owner_name: formData.get('owner_name'),
    email: formData.get('email'),
    password: formData.get('password'),
    account_language: formData.get('account_language'),
    business_name: formData.get('business_name'),
    tagline: formData.get('tagline'),
    categories: formData.getAll('categories').map((value) => String(value ?? '').trim()).filter(Boolean),
    city: formData.get('city'),
    state: formData.get('state'),
    country: formData.get('country'),
    service_radius_km: parseInteger(formData.get('service_radius_km'), 50),
    event_types: formData.getAll('event_types').map((value) => String(value ?? '').trim()).filter(Boolean),
    service_style: formData.get('service_style'),
    phone: formData.get('phone'),
    website_url: formData.get('website_url'),
    address_label: formData.get('address_label'),
    languages: dedupe([
      ...formData.getAll('languages').map((value) => String(value ?? '').trim()),
      ...parseCsv(formData.get('other_languages')),
    ]),
    years_in_business: parseInteger(formData.get('years_in_business')),
    team_size_range: formData.get('team_size_range'),
    starting_price: parseAmount(formData.get('starting_price')),
    starting_price_currency: String(formData.get('starting_price_currency') ?? 'USD').trim().toUpperCase() || 'USD',
    typical_spend: parseAmount(formData.get('typical_spend')),
    peak_seasons: formData.getAll('peak_seasons').map((value) => String(value ?? '').trim()).filter(Boolean),
    booking_lead_time: formData.get('booking_lead_time'),
    instagram_handle: String(formData.get('instagram_handle') ?? '').trim().replace(/^@+/, ''),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  if (!isR2Configured()) {
    return { ok: false, message: 'Image storage is not configured. Add the R2 environment variables first.' };
  }

  const logoFileResult = readRequiredImageFile(formData.get('logo_file'), 'Please upload a logo image.');
  if (logoFileResult.error || !logoFileResult.file) {
    return { ok: false, message: logoFileResult.error ?? 'Please upload a logo image.' };
  }

  const heroFileResult = readRequiredImageFile(formData.get('hero_file'), 'Please upload a hero image.');
  if (heroFileResult.error || !heroFileResult.file) {
    return { ok: false, message: heroFileResult.error ?? 'Please upload a hero image.' };
  }

  const {
    owner_name,
    email,
    password,
    account_language,
    business_name,
    tagline,
    categories,
    city,
    state,
    country,
    service_radius_km,
    event_types,
    service_style,
    phone,
    website_url,
    address_label,
    languages,
    years_in_business,
    team_size_range,
    starting_price,
    starting_price_currency,
    typical_spend,
    peak_seasons,
    booking_lead_time,
    instagram_handle,
  } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: initialUser },
    error: userErr,
  } = await supabase.auth.getUser();
  let user = initialUser;

  if (userErr) {
    return { ok: false, message: userErr.message };
  }

  if (!user) {
    if (!owner_name?.trim()) {
      return { ok: false, message: 'Name is required.' };
    }
    if (!email?.trim()) {
      return { ok: false, message: 'Email is required.' };
    }
    if (!password?.trim()) {
      return { ok: false, message: 'Password is required.' };
    }

    const headerList = await headers();
    const proto = headerList.get('x-forwarded-proto');
    const host = headerList.get('x-forwarded-host') ?? headerList.get('host');

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      (proto && host ? `${proto}://${host}` : host ? `https://${host}` : 'http://localhost:3000');

    const emailRedirectTo = new URL('/auth/callback', siteUrl).toString();

    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          full_name: owner_name,
          language: account_language,
        },
      },
    });

    if (signUpErr) {
      return { ok: false, message: signUpErr.message };
    }

    const userId = signUpData.user?.id ?? signUpData.session?.user.id;
    if (!userId) {
      return {
        ok: false,
        message:
          'Sign up succeeded but user information is missing. Please check your email to confirm your account.',
      };
    }

    const supabaseAdmin = createSupabaseAdminClient();
    if (supabaseAdmin) {
      const { error: confirmErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email_confirm: true,
      });
      if (confirmErr) {
        return { ok: false, message: confirmErr.message };
      }
    }

    const profileClient = supabaseAdmin ?? supabase;
    const { error: bootstrapProfileErr } = await profileClient
      .from('profiles')
      .upsert(
        {
          id: userId,
          full_name: owner_name,
          phone: phone || null,
          country: country || null,
          language: account_language,
          role: 'user',
        },
        { onConflict: 'id' },
      );

    if (bootstrapProfileErr) {
      return { ok: false, message: bootstrapProfileErr.message };
    }

    if (!signUpData.session) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        return { ok: false, message: signInErr.message };
      }
    }

    const currentUserResult = await supabase.auth.getUser();
    user = currentUserResult.data.user;
  }

  if (!user) {
    return { ok: false, message: 'Unable to resolve your account for vendor registration.' };
  }

  const profilePayload: Record<string, unknown> = {
    id: user.id,
    phone: phone || null,
    country: country || null,
    language: account_language,
  };
  if (owner_name?.trim()) {
    profilePayload.full_name = owner_name.trim();
  }

  let slug = slugify(business_name);
  if (!slug) {
    slug = `vendor-${user.id.slice(0, 8)}`;
  }

  const { data: slugConflict } = await supabase
    .from('vendors')
    .select('id')
    .eq('slug', slug)
    .neq('owner_id', user.id)
    .maybeSingle();

  if (slugConflict) {
    slug = `${slug}-${user.id.slice(0, 4)}`;
  }

  const { data: existingVendor, error: existingVendorErr } = await supabase
    .from('vendors')
    .select('id, bio, extra_info, logo_url, carousel_logo_url, hero_image')
    .eq('owner_id', user.id)
    .maybeSingle<{
      id: string;
      bio: Record<string, unknown> | null;
      extra_info: Record<string, unknown> | null;
      logo_url: string | null;
      carousel_logo_url: string | null;
      hero_image: MediaAsset | null;
    }>();

  if (existingVendorErr) {
    return { ok: false, message: existingVendorErr.message };
  }

  const nextExtraInfo = {
    ...(existingVendor?.extra_info ?? {}),
    service_style: service_style || null,
    booking_lead_time: booking_lead_time || null,
    instagram_handle: instagram_handle || null,
  };

  const nextBio = {
    ...((existingVendor?.bio ?? {}) as Record<string, unknown>),
    en: tagline,
    es: tagline,
  };

  let uploadedAssets: UploadedVendorAssets;
  try {
    uploadedAssets = await uploadRequiredVendorAssets({
      businessName: business_name,
      slug,
      heroFile: heroFileResult.file,
      logoFile: logoFileResult.file,
    });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'We could not upload your vendor images right now.',
    };
  }

  const vendorPayload = {
    business_name,
    slug,
    bio: nextBio,
    extra_info: nextExtraInfo,
    phone: phone || null,
    website_url: normalizeUrl(website_url || '') || null,
    address_label: address_label || null,
    starting_price_cents: toCents(starting_price),
    starting_price_currency,
    event_types,
    years_in_business,
    languages,
    team_size_range: team_size_range || null,
    pricing_typical_spend_cents: toCents(typical_spend),
    pricing_typical_spend_currency: starting_price_currency,
    pricing_peak_seasons: peak_seasons,
    hero_image: uploadedAssets.hero,
    logo_url: uploadedAssets.logo.url,
    carousel_logo_url: uploadedAssets.carouselLogo.url,
    is_published: false,
  };

  let vendorId = existingVendor?.id ?? null;

  if (!vendorId) {
    const { data: inserted, error: insertErr } = await supabase
      .from('vendors')
      .insert({
        owner_id: user.id,
        ...vendorPayload,
      })
      .select('id')
      .single();

    if (insertErr) {
      await cleanupUploadedAssets([uploadedAssets.hero, uploadedAssets.logo, uploadedAssets.carouselLogo]);
      return { ok: false, message: insertErr.message };
    }

    vendorId = inserted?.id ?? null;
  } else {
    const { error: updateErr } = await supabase
      .from('vendors')
      .update(vendorPayload)
      .eq('id', vendorId);
    if (updateErr) {
      await cleanupUploadedAssets([uploadedAssets.hero, uploadedAssets.logo, uploadedAssets.carouselLogo]);
      return { ok: false, message: updateErr.message };
    }
  }

  if (!vendorId) {
    await cleanupUploadedAssets([uploadedAssets.hero, uploadedAssets.logo, uploadedAssets.carouselLogo]);
    return { ok: false, message: 'Could not determine vendor profile.' };
  }

  const { error: locationErr } = await supabase
    .from('vendor_locations')
    .upsert(
      {
        vendor_id: vendorId,
        address: null,
        city: city || null,
        state: state || null,
        country: country || null,
        lat: null,
        lng: null,
        service_radius_km,
      },
      { onConflict: 'vendor_id' },
    );

  if (locationErr) {
    await cleanupUploadedAssets([uploadedAssets.hero, uploadedAssets.logo, uploadedAssets.carouselLogo]);
    return { ok: false, message: locationErr.message };
  }

  let categoryRows: { id: string; key: string }[] = [];
  if (categories.length) {
    const { data, error: categoryErr } = await supabase
      .from('categories')
      .select('id, key')
      .in('key', categories);

    if (categoryErr) {
      await cleanupUploadedAssets([uploadedAssets.hero, uploadedAssets.logo, uploadedAssets.carouselLogo]);
      return { ok: false, message: categoryErr.message };
    }

    categoryRows = data ?? [];
  }

  const { error: deleteCategoryErr } = await supabase
    .from('vendor_categories')
    .delete()
    .eq('vendor_id', vendorId);

  if (deleteCategoryErr) {
    await cleanupUploadedAssets([uploadedAssets.hero, uploadedAssets.logo, uploadedAssets.carouselLogo]);
    return { ok: false, message: deleteCategoryErr.message };
  }

  if (categoryRows.length) {
    const { error: insertCategoryErr } = await supabase
      .from('vendor_categories')
      .insert(categoryRows.map((category) => ({ vendor_id: vendorId, category_id: category.id })));

    if (insertCategoryErr) {
      await cleanupUploadedAssets([uploadedAssets.hero, uploadedAssets.logo, uploadedAssets.carouselLogo]);
      return { ok: false, message: insertCategoryErr.message };
    }
  }

  const { error: profileErr } = await supabase
    .from('profiles')
    .upsert(
      {
        ...profilePayload,
        role: 'vendor',
      },
      { onConflict: 'id' },
    );
  if (profileErr) {
    await cleanupUploadedAssets([uploadedAssets.hero, uploadedAssets.logo, uploadedAssets.carouselLogo]);
    return { ok: false, message: profileErr.message };
  }

  if (existingVendor?.logo_url || existingVendor?.carousel_logo_url || existingVendor?.hero_image) {
    await removePreviousVendorAssets(existingVendor.logo_url, existingVendor.carousel_logo_url, existingVendor.hero_image);
  }

  revalidatePath('/vendor/profile');
  revalidatePath('/vendor');

  return { ok: true, redirectTo: '/vendor/profile' };
}
