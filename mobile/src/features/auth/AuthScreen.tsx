import { useEffect, useRef, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { signInWithEmail, requestPasswordReset, type AuthProfile, type AuthState } from '../../lib/auth';
import { requestEmailCode, verifyEmailCode, signInWithProvider } from './access';
import { accessCopy } from './access-copy';
import { copy } from '../../i18n/copy';
import { styles } from '../../theme/styles';
import { colors } from '../../theme/tokens';
import { FieldLabel } from '../../ui/forms';
import { PasswordField } from '../../ui/PasswordField';
import { openPublicWebPath } from '../../ui/links';
import { setSetupIntent } from './setup-intent';
export { PasswordRecoveryModal } from './PasswordRecoveryModal';
export function AuthScreen({ onSignedIn, language = 'en', title }: {
    onSignedIn: (state: {
        userEmail: string;
        profile: AuthProfile | null;
    }) => void;
    language?: 'en' | 'es';
    title?: string;
}) {
    const labels = copy[language], text = accessCopy[language];
    const [signup, setSignup] = useState(false), [method, setMethod] = useState<'code' | 'password'>('code');
    const [kind, setKind] = useState<'client' | 'vendor'>('client');
    const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [code, setCode] = useState('');
    const [sentEmail, setSentEmail] = useState(''), [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [success, setSuccess] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const active = useRef(true);
    const pending = useRef(false);
    useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
    useEffect(() => { if (!cooldown)
        return; const timer = setTimeout(() => setCooldown(value => value - 1), 1000); return () => clearTimeout(timer); }, [cooldown]);
    function finish(state: AuthState) { if (state.user?.email && active.current)
        onSignedIn({ userEmail: state.user.email, profile: state.profile }); }
    async function run(action: () => Promise<void>) { if (pending.current)
        return; pending.current = true; setBusy(true); setMessage(''); setSuccess(false); try {
        await action();
    }
    catch (e) {
        if (active.current)
            setMessage(e instanceof Error ? e.message : labels.saveFailed);
    }
    finally {
        pending.current = false;
        if (active.current)
            setBusy(false);
    } }
    async function send() { await setSetupIntent(signup ? kind : null); await requestEmailCode(email, signup, language); setSentEmail(email.trim().toLowerCase()); setCode(''); setCooldown(60); setSuccess(true); setMessage(text.sent); }
    const switchMode = () => { setSignup(!signup); setSentEmail(''); setCode(''); setMessage(''); setMethod('code'); };
    return <View style={styles.authShell}>
    <Text style={styles.authTitle}>{signup ? text.signup : title ?? text.login}</Text>
    <Text style={styles.body}>{signup ? labels.createAccountIntro : labels.loginIntro}</Text>
    {signup ? <View style={styles.form}>{(['client', 'vendor'] as const).map(value => <TouchableOpacity key={value} disabled={busy} accessibilityRole="radio" accessibilityState={{ checked: kind === value }} style={styles.secondaryButton} onPress={() => setKind(value)}><Text style={styles.secondaryButtonText}>{kind === value ? '✓ ' : ''}{value === 'client' ? text.couple : text.vendor}</Text></TouchableOpacity>)}</View> : null}
    {(['google', 'apple'] as const).map(provider => <TouchableOpacity key={provider} accessibilityRole="button" disabled={busy} style={styles.secondaryButton} onPress={() => void run(async () => { await setSetupIntent(signup ? kind : null); const result = await signInWithProvider(provider); if (result)
        finish(result.state); })}><Ionicons name={provider === 'google' ? 'logo-google' : 'logo-apple'} size={20} color={colors.ink}/><Text style={styles.secondaryButtonText}>{text[provider]}</Text></TouchableOpacity>)}
    <Text style={styles.body}>{text.or}</Text>
    <View style={styles.form}>
      <FieldLabel text={labels.email}/><TextInput accessibilityLabel={labels.email} editable={!busy && !sentEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={email} onChangeText={setEmail} style={styles.input}/>
      {!signup && !sentEmail ? <View style={styles.authModeSegment}>{(['code', 'password'] as const).map(value => <TouchableOpacity key={value} disabled={busy} accessibilityRole="radio" accessibilityState={{ checked: method === value }} style={[styles.authModeButton, method === value && styles.authModeButtonActive]} onPress={() => { setMethod(value); setMessage(''); }}><Text style={[styles.authModeText, method === value && styles.authModeTextActive]}>{text[value]}</Text></TouchableOpacity>)}</View> : null}
      {sentEmail ? <><Text style={styles.body}>{text.sent}</Text><FieldLabel text={text.code}/><TextInput accessibilityLabel={text.code} autoComplete="one-time-code" keyboardType="number-pad" maxLength={8} value={code} onChangeText={setCode} style={styles.input}/><TouchableOpacity disabled={busy} style={styles.primaryButton} onPress={() => void run(async () => finish(await verifyEmailCode(sentEmail, code)))}><Text style={styles.primaryButtonText}>{text.verify}</Text></TouchableOpacity><TouchableOpacity disabled={busy || cooldown > 0} style={styles.secondaryButton} onPress={() => void run(send)}><Text style={styles.secondaryButtonText}>{text.resend}{cooldown > 0 ? ' (' + cooldown + ')' : ''}</Text></TouchableOpacity><TouchableOpacity disabled={busy} onPress={() => { setSentEmail(''); setCode(''); setMessage(''); }}><Text style={styles.textLink}>{text.change}</Text></TouchableOpacity></> :
            method === 'password' && !signup ? <><FieldLabel text={labels.password}/><PasswordField accessibilityLabel={labels.password} language={language} secureTextEntry value={password} onChangeText={setPassword} style={styles.input}/><TouchableOpacity disabled={busy} style={styles.primaryButton} onPress={() => void run(async () => finish(await signInWithEmail(email.trim(), password)))}><Text style={styles.primaryButtonText}>{busy ? labels.signingIn : labels.signIn}</Text></TouchableOpacity><TouchableOpacity disabled={busy} onPress={() => void run(async () => { await requestPasswordReset(email); setSuccess(true); setMessage(labels.resetEmailSent); })}><Text style={styles.textLink}>{labels.forgotPassword}</Text></TouchableOpacity></> :
                <TouchableOpacity disabled={busy || cooldown > 0} style={styles.primaryButton} onPress={() => void run(send)}><Text style={styles.primaryButtonText}>{busy ? labels.saving : text.send}</Text></TouchableOpacity>}
      {message ? <Text accessibilityRole="alert" style={success ? styles.successText : styles.errorText}>{message}</Text> : null}
      <TouchableOpacity disabled={busy} style={styles.authTextButton} onPress={switchMode}><Text style={styles.authTextButtonLabel}>{signup ? text.login : text.signup}</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => void openPublicWebPath('/for-vendors?lang=' + language)}><Text style={styles.textLink}>{text.vendor} →</Text></TouchableOpacity>
    </View>
  </View>;
}
