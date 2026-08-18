import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicKey, getSupabaseUrl } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Returns a Supabase client authenticated by either the web session cookie or
 * the bearer token sent by the native app.
 */
export async function createAuthenticatedRequestClient(request: Request): Promise<SupabaseClient> {
  const authorization = request.headers.get("authorization");
  const url = getSupabaseUrl();
  const publicKey = getSupabasePublicKey();

  // Native requests do not have the web session cookie. Prefer their bearer
  // token immediately and always attach the Supabase API key alongside it.
  if (authorization?.startsWith("Bearer ") && url && publicKey) {
    return createClient(url, publicKey, {
      global: {
        headers: {
          apikey: publicKey,
          Authorization: authorization,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  const cookieClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await cookieClient.auth.getUser();

  if (user) {
    return cookieClient;
  }

  return cookieClient;
}
