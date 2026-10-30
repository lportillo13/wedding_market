export type AccessIntent = 'login' | 'couple' | 'vendor';
export type AccessProfile = {role:string; full_name:string|null; phone:string|null; country:string|null; wedding_theme:string|null; tentative_wedding_date:string|null;guest_count?:number|null;wedding_budget?:number|null};
export function isAccountEntry(path:string){return ['/signup','/auth','/login','/forgot-password','/reset-password'].some(root=>path===root||path.startsWith(root+'/'));}

/** Return paths are local navigation hints, never authorization or role grants. */
export function accessReturnPath(value:unknown, fallback='/account/profile') {
  if(typeof value!=='string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\') || [...value].some(char=>char.charCodeAt(0)<32||char.charCodeAt(0)===127))return fallback;
  const url=new URL(value,'https://auth.invalid');
  if(['/login','/auth/callback','/auth/continue','/signup/choose'].includes(url.pathname))return fallback;
  return value;
}
export function accessIntent(value:unknown):AccessIntent {return value==='couple'||value==='vendor'?value:'login';}
export function accessRequest(next:unknown,intent:unknown):{intent:AccessIntent;next:string;defaultWorkspace?:boolean} {
  if(typeof next==='string'&&next.startsWith('/')&&!next.startsWith('//')){
    const url=new URL(next,'https://auth.invalid');
    if(url.pathname==='/auth/continue')return {intent:accessIntent(url.searchParams.get('intent')),next:accessReturnPath(url.searchParams.get('next')),...(url.searchParams.get('workspace')==='1'?{defaultWorkspace:true}:{})};
  }
  return {intent:accessIntent(intent),next:accessReturnPath(next)};
}
export function accessContinuation(intent:AccessIntent,next='/account/profile',defaultWorkspace=false) {
  return '/auth/continue?'+new URLSearchParams({intent,next:accessReturnPath(next),...(defaultWorkspace?{workspace:'1'}:{})});
}
export function accessCallback(intent:AccessIntent,next:string,defaultWorkspace=false) {
  return '/auth/callback?'+new URLSearchParams({next:accessContinuation(intent,next,defaultWorkspace)});
}
export function coupleSetupComplete(profile:AccessProfile) {
  return Boolean(profile.full_name?.trim() && profile.phone?.trim() && profile.country?.trim() && profile.wedding_theme && profile.tentative_wedding_date);
}
export function accessDestination(profile:AccessProfile,isVendor:boolean,intent:AccessIntent,nextInput:string,defaultWorkspace=false) {
  const next=accessReturnPath(nextInput);
  const pathname=new URL(next,'https://auth.invalid').pathname;
  const signup=pathname==='/signup'||pathname.startsWith('/signup/');
  if(isVendor)return signup||intent!=='login'||(defaultWorkspace&&next==='/account/profile')?'/vendor/profile':next;
  if(profile.role!=='user')return signup?'/account/profile':next;
  const vendorEntry=pathname==='/signup/vendor'||pathname.startsWith('/signup/vendor/')||pathname==='/vendor'||pathname.startsWith('/vendor/');
  if(intent==='vendor'||(intent==='login'&&vendorEntry))return '/signup/vendor';
  if(coupleSetupComplete(profile))return signup?'/account/profile':next;
  const query=new URLSearchParams({next:signup?'/account/profile':next});
  return '/signup?complete=1&'+query;
}
export function emailCodeAddress(value:string) {return value.trim().toLowerCase();}
export function validEmailCode(value:string) {return /^\d{6,10}$/.test(value.replace(/\s/g,''));}
export function publicProviders(value:unknown) {
  const external=value && typeof value==='object' && 'external' in value ? value.external : null;
  return {google:Boolean(external&&typeof external==='object'&&'google' in external&&external.google===true),apple:Boolean(external&&typeof external==='object'&&'apple' in external&&external.apple===true)};
}
