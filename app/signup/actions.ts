'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type SignUpState = { ok: false; message?: string };

export async function signUp(_: SignUpState, formData: FormData): Promise<SignUpState> {
  const parsed = SignUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const { email, password } = parsed.data;
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
    .upsert({ id: userId, role: 'user' }, { onConflict: 'id' });

  if (profileErr) {
    const message = profileErr.message.toLowerCase();
    if (!supabaseAdmin && message.includes('row-level security')) {
      console.warn(
        'Profile creation blocked by row-level security. Configure SUPABASE_SERVICE_ROLE_KEY to allow server-side profile provisioning.'
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

  redirect('/');
}
