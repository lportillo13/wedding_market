import type { SupabaseClient } from '@supabase/supabase-js';
import { getSiteUrl } from '@/lib/site-url';
import {AuthApiError} from '@supabase/supabase-js';
import {isExistingSignupResponse} from '../domain/signup-response';

/** One provider signup implementation for account-first and legacy vendor entry. */
export async function registerVendorAccount(supabase: SupabaseClient, details: {
  fullName: string; email: string; password: string; language: 'en' | 'es'; phone?: string; country?: string;
}) {
  const result = await supabase.auth.signUp({
    email: details.email.trim().toLowerCase(), password: details.password,
    options: {
      emailRedirectTo: new URL('/auth/callback?next=/signup/vendor', getSiteUrl()).toString(),
      data: { full_name: details.fullName.trim(), language: details.language, phone: details.phone || null, country: details.country || null },
    },
  });
  if (!result.error && isExistingSignupResponse(result.data)) {
    return {...result, error: new AuthApiError('Email is already registered.', 422, 'user_already_exists')};
  }
  return result;
}
