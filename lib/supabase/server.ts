// lib/supabase/server.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import {sessionCookieOptions} from './session-options';
import { getSupabasePublicKey, getSupabaseUrl } from '@/lib/supabase/config';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies(); // Next 15: await

  return createServerClient(
    getSupabaseUrl()!,
    getSupabasePublicKey()!,
    {
      cookieOptions:sessionCookieOptions,
      cookies:{getAll:()=>cookieStore.getAll(),setAll(values){
        try{for(const {name,value,options} of values)cookieStore.set(name,value,{...sessionCookieOptions,...options,secure:sessionCookieOptions.secure});}
        catch{/* Server Components are read-only; proxy.ts persists refreshes before rendering. */}
      }},
    }
  );
}

export const getSupabaseServer = createSupabaseServerClient;
