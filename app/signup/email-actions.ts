'use server';

import {headers} from 'next/headers';
import {checkSignupEmailAvailability} from '@/features/auth/server/signup-email';

export async function checkSignupEmail(email: unknown) {
  const requestHeaders = await headers();
  // Cloudflare sets this on the origin-restricted production site. Never use
  // submitted email addresses as cache or admission keys.
  const identifier = requestHeaders.get('cf-connecting-ip') ?? requestHeaders.get('x-real-ip') ?? 'unknown';
  return checkSignupEmailAvailability(email, identifier);
}
