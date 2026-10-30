import {profileStartingPrice} from '@/shared/vendors/pricing';

export async function saveVendorStartingPrice(
  vendor: {id:string; starting_price_currency:string|null} | null,
  input: {price:string; currency:string},
  update: (id:string, values:ReturnType<typeof profileStartingPrice>) => PromiseLike<{error:unknown}>,
) {
  if (!vendor) return {ok:false, message:'Vendor access required.'};
  try {
    const values = profileStartingPrice(input.price,input.currency,vendor.starting_price_currency ?? 'USD');
    const result = await update(vendor.id, values);
    if (result.error) return {ok:false, message:'Unable to save the starting price. Your changes are still here.'};
    return {ok:true,message:'Starting price saved.'};
  } catch (error) {
    return {ok:false,message:error instanceof Error ? error.message : 'Unable to save the starting price.'};
  }
}
