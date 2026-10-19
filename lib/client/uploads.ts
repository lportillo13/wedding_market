export type UploadResponse<T = Record<string, unknown>> = T;

export function uploadWithProgress<T>(
  url: string,
  formData: FormData,
  onProgress?: (percent: number) => void,
  options: { signal?: AbortSignal; timeoutMs?: number } = {},
) {
  return new Promise<UploadResponse<T>>((resolve, reject) => {
    if (options.signal?.aborted) {
      reject(new Error("Upload cancelled."));
      return;
    }
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.timeout = options.timeoutMs ?? 180_000;
    const cleanup = () => options.signal?.removeEventListener("abort", cancel);
    const fail = (message: string) => {
      cleanup();
      reject(new Error(message));
    };
    const cancel = () => {
      xhr.abort();
      fail("Upload cancelled.");
    };

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable || !onProgress) {
        return;
      }
      onProgress(Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100))));
    });

    xhr.addEventListener("load", () => {
      cleanup();
      let body: unknown = {};
      try {
        body = xhr.responseText ? JSON.parse(xhr.responseText) : {};
      } catch {
        fail(xhr.status >= 200 && xhr.status < 300
          ? "The server returned an invalid upload response."
          : `Upload failed (status ${xhr.status}). Please try again.`);
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body as T);
        return;
      }

      const error = body && typeof body === "object" && "error" in body ? body.error : null;
      fail(typeof error === "string" ? error : `Upload failed (status ${xhr.status}).`);
    });

    xhr.addEventListener("error", () => fail("Upload failed. Check your connection and try again."));
    xhr.addEventListener("timeout", () => fail("The upload timed out. Please try again."));
    xhr.addEventListener("abort", () => fail("Upload cancelled."));
    options.signal?.addEventListener("abort", cancel, { once: true });
    try {
      xhr.send(formData);
    } catch {
      fail("Upload failed. Check your connection and try again.");
    }
  });
}
