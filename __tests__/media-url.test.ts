import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveMediaUrl } from '@/lib/media-url';

test('legacy media is migrated only from the configured public bucket host',()=>{
  const prior=process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL;
  const legacy=process.env.NEXT_PUBLIC_R2_LEGACY_PUBLIC_BASE_URL;
  process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL='https://media.example.test';
  process.env.NEXT_PUBLIC_R2_LEGACY_PUBLIC_BASE_URL='https://pub-legacy.r2.dev';
  try {
    assert.equal(resolveMediaUrl('https://pub-legacy.r2.dev/vendors/a/photo.webp'),'https://media.example.test/vendors/a/photo.webp');
    assert.equal(resolveMediaUrl('https://pub-unrelated.r2.dev/vendors/a/photo.webp'),'https://pub-unrelated.r2.dev/vendors/a/photo.webp');
    assert.equal(resolveMediaUrl('https://images.unsplash.com/photo'),'https://images.unsplash.com/photo');
  } finally {
    if (prior===undefined) delete process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL;else process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL=prior;
    if (legacy===undefined) delete process.env.NEXT_PUBLIC_R2_LEGACY_PUBLIC_BASE_URL;else process.env.NEXT_PUBLIC_R2_LEGACY_PUBLIC_BASE_URL=legacy;
  }
});
