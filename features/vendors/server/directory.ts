import { createClient } from '@supabase/supabase-js';
import { parseMediaAsset } from '@/lib/images';
import type { VendorListItem, VendorsResponse } from '@/app/vendors/types';
import { publicDirectoryCache } from './cache';

export function directoryInteger(value: string | null | undefined, fallback: number, maximum: number) {
  const parsed=Number(value);
  return Number.isInteger(parsed) && parsed>0 ? Math.min(parsed,maximum) : fallback;
}

/** One public, bounded projection. Never uses cookies or a service credential. */
export async function searchVendorDirectory(params: Record<string,string | undefined>): Promise<VendorsResponse> {
  const page=directoryInteger(params.page,1,1000);
  const pageSize=directoryInteger(params.pageSize,12,50);
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Vendor directory is not configured.');
  const query=params.q?.trim().slice(0,100) ?? '';
  const category=params.category?.trim().slice(0,100) ?? '';
  return publicDirectoryCache.get(JSON.stringify([url,query,category,page,pageSize]), async () => {
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const { data,error }=await client.rpc('search_vendor_directory',{
    p_query:query,p_category:category,p_page:page,p_size:pageSize,
  }).abortSignal(AbortSignal.timeout(10000));
  if (error) throw new Error('The vendor directory is temporarily unavailable.');
  const result=data as {items:VendorListItem[];total:number};
  const rows=(result.items ?? []).slice(0,pageSize);
  // Only public city/region, bounded to this page; never fetch street/contact data.
  const {data:locations}=rows.length ? await client.from('vendor_locations').select('vendor_id,city,region')
    .in('vendor_id',rows.map(row=>row.id)).limit(pageSize).abortSignal(AbortSignal.timeout(5000)) : {data:[]};
  const cities=new Map((locations ?? []).map(location=>[location.vendor_id,location]));
  return {items:rows.map(row=>({...row,city:cities.get(row.id)?.city ?? row.city ?? null,region:cities.get(row.id)?.region ?? row.region ?? null,thumbnail_image:parseMediaAsset(row.thumbnail_image),
    logo_image:row.logo_url ? {url:row.logo_url,public_id:row.logo_url,width:160,height:160,format:'image'} : null,
  })),total:result.total ?? 0,page,pageSize};
  });
}
