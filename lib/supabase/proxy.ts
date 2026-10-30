import {createServerClient,type CookieOptions} from '@supabase/ssr';
import {NextResponse,type NextRequest} from 'next/server';
import {getSupabasePublicKey,getSupabaseUrl} from './config';
import {sessionCookieOptions} from './session-options';

export async function refreshBrowserSession(request:NextRequest,makeClient=createServerClient,deadlineMs=6000) {
  let response=NextResponse.next({request});
  // Guests and public assets must not incur an authentication refresh request.
  if(!request.cookies.getAll().some(({name})=>/^sb-.+-auth-token(?:\.\d+)?$/.test(name)))return response;
  const url=getSupabaseUrl(),key=getSupabasePublicKey();
  response.headers.set('Cache-Control','private, no-store');
  if(!url||!key)return response;
  let writable=true;
  const controller=new AbortController();
  let deadline:ReturnType<typeof setTimeout>|undefined;
  const pending=new Map<string,{value:string;options:CookieOptions}>();
  const supabase=makeClient(url,key,{cookieOptions:sessionCookieOptions,global:{fetch:(input,init)=>fetch(input,{...init,signal:controller.signal})},cookies:{
    getAll:()=>request.cookies.getAll(),
    setAll(values,headers){
      if(!writable)return;
      for(const {name,value,options} of values){request.cookies.set(name,value);pending.set(name,{value,options});}
      response=NextResponse.next({request});
      for(const [name,{value,options}] of pending)response.cookies.set(name,value,{...sessionCookieOptions,...options,secure:sessionCookieOptions.secure});
      for(const [name,value] of Object.entries(headers))response.headers.set(name,value);
      response.headers.set('Cache-Control','private, no-cache, no-store, must-revalidate, max-age=0');
    },
  }});
  // Verifies the token and refreshes an expiring session. Pages still verify getUser and RLS.
  try{await Promise.race([supabase.auth.getClaims(),new Promise<void>(resolve=>{deadline=setTimeout(()=>{writable=false;controller.abort();resolve();},deadlineMs);})]);}
  catch{/* Transient failures must not sign the account out. */}
  finally{writable=false;if(deadline)clearTimeout(deadline);}
  return response;
}
