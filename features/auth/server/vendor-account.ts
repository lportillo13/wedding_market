import type { SupabaseClient } from '@supabase/supabase-js';
import { getSiteUrl } from '@/lib/site-url';
import {AuthApiError} from '@supabase/supabase-js';
import {isExistingSignupResponse} from '../domain/signup-response';
import {resolveVendorOwnerName} from '../domain/vendor-onboarding';
import {COMMUNITY_TERMS_VERSION} from '@/shared/safety/copy';

/** Call with the verified identity, before any media upload or vendor write. */
export async function loadVendorSetupOwner(supabase:SupabaseClient,userId:string,submittedName:unknown,language:'en'|'es') {
  const {data:profile,error}=await supabase.from('profiles').select('full_name,community_terms_version').eq('id',userId).maybeSingle();
  if(error||!profile)return {ok:false as const,feedback:'unavailable' as const};
  if(profile.community_terms_version!==COMMUNITY_TERMS_VERSION)return {ok:false as const,message:language==='es'?'Revisa y acepta los Términos y las Normas de la Comunidad antes de crear tu perfil de negocio.':'Review and accept the Terms and Community Guidelines before creating your business profile.'};
  const fullName=resolveVendorOwnerName(submittedName,profile.full_name);
  if(!fullName)return {ok:false as const,message:language==='es'?'Tu nombre es obligatorio.':'Your name is required.'};
  return {ok:true as const,fullName};
}

/** One provider signup implementation for account-first and legacy vendor entry. */
export async function registerVendorAccount(supabase: SupabaseClient, details: {
  fullName: string; email: string; password: string; language: 'en' | 'es'; phone?: string; country?: string;
}) {
  const result = await supabase.auth.signUp({
    email: details.email.trim().toLowerCase(), password: details.password,
    options: {
      emailRedirectTo: new URL('/auth/callback?next=/signup/vendor', getSiteUrl()).toString(),
      data: { full_name: details.fullName.trim(), language: details.language, phone: details.phone || null, country: details.country || null },
    },
  });
  if (!result.error && isExistingSignupResponse(result.data)) {
    return {...result, error: new AuthApiError('Email is already registered.', 422, 'user_already_exists')};
  }
  return result;
}
