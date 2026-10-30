import { createBrowserClient } from "@supabase/ssr";
import {sessionCookieOptions} from './session-options';

export const supabaseBrowser = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {cookieOptions:sessionCookieOptions,auth:{persistSession:true,autoRefreshToken:true,flowType:'pkce'}},
);
