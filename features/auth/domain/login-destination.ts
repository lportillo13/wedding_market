type LoginDestination = {
  nextPath: string;
  defaultWorkspace: boolean;
  userId?: string;
};

/** Explicit return paths take priority over the account's default workspace. */
export async function resolveLoginDestination(
  {nextPath, defaultWorkspace, userId}: LoginDestination,
  isVendor: (userId: string) => PromiseLike<boolean>,
) {
  if (!defaultWorkspace || nextPath !== '/account/profile' || !userId) return nextPath;
  return await isVendor(userId) ? '/vendor/profile' : '/account/profile';
}

export function loginCallbackPath(nextPath: string, defaultWorkspace: boolean) {
  return defaultWorkspace ? '/auth/callback' : `/auth/callback?${new URLSearchParams({next: nextPath})}`;
}
