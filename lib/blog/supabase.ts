import { createSupabasePublicClient } from '@/lib/supabase/public';

export async function getSupabaseForBlog() {
  return createSupabasePublicClient();
}
