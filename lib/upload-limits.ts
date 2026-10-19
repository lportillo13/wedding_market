export const MAX_MULTIPART_BYTES = 55 * 1024 * 1024;

export class UploadLimitError extends Error {
  constructor(message: string, public readonly status: number = 413) { super(message); }
}

/** Enforce the actual streamed size, including requests without Content-Length. */
export async function readUploadForm(request: Request): Promise<FormData> {
  const length = request.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_MULTIPART_BYTES)) {
    throw new UploadLimitError('The upload must be 55MB or smaller.');
  }
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('multipart/form-data;')) {
    throw new UploadLimitError('Expected a multipart upload.', 415);
  }
  const reader = request.body?.getReader();
  if (!reader) throw new UploadLimitError('The upload is empty.', 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  let timedOut=false;
  const deadline=setTimeout(()=>{timedOut=true;void reader.cancel();},30000);
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_MULTIPART_BYTES) {
        await reader.cancel();
        throw new UploadLimitError('The upload must be 55MB or smaller.');
      }
      chunks.push(value);
    }
    if (timedOut) throw new UploadLimitError('The upload took too long. Please try again.',408);
  } finally { clearTimeout(deadline); reader.releaseLock(); }
  try {
    return await new Response(Buffer.concat(chunks), { headers: { 'content-type': request.headers.get('content-type')! } }).formData();
  } catch { throw new UploadLimitError('Invalid multipart upload.', 400); }
}

// Reject excess work immediately; never retain an unbounded queue of file buffers.
let activeUploads = 0;
export function reserveUpload() {
  if (activeUploads >= 3) throw new UploadLimitError('Uploads are busy. Please try again shortly.', 429);
  activeUploads += 1;
  let released = false;
  return () => { if (!released) { released = true; activeUploads -= 1; } };
}
