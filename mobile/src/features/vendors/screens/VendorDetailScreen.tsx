import { ContentSafety } from "../../inbox/ContentSafety";
import { type IconName } from "../../../application/types";
import { categoryLabel, detailSections } from "../../../content/catalog";
import { copy } from "../../../i18n/copy";
import { fetchVendorDetail, type VendorDetail, type VendorListItem } from "../../../lib/api";
import { vendorShareUrl } from "../../../lib/urls";
import { styles } from "../../../theme/styles";
import { colors } from "../../../theme/tokens";
import { AvailabilityPreview } from "../../../ui/calendars";
import { formatCategory, formatMoney } from "../../../ui/format";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Linking, Modal, ScrollView, Share, Text, TouchableOpacity, View, useWindowDimensions, type LayoutChangeEvent } from "react-native";
import { ExampleVendorNotice } from "../components/ExampleVendorNotice";
import { exampleVendorCopy } from "../../../../../shared/vendors/examples";
import {CoverVideo} from '../components/CoverVideo';

export function InfoMetric({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Ionicons name={icon} size={19} color={colors.tealDark} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}


export function DetailSection({
  icon,
  eyebrow,
  title,
  children,
  onLayout,
}: {
  icon: IconName;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  onLayout?: (event: LayoutChangeEvent) => void;
}) {
  return (
    <View onLayout={onLayout} style={styles.detailSection}>
      <View style={styles.detailSectionTitleRow}>
        <View style={styles.detailSectionIcon}>
          <Ionicons name={icon} size={18} color={colors.tealDark} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>{eyebrow}</Text>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}


export function EmptySectionText({ text }: { text: string }) {
  return <Text style={styles.detailBody}>{text}</Text>;
}


export function VendorDetailScreen({
  slug,
  initialVendor,
  isSaved,
  language,
  onBack,
  onRequestQuote,
  onScrollToSection,
  onToggleSaved,
  disableSectionScroll = false,
  showBack = true,
  privatePreview=false,
  coverVisible=true,
  canViewPricing=false,
  floatingQuote=false,
  onInquiryPosition,
}: {
  slug: string;
  initialVendor: VendorListItem | null;
  isSaved: boolean;
  language: "en" | "es";
  onBack: () => void;
  onRequestQuote: (vendor: VendorListItem) => void;
  onScrollToSection: (y: number) => void;
  onToggleSaved: (vendor: VendorListItem) => void;
  disableSectionScroll?: boolean;
  showBack?: boolean;
  privatePreview?:boolean;
  coverVisible?:boolean;
  canViewPricing?:boolean;
  floatingQuote?:boolean;
  onInquiryPosition?:(y:number)=>void;
}) {
  const labels = copy[language];
  const {height}=useWindowDimensions();
  const [loadedVendor, setLoadedVendor] = useState<{ slug: string; vendor: VendorDetail } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeGalleryImage, setActiveGalleryImage] = useState<string | null>(null);
  const sectionPositions = useRef<Record<string, number>>({});
  const sheetOffset=useRef(0);
  function notifyInquiry(){const y=sectionPositions.current.contact;if(typeof y==='number')onInquiryPosition?.(sheetOffset.current+y);}
  const initialDetailVendor = initialVendor?.slug === slug ? (initialVendor as VendorDetail) : null;
  const vendor = loadedVendor?.slug === slug ? loadedVendor.vendor : initialDetailVendor;

  function registerSection(key: string) {
    return (event: LayoutChangeEvent) => {
      sectionPositions.current[key] = event.nativeEvent.layout.y;
      if(key==='contact')notifyInquiry();
    };
  }

  function handleSectionPress(key: string) {
    if (disableSectionScroll) return;
    const y = sectionPositions.current[key];
    if (typeof y === "number") onScrollToSection(Math.max(sheetOffset.current+y - 8, 0));
  }

  async function handleShare() {
    if (!vendor) return;
    const vendorUrl = vendorShareUrl(vendor.slug);
    await Share.share({
      title: vendor.business_name,
      message: `${vendor.business_name}\n${vendorUrl}`,
      url: vendorUrl,
    });
  }

  async function handleCall() {
    if (!vendor?.phone) return;
    const phone = vendor.phone.replace(/[^\d+]/g, "");
    if (!phone) return;
    await Linking.openURL(`tel:${phone}`);
  }

  useEffect(() => {
    if(privatePreview){setIsLoading(false);return;}
    let isMounted = true;

    async function loadVendorDetail() {
      setIsLoading(true);
      setMessage("");

      try {
        const detail = await fetchVendorDetail(slug, language);
        if (isMounted) setLoadedVendor({ slug, vendor: detail });
      } catch (error) {
        if (isMounted) setMessage(error instanceof Error ? error.message : "Unable to load vendor.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadVendorDetail();

    return () => {
      isMounted = false;
    };
  }, [slug, language, privatePreview]);

  if (isLoading && !vendor) {
    return (
      <View style={styles.searchState}>
        <ActivityIndicator color={colors.teal} />
        <Text style={styles.loadingText}>{labels.loadingVendorProfile}</Text>
      </View>
    );
  }

  if (!vendor) {
    return (
      <View style={styles.panel}>
        <TouchableOpacity onPress={onBack} style={styles.backButtonInline}>
          <Ionicons name="chevron-back" size={18} color={colors.tealDark} />
          <Text style={styles.backButtonText}>{labels.backToSearch}</Text>
        </TouchableOpacity>
        <Text style={styles.errorText}>{message || labels.vendorNotFound}</Text>
      </View>
    );
  }

  const heroUrl = vendor.hero_image?.url ?? (!isLoading ? vendor.thumbnail_image?.url : null);
  const gallery = (vendor.gallery_images ?? []).filter((item) => item.url).slice(0, 6);
  const categoriesText = (vendor.categories ?? []).map((item) => categoryLabel(item, language)).join(" / ");
  const bio = ((language === "es" ? vendor.bio_es : vendor.bio_en) ?? vendor.bio_en ?? vendor.bio_es ?? "").trim();
  const extra = ((language === "es" ? vendor.extra_info_es : vendor.extra_info_en) ?? vendor.extra_info_en ?? vendor.extra_info_es ?? "").trim();
  const location = [vendor.location?.city, vendor.location?.region, vendor.location?.country]
    .filter(Boolean)
    .join(", ");
  const rating = Number(vendor.rating_avg ?? 0);
  const reviewCount = Number(vendor.rating_count ?? 0);
  const amenityGroups = vendor.amenities ?? {
    amenities: [],
    ceremony_types: [],
    settings: [],
    services: [],
  };
  const allAmenityGroups = [
    { key: "amenities", title: labels.highlights, items: amenityGroups.amenities },
    { key: "services", title: labels.services, items: amenityGroups.services },
    { key: "settings", title: labels.settings, items: amenityGroups.settings },
    { key: "ceremony_types", title: labels.coverage, items: amenityGroups.ceremony_types },
  ];

  return (
    <View style={styles.detailScreen}>
      {showBack ? (
        <TouchableOpacity onPress={onBack} style={styles.detailBackButton}>
          <Ionicons name="chevron-back" size={18} color={colors.ink} />
        </TouchableOpacity>
      ) : null}

      <View style={[styles.detailHero,{minHeight:Math.max(480,height-125)}]}>
        {heroUrl ? (
          <Image source={{ uri: heroUrl }} style={styles.detailHeroImage} />
        ) : (
          <View style={styles.detailHeroFallback}>
            <Text style={styles.vendorImageFallbackText}>{vendor.business_name.slice(0, 2).toUpperCase()}</Text>
          </View>
        )}
        {vendor.hero_video?.provider==='file'?<CoverVideo key={vendor.hero_video.url} url={vendor.hero_video.url} visible={coverVisible&&!activeGalleryImage} language={language}/>:null}
        <View pointerEvents="none" style={styles.detailHeroShade} />
        <View style={styles.detailHeroActions}>
          {vendor.hero_video && <TouchableOpacity accessibilityRole="button" accessibilityLabel={language === 'es' ? 'Ver video de portada' : 'Watch cover video'} onPress={() => void Linking.openURL(vendor.hero_video!.url).catch(() => undefined)} style={styles.detailIconButton}>
            <Ionicons name="play" size={20} color={colors.ink} />
          </TouchableOpacity>}
          {!privatePreview && !vendor.is_example && <TouchableOpacity onPress={() => onToggleSaved(vendor)} style={styles.detailIconButton}>
            <Ionicons name={isSaved ? "heart" : "heart-outline"} size={20} color={isSaved ? "#B42318" : colors.ink} />
          </TouchableOpacity>}
          {!privatePreview && <TouchableOpacity onPress={() => void handleShare()} style={styles.detailIconButton}>
            <Ionicons name="share-outline" size={20} color={colors.ink} />
          </TouchableOpacity>}
        </View>
        <View style={styles.detailHeroCopy}>
          <Text style={styles.heroBadge}>{vendor.is_example ? exampleVendorCopy[language].badge : labels.vendorProfile}</Text>
          {categoriesText ? <Text style={styles.detailCategories}>{categoriesText}</Text> : null}
          <Text style={styles.detailTitle}>{vendor.business_name}</Text>
        </View>
      </View>

      <View style={styles.detailSheet} onLayout={event=>{sheetOffset.current=event.nativeEvent.layout.y;notifyInquiry();}}>
      {privatePreview ? <Text style={styles.body}>{language==='es'?'Vista previa privada · Datos guardados':'Private preview · Saved details'}</Text> : vendor.is_example ? <ExampleVendorNotice language={language} /> : <ContentSafety key={vendor.id} kind="vendor" targetId={vendor.id} language={language} />}
      {!floatingQuote && !privatePreview && !vendor.is_example && <View style={styles.detailActionBar}>
        <TouchableOpacity onPress={() => onRequestQuote(vendor)} style={styles.detailQuoteButton}>
          <Ionicons name="send-outline" size={17} color="#FFFFFF" />
          <Text style={styles.detailQuoteText}>{labels.requestQuote}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={!vendor.phone}
          onPress={() => void handleCall()}
          style={[styles.detailGhostButton, !vendor.phone && styles.detailGhostButtonDisabled]}
        >
          <Ionicons name="call-outline" size={17} color={colors.tealDark} />
          <Text style={styles.detailGhostText}>{labels.call}</Text>
        </TouchableOpacity>
      </View>}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.detailTabs}>
        {detailSections.map((section) => (
          <TouchableOpacity key={section.key} onPress={() => handleSectionPress(section.key)} style={styles.detailTabPill}>
            <Ionicons name={section.icon} size={14} color={colors.tealDark} />
            <Text style={styles.detailTabText}>{copy[language][section.key as keyof typeof copy.en] ?? section.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.metricGrid}>
        <InfoMetric icon="star-outline" label={labels.rating} value={`${rating.toFixed(1)} (${reviewCount})`} />
        <InfoMetric
          icon="cash-outline"
          label={labels.startingPrice}
          value={canViewPricing||privatePreview||vendor.is_example?formatMoney(vendor.starting_price_cents, vendor.starting_price_currency ?? "USD", language):language==='es'?'Inicia sesión':'Sign in'}
        />
        <InfoMetric
          icon="location-outline"
          label={labels.location}
          value={location || labels.availableByRequest}
        />
      </View>

      {gallery.length ? (
        <DetailSection icon="images-outline" eyebrow={labels.photos} title={labels.visualStory} onLayout={registerSection("photos")}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryStrip}>
            {gallery.map((item, index) => (
              <TouchableOpacity
                key={`${item.public_id ?? item.url}-${index}`}
                onPress={() => setActiveGalleryImage(item.url ?? null)}
              >
                <Image source={{ uri: item.url ?? "" }} style={styles.galleryImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </DetailSection>
      ) : (
        <DetailSection icon="images-outline" eyebrow={labels.photos} title={labels.visualStory} onLayout={registerSection("photos")}>
          <EmptySectionText text={labels.photosEmpty} />
        </DetailSection>
      )}

      <DetailSection icon="information-circle-outline" eyebrow={labels.about} title={labels.aboutTitle} onLayout={registerSection("about")}>
        {bio ? <Text style={styles.detailBody}>{bio}</Text> : null}
        {extra ? <Text style={styles.detailBody}>{extra}</Text> : null}
        {!bio && !extra ? <EmptySectionText text={labels.profileUpdating} /> : null}
        <View style={styles.detailChips}>
          {(vendor.languages ?? []).slice(0, 4).map((language) => (
            <View key={language} style={styles.detailChip}>
              <Ionicons name="language-outline" size={13} color={colors.tealDark} />
              <Text style={styles.detailChipText}>{formatCategory(language)}</Text>
            </View>
          ))}
          {vendor.years_in_business ? (
            <View style={styles.detailChip}>
              <Ionicons name="ribbon-outline" size={13} color={colors.tealDark} />
              <Text style={styles.detailChipText}>{vendor.years_in_business}+ years</Text>
            </View>
          ) : null}
          {vendor.team_size_range ? (
            <View style={styles.detailChip}>
              <Ionicons name="people-outline" size={13} color={colors.tealDark} />
              <Text style={styles.detailChipText}>{vendor.team_size_range}</Text>
            </View>
          ) : null}
          {(vendor.event_types ?? []).slice(0, 4).map((eventType) => (
            <View key={eventType} style={styles.detailChip}>
              <Ionicons name="sparkles-outline" size={13} color={colors.tealDark} />
              <Text style={styles.detailChipText}>{formatCategory(eventType)}</Text>
            </View>
          ))}
        </View>
      </DetailSection>

      <DetailSection icon="business-outline" eyebrow={labels.spaces} title={labels.spacesTitle} onLayout={registerSection("spaces")}>
        {(vendor.spaces ?? []).length ? (
          <View style={styles.spaceList}>
            {(vendor.spaces ?? []).map((space) => (
              <View key={space.id} style={styles.spaceCard}>
                <Text style={styles.spaceTitle}>{space.name ?? labels.serviceDetail}</Text>
                {space.capacity_max ? <Text style={styles.vendorMeta}>{labels.upToGuests} {space.capacity_max} {labels.guestsWord}</Text> : null}
                {space.description ? <Text style={styles.detailBody}>{space.description}</Text> : null}
              </View>
            ))}
          </View>
        ) : (
          <EmptySectionText text={labels.spacesEmpty} />
        )}
      </DetailSection>

      <DetailSection icon="cash-outline" eyebrow={labels.pricing} title={labels.pricingTitle} onLayout={registerSection("pricing")}>
        {canViewPricing||privatePreview||vendor.is_example?<View style={styles.pricingRows}>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>{labels.startingAt}</Text>
            <Text style={styles.pricingValue}>
              {formatMoney(vendor.starting_price_cents, vendor.starting_price_currency ?? "USD", language)}
            </Text>
          </View>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>{labels.typicalSpend}</Text>
            <Text style={styles.pricingValue}>
              {formatMoney(vendor.typical_spend_cents, vendor.typical_spend_currency ?? "USD", language)}
            </Text>
          </View>
          {vendor.capacity_max ? (
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>{labels.capacity}</Text>
              <Text style={styles.pricingValue}>{labels.upToGuests} {vendor.capacity_max} {labels.guestsWord}</Text>
            </View>
          ) : null}
          {(vendor.pricing ?? []).map((item) => (
            <View key={item.item_key} style={styles.pricingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pricingLabel}>{formatCategory(item.item_key)}</Text>
                {item.notes ? <Text style={styles.pricingNote}>{item.notes}</Text> : null}
              </View>
              <Text style={styles.pricingValue}>
                {item.contact_for_price
                  ? labels.contact
                  : formatMoney(item.price_cents, item.currency, language)}
              </Text>
            </View>
          ))}
        </View>:<TouchableOpacity style={styles.secondaryButton} onPress={()=>onRequestQuote(vendor)}><Text style={styles.secondaryButtonText}>{language==='es'?'Inicia sesión para ver precios':'Sign in to view pricing'}</Text></TouchableOpacity>}
      </DetailSection>

      <DetailSection icon="checkmark-circle-outline" eyebrow={labels.services} title={labels.servicesTitle} onLayout={registerSection("amenities")}>
        {allAmenityGroups.some((group) => group.items.length) ? (
          <View style={styles.amenityGrid}>
            {allAmenityGroups.map((group) => {
              if (!group.items.length) return null;
              return (
                <View key={group.key} style={styles.amenityGroup}>
                  <Text style={styles.amenityGroupTitle}>{group.title}</Text>
                  {group.items.map((item) => (
                    <View key={item.key} style={styles.amenityItem}>
                      <Ionicons name="checkmark" size={15} color={colors.tealDark} />
                      <Text style={styles.amenityText}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        ) : (
          <EmptySectionText text={labels.servicesEmpty} />
        )}
      </DetailSection>

      <DetailSection icon="people-outline" eyebrow={labels.team} title={labels.teamTitle} onLayout={registerSection("team")}>
        {(vendor.team ?? []).length ? (
          <View style={styles.teamList}>
            {(vendor.team ?? []).map((member) => (
              <View key={member.id} style={styles.teamCard}>
                {member.headshot_url ? (
                  <Image source={{ uri: member.headshot_url }} style={styles.teamAvatar} />
                ) : (
                  <View style={styles.teamAvatarFallback}>
                    <Text style={styles.teamAvatarText}>{member.name.slice(0, 1).toUpperCase()}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.teamName}>{member.name}</Text>
                  {member.title ? <Text style={styles.vendorMeta}>{member.title}</Text> : null}
                  {member.bio ? <Text style={styles.teamBio}>{member.bio}</Text> : null}
                  {member.responds_within_hours ? (
                    <Text style={styles.responseTime}>{labels.respondsWithin} {member.responds_within_hours}h</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <EmptySectionText text={labels.teamEmpty} />
        )}
      </DetailSection>

      <DetailSection icon="calendar-outline" eyebrow={labels.availability} title={labels.publishedDates} onLayout={registerSection("availability")}>
        <AvailabilityPreview dates={vendor.availability ?? []} language={language} />
      </DetailSection>

      <DetailSection icon="star-outline" eyebrow={labels.reviews} title={labels.coupleFeedback} onLayout={registerSection("reviews")}>
        {vendor.review_ai_summary ? (
          <View style={styles.aiReviewSummary}>
            <Ionicons name="sparkles-outline" size={16} color={colors.gold} />
            <Text style={styles.aiReviewText}>{vendor.review_ai_summary}</Text>
          </View>
        ) : null}
        {(vendor.review_distribution ?? []).length ? (
          <View style={styles.distributionList}>
            {(vendor.review_distribution ?? []).map((bucket) => (
              <View key={bucket.rating} style={styles.distributionRow}>
                <Text style={styles.distributionLabel}>{bucket.rating} {labels.star}</Text>
                <View style={styles.distributionTrack}>
                  <View
                    style={[
                      styles.distributionFill,
                      { width: `${Math.min(100, (bucket.count / Math.max(reviewCount, 1)) * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.distributionCount}>{bucket.count}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {(vendor.reviews ?? []).length ? (
          <View style={styles.reviewList}>
            {(vendor.reviews ?? []).slice(0, 3).map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={13} color={colors.gold} />
                    <Text style={styles.vendorRating}>{Number(review.rating ?? 0).toFixed(1)}</Text>
                  </View>
                  <Text style={styles.vendorMeta}>{new Date(review.created_at).toLocaleDateString()}</Text>
                </View>
                {review.title ? <Text style={styles.reviewTitle}>{review.title}</Text> : null}
                {review.body ? <Text style={styles.reviewBody}>{review.body}</Text> : null}
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.detailBody}>{labels.reviewsEmpty}</Text>
        )}
      </DetailSection>

      <DetailSection icon="call-outline" eyebrow={labels.contact} title={labels.nextStep} onLayout={registerSection("contact")}>
        <View style={styles.contactList}>
          {vendor.phone ? (
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={18} color={colors.tealDark} />
              <Text style={styles.contactText}>{vendor.phone}</Text>
            </View>
          ) : null}
          {vendor.website_url ? (
            <View style={styles.contactRow}>
              <Ionicons name="globe-outline" size={18} color={colors.tealDark} />
              <Text style={styles.contactText}>{vendor.website_url}</Text>
            </View>
          ) : null}
          {vendor.location?.address_label ? (
            <View style={styles.contactRow}>
              <Ionicons name="map-outline" size={18} color={colors.tealDark} />
              <Text style={styles.contactText}>{vendor.location.address_label}</Text>
            </View>
          ) : null}
        </View>
        {privatePreview ? null : vendor.is_example ? <Text style={styles.detailBody}>{exampleVendorCopy[language].disabled}</Text> : <TouchableOpacity onPress={() => onRequestQuote(vendor)} style={styles.detailQuoteButton}>
          <Ionicons name="send-outline" size={17} color="#FFFFFF" />
          <Text style={styles.detailQuoteText}>{labels.requestQuote}</Text>
        </TouchableOpacity>}
      </DetailSection>
      </View>

      <Modal
        visible={Boolean(activeGalleryImage)}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveGalleryImage(null)}
      >
        <View style={styles.galleryModal}>
          <TouchableOpacity style={styles.galleryModalClose} onPress={() => setActiveGalleryImage(null)}>
            <Ionicons name="close" size={24} color={colors.ink} />
          </TouchableOpacity>
          {activeGalleryImage ? (
            <Image source={{ uri: activeGalleryImage }} style={styles.galleryModalImage} resizeMode="contain" />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}
