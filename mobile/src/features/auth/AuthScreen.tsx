import { PasswordField } from "../../ui/PasswordField";
import { BrandWordmark } from "../../ui/BrandWordmark";
import { themeOptions, weddingStyleCards } from "../../content/catalog";
import { countryOptions } from "../../content/countries";
import { copy } from "../../i18n/copy";
import { requestPasswordReset, resendSignUpConfirmation, signInWithEmail, signOut, signUpWithEmail, type AuthProfile, updatePassword } from "../../lib/auth";
import { styles } from "../../theme/styles";
import { colors } from "../../theme/tokens";
import { FieldLabel, SearchableCountryDropdown } from "../../ui/forms";
import Ionicons from "@expo/vector-icons/Ionicons";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, Image, Modal, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export function AuthScreen({
  onSignedIn,
  language = "en",
  title,
}: {
  onSignedIn: (nextState: { userEmail: string; profile: AuthProfile | null }) => void;
  language?: "en" | "es";
  title?: string;
}) {
  const labels = copy[language];
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [signupStep, setSignupStep] = useState(0);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [datePickerMonth, setDatePickerMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const stepOpacity = useRef(new Animated.Value(1)).current;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupForm, setSignupForm] = useState({
    fullName: "",
    phone: "",
    country: "",
    tentativeWeddingDate: "",
    guestCount: "",
    weddingBudget: "",
    weddingTheme: "",
    businessName: "",
    category: "",
    city: "",
    region: "",
  });
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState<string | null>(null);
  const [isResendingConfirmation, setIsResendingConfirmation] = useState(false);
  const signupStepCount = 6;
  const stepTranslateY = stepOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });
  const styleLabelByValue = Object.fromEntries(themeOptions(language).map((item) => [item.value, item.label]));
  const monthLabel = new Intl.DateTimeFormat(language === "es" ? "es-US" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(datePickerMonth);
  const selectedWeddingDate = signupForm.tentativeWeddingDate;
  const calendarDays = useMemo(() => {
    const year = datePickerMonth.getFullYear();
    const month = datePickerMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return [
      ...Array.from({ length: firstDay }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];
  }, [datePickerMonth]);

  function signupCopyForStep(step = signupStep) {
    if (step === 0) {
      return { title: labels.signupWelcomeTitle, body: labels.signupWelcomeBody };
    }

    if (step === 1) {
      return { title: labels.contactStepTitle, body: labels.contactStepBody };
    }

    if (step === 2) {
      return { title: labels.weddingStyleStepTitle, body: labels.weddingStyleStepBody };
    }

    if (step === 3) {
      return { title: labels.weddingDateStepTitle, body: labels.weddingDateStepBody };
    }

    if (step === 4) {
      return { title: labels.guestStepTitle, body: labels.guestStepBody };
    }

    return { title: labels.budgetStepTitle, body: labels.budgetStepBody };
  }

  function updateSignupField(key: keyof typeof signupForm, value: string) {
    setSignupForm((current) => ({ ...current, [key]: value }));
  }

  function openSignupModal() {
    setSignupStep(0);
    stepOpacity.setValue(1);
    setMessage("");
    setIsSuccess(false);
    setIsSignupModalOpen(true);
  }

  function requestCloseSignupModal() {
    Alert.alert(labels.stopSignupTitle, labels.stopSignupBody, [
      { text: labels.keepPlanning, style: "cancel" },
      {
        text: labels.stopPlanning,
        style: "destructive",
        onPress: () => {
          setIsSignupModalOpen(false);
          setMessage("");
          setIsSuccess(false);
        },
      },
    ]);
  }

  function formatDateValue(year: number, month: number, day: number) {
    const yyyy = String(year);
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function moveDatePickerMonth(delta: number) {
    setDatePickerMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  function showSignupStep(nextStep: number) {
    const boundedStep = Math.max(0, Math.min(signupStepCount - 1, nextStep));
    if (boundedStep === signupStep) return;

    setMessage("");
    setIsSuccess(false);
    Animated.timing(stepOpacity, {
      toValue: 0,
      duration: 140,
      useNativeDriver: true,
    }).start(() => {
      setSignupStep(boundedStep);
      Animated.timing(stepOpacity, {
        toValue: 1,
        duration: 190,
        useNativeDriver: true,
      }).start();
    });
  }

  function validateSignupStep(step = signupStep) {
    if (step === 1) {
      return Boolean(signupForm.fullName.trim() && email.trim() && signupForm.phone.trim());
    }

    if (step === 2) {
      return Boolean(signupForm.weddingTheme.trim());
    }

    if (step === 3) {
      return Boolean(signupForm.tentativeWeddingDate.trim());
    }

    if (step === 4) {
      return Boolean(signupForm.country.trim());
    }

    if (step === 5) {
      return Boolean(password.trim());
    }

    return true;
  }

  function handleNextSignupStep() {
    if (!validateSignupStep()) {
      setIsSuccess(false);
      setMessage(labels.requiredFields);
      return;
    }

    showSignupStep(signupStep + 1);
  }

  async function handleSignIn() {
    setMessage("");
    setIsSuccess(false);
    setIsSubmitting(true);

    try {
      const nextState = await signInWithEmail(email.trim(), password);
      onSignedIn({
        userEmail: nextState.user?.email ?? email.trim(),
        profile: nextState.profile,
      });
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Unable to sign in.";
      if (/email not confirmed/i.test(nextMessage)) {
        setPendingConfirmationEmail(email.trim().toLowerCase());
      }
      setMessage(nextMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasswordResetRequest() {
    setMessage("");
    setIsSuccess(false);
    setIsSubmitting(true);

    try {
      await requestPasswordReset(email.trim());
      setIsSuccess(true);
      setMessage(labels.resetEmailSent);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : labels.passwordResetFailed);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignUp() {
    setMessage("");
    setIsSuccess(false);
    setIsSubmitting(true);

    try {
      const nextState = await signUpWithEmail({
        role: "client",
        fullName: signupForm.fullName,
        email,
        password,
        phone: signupForm.phone,
        country: signupForm.country,
        language,
        tentativeWeddingDate: signupForm.tentativeWeddingDate,
        guestCount: signupForm.guestCount,
        weddingBudget: signupForm.weddingBudget,
        weddingTheme: signupForm.weddingTheme,
      });

      setIsSuccess(true);
      if (nextState.status === "confirmation_required") {
        setPendingConfirmationEmail(nextState.email);
        setMode("login");
        setIsSignupModalOpen(false);
        setMessage(labels.confirmationSent);
        return;
      }

      setMessage(labels.accountCreated);
      onSignedIn({
        userEmail: nextState.state.user?.email ?? email.trim(),
        profile: nextState.state.profile,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendConfirmation() {
    if (!pendingConfirmationEmail) return;

    setIsResendingConfirmation(true);
    setIsSuccess(false);
    setMessage("");
    try {
      await resendSignUpConfirmation(pendingConfirmationEmail);
      setIsSuccess(true);
      setMessage(labels.confirmationResent);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : labels.emailConfirmationFailed);
    } finally {
      setIsResendingConfirmation(false);
    }
  }

  function submitSignup() {
    if (
      !validateSignupStep(1) ||
      !validateSignupStep(2) ||
      !validateSignupStep(3) ||
      !validateSignupStep(4) ||
      !validateSignupStep(5)
    ) {
      setIsSuccess(false);
      setMessage(labels.requiredFields);
      return;
    }

    void handleSignUp();
  }

  function renderSignupHeading(kicker?: string) {
    const { title, body } = signupCopyForStep();
    return (
      <>
        {kicker ? <Text style={styles.signupKicker}>{kicker}</Text> : null}
        <Text style={styles.signupStepTitle}>{title}</Text>
        <Text style={styles.signupStepBody}>{body}</Text>
      </>
    );
  }

  function renderSignupStep() {
    const fieldsVisible = true;

    if (signupStep === 0) {
      return (
        <View style={styles.signupIntroPanel}>
          <View style={styles.signupIconBubble}>
            <Ionicons name="heart-outline" size={26} color={colors.ink} />
          </View>
          {renderSignupHeading()}
        </View>
      );
    }

    if (signupStep === 1) {
      return (
        <>
          {renderSignupHeading(`${labels.stepOf} 1 / 5`)}
          {fieldsVisible ? (
            <>
              <FieldLabel centered text={labels.fullName} />
              <TextInput
                autoCapitalize="words"
                onChangeText={(value) => updateSignupField("fullName", value)}
                placeholder={labels.fullName}
                style={[styles.input, styles.signupCenteredInput]}
                value={signupForm.fullName}
              />
              <FieldLabel centered text={labels.email} />
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="you@example.com"
                style={[styles.input, styles.signupCenteredInput]}
                value={email}
              />
              <FieldLabel centered text={labels.phone} />
              <TextInput
                keyboardType="phone-pad"
                onChangeText={(value) => updateSignupField("phone", value)}
                placeholder={labels.phone}
                style={[styles.input, styles.signupCenteredInput]}
                value={signupForm.phone}
              />
            </>
          ) : null}
        </>
      );
    }

    if (signupStep === 2) {
      return (
        <>
          {renderSignupHeading(`${labels.stepOf} 2 / 5`)}
          {fieldsVisible ? (
            <>
              <FieldLabel centered text={labels.chooseWeddingStyle} />
              <View style={styles.weddingStyleGrid}>
                {weddingStyleCards.map((style) => {
                  const isSelected = signupForm.weddingTheme === style.value;
                  return (
                    <TouchableOpacity
                      key={style.value}
                      onPress={() => updateSignupField("weddingTheme", style.value)}
                      style={[styles.weddingStyleCard, isSelected && styles.weddingStyleCardActive]}
                      activeOpacity={0.88}
                    >
                      <Image source={{ uri: style.image }} style={styles.weddingStyleImage} />
                      <View style={styles.weddingStyleOverlay} />
                      <Text style={styles.weddingStyleLabel}>{styleLabelByValue[style.value] ?? style.value}</Text>
                      {isSelected ? (
                        <View style={styles.weddingStyleCheck}>
                          <Ionicons name="checkmark" size={15} color={colors.paper} />
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : null}
        </>
      );
    }

    if (signupStep === 3) {
      return (
        <>
          {renderSignupHeading(`${labels.stepOf} 3 / 5`)}
          {fieldsVisible ? (
            <>
              <FieldLabel centered text={labels.weddingDate} />
              <View style={styles.datePickerCard}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => moveDatePickerMonth(-1)} style={styles.datePickerArrow}>
                    <Ionicons name="chevron-back" size={18} color={colors.ink} />
                  </TouchableOpacity>
                  <Text style={styles.datePickerMonth}>{monthLabel}</Text>
                  <TouchableOpacity onPress={() => moveDatePickerMonth(1)} style={styles.datePickerArrow}>
                    <Ionicons name="chevron-forward" size={18} color={colors.ink} />
                  </TouchableOpacity>
                </View>
                <View style={styles.datePickerWeekRow}>
                  {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                    <Text key={`${day}-${index}`} style={styles.datePickerWeekday}>{day}</Text>
                  ))}
                </View>
                <View style={styles.datePickerGrid}>
                  {calendarDays.map((day, index) => {
                    if (!day) {
                      return <View key={`blank-${index}`} style={styles.datePickerDay} />;
                    }

                    const value = formatDateValue(datePickerMonth.getFullYear(), datePickerMonth.getMonth(), day);
                    const isSelected = selectedWeddingDate === value;
                    return (
                      <TouchableOpacity
                        key={value}
                        onPress={() => updateSignupField("tentativeWeddingDate", value)}
                        style={[styles.datePickerDay, isSelected && styles.datePickerDaySelected]}
                      >
                        <Text style={[styles.datePickerDayText, isSelected && styles.datePickerDayTextSelected]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {selectedWeddingDate ? (
                  <Text style={styles.selectedDateText}>{`${labels.selectedDate}: ${selectedWeddingDate}`}</Text>
                ) : null}
              </View>
            </>
          ) : null}
        </>
      );
    }

    if (signupStep === 4) {
      return (
        <>
          {renderSignupHeading(`${labels.stepOf} 4 / 5`)}
          {fieldsVisible ? (
            <SearchableCountryDropdown
              centered
              label={labels.contactCountry}
              value={signupForm.country}
              options={countryOptions(language)}
              onChange={(value) => updateSignupField("country", value)}
              language={language}
            />
          ) : null}
        </>
      );
    }

    return (
      <>
        {renderSignupHeading(`${labels.stepOf} 5 / 5`)}
        {fieldsVisible ? (
          <>
            <FieldLabel centered text={labels.guestCountOptional} />
            <TextInput
              keyboardType="number-pad"
              onChangeText={(value) => updateSignupField("guestCount", value)}
              placeholder="120"
              style={[styles.input, styles.signupCenteredInput]}
              value={signupForm.guestCount}
            />
            <FieldLabel centered text={labels.weddingBudgetOptional} />
            <View style={styles.signupMoneyInputWrap}>
              <Text style={styles.signupMoneyPrefix}>$</Text>
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={(value) => updateSignupField("weddingBudget", value)}
                placeholder="25,000"
                style={[styles.input, styles.signupCenteredInput, styles.signupMoneyInput]}
                value={signupForm.weddingBudget}
              />
            </View>
            <Text style={styles.signupStepTitleSmall}>{labels.accountStepTitle}</Text>
            <Text style={styles.signupStepBody}>{labels.accountStepBody}</Text>
            <FieldLabel centered text={labels.password} />
            <PasswordField language={language}
              autoCapitalize="none"
              onChangeText={setPassword}
              placeholder={labels.password}
              secureTextEntry
              style={[styles.input, styles.signupCenteredInput]}
              value={password}
            />
          </>
        ) : null}
      </>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <ExpoStatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.authScroll} keyboardShouldPersistTaps="handled">
        <View style={styles.authShell}>
          <Text style={[styles.authTitle, mode === "signup" && !isForgotPassword && styles.signupAuthCenteredText]}>
            {isForgotPassword
              ? labels.passwordResetTitle
              : mode === "signup"
                ? labels.createAccount
                : title ?? labels.authTitle}
          </Text>
          <Text style={[styles.body, mode === "signup" && !isForgotPassword && styles.signupAuthCenteredText]}>
            {isForgotPassword
              ? labels.passwordResetIntro
              : mode === "login"
                ? labels.loginIntro
                : labels.createAccountIntro}
          </Text>

          {!isForgotPassword ? (
            <View style={styles.authModeSegment}>
              {[
                { key: "login", label: labels.logIn },
                { key: "signup", label: labels.createAccount },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => {
                    setMode(item.key as "login" | "signup");
                    setIsForgotPassword(false);
                    if (item.key === "signup") {
                      setSignupStep(0);
                      stepOpacity.setValue(1);
                    }
                    setMessage("");
                    setIsSuccess(false);
                  }}
                  style={[styles.authModeButton, mode === item.key && styles.authModeButtonActive]}
                >
                  <Text style={[styles.authModeText, mode === item.key && styles.authModeTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <View style={styles.form}>
            {isForgotPassword ? (
              <>
                <FieldLabel text={labels.email} />
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  style={styles.input}
                  value={email}
                />

                {message ? <Text style={isSuccess ? styles.successText : styles.errorText}>{message}</Text> : null}

                {!isSuccess ? (
                  <TouchableOpacity
                    disabled={isSubmitting}
                    onPress={() => void handlePasswordResetRequest()}
                    style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
                  >
                    <Text style={styles.primaryButtonText}>
                      {isSubmitting ? labels.sendingResetLink : labels.sendResetLink}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  onPress={() => {
                    setIsForgotPassword(false);
                    setMessage("");
                    setIsSuccess(false);
                  }}
                  style={styles.authTextButton}
                >
                  <Ionicons name="arrow-back-outline" size={16} color={colors.tealDark} />
                  <Text style={styles.authTextButtonLabel}>{labels.backToSignIn}</Text>
                </TouchableOpacity>
              </>
            ) : mode === "login" ? (
              <>
                <FieldLabel text={labels.email} />
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  style={styles.input}
                  value={email}
                />

                <FieldLabel text={labels.password} />
                <PasswordField language={language}
                  autoCapitalize="none"
                  onChangeText={setPassword}
                  placeholder={labels.password}
                  secureTextEntry
                  style={styles.input}
                  value={password}
                />

                <TouchableOpacity
                  onPress={() => {
                    setIsForgotPassword(true);
                    setMessage("");
                    setIsSuccess(false);
                    setPendingConfirmationEmail(null);
                  }}
                  style={styles.forgotPasswordButton}
                >
                  <Text style={styles.authTextButtonLabel}>{labels.forgotPassword}</Text>
                </TouchableOpacity>

                {message ? <Text style={isSuccess ? styles.successText : styles.errorText}>{message}</Text> : null}

                {pendingConfirmationEmail ? (
                  <TouchableOpacity
                    disabled={isResendingConfirmation}
                    onPress={() => void handleResendConfirmation()}
                    style={[styles.secondaryButton, isResendingConfirmation && styles.primaryButtonDisabled]}
                  >
                    <Ionicons name="mail-outline" size={17} color={colors.tealDark} />
                    <Text style={styles.secondaryButtonText}>
                      {isResendingConfirmation ? labels.resendingConfirmation : labels.resendConfirmation}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  disabled={isSubmitting}
                  onPress={handleSignIn}
                  style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
                >
                  <Text style={styles.primaryButtonText}>{isSubmitting ? labels.signingIn : labels.signIn}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {message ? <Text style={isSuccess ? styles.successText : styles.errorText}>{message}</Text> : null}

                <TouchableOpacity onPress={openSignupModal} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>{labels.startPlanning}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>
      <Modal
        animationType="fade"
        onRequestClose={requestCloseSignupModal}
        presentationStyle="fullScreen"
        visible={isSignupModalOpen}
      >
        <SafeAreaProvider>
        <SafeAreaView style={styles.signupModalRoot}>
          <StatusBar barStyle="dark-content" />
          <ExpoStatusBar style="dark" />
          <View style={styles.signupModalHeader}>
            <View style={styles.signupModalLogo}>
              <BrandWordmark />
            </View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={language === "es" ? "Cerrar" : "Close"} onPress={requestCloseSignupModal} style={styles.signupModalCloseButton}>
              <Ionicons name="close" size={22} color={colors.ink} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.signupModalBody} keyboardShouldPersistTaps="handled">
            <View style={styles.signupProgressTrack}>
              <View
                style={[
                  styles.signupProgressFill,
                  { width: `${((signupStep + 1) / signupStepCount) * 100}%` },
                ]}
              />
            </View>

            <Animated.View
              style={[
                styles.signupStepCard,
                {
                  opacity: stepOpacity,
                  transform: [{ translateY: stepTranslateY }],
                },
              ]}
            >
              {renderSignupStep()}
            </Animated.View>

            {message ? (
              <Text style={[isSuccess ? styles.successText : styles.errorText, styles.signupMessage]}>
                {message}
              </Text>
            ) : null}
          </ScrollView>
          <View style={styles.signupModalFooter}>
            {signupStep > 0 ? (
              <TouchableOpacity
                disabled={isSubmitting}
                onPress={() => showSignupStep(signupStep - 1)}
                style={styles.signupBackButton}
              >
                <Text style={styles.signupBackText}>{labels.back}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              disabled={isSubmitting}
              onPress={signupStep === signupStepCount - 1 ? submitSignup : handleNextSignupStep}
              style={[
                styles.primaryButton,
                styles.signupNextButton,
                signupStep === 0 && styles.signupNextButtonFull,
                (isSubmitting) && styles.primaryButtonDisabled,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {signupStep === 0
                  ? labels.startPlanning
                  : signupStep === signupStepCount - 1
                  ? isSubmitting
                    ? labels.creatingAccount
                    : labels.finishCreateAccount
                  : labels.next}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </View>
  );
}


export function PasswordRecoveryModal({
  visible,
  language,
  onComplete,
  onCancel,
}: {
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
    } catch (error) {
      setMessage(error instanceof Error ? error.message : labels.passwordResetFailed);
      setIsSubmitting(false);
    }
  }

  async function cancel() {
    await signOut();
    onCancel();
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={() => void cancel()}
      presentationStyle="fullScreen"
      visible={visible}
    >
      <SafeAreaProvider>
      <SafeAreaView style={styles.passwordRecoveryRoot}>
        <StatusBar barStyle="dark-content" />
        <ExpoStatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.passwordRecoveryContent} keyboardShouldPersistTaps="handled">
          <View style={styles.authLogo}>
            <Ionicons name="key-outline" size={22} color={colors.gold} />
          </View>
          <BrandWordmark />
          <Text style={styles.authTitle}>{labels.chooseNewPassword}</Text>
          <Text style={styles.body}>{labels.chooseNewPasswordIntro}</Text>

          <View style={styles.form}>
            <FieldLabel text={labels.newPassword} />
            <PasswordField language={language}
              autoCapitalize="none"
              autoComplete="new-password"
              onChangeText={setPassword}
              placeholder={labels.newPassword}
              secureTextEntry
              style={styles.input}
              value={password}
            />

            <FieldLabel text={labels.confirmNewPassword} />
            <PasswordField language={language}
              autoCapitalize="none"
              autoComplete="new-password"
              onChangeText={setConfirmation}
              placeholder={labels.confirmNewPassword}
              secureTextEntry
              style={styles.input}
              value={confirmation}
            />

            {message ? <Text style={styles.errorText}>{message}</Text> : null}

            <TouchableOpacity
              disabled={isSubmitting}
              onPress={() => void submit()}
              style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
            >
              <Text style={styles.primaryButtonText}>
                {isSubmitting ? labels.updatingPassword : labels.updatePassword}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={isSubmitting}
              onPress={() => void cancel()}
              style={styles.authTextButton}
            >
              <Text style={styles.authTextButtonLabel}>{labels.cancel}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}
