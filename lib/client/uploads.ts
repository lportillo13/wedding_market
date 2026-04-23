export type UploadResponse<T = Record<string, unknown>> = T;

export function uploadWithProgress<T>(url: string, formData: FormData, onProgress?: (percent: number) => void) {
  return new Promise<UploadResponse<T>>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable || !onProgress) {
        return;
      }
      onProgress(Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100))));
    });

    xhr.addEventListener("load", () => {
      const body = xhr.responseText ? JSON.parse(xhr.responseText) : {};
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body as T);
        return;
      }

      reject(new Error((body && typeof body.error === "string" ? body.error : null) ?? "Upload failed."));
    });

    xhr.addEventListener("error", () => reject(new Error("Upload failed.")));
    xhr.send(formData);
  });
}
