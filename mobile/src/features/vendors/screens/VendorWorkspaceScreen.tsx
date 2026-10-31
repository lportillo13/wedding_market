import { SectionPicker } from "../../../ui/SectionPicker";
import {CoverEditor} from '../components/CoverEditor';
import {WorkspaceTools} from '../components/WorkspaceTools';
import {workspaceCommand} from '../workspace-api';
import * as ImagePicker from "expo-image-picker";
import { profilePricingDrafts } from "../../../../../shared/vendors/pricing";
import { vendorPricingLabels } from "../../../../../shared/vendors/pricing-labels";
import { getProfileEssentials } from "../../../../../shared/vendors/profile-progress";
import { getVendorPricingOrder, getVendorServiceProfile } from "../../../../../shared/vendors/service-profile";
import { type IconName } from "../../../application/types";
import { copy } from "../../../i18n/copy";
import { loadVendorEditorData, localizedText, saveVendorAmenities, saveVendorAvailability, saveVendorContact, saveVendorDetails, saveVendorPricing, saveVendorStartingPrice, saveVendorReviews, saveVendorTeam, type VendorEditorData, type VendorEditorTab, uploadVendorMedia, uploadedAssetUrl } from "../../../lib/vendorProfile";
import { styles } from "../../../theme/styles";
import { colors } from "../../../theme/tokens";
import { EditableAvailabilityCalendar } from "../../../ui/calendars";
import { formatCategory } from "../../../ui/format";
import { FieldLabel } from "../../../ui/forms";
import { imageUrlFromAsset } from "../../../ui/media";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Keyboard, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

export const vendorEditorTabs: { key: VendorEditorTab; label: string; icon: IconName }[] = [
  { key: "details", label: "Details", icon: "create-outline" },
  { key: "contact", label: "Contact", icon: "call-outline" },
  { key: "pricing", label: "Pricing", icon: "cash-outline" },
  { key: "amenities", label: "Amenities", icon: "checkmark-circle-outline" },
  { key: "team", label: "Team", icon: "people-outline" },
  { key: "availability", label: "Dates", icon: "calendar-outline" },
  { key: "reviews", label: "Reviews", icon: "star-outline" },
  { key: "images", label: "Images", icon: "images-outline" },
];


export function VendorWorkspaceScreen({ language }: { language: "en" | "es" }) {
  const labels = copy[language];
  const [data, setData] = useState<VendorEditorData | null>(null);
  const [activeTab, setActiveTab] = useState<VendorEditorTab>("details");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [message, setMessage] = useState("");
  const [editorLanguage, setEditorLanguage] = useState<"en" | "es">(language);

  const [details, setDetails] = useState<Record<string, string>>({});
  const [contact, setContact] = useState<Record<string, string>>({});
  const [startingPrice,setStartingPrice]=useState<Record<string,string>>({starting_price:'',starting_price_currency:'USD'});
  const [pricingMeta, setPricingMeta] = useState<Record<string, string>>({});
  const [pricingRows, setPricingRows] = useState<Record<string, string>[]>([]);
  const [customPackage, setCustomPackage] = useState("");
  const [amenityKeys, setAmenityKeys] = useState<string[]>([]);
  const [amenityMeta, setAmenityMeta] = useState<Record<string, string>>({});
  const [teamRows, setTeamRows] = useState<Record<string, string>[]>([]);
  const [availabilityRows, setAvailabilityRows] = useState<Record<string, string>[]>([]);
  const [reviews, setReviews] = useState<Record<string, string>>({});

  useEffect(() => {
    setEditorLanguage(language);
  }, [language]);

  async function refreshVendor(initial = false, invalidate=true) {
    if (initial) { setIsLoading(true); setMessage(""); }
    try {
      if(!initial&&invalidate)await workspaceCommand({action:'invalidate'});
      const next = await loadVendorEditorData();
      setData(next);
      // Refresh saved metadata/media without overwriting any in-progress section.
      if (next && initial) hydrateVendorEditor(next);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load vendor profile.");
      if(!initial)throw error;
    } finally {
      setIsLoading(false);
    }
  }

  function hydrateVendorEditor(next: VendorEditorData) {
    const vendor = next.vendor;
    const extraInfo = (vendor.extra_info ?? {}) as Record<string, unknown>;
    setDetails({
      business_name: String(vendor.business_name ?? ""),
      slug: String(vendor.slug ?? ""),
      bio_en: localizedText(vendor.bio, "en"),
      bio_es: localizedText(vendor.bio, "es"),
      extra_info_en: String(extraInfo.en ?? ""),
      extra_info_es: String(extraInfo.es ?? ""),
    });
    setContact({
      phone: String(vendor.phone ?? ""),
      website_url: String(vendor.website_url ?? ""),
      map_url: String(vendor.map_url ?? ""),
      address_label: String(vendor.address_label ?? ""),
      event_types: Array.isArray(vendor.event_types) ? vendor.event_types.join(", ") : "",
      years_in_business: vendor.years_in_business ? String(vendor.years_in_business) : "",
      languages: Array.isArray(vendor.languages) ? vendor.languages.join(", ") : "",
      team_size_range: String(vendor.team_size_range ?? ""),
    });
    setPricingMeta({
      typical_spend: typeof vendor.pricing_typical_spend_cents === "number" ? String(vendor.pricing_typical_spend_cents / 100) : "",
      typical_currency: String(vendor.pricing_typical_spend_currency ?? vendor.starting_price_currency ?? "USD"),
      peak_seasons: Array.isArray(vendor.pricing_peak_seasons) ? vendor.pricing_peak_seasons.join(", ") : "",
    });
    setStartingPrice({starting_price:vendor.starting_price_cents==null?'':String(vendor.starting_price_cents/100),starting_price_currency:vendor.starting_price_currency??'USD'});
    setPricingRows(profilePricingDrafts(next.pricing, vendor.pricing_typical_spend_currency ?? "USD").map((row) => ({
      item_key: row.itemKey, price: row.price, currency: row.currency,
      contact_for_price: row.contactForPrice ? "true" : "false", notes_en: row.notesEn, notes_es: row.notesEs,
    })));
    setAmenityKeys(next.selectedAmenities);
    setAmenityMeta({
      capacity_max: vendor.capacity_max ? String(vendor.capacity_max) : "",
    });
    setTeamRows(next.team.map((member, index) => ({
      client_id: member.id ?? `member-${index}`,
      name: String(member.name ?? ""),
      title_en: localizedText(member.title, "en"),
      title_es: localizedText(member.title, "es"),
      bio_en: localizedText(member.bio, "en"),
      bio_es: localizedText(member.bio, "es"),
      headshot_url: String(member.headshot_url ?? ""),
      responds_within_hours: member.responds_within_hours ? String(member.responds_within_hours) : "",
    })));
    setAvailabilityRows(next.availability.length ? next.availability.map((date) => ({
      date: String(date.available_on ?? ""),
      status: date.availability_status === "busy" ? "busy" : "available",
    })) : [{ date: "", status: "available" }]);
    setReviews({
      review_ai_summary: String(vendor.review_ai_summary ?? ""),
      google_business_profile_url: String(extraInfo.google_business_profile_url ?? ""),
    });
  }

  useEffect(() => {
    void refreshVendor(true);
  }, []);

  async function saveCurrentTab() {
    if (!data?.vendor?.id) return;
    const vendorId = String(data.vendor.id);
    Keyboard.dismiss();
    setIsSaving(true);
    setMessage("");
    try {
      if (activeTab === "details") await saveVendorDetails(vendorId, details);
      if (activeTab === "contact") await saveVendorContact(vendorId, contact);
      if (activeTab === "pricing") await saveVendorPricing(vendorId, pricingMeta, pricingRows);
      if (activeTab === "amenities") await saveVendorAmenities(vendorId, amenityKeys, amenityMeta);
      if (activeTab === "team") await saveVendorTeam(vendorId, teamRows);
      if (activeTab === "availability") await saveVendorAvailability(vendorId, availabilityRows);
      if (activeTab === "reviews") await saveVendorReviews(vendorId, reviews, data.vendor.extra_info ?? null);
      await refreshVendor();
      setMessage(labels.saved);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : labels.saveFailed);
    } finally {
      setIsSaving(false);
    }
  }

  async function pickAndUpload(target: string) {
    const isGalleryUpload = target === "vendor-gallery";
    const aspect: [number, number] =
      target === "vendor-logo" ? [1, 1] :
      target === "vendor-hero" ? [16, 9] :
      target === "vendor-thumbnail" ? [4, 3] :
      [4, 3];
    setIsSaving(true);
    setIsUploading(true);
    setUploadProgress(5);
    setUploadStatus(language === "en" ? "Preparing upload..." : "Preparando carga...");
    setMessage("");
    try {
      setUploadProgress(12);
      setUploadStatus(language === "en" ? "Opening photo library..." : "Abriendo galería...");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: !isGalleryUpload,
        allowsMultipleSelection: isGalleryUpload,
        selectionLimit: isGalleryUpload ? 10 : 1,
        aspect,
        quality: 0.88,
      });
      if (result.canceled) {
        setUploadProgress(0);
        setUploadStatus("");
        return;
      }
      const total = result.assets.length;
      if (total > 10) throw new Error(language === 'es' ? 'Selecciona hasta 10 fotos a la vez.' : 'Select up to 10 photos at a time.');
      setUploadProgress(18);
      for (const [index, asset] of result.assets.entries()) {
        setUploadStatus(language === "en" ? `Uploading ${index + 1} of ${total}...` : `Subiendo ${index + 1} de ${total}...`);
        await uploadVendorMedia(target, {
          uri: asset.uri,
          name: asset.fileName ?? `${target}-${Date.now()}.jpg`,
          type: asset.mimeType ?? "image/jpeg",
        });
        setUploadProgress(Math.round(18 + ((index + 1) / total) * 72));
      }
      setUploadStatus(language === "en" ? "Refreshing current images..." : "Actualizando imágenes...");
      setUploadProgress(94);
      await refreshVendor();
      setUploadProgress(100);
      setUploadStatus(language === "en" ? `${total} image${total === 1 ? "" : "s"} uploaded successfully.` : `${total} imagen${total === 1 ? "" : "es"} subida${total === 1 ? "" : "s"} correctamente.`);
    } catch (error) {
      setUploadProgress(0);
      setUploadStatus("");
      setMessage(error instanceof Error ? error.message : language === "en" ? "Upload failed." : "Error al subir.");
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  }

  async function pickTeamHeadshot(clientId: string) {
    setIsSaving(true);
    setIsUploading(true);
    setUploadProgress(5);
    setUploadStatus(language === "en" ? "Preparing team photo..." : "Preparando foto del equipo...");
    setMessage("");
    try {
      setUploadProgress(20);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        allowsMultipleSelection: false,
        aspect: [1, 1],
        quality: 0.88,
      });
      if (result.canceled || !result.assets[0]) {
        setUploadProgress(0);
        setUploadStatus("");
        return;
      }
      const asset = result.assets[0];
      setUploadStatus(language === "en" ? "Uploading team photo..." : "Subiendo foto del equipo...");
      setUploadProgress(45);
      const upload = await uploadVendorMedia("vendor-team-headshot", {
        uri: asset.uri,
        name: asset.fileName ?? `team-headshot-${Date.now()}.jpg`,
        type: asset.mimeType ?? "image/jpeg",
      });
      const url = uploadedAssetUrl(upload);
      if (!url) throw new Error(language === "en" ? "Upload completed but no image URL was returned." : "La carga termino pero no devolvio URL de imagen.");
      setTeamRows((current) => current.map((member) => (
        member.client_id === clientId ? { ...member, headshot_url: url } : member
      )));
      setUploadProgress(100);
      setUploadStatus(language === "en" ? "Team photo uploaded. Save the Team tab to publish it." : "Foto del equipo subida. Guarda la pestana Equipo para publicarla.");
    } catch (error) {
      setUploadProgress(0);
      setUploadStatus("");
      setMessage(error instanceof Error ? error.message : language === "en" ? "Upload failed." : "Error al subir.");
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.searchState}>
        <ActivityIndicator color={colors.ink} />
        <Text style={styles.loadingText}>{labels.vendorWorkspace}</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.panel}>
        <Text style={styles.kicker}>{labels.vendorWorkspace}</Text>
        <Text style={styles.title}>{labels.noVendorProfile}</Text>
        {message ? <Text style={styles.errorText}>{message}</Text> : null}
      </View>
    );
  }

  const vendor = data.vendor;
  const gallery = Array.isArray(vendor.gallery_images) ? vendor.gallery_images : [];
  const galleryWithUrls = gallery.filter((item): item is { url: string } => typeof item.url === "string" && item.url.trim().length > 0);
  const firstGalleryUrl = galleryWithUrls.map((item) => item.url).find(Boolean) ?? null;
  const logoUrl = typeof vendor.logo_url === "string" ? vendor.logo_url : null;
  const heroUrl = imageUrlFromAsset(vendor.hero_image) ?? imageUrlFromAsset(vendor.thumbnail_image) ?? firstGalleryUrl ?? logoUrl;
  const businessName = String(vendor.business_name ?? "Vendor");
  const essentials = getProfileEssentials({ name: businessName, description: localizedText(vendor.bio, language),
    hasPhoto: Boolean(heroUrl), hasContact: Boolean(vendor.phone || vendor.website_url),
    hasPricing: vendor.starting_price_cents != null || data.pricing.length > 0 || vendor.pricing_typical_spend_cents != null });
  const packageLabels = vendorPricingLabels[language] as Record<string, string>;
  const packageName = (key: string) => packageLabels[key] ?? formatCategory(key);
  const suggestedPackages = getVendorPricingOrder(data.categoryKeys).filter((key) => !pricingRows.some((row) => row.item_key.toLowerCase() === key.toLowerCase()));
  function addPricingPackage(key: string) {
    const name = key.trim();
    if (!name || pricingRows.length >= 100) return;
    if (pricingRows.some((row) => row.item_key.toLowerCase() === name.toLowerCase())) { setMessage(language === "es" ? "Usa un nombre diferente para este paquete." : "Give this package a unique name."); return; }
    setMessage("");
    setPricingRows((current) => [...current, { item_key: name, price: "", currency: pricingMeta.typical_currency || "USD", contact_for_price: "false", notes_en: "", notes_es: "" }]);
    setCustomPackage("");
  }


  return (
    <View>
      <View style={styles.vendorWorkspaceHero}>
        {heroUrl ? <Image source={{ uri: heroUrl }} style={styles.vendorWorkspaceImage} /> : null}
        <View style={styles.vendorWorkspaceOverlay} />
        <View style={styles.vendorWorkspaceCopy}>
          <Text style={styles.heroBadge}>{labels.vendorProfile}</Text>
          <Text style={styles.detailTitle}>{businessName}</Text>
          <Text style={styles.detailCategories}>{vendor.is_published ? labels.published : labels.draft}</Text>
        </View>
      </View>

      <View style={styles.editorSubCard}>
        <Text style={styles.sectionTitle}>{language === "es" ? "Empieza por lo esencial" : "Start with the essentials"} · {essentials.filter((step) => step.complete).length}/4</Text>
        <Text style={styles.body}>{language === "es" ? "Puedes cambiar de sección sin perder tu borrador. Guarda antes de salir de este espacio." : "Switch sections without losing your draft. Save before leaving this workspace."}</Text>
        <View style={styles.detailChips}>{essentials.map((step) => <TouchableOpacity disabled={isSaving} key={step.id} style={styles.detailChip} onPress={() => setActiveTab(step.id)}><Text style={styles.detailChipText}>{step.complete ? "✓ " : "+ "}{copy[language][step.id]}</Text></TouchableOpacity>)}</View>
      </View>
      <WorkspaceTools vendorId={String(vendor.id)} published={Boolean(vendor.is_published)} language={language} onSaved={()=>refreshVendor(false,false)}/>
      <SectionPicker value={activeTab} disabled={isSaving} onChange={setActiveTab}
        label={language === 'es' ? 'Sección del perfil' : 'Profile section'}
        closeLabel={language === 'es' ? 'Cerrar' : 'Close'}
        options={vendorEditorTabs.map(tab => ({ key: tab.key, label: copy[language][tab.key] }))} />

      {message ? (
        <View style={message === labels.saved ? styles.successBanner : styles.errorBanner}>
          <Text style={message === labels.saved ? styles.successBannerText : styles.errorBannerText}>{message}</Text>
        </View>
      ) : null}

      <View style={styles.editorPanel} pointerEvents={isSaving ? "none" : "auto"}>
        {activeTab === "details" ? (
          <View style={styles.form}>
            <LanguageSegment value={editorLanguage} language={language} onChange={setEditorLanguage} />
            <VendorFieldGroup values={details} setValues={setDetails} fields={[
              ["business_name", labels.businessName],
              ["slug", labels.slug],
              [`bio_${editorLanguage}`, editorLanguage === "en" ? labels.bioEnglish : labels.bioSpanish, "multiline"],
              [`extra_info_${editorLanguage}`, editorLanguage === "en" ? labels.extraInfoEnglish : labels.extraInfoSpanish, "multiline"],
            ]} />
          </View>
        ) : null}

        {activeTab === "contact" ? (
          <VendorFieldGroup values={contact} setValues={setContact} fields={[
            ["phone", labels.phone],
            ["website_url", labels.website],
            ["map_url", labels.mapUrl],
            ["address_label", labels.address],
            ["event_types", labels.eventTypes],
            ["years_in_business", labels.yearsInBusiness],
            ["languages", labels.languages],
            ["team_size_range", labels.teamSize],
          ]} />
        ) : null}

        {activeTab === "pricing" ? (
          <View style={styles.form}>
            <View style={styles.editorSubCard}>
              <Text style={styles.sectionTitle}>{labels.startingPrice}</Text>
              <VendorFieldGroup values={startingPrice} setValues={setStartingPrice} fields={[["starting_price",labels.startingPrice],["starting_price_currency",labels.currency]]}/>
              <TouchableOpacity disabled={isSaving} style={styles.secondaryButton} onPress={()=>void (async()=>{
                setIsSaving(true);setMessage('');try{await saveVendorStartingPrice(String(vendor.id),startingPrice);await refreshVendor();setMessage(labels.saved);}catch(error){setMessage(error instanceof Error?error.message:labels.saveFailed);}finally{setIsSaving(false);}
              })()}><Text style={styles.secondaryButtonText}>{language==='es'?'Guardar precio inicial':'Save starting price'}</Text></TouchableOpacity>
            </View>
            <VendorFieldGroup values={pricingMeta} setValues={setPricingMeta} fields={[
              ["typical_spend", labels.typicalSpend],
              ["typical_currency", labels.currency],
              ["peak_seasons", labels.peakSeasons],
            ]} />
            <LanguageSegment value={editorLanguage} language={language} onChange={setEditorLanguage} />
            {pricingRows.length === 0 ? <Text style={styles.body}>{language === "es" ? "Añade un servicio recomendado o crea tu propio paquete." : "Add a suggested service or create your own package."}</Text> : null}
            {pricingRows.map((row, index) => (
              <View key={row.item_key} style={styles.editorSubCard}>
                <Text style={styles.sectionTitle}>{packageName(row.item_key)}</Text>
                <TouchableOpacity accessibilityLabel={`${language === "es" ? "Quitar" : "Remove"} ${packageName(row.item_key)}`} onPress={() => Alert.alert(language === "es" ? "¿Quitar paquete?" : "Remove package?", language === "es" ? "Se quitará cuando guardes esta sección." : "It will be removed when you save this section.", [{ text: language === "es" ? "Cancelar" : "Cancel", style: "cancel" }, { text: language === "es" ? "Quitar" : "Remove", style: "destructive", onPress: () => setPricingRows((current) => current.filter((item) => item.item_key !== row.item_key)) }])}><Text style={styles.errorText}>{language === "es" ? "Quitar paquete" : "Remove package"}</Text></TouchableOpacity>
                <FieldLabel text={`${labels.price} (${row.currency || pricingMeta.typical_currency || "USD"})`} />
                <TextInput accessibilityLabel={labels.price} editable={row.contact_for_price !== "true"} keyboardType="decimal-pad" style={styles.input} value={row.price} onChangeText={(value) => setPricingRows((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, price: value } : item))} />
                <TouchableOpacity
                  onPress={() => setPricingRows((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, contact_for_price: item.contact_for_price === "true" ? "false" : "true" } : item))}
                  style={styles.checkboxRow}
                >
                  <Ionicons name={row.contact_for_price === "true" ? "checkbox" : "square-outline"} size={20} color={colors.tealDark} />
                  <Text style={styles.checkboxText}>{labels.contactForPrice}</Text>
                </TouchableOpacity>
                <FieldLabel text={labels.notes} />
                <TextInput multiline style={[styles.input, styles.textArea]} accessibilityLabel={labels.notes} value={row[`notes_${editorLanguage}`]} onChangeText={(value) => setPricingRows((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [`notes_${editorLanguage}`]: value } : item))} />
              </View>
            ))}
            <View style={styles.detailChips}>{suggestedPackages.map((key) => <TouchableOpacity key={key} onPress={() => addPricingPackage(key)} style={styles.detailChip}><Text style={styles.detailChipText}>+ {packageName(key)}</Text></TouchableOpacity>)}</View>
            <FieldLabel text={language === "es" ? "O crea tu propio paquete" : "Or create your own package"} />
            <TextInput accessibilityLabel={language === "es" ? "Nombre del paquete" : "Package name"} maxLength={120} style={styles.input} placeholder={language === "es" ? "Por ejemplo: Boda íntima" : "For example: Intimate wedding"} value={customPackage} onChangeText={setCustomPackage} />
            <TouchableOpacity disabled={!customPackage.trim() || pricingRows.length >= 100} onPress={() => addPricingPackage(customPackage)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>+ {language === "es" ? "Añadir paquete" : "Add package"}</Text></TouchableOpacity>
          </View>
        ) : null}

        {activeTab === "amenities" ? (
          <View style={styles.form}>
            <VendorFieldGroup values={amenityMeta} setValues={setAmenityMeta} fields={[
              ...(getVendorServiceProfile(data.categoryKeys).supportsGuestCapacity ? [["capacity_max", labels.maxCapacity] as [string, string]] : []),
            ]} />
            <View style={styles.detailChips}>
              {data.amenityOptions.map((option) => {
                const key = String(option.key);
                const selected = amenityKeys.includes(key);
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setAmenityKeys((current) => selected ? current.filter((item) => item !== key) : [...current, key])}
                    style={[styles.detailChip, selected && styles.editorChipSelected]}
                  >
                    <Text style={styles.detailChipText}>{localizedText(option.label, language) || formatCategory(key)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

        {activeTab === "team" ? (
          <View style={styles.form}>
            <LanguageSegment value={editorLanguage} language={language} onChange={setEditorLanguage} />
            {teamRows.map((member, index) => (
              <View key={member.client_id} style={styles.editorSubCard}>
                <TouchableOpacity disabled={isSaving} onPress={() => Alert.alert(language === "es" ? "¿Quitar persona?" : "Remove person?", language === "es" ? "Se quitará cuando guardes esta sección." : "They will be removed when you save this section.", [{ text: language === "es" ? "Cancelar" : "Cancel", style: "cancel" }, { text: language === "es" ? "Quitar" : "Remove", style: "destructive", onPress: () => setTeamRows((current) => current.filter((item) => item.client_id !== member.client_id)) }])}><Text style={styles.errorText}>{language === "es" ? "Quitar persona" : "Remove person"}</Text></TouchableOpacity>
                <CurrentMediaPreview
                  compact
                  fallback={member.name ? member.name.slice(0, 1).toUpperCase() : "T"}
                  label={labels.currentHeadshot}
                  url={member.headshot_url || null}
                />
                <TouchableOpacity
                  disabled={isSaving}
                  onPress={() => void pickTeamHeadshot(member.client_id)}
                  style={styles.secondaryButton}
                >
                  <Ionicons name="cloud-upload-outline" size={16} color={colors.tealDark} />
                  <Text style={styles.secondaryButtonText}>{labels.uploadHeadshot}</Text>
                </TouchableOpacity>
                <VendorFieldGroup values={member} setValues={(updater) => setTeamRows((current) => current.map((item, itemIndex) => itemIndex === index ? (typeof updater === "function" ? updater(item) : updater) : item))} fields={[
                  ["name", language === "en" ? "Name" : "Nombre"],
                  [`title_${editorLanguage}`, editorLanguage === "en" ? labels.titleEnglish : labels.titleSpanish],
                  [`bio_${editorLanguage}`, editorLanguage === "en" ? labels.bioEnglish : labels.bioSpanish, "multiline"],
                  ["responds_within_hours", language === "en" ? "Responds within hours" : "Responde en horas"],
                ]} />
              </View>
            ))}
            <TouchableOpacity disabled={teamRows.length >= 50 || isSaving} onPress={() => setTeamRows((current) => [...current, { client_id: `new-${Date.now()}-${Math.random()}`, name: "", title_en: "", title_es: "", bio_en: "", bio_es: "", headshot_url: "", responds_within_hours: "" }])} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>{labels.addTeamMember}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {activeTab === "availability" ? (
          <View style={styles.form}>
            <Text style={styles.body}>{labels.availabilityHelp}</Text>
            <EditableAvailabilityCalendar dates={availabilityRows} language={language} onChange={setAvailabilityRows} />
          </View>
        ) : null}

        {activeTab === "reviews" ? (
          <VendorFieldGroup values={reviews} setValues={setReviews} fields={[
            ["review_ai_summary", labels.reviewSummary, "multiline"],
            ["google_business_profile_url", labels.googleProfileUrl],
          ]} />
        ) : null}

        {activeTab === "images" ? (
          <View style={styles.form}>
            <CoverEditor vendor={vendor} language={language} onSaved={()=>refreshVendor()}/>
            <View style={styles.currentMediaGrid}>
              <CurrentMediaPreview
                label={labels.logo}
                url={logoUrl}
                fallback={businessName.slice(0, 2).toUpperCase()}
                compact
              />
              <CurrentMediaPreview
                label={labels.hero}
                url={imageUrlFromAsset(vendor.hero_image)}
                fallback={labels.noHero}
              />
              <CurrentMediaPreview
                label={labels.thumbnail}
                url={imageUrlFromAsset(vendor.thumbnail_image)}
                fallback={labels.noThumb}
              />
            </View>
            <Text style={styles.kicker}>{labels.uploadOrReplace}</Text>
            <View style={styles.imageUploadGrid}>
              <TouchableOpacity disabled={isUploading} onPress={() => void pickAndUpload("vendor-logo")} style={[styles.imageUploadButton, isUploading && styles.primaryButtonDisabled]}><Ionicons name="ribbon-outline" size={18} color={colors.tealDark} /><Text style={styles.secondaryButtonText}>{labels.logo}</Text></TouchableOpacity>
              <TouchableOpacity disabled={isUploading} onPress={() => void pickAndUpload("vendor-hero")} style={[styles.imageUploadButton, isUploading && styles.primaryButtonDisabled]}><Ionicons name="image-outline" size={18} color={colors.tealDark} /><Text style={styles.secondaryButtonText}>{labels.hero}</Text></TouchableOpacity>
              <TouchableOpacity disabled={isUploading} onPress={() => void pickAndUpload("vendor-thumbnail")} style={[styles.imageUploadButton, isUploading && styles.primaryButtonDisabled]}><Ionicons name="albums-outline" size={18} color={colors.tealDark} /><Text style={styles.secondaryButtonText}>{labels.thumbnail}</Text></TouchableOpacity>
              <TouchableOpacity disabled={isUploading} onPress={() => void pickAndUpload("vendor-gallery")} style={[styles.imageUploadButton, isUploading && styles.primaryButtonDisabled]}><Ionicons name="images-outline" size={18} color={colors.tealDark} /><Text style={styles.secondaryButtonText}>{labels.gallery}</Text></TouchableOpacity>
            </View>
            {uploadStatus ? (
              <View style={styles.uploadProgressCard}>
                <View style={styles.uploadProgressHeader}>
                  <Text style={styles.uploadProgressTitle}>{isUploading ? labels.uploading : labels.completed}</Text>
                  <Text style={styles.uploadProgressPercent}>{uploadProgress}%</Text>
                </View>
                <View style={styles.uploadProgressTrack}>
                  <View style={[styles.uploadProgressFill, { width: `${uploadProgress}%` }]} />
                </View>
                <Text style={styles.uploadProgressStatus}>{uploadStatus}</Text>
              </View>
            ) : null}
            <Text style={styles.kicker}>{labels.currentGallery}</Text>
            {galleryWithUrls.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryStrip}>
                {galleryWithUrls.map((item, index) => (
                  <Image key={`${item.url}-${index}`} source={{ uri: item.url }} style={styles.galleryImage} />
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.body}>{labels.noGalleryImages}</Text>
            )}
          </View>
        ) : null}

        {activeTab !== "images" ? (
          <TouchableOpacity disabled={isSaving} onPress={() => void saveCurrentTab()} style={[styles.primaryButton, isSaving && styles.primaryButtonDisabled]}>
            <Text style={styles.primaryButtonText}>{isSaving ? labels.saving : labels.saveChanges}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}


export function VendorFieldGroup({
  values,
  setValues,
  fields,
}: {
  values: Record<string, string>;
  setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  fields: [string, string, "multiline"?][];
}) {
  return (
    <View style={styles.form}>
      {fields.map(([key, label, mode]) => (
        <View key={key} style={styles.formField}>
          <FieldLabel text={label} />
          <TextInput
            accessibilityLabel={label}
            autoCapitalize={key.includes("url") || key === "slug" ? "none" : "sentences"}
            autoCorrect={!(key.includes("url") || key === "slug")}
            keyboardType={key === "phone" ? "phone-pad" : key.includes("url") ? "url" : key.includes("price") || key.includes("spend") ? "decimal-pad" : key === "years_in_business" || key === "responds_within_hours" || key === "capacity_max" ? "number-pad" : "default"}
            multiline={mode === "multiline"}
            onChangeText={(value) => setValues((current) => ({ ...current, [key]: value }))}
            style={[styles.input, mode === "multiline" && styles.textArea]}
            value={values[key] ?? ""}
          />
        </View>
      ))}
    </View>
  );
}


export function LanguageSegment({
  value,
  language = value,
  onChange,
}: {
  value: "en" | "es";
  language?: "en" | "es";
  onChange: (language: "en" | "es") => void;
}) {
  const labels = copy[language];
  return (
    <View style={styles.languageSegment}>
      {([
        ["en", labels.english],
        ["es", labels.spanish],
      ] as const).map(([key, label]) => (
        <TouchableOpacity
          key={key}
          onPress={() => onChange(key)}
          style={[styles.languageSegmentButton, value === key && styles.languageSegmentButtonActive]}
        >
          <Text style={[styles.languageSegmentText, value === key && styles.languageSegmentTextActive]}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}


export function CurrentMediaPreview({
  label,
  url,
  fallback,
  compact = false,
}: {
  label: string;
  url: string | null;
  fallback: string;
  compact?: boolean;
}) {
  return (
    <View style={[styles.currentMediaCard, compact && styles.currentMediaCardCompact]}>
      <Text style={styles.kicker}>{label}</Text>
      {url ? (
        <Image source={{ uri: url }} style={[styles.currentMediaImage, compact && styles.currentMediaImageCompact]} resizeMode="cover" />
      ) : (
        <View style={[styles.currentMediaFallback, compact && styles.currentMediaImageCompact]}>
          <Text style={styles.currentMediaFallbackText}>{fallback}</Text>
        </View>
      )}
    </View>
  );
}
