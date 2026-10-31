import { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { type AuthProfile, type AuthState } from '../../lib/auth';
import { copy } from '../../i18n/copy';
import { styles } from '../../theme/styles';
import { FieldLabel, NativeSelect } from '../../ui/forms';
import { categoryLabel } from '../../content/catalog';
import { supabase } from '../../lib/supabase';
import { localizedText } from '../../lib/vendorProfile';
import { CommunityConsent } from '../account/CommunityConsent';
import { COMMUNITY_TERMS_VERSION } from '../../../../shared/safety/copy';
import { finishVendorSetup, type VendorSetupDetails } from './vendor-setup';
import { accessCopy } from './access-copy';
export function VendorSetup({ profile, email, language, onComplete, onCancel }: {
    profile: AuthProfile | null;
    email: string;
    language: 'en' | 'es';
    onComplete: (state: AuthState) => void;
    onCancel: () => void;
}) {
    const labels = copy[language], text = accessCopy[language];
    const [form, setForm] = useState<VendorSetupDetails>({ fullName: profile?.fullName ?? '', phone: profile?.phone ?? '', businessName: '', category: '', city: '', region: '' });
    const [step, setStep] = useState(0), [busy, setBusy] = useState(false), [error, setError] = useState('');
    const [accepted, setAccepted] = useState(profile?.communityTermsVersion === COMMUNITY_TERMS_VERSION);
    const [options, setOptions] = useState<{
        value: string;
        label: string;
    }[]>([]);
    useEffect(() => { let active = true; void (async () => { const result = await supabase!.from('categories').select('key,label').order('key').limit(100); if (active) {
        if (result.error)
            setError(language === 'es' ? 'No se pudieron cargar las categorías.' : 'Unable to load service categories.');
        else
            setOptions((result.data ?? []).map(row => ({ value: row.key, label: localizedText(row.label, language) || row.key })));
    } })(); return () => { active = false; }; }, [language]);
    function input(key: keyof VendorSetupDetails, label: string) { return <View key={key}><FieldLabel text={label + ' *'}/><TextInput accessibilityLabel={label} style={styles.input} value={form[key]} maxLength={key === 'phone' ? 40 : 200} onChangeText={value => setForm(current => ({ ...current, [key]: value }))}/></View>; }
    const valid = [Boolean(form.fullName.trim() && form.phone.trim()), Boolean(form.businessName.trim()), Boolean(form.category), Boolean(form.city.trim()), true, true];
    async function next() { if (busy)
        return; setError(''); if (!valid[step]) {
        setError(labels.requiredFields);
        return;
    } if (step < 5) {
        setStep(step + 1);
        return;
    } setBusy(true); try {
        onComplete(await finishVendorSetup(form, language));
    }
    catch (e) {
        setError(e instanceof Error ? e.message : labels.saveFailed);
    }
    finally {
        setBusy(false);
    } }
    return <View style={styles.form}><Text style={styles.kicker}>{labels.vendorWorkspace} · {step + 1}/6</Text><Text style={styles.title}>{step === 5 ? text.review : text.vendor}</Text><Text style={styles.body}>{text.verified}: {email}</Text>
    {step === 0 ? <>{input('fullName', labels.fullName)}{input('phone', labels.phone)}</> : null}
    {step === 1 ? input('businessName', labels.businessName) : null}
    {step === 2 ? <NativeSelect language={language} label={labels.category + ' *'} value={form.category} options={options} onChange={value => setForm(current => ({ ...current, category: value }))}/> : null}
    {step === 3 ? <>{input('city', language === 'es' ? 'Ciudad' : 'City')}{input('region', language === 'es' ? 'Provincia' : 'Province')}<Text style={styles.body}>Costa Rica</Text></> : null}
    {step === 4 ? <Text style={styles.body}>{language === 'es' ? 'Tu negocio comienza como un borrador privado. Después puedes añadir descripción, servicios, precios y fotos en tu estudio. Los contratos y pagos de bodas se acuerdan directamente con cada cliente.' : 'Your business starts as a private draft. Add your description, services, prices and photos in your studio afterward. Wedding contracts and payments are arranged directly with each client.'}</Text> : null}
    {step === 5 ? <><Text style={styles.body}>{form.fullName}{'\n'}{form.phone}{'\n'}{form.businessName}{'\n'}{categoryLabel(form.category, language)}{'\n'}{form.city}, {form.region}, Costa Rica</Text>{!accepted ? <CommunityConsent language={language} onAccepted={() => setAccepted(true)}/> : null}</> : null}
    {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}
    <TouchableOpacity disabled={busy || (step === 5 && !accepted)} style={[styles.primaryButton, (busy || (step === 5 && !accepted)) && styles.primaryButtonDisabled]} onPress={() => void next()}><Text style={styles.primaryButtonText}>{busy ? labels.saving : step === 5 ? text.save : labels.next}</Text></TouchableOpacity>
    {step > 0 ? <TouchableOpacity disabled={busy} style={styles.secondaryButton} onPress={() => setStep(step - 1)}><Text style={styles.secondaryButtonText}>{labels.back}</Text></TouchableOpacity> : null}
    <TouchableOpacity disabled={busy} onPress={onCancel}><Text style={styles.textLink}>{labels.cancel}</Text></TouchableOpacity>
  </View>;
}
