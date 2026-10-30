import { isAuthSessionMissingError, type User } from "@supabase/supabase-js";

// Presentation only. Protected pages and APIs still authenticate independently.
export type HeaderUser = Pick<User, "id" | "email" | "user_metadata">;
export type HeaderAccount =
  | { status: "guest" }
  | { status: "authenticated"; user: HeaderUser; isVendor: boolean; isUser?: boolean }
  | { status: "unavailable" };

type AccountSource = {
  getUser: () => PromiseLike<{ data: { user: User | null }; error: unknown }>;
  isVendor: (
    userId: string,
    signal: AbortSignal,
  ) => PromiseLike<{ data: unknown; error: unknown }>;
  isUser?: (userId: string, signal: AbortSignal) => PromiseLike<{data:unknown; error:unknown}>;
};

// Use the server-verified account, rather than asking the phone to refresh a
// session and then contact Supabase again before it can display navigation.
export async function loadHeaderAccount(
  source: AccountSource,
  timeoutMs = 6000,
): Promise<HeaderAccount> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error("Header account check timed out"));
        controller.abort();
      }, timeoutMs);
    });
    return await Promise.race([
      (async (): Promise<HeaderAccount> => {
        const { data, error } = await source.getUser();
        if (isAuthSessionMissingError(error)) return { status: "guest" };
        if (error) return { status: "unavailable" };
        if (!data.user) return { status: "guest" };
        // getUser cannot be cancelled. Ignore a late result after the deadline.
        if (controller.signal.aborted) return { status: "unavailable" };
        const [role, clientRole] = await Promise.all([
          source.isVendor(data.user.id, controller.signal),
          source.isUser ? source.isUser(data.user.id, controller.signal) : Promise.resolve(null),
        ]);
        if (role.error || typeof role.data !== "boolean") {
          return { status: "unavailable" };
        }
        if (clientRole && (clientRole.error || typeof clientRole.data !== 'boolean')) return {status:'unavailable'};
        const { id, email, user_metadata } = data.user;
        return {
          status: "authenticated",
          user: {
            id,
            email,
            user_metadata: {
              full_name: user_metadata?.full_name,
              avatar_image: user_metadata?.avatar_image,
            },
          },
          isVendor: role.data,
          ...(clientRole ? {isUser:clientRole.data as boolean} : {}),
        };
      })(),
      deadline,
    ]);
  } catch {
    return { status: "unavailable" };
  } finally {
    clearTimeout(timer);
  }
}
