import { copy } from "../../i18n/copy";
import { fetchVendors, type VendorListItem } from "../../lib/api";
import { styles } from "../../theme/styles";
import { colors } from "../../theme/tokens";
import { VendorCard } from "../vendors/components/VendorCard";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

export function FavoritesScreen({
  savedVendorIds,
  language,
  onOpenVendor,
  onRequestQuote,
  onRequestQuoteBatch,
  onToggleSaved,
}: {
  savedVendorIds: string[];
  language: "en" | "es";
  onOpenVendor: (vendor: VendorListItem) => void;
  onRequestQuote: (vendor: VendorListItem) => void;
  onRequestQuoteBatch: (vendors: VendorListItem[]) => void;
  onToggleSaved: (vendor: VendorListItem) => void;
}) {
  const labels = copy[language];
  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadSavedVendors() {
      setIsLoading(true);
      setMessage("");

      if (!savedVendorIds.length) {
        setVendors([]);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetchVendors({ page: 1, pageSize: 100 });
        if (isMounted) {
          setVendors(response.items.filter((vendor) => savedVendorIds.includes(vendor.id)));
        }
      } catch (error) {
        if (isMounted) setMessage(error instanceof Error ? error.message : "Unable to load saved vendors.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadSavedVendors();
    return () => {
      isMounted = false;
    };
  }, [savedVendorIds.join("|")]);

  if (isLoading) {
    return (
      <View style={styles.searchState}>
        <ActivityIndicator color={colors.ink} />
        <Text style={styles.loadingText}>{labels.loadingVendors}</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.dashboardHero}>
        <Text style={styles.kicker}>{labels.yourCollection}</Text>
        <Text style={styles.title}>{labels.savedVendors}</Text>
        <Text style={styles.body}>{savedVendorIds.length} {savedVendorIds.length === 1 ? labels.savedVendor : labels.savedVendorsCount}</Text>
        {vendors.length ? (
          <TouchableOpacity onPress={() => onRequestQuoteBatch(vendors)} style={styles.favoriteBatchButton}>
            <Ionicons name="send-outline" size={17} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>
              {labels.requestQuotesFromAll}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {message ? (
        <View style={styles.panel}>
          <Text style={styles.errorText}>{message}</Text>
        </View>
      ) : vendors.length ? (
        <View style={styles.vendorList}>
          {vendors.map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              isSaved={savedVendorIds.includes(vendor.id)}
              language={language}
              onPress={onOpenVendor}
              onRequestQuote={onRequestQuote}
              onToggleSaved={onToggleSaved}
            />
          ))}
        </View>
      ) : (
        <View style={styles.panel}>
          <Text style={styles.title}>{labels.noSavedVendors}</Text>
          <Text style={styles.body}>{labels.noSavedVendorsHint}</Text>
        </View>
      )}
    </View>
  );
}
