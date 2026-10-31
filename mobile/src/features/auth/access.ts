import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../../lib/supabase';
import { MOBILE_AUTH_CALLBACK_URL } from '../../lib/authUtils';
import { createSessionFromMobileAuthUrl, restoreMobileAuthState, type AuthProfile } from '../../lib/auth';
import { planningIssue, type PlanningDetails } from '../../../../shared/accounts/onboarding';
import { mobileConfig } from '../../lib/config';
import { requestJson } from '../../lib/http';
export function needsPlanning(profile: AuthProfile | null) {
    if (!profile || profile.role !== 'client' || profile.hasVendor)
        return false;
    const details = planningFromProfile(profile);
    return [0, 1, 2, 3].some(step => planningIssue(details, step));
}
export function planningFromProfile(profile: AuthProfile | null): PlanningDetails {
    return { fullName: profile?.fullName ?? '', phone: profile?.phone ?? '', country: profile?.country ?? '',
        weddingTheme: profile?.weddingTheme ?? '', weddingDate: profile?.tentativeWeddingDate ?? '',
        guestCount: profile?.guestCount == null ? '' : String(profile.guestCount),
        weddingBudget: profile?.weddingBudget == null ? '' : String(profile.weddingBudget) };
}
export async function requestEmailCode(email: string, signup: boolean, language: 'en' | 'es') {
    if (!supabase)
        throw Error('Account access is unavailable.');
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized))
        throw Error(language === 'es' ? 'Escribe un correo válido.' : 'Enter a valid email address.');
    if (signup) {
        try {
            await requestJson(mobileConfig.webApiUrl + '/api/auth/signup-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: normalized }) }, 10000);
        }
        catch (error) {
            throw Error(error instanceof Error && error.message === 'emailTaken' ? (language === 'es' ? 'Este correo ya tiene una cuenta. Inicia sesión.' : 'This email already has an account. Sign in instead.') : (language === 'es' ? 'No pudimos verificar el correo. Inténtalo de nuevo.' : 'We could not check this email. Please try again.'));
        }
    }
    const { error } = await supabase.auth.signInWithOtp({ email: normalized, options: {
            shouldCreateUser: signup, emailRedirectTo: MOBILE_AUTH_CALLBACK_URL,
            ...(signup ? { data: { language } } : {}),
        } });
    if (error)
        throw error;
}
export async function verifyEmailCode(email: string, token: string) {
    if (!supabase)
        throw Error('Account access is unavailable.');
    if (!/^\d{6,8}$/.test(token.trim()))
        throw Error('Enter the code from your email.');
    const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: token.trim(), type: 'email' });
    if (error)
        throw error;
    return restoreMobileAuthState();
}
// The root Linking listener owns the callback exchange and navigation. Keeping
// that ownership in one place also handles a cold-start return from the browser.
export async function signInWithProvider(provider: 'google' | 'apple') {
    if (!supabase)
        throw Error('Account access is unavailable.');
    const enabled = await requestJson<{
        google: boolean;
        apple: boolean;
    }>(mobileConfig.webApiUrl + '/api/auth/providers');
    if (!enabled[provider])
        throw Error('This sign-in option is temporarily unavailable. Please use email.');
    const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: {
            redirectTo: MOBILE_AUTH_CALLBACK_URL, skipBrowserRedirect: true,
            ...(provider === 'google' ? { queryParams: { prompt: 'select_account' } } : {}),
        } });
    if (error)
        throw error;
    if (!data.url)
        throw Error('Unable to open sign in.');
    const result = await WebBrowser.openAuthSessionAsync(data.url, MOBILE_AUTH_CALLBACK_URL);
    // iOS ASWebAuthenticationSession returns the URL without a Linking event.
    if (result.type === 'success')
        return createSessionFromMobileAuthUrl(result.url);
    return null;
}
export async function savePlanning(details: PlanningDetails, language: 'en' | 'es') {
    if (!supabase)
        throw Error('Account access is unavailable.');
    for (let step = 0; step < 5; step++)
        if (planningIssue(details, step))
            throw Error(language === 'es' ? 'Revisa tus datos.' : 'Check your details.');
    const state = await restoreMobileAuthState();
    if (!state.user?.email_confirmed_at || state.profile?.role !== 'client' || state.profile.hasVendor)
        throw Error('A verified couple account is required.');
    const { error } = await supabase.from('profiles').update({
        full_name: details.fullName.trim(), phone: details.phone.trim(), country: details.country.trim(), language,
        wedding_theme: details.weddingTheme, tentative_wedding_date: details.weddingDate,
        guest_count: details.guestCount.trim() ? Number(details.guestCount) : null,
        wedding_budget: details.weddingBudget.trim() ? Number(details.weddingBudget) : null,
    }).eq('id', state.user.id);
    if (error)
        throw error;
    return restoreMobileAuthState();
}
