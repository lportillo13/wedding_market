import { MOBILE_AUTH_CALLBACK_URL, parseMobileAuthCallback } from "../src/lib/authUtils";

describe("mobile auth callback", () => {
  test("parses Supabase implicit-flow tokens from the URL fragment", () => {
    expect(
      parseMobileAuthCallback(
        `${MOBILE_AUTH_CALLBACK_URL}#access_token=access-123&refresh_token=refresh-456&type=signup`,
      ),
    ).toEqual({
      accessToken: "access-123",
      refreshToken: "refresh-456",
      code: null,
      type: "signup",
    });
  });

  test("parses a PKCE authorization code", () => {
    expect(parseMobileAuthCallback(`${MOBILE_AUTH_CALLBACK_URL}?code=code-123`)).toEqual({
      accessToken: null,
      refreshToken: null,
      code: "code-123",
      type: null,
    });
  });

  test("identifies password recovery links", () => {
    expect(
      parseMobileAuthCallback(
        `${MOBILE_AUTH_CALLBACK_URL}#access_token=access-123&refresh_token=refresh-456&type=recovery`,
      ),
    ).toMatchObject({ type: "recovery" });
  });

  test("ignores unrelated app links", () => {
    expect(parseMobileAuthCallback("theweddingmarket://vendor/example")).toBeNull();
  });

  test("surfaces errors returned by Supabase", () => {
    expect(() =>
      parseMobileAuthCallback(
        `${MOBILE_AUTH_CALLBACK_URL}#error=access_denied&error_description=Confirmation+link+expired`,
      ),
    ).toThrow("Confirmation link expired");
  });
});
