import type { User } from '@supabase/supabase-js';

type PersonalProfile = {
  role: string;
  full_name: string | null;
  phone: string | null;
  country: string | null;
  tentative_wedding_date: string | null;
  guest_count: number | null;
  wedding_budget: number | null;
  wedding_theme: string | null;
  language: string | null;
};

type ProfileSource = {
  getUser: () => PromiseLike<{data: {user: User | null}; error: unknown}>;
  readOwnProfile: (userId: string) => PromiseLike<{data: PersonalProfile | null; error: unknown}>;
};

/** Personal details belong to the verified account, independently of workspace role. */
export async function loadPersonalProfile(source: ProfileSource) {
  const auth = await source.getUser();
  if (auth.error || !auth.data.user) return {status: 'guest'} as const;
  const user = auth.data.user;
  const result = await source.readOwnProfile(user.id);
  if (result.error || !result.data) return {status: 'unavailable'} as const;
  return {status: 'ready', user, profile: result.data} as const;
}
