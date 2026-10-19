import assert from "node:assert/strict";
import test from "node:test";
import { uploadWithProgress } from "@/lib/client/uploads";

class UploadRequest extends EventTarget {
  static latest: UploadRequest;
  upload = new EventTarget();
  responseText = "";
  status = 0;
  timeout = 0;
  sent = false;
  constructor() { super(); UploadRequest.latest = this; }
  open() {}
  send() { this.sent = true; }
  abort() { this.dispatchEvent(new Event("abort")); }
}

test("upload responses always settle, including proxy HTML errors and malformed JSON", async (t) => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "XMLHttpRequest");
  Object.defineProperty(globalThis, "XMLHttpRequest", { value: UploadRequest, configurable: true });
  t.after(() => { if (original) Object.defineProperty(globalThis, "XMLHttpRequest", original); else Reflect.deleteProperty(globalThis, "XMLHttpRequest"); });
  for (const [status, body, message] of [
    [413, "<html>Too large</html>", /status 413/],
    [200, "invalid JSON", /invalid upload response/],
    [429, '{"error":"Too many uploads"}', /Too many uploads/],
  ] as const) {
    const result = uploadWithProgress("/api/uploads", new FormData());
    const request = UploadRequest.latest;
    request.status = status;
    request.responseText = body;
    request.dispatchEvent(new Event("load"));
    await assert.rejects(result, message);
  }
  const success = uploadWithProgress<{ ok: boolean }>("/api/uploads", new FormData());
  UploadRequest.latest.status = 200;
  UploadRequest.latest.responseText = '{"ok":true}';
  UploadRequest.latest.dispatchEvent(new Event("load"));
  assert.deepEqual(await success, { ok: true });
});

test("uploads reject cancellation, timeout and network failures", async (t) => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "XMLHttpRequest");
  Object.defineProperty(globalThis, "XMLHttpRequest", { value: UploadRequest, configurable: true });
  t.after(() => { if (original) Object.defineProperty(globalThis, "XMLHttpRequest", original); else Reflect.deleteProperty(globalThis, "XMLHttpRequest"); });
  for (const event of ["timeout", "error", "abort"]) {
    const result = uploadWithProgress("/api/uploads", new FormData(), undefined, { timeoutMs: 100 });
    assert.equal(UploadRequest.latest.timeout, 100);
    UploadRequest.latest.dispatchEvent(new Event(event));
    await assert.rejects(result);
  }
  const controller = new AbortController();
  const result = uploadWithProgress("/api/uploads", new FormData(), undefined, { signal: controller.signal });
  controller.abort();
  await assert.rejects(result, /cancelled/);
  await assert.rejects(uploadWithProgress("/api/uploads", new FormData(), undefined, { signal: controller.signal }), /cancelled/);
});
