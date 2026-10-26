import { copy } from "../../../i18n/copy";
import { type VendorListItem } from "../../../lib/api";
import { supabase } from "../../../lib/supabase";
import { styles } from "../../../theme/styles";
import { colors } from "../../../theme/tokens";
import { VendorDetailScreen } from "./VendorDetailScreen";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

export function VendorPublicProfileScreen({
  savedVendorIds,
  language,
  onRequestQuote,
  onToggleSaved,
}: {
  savedVendorIds: string[];
  language: "en" | "es";
  onRequestQuote: (vendor: VendorListItem) => void;
  onToggleSaved: (vendor: VendorListItem) => void;
}) {
  const labels = copy[language];
  const [vendor, setVendor] = useState<VendorListItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadOwnVendor() {
      if (!supabase) return;
      setIsLoading(true);
      setMessage("");
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Sign in required.");

        const { data, error } = await supabase
          .from("vendors")
          .select("id, slug, business_name, bio, logo_url, thumbnail_image")
          .eq("owner_id", user.id)
          .maybeSingle<Record<string, unknown>>();
        if (error) throw error;
        if (!data?.slug) throw new Error("Vendor profile not found.");

        if (isMounted) {
          const bio = data.bio && typeof data.bio === "object" ? data.bio as Record<string, unknown> : {};
          setVendor({
            id: String(data.id),
            slug: String(data.slug),
            business_name: String(data.business_name ?? "Vendor"),
            bio_en: String(bio.en ?? ""),
            bio_es: typeof bio.es === "string" ? bio.es : null,
            logo_url: typeof data.logo_url === "string" ? data.logo_url : null,
            thumbnail_image: data.thumbnail_image as VendorListItem["thumbnail_image"],
          });
        }
      } catch (error) {
        if (isMounted) setMessage(error instanceof Error ? error.message : "Unable to load vendor profile.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadOwnVendor();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.searchState}>
        <ActivityIndicator color={colors.ink} />
        <Text style={styles.loadingText}>{labels.loadingPublicVendorPage}</Text>
      </View>
    );
  }

  if (!vendor) {
    return (
      <View style={styles.panel}>
        <Text style={styles.kicker}>{labels.vendorPage}</Text>
        <Text style={styles.title}>{labels.publicVendorUnavailable}</Text>
        {message ? <Text style={styles.errorText}>{message}</Text> : null}
      </View>
    );
  }

  return (
    <VendorDetailScreen
      slug={vendor.slug}
      initialVendor={vendor}
      isSaved={savedVendorIds.includes(vendor.id)}
      language={language}
      onBack={() => undefined}
      onRequestQuote={onRequestQuote}
      onScrollToSection={() => undefined}
      onToggleSaved={onToggleSaved}
      disableSectionScroll
      showBack={false}
    />
  );
}
