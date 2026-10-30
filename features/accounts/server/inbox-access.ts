import type {User} from '@supabase/supabase-js';

type VerifiedRoles = {user: User | null; isUser: boolean; isVendor: boolean};

/** A legacy couple-inbox link must resolve to an inbox the account can use. */
export async function loadInboxAccess(getRoles: () => Promise<VerifiedRoles>) {
  try {
    const roles = await getRoles();
    if (!roles.user) return {status: 'guest'} as const;
    if (roles.isUser) return {status: 'client', user: roles.user} as const;
    if (roles.isVendor) return {status: 'vendor'} as const;
    return {status: 'unavailable'} as const;
  } catch {
    return {status: 'unavailable'} as const;
  }
}
