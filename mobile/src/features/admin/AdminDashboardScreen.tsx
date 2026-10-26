import { type IconName } from "../../application/types";
import { copy } from "../../i18n/copy";
import { supabase } from "../../lib/supabase";
import { styles } from "../../theme/styles";
import { colors } from "../../theme/tokens";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

export function DashboardStat({ icon, label, value }: { icon: IconName; label: string; value: string | number }) {
  return (
    <View style={styles.dashboardStat}>
      <Ionicons name={icon} size={20} color={colors.ink} />
      <Text style={styles.dashboardStatValue}>{value}</Text>
      <Text style={styles.dashboardStatLabel}>{label}</Text>
    </View>
  );
}


export function AdminDashboardScreen({ language }: { language: "en" | "es" }) {
  const labels = copy[language];
  const [stats, setStats] = useState({
    vendors: 0,
    publishedVendors: 0,
    rfqs: 0,
    quotes: 0,
    users: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      if (!supabase) return;
      setIsLoading(true);
      setMessage("");

      try {
        const [vendors, publishedVendors, rfqs, quotes, users] = await Promise.all([
          supabase.from("vendors").select("id", { count: "exact", head: true }),
          supabase.from("vendors").select("id", { count: "exact", head: true }).eq("is_published", true),
          supabase.from("rfqs").select("id", { count: "exact", head: true }),
          supabase.from("quotes").select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
        ]);

        const error = vendors.error ?? publishedVendors.error ?? rfqs.error ?? quotes.error ?? users.error;
        if (error) throw error;

        if (isMounted) {
          setStats({
            vendors: vendors.count ?? 0,
            publishedVendors: publishedVendors.count ?? 0,
            rfqs: rfqs.count ?? 0,
            quotes: quotes.count ?? 0,
            users: users.count ?? 0,
          });
        }
      } catch (error) {
        if (isMounted) setMessage(error instanceof Error ? error.message : "Unable to load admin data.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.searchState}>
        <ActivityIndicator color={colors.ink} />
        <Text style={styles.loadingText}>{labels.admin}</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.dashboardHero}>
        <Text style={styles.kicker}>{labels.admin}</Text>
        <Text style={styles.title}>{labels.overview}</Text>
        {message ? <Text style={styles.errorText}>{message}</Text> : null}
      </View>
      <View style={styles.dashboardGrid}>
        <DashboardStat icon="storefront-outline" label={labels.totalVendors} value={stats.vendors} />
        <DashboardStat icon="checkmark-circle-outline" label={labels.published} value={stats.publishedVendors} />
        <DashboardStat icon="document-text-outline" label={labels.requests} value={stats.rfqs} />
        <DashboardStat icon="cash-outline" label={labels.quotes} value={stats.quotes} />
        <DashboardStat icon="people-outline" label={labels.users} value={stats.users} />
      </View>
    </View>
  );
}
