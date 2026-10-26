import { themeOptions } from "../../content/catalog";
import { copy } from "../../i18n/copy";
import { type VendorListItem } from "../../lib/api";
import { type AuthProfile } from "../../lib/auth";
import { createSubmissionId } from "../../lib/quoteUtils";
import { createQuoteRequests, type QuoteRequestInput } from "../../lib/rfqs";
import { styles } from "../../theme/styles";
import { colors } from "../../theme/tokens";
import { QuoteDateCalendar } from "../../ui/calendars";
import { FieldLabel, NativeSelect } from "../../ui/forms";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef, useState } from "react";
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

export function RequestQuoteModal({
  visible,
  vendors,
  profile,
  userEmail,
  language,
  onClose,
  onSent,
}: {
  visible: boolean;
  vendors: VendorListItem[];
  profile: AuthProfile | null;
  userEmail: string | null;
  language: "en" | "es";
  onClose: () => void;
  onSent: () => void;
}) {
  const submission = useRef<{id:string;fingerprint:string} | null>(null);
  const labels = copy[language];
  const primaryVendor = vendors[0] ?? null;
  const isBatch = vendors.length > 1;
  const nameParts = (profile?.fullName ?? "").trim().split(/\s+/).filter(Boolean);
  const [form, setForm] = useState<QuoteRequestInput>({
    vendorId: primaryVendor?.id ?? "",
    firstName: nameParts[0] ?? "",
    lastName: nameParts.slice(1).join(" "),
    email: userEmail ?? "",
    phone: profile?.phone ?? "",
    eventDate: profile?.tentativeWeddingDate ?? "",
    flexible: false,
    guestCount: profile?.guestCount != null ? String(profile.guestCount) : "",
    budget: profile?.weddingBudget != null ? String(profile.weddingBudget) : "",
    city: "",
    language,
    theme: profile?.weddingTheme ?? "",
    message: "",
  });
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invalidFields, setInvalidFields] = useState<Array<keyof QuoteRequestInput>>([]);

  useEffect(() => {
    if (!visible || !primaryVendor) return;
    const latestNameParts = (profile?.fullName ?? "").trim().split(/\s+/).filter(Boolean);
    setForm({
      vendorId: primaryVendor.id,
      firstName: latestNameParts[0] || "",
      lastName: latestNameParts.slice(1).join(" "),
      email: userEmail || "",
      phone: profile?.phone ?? "",
      eventDate: profile?.tentativeWeddingDate ?? "",
      flexible: false,
      guestCount: profile?.guestCount != null ? String(profile.guestCount) : "",
      budget: profile?.weddingBudget != null ? String(profile.weddingBudget) : "",
      city: "",
      language,
      theme: profile?.weddingTheme ?? "",
      message: language === "en" ? "Hi, I would like to request a quote for my wedding." : "Hola, me gustaría solicitar una cotización para mi boda.",
    });
    setStatus("");
    setInvalidFields([]);
  }, [
    visible,
    primaryVendor?.id,
    userEmail,
    profile?.fullName,
    profile?.phone,
    profile?.tentativeWeddingDate,
    profile?.guestCount,
    profile?.weddingBudget,
    profile?.weddingTheme,
    language,
  ]);

  function updateField<Key extends keyof QuoteRequestInput>(key: Key, value: QuoteRequestInput[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
    setInvalidFields((current) => current.filter((field) => field !== key));
  }

  async function submit() {
    setStatus("");
    const missing: Array<{ key: keyof QuoteRequestInput; label: string }> = [];
    if (!form.firstName.trim()) missing.push({ key: "firstName", label: labels.firstName });
    if (!form.lastName.trim()) missing.push({ key: "lastName", label: labels.lastName });
    if (!form.email.trim()) missing.push({ key: "email", label: labels.email });
    const guestCount = Number(form.guestCount);
    if (!form.guestCount.trim() || !Number.isInteger(guestCount) || guestCount < 1) missing.push({ key: "guestCount", label: labels.guests });
    if (!form.message.trim()) missing.push({ key: "message", label: labels.messageVendor });

    if (missing.length) {
      setInvalidFields(missing.map((field) => field.key));
      setStatus(labels.quoteRequiredFields.replace("{fields}", missing.map((field) => field.label).join(", ")));
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setInvalidFields(["email"]);
      setStatus(labels.invalidEmail);
      return;
    }

    setIsSubmitting(true);
    try {
      const vendorIds = vendors.map(vendor=>vendor.id);
      const fingerprint=JSON.stringify([form,vendorIds]);
      if (submission.current?.fingerprint !== fingerprint) submission.current={id:createSubmissionId(),fingerprint};
      await createQuoteRequests(form, vendorIds,submission.current.id);
      submission.current = null;
      setStatus(isBatch
        ? language === "en"
          ? `One request was sent to ${vendors.length} vendors. Each private conversation is available in your inbox.`
          : `Se envió una solicitud a ${vendors.length} proveedores. Cada conversación privada está disponible en mensajes.`
        : labels.requestSent);
      onSent();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to send request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.quoteModal}>
          <View style={styles.quoteModalHandle} />
          <View style={styles.quoteModalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>{labels.requestQuote}</Text>
              <Text style={styles.title}>
                {isBatch ? `${vendors.length} saved vendors` : primaryVendor?.business_name ?? "Vendor"}
              </Text>
              {isBatch ? <Text style={styles.body}>{labels.quoteBatchHint}</Text> : null}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={22} color={colors.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.quoteModalBody}>
            <Text style={styles.requiredHint}>{labels.requiredHint}</Text>
            <View style={styles.formTwoColumn}>
              <View style={styles.formHalf}>
                <FieldLabel text={`${labels.firstName} *`} />
                <TextInput style={[styles.input, invalidFields.includes("firstName") && styles.inputError]} value={form.firstName} onChangeText={(value) => updateField("firstName", value)} />
              </View>
              <View style={styles.formHalf}>
                <FieldLabel text={`${labels.lastName} *`} />
                <TextInput style={[styles.input, invalidFields.includes("lastName") && styles.inputError]} value={form.lastName} onChangeText={(value) => updateField("lastName", value)} />
              </View>
            </View>
            <FieldLabel text={`${labels.email} *`} />
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              style={[styles.input, invalidFields.includes("email") && styles.inputError]}
              value={form.email}
              onChangeText={(value) => updateField("email", value)}
            />
            <FieldLabel text={`${labels.phone} (${labels.optional})`} />
            <TextInput keyboardType="phone-pad" style={styles.input} value={form.phone} onChangeText={(value) => updateField("phone", value)} />
            <FieldLabel text={`${labels.eventDate} (${labels.optional})`} />
            <QuoteDateCalendar
              language={language}
              value={form.eventDate}
              onChange={(value) => updateField("eventDate", value)}
            />
            <TouchableOpacity onPress={() => updateField("flexible", !form.flexible)} style={styles.checkboxRow}>
              <Ionicons name={form.flexible ? "checkbox" : "square-outline"} size={20} color={colors.tealDark} />
              <Text style={styles.checkboxText}>{labels.flexibleDate}</Text>
            </TouchableOpacity>
            <FieldLabel text={`${labels.guests} *`} />
            <TextInput keyboardType="number-pad" style={[styles.input, invalidFields.includes("guestCount") && styles.inputError]} value={form.guestCount} onChangeText={(value) => updateField("guestCount", value)} />
            <FieldLabel text={`${labels.quoteBudget} (${labels.optional})`} />
            <TextInput keyboardType="number-pad" style={styles.input} value={form.budget} onChangeText={(value) => updateField("budget", value)} />
            <FieldLabel text={`${labels.city} (${labels.optional})`} />
            <TextInput style={styles.input} value={form.city} onChangeText={(value) => updateField("city", value)} />
            <NativeSelect
              label={`${labels.weddingTheme} (${labels.optional})`}
              value={form.theme}
              options={themeOptions(language)}
              onChange={(value) => updateField("theme", value)}
            />
            <FieldLabel text={`${labels.messageVendor} *`} />
            <TextInput
              maxLength={2000}
              multiline
              style={[styles.input, styles.textArea, invalidFields.includes("message") && styles.inputError]}
              value={form.message}
              onChangeText={(value) => updateField("message", value)}
            />
            {status ? (
              <Text style={status.includes("sent") || status.includes("enviada") ? styles.successText : styles.errorText}>{status}</Text>
            ) : null}
            <TouchableOpacity disabled={isSubmitting} onPress={submit} style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}>
              <Ionicons name="send-outline" size={17} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>{isSubmitting ? labels.sending : labels.sendRequest}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
