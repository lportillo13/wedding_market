const mockUpdate = jest.fn();
jest.mock('../src/lib/supabase', () => ({ supabase: { from: () => ({ update: (values: unknown) => { mockUpdate(values); return { eq: async () => ({ error: null }) }; } }) } }));
import { saveVendorContact, saveVendorStartingPrice } from '../src/lib/vendorProfile';
beforeEach(() => mockUpdate.mockClear());
test('saving contact details cannot clear or change the independently saved starting price', async () => {
    await saveVendorContact('isolated', { phone: '123', website_url: '', map_url: '', address_label: '', event_types: '', years_in_business: '', languages: '', team_size_range: '', starting_price: '' });
    expect(mockUpdate.mock.calls[0][0]).not.toHaveProperty('starting_price_cents');
});
test('starting price saves only price fields and supports CRC and zero', async () => {
    await saveVendorStartingPrice('isolated', { starting_price: '0', starting_price_currency: 'CRC' });
    expect(mockUpdate).toHaveBeenCalledWith({ starting_price_cents: 0, starting_price_currency: 'CRC' });
    await expect(saveVendorStartingPrice('isolated', { starting_price: '30', starting_price_currency: 'INVALID' })).rejects.toThrow();
});
