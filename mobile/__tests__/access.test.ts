const mockOtp = jest.fn(), mockVerify = jest.fn(), mockOAuth = jest.fn(), mockBrowser = jest.fn(), mockRestore = jest.fn(), mockCallback = jest.fn(), mockUpdate = jest.fn(), mockRequest = jest.fn();
jest.mock('expo-web-browser', () => ({ openAuthSessionAsync: (...args: unknown[]) => mockBrowser(...args) }));
jest.mock('../src/lib/supabase', () => ({ supabase: { auth: { signInWithOtp: (...args: unknown[]) => mockOtp(...args), verifyOtp: (...args: unknown[]) => mockVerify(...args), signInWithOAuth: (...args: unknown[]) => mockOAuth(...args) }, from: () => ({ update: (data: unknown) => ({ eq: () => mockUpdate(data) }) }) } }));
jest.mock('../src/lib/auth', () => ({ restoreMobileAuthState: () => mockRestore(), createSessionFromMobileAuthUrl: (url: string) => mockCallback(url) }));
jest.mock('../src/lib/http', () => ({ requestJson: (...args: unknown[]) => mockRequest(...args) }));
jest.mock('../src/lib/config', () => ({ mobileConfig: { webApiUrl: 'https://thewedmarket.com' } }));
import { needsPlanning, requestEmailCode, verifyEmailCode, signInWithProvider, savePlanning } from '../src/features/auth/access';
import { planningIssue, firstPlanningStep } from '../../shared/accounts/onboarding';
import type { AuthProfile } from '../src/lib/auth';
const details = { fullName: 'Test couple', phone: '+506 2222 2222', country: 'United States', weddingTheme: 'beach', weddingDate: '2027-05-20', guestCount: '', weddingBudget: '0' };
beforeEach(() => { jest.resetAllMocks(); mockOtp.mockResolvedValue({ error: null }); mockVerify.mockResolvedValue({ error: null }); mockUpdate.mockResolvedValue({ error: null }); mockRequest.mockResolvedValue({ ok: true, google: true, apple: true }); });
test('optional estimates allow a zero budget and reject fractions/invalid dates', () => {
    expect(planningIssue(details, 4)).toBeNull();
    expect(firstPlanningStep({ ...details, phone: '' })).toBe(1);
    expect(planningIssue({ ...details, guestCount: '1.5' }, 4)).toBe('guests');
    expect(planningIssue({ ...details, weddingDate: '2027-02-30' }, 3)).toBe('date');
    expect(planningIssue({ ...details, weddingBudget: '-1' }, 4)).toBe('budget');
});
test('existing email-code login cannot create an account; signup checks availability first', async () => {
    await requestEmailCode(' Couple@Example.invalid ', false, 'en');
    expect(mockRequest).not.toHaveBeenCalled();
    expect(mockOtp).toHaveBeenLastCalledWith(expect.objectContaining({ email: 'couple@example.invalid', options: expect.objectContaining({ shouldCreateUser: false }) }));
    await requestEmailCode('new@example.invalid', true, 'es');
    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(mockOtp).toHaveBeenLastCalledWith(expect.objectContaining({ options: expect.objectContaining({ shouldCreateUser: true, data: { language: 'es' } }) }));
});
test('registered or unavailable signup checks never send a signup code', async () => {
    mockRequest.mockRejectedValue(Error('emailTaken'));
    await expect(requestEmailCode('used@example.invalid', true, 'es')).rejects.toThrow('ya tiene una cuenta');
    expect(mockOtp).not.toHaveBeenCalled();
});
test('email verification rejects invalid and expired codes without restoring a session', async () => {
    await expect(verifyEmailCode('a@example.invalid', 'abc')).rejects.toThrow();
    expect(mockVerify).not.toHaveBeenCalled();
    mockVerify.mockResolvedValue({ error: Error('Expired code') });
    await expect(verifyEmailCode('a@example.invalid', '12345678')).rejects.toThrow('Expired');
    expect(mockRestore).not.toHaveBeenCalled();
});
test('social login uses the native callback and handles browser cancellation', async () => {
    mockOAuth.mockResolvedValue({ data: { url: 'https://accounts.example.invalid?code_challenge_method=s256' }, error: null });
    mockBrowser.mockResolvedValue({ type: 'cancel' });
    await expect(signInWithProvider('google')).resolves.toBeNull();
    expect(mockCallback).not.toHaveBeenCalled();
    expect(mockOAuth).toHaveBeenCalledWith(expect.objectContaining({ provider: 'google', options: expect.objectContaining({ redirectTo: 'theweddingmarket://auth/callback', skipBrowserRedirect: true }) }));
    mockBrowser.mockResolvedValue({ type: 'success', url: 'theweddingmarket://auth/callback?code=fixture' });
    mockCallback.mockResolvedValue({ state: {} });
    await signInWithProvider('apple');
    expect(mockCallback).toHaveBeenCalledWith('theweddingmarket://auth/callback?code=fixture');
});
test('disabled providers fail closed without opening a browser', async () => { mockRequest.mockResolvedValue({ google: false, apple: false }); await expect(signInWithProvider('google')).rejects.toThrow('unavailable'); expect(mockOAuth).not.toHaveBeenCalled(); });
test('native OAuth rejects a plain challenge before opening the provider',async()=>{
    mockOAuth.mockResolvedValue({data:{url:'https://accounts.example.invalid?code_challenge_method=plain'},error:null});
    await expect(signInWithProvider('google')).rejects.toThrow('Secure sign-in');
    expect(mockBrowser).not.toHaveBeenCalled();
});
test('planning save requires a verified couple and preserves blank guests and zero budget', async () => {
    const user = { id: 'isolated', email_confirmed_at: '2026-10-31' };
    mockRestore.mockResolvedValue({ user, profile: { role: 'vendor' } });
    await expect(savePlanning(details, 'en')).rejects.toThrow('verified couple');
    expect(mockUpdate).not.toHaveBeenCalled();
    mockRestore.mockResolvedValue({ user, profile: { role: 'client', hasVendor: false } });
    await savePlanning(details, 'es');
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ country: 'United States', guest_count: null, wedding_budget: 0, language: 'es' }));
});
test('vendor/admin accounts are never forced into wedding onboarding', () => {
    for (const role of ['vendor', 'admin'])
        expect(needsPlanning({ role } as AuthProfile)).toBe(false);
    expect(needsPlanning({ role: 'client', hasVendor: true } as AuthProfile)).toBe(false);
    expect(needsPlanning({ role: 'client', fullName: 'Test' } as AuthProfile)).toBe(true);
});
