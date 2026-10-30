import type {User} from '@supabase/supabase-js';

export type SavedVendorPreview = {business_name:string|null;bio:unknown;hero_image:unknown;thumbnail_image:unknown;gallery_images:unknown;phone:string|null;website_url:string|null;address_label:string|null;starting_price_cents:number|null;starting_price_currency:string|null};

export async function loadOwnVendorPreview<T>(source:{
  getUser:()=>PromiseLike<{data:{user:User|null};error:unknown}>;
  readOwnVendor:(ownerId:string)=>PromiseLike<{data:T|null;error:unknown}>;
}) {
  const auth=await source.getUser();
  if(auth.error || !auth.data.user) return {status:'guest'} as const;
  const result=await source.readOwnVendor(auth.data.user.id);
  if(result.error) return {status:'unavailable'} as const;
  if(!result.data) return {status:'missing'} as const;
  return {status:'ready',vendor:result.data} as const;
}
