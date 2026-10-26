import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import { MAX_MULTIPART_BYTES, readUploadForm, reserveUpload, UploadLimitError } from '@/lib/upload-limits';
import { processImageUpload, validateVideoUpload } from '@/features/media/server/processing';

test('multipart size is checked even when Content-Length is absent or false', async () => {
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) { controller.enqueue(new Uint8Array(1024 * 1024)); },
    cancel() { cancelled = true; },
  });
  const request = new Request('http://localhost/upload', {
    method: 'POST', headers: { 'content-type': 'multipart/form-data; boundary=x' }, body, duplex: 'half',
  } as RequestInit & { duplex: 'half' });
  await assert.rejects(readUploadForm(request), (e: unknown) => e instanceof UploadLimitError && e.status === 413);
  assert.equal(cancelled, true);
  await assert.rejects(readUploadForm(new Request('http://localhost/upload', {
    method: 'POST', headers: { 'content-length': String(MAX_MULTIPART_BYTES + 1) },
  })), /55MB/);
});

test('normal multipart uploads survive the bounded reader', async () => {
  const data = new FormData(); data.set('target','vendor-logo'); data.set('file',new File(['test'],'a.png',{type:'image/png'}));
  const form = await readUploadForm(new Request('http://localhost/upload',{method:'POST',body:data}));
  assert.equal(form.get('target'),'vendor-logo');
});

test('upload admission rejects excess work and releases slots exactly once', () => {
  const releases = [reserveUpload(),reserveUpload(),reserveUpload()];
  assert.throws(reserveUpload, (e: unknown) => e instanceof UploadLimitError && e.status === 429);
  releases.forEach(release=>{release();release();});
  reserveUpload()();
});

test('media limits reject oversized videos and disguised vector content', async () => {
  assert.match(validateVideoUpload({size:51*1024*1024,type:'video/mp4'} as File) ?? '',/50MB/);
  await assert.rejects(processImageUpload(new File(['<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>'],'fake.jpg',{type:'image/jpeg'})),/Unsupported image content/);
  const input = await sharp({create:{width:12,height:8,channels:3,background:'#abc'}}).png().toBuffer();
  const processed = await processImageUpload(new File([new Uint8Array(input)],'valid.png',{type:'image/png'}));
  assert.equal(processed.contentType,'image/webp'); assert.equal(processed.asset.width,12);
});
