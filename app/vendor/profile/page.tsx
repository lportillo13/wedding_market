export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from 'next/navigation';
import { getRoles } from '@/lib/auth/roles';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import VendorProfileTabs from './VendorProfileTabs';
import type { VendorImage } from '@/types/vendor';

type VendorRow = {
  slug: string | null;
  business_name: string | null;
  bio: { en?: string | null; es?: string | null } | null;
  extra_info: { en?: string | null; es?: string | null } | null;
  hero_image: VendorImage | null;
  thumbnail_image: VendorImage | null;
  gallery_images: VendorImage[] | null;
};

export default async function ProfilePage() {
  const { user, isVendor } = await getRoles();
  if (!user || !isVendor) redirect('/signup/vendor');

  const supabase = await createSupabaseServerClient();

  let { data: vendor } = await supabase
    .from('vendors')
    .select('id, slug, business_name, bio, extra_info, hero_image, thumbnail_image, gallery_images')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!vendor) {
    const inserted = await supabase
      .from('vendors')
      .insert({
        owner_id: user.id,
        slug: `vendor-${user.id.slice(0, 8)}`,
        business_name: 'Untitled Vendor',
        bio: { en: '', es: '' },
        extra_info: { en: '', es: '' },
        is_published: false,
      })
      .select('id, slug, business_name, bio, extra_info, hero_image, thumbnail_image, gallery_images')
      .single();

    if (inserted.error) {
      throw new Error(inserted.error.message);
    }

    vendor = inserted.data ?? null;
  }

  const v = vendor as VendorRow | null;
  const bio = v?.bio ?? null;
  const extraInfo = v?.extra_info ?? null;
  const initial = {
    slug: v?.slug ?? '',
    business_name: v?.business_name ?? '',
    bio_en: bio?.en ?? '',
    bio_es: bio?.es ?? '',
    extra_info_en: extraInfo?.en ?? '',
    extra_info_es: extraInfo?.es ?? '',
  };

  const heroImage = v?.hero_image?.url ? v.hero_image : null;
  const thumbnailImage = v?.thumbnail_image?.url ? v.thumbnail_image : null;
  const galleryImages = Array.isArray(v?.gallery_images)
    ? (v.gallery_images as VendorImage[]).filter(
        (img): img is VendorImage => Boolean(img && typeof img.url === "string" && img.url.length > 0)
      )
    : [];

  const safeGallery = galleryImages.map((img) => ({ ...img }));

  return (
    <VendorProfileTabs
      profileInitial={initial}
      vendorName={initial.business_name}
      heroImage={heroImage}
      thumbnailImage={thumbnailImage}
      galleryImages={safeGallery}
    />
  );
}
