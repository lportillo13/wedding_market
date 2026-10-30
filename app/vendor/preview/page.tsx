export const dynamic='force-dynamic';
export const revalidate=0;
import Image from 'next/image';
import Link from 'next/link';
import {redirect} from 'next/navigation';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {getRequestI18n} from '@/lib/i18n/server';
import {parseMediaAsset} from '@/lib/images';
import {resolveMediaUrl,shouldRenderUnoptimizedMedia} from '@/lib/media-url';
import {loadOwnVendorPreview,type SavedVendorPreview} from '@/features/vendors/server/workspace-preview';
import {vendorStudioCopy} from '../workspace-navigation';

export default async function Page() {
  const supabase=await createSupabaseServerClient();
  const {language}=await getRequestI18n();
  const labels=vendorStudioCopy[language];
  const result=await loadOwnVendorPreview<SavedVendorPreview>({getUser:()=>supabase.auth.getUser(),readOwnVendor:ownerId=>supabase.from('vendors').select('business_name,bio,hero_image,thumbnail_image,gallery_images,phone,website_url,address_label,starting_price_cents,starting_price_currency').eq('owner_id',ownerId).returns<SavedVendorPreview[]>().maybeSingle()});
  if(result.status==='guest')redirect('/login?next=%2Fvendor%2Fpreview');
  if(result.status==='missing')redirect('/vendor/profile');
  if(result.status==='unavailable')throw new Error('Unable to load your saved business details. Please try again.');
  const vendor=result.vendor;
  const localizedBio=typeof vendor.bio==='object' && vendor.bio ? vendor.bio as Record<string,unknown> : null;
  const bio=localizedBio ? localizedBio[language] || localizedBio.en || localizedBio.es : vendor.bio;
  const storedCurrency=vendor.starting_price_currency?.toUpperCase() ?? 'USD';
  const currency=/^[A-Z]{3}$/.test(storedCurrency) ? storedCurrency : 'USD';
  const photos=[vendor.hero_image,vendor.thumbnail_image,...(Array.isArray(vendor.gallery_images)?vendor.gallery_images:[])].map(parseMediaAsset).filter(asset=>asset && asset.type!=='video').filter((asset,index,all)=>all.findIndex(item=>item?.url===asset?.url)===index).slice(0,6);
  return <main className="wm-studio-preview">
    <div className="wm-studio-preview__heading"><div><p className="wm-studio-eyebrow">{labels.privatePreview}</p><h1>{vendor.business_name || labels.business}</h1><p>{labels.previewNote}</p></div><Link className="btn btn-outline-secondary" href="/vendor/profile#details">{labels.edit} →</Link></div>
    {photos.length>0 && <div className="wm-studio-preview__photos">{photos.map(asset=>asset && <Image key={asset.url} src={resolveMediaUrl(asset.url)} alt={vendor.business_name ?? labels.business} width={800} height={520} unoptimized={shouldRenderUnoptimizedMedia(asset.url)} sizes="(max-width:767px) 100vw, 50vw"/>)}</div>}
    <section><h2>{labels.details}</h2><p className="wm-studio-preview__bio">{typeof bio==='string' && bio.trim() ? bio : '—'}</p></section>
    <section><h2>{labels.contact}</h2><dl><div><dt>{language==='es'?'Teléfono':'Phone'}</dt><dd>{vendor.phone || '—'}</dd></div><div><dt>{language==='es'?'Sitio web':'Website'}</dt><dd>{vendor.website_url || '—'}</dd></div><div><dt>{labels.location}</dt><dd>{vendor.address_label || '—'}</dd></div><div><dt>{labels.startingPrice}</dt><dd>{vendor.starting_price_cents!==null ? new Intl.NumberFormat(language==='es'?'es-CR':'en-US',{style:'currency',currency}).format(vendor.starting_price_cents/100) : '—'}</dd></div></dl></section>
  </main>;
}
