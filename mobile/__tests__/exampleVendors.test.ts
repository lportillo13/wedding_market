import { fetchVendorDetail, fetchVendors } from '../src/lib/api';
import { requestJson } from '../src/lib/http';

jest.mock('../src/lib/http', () => ({ requestJson: jest.fn() }));

test('explicit sample browsing and localized details never call the live vendor API', async () => {
  const result = await fetchVendors({ examples: true, category: 'photography', language: 'es' });
  expect(result.total).toBe(1);
  const detail = await fetchVendorDetail(result.items[0].slug, 'es');
  expect(detail.is_example).toBe(true);
  expect(detail.category_details?.[0].label).toBe('Fotografía');
  expect(detail.phone).toBeNull();
  expect(detail.website_url).toBeNull();
  expect(detail.capacity_max).toBeNull();
  expect(requestJson).not.toHaveBeenCalled();
});
