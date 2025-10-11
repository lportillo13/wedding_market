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

  const supabaseAdmin = createSupabaseAdminClient();

  if (supabaseAdmin) {
    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: userId, role: 'user' }, { onConflict: 'id' });

    if (profileErr) {
      return { ok: false, message: profileErr.message };
    }
  } else {
    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert({ id: userId, role: 'user' }, { onConflict: 'id' });

    if (profileErr) {
      const message = profileErr.message.toLowerCase();
      if (message.includes('row-level security')) {
        console.warn(
          'Profile creation blocked by row-level security. Configure SUPABASE_SERVICE_ROLE_KEY to allow server-side profile provisioning.'
        );
      } else {
        return { ok: false, message: profileErr.message };
      }
    }
  }

  redirect('/');
}
