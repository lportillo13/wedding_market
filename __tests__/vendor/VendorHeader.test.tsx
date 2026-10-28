import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import VendorHeader from '../../components/vendor/VendorHeader';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { exampleVendorProfile } from '../../features/vendors/examples';
import { localizeVendorCategory } from '../../shared/vendors/category-label';
import { dictionaries } from '../../lib/i18n';

test('hero category uses the selected UI language even when profile props came from another locale', () => {
  for (const [initial, selected, expected] of [['es', 'en', 'Photography'], ['en', 'es', 'Fotografía']] as const) {
    const profile = exampleVendorProfile('example-luz-de-abril', initial)!;
    const html = renderToStaticMarkup(<LanguageProvider initialLanguage={selected}><VendorHeader vendor={profile.vendor} media={[]} categories={profile.breadcrumbs.categories} isVendor={false} isLoggedIn={false} loginHref="/login" isExample /></LanguageProvider>);
    assert.equal(html.match(/class="wm-profile-hero__category">([^<]*)</)?.[1], expected);
  }
});

test('category translation accepts a canonical slug and preserves an unknown custom category', () => {
  assert.equal(localizeVendorCategory({ key: 'old-id', slug: ' PHOTOGRAPHY ', label: 'Fotografía' }, dictionaries.en.home.categories.items), 'Photography');
  assert.equal(localizeVendorCategory({ key: 'custom', label: 'Custom service' }, dictionaries.es.home.categories.items), 'Custom service');
});
