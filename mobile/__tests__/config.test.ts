import { getMobileConfigErrors } from "../src/lib/config";

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
});
