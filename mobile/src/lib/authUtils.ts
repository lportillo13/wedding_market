export const MOBILE_AUTH_CALLBACK_URL = "theweddingmarket://auth/callback";

export type MobileAuthCallback = {
  accessToken: string | null;
  refreshToken: string | null;
  code: string | null;
  type: string | null;
};

function callbackParams(url: string) {
  const [urlWithoutHash, hash = ""] = url.split("#", 2);
  const parsed = new URL(urlWithoutHash);
  const query = parsed.searchParams;
  const fragment = new URLSearchParams(hash);
  const get = (name: string) => fragment.get(name) ?? query.get(name);

  return { get };
}

export function parseMobileAuthCallback(url: string): MobileAuthCallback | null {
  if (!url.startsWith(MOBILE_AUTH_CALLBACK_URL)) return null;

  const { get } = callbackParams(url);
  const error = get("error_description") ?? get("error");
  if (error) {
    throw new Error(error.replace(/\+/g, " "));
  }

  return {
    accessToken: get("access_token"),
    refreshToken: get("refresh_token"),
    code: get("code"),
    type: get("type"),
  };
}
