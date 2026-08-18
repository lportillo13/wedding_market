import { getMobileConfigErrors, resolveMobileWebApiUrl } from "../src/lib/config";

const validConfig = {
  supabaseUrl: "https://example.supabase.co",
  supabaseAnonKey: "anon-key",
  webUrl: "https://example.com",
  webApiUrl: "https://example.com",
};

describe("mobile configuration", () => {
  test("accepts complete production HTTPS configuration", () => {
    expect(getMobileConfigErrors(validConfig, true)).toEqual([]);
  });

  test("rejects missing values and insecure production URLs", () => {
    expect(getMobileConfigErrors({ ...validConfig, supabaseAnonKey: "", webApiUrl: "http://localhost:3000" }, true)).toEqual([
      "EXPO_PUBLIC_WEB_API_URL must use HTTPS in production.",
      "EXPO_PUBLIC_SUPABASE_ANON_KEY is required.",
    ]);
  });

  test("falls back to the public web URL when the API URL incorrectly targets Supabase", () => {
    expect(resolveMobileWebApiUrl({
      supabaseUrl: "https://project.supabase.co",
      webApiUrl: "https://project.supabase.co",
      webUrl: "https://www.thewedmarket.com",
    })).toBe("https://www.thewedmarket.com");
  });

  test("reports a clear configuration error when no separate web API exists", () => {
    expect(getMobileConfigErrors({
      ...validConfig,
      webUrl: "",
      webApiUrl: validConfig.supabaseUrl,
    }, true)).toContain("EXPO_PUBLIC_WEB_API_URL must point to the Wedding Market website, not Supabase.");
  });
});
