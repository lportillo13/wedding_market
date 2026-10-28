import type { SupabaseClient } from '@supabase/supabase-js';
import { prepareVendorHeroPresentation } from '../../../shared/vendors/hero';

export async function saveVendorHeroPresentation(db: SupabaseClient, vendor: { id: string; gallery_images: unknown; extra_info: unknown }, input: Parameters<typeof prepareVendorHeroPresentation>[0]) {
  const gallery = Array.isArray(vendor.gallery_images) ? vendor.gallery_images : [];
  const prepared = prepareVendorHeroPresentation(input, gallery);
  if (!prepared.ok) return { ok: false as const, error: prepared.error };
  const extra = vendor.extra_info && typeof vendor.extra_info === 'object' && !Array.isArray(vendor.extra_info) ? vendor.extra_info : {};
  const { error } = await db.from('vendors').update({ extra_info: { ...extra, hero_presentation: prepared.value } }).eq('id', vendor.id);
  return error ? { ok: false as const, error: 'save' as const } : { ok: true as const };
}
