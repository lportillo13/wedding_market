// lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function getSupabaseServer() {
  const cookieStore = await cookies(); // Next 15: await
  const isProd = process.env.NODE_ENV === "production";

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({
              name,
              value,
              ...options,
              path: options?.path ?? "/",
              sameSite: (options?.sameSite as any) ?? "lax",
              secure: isProd, // ⬅️ critical: false on localhost
            });
          } catch {}
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({
              name,
              value: "",
              ...options,
              path: options?.path ?? "/",
              sameSite: (options?.sameSite as any) ?? "lax",
              secure: isProd, // ⬅️ critical
              maxAge: 0,
            });
          } catch {}
        },
      },
    }
  );
}
