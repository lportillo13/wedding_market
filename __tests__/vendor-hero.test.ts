import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { parseVendorVideoUrl, prepareVendorHeroPresentation, resolveVendorHeroVideo } from '../shared/vendors/hero';
import { saveVendorHeroPresentation } from '../features/vendors/server/hero';
import { exampleVendorProfile } from '../features/vendors/examples';

const clip = { public_id: 'owned-clip', type: 'video', url: 'https://media.example.com/wedding.mp4' };

test('cover links normalize YouTube variants and preserve private Vimeo embed hashes', () => {
  for (const url of ['https://youtu.be/abcdefghijk?t=30', 'https://www.youtube.com/watch?v=abcdefghijk', 'https://www.youtube.com/shorts/abcdefghijk']) {
    const video = parseVendorVideoUrl(url)!;
    assert.equal(video.provider, 'youtube');
    assert.equal(video.url, 'https://www.youtube.com/watch?v=abcdefghijk');
    assert.ok('embedUrl' in video && video.embedUrl.startsWith('https://www.youtube-nocookie.com/embed/abcdefghijk?'));
    assert.ok('embedUrl' in video && video.embedUrl.includes('playlist=abcdefghijk'));
  }
  const vimeo = parseVendorVideoUrl('https://vimeo.com/123456789/abc123')!;
  assert.equal(vimeo.provider, 'vimeo');
  assert.ok('embedUrl' in vimeo && vimeo.embedUrl.includes('h=abc123&'));
  assert.deepEqual(parseVendorVideoUrl('https://player.vimeo.com/video/123456789?h=abc123'), vimeo);
});

test('cover validation accepts direct secure clips and rejects markup, credentials and nonvideo destinations', () => {
  assert.deepEqual(parseVendorVideoUrl('https://cdn.example.com/clip.WEBM?token=public'), { provider: 'file', url: 'https://cdn.example.com/clip.WEBM?token=public' });
  for (const url of ['http://example.com/a.mp4', 'javascript:alert(1)', '<iframe src="https://youtube.com"></iframe>', 'https://user:secret@example.com/a.mp4', 'https://localhost/a.mp4', 'https://127.0.0.1/a.mp4', 'https://[::1]/a.mp4', 'https://example.com/a.jpg', 'https://example.com/page', 'https://youtube.com/watch?v=short', 'https://vimeo.com/123456789?h=<script>']) assert.equal(parseVendorVideoUrl(url), null, url);
});

test('library covers require an existing owned video and disappear safely when its asset is removed', () => {
  const selected = { mode: 'video', source: 'library', assetId: clip.public_id };
  assert.equal(prepareVendorHeroPresentation(selected, [null, clip]).ok, true);
  assert.equal(prepareVendorHeroPresentation(selected, [{ ...clip, type: 'image' }]).ok, false);
  assert.equal(prepareVendorHeroPresentation({ ...selected, assetId: 'another-vendor-clip' }, [clip]).ok, false);
  assert.equal(resolveVendorHeroVideo(selected, []), null);
  assert.equal(resolveVendorHeroVideo({ mode: 'image' }, [clip]), null);
  assert.equal(resolveVendorHeroVideo(null, [clip]), null);
  assert.deepEqual(resolveVendorHeroVideo(selected, [clip]), { provider: 'file', url: clip.url });
});

test('saving a cover preserves other profile settings and invalid selections never write', async () => {
  let patch: unknown;
  let target: unknown;
  let writes = 0;
  const db = { from: (table: string) => {
    assert.equal(table, 'vendors');
    return { update: (value: unknown) => { patch = value; writes++; return { eq: async (key: string, id: string) => { assert.equal(key, 'id'); target = id; return { error: null }; } }; } };
  } } as unknown as SupabaseClient;
  const vendor = { id: 'authenticated-vendor', gallery_images: [clip], extra_info: { long_description: { es: 'Conservar' }, custom: 'keep' } };
  assert.deepEqual(await saveVendorHeroPresentation(db, vendor, { mode: 'video', source: 'library', assetId: 'foreign' }), { ok: false, error: 'asset' });
  assert.equal(writes, 0);
  assert.equal((await saveVendorHeroPresentation(db, vendor, { mode: 'video', source: 'library', assetId: clip.public_id })).ok, true);
  assert.equal(target, vendor.id);
  assert.deepEqual(patch, { extra_info: { ...vendor.extra_info, hero_presentation: { mode: 'video', source: 'library', assetId: clip.public_id } } });
});

test('video demo retains a photo poster and keeps video out of its photo gallery entries', () => {
  const sample = exampleVendorProfile('example-ritmo-atardecer', 'en')!;
  assert.equal(sample.heroVideo?.provider, 'youtube');
  assert.equal(sample.media.filter(item => item.type === 'photo').length, 3);
  assert.equal(sample.media.filter(item => item.type === 'video').length, 0);
  assert.equal(exampleVendorProfile('example-luz-de-abril', 'en')!.heroVideo, null);
});
