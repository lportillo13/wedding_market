import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getExampleVendor, isExampleVendor, searchExampleVendors } from '../shared/vendors/examples';
import { exampleVendorProfile } from '../features/vendors/examples';

test('sample identities are explicit, non-account records without contact destinations', () => {
  const result = searchExampleVendors();
  assert.equal(result.total, 6);
  assert.equal(new Set(result.items.map(row => row.id)).size, 6);
  for (const row of result.items) {
    assert.equal(row.is_example, true);
    assert.equal(isExampleVendor(row.id), true);
    assert.ok(!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(row.id));
    assert.equal(row.phone, null);
    assert.equal(row.website_url, null);
  }
  assert.equal(getExampleVendor('real-business'), null);
  assert.equal(getExampleVendor('example-unknown'), null);
});

test('sample filtering, search and pagination stay bounded', () => {
  assert.equal(searchExampleVendors({ category: 'photography' }).total, 1);
  assert.equal(searchExampleVendors({ q: '  GUANACASTE  ' }).items[0].slug, 'example-villa-brisa');
  const first = searchExampleVendors({ pageSize: 2 });
  const second = searchExampleVendors({ pageSize: 2, page: 2 });
  assert.equal(first.total, 6);
  assert.equal(first.items.length, 2);
  assert.ok(!second.items.some(row => first.items.some(other => other.id === row.id)));
  assert.equal(searchExampleVendors({ pageSize: 100000 }).pageSize, 50);
  assert.equal(searchExampleVendors({ category: 'nonexistent' }).total, 0);
});

test('web and native examples share bilingual details and category-appropriate fields', () => {
  const photo = getExampleVendor('example-luz-de-abril', 'es')!;
  const web = exampleVendorProfile(photo.slug, 'es')!;
  assert.equal(web.vendor.summary, photo.bio_es);
  assert.equal(web.vendor.description, photo.extra_info_es);
  assert.equal(web.vendor.capacityMax, null);
  assert.equal(web.spaces.length, 0);
  assert.equal(web.pricing[0].itemKey, 'photo_coverage');
  assert.equal(web.breadcrumbs.categories[0].label, 'Fotografía');
  assert.equal(web.media.length, 3);
  assert.match(web.reviews.items[0].title!, /ejemplo/);
  const venue = exampleVendorProfile('example-villa-brisa', 'en')!;
  assert.equal(venue.vendor.capacityMax, 180);
  assert.equal(venue.spaces.length, 2);
});
