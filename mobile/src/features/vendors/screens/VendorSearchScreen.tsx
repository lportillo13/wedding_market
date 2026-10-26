import { type SearchViewMode } from "../../../application/types";
import { categories, categoryLabel } from "../../../content/catalog";
import { copy } from "../../../i18n/copy";
import { fetchVendors, type VendorListItem } from "../../../lib/api";
import { mergeUniqueById } from "../../../lib/search";
import { externalMapUrl } from "../../../lib/urls";
import { styles } from "../../../theme/styles";
import { colors } from "../../../theme/tokens";
import { hasVendorCoordinates, vendorLocationLabel } from "../../../ui/format";
import { VendorCard } from "../components/VendorCard";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Linking, Text, TextInput, TouchableOpacity, View } from "react-native";

export function SearchMapResults({
  vendors,
  language,
  onOpenVendor,
}: {
  vendors: VendorListItem[];
  language: "en" | "es";
  onOpenVendor: (vendor: VendorListItem) => void;
}) {
  const labels = copy[language];
  const locatedVendors = vendors.filter(hasVendorCoordinates);
  const displayVendors = locatedVendors.length ? locatedVendors : vendors;
  const lats = locatedVendors.map((vendor) => vendor.lat as number);
  const lngs = locatedVendors.map((vendor) => vendor.lng as number);
  const minLat = lats.length ? Math.min(...lats) : 0;
  const maxLat = lats.length ? Math.max(...lats) : 0;
  const minLng = lngs.length ? Math.min(...lngs) : 0;
  const maxLng = lngs.length ? Math.max(...lngs) : 0;
  const latSpan = Math.max(maxLat - minLat, 0.01);
  const lngSpan = Math.max(maxLng - minLng, 0.01);

  return (
    <View style={styles.mapResults}>
      <View
        accessibilityLabel={`${labels.mapPreview}: ${displayVendors.length} ${labels.vendorsFound}`}
        style={styles.mapCanvas}
      >
        <View style={[styles.mapGridLine, styles.mapGridLineVerticalOne]} />
        <View style={[styles.mapGridLine, styles.mapGridLineVerticalTwo]} />
        <View style={[styles.mapGridLine, styles.mapGridLineHorizontalOne]} />
        <View style={[styles.mapGridLine, styles.mapGridLineHorizontalTwo]} />
        {displayVendors.slice(0, 12).map((vendor, index) => {
          const hasCoordinates = hasVendorCoordinates(vendor);
          const x = hasCoordinates ? (((vendor.lng as number) - minLng) / lngSpan) * 78 + 11 : 18 + (index % 3) * 31;
          const y = hasCoordinates ? (1 - (((vendor.lat as number) - minLat) / latSpan)) * 70 + 15 : 22 + Math.floor(index / 3) * 18;

          return (
            <TouchableOpacity
              accessibilityLabel={vendor.business_name}
              accessibilityRole="button"
              key={vendor.id}
              onPress={() => onOpenVendor(vendor)}
              style={[styles.mapMarker, { left: `${x}%`, top: `${y}%` }]}
            >
              <Ionicons name="location" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.mapList}>
        {displayVendors.slice(0, 8).map((vendor) => {
          const location = vendorLocationLabel(vendor) || labels.availableByRequest;
          return (
            <View key={vendor.id} style={styles.mapVendorRow}>
              <TouchableOpacity
                accessibilityLabel={vendor.business_name}
                accessibilityRole="button"
                onPress={() => onOpenVendor(vendor)}
                style={styles.mapVendorMain}
              >
                <View style={styles.mapVendorPin}>
                  <Ionicons name="location-outline" size={16} color={colors.tealDark} />
                </View>
                <View style={styles.mapVendorCopy}>
                  <Text numberOfLines={1} style={styles.mapVendorName}>{vendor.business_name}</Text>
                  <Text numberOfLines={1} style={styles.mapVendorLocation}>{location}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityLabel={`${labels.openInMaps}: ${vendor.business_name}`}
                accessibilityRole="link"
                onPress={() => {
                  void Linking.openURL(externalMapUrl({
                    businessName: vendor.business_name,
                    lat: vendor.lat,
                    lng: vendor.lng,
                    location,
                  }));
                }}
                style={styles.mapExternalButton}
              >
                <Ionicons name="navigate-outline" size={18} color={colors.tealDark} />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}


export function VendorSearchScreen({
  initialCategory,
  savedVendorIds,
  language,
  onOpenVendor,
  onRequestQuote,
  onToggleSaved,
}: {
  initialCategory?: string;
  savedVendorIds: string[];
  language: "en" | "es";
  onOpenVendor: (vendor: VendorListItem) => void;
  onRequestQuote: (vendor: VendorListItem) => void;
  onToggleSaved: (vendor: VendorListItem) => void;
}) {
  const labels = copy[language];
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory ?? "");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [suggestions, setSuggestions] = useState<VendorListItem[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [message, setMessage] = useState("");
  const [loadMoreMessage, setLoadMoreMessage] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<SearchViewMode>("list");
  const searchRequestId = useRef(0);

  async function loadVendors(nextQuery = query, nextCategory = category, nextPage = 1, append = false) {
    const requestId = searchRequestId.current + 1;
    searchRequestId.current = requestId;
    if (append) setIsLoadingMore(true);
    else setIsLoading(true);
    if (append) setLoadMoreMessage("");
    else setMessage("");

    try {
      const response = await fetchVendors({
        q: nextQuery.trim() || undefined,
        category: nextCategory || undefined,
        page: nextPage,
        pageSize: 12,
      });
      if (requestId !== searchRequestId.current) return;
      setVendors((current) => append ? mergeUniqueById(current, response.items) : response.items);
      setTotal(response.total);
      setPage(response.page);
    } catch (error) {
      if (requestId !== searchRequestId.current) return;
      const nextMessage = error instanceof Error ? error.message : "Unable to load vendors.";
      if (append) setLoadMoreMessage(nextMessage);
      else setMessage(nextMessage);
    } finally {
      if (requestId === searchRequestId.current) {
        if (append) setIsLoadingMore(false);
        else setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    setCategory(initialCategory ?? "");
    void loadVendors("", initialCategory ?? "");
  }, [initialCategory]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setSuggestions([]);
      setIsSuggesting(false);
      return;
    }

    let isCurrent = true;
    setIsSuggesting(true);
    const timeout = setTimeout(() => {
      fetchVendors({
        q: term,
        category: category || undefined,
        page: 1,
        pageSize: 6,
      })
        .then((response) => {
          if (isCurrent) setSuggestions(response.items);
        })
        .catch(() => {
          if (isCurrent) setSuggestions([]);
        })
        .finally(() => {
          if (isCurrent) setIsSuggesting(false);
        });
    }, 220);

    return () => {
      isCurrent = false;
      clearTimeout(timeout);
    };
  }, [query, category]);

  const activeCategory = categories.find((item) => item.slug === category);
  const showSuggestions = query.trim().length >= 2;

  return (
    <View>
      <View style={styles.searchHeader}>
        <Text style={styles.kicker}>{labels.vendorSearch}</Text>
        <Text style={styles.title}>{labels.vendorSearchTitle}</Text>
        <Text style={styles.body}>{labels.vendorSearchBody}</Text>
      </View>

      <View style={styles.searchBar}>
        <View style={styles.searchInputWrap}>
          <Ionicons name="search-outline" size={18} color={colors.muted} />
          <TextInput
            autoCapitalize="none"
            onChangeText={setQuery}
            onSubmitEditing={() => void loadVendors(query)}
            placeholder={labels.searchVendors}
            placeholderTextColor="#8A969C"
            returnKeyType="search"
            style={styles.searchInput}
            value={query}
          />
        </View>
        <TouchableOpacity onPress={() => setIsFiltersOpen((current) => !current)} style={styles.searchButton}>
          <Ionicons name="options-outline" size={21} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {showSuggestions ? (
        <View style={styles.searchSuggestions}>
          {isSuggesting ? (
            <View style={styles.searchSuggestionState}>
              <ActivityIndicator color={colors.teal} size="small" />
              <Text style={styles.vendorMeta}>{labels.searching}</Text>
            </View>
          ) : suggestions.length ? (
            suggestions.map((vendor) => (
              <TouchableOpacity
                key={vendor.id}
                onPress={() => {
                  setQuery(vendor.business_name);
                  setSuggestions([]);
                  onOpenVendor(vendor);
                }}
                style={styles.searchSuggestionItem}
              >
                {vendor.logo_url ? (
                  <Image source={{ uri: vendor.logo_url }} style={styles.searchSuggestionLogo} />
                ) : (
                  <View style={styles.searchSuggestionLogoFallback}>
                    <Text style={styles.searchSuggestionInitial}>{vendor.business_name.slice(0, 1).toUpperCase()}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.searchSuggestionName}>{vendor.business_name}</Text>
                  <Text style={styles.searchSuggestionMeta}>
                    {(vendor.categories ?? []).slice(0, 2).map((item) => categoryLabel(item, language)).join(" / ") || labels.vendor}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.searchSuggestionEmpty}>{labels.noMatchingVendors}</Text>
          )}
        </View>
      ) : null}

      {activeCategory ? (
        <View style={styles.activeFilterRow}>
          <View style={styles.activeFilterChip}>
            <Text style={styles.activeFilterText}>{categoryLabel(activeCategory.slug, language)}</Text>
            <TouchableOpacity
              onPress={() => {
                setCategory("");
                void loadVendors(query, "");
              }}
              style={styles.activeFilterRemove}
            >
              <Ionicons name="close" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {isFiltersOpen ? (
        <View style={styles.filterPanel}>
          <View style={styles.filterHeader}>
            <Text style={styles.sectionTitle}>{labels.filters}</Text>
            <TouchableOpacity
              onPress={() => {
                setCategory("");
                setQuery("");
                setIsFiltersOpen(false);
                void loadVendors("", "");
              }}
            >
              <Text style={styles.textLink}>{labels.clear}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>{labels.category}</Text>
          <View style={styles.filterGrid}>
            {[{ label: labels.all, slug: "" }, ...categories].map((item) => (
              <TouchableOpacity
                key={item.slug || "all"}
                onPress={() => {
                  setCategory(item.slug);
                  setIsFiltersOpen(false);
                  void loadVendors(query, item.slug);
                }}
                style={[styles.filterChip, category === item.slug && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, category === item.slug && styles.filterChipTextActive]}>
                  {item.slug ? categoryLabel(item.slug, language) : labels.all}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.viewToggle}>
        <TouchableOpacity
          onPress={() => setViewMode("list")}
          style={[styles.viewToggleButton, viewMode === "list" && styles.viewToggleButtonActive]}
        >
          <Ionicons name="list-outline" size={16} color={viewMode === "list" ? colors.tealDark : colors.muted} />
          <Text style={viewMode === "list" ? styles.viewToggleTextActive : styles.viewToggleText}>{labels.list}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setViewMode("map")}
          style={[styles.viewToggleButton, viewMode === "map" && styles.viewToggleButtonActive]}
        >
          <Ionicons name="map-outline" size={16} color={viewMode === "map" ? colors.tealDark : colors.muted} />
          <Text style={viewMode === "map" ? styles.viewToggleTextActive : styles.viewToggleText}>{labels.map}</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.searchState}>
          <ActivityIndicator color="#A17619" />
          <Text style={styles.loadingText}>{labels.loadingVendors}</Text>
        </View>
      ) : message ? (
        <View style={styles.panel}>
          <Text style={styles.errorText}>{message}</Text>
          <TouchableOpacity onPress={() => void loadVendors(query)} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>{labels.tryAgain}</Text>
          </TouchableOpacity>
        </View>
      ) : vendors.length === 0 ? (
        <View style={styles.panel}>
          <Text style={styles.title}>{labels.noVendorsFound}</Text>
          <Text style={styles.body}>{labels.noVendorsHint}</Text>
        </View>
      ) : (
        <View style={styles.vendorList}>
          <Text style={styles.resultCount}>{total} {labels.vendorsFound}</Text>
          {viewMode === "map" ? (
            <SearchMapResults vendors={vendors} language={language} onOpenVendor={onOpenVendor} />
          ) : (
            vendors.map((vendor) => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                isSaved={savedVendorIds.includes(vendor.id)}
                language={language}
                onPress={onOpenVendor}
                onRequestQuote={onRequestQuote}
                onToggleSaved={onToggleSaved}
              />
            ))
          )}
          {loadMoreMessage ? <Text style={styles.errorText}>{loadMoreMessage}</Text> : null}
          {vendors.length < total ? (
            <TouchableOpacity
              accessibilityRole="button"
              disabled={isLoadingMore}
              onPress={() => void loadVendors(query, category, page + 1, true)}
              style={[styles.secondaryButton, isLoadingMore && styles.primaryButtonDisabled]}
            >
              {isLoadingMore ? <ActivityIndicator color={colors.tealDark} size="small" /> : null}
              <Text style={styles.secondaryButtonText}>{isLoadingMore ? labels.loadingMore : labels.loadMore}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
}
