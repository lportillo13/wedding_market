'use server';

import { z } from 'zod';
import { getSiteUrl } from '@/lib/site-url';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { authFeedbackKey } from '@/lib/auth-feedback';
import {checkSignupEmail} from './email-actions';
import {isExistingSignupResponse} from '@/features/auth/domain/signup-response';

const weddingThemeValues = ['classic', 'boho', 'rustic', 'beach', 'garden', 'modern', 'vintage'] as const;
const planningStageValues = ['just-starting', 'venue-booked', 'shortlisting', 'ready-to-book'] as const;
const priorityServiceValues = ['venue', 'photography', 'planner', 'beauty', 'decor', 'catering', 'music'] as const;

const SignUpSchema = z.object({
  full_name: z.string().trim().min(1, 'Name is required.').max(200, 'Name is too long.'),
  email: z.string().trim().max(254).email('Enter a valid email address.').transform(value => value.toLowerCase()),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
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
  | { ok: false; message?: string; feedback?: ReturnType<typeof authFeedbackKey> }
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
  const availability = await checkSignupEmail(email);
  if (!availability.ok) return availability;
  const supabase = await createSupabaseServerClient();

  const emailRedirectTo = new URL('/auth/callback?next=/account/profile', getSiteUrl()).toString();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: {
        full_name, phone: phone || null, country, tentative_wedding_date, guest_count, wedding_budget, wedding_theme,
        celebration_city: celebration_city || null,
        celebration_region: celebration_region || null,
        planning_stage,
        priority_services,
        language,
      },
    },
  });
  if (error) {
    return { ok: false, feedback: authFeedbackKey(error) };
  }
  if (isExistingSignupResponse(data)) return {ok: false, feedback: 'emailTaken'};

  // A database Auth trigger creates the safe default profile. Email ownership
  // must be confirmed by the user before any authenticated onboarding work.
  return { ok: true, redirectTo: data.session ? '/account/profile' : `/signup/check-email?lang=${language}` };
}
