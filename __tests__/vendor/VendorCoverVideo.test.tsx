import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import VendorCoverVideo from '../../components/vendor/VendorCoverVideo';
import { parseVendorVideoUrl } from '../../shared/vendors/hero';

test('external cover providers wait for visitor playback and render a poster with accessible controls', () => {
  const html = renderToStaticMarkup(<VendorCoverVideo source={parseVendorVideoUrl('https://youtu.be/abcdefghijk')!} poster="/photo.jpg" name="Sample" language="es" />);
  assert.doesNotMatch(html, /<iframe/);
  assert.match(html, /Reproducir video de portada/);
  assert.match(html, /aria-pressed="false"/);
  assert.match(html, /photo.jpg/);
  assert.match(html, /YouTube/);
});
