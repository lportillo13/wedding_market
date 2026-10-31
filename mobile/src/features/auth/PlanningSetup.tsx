import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { firstPlanningStep, planningIssue, type PlanningDetails } from '../../../../shared/accounts/onboarding';
import { type AuthProfile, type AuthState } from '../../lib/auth';
import { planningFromProfile, savePlanning } from './access';
import { accessCopy } from './access-copy';
import { copy } from '../../i18n/copy';
import { countryOptions } from '../../content/countries';
import { themeOptions } from '../../content/catalog';
import { FieldLabel, NativeSelect, SearchableCountryDropdown } from '../../ui/forms';
import { QuoteDateCalendar } from '../../ui/calendars';
import { styles } from '../../theme/styles';
export function PlanningSetup({ profile, email, language, onComplete }: {
    profile: AuthProfile | null;
    email: string;
    language: 'en' | 'es';
    onComplete: (state: AuthState) => void;
}) {
    const [form, setForm] = useState(() => planningFromProfile(profile));
    const [step, setStep] = useState(() => firstPlanningStep(form));
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const labels = copy[language], text = accessCopy[language];
    const headings = [labels.fullName, labels.contact, labels.weddingTheme, labels.weddingDate, text.optional, text.review];
    const update = (key: keyof PlanningDetails, value: string) => setForm(current => ({ ...current, [key]: value }));
    const issueText = (issue: string) => text.errors[issue as keyof typeof text.errors];
    async function next() {
        if (busy)
            return;
        setError('');
        if (step < 5) {
            const issue = planningIssue(form, step);
            if (issue) {
                setError(issueText(issue));
                return;
            }
            setStep(step + 1);
            return;
        }
        for (let i = 0; i < 5; i++) {
            const issue = planningIssue(form, i);
            if (issue) {
                setStep(i);
                setError(issueText(issue));
                return;
            }
        }
        setBusy(true);
        try {
            onComplete(await savePlanning(form, language));
        }
        catch (e) {
            setError(e instanceof Error ? e.message : labels.saveFailed);
        }
        finally {
            setBusy(false);
        }
    }
    const input = (key: keyof PlanningDetails, label: string, keyboardType: 'default' | 'phone-pad' | 'number-pad' | 'decimal-pad' = 'default') => <View key={key}><FieldLabel text={label}/><TextInput accessibilityLabel={label} style={styles.input} value={form[key]} keyboardType={keyboardType} onChangeText={value => update(key, value)}/></View>;
    return <View style={styles.form}>
    <Text style={styles.kicker}>{text.setup} · {step + 1}/6</Text><Text style={styles.title}>{headings[step]}</Text>
    <Text style={styles.body}>{text.verified}: {email}</Text>
    {step === 0 ? input('fullName', labels.fullName + ' *') : null}
    {step === 1 ? <>{input('phone', labels.phone + ' *', 'phone-pad')}<SearchableCountryDropdown language={language} label={labels.contactCountry + ' *'} value={form.country} options={countryOptions(language)} onChange={value => update('country', value)}/></> : null}
    {step === 2 ? <NativeSelect language={language} label={labels.weddingTheme + ' *'} value={form.weddingTheme} options={themeOptions(language)} onChange={value => update('weddingTheme', value)}/> : null}
    {step === 3 ? <QuoteDateCalendar language={language} value={form.weddingDate} onChange={value => update('weddingDate', value)}/> : null}
    {step === 4 ? <>{input('guestCount', labels.guestCountOptional, 'number-pad')}{input('weddingBudget', labels.weddingBudgetOptional + ' ($)', 'decimal-pad')}</> : null}
    {step === 5 ? [
            [form.fullName, 0], [form.phone + ' · ' + form.country, 1],
            [themeOptions(language).find(option => option.value === form.weddingTheme)?.label ?? form.weddingTheme, 2],
            [form.weddingDate, 3], [`${labels.guestCountOptional}: ${form.guestCount || '—'} · ${labels.weddingBudgetOptional}: ${form.weddingBudget ? `$${form.weddingBudget}` : '—'}`, 4],
        ].map(([value, target]) => <View key={target} style={styles.formSection}><Text style={styles.body}>{value}</Text><TouchableOpacity disabled={busy} onPress={() => setStep(Number(target))}><Text style={styles.textLink}>{text.edit}</Text></TouchableOpacity></View>) : null}
    {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}
    <TouchableOpacity disabled={busy} style={styles.primaryButton} onPress={() => void next()}><Text style={styles.primaryButtonText}>{busy ? labels.saving : step === 5 ? text.save : labels.next}</Text></TouchableOpacity>
    {step > 0 ? <TouchableOpacity disabled={busy} style={styles.secondaryButton} onPress={() => { setStep(step - 1); setError(''); }}><Text style={styles.secondaryButtonText}>{labels.back}</Text></TouchableOpacity> : null}
  </View>;
}
