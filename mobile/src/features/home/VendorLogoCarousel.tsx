import { copy } from "../../i18n/copy";
import { fetchVendors, type VendorListItem } from "../../lib/api";
import { styles } from "../../theme/styles";
import { useEffect, useRef, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";

export function VendorLogoCarousel({ language }: { language: "en" | "es" }) {
  const labels = copy[language];
  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const carouselRef = useRef<ScrollView | null>(null);
  const scrollXRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    fetchVendors({ page: 1, pageSize: 14 })
      .then((response) => {
        if (isMounted) setVendors(response.items);
      })
      .catch(() => {
        if (isMounted) setVendors([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const logoItems = vendors.filter((vendor) => vendor.logo_url).length ? vendors.filter((vendor) => vendor.logo_url) : vendors;
  const loopItems = [...logoItems, ...logoItems, ...logoItems];

  useEffect(() => {
    if (!logoItems.length) return;
    const itemWidth = 86;
    const maxScroll = logoItems.length * itemWidth;
    const interval = setInterval(() => {
      scrollXRef.current += 1.2;
      if (scrollXRef.current >= maxScroll) {
        scrollXRef.current = 0;
        carouselRef.current?.scrollTo({ x: 0, animated: false });
        return;
      }
      carouselRef.current?.scrollTo({ x: scrollXRef.current, animated: false });
    }, 32);
    return () => clearInterval(interval);
  }, [logoItems.length]);

  if (!vendors.length) {
    return null;
  }

  return (
    <View style={styles.logoCarouselBlock}>
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.kicker}>{labels.trustedVendors}</Text>
          <Text style={styles.sectionTitle}>{labels.exploreMarketplace}</Text>
        </View>
      </View>
      <ScrollView ref={carouselRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.logoCarousel}>
        {loopItems.map((vendor, index) => (
          <View key={`${vendor.id}-${index}`} style={styles.logoCarouselItem}>
            {vendor.logo_url ? (
              <Image source={{ uri: vendor.logo_url }} style={styles.logoCarouselImage} />
            ) : (
              <View style={styles.logoCarouselFallback}>
                <Text style={styles.logoCarouselInitials}>{vendor.business_name.slice(0, 2).toUpperCase()}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
