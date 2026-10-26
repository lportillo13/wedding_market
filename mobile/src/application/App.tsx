import brandMark from '../../assets/brand/mark.png';
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
import { addNotificationTapListener, registerForPushNotifications, unregisterPushNotifications } from "../lib/pushNotifications";
import { getShortlist, toggleShortlist } from "../lib/shortlist";
import { supabase } from "../lib/supabase";
import { styles } from "../theme/styles";
import { colors } from "../theme/tokens";
import { roleTabs, tabIcons, tabLabel } from "./navigation";
import { ScreenContent } from "./ScreenContent";
import { type IconName, type TabKey } from "./types";
import { PlayfairDisplay_400Regular } from "@expo-google-fonts/playfair-display/400Regular";
import { PlayfairDisplay_500Medium } from "@expo-google-fonts/playfair-display/500Medium";
import { PlayfairDisplay_700Bold } from "@expo-google-fonts/playfair-display/700Bold";
import { PlayfairDisplay_900Black } from "@expo-google-fonts/playfair-display/900Black";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFonts } from "expo-font";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, AppState, BackHandler, Image, Linking, Platform, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";

export default function App() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_900Black,
  });
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
    if (!userEmail) {
      return;
    }

    void registerForPushNotifications().then((result) => {
      if (!result.ok && process.env.NODE_ENV !== "production") {
        console.warn("Push notification registration skipped", result.reason);
      }
    });
  }, [userEmail]);

  useEffect(() => {
    const subscription = addNotificationTapListener(() => {
      setSelectedVendor(null);
      setActiveTab("inbox");
    });

    return () => {
      subscription.remove();
    };
  }, []);

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
    await unregisterPushNotifications();
    await signOut();
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
      <StatusBar barStyle="dark-content" />
      <ExpoStatusBar style="dark" />
      {!isDetailOpen ? <View style={[styles.header, isHomeOpen && styles.headerOverlay]}>
        <View style={styles.headerBrandRow}>
          <View style={styles.logoMark}>
            <Image source={brandMark} style={{width:34,height:34,tintColor:colors.paper}} accessibilityIgnoresInvertColors />
          </View>
          <View>
            <Text style={[styles.brand, isHomeOpen && styles.headerOverlayText]}>The Wedding Market</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
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
          {isAccountMenuOpen ? (
            <View style={styles.accountMenu}>
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
          ) : null}
        </View>
      </View> : null}

      <ScrollView
        ref={contentScrollRef}
        contentContainerStyle={isDetailOpen || isVendorPublicOpen ? styles.detailContent : isHomeOpen ? styles.homeContent : styles.content}
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        keyboardShouldPersistTaps="handled"
      >
        {userEmail && profile && profile.communityTermsVersion !== COMMUNITY_TERMS_VERSION ? <CommunityConsent language={language} onAccepted={()=>setProfile({...profile,communityTermsVersion:COMMUNITY_TERMS_VERSION})} /> : null}
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
    </SafeAreaView>
  );
}
