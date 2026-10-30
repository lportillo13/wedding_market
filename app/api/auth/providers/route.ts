import {NextResponse} from 'next/server';
import {getSupabaseUrl,getSupabasePublicKey} from '@/lib/supabase/config';
import {publicProviders} from '@/features/auth/domain/access';

export async function GET() {
  try {
    const url=getSupabaseUrl(),key=getSupabasePublicKey();
    if(!url||!key)throw new Error('Missing public configuration');
    const result=await fetch(url.replace(/\/$/,'')+'/auth/v1/settings',{headers:{apikey:key},cache:'no-store',signal:AbortSignal.timeout(4000)});
    if(!result.ok)throw new Error('Provider settings unavailable');
    // Public capability flags only. No sessions, credentials or private RLS reads.
    return NextResponse.json(publicProviders(await result.json()),{headers:{'Cache-Control':'public, max-age=60, s-maxage=60'}});
  }catch{return NextResponse.json({google:false,apple:false},{status:503,headers:{'Cache-Control':'no-store'}});}
}
