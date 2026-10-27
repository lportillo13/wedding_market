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
  const bearer = authorization?.match(/^Bearer\s+(\S+)$/i);
  if (bearer && url && publicKey) {
    return createClient(url, publicKey, {
      global: {
        headers: {
          apikey: publicKey,
          Authorization: `Bearer ${bearer[1]}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  // The caller validates getUser once. Creating a client does not authenticate it.
  return createSupabaseServerClient();
}

/** Use after the route verifies getUser; native bearer clients have no refresh session. */
export async function updateAuthenticatedUserMetadata(request: Request, client: SupabaseClient, data: Record<string, unknown>): Promise<{error: Error | null}> {
  const bearer = request.headers.get('authorization')?.match(/^Bearer\s+(\S+)$/i);
  if (!bearer) return client.auth.updateUser({data});
  const url = getSupabaseUrl(), publicKey = getSupabasePublicKey();
  if (!url || !publicKey) return {error:new Error('Profile updates are temporarily unavailable.')};
  try {
    const response = await fetch(`${url.replace(/\/$/, '')}/auth/v1/user`, {
      method:'PUT', redirect:'error', signal:AbortSignal.timeout(15_000),
      headers:{apikey:publicKey,Authorization:`Bearer ${bearer[1]}`,'Content-Type':'application/json'},
      body:JSON.stringify({data}),
    });
    await response.body?.cancel();
    return {error:response.ok?null:new Error('Unable to save your profile image. Please try again.')};
  } catch {return {error:new Error('Unable to save your profile image. Please try again.')}}
}
