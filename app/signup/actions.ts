'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const weddingThemeValues = ['classic', 'boho', 'rustic', 'beach', 'garden', 'modern', 'vintage'] as const;
const planningStageValues = ['just-starting', 'venue-booked', 'shortlisting', 'ready-to-book'] as const;
const priorityServiceValues = ['venue', 'photography', 'planner', 'beauty', 'decor', 'catering', 'music'] as const;

const SignUpSchema = z.object({
  full_name: z.string().trim().min(1, 'Name is required.').max(200, 'Name is too long.'),
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  phone: z.string().trim().max(40, 'Phone number is too long.').optional(),
  celebration_city: z.string().trim().max(120, 'City is too long.').optional(),
  celebration_region: z.string().trim().max(120, 'Region is too long.').optional(),
  country: z.string().trim().min(1, 'Contact country is required.').max(80, 'Country is too long.'),
  tentative_wedding_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid wedding date.'),
  guest_count: z.number().int().positive('Enter a valid guest count.').nullable(),
  wedding_budget: z.number().min(0, 'Enter a valid budget.').nullable(),
  wedding_theme: z.enum(weddingThemeValues).nullable(),
  planning_stage: z.enum(planningStageValues),
  language: z.enum(['en', 'es']),
  priority_services: z.array(z.enum(priorityServiceValues)).min(1, 'Choose at least one vendor priority.'),
});

export type SignUpState =
  | { ok: false; message?: string }
  | { ok: true; redirectTo: string };

function parsePositiveInteger(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? '').trim();
  if (!text) return null;
  const parsed = Number.parseInt(text, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseNonNegativeNumber(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? '').trim();
  if (!text) return null;
  const parsed = Number.parseFloat(text);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export async function signUp(_: SignUpState, formData: FormData): Promise<SignUpState> {
  const parsed = SignUpSchema.safeParse({
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    password: formData.get('password'),
    phone: formData.get('phone'),
    celebration_city: formData.get('celebration_city'),
    celebration_region: formData.get('celebration_region'),
    country: formData.get('country'),
    tentative_wedding_date: formData.get('tentative_wedding_date'),
    guest_count: parsePositiveInteger(formData.get('guest_count')),
    wedding_budget: parseNonNegativeNumber(formData.get('wedding_budget')),
    wedding_theme: String(formData.get('wedding_theme') ?? '').trim() || null,
    planning_stage: formData.get('planning_stage'),
    language: formData.get('language'),
    priority_services: formData.getAll('priority_services').map((value) => String(value ?? '').trim()).filter(Boolean),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const {
    full_name,
    email,
    password,
    phone,
    celebration_city,
    celebration_region,
    country,
    tentative_wedding_date,
    guest_count,
    wedding_budget,
    wedding_theme,
    planning_stage,
    language,
    priority_services,
  } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const headerList = await headers();
  const proto = headerList.get('x-forwarded-proto');
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host');

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (proto && host ? `${proto}://${host}` : host ? `https://${host}` : 'http://localhost:3000');

  const emailRedirectTo = new URL('/auth/callback', siteUrl).toString();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: {
        full_name,
        celebration_city: celebration_city || null,
        celebration_region: celebration_region || null,
        planning_stage,
        priority_services,
        language,
      },
    },
  });
  if (error) {
    return { ok: false, message: error.message };
  }

  const userId = data.user?.id ?? data.session?.user.id;
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
  const { error: profileErr } = await profileClient
    .from('profiles')
    .upsert(
      {
        id: userId,
        role: 'user',
        full_name,
        phone: phone || null,
        country: country || null,
        tentative_wedding_date,
        guest_count,
        wedding_budget,
        wedding_theme,
        language,
      },
      { onConflict: 'id' },
    );

  if (profileErr) {
    const message = profileErr.message.toLowerCase();
    if (!supabaseAdmin && message.includes('row-level security')) {
      console.warn(
        'Profile creation blocked by row-level security. Configure SUPABASE_SERVICE_ROLE_KEY to allow server-side profile provisioning.',
      );
    } else {
      return { ok: false, message: profileErr.message };
    }
  }

  if (!data.session) {
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr) {
      return { ok: false, message: signInErr.message };
    }
  }

  return { ok: true, redirectTo: '/account/profile' };
}
