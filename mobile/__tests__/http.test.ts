import { requestJson } from "../src/lib/http";

describe("requestJson", () => {
  afterEach(() => jest.restoreAllMocks());

  test("returns parsed successful responses", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true }),
    } as Response);

    await expect(requestJson<{ ok: boolean }>("https://example.com")).resolves.toEqual({ ok: true });
  });

  test("surfaces API error messages", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ message: "Invalid request." }),
    } as Response);

    await expect(requestJson("https://example.com")).rejects.toThrow("Invalid request.");
  });
});
