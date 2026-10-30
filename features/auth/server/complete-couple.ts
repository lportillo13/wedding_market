import type {User} from '@supabase/supabase-js';
import {coupleProfileSchema} from '../domain/couple-profile';
import type {AccessProfile} from '../domain/access';

export async function completeCoupleProfile(account:{user:Pick<User,'id'|'email'|'email_confirmed_at'>;profile:AccessProfile;isVendor:boolean}|null,input:unknown,update:(id:string,values:ReturnType<typeof coupleProfileSchema.parse>)=>PromiseLike<{error:unknown}>) {
  if(!account?.user.email||!account.user.email_confirmed_at||account.profile.role!=='user'||account.isVendor)return {ok:false as const,message:'A verified couple account is required.'};
  const parsed=coupleProfileSchema.safeParse(input);
  if(!parsed.success)return {ok:false as const,message:parsed.error.issues[0]?.message??'Check your details.'};
  const result=await update(account.user.id,parsed.data);
  if(result.error)return {ok:false as const,message:'Your details could not be saved. Please try again.'};
  return {ok:true as const};
}
