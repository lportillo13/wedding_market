import type { SupabaseClient } from '@supabase/supabase-js';
import { getSiteUrl } from '@/lib/site-url';

/** One provider signup implementation for account-first and legacy vendor entry. */
export function registerVendorAccount(supabase: SupabaseClient, details: {
  fullName: string; email: string; password: string; language: 'en' | 'es'; phone?: string; country?: string;
}) {
  return supabase.auth.signUp({
    email: details.email.trim(), password: details.password,
    options: {
      emailRedirectTo: new URL('/auth/callback?next=/signup/vendor', getSiteUrl()).toString(),
      data: { full_name: details.fullName.trim(), language: details.language, phone: details.phone || null, country: details.country || null },
    },
  });
}
