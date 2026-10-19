import { requestJson } from "../src/lib/http";

describe("requestJson", () => {
  afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers(); });

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

  test("rejects an already-cancelled request without sending it", async () => {
    const fetchMock = jest.spyOn(global, "fetch");
    const controller = new AbortController();
    controller.abort();
    await expect(requestJson("https://example.com", { signal: controller.signal })).rejects.toMatchObject({ name: "AbortError" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("preserves caller cancellation and clears the request timer", async () => {
    jest.useFakeTimers();
    jest.spyOn(global, "fetch").mockImplementation((_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        const error = new Error("Caller cancelled"); error.name = "AbortError"; reject(error);
      });
    }));
    const controller = new AbortController();
    const result = requestJson("https://example.com", { signal: controller.signal });
    controller.abort();
    await expect(result).rejects.toMatchObject({ name: "AbortError" });
    expect(jest.getTimerCount()).toBe(0);
  });

  test("identifies its own deadline as a timeout", async () => {
    jest.useFakeTimers();
    jest.spyOn(global, "fetch").mockImplementation((_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => { const error = new Error("aborted"); error.name = "AbortError"; reject(error); });
    }));
    const checked = expect(requestJson("https://example.com", {}, 50)).rejects.toThrow("timed out");
    await jest.advanceTimersByTimeAsync(50);
    await checked;
    expect(jest.getTimerCount()).toBe(0);
  });

  test("reports proxy HTML errors without exposing their body", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({ ok: false, status: 502, text: async () => "<html>proxy error</html>" } as Response);
    await expect(requestJson("https://example.com")).rejects.toThrow("Request failed with status 502.");
  });
});
