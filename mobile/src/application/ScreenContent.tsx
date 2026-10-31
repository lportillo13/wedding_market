import { categories, categoryLabel, heroImageUrl } from "../content/catalog";
import { useEffect, useState } from 'react';
import { BoutiqueHub, type BoutiqueMode } from '../features/boutiques/BoutiqueHub';
import { BoutiqueButton } from '../features/boutiques/ui';
import { boutiqueCopy } from '../../../shared/boutiques/copy';
import { AccountProfileScreen } from "../features/account/AccountProfileScreen";
import { FontLicenseNotice } from "../features/account/FontLicenseNotice";
import { AdminDashboardScreen } from "../features/admin/AdminDashboardScreen";
import { VendorLogoCarousel } from "../features/home/VendorLogoCarousel";
import { InboxScreen } from "../features/inbox/InboxScreen";
import { NotificationSettings } from "../features/notifications/NotificationSettings";
import type { useMessageNotifications } from "../features/notifications/native";
import type { NotificationThreadTarget } from "../../../shared/notifications/push";
import { FavoritesScreen } from "../features/shortlist/FavoritesScreen";
import { VendorPublicProfileScreen } from "../features/vendors/screens/VendorPublicProfileScreen";
import { VendorSearchScreen } from "../features/vendors/screens/VendorSearchScreen";
import { VendorWorkspaceScreen } from "../features/vendors/screens/VendorWorkspaceScreen";
import { copy } from "../i18n/copy";
import { type VendorListItem } from "../lib/api";
import { type AppRole, type AuthProfile } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { styles } from "../theme/styles";
import { colors } from "../theme/tokens";
import { ProtectedScreen } from "../ui/ProtectedScreen";
import {openPublicWebPath} from '../ui/links';
import { type TabKey } from "./types";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image, Linking, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";

export function ScreenContent({
  tab,
  role,
  language,
  initialSearchCategory,
  savedVendorIds,
  onSignedIn,
  userEmail,
  onProfileUpdated,
  onLanguageUpdated,
  onNavigate,
  onSelectSearchCategory,
  onOpenVendor,
  onRequestQuote,
  onRequestQuoteBatch,
  onToggleSaved,
  notifications, notificationTarget, onNotificationConsumed, inboxRevision,
}: {
  notifications: ReturnType<typeof useMessageNotifications>;
  notificationTarget: NotificationThreadTarget|null;
  onNotificationConsumed: (id:string)=>void;
  inboxRevision:number;
  tab: TabKey;
  role: AppRole;
  language: "en" | "es";
  initialSearchCategory?: string;
  savedVendorIds: string[];
  onSignedIn: (nextState: { userEmail: string; profile: AuthProfile | null }) => void;
  userEmail: string | null;
  onProfileUpdated: (profile: AuthProfile | null) => void;
  onLanguageUpdated: (language: "en" | "es") => void;
  onNavigate: (tab: TabKey) => void;
  onSelectSearchCategory: (category: string) => void;
  onOpenVendor: (vendor: VendorListItem) => void;
  onRequestQuote: (vendor: VendorListItem) => void;
  onRequestQuoteBatch: (vendors: VendorListItem[]) => void;
  onToggleSaved: (vendor: VendorListItem) => void;
}) {
  const connectedToSupabase = Boolean(supabase);
  const labels = copy[language];
  const { width } = useWindowDimensions();
  const heroDisplaySize = Math.min(54, width * 0.13);
  const heroScriptSize = Math.min(58, width * 0.15);
  const [boutiqueMode,setBoutiqueMode]=useState<BoutiqueMode|null>(null);
  useEffect(()=>{setBoutiqueMode(null);},[tab]);
  const boutiqueLabels=boutiqueCopy[language];
  if(boutiqueMode)return <BoutiqueHub language={language} role={role} mode={boutiqueMode} onBack={()=>setBoutiqueMode(null)} onSignIn={()=>{setBoutiqueMode(null);onNavigate('profile');}}/>;

  if (tab === "home") {
    return (
      <View>
        <View style={styles.heroCard}>
          <Image source={{ uri: heroImageUrl }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay} />
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>{labels.heroBadgeHome}</Text>
            <Text style={[styles.heroTitle, { fontSize: heroDisplaySize, lineHeight: Math.ceil(heroDisplaySize * 1.1) }]}>{labels.heroTitleHome}</Text>
            <Text style={[styles.heroScript, { fontSize: heroScriptSize, lineHeight: Math.ceil(heroScriptSize * 1.24) }]}>{labels.heroAccentHome}</Text>
            <Text style={styles.heroText}>{labels.heroTextHome}</Text>
            <View style={styles.heroButtons}>
              <TouchableOpacity onPress={() => onNavigate("search")} style={styles.heroPrimaryButton}>
                <Ionicons name="search-outline" size={18} color={colors.tealDark} />
                <Text style={styles.heroPrimaryButtonText}>{labels.exploreVendors}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onNavigate("favorites")} style={styles.heroSecondaryButton}>
                <Ionicons name="heart-outline" size={18} color="#FFFFFF" />
                <Text style={styles.heroSecondaryButtonText}>{labels.shortlist}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity accessibilityRole="link" onPress={()=>void Linking.openURL('https://www.youtube.com/watch?v=JgzkqjnsIvM')}><Text style={[styles.heroText,{textDecorationLine:'underline'}]}>{language==='es'?'Ver la película':'Watch the film'} ↗</Text></TouchableOpacity>
          </View>
        </View>

        <View style={styles.homeBody}>
          <View style={styles.sectionBlock}><BoutiqueButton title={boutiqueLabels.title+' →'} onPress={()=>setBoutiqueMode('directory')}/></View>
          <View style={styles.statStrip}>
            {[
              ["01", labels.discover],
              ["02", labels.compare],
              ["03", labels.request],
            ].map(([value, label]) => (
              <View key={value} style={styles.statItem}>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            ))}
          </View>

          <VendorLogoCarousel language={language} />

          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.kicker}>{labels.curatedCategories}</Text>
                <Text style={styles.sectionTitle}>{labels.popularServices}</Text>
              </View>
              <TouchableOpacity onPress={() => onNavigate("search")} style={styles.textLinkButton}>
                <Text style={styles.textLink}>{labels.viewAll}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.categoryGrid}>
              {categories.map((item) => (
                <TouchableOpacity
                  key={item.slug}
                  onPress={() => onSelectSearchCategory(item.slug)}
                  style={styles.categoryTile}
                >
                  <Image source={{ uri: item.image }} style={styles.categoryTileImage} />
                  <View style={styles.categoryTileOverlay} />
                  <View style={styles.categoryIcon}>
                    <Ionicons name="chevron-forward" size={15} color={colors.ink} />
                  </View>
                  <Text style={styles.categoryTileLabel}>{categoryLabel(item.slug, language)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.kicker}>{labels.workflowKicker}</Text>
            <Text style={styles.sectionTitle}>{labels.workflowTitle}</Text>
            <Text style={styles.body}>{labels.workflowBody}</Text>
            <View style={styles.workflowList}>
              {[
                { label: labels.shortlist, title: labels.workflowShortlistTitle, description: labels.workflowShortlistBody },
                { label: labels.request, title: labels.workflowRequestTitle, description: labels.workflowRequestBody },
                { label: labels.workflowTrack, title: labels.workflowTrackTitle, description: labels.workflowTrackBody },
              ].map((step, index) => (
                <View key={step.label} style={styles.workflowItem}>
                  <View style={styles.workflowNumber}>
                    <Ionicons
                      name={index === 0 ? "heart-outline" : index === 1 ? "send-outline" : "chatbubbles-outline"}
                      size={18}
                      color={colors.tealDark}
                    />
                  </View>
                  <View style={styles.workflowCopy}>
                    <Text style={styles.workflowLabel}>{step.label}</Text>
                    <Text style={styles.workflowTitle}>{step.title}</Text>
                    <Text style={styles.workflowDescription}>{step.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.ctaBand}>
            <Text style={styles.ctaTitle}>{labels.ctaTitle}</Text>
            <Text style={styles.ctaText}>{labels.ctaBody}</Text>
            <TouchableOpacity onPress={() => onNavigate("search")} style={[styles.primaryButton, styles.ctaButton]}>
              <Ionicons name="search-outline" size={18} color={colors.ink} />
              <Text style={[styles.primaryButtonText, styles.ctaButtonText]}>{labels.browseVendors}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>{language==='es'?'Más de Wedding Market':'More from Wedding Market'}</Text>
            {[
              ['/for-vendors',language==='es'?'Para profesionales de bodas':'For wedding professionals'],
              ['/blog',language==='es'?'La revista':'The magazine'],
              ['/about',language==='es'?'Sobre Wedding Market':'About Wedding Market'],
              ['/support',language==='es'?'Ayuda y soporte':'Help and support'],
            ].map(([path,title])=><TouchableOpacity key={path} style={styles.secondaryButton} accessibilityRole="link" onPress={()=>void openPublicWebPath(path+'?lang='+language)}><Text style={styles.secondaryButtonText}>{title} ↗</Text></TouchableOpacity>)}
          </View>
        </View>
      </View>
    );
  }

  if (tab === "search") {
    return (
      <View><BoutiqueButton title={boutiqueLabels.title+' →'} secondary onPress={()=>setBoutiqueMode('directory')}/>
      <VendorSearchScreen
        initialCategory={initialSearchCategory}
        savedVendorIds={savedVendorIds}
        language={language}
        onOpenVendor={onOpenVendor}
        onRequestQuote={onRequestQuote}
        onToggleSaved={onToggleSaved}
      /></View>
    );
  }

  if (tab === "vendor") {
    if (role === "guest") {
      return <ProtectedScreen title={labels.signInVendorPage} language={language} onSignedIn={onSignedIn} />;
    }

    if (role === "vendor" || role === "admin") {
      return (
        <View><VendorWorkspaceScreen language={language}/>
        <View style={{gap:12,marginVertical:18}}><BoutiqueButton title={boutiqueLabels.management} secondary onPress={()=>setBoutiqueMode('manage')}/><BoutiqueButton title={boutiqueLabels.appointments} secondary onPress={()=>setBoutiqueMode('appointments')}/></View>
        <VendorPublicProfileScreen
          savedVendorIds={savedVendorIds}
          language={language}
          onRequestQuote={onRequestQuote}
          onToggleSaved={onToggleSaved}
        /></View>
      );
    }

    return <ProtectedScreen title={labels.vendorAccessRequired} language={language} onSignedIn={onSignedIn} />;
  }

  if (tab === "admin") {
    if (role !== "admin") {
      return <ProtectedScreen title={labels.adminAccessRequired} language={language} onSignedIn={onSignedIn} />;
    }

    return <AdminDashboardScreen language={language} />;
  }

  if (role === "guest" && (tab === "inbox" || tab === "profile")) {
    const title =
      tab === "inbox"
          ? labels.signInInbox
          : labels.signInProfile;

    return <ProtectedScreen title={title} language={language} onSignedIn={onSignedIn} />;
  }

  if (tab === "profile") {
    return (
      <View>
      <NotificationSettings notifications={notifications} />
      <AccountProfileScreen
        canPlan={role==='client'}
        userEmail={userEmail}
        language={language}
        onProfileUpdated={onProfileUpdated}
        onLanguageUpdated={onLanguageUpdated}
      />
      <FontLicenseNotice language={language} />
      </View>
    );
  }

  if (tab === "favorites") {
    return (
      <View><BoutiqueButton title={boutiqueLabels.favorites+' →'} secondary onPress={()=>setBoutiqueMode('favorites')}/>
      <FavoritesScreen
        savedVendorIds={savedVendorIds}
        language={language}
        onOpenVendor={onOpenVendor}
        onRequestQuote={onRequestQuote}
        onRequestQuoteBatch={onRequestQuoteBatch}
        onToggleSaved={onToggleSaved}
      /></View>
    );
  }

  if (tab === "inbox") {
    return <View><BoutiqueButton title={boutiqueLabels.appointments+' →'} secondary onPress={()=>setBoutiqueMode('appointments')}/><InboxScreen role={role} language={language} openRequest={notificationTarget} onOpenConsumed={onNotificationConsumed} revision={inboxRevision} /></View>;
  }

  const fallbackTab = tab as string;

  return (
    <View style={styles.panel}>
      <Text style={styles.kicker}>{fallbackTab[0].toUpperCase() + fallbackTab.slice(1)}</Text>
      <Text style={styles.title}>{labels.readyExperience}</Text>
      <Text style={styles.body}>
        {labels.supabaseLoaded}: {connectedToSupabase ? labels.yes : labels.missingEnv}.
      </Text>
    </View>
  );
}
