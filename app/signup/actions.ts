'use server';

import {revalidatePath} from 'next/cache';
import { getSiteUrl } from '@/lib/site-url';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { authFeedbackKey } from '@/lib/auth-feedback';
import {checkSignupEmail} from './email-actions';
import {isExistingSignupResponse} from '@/features/auth/domain/signup-response';
import {coupleAccountSchema,coupleProfileInput} from '@/features/auth/domain/couple-profile';
import {loadAccessAccount} from '@/features/auth/server/access-account';
import {completeCoupleProfile} from '@/features/auth/server/complete-couple';
import {accessReturnPath} from '@/features/auth/domain/access';

export type SignUpState =
  | { ok: false; message?: string; feedback?: ReturnType<typeof authFeedbackKey> }
  | { ok: true; redirectTo: string };

export async function signUp(_: SignUpState, formData: FormData): Promise<SignUpState> {
  const parsed = coupleAccountSchema.safeParse({
    ...coupleProfileInput(formData),
    email: formData.get('email'),
    password: formData.get('password'),
    celebration_city: formData.get('celebration_city'),
    celebration_region: formData.get('celebration_region'),
    planning_stage: formData.get('planning_stage'),
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

/** Verified social/email-code accounts finish the existing journey without another Auth signup. */
export async function completeCoupleSignup(_:SignUpState,formData:FormData):Promise<SignUpState> {
  try{
    const supabase=await createSupabaseServerClient(),account=await loadAccessAccount(supabase);
    if(account.status!=='ready')return {ok:false,feedback:'unavailable'};
    const result=await completeCoupleProfile(account,coupleProfileInput(formData),(id,values)=>supabase.from('profiles').update(values).eq('id',id));
    if(!result.ok)return result;
    revalidatePath('/account/profile');revalidatePath('/', 'layout');
    return {ok:true,redirectTo:accessReturnPath(formData.get('next'))};
  }catch(error){return {ok:false,feedback:authFeedbackKey(error)};}
}
