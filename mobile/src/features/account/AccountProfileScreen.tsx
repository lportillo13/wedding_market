import { confirmAccountDeletion } from "./deletion";
import * as ImagePicker from 'expo-image-picker';
import {countryOptions} from '../../content/countries';
import {uploadVendorMedia} from '../../lib/vendorProfile';
import { type ClientProfileForm } from "../../application/types";
import { themeOptions } from "../../content/catalog";
import { copy } from "../../i18n/copy";
import { loadAuthState, type AuthProfile } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { styles } from "../../theme/styles";
import { colors } from "../../theme/tokens";
import { FieldLabel, NativeSelect, SearchableCountryDropdown } from "../../ui/forms";
import { QuoteDateCalendar } from '../../ui/calendars';
import { openPublicWebPath } from "../../ui/links";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Text, TextInput, TouchableOpacity, View } from "react-native";

export function AccountProfileScreen({
  userEmail,
  language,
  onProfileUpdated,
  onLanguageUpdated,
  canPlan=true,
}: {
  userEmail: string | null;
  language: "en" | "es";
  onProfileUpdated: (profile: AuthProfile | null) => void;
  onLanguageUpdated: (language: "en" | "es") => void;
  canPlan?:boolean;
}) {
  const [form, setForm] = useState<ClientProfileForm>({
    full_name: "",
    phone: "",
    country: "",
    language: "en",
    tentative_wedding_date: "",
    guest_count: "",
    wedding_budget: "",
    wedding_theme: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [avatar,setAvatar]=useState<string|null>(null);
  const [selectedPhoto,setSelectedPhoto]=useState<ImagePicker.ImagePickerAsset|null>(null);
  const [uploading,setUploading]=useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setIsLoading(true);
      setMessage("");

      try {
        const {
          data: { user },
        } = await supabase!.auth.getUser();

        if (!user) {
          if (isMounted) setMessage("Sign in to manage your profile.");
          return;
        }
        const state=await loadAuthState();
        if(isMounted)setAvatar(state.profile?.avatarUrl??null);

        const { data, error } = await supabase!
          .from("profiles")
          .select("full_name, phone, country, tentative_wedding_date, guest_count, wedding_budget, wedding_theme, language")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (isMounted) {
          setForm({
            full_name: typeof data?.full_name === "string" ? data.full_name : "",
            phone: typeof data?.phone === "string" ? data.phone : "",
            country: typeof data?.country === "string" ? data.country : "",
            language: data?.language === "es" ? "es" : "en",
            tentative_wedding_date:
              typeof data?.tentative_wedding_date === "string" ? data.tentative_wedding_date : "",
            guest_count: typeof data?.guest_count === "number" ? String(data.guest_count) : "",
            wedding_budget: typeof data?.wedding_budget === "number" ? String(data.wedding_budget) : "",
            wedding_theme: typeof data?.wedding_theme === "string" ? data.wedding_theme : "",
          });
          onLanguageUpdated(data?.language === "es" ? "es" : "en");
        }
      } catch (error) {
        if (isMounted) setMessage(error instanceof Error ? error.message : "Unable to load profile.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (supabase) void loadProfile();
    else {
      setIsLoading(false);
      setMessage("Supabase is not configured.");
    }

    return () => {
      isMounted = false;
    };
  }, []);

  function updateField<K extends keyof ClientProfileForm>(key: K, value: ClientProfileForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    if (!supabase) return;

    setIsSaving(true);
    setMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Sign in to save your profile.");

      const guestCount = form.guest_count.trim() ? Number(form.guest_count) : null;
      const budget = form.wedding_budget.trim() ? Number(form.wedding_budget) : null;

      if (canPlan && guestCount !== null && (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 100000)) {
        throw new Error("Guest count must be a positive number.");
      }
      if (canPlan && budget !== null && (!Number.isFinite(budget) || budget < 0 || budget > 1000000000)) {
        throw new Error("Budget must be zero or greater.");
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name.trim(),
          phone: form.phone.trim() || null,
          country: form.country.trim() || null,
          language: form.language,
          ...(canPlan?{tentative_wedding_date:form.tentative_wedding_date||null,guest_count:guestCount,wedding_budget:budget,wedding_theme:form.wedding_theme||null}:{}),
        })
        .eq("id", user.id);

      if (error) throw error;

      await supabase.auth.updateUser({
        data: { full_name: form.full_name.trim() },
      });

      const nextProfile = await loadAuthState();
      onProfileUpdated(nextProfile.profile);
      onLanguageUpdated(form.language);
      setMessage(form.language === "en" ? "Profile saved." : "Perfil guardado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save profile.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.searchState}>
        <ActivityIndicator color={colors.ink} />
        <Text style={styles.loadingText}>{copy[language].loadingProfile}</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.profileHero}>
        <View style={styles.profileAvatar}>
          {selectedPhoto||avatar?<Image source={{uri:selectedPhoto?.uri??avatar!}} style={{width:56,height:56,borderRadius:28}}/>:<Ionicons name="person" size={30} color={colors.paper} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>{copy[form.language].accountProfile}</Text>
          <Text style={styles.title}>{form.full_name || userEmail || (language === "en" ? "Your planning profile" : "Tu perfil de planeación")}</Text>
          <Text style={styles.body}>
            {copy[form.language].currentLanguage}: {form.language === "es" ? copy[form.language].spanish : copy[form.language].english}
          </Text>
        </View>
      </View>
      <View style={styles.formSection}>
        <TouchableOpacity disabled={uploading} style={styles.secondaryButton} onPress={()=>void (async()=>{const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,aspect:[1,1],quality:.88});if(!result.canceled)setSelectedPhoto(result.assets[0]);})().catch(()=>setMessage(copy[language].saveFailed))}><Text style={styles.secondaryButtonText}>{language==='es'?'Elegir foto':'Choose photo'}</Text></TouchableOpacity>
        {selectedPhoto?<TouchableOpacity disabled={uploading} style={styles.primaryButton} onPress={()=>void (async()=>{setUploading(true);setMessage('');try{await uploadVendorMedia('client-avatar',{uri:selectedPhoto.uri,name:selectedPhoto.fileName??'profile.jpg',type:selectedPhoto.mimeType??'image/jpeg'});const state=await loadAuthState();setAvatar(state.profile?.avatarUrl??null);onProfileUpdated(state.profile);setSelectedPhoto(null);}catch(error){setMessage(error instanceof Error?error.message:copy[language].saveFailed);}finally{setUploading(false);}})()}><Text style={styles.primaryButtonText}>{uploading?copy[language].saving:language==='es'?'Subir foto':'Upload photo'}</Text></TouchableOpacity>:null}
      </View>

      {message ? (
        <View style={message === "Profile saved." || message === "Perfil guardado." ? styles.successBanner : styles.errorBanner}>
          <Text style={message === "Profile saved." || message === "Perfil guardado." ? styles.successBannerText : styles.errorBannerText}>
            {message}
          </Text>
        </View>
      ) : null}

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>01 · {copy[form.language].contact}</Text>
        <FieldLabel text={form.language === "en" ? "Full name" : "Nombre completo"} />
        <TextInput
          autoComplete="name"
          onChangeText={(value) => updateField("full_name", value)}
          placeholder={copy[form.language].yourName}
          style={styles.input}
          value={form.full_name}
        />

        <FieldLabel text={copy[form.language].phone} />
        <TextInput
          autoComplete="tel"
          keyboardType="phone-pad"
          onChangeText={(value) => updateField("phone", value)}
          placeholder={copy[form.language].phoneNumber}
          style={styles.input}
          value={form.phone}
        />

        <FieldLabel text={copy[form.language].email} />
        <TextInput editable={false} style={[styles.input, styles.inputDisabled]} value={userEmail ?? ""} />

        <SearchableCountryDropdown language={form.language} label={copy[form.language].contactCountry} value={form.country} options={countryOptions(form.language)} onChange={value=>updateField('country',value)}/>

        <NativeSelect
          label={copy[form.language].preferredLanguage}
          value={form.language}
          helper={form.language === "en" ? `${copy[form.language].english} selected` : `${copy[form.language].spanish} seleccionado`}
          options={[
            { value: "en", label: copy[form.language].english },
            { value: "es", label: copy[form.language].spanish },
          ]}
          onChange={(value) => updateField("language", value === "es" ? "es" : "en")}
        />
      </View>

      {canPlan?<View style={styles.formSection}>
        <Text style={styles.sectionTitle}>02 · {copy[form.language].weddingPreferences}</Text>
        <FieldLabel text={form.language === "en" ? "Tentative wedding date" : "Fecha tentativa de boda"} />
        <QuoteDateCalendar language={form.language} value={form.tentative_wedding_date} onChange={(value) => updateField('tentative_wedding_date', value)} />

        <FieldLabel text={copy[form.language].guestCountOptional} />
        <TextInput
          keyboardType="number-pad"
          onChangeText={(value) => updateField("guest_count", value)}
          placeholder="120"
          style={styles.input}
          value={form.guest_count}
        />

        <FieldLabel text={copy[form.language].weddingBudgetOptional} />
        <TextInput
          keyboardType="decimal-pad"
          onChangeText={(value) => updateField("wedding_budget", value)}
          placeholder="25000"
          style={styles.input}
          value={form.wedding_budget}
        />

        <NativeSelect
          label={copy[form.language].weddingTheme}
          language={form.language}
          value={form.wedding_theme}
          options={themeOptions(form.language)}
          onChange={(value) => updateField("wedding_theme", value)}
        />

      </View>:null}
      <View style={styles.formSection}>
        <TouchableOpacity
          disabled={isSaving}
          onPress={handleSave}
          style={[styles.primaryButton, isSaving && styles.primaryButtonDisabled]}
        >
          <Text style={styles.primaryButtonText}>{isSaving ? copy[form.language].saving : copy[form.language].saveProfile}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>{copy[form.language].accountControls}</Text>
        <TouchableOpacity onPress={() => void openPublicWebPath("/privacy?lang="+form.language)} style={styles.secondaryButton}>
          <Ionicons name="shield-checkmark-outline" size={17} color={colors.tealDark} />
          <Text style={styles.secondaryButtonText}>{copy[form.language].privacyPolicy}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => void openPublicWebPath("/terms?lang="+form.language)} style={styles.secondaryButton}>
          <Ionicons name="document-text-outline" size={17} color={colors.tealDark} />
          <Text style={styles.secondaryButtonText}>{copy[form.language].termsOfService}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => void openPublicWebPath("/support?lang="+form.language)} style={styles.secondaryButton}>
          <Ionicons name="help-circle-outline" size={17} color={colors.tealDark} />
          <Text style={styles.secondaryButtonText}>{form.language === "es" ? "Soporte" : "Support"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => void openPublicWebPath("/community-guidelines?lang="+form.language)} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>{form.language === "es" ? "Normas de la comunidad" : "Community guidelines"}</Text>
        </TouchableOpacity>
        <Text style={styles.body}>{copy[form.language].deleteAccountHelp}</Text>
        <TouchableOpacity
          onPress={() => {
            confirmAccountDeletion(form.language);
          }}
          style={styles.secondaryButton}
        >
          <Ionicons name="trash-outline" size={17} color="#B42318" />
          <Text style={[styles.secondaryButtonText, styles.accountMenuDanger]}>{copy[form.language].deleteAccount}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
