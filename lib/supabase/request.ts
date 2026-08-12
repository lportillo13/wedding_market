import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Returns a Supabase client authenticated by either the web session cookie or
 * the bearer token sent by the native app.
 */
export async function createAuthenticatedRequestClient(request: Request): Promise<SupabaseClient> {
  const cookieClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await cookieClient.auth.getUser();

  if (user) {
    return cookieClient;
  }

  const authorization = request.headers.get("authorization");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!authorization?.startsWith("Bearer ") || !url || !anonKey) {
    return cookieClient;
  }

  return createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
