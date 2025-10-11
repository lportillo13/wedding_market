'use server';

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

  const { data, error } = await supabase.auth.signUp({ email, password });
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

  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: userId, role: 'user' }, { onConflict: 'id' });

    if (profileErr) {
      return { ok: false, message: profileErr.message };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create profile';
    return { ok: false, message };
  }

  redirect('/');
}
