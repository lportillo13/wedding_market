import type { User } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type RolesResult = {
  user: User | null;
  isUser: boolean;
  isVendor: boolean;
};

export async function getRoles(): Promise<RolesResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, isUser: false, isVendor: false };
  }

  const uidArg = { _uid: user.id } satisfies { _uid: string };
  const { data: isUser } = await supabase.rpc('is_user', uidArg);
  const { data: isVendor } = await supabase.rpc('is_vendor', uidArg);

  return { user, isUser: !!isUser, isVendor: !!isVendor };
}
