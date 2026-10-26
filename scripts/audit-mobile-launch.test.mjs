import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { inspectPng, listingErrors } from './audit-mobile-launch.mjs';

test('notification inspection rejects an empty transparent image', async () => {
  const png = await sharp({ create: { width: 96, height: 96, channels: 4, background: '#00000000' } }).png().toBuffer();
  const result = await inspectPng(png);
  assert.equal(result.transparent, true);
  assert.equal(result.visible, 0);
});

test('notification inspection accepts a visible white mark with transparent padding', async () => {
  const mark = await sharp({ create: { width: 24, height: 24, channels: 4, background: '#ffffff' } }).png().toBuffer();
  const png = await sharp({ create: { width: 96, height: 96, channels: 4, background: '#00000000' } }).composite([{ input: mark, left: 36, top: 36 }]).png().toBuffer();
  const result = await inspectPng(png);
  assert.equal(result.white, true);
  assert.equal(result.transparent, true);
  assert.equal(result.clearPixels, 8640);
  assert.equal(result.visible, 576);
});

test('notification inspection rejects a colored launcher image and an opaque white square', async () => {
  const colored = await sharp({ create: { width: 96, height: 96, channels: 4, background: '#b8922a' } }).png().toBuffer();
  assert.equal((await inspectPng(colored)).white, false);
  const white = await sharp({ create: { width: 96, height: 96, channels: 4, background: '#ffffff' } }).png().toBuffer();
  assert.equal((await inspectPng(white)).transparent, false);
});

test('listing validation catches missing languages and overlong store fields', () => {
  assert.deepEqual(listingErrors({ locales: {} }), ['Missing en listing', 'Missing es listing']);
  const copy = { name: 'The Wedding Market', subtitle: 'A wedding app', shortDescription: 'x'.repeat(81), description: 'Wedding vendors', keywords: 'wedding' };
  assert.deepEqual(listingErrors({ locales: { en: copy, es: { ...copy, shortDescription: 'Bodas' } } }), ['en.shortDescription must contain 1–80 characters']);
});

test('a translucent white square is not a transparent notification background', async () => {
  const png = await sharp({ create: { width: 96, height: 96, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0.5 } } }).png().toBuffer();
  const result = await inspectPng(png);
  assert.equal(result.transparent, true);
  assert.equal(result.clearPixels, 0);
});
