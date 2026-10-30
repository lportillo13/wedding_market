import {NextResponse,type NextRequest} from 'next/server';
import {refreshBrowserSession} from '@/lib/supabase/proxy';
import {canonicalSiteRedirect} from '@/lib/site-url';
export async function proxy(request:NextRequest){
  const canonical=canonicalSiteRedirect(request.nextUrl,request.headers.get('host'));
  if(canonical){const response=NextResponse.redirect(canonical,308);response.headers.set('Cache-Control','private, no-store');return response;}
  return refreshBrowserSession(request);
}
export const config={matcher:['/((?!api/|_next/|images/|fonts/|brand/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|mp4|webm)$).*)']};
