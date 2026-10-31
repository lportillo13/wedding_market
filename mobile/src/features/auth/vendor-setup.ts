import { supabase } from '../../lib/supabase';
import { restoreMobileAuthState } from '../../lib/auth';
import { COMMUNITY_TERMS_VERSION } from '../../../../shared/safety/copy';
import { setSetupIntent } from './setup-intent';
export type VendorSetupDetails = {
    fullName: string;
    phone: string;
    businessName: string;
    category: string;
    city: string;
    region: string;
};
export async function finishVendorSetup(form: VendorSetupDetails, language: 'en' | 'es') {
    if (!supabase)
        throw Error('Account access is unavailable.');
    if (!form.fullName.trim() || !form.businessName.trim() || !form.phone.trim() || !form.category || !form.city.trim())
        throw Error(language === 'es' ? 'Completa los campos obligatorios.' : 'Complete the required fields.');
    if (form.fullName.length > 200 || form.businessName.length > 200 || form.phone.length > 40 || form.city.length > 120 || form.region.length > 120)
        throw Error('Check the length of your details.');
    const state = await restoreMobileAuthState();
    if (!state.user?.email_confirmed_at || !state.profile || state.profile.role === 'admin')
        throw Error('A verified vendor or couple account is required.');
    if (state.profile.hasVendor) {
        await setSetupIntent(null);
        return state;
    }
    if (state.profile.communityTermsVersion !== COMMUNITY_TERMS_VERSION)
        throw Error(language === 'es' ? 'Acepta los términos antes de crear tu negocio.' : 'Accept the terms before creating your business.');
    // Existing RLS and the resumable, consent-gated provisioner own draft creation.
    // This action is reached only after the user reviews and explicitly saves.
    const { error } = await supabase.auth.updateUser({ data: { wedding_market_signup: { version: 1, role: 'vendor', language,
                fullName: form.fullName.trim(), phone: form.phone.trim(), businessName: form.businessName.trim(),
                category: form.category, city: form.city.trim(), region: form.region.trim(), country: 'Costa Rica',
            } } });
    if (error)
        throw error;
    const result = await restoreMobileAuthState();
    if (!result.profile?.hasVendor)
        throw Error('Unable to complete business setup. Please retry.');
    await setSetupIntent(null);
    return result;
}
