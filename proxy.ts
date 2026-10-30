import type {NextRequest} from 'next/server';
import {refreshBrowserSession} from '@/lib/supabase/proxy';
export async function proxy(request:NextRequest){return refreshBrowserSession(request);}
export const config={matcher:['/((?!api/|_next/|images/|fonts/|brand/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|mp4|webm)$).*)']};
