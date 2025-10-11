'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/slugify';

const VendorSignupSchema = z.object({
  business_name: z.string().trim().min(2, 'Business name is required'),
  city: z.string().trim().max(120).optional(),
  country: z.string().trim().max(120).optional(),
});

export type VendorSignUpState = { ok: false; message?: string };

export async function createVendor(_: VendorSignUpState, formData: FormData): Promise<VendorSignUpState> {
  const parsed = VendorSignupSchema.safeParse({
    business_name: formData.get('business_name'),
    city: formData.get('city'),
    country: formData.get('country'),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const { business_name, city, country } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return { ok: false, message: 'You must log in before creating a vendor profile.' };
  }

  const { error: profileErr } = await supabase
    .from('profiles')
    .upsert({ id: user.id, role: 'vendor' }, { onConflict: 'id' });
  if (profileErr) {
    return { ok: false, message: profileErr.message };
  }

  let slug = slugify(business_name);
  if (!slug) {
    slug = `vendor-${user.id.slice(0, 8)}`;
  }

  const { data: slugConflict } = await supabase
    .from('vendors')
    .select('id')
    .eq('slug', slug)
    .neq('owner_id', user.id)
    .maybeSingle();

  if (slugConflict) {
    slug = `${slug}-${user.id.slice(0, 4)}`;
  }

  const { data: existingVendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();

  let vendorId = existingVendor?.id ?? null;

  if (!vendorId) {
    const { data: inserted, error: insertErr } = await supabase
      .from('vendors')
      .insert({
        owner_id: user.id,
        business_name,
        slug,
        bio: { en: '', es: '' },
        is_published: false,
      })
      .select('id')
      .single();

    if (insertErr) {
      return { ok: false, message: insertErr.message };
    }

    vendorId = inserted?.id ?? null;
  }

  if (!vendorId) {
    return { ok: false, message: 'Could not determine vendor profile.' };
  }

  if (existingVendor) {
    const { error: updateErr } = await supabase
      .from('vendors')
      .update({ business_name, slug })
      .eq('id', vendorId);
    if (updateErr) {
      return { ok: false, message: updateErr.message };
    }
  }

  const { error: locationErr } = await supabase
    .from('vendor_locations')
    .upsert(
      {
        vendor_id: vendorId,
        address: null,
        city: city || null,
        state: null,
        country: country || null,
        lat: null,
        lng: null,
        service_radius_km: 50,
      },
      { onConflict: 'vendor_id' }
    );

  if (locationErr) {
    return { ok: false, message: locationErr.message };
  }

  redirect('/vendor');
}
