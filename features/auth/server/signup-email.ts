import {createHash} from 'node:crypto';
import {z} from 'zod';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';

const emailSchema = z.string().trim().max(254).email().transform(value => value.toLowerCase());
export type SignupEmailCheck = {ok: true} | {ok: false; feedback: 'emailTaken' | 'rateLimited' | 'unavailable'};

/** Bounded per-process admission, in addition to the production API edge limits. */
export class SignupEmailLimiter {
  private entries = new Map<string, {count: number; expires: number}>();
  constructor(private maxEntries = 1000, private attempts = 15, private windowMs = 600_000) {}
  allow(identifier: string, now = Date.now()) {
    const key = createHash('sha256').update(identifier).digest('hex');
    for (const [stored, entry] of this.entries) if (entry.expires <= now) this.entries.delete(stored);
    const entry = this.entries.get(key);
    if (entry) {
      if (entry.count >= this.attempts) return false;
      entry.count++;
      return true;
    }
    if (this.entries.size >= this.maxEntries) return false;
    this.entries.set(key, {count: 1, expires: now + this.windowMs});
    return true;
  }
}
const limiter = new SignupEmailLimiter();

async function lookupEmail(email: string) {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error('Email check unavailable');
  const {data, error} = await admin.rpc('wm_signup_email_exists', {p_email: email}).abortSignal(AbortSignal.timeout(5000));
  if (error || typeof data !== 'boolean') throw new Error('Email check unavailable');
  return data;
}

export async function checkSignupEmailAvailability(email: unknown, identifier: string, dependencies = {lookup: lookupEmail, limiter}): Promise<SignupEmailCheck> {
  if (!dependencies.limiter.allow(identifier)) return {ok: false, feedback: 'rateLimited'};
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return {ok: false, feedback: 'unavailable'};
  try {
    return await dependencies.lookup(parsed.data) ? {ok: false, feedback: 'emailTaken'} : {ok: true};
  } catch {
    return {ok: false, feedback: 'unavailable'};
  }
}
