'use server';

import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const ReviewSchema = z.object({
  rfq_id: z.string().uuid(),
  vendor_id: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().default(''),
  body: z.string().trim().max(800).optional().default(''),
});

export type CreateReviewState =
  | { ok: true }
  | { ok: false; error: string };

export async function createReview(_prev: CreateReviewState, formData: FormData): Promise<CreateReviewState> {
  const parsed = ReviewSchema.safeParse({
    rfq_id: formData.get('rfq_id'),
    vendor_id: formData.get('vendor_id'),
    rating: formData.get('rating'),
    title: formData.get('title'),
    body: formData.get('body'),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const input = parsed.data;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) return { ok: false, error: 'Not authenticated' };

  const { data: canReview, error: rpcErr } = await supabase
    .rpc('can_user_review', { _uid: user.id, _vendor_id: input.vendor_id, _rfq_id: input.rfq_id });

  if (rpcErr) return { ok: false, error: rpcErr.message };
  if (!canReview) return { ok: false, error: 'You can only review vendors you hired.' };

  const { error } = await supabase.from('reviews').insert({
    rfq_id: input.rfq_id,
    vendor_id: input.vendor_id,
    stars: input.rating,
    title: input.title,
    body: input.body,
    author_id: user.id,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
