import { boutiqueRequest } from '../src/features/boutiques/api';
import { supabase } from '../src/lib/supabase';
import { requestJson } from '../src/lib/http';
jest.mock('../src/lib/supabase', () => ({ supabase: { auth: { getSession: jest.fn() } } }));
jest.mock('../src/lib/config', () => ({ mobileConfig: { webApiUrl: 'https://thewedmarket.com' } }));
jest.mock('../src/lib/http', () => ({ requestJson: jest.fn() }));
const session = supabase!.auth.getSession as jest.MockedFunction<()=>Promise<{data:{session:{access_token:string}|null}}>>;
beforeEach(() => { jest.clearAllMocks(); });
test('native catalog permits guests without an authorization header', async () => {
    session.mockResolvedValue({ data: { session: null } });
    await boutiqueRequest('?page=1');
    expect(requestJson).toHaveBeenCalledWith('https://thewedmarket.com/api/boutiques?page=1',{headers:{}});
});
test('each native request uses the current account and preserves mutation retry tokens', async () => {
    const body = { action: 'request', submission: 'fixed-retry-token', data: { note: 'private' } };
    session.mockResolvedValueOnce({ data: { session: { access_token: 'account-a' } } }).mockResolvedValueOnce({ data: { session: { access_token: 'account-b' } } });
    await boutiqueRequest('/account', body);
    await boutiqueRequest('/account?mode=favorites');
    expect(requestJson).toHaveBeenNthCalledWith(1,'https://thewedmarket.com/api/boutiques/account',{method:'POST',headers:{Authorization:'Bearer account-a','Content-Type':'application/json'},body:JSON.stringify(body)});
    expect(requestJson).toHaveBeenNthCalledWith(2,'https://thewedmarket.com/api/boutiques/account?mode=favorites',{headers:{Authorization:'Bearer account-b'}});
});
