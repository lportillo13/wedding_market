import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import VendorHeader from '../../components/vendor/VendorHeader';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { exampleVendorProfile } from '../../features/vendors/examples';
import { parseVendorVideoUrl } from '../../shared/vendors/hero';

test('external cover providers render a poster and controls before client visibility admits playback', () => {
  const profile = exampleVendorProfile('example-ritmo-atardecer', 'es')!;
  const html = renderToStaticMarkup(<LanguageProvider initialLanguage="es"><VendorHeader vendor={profile.vendor} categories={profile.breadcrumbs.categories} media={[{ ...profile.media[0], url: '/photo.jpg' }]} heroVideo={parseVendorVideoUrl('https://youtu.be/abcdefghijk')!} isVendor={false} isLoggedIn={false} loginHref="/login" isExample /></LanguageProvider>);
  assert.doesNotMatch(html, /<iframe/);
  assert.match(html, /Reproducir video de portada/);
  assert.match(html, /aria-pressed="false"/);
  assert.match(html, /photo.jpg/);
  assert.match(html, /YouTube/);
});
