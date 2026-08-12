function payloadMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const message = record.message ?? record.error;
  return typeof message === "string" && message.trim() ? message.trim() : null;
}

export async function requestJson<T>(url: string, init: RequestInit = {}, timeoutMs = 15_000): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const raw = await response.text();
    let payload: unknown = null;

    if (raw) {
      try {
        payload = JSON.parse(raw);
      } catch {
        throw new Error(response.ok ? "The server returned an invalid response." : `Request failed with status ${response.status}.`);
      }
    }

    if (!response.ok) {
      throw new Error(payloadMessage(payload) ?? `Request failed with status ${response.status}.`);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("The request timed out. Check your connection and try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
