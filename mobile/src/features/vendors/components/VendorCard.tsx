import { categoryLabel } from "../../../content/catalog";
import { copy } from "../../../i18n/copy";
import { type VendorListItem } from "../../../lib/api";
import { styles } from "../../../theme/styles";
import { colors } from "../../../theme/tokens";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image, Text, TouchableOpacity, View } from "react-native";

export function VendorCard({
  vendor,
  isSaved,
  language,
  onPress,
  onRequestQuote,
  onToggleSaved,
}: {
  vendor: VendorListItem;
  isSaved: boolean;
  language: "en" | "es";
  onPress: (vendor: VendorListItem) => void;
  onRequestQuote: (vendor: VendorListItem) => void;
  onToggleSaved: (vendor: VendorListItem) => void;
}) {
  const labels = copy[language];
  const thumbnailUrl = vendor.thumbnail_image?.url ?? null;
  const rating = Number(vendor.rating_avg ?? 0);
  const ratingCount = Number(vendor.rating_count ?? 0);
  const categories = (vendor.categories ?? []).slice(0, 3);
  const bio = (vendor.bio_en ?? vendor.bio_es ?? "").trim();

  return (
    <TouchableOpacity style={styles.vendorCard} onPress={() => onPress(vendor)} activeOpacity={0.88}>
      <View style={styles.vendorMediaWrap}>
        {thumbnailUrl ? (
          <Image source={{ uri: thumbnailUrl }} style={styles.vendorImage} />
        ) : (
          <View style={styles.vendorImageFallback}>
            <Text style={styles.vendorImageFallbackText}>
              {vendor.business_name.slice(0, 2).toUpperCase()}
            </Text>
          </View>
        )}
        <TouchableOpacity onPress={() => onToggleSaved(vendor)} style={styles.favoriteButton}>
          <Ionicons name={isSaved ? "heart" : "heart-outline"} size={20} color={isSaved ? "#B42318" : colors.ink} />
        </TouchableOpacity>
        <View style={styles.availabilityBadge}>
          <Ionicons name="calendar-outline" size={13} color={colors.tealDark} />
          <Text style={styles.availabilityText}>{labels.available}</Text>
        </View>
      </View>
      <View style={styles.vendorCardBody}>
        <View style={styles.vendorCardHeader}>
          <Text numberOfLines={2} style={styles.vendorName}>
            {vendor.business_name}
          </Text>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={13} color={colors.gold} />
            <Text style={styles.vendorRating}>{rating.toFixed(1)}</Text>
          </View>
        </View>
        {categories.length ? (
          <Text numberOfLines={1} style={styles.vendorCategories}>
            {categories.map((item) => categoryLabel(item, language)).join(" / ")}
          </Text>
        ) : null}
        {bio ? (
          <Text numberOfLines={3} style={styles.vendorBio}>
            {bio}
          </Text>
        ) : null}
        <View style={styles.vendorFooter}>
          <View style={styles.vendorMetaRow}>
            <Ionicons name="location-outline" size={14} color={colors.muted} />
            <Text style={styles.vendorMeta}>{ratingCount} {labels.reviews}</Text>
          </View>
          <TouchableOpacity onPress={() => onRequestQuote(vendor)} style={styles.quoteButton}>
            <Ionicons name="send-outline" size={13} color="#FFFFFF" />
            <Text style={styles.quoteButtonText}>{labels.requestQuote}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
