import {isAuthSessionMissingError,type SupabaseClient} from '@supabase/supabase-js';
import type {AccessProfile} from '../domain/access';

/** The session determines the only account we can inspect. No caller-supplied ID. */
export async function loadAccessAccount(supabase:SupabaseClient) {
  const {data:{user},error}=await supabase.auth.getUser();
  if(error&&!isAuthSessionMissingError(error))return {status:'unavailable' as const};
  if(!user)return {status:'guest' as const};
  const [profileResult,vendorResult]=await Promise.all([
    supabase.from('profiles').select('role,full_name,phone,country,wedding_theme,tentative_wedding_date,guest_count,wedding_budget,community_terms_version').eq('id',user.id).maybeSingle(),
    supabase.rpc('is_vendor',{_uid:user.id}),
  ]);
  if(profileResult.error||!profileResult.data||vendorResult.error||typeof vendorResult.data!=='boolean')return {status:'unavailable' as const};
  return {status:'ready' as const,user,profile:profileResult.data as AccessProfile,isVendor:vendorResult.data};
}
