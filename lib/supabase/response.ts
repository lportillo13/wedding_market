import {cookies} from 'next/headers';
import {createServerClient} from '@supabase/ssr';
import type {NextResponse} from 'next/server';
import {getSupabasePublicKey,getSupabaseUrl} from './config';
import {sessionCookieOptions} from './session-options';

/** Keep all token chunks and no-cache headers on the response actually returned. */
export async function createSupabaseResponseClient(response:NextResponse) {
  const store=await cookies();
  response.headers.set('Cache-Control','private, no-store');
  return createServerClient(getSupabaseUrl()!,getSupabasePublicKey()!,{cookieOptions:sessionCookieOptions,cookies:{
    getAll:()=>store.getAll(),
    setAll(values,headers){for(const {name,value,options} of values)response.cookies.set(name,value,{...sessionCookieOptions,...options,secure:sessionCookieOptions.secure});for(const [name,value] of Object.entries(headers))response.headers.set(name,value);},
  }});
}
