'use server';

import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { authFeedbackKey } from '@/lib/auth-feedback';
import { registerVendorAccount } from '@/features/auth/server/vendor-account';

export type VendorAccountState = { ok: false; feedback?: ReturnType<typeof authFeedbackKey> } | { ok: true; redirectTo: string };

export async function createVendorSignupAccount(_: VendorAccountState, formData: FormData): Promise<VendorAccountState> {
  const parsed = z.object({ fullName: z.string().trim().min(1).max(200), email: z.string().trim().email(), password: z.string().min(8), language: z.enum(['en', 'es']) }).safeParse({
    fullName: formData.get('owner_name'), email: formData.get('email'), password: formData.get('password'), language: formData.get('account_language'),
  });
  if (!parsed.success) return { ok: false, feedback: 'unavailable' };
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError && userError.name !== 'AuthSessionMissingError') throw userError;
    if (user) return { ok: true, redirectTo: '/signup/vendor' };
    const { data, error } = await registerVendorAccount(supabase, parsed.data);
    if (error) throw error;
    return { ok: true, redirectTo: data.session ? '/signup/vendor' : '/signup/check-email?lang=' + parsed.data.language + '&vendor=1' };
  } catch (error) { return { ok: false, feedback: authFeedbackKey(error) }; }
}
