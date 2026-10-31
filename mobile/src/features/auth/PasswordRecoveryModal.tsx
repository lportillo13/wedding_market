import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { copy } from '../../i18n/copy';
import { styles } from '../../theme/styles';
import { colors } from '../../theme/tokens';
import { BrandWordmark } from '../../ui/BrandWordmark';
import { FieldLabel } from '../../ui/forms';
import { PasswordField } from '../../ui/PasswordField';
import { signOut, updatePassword } from '../../lib/auth';
export function PasswordRecoveryModal({ visible, language, onComplete, onCancel, }: {
    visible: boolean;
    language: "en" | "es";
    onComplete: () => void;
    onCancel: () => void;
}) {
    const labels = copy[language];
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    useEffect(() => {
        if (!visible) {
            setPassword("");
            setConfirmation("");
            setMessage("");
            setIsSubmitting(false);
        }
    }, [visible]);
    async function submit() {
        setMessage("");
        if (password.length < 8) {
            setMessage(labels.passwordTooShort);
            return;
        }
        if (password !== confirmation) {
            setMessage(labels.passwordsDoNotMatch);
            return;
        }
        setIsSubmitting(true);
        try {
            await updatePassword(password);
            await signOut();
            onComplete();
            Alert.alert(labels.passwordUpdatedTitle, labels.passwordUpdatedBody);
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : labels.passwordResetFailed);
            setIsSubmitting(false);
        }
    }
    async function cancel() {
        await signOut();
        onCancel();
    }
    return (<Modal animationType="slide" onRequestClose={() => void cancel()} presentationStyle="fullScreen" visible={visible}>
      <SafeAreaProvider>
      <SafeAreaView style={styles.passwordRecoveryRoot}>
        <StatusBar barStyle="dark-content"/>
        <ExpoStatusBar style="dark"/>
        <ScrollView contentContainerStyle={styles.passwordRecoveryContent} keyboardShouldPersistTaps="handled">
          <View style={styles.authLogo}>
            <Ionicons name="key-outline" size={22} color={colors.gold}/>
          </View>
          <BrandWordmark />
          <Text style={styles.authTitle}>{labels.chooseNewPassword}</Text>
          <Text style={styles.body}>{labels.chooseNewPasswordIntro}</Text>

          <View style={styles.form}>
            <FieldLabel text={labels.newPassword}/>
            <PasswordField language={language} autoCapitalize="none" autoComplete="new-password" onChangeText={setPassword} placeholder={labels.newPassword} secureTextEntry style={styles.input} value={password}/>

            <FieldLabel text={labels.confirmNewPassword}/>
            <PasswordField language={language} autoCapitalize="none" autoComplete="new-password" onChangeText={setConfirmation} placeholder={labels.confirmNewPassword} secureTextEntry style={styles.input} value={confirmation}/>

            {message ? <Text style={styles.errorText}>{message}</Text> : null}

            <TouchableOpacity disabled={isSubmitting} onPress={() => void submit()} style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}>
              <Text style={styles.primaryButtonText}>
                {isSubmitting ? labels.updatingPassword : labels.updatePassword}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity disabled={isSubmitting} onPress={() => void cancel()} style={styles.authTextButton}>
              <Text style={styles.authTextButtonLabel}>{labels.cancel}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>);
}
