jest.mock("../src/lib/config", () => ({
  mobileConfig: {
    supabaseUrl: "https://example.supabase.co",
    supabaseAnonKey: "anon-key",
    webUrl: "https://www.example.com/",
    webApiUrl: "https://api.example.com/",
  },
}));

import { externalMapUrl, joinWebPath, normalizeBaseUrl, vendorShareUrl } from "../src/lib/urls";

describe("mobile URLs", () => {
  test("normalizes and joins web paths", () => {
    expect(normalizeBaseUrl(" https://example.com/// ")).toBe("https://example.com");
    expect(joinWebPath("https://example.com/", "/privacy")).toBe("https://example.com/privacy");
  });

  test("creates a production-safe encoded vendor share URL", () => {
    expect(vendorShareUrl("my vendor")).toBe("https://www.example.com/vendors/my%20vendor");
  });

  test("prefers coordinates for external map searches", () => {
    expect(externalMapUrl({ businessName: "Vendor", lat: 40.7, lng: -74 })).toContain("query=40.7%2C-74");
  });
});
