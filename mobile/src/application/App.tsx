import { BrandWordmark } from "../ui/BrandWordmark";
import { editorialFonts } from "../theme/fonts";
import { CommunityConsent } from "../features/account/CommunityConsent";
import { COMMUNITY_TERMS_VERSION } from "../../../shared/safety/copy";
import { confirmAccountDeletion } from "../features/account/deletion";
import { PasswordRecoveryModal } from "../features/auth/AuthScreen";
import { RequestQuoteModal } from "../features/inquiries/RequestQuoteModal";
import { VendorDetailScreen } from "../features/vendors/screens/VendorDetailScreen";
import { copy } from "../i18n/copy";
import { type VendorListItem } from "../lib/api";
import { createSessionFromMobileAuthUrl, restoreMobileAuthState, signOut, type AuthProfile, type AuthState } from "../lib/auth";
import { getMobileConfigErrors } from "../lib/config";
import { getDeviceLanguage, loadLanguagePreference, saveLanguagePreference, type AppLanguage } from "../lib/languagePreference";
import { useMessageNotifications } from "../features/notifications/native";
import type { NotificationThreadTarget } from "../../../shared/notifications/push";
import { getShortlist, toggleShortlist } from "../lib/shortlist";
import { supabase } from "../lib/supabase";
import { styles } from "../theme/styles";
import { colors } from "../theme/tokens";
import { roleTabs, tabIcons, tabLabel } from "./navigation";
import { ScreenContent } from "./ScreenContent";
import { type IconName, type TabKey } from "./types";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFonts } from "expo-font";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, AppState, BackHandler, Image, Linking, Platform, Pressable, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  const [fontsLoaded] = useFonts(editorialFonts);
  const [isBooting, setIsBooting] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [language, setLanguage] = useState<AppLanguage>(getDeviceLanguage);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const role = profile?.role ?? "guest";
  const tabs = useMemo(() => roleTabs(role), [role]);
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [selectedVendor, setSelectedVendor] = useState<VendorListItem | null>(null);
  const [quoteVendors, setQuoteVendors] = useState<VendorListItem[]>([]);
  const [savedVendorIds, setSavedVendorIds] = useState<string[]>([]);
  const [searchCategory, setSearchCategory] = useState("");
  const contentScrollRef = useRef<ScrollView | null>(null);
  const isDetailOpen = Boolean(selectedVendor);
  const [notificationTarget,setNotificationTarget] = useState<NotificationThreadTarget|null>(null);
  const [inboxRevision,setInboxRevision] = useState(0);
  const receiveNotification = useCallback(()=>setInboxRevision(value=>value+1),[]);
  const openNotification = useCallback((target:NotificationThreadTarget)=>setNotificationTarget(target),[]);
  const notifications = useMessageNotifications({eligible:Boolean(userEmail)&&!isPasswordRecovery&&(role==='client'||role==='vendor'),language,role,onOpen:openNotification,onActivity:receiveNotification});
  useEffect(()=>{
    if(!notificationTarget||quoteVendors.length||isPasswordRecovery)return;
    setSelectedVendor(null);setIsAccountMenuOpen(false);setActiveTab('inbox');
  },[notificationTarget,quoteVendors.length,isPasswordRecovery]);
  useEffect(()=>{setNotificationTarget(null);},[userEmail]);

  const visibleActiveTab = tabs.some((tab) => tab.key === activeTab) ? activeTab : tabs[0].key;
  const isHomeOpen = !isDetailOpen && visibleActiveTab === "home";
  const isVendorPublicOpen = !isDetailOpen && visibleActiveTab === "vendor";
  const configErrors = getMobileConfigErrors();
  const applyAuthenticatedState = useCallback(async (state: AuthState) => {
    const nextLanguage = state.profile?.language ?? await loadLanguagePreference();
    setUserEmail(state.user?.email ?? null);
    setProfile(state.profile);
    setLanguage(nextLanguage);
    await saveLanguagePreference(nextLanguage);
    setActiveTab(roleTabs(state.profile?.role ?? (state.user ? "client" : "guest"))[0].key);
    setIsAccountMenuOpen(false);
    return nextLanguage;
  }, []);

  useEffect(() => {
    if (!supabase || Platform.OS === 'web') return;
    const auth=supabase.auth;
    const updateRefresh=(state:string)=>{
      void (state==='active'?auth.startAutoRefresh():auth.stopAutoRefresh());
    };
    updateRefresh(AppState.currentState);
    const listener=AppState.addEventListener('change',updateRefresh);
    return ()=>{listener.remove();void auth.stopAutoRefresh();};
  }, []);

  useEffect(() => {
    let isMounted = true;

    const handleAuthUrl = async (url: string, showConfirmation: boolean) => {
      const isRecoveryUrl = /[?#&]type=recovery(?:&|$)/.test(url);
      try {
        const result = await createSessionFromMobileAuthUrl(url);
        if (!result || !isMounted) return false;

        if (result.event === "password_recovery") {
          const nextLanguage = result.state.profile?.language ?? await loadLanguagePreference();
          setUserEmail(null);
          setProfile(null);
          setLanguage(nextLanguage);
          setActiveTab("home");
          setSelectedVendor(null);
          setIsAccountMenuOpen(false);
          setIsPasswordRecovery(true);
          return true;
        }

        const nextLanguage = await applyAuthenticatedState(result.state);
        if (showConfirmation) {
          const labels = copy[nextLanguage];
          Alert.alert(labels.emailConfirmedTitle, labels.emailConfirmedBody);
        }
        return true;
      } catch (error) {
        if (isMounted) {
          const labels = copy.en;
          const message = error instanceof Error
            ? error.message
            : isRecoveryUrl
              ? labels.passwordResetFailed
              : labels.emailConfirmationFailed;
          Alert.alert(
            isRecoveryUrl ? labels.passwordResetErrorTitle : labels.emailConfirmationErrorTitle,
            message,
          );
        }
        return true;
      }
    };

    void (async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        const handled = initialUrl ? await handleAuthUrl(initialUrl, true) : false;
        if (!handled) {
          const state = await restoreMobileAuthState();
          if (isMounted) await applyAuthenticatedState(state);
        }
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Unable to restore the mobile auth session", error);
        }
      } finally {
        if (isMounted) setIsBooting(false);
      }
    })();

    const linkingSubscription = Linking.addEventListener("url", ({ url }) => {
      void handleAuthUrl(url, true);
    });

    const { data: subscription } =
      supabase?.auth.onAuthStateChange((_event, session) => {
        if (!session?.user) {
          setIsPasswordRecovery(false);
          setUserEmail(null);
          setProfile(null);
          setActiveTab("home");
          setSelectedVendor(null);
        }
      }) ?? { data: { subscription: null } };

    void getShortlist().then((ids) => {
      if (isMounted) setSavedVendorIds(ids);
    });

    return () => {
      isMounted = false;
      linkingSubscription.remove();
      subscription.subscription?.unsubscribe();
    };
  }, [applyAuthenticatedState]);

  useEffect(() => {
    if (selectedVendor) {
      requestAnimationFrame(() => {
        contentScrollRef.current?.scrollTo({ y: 0, animated: false });
      });
    }
  }, [selectedVendor?.id]);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isAccountMenuOpen) {
        setIsAccountMenuOpen(false);
        return true;
      }
      if (quoteVendors.length) {
        setQuoteVendors([]);
        return true;
      }
      if (selectedVendor) {
        setSelectedVendor(null);
        return true;
      }
      if (visibleActiveTab !== tabs[0].key) {
        setActiveTab(tabs[0].key);
        return true;
      }
      return false;
    });

    return () => subscription.remove();
  }, [isAccountMenuOpen, quoteVendors.length, selectedVendor, tabs, visibleActiveTab]);

  if (isBooting || !fontsLoaded) {
    return (
      <SafeAreaView style={styles.centeredRoot}>
        <ActivityIndicator color="#A17619" />
        <Text style={styles.loadingText}>{copy[language].loadingApp}</Text>
      </SafeAreaView>
    );
  }

  if (configErrors.length) {
    return (
      <SafeAreaView style={styles.centeredRoot}>
        <Ionicons name="warning-outline" size={32} color="#B42318" />
        <Text style={styles.title}>App configuration required</Text>
        {configErrors.map((error) => <Text key={error} style={styles.errorText}>{error}</Text>)}
      </SafeAreaView>
    );
  }

  const handleSignedIn = (nextState: { userEmail: string; profile: AuthProfile | null }) => {
    const nextLanguage = nextState.profile?.language ?? language;
    setUserEmail(nextState.userEmail);
    setProfile(nextState.profile);
    setLanguage(nextLanguage);
    void saveLanguagePreference(nextLanguage);
    setActiveTab(roleTabs(nextState.profile?.role ?? "client")[0].key);
    setIsAccountMenuOpen(false);
  };

  const handleSignOut = async () => {
    await notifications.disconnect().catch(()=>{});
    try { await signOut(); }
    catch { Alert.alert(language==='es'?'No se pudo cerrar la sesión':'Unable to sign out',language==='es'?'Revisa tu conexión e inténtalo de nuevo.':'Check your connection and try again.');return; }
    setNotificationTarget(null);
    setUserEmail(null);
    setProfile(null);
    setActiveTab("home");
    setSelectedVendor(null);
    setIsAccountMenuOpen(false);
  };

  const handleLanguageChange = async (nextLanguage: "en" | "es") => {
    if (nextLanguage === language) return;

    setLanguage(nextLanguage);
    setProfile((current) => current ? { ...current, language: nextLanguage } : current);
    await saveLanguagePreference(nextLanguage);

    if (!supabase || !userEmail) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("profiles").update({ language: nextLanguage }).eq("id", user.id);
    }
  };

  const handleToggleSaved = async (vendor: VendorListItem) => {
    const nextIds = await toggleShortlist(vendor.id);
    setSavedVendorIds(nextIds);
  };

  const openQuoteRequestBatch = (vendors: VendorListItem[]) => {
    setIsAccountMenuOpen(false);
    if (!vendors.length) return;
    if (!userEmail) {
      setSelectedVendor(null);
      setActiveTab("profile");
      return;
    }
    setQuoteVendors(vendors);
  };

  const openQuoteRequest = (vendor: VendorListItem) => {
    openQuoteRequestBatch([vendor]);
  };

  const accountImageUrl = profile?.vendorLogoUrl ?? profile?.avatarUrl ?? null;
  const avatarInitial = (profile?.fullName ?? userEmail ?? "U").trim().slice(0, 1).toUpperCase();

  return (
    <SafeAreaView style={styles.root}>
      <View style={{flex:1}}>
      <StatusBar barStyle="dark-content" />
      <ExpoStatusBar style="dark" />
      {!isDetailOpen ? <View style={[styles.header, isHomeOpen && styles.headerOverlay]}>
        <View style={styles.headerBrandRow}>
          <BrandWordmark light={isHomeOpen} />
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            testID="account-menu-toggle"
            accessibilityLabel={userEmail ? copy[language].profile : copy[language].logIn}
            accessibilityRole="button"
            accessibilityState={{ expanded: isAccountMenuOpen }}
            onPress={() => setIsAccountMenuOpen((current) => !current)}
            style={[styles.accountButton, isHomeOpen && styles.accountButtonOverlay]}
          >
            {accountImageUrl ? (
              <Image source={{ uri: accountImageUrl }} style={styles.accountAvatarImage} />
            ) : userEmail ? (
              <Text style={styles.accountAvatarText}>{avatarInitial}</Text>
            ) : (
              <Ionicons name="person-outline" size={20} color={colors.ink} />
            )}
          </TouchableOpacity>
        </View>
      </View> : null}

          {isAccountMenuOpen ? (
            <View style={styles.accountMenuOverlay}>
              <Pressable style={styles.accountMenuDismiss} accessibilityRole="button" accessibilityLabel={language === "es" ? "Cerrar menú" : "Close account menu"} onPress={() => setIsAccountMenuOpen(false)} />
            <View style={styles.accountMenu} accessibilityViewIsModal>
              <View style={styles.accountMenuHeader}>
                <Text style={styles.accountMenuTitle}>{userEmail ? profile?.fullName ?? userEmail : copy[language].guest}</Text>
                <Text style={styles.accountMenuSubtitle}>{userEmail ? role : copy[language].browseAsGuest}</Text>
              </View>
              <View style={styles.accountMenuLanguageSection}>
                <View style={styles.accountMenuLanguageHeader}>
                  <Ionicons name="language-outline" size={18} color={colors.tealDark} />
                  <Text style={styles.accountMenuLanguageLabel}>{copy[language].language}</Text>
                </View>
                <View style={styles.accountMenuLanguageOptions} accessibilityRole="radiogroup">
                  {([
                    { key: "en" as const, label: "English" },
                    { key: "es" as const, label: "Español" },
                  ]).map((option) => {
                    const isActive = language === option.key;
                    return (
                      <TouchableOpacity
                        accessibilityLabel={option.label}
                        testID={`account-language-${option.key}`}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: isActive }}
                        key={option.key}
                        onPress={() => void handleLanguageChange(option.key)}
                        style={[
                          styles.accountMenuLanguageOption,
                          isActive && styles.accountMenuLanguageOptionActive,
                        ]}
                      >
                        <Text style={[
                          styles.accountMenuLanguageOptionText,
                          isActive && styles.accountMenuLanguageOptionTextActive,
                        ]}>
                          {option.label}
                        </Text>
                        {isActive ? <Ionicons name="checkmark" size={15} color={colors.paper} /> : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={userEmail ? copy[language].profile : copy[language].logIn}
                testID="account-profile-link"
                onPress={() => {
                  setSelectedVendor(null);
                  setActiveTab("profile");
                  setIsAccountMenuOpen(false);
                }}
                style={styles.accountMenuItem}
              >
                <Ionicons name={userEmail ? "person-circle-outline" : "log-in-outline"} size={18} color={colors.tealDark} />
                <Text style={styles.accountMenuText}>{userEmail ? copy[language].profile : copy[language].logIn}</Text>
              </TouchableOpacity>
              {userEmail ? (
                <>
                  <TouchableOpacity onPress={()=>{setSelectedVendor(null);setActiveTab('profile');setIsAccountMenuOpen(false);contentScrollRef.current?.scrollTo({y:0,animated:true});}} style={styles.accountMenuItem}>
                    <Ionicons name="notifications-outline" size={18} color={colors.ink} />
                    <Text style={styles.accountMenuText}>{language==='es'?'Notificaciones':'Notifications'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setIsAccountMenuOpen(false);
                      confirmAccountDeletion(language);
                    }}
                    style={styles.accountMenuItem}
                  >
                    <Ionicons name="trash-outline" size={18} color="#B42318" />
                    <Text style={[styles.accountMenuText, styles.accountMenuDanger]}>{copy[language].deleteAccount}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSignOut} style={styles.accountMenuItem}>
                    <Ionicons name="log-out-outline" size={18} color="#B42318" />
                    <Text style={[styles.accountMenuText, styles.accountMenuDanger]}>{copy[language].logOut}</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
            </View>
          ) : null}

      <ScrollView
        ref={contentScrollRef}
        contentContainerStyle={isDetailOpen || isVendorPublicOpen ? styles.detailContent : isHomeOpen ? styles.homeContent : styles.content}
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        keyboardShouldPersistTaps="handled"
      >
        {userEmail && profile && profile.communityTermsVersion !== COMMUNITY_TERMS_VERSION ? <CommunityConsent language={language} onAccepted={async()=>{
          const state=await restoreMobileAuthState();
          if(!state.user||!state.profile)throw Error('Unable to finish account setup.');
          const refreshed=state.profile;
          setProfile(current=>current?.userId===refreshed.userId?{...refreshed,language:current.language}:current);
        }} /> : null}
        {selectedVendor ? (
          <VendorDetailScreen
            slug={selectedVendor.slug}
            initialVendor={selectedVendor}
            isSaved={savedVendorIds.includes(selectedVendor.id)}
            language={language}
            onBack={() => setSelectedVendor(null)}
            onRequestQuote={openQuoteRequest}
            onScrollToSection={(y) => contentScrollRef.current?.scrollTo({ y, animated: true })}
            onToggleSaved={handleToggleSaved}
          />
        ) : (
          <ScreenContent
            key={userEmail ?? 'guest'}
            notifications={notifications}
            notificationTarget={!quoteVendors.length&&!isPasswordRecovery?notificationTarget:null}
            onNotificationConsumed={(id)=>setNotificationTarget(value=>value?.notificationId===id?null:value)}
            inboxRevision={inboxRevision}
            tab={visibleActiveTab}
            role={role}
            language={language}
            initialSearchCategory={searchCategory}
            savedVendorIds={savedVendorIds}
            onSignedIn={handleSignedIn}
            userEmail={userEmail}
            onProfileUpdated={setProfile}
            onLanguageUpdated={(nextLanguage) => {
              setLanguage(nextLanguage);
              void saveLanguagePreference(nextLanguage);
            }}
            onNavigate={(tab) => {
              setSelectedVendor(null);
              setActiveTab(tab);
              setIsAccountMenuOpen(false);
            }}
            onSelectSearchCategory={(category) => {
              setSearchCategory(category);
              setSelectedVendor(null);
              setActiveTab("search");
              setIsAccountMenuOpen(false);
            }}
            onOpenVendor={(vendor) => {
              setSelectedVendor(vendor);
              setIsAccountMenuOpen(false);
            }}
            onRequestQuote={openQuoteRequest}
            onRequestQuoteBatch={openQuoteRequestBatch}
            onToggleSaved={handleToggleSaved}
          />
        )}
      </ScrollView>

      {!isDetailOpen ? <View style={styles.tabs}>
        {tabs.map((tab) => {
          const isActive = tab.key === visibleActiveTab;
          return (
            <TouchableOpacity
              accessibilityLabel={tabLabel(tab.key, language)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => {
                setSelectedVendor(null);
                setActiveTab(tab.key);
                setIsAccountMenuOpen(false);
              }}
            >
              <Ionicons
                name={isActive ? (tabIcons[tab.key].replace("-outline", "") as IconName) : tabIcons[tab.key]}
                size={20}
                color={isActive ? colors.ink : "rgba(255,255,255,0.78)"}
              />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tabLabel(tab.key, language)}</Text>
            </TouchableOpacity>
          );
        })}
      </View> : null}
      <RequestQuoteModal
        visible={quoteVendors.length > 0}
        vendors={quoteVendors}
        profile={profile}
        userEmail={userEmail}
        language={language}
        onClose={() => setQuoteVendors([])}
        onSent={() => {
          setQuoteVendors([]);
          setSelectedVendor(null);
          setActiveTab("inbox");
        }}
      />
      <PasswordRecoveryModal
        visible={isPasswordRecovery}
        language={language}
        onComplete={() => {
          setIsPasswordRecovery(false);
          setUserEmail(null);
          setProfile(null);
          setActiveTab("home");
          setSelectedVendor(null);
        }}
        onCancel={() => {
          setIsPasswordRecovery(false);
          setUserEmail(null);
          setProfile(null);
          setActiveTab("home");
          setSelectedVendor(null);
        }}
      />
      </View>
    </SafeAreaView>
  );
}
