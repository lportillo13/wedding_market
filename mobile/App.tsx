import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  Image,
  type LayoutChangeEvent,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  Linking,
  Share,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { useFonts } from "expo-font";
import { PlayfairDisplay_400Regular } from "@expo-google-fonts/playfair-display/400Regular";
import { PlayfairDisplay_500Medium } from "@expo-google-fonts/playfair-display/500Medium";
import { PlayfairDisplay_700Bold } from "@expo-google-fonts/playfair-display/700Bold";
import { PlayfairDisplay_900Black } from "@expo-google-fonts/playfair-display/900Black";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { supabase } from "./src/lib/supabase";
import { getMobileConfigErrors } from "./src/lib/config";
import {
  type AppRole,
  type AuthProfile,
  type AuthState,
  createSessionFromMobileAuthUrl,
  loadAuthState,
  resendSignUpConfirmation,
  restoreMobileAuthState,
  signInWithEmail,
  signUpWithEmail,
  signOut,
} from "./src/lib/auth";
import { fetchVendorDetail, fetchVendors, type VendorDetail, type VendorListItem } from "./src/lib/api";
import {
  acceptMobileQuote,
  createQuoteRequests,
  loadMobileInbox,
  sendQuoteThreadReply,
  sendVendorQuote,
  type MobileInboxThread,
  type QuoteRequestInput,
} from "./src/lib/rfqs";
import { isQuoteThreadClosed } from "./src/lib/quoteUtils";
import { getShortlist, toggleShortlist } from "./src/lib/shortlist";
import { addNotificationTapListener, registerForPushNotifications, unregisterPushNotifications } from "./src/lib/pushNotifications";
import { externalMapUrl, publicWebUrl, vendorShareUrl } from "./src/lib/urls";
import { mergeUniqueById } from "./src/lib/search";
import {
  loadVendorEditorData,
  localizedText,
  saveVendorAmenities,
  saveVendorAvailability,
  saveVendorContact,
  saveVendorDetails,
  saveVendorPricing,
  saveVendorReviews,
  saveVendorTeam,
  uploadVendorMedia,
  uploadedAssetUrl,
  type VendorEditorData,
  type VendorEditorTab,
} from "./src/lib/vendorProfile";

type TabKey = "home" | "search" | "favorites" | "inbox" | "profile" | "vendor" | "admin";
type IconName = keyof typeof Ionicons.glyphMap;
type SearchViewMode = "list" | "map";

const colors = {
  ink: "#161A1D",
  muted: "#6D747A",
  line: "#ECEFF1",
  paper: "#FFFFFF",
  warm: "#F8F8F6",
  teal: "#1D7A72",
  tealDark: "#161A1D",
  gold: "#F1B84B",
  blush: "#FFF0EE",
  soft: "#F2F4F3",
};

const fontFamilies = {
  body: Platform.select({ android: "sans-serif", ios: "System", default: undefined }),
  displayRegular: "PlayfairDisplay_400Regular",
  displayMedium: "PlayfairDisplay_500Medium",
  displayBold: "PlayfairDisplay_700Bold",
  displayBlack: "PlayfairDisplay_900Black",
};

const tabIcons: Record<TabKey, IconName> = {
  home: "home-outline",
  search: "search-outline",
  favorites: "heart-outline",
  inbox: "chatbubbles-outline",
  profile: "person-outline",
  vendor: "briefcase-outline",
  admin: "shield-checkmark-outline",
};

const heroImageUrl =
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=82";

const categories = [
  {
    label: "Venues",
    slug: "venues",
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80",
  },
  {
    label: "Photography",
    slug: "photography",
    image: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=900&q=80",
  },
  {
    label: "Catering",
    slug: "catering",
    image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80",
  },
  {
    label: "Beauty",
    slug: "beauty",
    image: "https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?auto=format&fit=crop&w=900&q=80",
  },
  {
    label: "Entertainment",
    slug: "entertainment",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=80",
  },
  {
    label: "Decor",
    slug: "decor",
    image: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=900&q=80",
  },
];

const detailSections = [
  { key: "photos", label: "Photos", icon: "images-outline" as IconName },
  { key: "about", label: "About", icon: "information-circle-outline" as IconName },
  { key: "spaces", label: "Spaces", icon: "business-outline" as IconName },
  { key: "pricing", label: "Pricing", icon: "cash-outline" as IconName },
  { key: "amenities", label: "Services", icon: "checkmark-circle-outline" as IconName },
  { key: "team", label: "Team", icon: "people-outline" as IconName },
  { key: "availability", label: "Availability", icon: "calendar-outline" as IconName },
  { key: "reviews", label: "Reviews", icon: "star-outline" as IconName },
  { key: "contact", label: "Contact", icon: "call-outline" as IconName },
];

const clientTabs: { key: TabKey; label: string }[] = [
  { key: "home", label: "Home" },
  { key: "search", label: "Search" },
  { key: "favorites", label: "Favorites" },
  { key: "inbox", label: "Inbox" },
  { key: "profile", label: "Profile" },
];

const guestTabs: { key: TabKey; label: string }[] = [
  { key: "home", label: "Home" },
  { key: "search", label: "Search" },
  { key: "favorites", label: "Favorites" },
  { key: "profile", label: "Profile" },
];

const vendorTabs: { key: TabKey; label: string }[] = [
  { key: "home", label: "Home" },
  { key: "search", label: "Search" },
  { key: "vendor", label: "Vendor" },
  { key: "inbox", label: "Inbox" },
  { key: "profile", label: "Profile" },
];

const adminTabs: { key: TabKey; label: string }[] = [
  { key: "admin", label: "Admin" },
  { key: "vendor", label: "Vendor" },
  { key: "inbox", label: "Inbox" },
  { key: "profile", label: "Profile" },
];

const weddingThemeOptions = [
  { value: "", label: "No theme selected" },
  { value: "classic", label: "Classic" },
  { value: "boho", label: "Boho" },
  { value: "rustic", label: "Rustic" },
  { value: "beach", label: "Beach" },
  { value: "garden", label: "Garden" },
  { value: "modern", label: "Modern" },
  { value: "vintage", label: "Vintage" },
];

const weddingStyleCards = [
  {
    value: "classic",
    image: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=700&q=80",
  },
  {
    value: "boho",
    image: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=700&q=80",
  },
  {
    value: "modern",
    image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=700&q=80",
  },
  {
    value: "garden",
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=700&q=80",
  },
  {
    value: "beach",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=700&q=80",
  },
  {
    value: "rustic",
    image: "https://images.unsplash.com/photo-1505944357431-27579db47558?auto=format&fit=crop&w=700&q=80",
  },
  {
    value: "vintage",
    image: "https://images.unsplash.com/photo-1509610973147-232dfea52a97?auto=format&fit=crop&w=700&q=80",
  },
];

const countryNames = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Cote d'Ivoire",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Democratic Republic of the Congo",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Puerto Rico",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

type ClientProfileForm = {
  full_name: string;
  phone: string;
  country: string;
  language: "en" | "es";
  tentative_wedding_date: string;
  guest_count: string;
  wedding_budget: string;
  wedding_theme: string;
};

const copy = {
  en: {
    browseVendors: "Browse vendors",
    home: "Home",
    search: "Search",
    favorites: "Favorites",
    inbox: "Inbox",
    profile: "Profile",
    vendor: "Vendor",
    admin: "Admin",
    language: "Language",
    english: "English",
    spanish: "Spanish",
    switchToSpanish: "Switch to Spanish",
    switchToEnglish: "Switch to English",
    currentLanguage: "Current language",
    accountProfile: "Account Profile",
    manageProfile: "Manage the same profile fields used by the website.",
    overview: "Overview",
    totalVendors: "Total vendors",
    published: "Published",
    requests: "Requests",
    quotes: "Quotes",
    users: "Users",
    vendorWorkspace: "Vendor Workspace",
    vendorProfile: "Vendor profile",
    businessDetails: "Business details",
    quoteActivity: "Quote activity",
    noVendorProfile: "No vendor profile found for this account.",
    noInbox: "No inbox activity yet.",
    inboxTitle: "Quotes and messages",
    latestActivity: "Latest activity",
    openProfile: "Open profile",
    status: "Status",
    languageSaved: "Language saved",
    requestQuote: "Request Quote",
    messageVendor: "Message vendor",
    sendRequest: "Send Request",
    requestSent: "Request sent. You can track the conversation in your inbox.",
    reply: "Reply",
    sendReply: "Send Reply",
    sendQuote: "Send quote",
    updateQuote: "Update quote",
    quoteAmount: "Quote amount (USD)",
    quoteDetails: "Proposal details",
    quoteSent: "Quote sent.",
    acceptQuote: "Accept quote",
    acceptingQuote: "Accepting...",
    quoteAccepted: "Quote accepted",
    shareEmail: "Share my email with this vendor",
    sharePhone: "Share my phone with this vendor",
    proposalSent: "Proposal sent",
    proposalUpdated: "Proposal updated",
    noConversation: "No messages yet.",
    contactDetails: "Shared contact details",
    noContactShared: "The client did not share email or phone.",
    refresh: "Refresh",
    conversationClosed: "This conversation is closed because another quote was selected or the request expired.",
    you: "You",
    noQuoteYet: "No quote yet. The vendor will reply here after reviewing the request.",
    authTitle: "Sign in to your platform workspace.",
    email: "Email",
    password: "Password",
    signIn: "Sign In",
    signingIn: "Signing in...",
    createAccount: "Create Account",
    creatingAccount: "Creating account...",
    clientAccount: "Client",
    vendorAccount: "Vendor",
    fullName: "Full name",
    signupWelcomeTitle: "Hi, I am happy you are here.",
    signupWelcomeBody: "I will help you start your wedding plan without making it feel overwhelming. I just need a few details first.",
    startPlanning: "Start with me",
    stopSignupTitle: "Stop creating your account?",
    stopSignupBody: "Your answers are not saved yet. You can stay here and continue, or leave this setup.",
    keepPlanning: "Keep planning",
    stopPlanning: "Stop",
    chooseWeddingStyle: "Which style feels most like your wedding?",
    selectedDate: "Selected date",
    searchCountry: "Search country",
    noCountryResults: "No countries found.",
    next: "Next",
    back: "Back",
    finishCreateAccount: "Create my account",
    stepOf: "Step",
    contactStepTitle: "First, tell me who I am helping.",
    contactStepBody: "I will keep this simple. Your name, email, and phone help keep your quotes and saved vendors connected to you.",
    weddingStyleStepTitle: "What kind of wedding are you picturing?",
    weddingStyleStepBody: "Pick the style that feels closest. It does not have to be perfect; we can adjust it later.",
    weddingDateStepTitle: "Do you already have a date in mind?",
    weddingDateStepBody: "Choose the date you are planning around. If it changes later, that is completely okay.",
    guestStepTitle: "How many people should we plan for?",
    guestStepBody: "An estimate is enough for now. This helps vendors understand the size of your celebration.",
    budgetStepTitle: "Where are we planning this wedding?",
    budgetStepBody: "Choose your country and share a rough budget so I can help organize better vendor matches.",
    accountStepTitle: "Now let us save your plan.",
    accountStepBody: "Choose a password so you can come back to your favorites, quotes, and messages anytime.",
    requiredFields: "Please complete the required fields before continuing.",
    weddingDate: "Wedding date",
    guestCount: "Guest count",
    weddingBudget: "Wedding budget",
    region: "State / Region",
    accountCreated: "Account created. Your workspace is ready.",
    confirmationSent: "Check your email to confirm your account. The verification link will reopen the app and finish setup.",
    emailConfirmedTitle: "Email confirmed",
    emailConfirmedBody: "Your Wedding Market account is ready.",
    emailConfirmationErrorTitle: "Email confirmation failed",
    emailConfirmationFailed: "We could not finish email confirmation. Open the newest verification link or sign in again.",
    resendConfirmation: "Resend verification email",
    resendingConfirmation: "Sending verification email...",
    confirmationResent: "A new verification email was sent. Open the newest link to confirm your account.",
    createAccountIntro: "I will ask a few quick questions and help you start your wedding plan.",
    loginIntro: "Use an existing local Supabase account. The app will detect whether the account is client, vendor, or admin after sign-in.",
    vendorSearch: "Vendor Search",
    vendorSearchTitle: "Find the right wedding team.",
    vendorSearchBody: "Search your local vendor directory from the native app.",
    searchVendors: "Search vendors",
    searching: "Searching",
    noMatchingVendors: "No matching vendors found.",
    filters: "Filters",
    clear: "Clear",
    category: "Category",
    all: "All",
    list: "List",
    map: "Map",
    mapPreview: "Map preview",
    openInMaps: "Open in Maps",
    loadingVendors: "Loading vendors",
    loadMore: "Load more",
    loadingMore: "Loading more",
    tryAgain: "Try Again",
    noVendorsFound: "No vendors found.",
    noVendorsHint: "Try a broader search term or clear the search field.",
    vendorsFound: "vendors found",
    available: "Available",
    busy: "Busy",
    reviews: "reviews",
    yourCollection: "Your Collection",
    savedVendors: "Saved vendors",
    savedVendor: "saved vendor",
    savedVendorsCount: "saved vendors",
    requestQuotesFromAll: "Request quotes from all",
    noSavedVendors: "No saved vendors yet.",
    noSavedVendorsHint: "Tap the heart on any vendor to add it here.",
    trustedVendors: "Trusted vendors",
    exploreMarketplace: "Explore the marketplace",
    quoteBatchHint: "One shared request goes to every selected vendor. Each reply stays in its own private conversation.",
    firstName: "First name",
    lastName: "Last name",
    phone: "Phone",
    eventDate: "Event date",
    guests: "Guests",
    flexibleDate: "Flexible date",
    budgetMin: "Budget min",
    budgetMax: "Budget max",
    city: "City",
    state: "State",
    country: "Country",
    weddingTheme: "Wedding theme",
    sending: "Sending...",
    loadingProfile: "Loading profile",
    contact: "Contact",
    yourName: "Your name",
    phoneNumber: "Phone number",
    preferredLanguage: "Preferred language",
    weddingPreferences: "Wedding Preferences",
    saveProfile: "Save Profile",
    saving: "Saving...",
    saveChanges: "Save changes",
    accountControls: "Account controls",
    privacyPolicy: "Privacy policy",
    termsOfService: "Terms of service",
    deleteAccount: "Delete account",
    deleteAccountHelp: "Request deletion of your Wedding Market account and associated data.",
    saved: "Saved.",
    saveFailed: "Save failed.",
    draft: "Draft",
    details: "Details",
    pricing: "Pricing",
    amenities: "Amenities",
    team: "Team",
    dates: "Dates",
    images: "Images",
    businessName: "Business name",
    slug: "Slug",
    bioEnglish: "Bio English",
    bioSpanish: "Bio Spanish",
    extraInfoEnglish: "Extra info English",
    extraInfoSpanish: "Extra info Spanish",
    website: "Website",
    mapUrl: "Map URL",
    address: "Address",
    startingPrice: "Starting price",
    currency: "Currency",
    eventTypes: "Event types",
    yearsInBusiness: "Years in business",
    languages: "Languages",
    teamSize: "Team size",
    typicalSpend: "Typical spend",
    peakSeasons: "Peak seasons",
    price: "Price",
    contactForPrice: "Contact for price",
    notes: "Notes",
    maxCapacity: "Max capacity",
    currentHeadshot: "Current headshot",
    uploadHeadshot: "Upload headshot",
    titleEnglish: "Title English",
    titleSpanish: "Title Spanish",
    addTeamMember: "Add team member",
    availabilityHelp: "Tap a day to cycle: available, busy, clear.",
    reviewSummary: "Review summary",
    googleProfileUrl: "Google Business Profile URL",
    logo: "Logo",
    hero: "Hero",
    noHero: "No hero",
    thumbnail: "Thumbnail",
    noThumb: "No thumb",
    uploadOrReplace: "Upload or replace",
    gallery: "Gallery",
    uploading: "Uploading",
    completed: "Completed",
    currentGallery: "Current gallery",
    noGalleryImages: "No gallery images yet.",
    loadingPublicVendorPage: "Loading public vendor page",
    vendorPage: "Vendor Page",
    publicVendorUnavailable: "Public vendor profile unavailable.",
    loadingVendorProfile: "Loading vendor profile",
    backToSearch: "Back to search",
    vendorNotFound: "Vendor not found.",
    call: "Call",
    rating: "Rating",
    location: "Location",
    availableByRequest: "Available by request",
    photos: "Photos",
    visualStory: "Visual story",
    photosEmpty: "Photos will appear here when the vendor publishes more media.",
    about: "About",
    aboutTitle: "What they bring to your day",
    profileUpdating: "Profile details are being updated.",
    spaces: "Spaces",
    spacesTitle: "Event spaces and service details",
    serviceDetail: "Service detail",
    upToGuests: "Up to",
    guestsWord: "guests",
    spacesEmpty: "Detailed spaces and packages are being updated.",
    pricingTitle: "Helpful budget context",
    startingAt: "Starting at",
    capacity: "Capacity",
    services: "Services",
    servicesTitle: "Amenities and included details",
    highlights: "Highlights",
    settings: "Settings",
    coverage: "Coverage",
    servicesEmpty: "Services and amenities are being updated.",
    teamTitle: "Meet the team",
    respondsWithin: "Responds within",
    teamEmpty: "Team details are being updated.",
    availability: "Availability",
    publishedDates: "Published dates",
    availabilityEmpty: "No published availability yet. The calendar will highlight dates when the vendor adds them.",
    coupleFeedback: "Couple feedback",
    star: "star",
    reviewsEmpty: "Reviews will appear here when couples share feedback.",
    nextStep: "Next step",
    heroBadgeHome: "All-in-one wedding marketplace",
    heroTitleHome: "Plan your dream wedding with less stress.",
    heroTextHome: "Discover trusted professionals, compare quotes, and keep your favorites organized.",
    exploreVendors: "Explore Vendors",
    shortlist: "Shortlist",
    discover: "Discover",
    compare: "Compare",
    request: "Request",
    curatedCategories: "Curated categories",
    popularServices: "Explore popular services",
    viewAll: "View all",
    workflowKicker: "Member-style workflow",
    workflowTitle: "From inspiration to decision",
    workflowBody: "The app keeps your planning path simple: browse first, save the best options, then manage requests and replies from your account.",
    workflowShortlistTitle: "Save the vendors that fit",
    workflowShortlistBody: "Keep your strongest options in one place while you compare style, reviews, and budget.",
    workflowRequestTitle: "Send one clear brief",
    workflowRequestBody: "Share your date, guest count, location, and priorities without repeating the same message.",
    workflowTrack: "Track",
    workflowTrackTitle: "Follow every reply",
    workflowTrackBody: "Keep quotes, messages, and next steps organized from your account.",
    ctaTitle: "Ready to find your first vendor?",
    ctaBody: "Start with search, then sign in when you want to save or request quotes.",
    signInVendorPage: "Sign in to view your vendor page.",
    vendorAccessRequired: "Vendor access requires a vendor account.",
    adminAccessRequired: "Admin access requires an admin account.",
    signInInbox: "Sign in to view quotes and messages.",
    signInProfile: "Sign in to manage your profile.",
    readyExperience: "Ready for the experience.",
    supabaseLoaded: "Supabase config loaded",
    yes: "yes",
    missingEnv: "missing environment variables",
    loadingApp: "Loading The Wedding Market",
    guest: "Guest",
    browseAsGuest: "Browse as guest",
    logIn: "Log In",
    logOut: "Log Out",
    client: "Client",
  },
  es: {
    browseVendors: "Explorar proveedores",
    home: "Inicio",
    search: "Buscar",
    favorites: "Favoritos",
    inbox: "Mensajes",
    profile: "Perfil",
    vendor: "Proveedor",
    admin: "Admin",
    language: "Idioma",
    english: "Inglés",
    spanish: "Español",
    switchToSpanish: "Cambiar a español",
    switchToEnglish: "Cambiar a inglés",
    currentLanguage: "Idioma actual",
    accountProfile: "Perfil de cuenta",
    manageProfile: "Administra los mismos campos del perfil del sitio web.",
    overview: "Resumen",
    totalVendors: "Proveedores",
    published: "Publicados",
    requests: "Solicitudes",
    quotes: "Cotizaciones",
    users: "Usuarios",
    vendorWorkspace: "Panel de proveedor",
    vendorProfile: "Perfil de proveedor",
    businessDetails: "Detalles del negocio",
    quoteActivity: "Actividad de cotizaciones",
    noVendorProfile: "No hay perfil de proveedor para esta cuenta.",
    noInbox: "Todavía no hay actividad en mensajes.",
    inboxTitle: "Cotizaciones y mensajes",
    latestActivity: "Actividad reciente",
    openProfile: "Abrir perfil",
    status: "Estado",
    languageSaved: "Idioma guardado",
    requestQuote: "Solicitar cotización",
    messageVendor: "Mensaje al proveedor",
    sendRequest: "Enviar solicitud",
    requestSent: "Solicitud enviada. Puedes seguir la conversación en mensajes.",
    reply: "Responder",
    sendReply: "Enviar respuesta",
    sendQuote: "Enviar cotización",
    updateQuote: "Actualizar cotización",
    quoteAmount: "Monto de la cotización (USD)",
    quoteDetails: "Detalles de la propuesta",
    quoteSent: "Cotización enviada.",
    acceptQuote: "Aceptar cotización",
    acceptingQuote: "Aceptando...",
    quoteAccepted: "Cotización aceptada",
    shareEmail: "Compartir mi correo con este proveedor",
    sharePhone: "Compartir mi teléfono con este proveedor",
    proposalSent: "Propuesta enviada",
    proposalUpdated: "Propuesta actualizada",
    noConversation: "Todavía no hay mensajes.",
    contactDetails: "Datos de contacto compartidos",
    noContactShared: "El cliente no compartió correo ni teléfono.",
    refresh: "Actualizar",
    conversationClosed: "Esta conversación está cerrada porque se eligió otra cotización o venció la solicitud.",
    you: "Tú",
    noQuoteYet: "Aún no hay cotización. El proveedor responderá aquí después de revisar la solicitud.",
    authTitle: "Inicia sesión en tu espacio de trabajo.",
    email: "Correo electrónico",
    password: "Contraseña",
    signIn: "Entrar",
    signingIn: "Entrando...",
    createAccount: "Crear cuenta",
    creatingAccount: "Creando cuenta...",
    clientAccount: "Cliente",
    vendorAccount: "Proveedor",
    fullName: "Nombre completo",
    signupWelcomeTitle: "Hola, me alegra que estés aquí.",
    signupWelcomeBody: "Voy a ayudarte a empezar tu plan de boda sin que se sienta abrumador. Solo necesito algunos datos primero.",
    startPlanning: "Empezar contigo",
    stopSignupTitle: "¿Detener la creación de la cuenta?",
    stopSignupBody: "Tus respuestas todavía no están guardadas. Puedes quedarte y continuar, o salir de esta configuración.",
    keepPlanning: "Seguir planificando",
    stopPlanning: "Detener",
    chooseWeddingStyle: "¿Qué estilo se parece más a tu boda?",
    selectedDate: "Fecha seleccionada",
    searchCountry: "Buscar país",
    noCountryResults: "No se encontraron países.",
    next: "Siguiente",
    back: "Atrás",
    finishCreateAccount: "Crear mi cuenta",
    stepOf: "Paso",
    contactStepTitle: "Primero, dime a quién estoy ayudando.",
    contactStepBody: "Lo mantendré simple. Tu nombre, correo y teléfono ayudan a conectar tus cotizaciones y proveedores guardados contigo.",
    weddingStyleStepTitle: "¿Qué tipo de boda estás imaginando?",
    weddingStyleStepBody: "Elige el estilo que se sienta más cercano. No tiene que ser perfecto; lo podemos ajustar después.",
    weddingDateStepTitle: "¿Ya tienes una fecha en mente?",
    weddingDateStepBody: "Escoge la fecha que estás planeando. Si cambia después, no pasa nada.",
    guestStepTitle: "¿Para cuántas personas estamos planificando?",
    guestStepBody: "Un estimado está bien por ahora. Esto ayuda a los proveedores a entender el tamaño de tu celebración.",
    budgetStepTitle: "¿Dónde estamos planificando esta boda?",
    budgetStepBody: "Elige tu país y comparte un presupuesto aproximado para ayudarte a organizar mejores opciones.",
    accountStepTitle: "Ahora guardemos tu plan.",
    accountStepBody: "Elige una contraseña para volver a tus favoritos, cotizaciones y mensajes cuando quieras.",
    requiredFields: "Completa los campos requeridos antes de continuar.",
    weddingDate: "Fecha de boda",
    guestCount: "Número de invitados",
    weddingBudget: "Presupuesto de boda",
    region: "Estado / Región",
    accountCreated: "Cuenta creada. Tu espacio está listo.",
    confirmationSent: "Revisa tu correo para confirmar tu cuenta. El enlace de verificación abrirá la app y terminará la configuración.",
    emailConfirmedTitle: "Correo confirmado",
    emailConfirmedBody: "Tu cuenta de Wedding Market está lista.",
    emailConfirmationErrorTitle: "Error al confirmar el correo",
    emailConfirmationFailed: "No pudimos terminar la confirmación. Abre el enlace de verificación más reciente o inicia sesión de nuevo.",
    resendConfirmation: "Reenviar correo de verificación",
    resendingConfirmation: "Enviando correo de verificación...",
    confirmationResent: "Enviamos un nuevo correo de verificación. Abre el enlace más reciente para confirmar tu cuenta.",
    createAccountIntro: "Te haré unas preguntas rápidas para ayudarte a empezar tu plan de boda.",
    loginIntro: "Usa una cuenta local existente de Supabase. La app detectará si la cuenta es cliente, proveedor o admin después de iniciar sesión.",
    vendorSearch: "Búsqueda de proveedores",
    vendorSearchTitle: "Encuentra el equipo ideal para tu boda.",
    vendorSearchBody: "Busca proveedores locales desde la app nativa.",
    searchVendors: "Buscar proveedores",
    searching: "Buscando",
    noMatchingVendors: "No se encontraron proveedores.",
    filters: "Filtros",
    clear: "Limpiar",
    category: "Categoría",
    all: "Todos",
    list: "Lista",
    map: "Mapa",
    mapPreview: "Vista previa del mapa",
    openInMaps: "Abrir en Mapas",
    loadingVendors: "Cargando proveedores",
    loadMore: "Cargar más",
    loadingMore: "Cargando más",
    tryAgain: "Intentar de nuevo",
    noVendorsFound: "No se encontraron proveedores.",
    noVendorsHint: "Prueba una búsqueda más amplia o limpia el campo.",
    vendorsFound: "proveedores encontrados",
    available: "Disponible",
    busy: "Ocupado",
    reviews: "Reseñas",
    yourCollection: "Tu colección",
    savedVendors: "Proveedores guardados",
    savedVendor: "proveedor guardado",
    savedVendorsCount: "proveedores guardados",
    requestQuotesFromAll: "Solicitar cotizaciones a todos",
    noSavedVendors: "Aún no tienes proveedores guardados.",
    noSavedVendorsHint: "Toca el corazón en cualquier proveedor para agregarlo aquí.",
    trustedVendors: "Proveedores confiables",
    exploreMarketplace: "Explora el mercado",
    quoteBatchHint: "Una solicitud compartida se envía a cada proveedor seleccionado. Cada respuesta queda en su conversación privada.",
    firstName: "Nombre",
    lastName: "Apellido",
    phone: "Teléfono",
    eventDate: "Fecha del evento",
    guests: "Invitados",
    flexibleDate: "Fecha flexible",
    budgetMin: "Presupuesto min",
    budgetMax: "Presupuesto máx",
    city: "Ciudad",
    state: "Estado",
    country: "País",
    weddingTheme: "Estilo de boda",
    sending: "Enviando...",
    loadingProfile: "Cargando perfil",
    contact: "Contacto",
    yourName: "Tu nombre",
    phoneNumber: "Número de teléfono",
    preferredLanguage: "Idioma preferido",
    weddingPreferences: "Preferencias de boda",
    saveProfile: "Guardar perfil",
    saving: "Guardando...",
    saveChanges: "Guardar cambios",
    accountControls: "Controles de cuenta",
    privacyPolicy: "Política de privacidad",
    termsOfService: "Términos de servicio",
    deleteAccount: "Eliminar cuenta",
    deleteAccountHelp: "Solicita la eliminacion de tu cuenta de Wedding Market y los datos asociados.",
    saved: "Guardado.",
    saveFailed: "Error al guardar.",
    draft: "Borrador",
    details: "Detalles",
    pricing: "Precios",
    amenities: "Comodidades",
    team: "Equipo",
    dates: "Fechas",
    images: "Imágenes",
    businessName: "Nombre del negocio",
    slug: "Slug",
    bioEnglish: "Bio en inglés",
    bioSpanish: "Bio en español",
    extraInfoEnglish: "Info extra en inglés",
    extraInfoSpanish: "Info extra en español",
    website: "Sitio web",
    mapUrl: "URL del mapa",
    address: "Dirección",
    startingPrice: "Precio inicial",
    currency: "Moneda",
    eventTypes: "Tipos de evento",
    yearsInBusiness: "Años en negocio",
    languages: "Idiomas",
    teamSize: "Tamaño del equipo",
    typicalSpend: "Gasto típico",
    peakSeasons: "Temporadas altas",
    price: "Precio",
    contactForPrice: "Contactar por precio",
    notes: "Notas",
    maxCapacity: "Capacidad máxima",
    currentHeadshot: "Foto actual",
    uploadHeadshot: "Subir foto",
    titleEnglish: "Título en inglés",
    titleSpanish: "Título en español",
    addTeamMember: "Agregar miembro",
    availabilityHelp: "Toca un dia para cambiar: disponible, ocupado, limpiar.",
    reviewSummary: "Resumen de reseñas",
    googleProfileUrl: "URL de Google Business Profile",
    logo: "Logo",
    hero: "Hero",
    noHero: "Sin hero",
    thumbnail: "Miniatura",
    noThumb: "Sin miniatura",
    uploadOrReplace: "Subir o reemplazar",
    gallery: "Galería",
    uploading: "Subiendo",
    completed: "Completado",
    currentGallery: "Galería actual",
    noGalleryImages: "Aún no hay imágenes en la galería.",
    loadingPublicVendorPage: "Cargando página pública del proveedor",
    vendorPage: "Página del proveedor",
    publicVendorUnavailable: "Perfil público no disponible.",
    loadingVendorProfile: "Cargando perfil del proveedor",
    backToSearch: "Volver a buscar",
    vendorNotFound: "Proveedor no encontrado.",
    call: "Llamar",
    rating: "Calificación",
    location: "Ubicación",
    availableByRequest: "Disponible a solicitud",
    photos: "Fotos",
    visualStory: "Historia visual",
    photosEmpty: "Las fotos aparecerán aquí cuando el proveedor publique más contenido.",
    about: "Acerca de",
    aboutTitle: "Lo que aportan a tu dia",
    profileUpdating: "Los detalles del perfil se están actualizando.",
    spaces: "Espacios",
    spacesTitle: "Espacios y detalles del servicio",
    serviceDetail: "Detalle del servicio",
    upToGuests: "Hasta",
    guestsWord: "invitados",
    spacesEmpty: "Los espacios y paquetes se están actualizando.",
    pricingTitle: "Contexto útil de presupuesto",
    startingAt: "Desde",
    capacity: "Capacidad",
    services: "Servicios",
    servicesTitle: "Comodidades y detalles incluidos",
    highlights: "Destacados",
    settings: "Ambientes",
    coverage: "Cobertura",
    servicesEmpty: "Servicios y comodidades se están actualizando.",
    teamTitle: "Conoce al equipo",
    respondsWithin: "Responde en",
    teamEmpty: "Los detalles del equipo se están actualizando.",
    availability: "Disponibilidad",
    publishedDates: "Fechas publicadas",
    availabilityEmpty: "Aún no hay disponibilidad publicada. El calendario resaltará fechas cuando el proveedor las agregue.",
    coupleFeedback: "Comentarios de parejas",
    star: "estrella",
    reviewsEmpty: "Las reseñas aparecerán aquí cuando las parejas compartan comentarios.",
    nextStep: "Siguiente paso",
    heroBadgeHome: "Mercado de bodas todo en uno",
    heroTitleHome: "Planea tu boda soñada con menos estrés.",
    heroTextHome: "Descubre profesionales confiables, compara cotizaciones y organiza tus favoritos.",
    exploreVendors: "Explorar proveedores",
    shortlist: "Favoritos",
    discover: "Descubrir",
    compare: "Comparar",
    request: "Solicitar",
    curatedCategories: "Categorías seleccionadas",
    popularServices: "Explora servicios populares",
    viewAll: "Ver todo",
    workflowKicker: "Flujo de miembros",
    workflowTitle: "De la inspiración a la decisión",
    workflowBody: "La app simplifica tu planeación: explora, guarda las mejores opciones y gestiona solicitudes y respuestas desde tu cuenta.",
    workflowShortlistTitle: "Guarda los proveedores ideales",
    workflowShortlistBody: "Mantén tus mejores opciones en un lugar mientras comparas estilo, reseñas y presupuesto.",
    workflowRequestTitle: "Envía una solicitud clara",
    workflowRequestBody: "Comparte fecha, invitados, ubicación y prioridades sin repetir el mismo mensaje.",
    workflowTrack: "Seguimiento",
    workflowTrackTitle: "Sigue cada respuesta",
    workflowTrackBody: "Mantén cotizaciones, mensajes y próximos pasos organizados desde tu cuenta.",
    ctaTitle: "¿Listo para encontrar tu primer proveedor?",
    ctaBody: "Empieza buscando y luego inicia sesión para guardar o solicitar cotizaciones.",
    signInVendorPage: "Inicia sesión para ver tu página de proveedor.",
    vendorAccessRequired: "El acceso de proveedor requiere una cuenta de proveedor.",
    adminAccessRequired: "El acceso admin requiere una cuenta admin.",
    signInInbox: "Inicia sesión para ver cotizaciones y mensajes.",
    signInProfile: "Inicia sesión para administrar tu perfil.",
    readyExperience: "La experiencia está lista.",
    supabaseLoaded: "Configuración de Supabase cargada",
    yes: "sí",
    missingEnv: "variables de entorno faltantes",
    loadingApp: "Cargando The Wedding Market",
    guest: "Invitado",
    browseAsGuest: "Explorar como invitado",
    logIn: "Iniciar sesión",
    logOut: "Cerrar sesión",
    client: "Cliente",
  },
};

function tabLabel(tab: TabKey, language: "en" | "es") {
  return copy[language][tab];
}

function categoryLabel(slugOrLabel: string, language: "en" | "es") {
  const key = slugOrLabel.toLowerCase();
  const labels: Record<string, { en: string; es: string }> = {
    venues: { en: "Venues", es: "Lugares" },
    photography: { en: "Photography", es: "Fotografia" },
    catering: { en: "Catering", es: "Catering" },
    beauty: { en: "Beauty", es: "Belleza" },
    entertainment: { en: "Entertainment", es: "Entretenimiento" },
    decor: { en: "Decor", es: "Decoracion" },
  };
  return labels[key]?.[language] ?? slugOrLabel;
}

function themeOptions(language: "en" | "es") {
  if (language === "en") return weddingThemeOptions;
  return [
    { value: "", label: "Sin estilo seleccionado" },
    { value: "classic", label: "Clásico" },
    { value: "boho", label: "Boho" },
    { value: "rustic", label: "Rústico" },
    { value: "beach", label: "Playa" },
    { value: "garden", label: "Jardín" },
    { value: "modern", label: "Moderno" },
    { value: "vintage", label: "Vintage" },
  ];
}

function countryOptions(language: "en" | "es") {
  return countryNames.map((country) => ({
    value: country,
    label:
      language === "es"
        ? country
            .replace("United States", "Estados Unidos")
            .replace("Dominican Republic", "República Dominicana")
            .replace("Mexico", "México")
            .replace("Spain", "España")
            .replace("Canada", "Canadá")
        : country,
  }));
}

function roleTabs(role: AppRole) {
  if (role === "admin") return adminTabs;
  if (role === "vendor") return vendorTabs;
  if (role === "guest") return guestTabs;
  return clientTabs;
}

function openPublicWebPath(path: string) {
  return Linking.openURL(publicWebUrl(path));
}

function AuthScreen({
  onSignedIn,
  language = "en",
  title,
}: {
  onSignedIn: (nextState: { userEmail: string; profile: AuthProfile | null }) => void;
  language?: "en" | "es";
  title?: string;
}) {
  const labels = copy[language];
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [signupStep, setSignupStep] = useState(0);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [datePickerMonth, setDatePickerMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const stepOpacity = useRef(new Animated.Value(1)).current;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [typedTitle, setTypedTitle] = useState("");
  const [typedBody, setTypedBody] = useState("");
  const [isStepCopyComplete, setIsStepCopyComplete] = useState(false);
  const [signupForm, setSignupForm] = useState({
    fullName: "",
    phone: "",
    country: "",
    tentativeWeddingDate: "",
    guestCount: "",
    weddingBudget: "",
    weddingTheme: "",
    businessName: "",
    category: "",
    city: "",
    region: "",
  });
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState<string | null>(null);
  const [isResendingConfirmation, setIsResendingConfirmation] = useState(false);
  const signupStepCount = 6;
  const stepTranslateY = stepOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });
  const styleLabelByValue = Object.fromEntries(themeOptions(language).map((item) => [item.value, item.label]));
  const monthLabel = new Intl.DateTimeFormat(language === "es" ? "es-US" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(datePickerMonth);
  const selectedWeddingDate = signupForm.tentativeWeddingDate;
  const calendarDays = useMemo(() => {
    const year = datePickerMonth.getFullYear();
    const month = datePickerMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return [
      ...Array.from({ length: firstDay }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];
  }, [datePickerMonth]);

  function signupCopyForStep(step = signupStep) {
    if (step === 0) {
      return { title: labels.signupWelcomeTitle, body: labels.signupWelcomeBody };
    }

    if (step === 1) {
      return { title: labels.contactStepTitle, body: labels.contactStepBody };
    }

    if (step === 2) {
      return { title: labels.weddingStyleStepTitle, body: labels.weddingStyleStepBody };
    }

    if (step === 3) {
      return { title: labels.weddingDateStepTitle, body: labels.weddingDateStepBody };
    }

    if (step === 4) {
      return { title: labels.guestStepTitle, body: labels.guestStepBody };
    }

    return { title: labels.budgetStepTitle, body: labels.budgetStepBody };
  }

  useEffect(() => {
    if (!isSignupModalOpen) return undefined;

    const { title: nextTitle, body: nextBody } = signupCopyForStep();
    let titleIndex = 0;
    let bodyIndex = 0;
    let isTypingBody = false;

    setTypedTitle("");
    setTypedBody("");
    setIsStepCopyComplete(false);

    const timer = setInterval(() => {
      if (!isTypingBody) {
        titleIndex += 1;
        setTypedTitle(nextTitle.slice(0, titleIndex));
        if (titleIndex >= nextTitle.length) {
          isTypingBody = true;
        }
        return;
      }

      bodyIndex += 1;
      setTypedBody(nextBody.slice(0, bodyIndex));
      if (bodyIndex >= nextBody.length) {
        clearInterval(timer);
        setIsStepCopyComplete(true);
      }
    }, isTypingBody ? 12 : 22);

    return () => clearInterval(timer);
  }, [isSignupModalOpen, signupStep, language]);

  function updateSignupField(key: keyof typeof signupForm, value: string) {
    setSignupForm((current) => ({ ...current, [key]: value }));
  }

  function openSignupModal() {
    setSignupStep(0);
    stepOpacity.setValue(1);
    setMessage("");
    setIsSuccess(false);
    setIsSignupModalOpen(true);
  }

  function requestCloseSignupModal() {
    Alert.alert(labels.stopSignupTitle, labels.stopSignupBody, [
      { text: labels.keepPlanning, style: "cancel" },
      {
        text: labels.stopPlanning,
        style: "destructive",
        onPress: () => {
          setIsSignupModalOpen(false);
          setMessage("");
          setIsSuccess(false);
        },
      },
    ]);
  }

  function formatDateValue(year: number, month: number, day: number) {
    const yyyy = String(year);
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function moveDatePickerMonth(delta: number) {
    setDatePickerMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  function showSignupStep(nextStep: number) {
    const boundedStep = Math.max(0, Math.min(signupStepCount - 1, nextStep));
    if (boundedStep === signupStep) return;

    setMessage("");
    setIsSuccess(false);
    Animated.timing(stepOpacity, {
      toValue: 0,
      duration: 140,
      useNativeDriver: true,
    }).start(() => {
      setSignupStep(boundedStep);
      Animated.timing(stepOpacity, {
        toValue: 1,
        duration: 190,
        useNativeDriver: true,
      }).start();
    });
  }

  function validateSignupStep(step = signupStep) {
    if (step === 1) {
      return Boolean(signupForm.fullName.trim() && email.trim() && signupForm.phone.trim());
    }

    if (step === 2) {
      return Boolean(signupForm.weddingTheme.trim());
    }

    if (step === 3) {
      return Boolean(signupForm.tentativeWeddingDate.trim());
    }

    if (step === 4) {
      return Boolean(signupForm.guestCount.trim());
    }

    if (step === 5) {
      return Boolean(signupForm.country.trim() && signupForm.weddingBudget.trim() && password.trim());
    }

    return true;
  }

  function handleNextSignupStep() {
    if (!validateSignupStep()) {
      setIsSuccess(false);
      setMessage(labels.requiredFields);
      return;
    }

    showSignupStep(signupStep + 1);
  }

  async function handleSignIn() {
    setMessage("");
    setIsSuccess(false);
    setIsSubmitting(true);

    try {
      const nextState = await signInWithEmail(email.trim(), password);
      onSignedIn({
        userEmail: nextState.user?.email ?? email.trim(),
        profile: nextState.profile,
      });
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Unable to sign in.";
      if (/email not confirmed/i.test(nextMessage)) {
        setPendingConfirmationEmail(email.trim().toLowerCase());
      }
      setMessage(nextMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignUp() {
    setMessage("");
    setIsSuccess(false);
    setIsSubmitting(true);

    try {
      const nextState = await signUpWithEmail({
        role: "client",
        fullName: signupForm.fullName,
        email,
        password,
        phone: signupForm.phone,
        country: signupForm.country,
        language,
        tentativeWeddingDate: signupForm.tentativeWeddingDate,
        guestCount: signupForm.guestCount,
        weddingBudget: signupForm.weddingBudget,
        weddingTheme: signupForm.weddingTheme,
      });

      setIsSuccess(true);
      if (nextState.status === "confirmation_required") {
        setPendingConfirmationEmail(nextState.email);
        setMode("login");
        setIsSignupModalOpen(false);
        setMessage(labels.confirmationSent);
        return;
      }

      setMessage(labels.accountCreated);
      onSignedIn({
        userEmail: nextState.state.user?.email ?? email.trim(),
        profile: nextState.state.profile,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendConfirmation() {
    if (!pendingConfirmationEmail) return;

    setIsResendingConfirmation(true);
    setIsSuccess(false);
    setMessage("");
    try {
      await resendSignUpConfirmation(pendingConfirmationEmail);
      setIsSuccess(true);
      setMessage(labels.confirmationResent);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : labels.emailConfirmationFailed);
    } finally {
      setIsResendingConfirmation(false);
    }
  }

  function submitSignup() {
    if (
      !validateSignupStep(1) ||
      !validateSignupStep(2) ||
      !validateSignupStep(3) ||
      !validateSignupStep(4) ||
      !validateSignupStep(5)
    ) {
      setIsSuccess(false);
      setMessage(labels.requiredFields);
      return;
    }

    void handleSignUp();
  }

  function renderSignupHeading(kicker?: string) {
    const { title, body } = signupCopyForStep();
    return (
      <>
        {kicker ? <Text style={styles.signupKicker}>{kicker}</Text> : null}
        <Text style={styles.signupStepTitle}>{isSignupModalOpen ? typedTitle : title}</Text>
        <Text style={styles.signupStepBody}>{isSignupModalOpen ? typedBody : body}</Text>
      </>
    );
  }

  function renderSignupStep() {
    const fieldsVisible = !isSignupModalOpen || isStepCopyComplete;

    if (signupStep === 0) {
      return (
        <View style={styles.signupIntroPanel}>
          <View style={styles.signupIconBubble}>
            <Ionicons name="heart-outline" size={26} color={colors.ink} />
          </View>
          {renderSignupHeading()}
        </View>
      );
    }

    if (signupStep === 1) {
      return (
        <>
          {renderSignupHeading(`${labels.stepOf} 1 / 5`)}
          {fieldsVisible ? (
            <>
              <FieldLabel text={labels.fullName} />
              <TextInput
                autoCapitalize="words"
                onChangeText={(value) => updateSignupField("fullName", value)}
                placeholder={labels.fullName}
                style={styles.input}
                value={signupForm.fullName}
              />
              <FieldLabel text={labels.email} />
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="you@example.com"
                style={styles.input}
                value={email}
              />
              <FieldLabel text={labels.phone} />
              <TextInput
                keyboardType="phone-pad"
                onChangeText={(value) => updateSignupField("phone", value)}
                placeholder={labels.phone}
                style={styles.input}
                value={signupForm.phone}
              />
            </>
          ) : null}
        </>
      );
    }

    if (signupStep === 2) {
      return (
        <>
          {renderSignupHeading(`${labels.stepOf} 2 / 5`)}
          {fieldsVisible ? (
            <>
              <FieldLabel text={labels.chooseWeddingStyle} />
              <View style={styles.weddingStyleGrid}>
                {weddingStyleCards.map((style) => {
                  const isSelected = signupForm.weddingTheme === style.value;
                  return (
                    <TouchableOpacity
                      key={style.value}
                      onPress={() => updateSignupField("weddingTheme", style.value)}
                      style={[styles.weddingStyleCard, isSelected && styles.weddingStyleCardActive]}
                      activeOpacity={0.88}
                    >
                      <Image source={{ uri: style.image }} style={styles.weddingStyleImage} />
                      <View style={styles.weddingStyleOverlay} />
                      <Text style={styles.weddingStyleLabel}>{styleLabelByValue[style.value] ?? style.value}</Text>
                      {isSelected ? (
                        <View style={styles.weddingStyleCheck}>
                          <Ionicons name="checkmark" size={15} color={colors.paper} />
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : null}
        </>
      );
    }

    if (signupStep === 3) {
      return (
        <>
          {renderSignupHeading(`${labels.stepOf} 3 / 5`)}
          {fieldsVisible ? (
            <>
              <FieldLabel text={labels.weddingDate} />
              <View style={styles.datePickerCard}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => moveDatePickerMonth(-1)} style={styles.datePickerArrow}>
                    <Ionicons name="chevron-back" size={18} color={colors.ink} />
                  </TouchableOpacity>
                  <Text style={styles.datePickerMonth}>{monthLabel}</Text>
                  <TouchableOpacity onPress={() => moveDatePickerMonth(1)} style={styles.datePickerArrow}>
                    <Ionicons name="chevron-forward" size={18} color={colors.ink} />
                  </TouchableOpacity>
                </View>
                <View style={styles.datePickerWeekRow}>
                  {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                    <Text key={`${day}-${index}`} style={styles.datePickerWeekday}>{day}</Text>
                  ))}
                </View>
                <View style={styles.datePickerGrid}>
                  {calendarDays.map((day, index) => {
                    if (!day) {
                      return <View key={`blank-${index}`} style={styles.datePickerDay} />;
                    }

                    const value = formatDateValue(datePickerMonth.getFullYear(), datePickerMonth.getMonth(), day);
                    const isSelected = selectedWeddingDate === value;
                    return (
                      <TouchableOpacity
                        key={value}
                        onPress={() => updateSignupField("tentativeWeddingDate", value)}
                        style={[styles.datePickerDay, isSelected && styles.datePickerDaySelected]}
                      >
                        <Text style={[styles.datePickerDayText, isSelected && styles.datePickerDayTextSelected]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {selectedWeddingDate ? (
                  <Text style={styles.selectedDateText}>{`${labels.selectedDate}: ${selectedWeddingDate}`}</Text>
                ) : null}
              </View>
            </>
          ) : null}
        </>
      );
    }

    if (signupStep === 4) {
      return (
        <>
          {renderSignupHeading(`${labels.stepOf} 4 / 5`)}
          {fieldsVisible ? (
            <>
              <FieldLabel text={labels.guestCount} />
              <TextInput
                keyboardType="number-pad"
                onChangeText={(value) => updateSignupField("guestCount", value)}
                placeholder="120"
                style={styles.input}
                value={signupForm.guestCount}
              />
            </>
          ) : null}
        </>
      );
    }

    return (
      <>
        {renderSignupHeading(`${labels.stepOf} 5 / 5`)}
        {fieldsVisible ? (
          <>
            <SearchableCountryDropdown
              label={labels.country}
              value={signupForm.country}
              options={countryOptions(language)}
              onChange={(value) => updateSignupField("country", value)}
              language={language}
            />
            <FieldLabel text={labels.weddingBudget} />
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={(value) => updateSignupField("weddingBudget", value)}
              placeholder="25000"
              style={styles.input}
              value={signupForm.weddingBudget}
            />
            <Text style={styles.signupStepTitleSmall}>{labels.accountStepTitle}</Text>
            <Text style={styles.signupStepBody}>{labels.accountStepBody}</Text>
            <FieldLabel text={labels.password} />
            <TextInput
              autoCapitalize="none"
              onChangeText={setPassword}
              placeholder={labels.password}
              secureTextEntry
              style={styles.input}
              value={password}
            />
          </>
        ) : null}
      </>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <ExpoStatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.authScroll} keyboardShouldPersistTaps="handled">
        <View style={styles.authShell}>
          <View style={styles.authLogo}>
            <Ionicons name="sparkles-outline" size={22} color={colors.gold} />
          </View>
          <Text style={styles.brand}>The Wedding Market</Text>
          <Text style={styles.authTitle}>{title ?? labels.authTitle}</Text>
          <Text style={styles.body}>{mode === "login" ? labels.loginIntro : labels.createAccountIntro}</Text>

          <View style={styles.authModeSegment}>
            {[
              { key: "login", label: labels.logIn },
              { key: "signup", label: labels.createAccount },
            ].map((item) => (
              <TouchableOpacity
                key={item.key}
                onPress={() => {
                  setMode(item.key as "login" | "signup");
                  if (item.key === "signup") {
                    setSignupStep(0);
                    stepOpacity.setValue(1);
                  }
                  setMessage("");
                  setIsSuccess(false);
                }}
                style={[styles.authModeButton, mode === item.key && styles.authModeButtonActive]}
              >
                <Text style={[styles.authModeText, mode === item.key && styles.authModeTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.form}>
            {mode === "login" ? (
              <>
                <FieldLabel text={labels.email} />
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  style={styles.input}
                  value={email}
                />

                <FieldLabel text={labels.password} />
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setPassword}
                  placeholder={labels.password}
                  secureTextEntry
                  style={styles.input}
                  value={password}
                />

                {message ? <Text style={isSuccess ? styles.successText : styles.errorText}>{message}</Text> : null}

                {pendingConfirmationEmail ? (
                  <TouchableOpacity
                    disabled={isResendingConfirmation}
                    onPress={() => void handleResendConfirmation()}
                    style={[styles.secondaryButton, isResendingConfirmation && styles.primaryButtonDisabled]}
                  >
                    <Ionicons name="mail-outline" size={17} color={colors.tealDark} />
                    <Text style={styles.secondaryButtonText}>
                      {isResendingConfirmation ? labels.resendingConfirmation : labels.resendConfirmation}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  disabled={isSubmitting}
                  onPress={handleSignIn}
                  style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
                >
                  <Text style={styles.primaryButtonText}>{isSubmitting ? labels.signingIn : labels.signIn}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {message ? <Text style={isSuccess ? styles.successText : styles.errorText}>{message}</Text> : null}

                <TouchableOpacity onPress={openSignupModal} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>{labels.startPlanning}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>
      <Modal
        animationType="fade"
        onRequestClose={requestCloseSignupModal}
        presentationStyle="fullScreen"
        visible={isSignupModalOpen}
      >
        <SafeAreaView style={styles.signupModalRoot}>
          <StatusBar barStyle="dark-content" />
          <ExpoStatusBar style="dark" />
          <View style={styles.signupModalHeader}>
            <View style={styles.signupModalLogo}>
              <Text style={styles.signupModalLogoText}>TWM</Text>
            </View>
            <TouchableOpacity onPress={requestCloseSignupModal} style={styles.signupModalCloseButton}>
              <Ionicons name="close" size={22} color={colors.ink} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.signupModalBody} keyboardShouldPersistTaps="handled">
            <View style={styles.signupProgressTrack}>
              <View
                style={[
                  styles.signupProgressFill,
                  { width: `${((signupStep + 1) / signupStepCount) * 100}%` },
                ]}
              />
            </View>

            <Animated.View
              style={[
                styles.signupStepCard,
                {
                  opacity: stepOpacity,
                  transform: [{ translateY: stepTranslateY }],
                },
              ]}
            >
              {renderSignupStep()}
            </Animated.View>

            {message ? <Text style={isSuccess ? styles.successText : styles.errorText}>{message}</Text> : null}
          </ScrollView>
          <View style={styles.signupModalFooter}>
            {signupStep > 0 ? (
              <TouchableOpacity
                disabled={isSubmitting}
                onPress={() => showSignupStep(signupStep - 1)}
                style={styles.signupBackButton}
              >
                <Text style={styles.signupBackText}>{labels.back}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              disabled={isSubmitting || !isStepCopyComplete}
              onPress={signupStep === signupStepCount - 1 ? submitSignup : handleNextSignupStep}
              style={[
                styles.primaryButton,
                styles.signupNextButton,
                signupStep === 0 && styles.signupNextButtonFull,
                (isSubmitting || !isStepCopyComplete) && styles.primaryButtonDisabled,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {signupStep === 0
                  ? labels.startPlanning
                  : signupStep === signupStepCount - 1
                  ? isSubmitting
                    ? labels.creatingAccount
                    : labels.finishCreateAccount
                  : labels.next}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function ProtectedScreen({
  onSignedIn,
  title,
  language,
}: {
  onSignedIn: (nextState: { userEmail: string; profile: AuthProfile | null }) => void;
  title: string;
  language: "en" | "es";
}) {
  return (
    <AuthScreen
      language={language}
      title={title}
      onSignedIn={onSignedIn}
    />
  );
}

function formatCategory(category: string) {
  return category
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function formatMoney(cents?: number | null, currency = "USD", language: "en" | "es" = "en") {
  if (typeof cents !== "number" || !Number.isFinite(cents)) {
    return copy[language].contactForPrice;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function VendorCard({
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

function vendorLocationLabel(vendor: VendorListItem) {
  return [vendor.city, vendor.region, vendor.country].filter(Boolean).join(", ");
}

function hasVendorCoordinates(vendor: VendorListItem) {
  return (
    typeof vendor.lat === "number" &&
    Number.isFinite(vendor.lat) &&
    typeof vendor.lng === "number" &&
    Number.isFinite(vendor.lng)
  );
}

function SearchMapResults({
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

function VendorSearchScreen({
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

function FavoritesScreen({
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

function VendorLogoCarousel({ language }: { language: "en" | "es" }) {
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

function RequestQuoteModal({
  visible,
  vendors,
  profile,
  userEmail,
  language,
  onClose,
  onSent,
}: {
  visible: boolean;
  vendors: VendorListItem[];
  profile: AuthProfile | null;
  userEmail: string | null;
  language: "en" | "es";
  onClose: () => void;
  onSent: () => void;
}) {
  const labels = copy[language];
  const primaryVendor = vendors[0] ?? null;
  const isBatch = vendors.length > 1;
  const nameParts = (profile?.fullName ?? "").trim().split(/\s+/).filter(Boolean);
  const [form, setForm] = useState<QuoteRequestInput>({
    vendorId: primaryVendor?.id ?? "",
    firstName: nameParts[0] ?? "",
    lastName: nameParts.slice(1).join(" "),
    email: userEmail ?? "",
    phone: "",
    eventDate: "",
    flexible: false,
    guestCount: "",
    budgetMin: "",
    budgetMax: "",
    city: "",
    state: "",
    country: "United States",
    language,
    theme: "",
    message: "",
  });
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!visible || !primaryVendor) return;
    const latestNameParts = (profile?.fullName ?? "").trim().split(/\s+/).filter(Boolean);
    setForm((current) => ({
      ...current,
      vendorId: primaryVendor.id,
      firstName: current.firstName || latestNameParts[0] || "",
      lastName: current.lastName || latestNameParts.slice(1).join(" "),
      email: current.email || userEmail || "",
      language,
      message: current.message || (language === "en" ? "Hi, I would like to request a quote for my wedding." : "Hola, me gustaria solicitar una cotización para mi boda."),
    }));
    setStatus("");
  }, [visible, primaryVendor?.id, userEmail, profile?.fullName, language]);

  function updateField<Key extends keyof QuoteRequestInput>(key: Key, value: QuoteRequestInput[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    setStatus("");
    setIsSubmitting(true);
    try {
      await createQuoteRequests(form, vendors.map((vendor) => vendor.id));
      setStatus(isBatch
        ? language === "en"
          ? `One request was sent to ${vendors.length} vendors. Each private conversation is available in your inbox.`
          : `Se envió una solicitud a ${vendors.length} proveedores. Cada conversación privada está disponible en mensajes.`
        : labels.requestSent);
      onSent();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to send request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.quoteModal}>
          <View style={styles.quoteModalHandle} />
          <View style={styles.quoteModalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>{labels.requestQuote}</Text>
              <Text style={styles.title}>
                {isBatch ? `${vendors.length} saved vendors` : primaryVendor?.business_name ?? "Vendor"}
              </Text>
              {isBatch ? <Text style={styles.body}>{labels.quoteBatchHint}</Text> : null}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={22} color={colors.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.quoteModalBody}>
            <View style={styles.formTwoColumn}>
              <View style={styles.formHalf}>
                <FieldLabel text={labels.firstName} />
                <TextInput style={styles.input} value={form.firstName} onChangeText={(value) => updateField("firstName", value)} />
              </View>
              <View style={styles.formHalf}>
                <FieldLabel text={labels.lastName} />
                <TextInput style={styles.input} value={form.lastName} onChangeText={(value) => updateField("lastName", value)} />
              </View>
            </View>
            <FieldLabel text={labels.email} />
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              value={form.email}
              onChangeText={(value) => updateField("email", value)}
            />
            <FieldLabel text={labels.phone} />
            <TextInput keyboardType="phone-pad" style={styles.input} value={form.phone} onChangeText={(value) => updateField("phone", value)} />
            <View style={styles.formTwoColumn}>
              <View style={styles.formHalf}>
                <FieldLabel text={labels.eventDate} />
                <TextInput placeholder="YYYY-MM-DD" style={styles.input} value={form.eventDate} onChangeText={(value) => updateField("eventDate", value)} />
              </View>
              <View style={styles.formHalf}>
                <FieldLabel text={labels.guests} />
                <TextInput keyboardType="number-pad" style={styles.input} value={form.guestCount} onChangeText={(value) => updateField("guestCount", value)} />
              </View>
            </View>
            <TouchableOpacity onPress={() => updateField("flexible", !form.flexible)} style={styles.checkboxRow}>
              <Ionicons name={form.flexible ? "checkbox" : "square-outline"} size={20} color={colors.tealDark} />
              <Text style={styles.checkboxText}>{labels.flexibleDate}</Text>
            </TouchableOpacity>
            <View style={styles.formTwoColumn}>
              <View style={styles.formHalf}>
                <FieldLabel text={labels.budgetMin} />
                <TextInput keyboardType="number-pad" style={styles.input} value={form.budgetMin} onChangeText={(value) => updateField("budgetMin", value)} />
              </View>
              <View style={styles.formHalf}>
                <FieldLabel text={labels.budgetMax} />
                <TextInput keyboardType="number-pad" style={styles.input} value={form.budgetMax} onChangeText={(value) => updateField("budgetMax", value)} />
              </View>
            </View>
            <FieldLabel text={labels.city} />
            <TextInput style={styles.input} value={form.city} onChangeText={(value) => updateField("city", value)} />
            <View style={styles.formTwoColumn}>
              <View style={styles.formHalf}>
                <FieldLabel text={labels.state} />
                <TextInput style={styles.input} value={form.state} onChangeText={(value) => updateField("state", value)} />
              </View>
              <View style={styles.formHalf}>
                <FieldLabel text={labels.country} />
                <TextInput style={styles.input} value={form.country} onChangeText={(value) => updateField("country", value)} />
              </View>
            </View>
            <NativeSelect
              label={labels.weddingTheme}
              value={form.theme}
              options={themeOptions(language)}
              onChange={(value) => updateField("theme", value)}
            />
            <FieldLabel text={labels.messageVendor} />
            <TextInput
              maxLength={2000}
              multiline
              style={[styles.input, styles.textArea]}
              value={form.message}
              onChangeText={(value) => updateField("message", value)}
            />
            {status ? (
              <Text style={status.includes("sent") || status.includes("enviada") ? styles.successText : styles.errorText}>{status}</Text>
            ) : null}
            <TouchableOpacity disabled={isSubmitting} onPress={submit} style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}>
              <Ionicons name="send-outline" size={17} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>{isSubmitting ? labels.sending : labels.sendRequest}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function FieldLabel({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

function NativeSelect({
  label,
  value,
  options,
  onChange,
  helper,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  helper?: string;
}) {
  return (
    <View style={styles.nativeSelectBlock}>
      <View style={styles.nativeSelectHeader}>
        <FieldLabel text={label} />
        {helper ? <Text style={styles.nativeSelectHelper}>{helper}</Text> : null}
      </View>
      <View style={styles.nativeSelectOptions}>
        {options.map((option) => {
          const isActive = option.value === value;
          return (
            <TouchableOpacity
              key={option.value || "empty"}
              onPress={() => onChange(option.value)}
              style={[styles.nativeSelectPill, isActive && styles.nativeSelectPillActive]}
            >
              <Text style={[styles.nativeSelectText, isActive && styles.nativeSelectTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function SearchableCountryDropdown({
  label,
  value,
  options,
  onChange,
  language,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  language: "en" | "es";
}) {
  const labels = copy[language];
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedLabel = options.find((option) => option.value === value)?.label ?? value;
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter((option) => {
        const labelText = option.label.toLowerCase();
        const valueText = option.value.toLowerCase();
        return labelText.includes(normalizedQuery) || valueText.includes(normalizedQuery);
      })
    : options;

  return (
    <View style={styles.countryDropdownBlock}>
      <FieldLabel text={label} />
      <TouchableOpacity
        onPress={() => setIsOpen((current) => !current)}
        style={[styles.countryDropdownTrigger, isOpen && styles.countryDropdownTriggerActive]}
      >
        <Text style={[styles.countryDropdownValue, !selectedLabel && styles.countryDropdownPlaceholder]}>
          {selectedLabel || labels.searchCountry}
        </Text>
        <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={18} color={colors.ink} />
      </TouchableOpacity>

      {isOpen ? (
        <View style={styles.countryDropdownMenu}>
          <View style={styles.countrySearchInputWrap}>
            <Ionicons name="search-outline" size={17} color={colors.muted} />
            <TextInput
              autoCapitalize="words"
              onChangeText={setQuery}
              placeholder={labels.searchCountry}
              style={styles.countrySearchInput}
              value={query}
            />
          </View>
          <ScrollView nestedScrollEnabled style={styles.countryOptionsList} keyboardShouldPersistTaps="handled">
            {filteredOptions.length ? (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => {
                      onChange(option.value);
                      setQuery("");
                      setIsOpen(false);
                    }}
                    style={[styles.countryOptionRow, isSelected && styles.countryOptionRowActive]}
                  >
                    <Text style={[styles.countryOptionText, isSelected && styles.countryOptionTextActive]}>
                      {option.label}
                    </Text>
                    {isSelected ? <Ionicons name="checkmark" size={17} color={colors.ink} /> : null}
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={styles.countryNoResults}>{labels.noCountryResults}</Text>
            )}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

function AccountProfileScreen({
  userEmail,
  language,
  onProfileUpdated,
  onLanguageUpdated,
}: {
  userEmail: string | null;
  language: "en" | "es";
  onProfileUpdated: (profile: AuthProfile | null) => void;
  onLanguageUpdated: (language: "en" | "es") => void;
}) {
  const [form, setForm] = useState<ClientProfileForm>({
    full_name: "",
    phone: "",
    country: "",
    language: "en",
    tentative_wedding_date: "",
    guest_count: "",
    wedding_budget: "",
    wedding_theme: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setIsLoading(true);
      setMessage("");

      try {
        const {
          data: { user },
        } = await supabase!.auth.getUser();

        if (!user) {
          if (isMounted) setMessage("Sign in to manage your profile.");
          return;
        }

        const { data, error } = await supabase!
          .from("profiles")
          .select("full_name, phone, country, tentative_wedding_date, guest_count, wedding_budget, wedding_theme, language")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (isMounted) {
          setForm({
            full_name: typeof data?.full_name === "string" ? data.full_name : "",
            phone: typeof data?.phone === "string" ? data.phone : "",
            country: typeof data?.country === "string" ? data.country : "",
            language: data?.language === "es" ? "es" : "en",
            tentative_wedding_date:
              typeof data?.tentative_wedding_date === "string" ? data.tentative_wedding_date : "",
            guest_count: typeof data?.guest_count === "number" ? String(data.guest_count) : "",
            wedding_budget: typeof data?.wedding_budget === "number" ? String(data.wedding_budget) : "",
            wedding_theme: typeof data?.wedding_theme === "string" ? data.wedding_theme : "",
          });
          onLanguageUpdated(data?.language === "es" ? "es" : "en");
        }
      } catch (error) {
        if (isMounted) setMessage(error instanceof Error ? error.message : "Unable to load profile.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (supabase) void loadProfile();
    else {
      setIsLoading(false);
      setMessage("Supabase is not configured.");
    }

    return () => {
      isMounted = false;
    };
  }, []);

  function updateField<K extends keyof ClientProfileForm>(key: K, value: ClientProfileForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    if (!supabase) return;

    setIsSaving(true);
    setMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Sign in to save your profile.");

      const guestCount = form.guest_count.trim() ? Number(form.guest_count) : null;
      const budget = form.wedding_budget.trim() ? Number(form.wedding_budget) : null;

      if (guestCount !== null && (!Number.isFinite(guestCount) || guestCount < 1)) {
        throw new Error("Guest count must be a positive number.");
      }
      if (budget !== null && (!Number.isFinite(budget) || budget < 0)) {
        throw new Error("Budget must be zero or greater.");
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name.trim(),
          phone: form.phone.trim() || null,
          country: form.country.trim() || null,
          language: form.language,
          tentative_wedding_date: form.tentative_wedding_date || null,
          guest_count: guestCount,
          wedding_budget: budget,
          wedding_theme: form.wedding_theme || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      await supabase.auth.updateUser({
        data: { full_name: form.full_name.trim() },
      });

      const nextProfile = await loadAuthState();
      onProfileUpdated(nextProfile.profile);
      onLanguageUpdated(form.language);
      setMessage(form.language === "en" ? "Profile saved." : "Perfil guardado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save profile.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.searchState}>
        <ActivityIndicator color={colors.ink} />
        <Text style={styles.loadingText}>{copy[language].loadingProfile}</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.profileHero}>
        <View style={styles.profileAvatar}>
          <Ionicons name="person" size={30} color={colors.paper} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>{copy[form.language].accountProfile}</Text>
          <Text style={styles.title}>{form.full_name || userEmail || (language === "en" ? "Your planning profile" : "Tu perfil de planeación")}</Text>
          <Text style={styles.body}>
            {copy[form.language].currentLanguage}: {form.language === "es" ? copy[form.language].spanish : copy[form.language].english}
          </Text>
        </View>
      </View>

      {message ? (
        <View style={message === "Profile saved." || message === "Perfil guardado." ? styles.successBanner : styles.errorBanner}>
          <Text style={message === "Profile saved." || message === "Perfil guardado." ? styles.successBannerText : styles.errorBannerText}>
            {message}
          </Text>
        </View>
      ) : null}

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>{copy[form.language].contact}</Text>
        <FieldLabel text={form.language === "en" ? "Full name" : "Nombre completo"} />
        <TextInput
          autoComplete="name"
          onChangeText={(value) => updateField("full_name", value)}
          placeholder={copy[form.language].yourName}
          style={styles.input}
          value={form.full_name}
        />

        <FieldLabel text={copy[form.language].phone} />
        <TextInput
          autoComplete="tel"
          keyboardType="phone-pad"
          onChangeText={(value) => updateField("phone", value)}
          placeholder={copy[form.language].phoneNumber}
          style={styles.input}
          value={form.phone}
        />

        <FieldLabel text={copy[form.language].email} />
        <TextInput editable={false} style={[styles.input, styles.inputDisabled]} value={userEmail ?? ""} />

        <FieldLabel text={copy[form.language].country} />
        <TextInput
          autoComplete="country"
          onChangeText={(value) => updateField("country", value)}
          placeholder={copy[form.language].country}
          style={styles.input}
          value={form.country}
        />

        <NativeSelect
          label={copy[form.language].preferredLanguage}
          value={form.language}
          helper={form.language === "en" ? `${copy[form.language].english} selected` : `${copy[form.language].spanish} seleccionado`}
          options={[
            { value: "en", label: copy[form.language].english },
            { value: "es", label: copy[form.language].spanish },
          ]}
          onChange={(value) => updateField("language", value === "es" ? "es" : "en")}
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>{copy[form.language].weddingPreferences}</Text>
        <FieldLabel text={form.language === "en" ? "Tentative wedding date" : "Fecha tentativa de boda"} />
        <TextInput
          onChangeText={(value) => updateField("tentative_wedding_date", value)}
          placeholder="YYYY-MM-DD"
          style={styles.input}
          value={form.tentative_wedding_date}
        />

        <FieldLabel text={form.language === "en" ? "Guest count" : "Cantidad de invitados"} />
        <TextInput
          keyboardType="number-pad"
          onChangeText={(value) => updateField("guest_count", value)}
          placeholder="120"
          style={styles.input}
          value={form.guest_count}
        />

        <FieldLabel text={form.language === "en" ? "Wedding budget" : "Presupuesto de boda"} />
        <TextInput
          keyboardType="decimal-pad"
          onChangeText={(value) => updateField("wedding_budget", value)}
          placeholder="25000"
          style={styles.input}
          value={form.wedding_budget}
        />

        <NativeSelect
          label={copy[form.language].weddingTheme}
          value={form.wedding_theme}
          options={themeOptions(form.language)}
          onChange={(value) => updateField("wedding_theme", value)}
        />

        <TouchableOpacity
          disabled={isSaving}
          onPress={handleSave}
          style={[styles.primaryButton, isSaving && styles.primaryButtonDisabled]}
        >
          <Text style={styles.primaryButtonText}>{isSaving ? copy[form.language].saving : copy[form.language].saveProfile}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>{copy[form.language].accountControls}</Text>
        <TouchableOpacity onPress={() => void openPublicWebPath("/privacy")} style={styles.secondaryButton}>
          <Ionicons name="shield-checkmark-outline" size={17} color={colors.tealDark} />
          <Text style={styles.secondaryButtonText}>{copy[form.language].privacyPolicy}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => void openPublicWebPath("/terms")} style={styles.secondaryButton}>
          <Ionicons name="document-text-outline" size={17} color={colors.tealDark} />
          <Text style={styles.secondaryButtonText}>{copy[form.language].termsOfService}</Text>
        </TouchableOpacity>
        <Text style={styles.body}>{copy[form.language].deleteAccountHelp}</Text>
        <TouchableOpacity
          onPress={() => {
            void openPublicWebPath("/account-deletion");
          }}
          style={styles.secondaryButton}
        >
          <Ionicons name="trash-outline" size={17} color="#B42318" />
          <Text style={[styles.secondaryButtonText, styles.accountMenuDanger]}>{copy[form.language].deleteAccount}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function DashboardStat({ icon, label, value }: { icon: IconName; label: string; value: string | number }) {
  return (
    <View style={styles.dashboardStat}>
      <Ionicons name={icon} size={20} color={colors.ink} />
      <Text style={styles.dashboardStatValue}>{value}</Text>
      <Text style={styles.dashboardStatLabel}>{label}</Text>
    </View>
  );
}

function imageUrlFromAsset(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const url = (value as Record<string, unknown>).url;
  return typeof url === "string" && url.trim() ? url : null;
}

function AdminDashboardScreen({ language }: { language: "en" | "es" }) {
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

const vendorEditorTabs: { key: VendorEditorTab; label: string; icon: IconName }[] = [
  { key: "details", label: "Details", icon: "create-outline" },
  { key: "contact", label: "Contact", icon: "call-outline" },
  { key: "pricing", label: "Pricing", icon: "cash-outline" },
  { key: "amenities", label: "Amenities", icon: "checkmark-circle-outline" },
  { key: "team", label: "Team", icon: "people-outline" },
  { key: "availability", label: "Dates", icon: "calendar-outline" },
  { key: "reviews", label: "Reviews", icon: "star-outline" },
  { key: "images", label: "Images", icon: "images-outline" },
];

const pricingKeys = ["reception", "ceremony", "bar", "catering"];

function VendorWorkspaceScreen({ language }: { language: "en" | "es" }) {
  const labels = copy[language];
  const [data, setData] = useState<VendorEditorData | null>(null);
  const [activeTab, setActiveTab] = useState<VendorEditorTab>("details");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [message, setMessage] = useState("");
  const [editorLanguage, setEditorLanguage] = useState<"en" | "es">(language);

  const [details, setDetails] = useState<Record<string, string>>({});
  const [contact, setContact] = useState<Record<string, string>>({});
  const [pricingMeta, setPricingMeta] = useState<Record<string, string>>({});
  const [pricingRows, setPricingRows] = useState<Record<string, string>[]>([]);
  const [amenityKeys, setAmenityKeys] = useState<string[]>([]);
  const [amenityMeta, setAmenityMeta] = useState<Record<string, string>>({});
  const [teamRows, setTeamRows] = useState<Record<string, string>[]>([]);
  const [availabilityRows, setAvailabilityRows] = useState<Record<string, string>[]>([]);
  const [reviews, setReviews] = useState<Record<string, string>>({});

  useEffect(() => {
    setEditorLanguage(language);
  }, [language]);

  async function refreshVendor() {
    setIsLoading(true);
    setMessage("");
    try {
      const next = await loadVendorEditorData();
      setData(next);
      if (next) hydrateVendorEditor(next);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load vendor profile.");
    } finally {
      setIsLoading(false);
    }
  }

  function hydrateVendorEditor(next: VendorEditorData) {
    const vendor = next.vendor;
    const extraInfo = (vendor.extra_info ?? {}) as Record<string, unknown>;
    setDetails({
      business_name: String(vendor.business_name ?? ""),
      slug: String(vendor.slug ?? ""),
      bio_en: localizedText(vendor.bio, "en"),
      bio_es: localizedText(vendor.bio, "es"),
      extra_info_en: String(extraInfo.en ?? ""),
      extra_info_es: String(extraInfo.es ?? ""),
    });
    setContact({
      phone: String(vendor.phone ?? ""),
      website_url: String(vendor.website_url ?? ""),
      map_url: String(vendor.map_url ?? ""),
      address_label: String(vendor.address_label ?? ""),
      starting_price: typeof vendor.starting_price_cents === "number" ? String(vendor.starting_price_cents / 100) : "",
      starting_price_currency: String(vendor.starting_price_currency ?? "USD"),
      event_types: Array.isArray(vendor.event_types) ? vendor.event_types.join(", ") : "",
      years_in_business: vendor.years_in_business ? String(vendor.years_in_business) : "",
      languages: Array.isArray(vendor.languages) ? vendor.languages.join(", ") : "",
      team_size_range: String(vendor.team_size_range ?? ""),
    });
    setPricingMeta({
      typical_spend: typeof vendor.pricing_typical_spend_cents === "number" ? String(vendor.pricing_typical_spend_cents / 100) : "",
      typical_currency: String(vendor.pricing_typical_spend_currency ?? vendor.starting_price_currency ?? "USD"),
      peak_seasons: Array.isArray(vendor.pricing_peak_seasons) ? vendor.pricing_peak_seasons.join(", ") : "",
    });
    setPricingRows(pricingKeys.map((key) => {
      const row = next.pricing.find((item) => item.item_key === key);
      return {
        item_key: key,
        price: typeof row?.price_cents === "number" ? String(row.price_cents / 100) : "",
        contact_for_price: row?.contact_for_price ? "true" : "false",
        notes: localizedText(row?.notes, "en"),
      };
    }));
    setAmenityKeys(next.selectedAmenities);
    setAmenityMeta({
      capacity_max: vendor.capacity_max ? String(vendor.capacity_max) : "",
      event_types: Array.isArray(vendor.event_types) ? vendor.event_types.join(", ") : "",
    });
    setTeamRows(next.team.length ? next.team.map((member) => ({
      name: String(member.name ?? ""),
      title_en: localizedText(member.title, "en"),
      title_es: localizedText(member.title, "es"),
      bio_en: localizedText(member.bio, "en"),
      bio_es: localizedText(member.bio, "es"),
      headshot_url: String(member.headshot_url ?? ""),
      responds_within_hours: member.responds_within_hours ? String(member.responds_within_hours) : "",
    })) : [{ name: "", title_en: "", title_es: "", bio_en: "", bio_es: "", headshot_url: "", responds_within_hours: "" }]);
    setAvailabilityRows(next.availability.length ? next.availability.map((date) => ({
      date: String(date.available_on ?? ""),
      status: date.availability_status === "busy" ? "busy" : "available",
    })) : [{ date: "", status: "available" }]);
    setReviews({
      review_ai_summary: String(vendor.review_ai_summary ?? ""),
      google_business_profile_url: String(extraInfo.google_business_profile_url ?? ""),
    });
  }

  useEffect(() => {
    void refreshVendor();
  }, []);

  async function saveCurrentTab() {
    if (!data?.vendor?.id) return;
    const vendorId = String(data.vendor.id);
    setIsSaving(true);
    setMessage("");
    try {
      if (activeTab === "details") await saveVendorDetails(vendorId, details);
      if (activeTab === "contact") await saveVendorContact(vendorId, contact);
      if (activeTab === "pricing") await saveVendorPricing(vendorId, pricingMeta, pricingRows);
      if (activeTab === "amenities") await saveVendorAmenities(vendorId, amenityKeys, amenityMeta);
      if (activeTab === "team") await saveVendorTeam(vendorId, teamRows);
      if (activeTab === "availability") await saveVendorAvailability(vendorId, availabilityRows);
      if (activeTab === "reviews") await saveVendorReviews(vendorId, reviews, data.vendor.extra_info ?? null);
      setMessage(labels.saved);
      await refreshVendor();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : labels.saveFailed);
    } finally {
      setIsSaving(false);
    }
  }

  async function pickAndUpload(target: string) {
    const isGalleryUpload = target === "vendor-gallery";
    const aspect: [number, number] =
      target === "vendor-logo" ? [1, 1] :
      target === "vendor-hero" ? [16, 9] :
      target === "vendor-thumbnail" ? [4, 3] :
      [4, 3];
    setIsSaving(true);
    setIsUploading(true);
    setUploadProgress(5);
    setUploadStatus(language === "en" ? "Preparing upload..." : "Preparando carga...");
    setMessage("");
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) throw new Error("Photo library permission is required.");
      setUploadProgress(12);
      setUploadStatus(language === "en" ? "Opening photo library..." : "Abriendo galería...");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: !isGalleryUpload,
        allowsMultipleSelection: isGalleryUpload,
        aspect,
        quality: 0.88,
      });
      if (result.canceled) {
        setUploadProgress(0);
        setUploadStatus("");
        return;
      }
      const total = result.assets.length;
      setUploadProgress(18);
      for (const [index, asset] of result.assets.entries()) {
        setUploadStatus(language === "en" ? `Uploading ${index + 1} of ${total}...` : `Subiendo ${index + 1} de ${total}...`);
        await uploadVendorMedia(target, {
          uri: asset.uri,
          name: asset.fileName ?? `${target}-${Date.now()}.jpg`,
          type: asset.mimeType ?? "image/jpeg",
        });
        setUploadProgress(Math.round(18 + ((index + 1) / total) * 72));
      }
      setUploadStatus(language === "en" ? "Refreshing current images..." : "Actualizando imágenes...");
      setUploadProgress(94);
      await refreshVendor();
      setUploadProgress(100);
      setUploadStatus(language === "en" ? `${total} image${total === 1 ? "" : "s"} uploaded successfully.` : `${total} imagen${total === 1 ? "" : "es"} subida${total === 1 ? "" : "s"} correctamente.`);
    } catch (error) {
      setUploadProgress(0);
      setUploadStatus("");
      setMessage(error instanceof Error ? error.message : language === "en" ? "Upload failed." : "Error al subir.");
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  }

  async function pickTeamHeadshot(index: number) {
    setIsSaving(true);
    setIsUploading(true);
    setUploadProgress(5);
    setUploadStatus(language === "en" ? "Preparing team photo..." : "Preparando foto del equipo...");
    setMessage("");
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) throw new Error("Photo library permission is required.");
      setUploadProgress(20);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        allowsMultipleSelection: false,
        aspect: [1, 1],
        quality: 0.88,
      });
      if (result.canceled || !result.assets[0]) {
        setUploadProgress(0);
        setUploadStatus("");
        return;
      }
      const asset = result.assets[0];
      setUploadStatus(language === "en" ? "Uploading team photo..." : "Subiendo foto del equipo...");
      setUploadProgress(45);
      const upload = await uploadVendorMedia("vendor-team-headshot", {
        uri: asset.uri,
        name: asset.fileName ?? `team-headshot-${Date.now()}.jpg`,
        type: asset.mimeType ?? "image/jpeg",
      });
      const url = uploadedAssetUrl(upload);
      if (!url) throw new Error(language === "en" ? "Upload completed but no image URL was returned." : "La carga termino pero no devolvio URL de imagen.");
      setTeamRows((current) => current.map((member, memberIndex) => (
        memberIndex === index ? { ...member, headshot_url: url } : member
      )));
      setUploadProgress(100);
      setUploadStatus(language === "en" ? "Team photo uploaded. Save the Team tab to publish it." : "Foto del equipo subida. Guarda la pestana Equipo para publicarla.");
    } catch (error) {
      setUploadProgress(0);
      setUploadStatus("");
      setMessage(error instanceof Error ? error.message : language === "en" ? "Upload failed." : "Error al subir.");
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.searchState}>
        <ActivityIndicator color={colors.ink} />
        <Text style={styles.loadingText}>{labels.vendorWorkspace}</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.panel}>
        <Text style={styles.kicker}>{labels.vendorWorkspace}</Text>
        <Text style={styles.title}>{labels.noVendorProfile}</Text>
        {message ? <Text style={styles.errorText}>{message}</Text> : null}
      </View>
    );
  }

  const vendor = data.vendor;
  const gallery = Array.isArray(vendor.gallery_images) ? vendor.gallery_images : [];
  const galleryWithUrls = gallery.filter((item): item is { url: string } => typeof item.url === "string" && item.url.trim().length > 0);
  const firstGalleryUrl = galleryWithUrls.map((item) => item.url).find(Boolean) ?? null;
  const logoUrl = typeof vendor.logo_url === "string" ? vendor.logo_url : null;
  const heroUrl = imageUrlFromAsset(vendor.hero_image) ?? imageUrlFromAsset(vendor.thumbnail_image) ?? firstGalleryUrl ?? logoUrl;
  const businessName = String(vendor.business_name ?? "Vendor");

  return (
    <View>
      <View style={styles.vendorWorkspaceHero}>
        {heroUrl ? <Image source={{ uri: heroUrl }} style={styles.vendorWorkspaceImage} /> : null}
        <View style={styles.vendorWorkspaceOverlay} />
        <View style={styles.vendorWorkspaceCopy}>
          <Text style={styles.heroBadge}>{labels.vendorProfile}</Text>
          <Text style={styles.detailTitle}>{businessName}</Text>
          <Text style={styles.detailCategories}>{vendor.is_published ? labels.published : labels.draft}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.editorTabs}>
        {vendorEditorTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.editorTab, activeTab === tab.key && styles.editorTabActive]}
          >
            <Ionicons name={tab.icon} size={15} color={activeTab === tab.key ? colors.paper : colors.tealDark} />
            <Text style={[styles.editorTabText, activeTab === tab.key && styles.editorTabTextActive]}>{copy[language][tab.key]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {message ? (
        <View style={message === labels.saved ? styles.successBanner : styles.errorBanner}>
          <Text style={message === labels.saved ? styles.successBannerText : styles.errorBannerText}>{message}</Text>
        </View>
      ) : null}

      <View style={styles.editorPanel}>
        {activeTab === "details" ? (
          <View style={styles.form}>
            <LanguageSegment value={editorLanguage} language={language} onChange={setEditorLanguage} />
            <VendorFieldGroup values={details} setValues={setDetails} fields={[
              ["business_name", labels.businessName],
              ["slug", labels.slug],
              [`bio_${editorLanguage}`, editorLanguage === "en" ? labels.bioEnglish : labels.bioSpanish, "multiline"],
              [`extra_info_${editorLanguage}`, editorLanguage === "en" ? labels.extraInfoEnglish : labels.extraInfoSpanish, "multiline"],
            ]} />
          </View>
        ) : null}

        {activeTab === "contact" ? (
          <VendorFieldGroup values={contact} setValues={setContact} fields={[
            ["phone", labels.phone],
            ["website_url", labels.website],
            ["map_url", labels.mapUrl],
            ["address_label", labels.address],
            ["starting_price", labels.startingPrice],
            ["starting_price_currency", labels.currency],
            ["event_types", labels.eventTypes],
            ["years_in_business", labels.yearsInBusiness],
            ["languages", labels.languages],
            ["team_size_range", labels.teamSize],
          ]} />
        ) : null}

        {activeTab === "pricing" ? (
          <View style={styles.form}>
            <VendorFieldGroup values={pricingMeta} setValues={setPricingMeta} fields={[
              ["typical_spend", labels.typicalSpend],
              ["typical_currency", labels.currency],
              ["peak_seasons", labels.peakSeasons],
            ]} />
            {pricingRows.map((row, index) => (
              <View key={row.item_key} style={styles.editorSubCard}>
                <Text style={styles.sectionTitle}>{formatCategory(row.item_key)}</Text>
                <FieldLabel text={labels.price} />
                <TextInput style={styles.input} value={row.price} onChangeText={(value) => setPricingRows((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, price: value } : item))} />
                <TouchableOpacity
                  onPress={() => setPricingRows((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, contact_for_price: item.contact_for_price === "true" ? "false" : "true" } : item))}
                  style={styles.checkboxRow}
                >
                  <Ionicons name={row.contact_for_price === "true" ? "checkbox" : "square-outline"} size={20} color={colors.tealDark} />
                  <Text style={styles.checkboxText}>{labels.contactForPrice}</Text>
                </TouchableOpacity>
                <FieldLabel text={labels.notes} />
                <TextInput multiline style={[styles.input, styles.textArea]} value={row.notes} onChangeText={(value) => setPricingRows((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, notes: value } : item))} />
              </View>
            ))}
          </View>
        ) : null}

        {activeTab === "amenities" ? (
          <View style={styles.form}>
            <VendorFieldGroup values={amenityMeta} setValues={setAmenityMeta} fields={[
              ["capacity_max", labels.maxCapacity],
              ["event_types", labels.eventTypes],
            ]} />
            <View style={styles.detailChips}>
              {data.amenityOptions.map((option) => {
                const key = String(option.key);
                const selected = amenityKeys.includes(key);
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setAmenityKeys((current) => selected ? current.filter((item) => item !== key) : [...current, key])}
                    style={[styles.detailChip, selected && styles.editorChipSelected]}
                  >
                    <Text style={styles.detailChipText}>{localizedText(option.label, language) || formatCategory(key)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

        {activeTab === "team" ? (
          <View style={styles.form}>
            <LanguageSegment value={editorLanguage} language={language} onChange={setEditorLanguage} />
            {teamRows.map((member, index) => (
              <View key={index} style={styles.editorSubCard}>
                <CurrentMediaPreview
                  compact
                  fallback={member.name ? member.name.slice(0, 1).toUpperCase() : "T"}
                  label={labels.currentHeadshot}
                  url={member.headshot_url || null}
                />
                <TouchableOpacity
                  disabled={isSaving}
                  onPress={() => void pickTeamHeadshot(index)}
                  style={styles.secondaryButton}
                >
                  <Ionicons name="cloud-upload-outline" size={16} color={colors.tealDark} />
                  <Text style={styles.secondaryButtonText}>{labels.uploadHeadshot}</Text>
                </TouchableOpacity>
                <VendorFieldGroup values={member} setValues={(updater) => setTeamRows((current) => current.map((item, itemIndex) => itemIndex === index ? (typeof updater === "function" ? updater(item) : updater) : item))} fields={[
                  ["name", language === "en" ? "Name" : "Nombre"],
                  [`title_${editorLanguage}`, editorLanguage === "en" ? labels.titleEnglish : labels.titleSpanish],
                  [`bio_${editorLanguage}`, editorLanguage === "en" ? labels.bioEnglish : labels.bioSpanish, "multiline"],
                  ["responds_within_hours", language === "en" ? "Responds within hours" : "Responde en horas"],
                ]} />
              </View>
            ))}
            <TouchableOpacity onPress={() => setTeamRows((current) => [...current, { name: "", title_en: "", title_es: "", bio_en: "", bio_es: "", headshot_url: "", responds_within_hours: "" }])} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>{labels.addTeamMember}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {activeTab === "availability" ? (
          <View style={styles.form}>
            <Text style={styles.body}>{labels.availabilityHelp}</Text>
            <EditableAvailabilityCalendar dates={availabilityRows} language={language} onChange={setAvailabilityRows} />
          </View>
        ) : null}

        {activeTab === "reviews" ? (
          <VendorFieldGroup values={reviews} setValues={setReviews} fields={[
            ["review_ai_summary", labels.reviewSummary, "multiline"],
            ["google_business_profile_url", labels.googleProfileUrl],
          ]} />
        ) : null}

        {activeTab === "images" ? (
          <View style={styles.form}>
            <View style={styles.currentMediaGrid}>
              <CurrentMediaPreview
                label={labels.logo}
                url={logoUrl}
                fallback={businessName.slice(0, 2).toUpperCase()}
                compact
              />
              <CurrentMediaPreview
                label={labels.hero}
                url={imageUrlFromAsset(vendor.hero_image)}
                fallback={labels.noHero}
              />
              <CurrentMediaPreview
                label={labels.thumbnail}
                url={imageUrlFromAsset(vendor.thumbnail_image)}
                fallback={labels.noThumb}
              />
            </View>
            <Text style={styles.kicker}>{labels.uploadOrReplace}</Text>
            <View style={styles.imageUploadGrid}>
              <TouchableOpacity disabled={isUploading} onPress={() => void pickAndUpload("vendor-logo")} style={[styles.imageUploadButton, isUploading && styles.primaryButtonDisabled]}><Ionicons name="ribbon-outline" size={18} color={colors.tealDark} /><Text style={styles.secondaryButtonText}>{labels.logo}</Text></TouchableOpacity>
              <TouchableOpacity disabled={isUploading} onPress={() => void pickAndUpload("vendor-hero")} style={[styles.imageUploadButton, isUploading && styles.primaryButtonDisabled]}><Ionicons name="image-outline" size={18} color={colors.tealDark} /><Text style={styles.secondaryButtonText}>{labels.hero}</Text></TouchableOpacity>
              <TouchableOpacity disabled={isUploading} onPress={() => void pickAndUpload("vendor-thumbnail")} style={[styles.imageUploadButton, isUploading && styles.primaryButtonDisabled]}><Ionicons name="albums-outline" size={18} color={colors.tealDark} /><Text style={styles.secondaryButtonText}>{labels.thumbnail}</Text></TouchableOpacity>
              <TouchableOpacity disabled={isUploading} onPress={() => void pickAndUpload("vendor-gallery")} style={[styles.imageUploadButton, isUploading && styles.primaryButtonDisabled]}><Ionicons name="images-outline" size={18} color={colors.tealDark} /><Text style={styles.secondaryButtonText}>{labels.gallery}</Text></TouchableOpacity>
            </View>
            {uploadStatus ? (
              <View style={styles.uploadProgressCard}>
                <View style={styles.uploadProgressHeader}>
                  <Text style={styles.uploadProgressTitle}>{isUploading ? labels.uploading : labels.completed}</Text>
                  <Text style={styles.uploadProgressPercent}>{uploadProgress}%</Text>
                </View>
                <View style={styles.uploadProgressTrack}>
                  <View style={[styles.uploadProgressFill, { width: `${uploadProgress}%` }]} />
                </View>
                <Text style={styles.uploadProgressStatus}>{uploadStatus}</Text>
              </View>
            ) : null}
            <Text style={styles.kicker}>{labels.currentGallery}</Text>
            {galleryWithUrls.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryStrip}>
                {galleryWithUrls.map((item, index) => (
                  <Image key={`${item.url}-${index}`} source={{ uri: item.url }} style={styles.galleryImage} />
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.body}>{labels.noGalleryImages}</Text>
            )}
          </View>
        ) : null}

        {activeTab !== "images" ? (
          <TouchableOpacity disabled={isSaving} onPress={() => void saveCurrentTab()} style={[styles.primaryButton, isSaving && styles.primaryButtonDisabled]}>
            <Text style={styles.primaryButtonText}>{isSaving ? labels.saving : labels.saveChanges}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

function VendorPublicProfileScreen({
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

function VendorFieldGroup({
  values,
  setValues,
  fields,
}: {
  values: Record<string, string>;
  setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  fields: [string, string, "multiline"?][];
}) {
  return (
    <View style={styles.form}>
      {fields.map(([key, label, mode]) => (
        <View key={key} style={styles.formField}>
          <FieldLabel text={label} />
          <TextInput
            multiline={mode === "multiline"}
            onChangeText={(value) => setValues((current) => ({ ...current, [key]: value }))}
            style={[styles.input, mode === "multiline" && styles.textArea]}
            value={values[key] ?? ""}
          />
        </View>
      ))}
    </View>
  );
}

function LanguageSegment({
  value,
  language = value,
  onChange,
}: {
  value: "en" | "es";
  language?: "en" | "es";
  onChange: (language: "en" | "es") => void;
}) {
  const labels = copy[language];
  return (
    <View style={styles.languageSegment}>
      {([
        ["en", labels.english],
        ["es", labels.spanish],
      ] as const).map(([key, label]) => (
        <TouchableOpacity
          key={key}
          onPress={() => onChange(key)}
          style={[styles.languageSegmentButton, value === key && styles.languageSegmentButtonActive]}
        >
          <Text style={[styles.languageSegmentText, value === key && styles.languageSegmentTextActive]}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function CurrentMediaPreview({
  label,
  url,
  fallback,
  compact = false,
}: {
  label: string;
  url: string | null;
  fallback: string;
  compact?: boolean;
}) {
  return (
    <View style={[styles.currentMediaCard, compact && styles.currentMediaCardCompact]}>
      <Text style={styles.kicker}>{label}</Text>
      {url ? (
        <Image source={{ uri: url }} style={[styles.currentMediaImage, compact && styles.currentMediaImageCompact]} resizeMode="cover" />
      ) : (
        <View style={[styles.currentMediaFallback, compact && styles.currentMediaImageCompact]}>
          <Text style={styles.currentMediaFallbackText}>{fallback}</Text>
        </View>
      )}
    </View>
  );
}

function EditableAvailabilityCalendar({
  dates,
  language,
  onChange,
}: {
  dates: Record<string, string>[];
  language: "en" | "es";
  onChange: React.Dispatch<React.SetStateAction<Record<string, string>[]>>;
}) {
  const labels = copy[language];
  const statusByDate = new Map(dates.filter((item) => item.date).map((item) => [item.date, item.status]));
  const today = new Date();
  const monthStarts = [0, 1].map((offset) => new Date(today.getFullYear(), today.getMonth() + offset, 1));

  function cycleDate(key: string) {
    onChange((current) => {
      const existing = current.find((item) => item.date === key);
      if (!existing) return [...current, { date: key, status: "available" }];
      if (existing.status === "available") {
        return current.map((item) => item.date === key ? { ...item, status: "busy" } : item);
      }
      return current.filter((item) => item.date !== key);
    });
  }

  return (
    <View style={styles.availabilityMonths}>
      <View style={styles.availabilityLegend}>
        <View style={styles.availabilityLegendItem}><View style={[styles.availabilityLegendDot, styles.availabilityLegendOpen]} /><Text style={styles.vendorMeta}>{labels.available}</Text></View>
        <View style={styles.availabilityLegendItem}><View style={[styles.availabilityLegendDot, styles.availabilityLegendBusy]} /><Text style={styles.vendorMeta}>{labels.busy}</Text></View>
      </View>
      {monthStarts.map((monthStart) => {
        const monthLabel = monthStart.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
        const leadingBlanks = monthStart.getDay();
        const cells = [
          ...Array.from({ length: leadingBlanks }, (_, index) => ({ key: `blank-${index}`, day: null as number | null })),
          ...Array.from({ length: daysInMonth }, (_, index) => ({ key: `day-${index + 1}`, day: index + 1 })),
        ];

        return (
          <View key={monthLabel} style={styles.availabilityMonthCard}>
            <Text style={styles.availabilityCalendarTitle}>{monthLabel}</Text>
            <View style={styles.availabilityWeekdays}>
              {["S", "M", "T", "W", "T", "F", "S"].map((label, index) => (
                <Text key={`${label}-${index}`} style={styles.availabilityWeekday}>{label}</Text>
              ))}
            </View>
            <View style={styles.availabilityCalendarGrid}>
              {cells.map((cell) => {
                if (!cell.day) return <View key={cell.key} style={styles.availabilityCalendarDayBlank} />;
                const current = new Date(monthStart.getFullYear(), monthStart.getMonth(), cell.day);
                const key = dateKey(current);
                const status = statusByDate.get(key);
                return (
                  <TouchableOpacity
                    key={cell.key}
                    onPress={() => cycleDate(key)}
                    style={[
                      styles.availabilityCalendarDay,
                      status === "available" && styles.availabilityDayOpen,
                      status === "busy" && styles.availabilityDayBusy,
                    ]}
                  >
                    <Text
                      style={[
                        styles.availabilityCalendarNumber,
                        status === "available" && styles.availabilityCalendarNumberOpen,
                        status === "busy" && styles.availabilityCalendarNumberBusy,
                      ]}
                    >
                      {cell.day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function InboxScreen({ role, language }: { role: AppRole; language: "en" | "es" }) {
  const labels = copy[language];
  const [threads, setThreads] = useState<MobileInboxThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MobileInboxThread | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteMessage, setQuoteMessage] = useState("");
  const [revealEmail, setRevealEmail] = useState(true);
  const [revealPhone, setRevealPhone] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isSendingQuote, setIsSendingQuote] = useState(false);
  const [isAcceptingQuote, setIsAcceptingQuote] = useState(false);
  const [message, setMessage] = useState("");
  const isVendorViewer = role === "vendor" || role === "admin";

  const refreshInbox = useCallback(async (shouldApply: () => boolean = () => true) => {
    setIsLoading(true);
    setMessage("");
    try {
      const nextThreads = await loadMobileInbox(role, language);
      if (!shouldApply()) return;
      setThreads(nextThreads);
      setSelectedThread((current) => {
        if (!current) return null;
        return nextThreads.find((thread) => thread.id === current.id) ?? null;
      });
    } catch (error) {
      if (shouldApply()) setMessage(error instanceof Error ? error.message : "Unable to load inbox.");
    } finally {
      if (shouldApply()) setIsLoading(false);
    }
  }, [language, role]);

  useEffect(() => {
    let isMounted = true;
    void refreshInbox(() => isMounted);
    return () => {
      isMounted = false;
    };
  }, [refreshInbox]);

  useEffect(() => {
    if (!selectedThread) return;
    const amount = selectedThread.latestQuote?.amountCents;
    setQuoteAmount(typeof amount === "number" ? (amount / 100).toFixed(2) : "");
    setQuoteMessage(selectedThread.latestQuote?.message ?? "");
    setReplyBody("");
  }, [selectedThread]);

  async function submitReply() {
    if (!selectedThread) return;
    setIsSending(true);
    setMessage("");
    try {
      await sendQuoteThreadReply(selectedThread, replyBody, role);
      setReplyBody("");
      await refreshInbox();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send reply.");
    } finally {
      setIsSending(false);
    }
  }

  async function submitQuote() {
    if (!selectedThread) return;
    setIsSendingQuote(true);
    setMessage("");
    try {
      await sendVendorQuote(selectedThread, quoteAmount, quoteMessage);
      await refreshInbox();
      setMessage(labels.quoteSent);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send quote.");
    } finally {
      setIsSendingQuote(false);
    }
  }

  async function acceptQuote() {
    if (!selectedThread?.latestQuote) return;
    setIsAcceptingQuote(true);
    setMessage("");
    try {
      await acceptMobileQuote(selectedThread, { revealEmail, revealPhone });
      await refreshInbox();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to accept quote.");
    } finally {
      setIsAcceptingQuote(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.searchState}>
        <ActivityIndicator color={colors.ink} />
        <Text style={styles.loadingText}>{labels.inboxTitle}</Text>
      </View>
    );
  }

  if (selectedThread) {
    const isAcceptedHere = Boolean(
      selectedThread.acceptedQuoteId &&
      selectedThread.quotes.some((quote) => quote.id === selectedThread.acceptedQuoteId)
    );
    const conversationClosed = isQuoteThreadClosed(
      selectedThread.status,
      selectedThread.expiresAt,
      selectedThread.acceptedQuoteId,
      selectedThread.quotes.map((quote) => quote.id),
    );
    const activity = [
      ...selectedThread.quotes.map((quote) => ({ kind: "quote" as const, createdAt: quote.createdAt, quote })),
      ...selectedThread.messages.map((inboxMessage) => ({
        kind: "message" as const,
        createdAt: inboxMessage.createdAt,
        inboxMessage,
      })),
    ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return (
      <View>
        <View style={styles.quoteSummaryHeader}>
          <TouchableOpacity onPress={() => setSelectedThread(null)} style={styles.backButtonInline}>
            <Ionicons name="chevron-back" size={18} color={colors.tealDark} />
            <Text style={styles.backButtonText}>{labels.inbox}</Text>
          </TouchableOpacity>
          <TouchableOpacity disabled={isLoading} onPress={() => void refreshInbox()} style={styles.backButtonInline}>
            <Ionicons name="refresh-outline" size={18} color={colors.tealDark} />
            <Text style={styles.backButtonText}>{labels.refresh}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.dashboardHero}>
          <Text style={styles.kicker}>{selectedThread.status}</Text>
          <Text style={styles.title}>{selectedThread.title}</Text>
          <Text style={styles.body}>{selectedThread.subtitle}</Text>
        </View>
        {message ? (
          <Text style={message === labels.quoteSent ? styles.successText : styles.errorText}>{message}</Text>
        ) : null}

        {selectedThread.latestQuote ? (
          <View style={styles.quoteSummaryCard}>
            <View style={styles.quoteSummaryHeader}>
              <Text style={styles.kicker}>{labels.quotes}</Text>
              {isAcceptedHere ? <Text style={styles.acceptedBadge}>{labels.quoteAccepted}</Text> : null}
            </View>
            <Text style={styles.quoteSummaryAmount}>
              {formatMoney(selectedThread.latestQuote.amountCents, selectedThread.latestQuote.currency, language)}
            </Text>
            {selectedThread.latestQuote.message ? (
              <Text style={styles.quoteSummaryBody}>{selectedThread.latestQuote.message}</Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.panel}>
            <Text style={styles.body}>
              {isVendorViewer
                ? language === "en"
                  ? "No quote yet. Send a proposal when you are ready."
                  : "Aún no hay cotización. Envía una propuesta cuando estés listo."
                : labels.noQuoteYet}
            </Text>
          </View>
        )}

        {isVendorViewer && isAcceptedHere ? (
          <View style={styles.panel}>
            <Text style={styles.sectionTitle}>{labels.contactDetails}</Text>
            {selectedThread.contactEmail ? (
              <Text onPress={() => void Linking.openURL(`mailto:${selectedThread.contactEmail}`)} style={styles.contactLink}>
                {selectedThread.contactEmail}
              </Text>
            ) : null}
            {selectedThread.contactPhone ? (
              <Text onPress={() => void Linking.openURL(`tel:${selectedThread.contactPhone}`)} style={styles.contactLink}>
                {selectedThread.contactPhone}
              </Text>
            ) : null}
            {!selectedThread.contactEmail && !selectedThread.contactPhone ? (
              <Text style={styles.body}>{labels.noContactShared}</Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.inboxList}>
          {activity.length ? activity.map((item) => {
            if (item.kind === "quote") {
              return (
                <View key={`quote-${item.quote.id}`} style={styles.proposalActivityCard}>
                  <View style={styles.quoteSummaryHeader}>
                    <Text style={styles.messageSender}>
                      {item.quote.version > 1 ? labels.proposalUpdated : labels.proposalSent}
                    </Text>
                    <Text style={styles.inboxAmount}>
                      {formatMoney(item.quote.amountCents, item.quote.currency, language)}
                    </Text>
                  </View>
                  {item.quote.message ? <Text style={styles.messageBody}>{item.quote.message}</Text> : null}
                  <Text style={styles.inboxMeta}>{new Date(item.quote.createdAt).toLocaleString()}</Text>
                </View>
              );
            }

            const ownMessage = item.inboxMessage.senderRole === (isVendorViewer ? "vendor" : "client");
            return (
              <View
                key={`message-${item.inboxMessage.id}`}
                style={[styles.messageBubble, ownMessage ? styles.messageBubbleOwn : styles.messageBubbleOther]}
              >
                <Text style={styles.messageSender}>
                  {ownMessage
                    ? labels.you
                    : item.inboxMessage.senderRole === "client"
                      ? labels.client
                      : labels.vendor}
                </Text>
                <Text style={styles.messageBody}>{item.inboxMessage.body}</Text>
                <Text style={styles.inboxMeta}>{new Date(item.inboxMessage.createdAt).toLocaleString()}</Text>
              </View>
            );
          }) : <Text style={styles.body}>{labels.noConversation}</Text>}
        </View>

        {conversationClosed ? (
          <View style={styles.panel}>
            <Text style={styles.body}>{labels.conversationClosed}</Text>
          </View>
        ) : null}

        {isVendorViewer && !selectedThread.acceptedQuoteId && !conversationClosed ? (
          <View style={styles.replyComposer}>
            <Text style={styles.sectionTitle}>
              {selectedThread.latestQuote ? labels.updateQuote : labels.sendQuote}
            </Text>
            <FieldLabel text={labels.quoteAmount} />
            <TextInput
              keyboardType="decimal-pad"
              placeholder="0.00"
              style={styles.input}
              value={quoteAmount}
              onChangeText={setQuoteAmount}
            />
            <FieldLabel text={labels.quoteDetails} />
            <TextInput
              maxLength={2000}
              multiline
              placeholder={language === "en" ? "Describe what is included" : "Describe lo que está incluido"}
              style={[styles.input, styles.textArea]}
              value={quoteMessage}
              onChangeText={setQuoteMessage}
            />
            <Text style={styles.characterCount}>{quoteMessage.length}/2000</Text>
            <TouchableOpacity
              disabled={isSendingQuote}
              onPress={submitQuote}
              style={[styles.primaryButton, isSendingQuote && styles.primaryButtonDisabled]}
            >
              <Ionicons name="cash-outline" size={17} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>
                {isSendingQuote ? labels.sending : selectedThread.latestQuote ? labels.updateQuote : labels.sendQuote}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!isVendorViewer && selectedThread.latestQuote && !selectedThread.acceptedQuoteId && !conversationClosed ? (
          <View style={styles.replyComposer}>
            <Text style={styles.sectionTitle}>{labels.acceptQuote}</Text>
            <TouchableOpacity onPress={() => setRevealEmail((current) => !current)} style={styles.checkboxRow}>
              <Ionicons name={revealEmail ? "checkbox" : "square-outline"} size={20} color={colors.tealDark} />
              <Text style={styles.checkboxText}>{labels.shareEmail}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setRevealPhone((current) => !current)} style={styles.checkboxRow}>
              <Ionicons name={revealPhone ? "checkbox" : "square-outline"} size={20} color={colors.tealDark} />
              <Text style={styles.checkboxText}>{labels.sharePhone}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={isAcceptingQuote}
              onPress={() => {
                Alert.alert(
                  labels.acceptQuote,
                  language === "en"
                    ? "Accept this quote and close the other vendor requests?"
                    : "¿Aceptar esta cotización y cerrar las otras solicitudes?",
                  [
                    { text: language === "en" ? "Cancel" : "Cancelar", style: "cancel" },
                    { text: labels.acceptQuote, onPress: () => void acceptQuote() },
                  ]
                );
              }}
              style={[styles.primaryButton, isAcceptingQuote && styles.primaryButtonDisabled]}
            >
              <Ionicons name="checkmark-circle-outline" size={17} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>
                {isAcceptingQuote ? labels.acceptingQuote : labels.acceptQuote}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {selectedThread.latestQuote && !conversationClosed ? (
          <View style={styles.replyComposer}>
            <FieldLabel text={labels.reply} />
            <TextInput
              maxLength={2000}
              multiline
              placeholder={language === "en" ? "Write your message" : "Escribe tu mensaje"}
              style={[styles.input, styles.textArea]}
              value={replyBody}
              onChangeText={setReplyBody}
            />
            <Text style={styles.characterCount}>{replyBody.length}/2000</Text>
            <TouchableOpacity disabled={isSending} onPress={submitReply} style={[styles.primaryButton, isSending && styles.primaryButtonDisabled]}>
              <Ionicons name="chatbubble-ellipses-outline" size={17} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>{isSending ? labels.sending : labels.sendReply}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity disabled={isLoading} onPress={() => void refreshInbox()} style={styles.backButtonInline}>
        <Ionicons name="refresh-outline" size={18} color={colors.tealDark} />
        <Text style={styles.backButtonText}>{labels.refresh}</Text>
      </TouchableOpacity>
      <View style={styles.dashboardHero}>
        <Text style={styles.kicker}>{labels.inbox}</Text>
        <Text style={styles.title}>{labels.inboxTitle}</Text>
        {message ? <Text style={styles.errorText}>{message}</Text> : null}
      </View>
      {threads.length ? (
        <View style={styles.inboxList}>
          {threads.map((item) => (
            <TouchableOpacity key={item.id} onPress={() => setSelectedThread(item)} style={styles.inboxCard}>
              <View style={styles.inboxIcon}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.ink} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inboxTitle}>{item.title}</Text>
                <Text style={styles.inboxSubtitle}>{item.subtitle}</Text>
                <Text style={styles.inboxMeta}>{item.meta}</Text>
              </View>
              {item.latestQuote ? (
                <Text style={styles.inboxAmount}>{formatMoney(item.latestQuote.amountCents, item.latestQuote.currency, language)}</Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.panel}>
          <Text style={styles.title}>{labels.noInbox}</Text>
        </View>
      )}
    </View>
  );
}

function InfoMetric({
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

function DetailSection({
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

function EmptySectionText({ text }: { text: string }) {
  return <Text style={styles.detailBody}>{text}</Text>;
}

function parseDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (year && month && day) return new Date(year, month - 1, day);
  return new Date(value);
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function AvailabilityPreview({ dates, language }: { dates: NonNullable<VendorDetail["availability"]>; language: "en" | "es" }) {
  const labels = copy[language];
  const { width } = useWindowDimensions();
  const [referenceDate] = useState(() => new Date());
  const referenceTime = referenceDate.getTime();
  const upcoming = dates
    .map((date) => ({ ...date, parsed: parseDateValue(date.date) }))
    .filter((date) => date.parsed.getTime() >= referenceTime - 24 * 60 * 60 * 1000)
    .sort((left, right) => left.parsed.getTime() - right.parsed.getTime());
  const statusByDate = new Map(upcoming.map((date) => [dateKey(date.parsed), date.status]));
  const startSource = referenceDate;
  const calendarWidth = Math.max(280, width - 104);
  const monthStarts = Array.from({ length: 12 }, (_, offset) =>
    new Date(startSource.getFullYear(), startSource.getMonth() + offset, 1),
  );

  return (
    <View style={styles.availabilityMonths}>
      {!upcoming.length ? (
        <Text style={styles.detailBody}>{labels.availabilityEmpty}</Text>
      ) : null}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={calendarWidth + 12}
        decelerationRate="fast"
        contentContainerStyle={styles.availabilityMonthScroller}
      >
        {monthStarts.map((monthStart) => {
          const monthLabel = monthStart.toLocaleDateString("en-US", { month: "long", year: "numeric" });
          const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
          const leadingBlanks = monthStart.getDay();
          const cells = [
            ...Array.from({ length: leadingBlanks }, (_, index) => ({ key: `blank-${index}`, day: null as number | null })),
            ...Array.from({ length: daysInMonth }, (_, index) => ({ key: `day-${index + 1}`, day: index + 1 })),
          ];

          return (
            <View key={monthLabel} style={[styles.availabilityMonthCard, { width: calendarWidth }]}>
              <Text style={styles.availabilityCalendarTitle}>{monthLabel}</Text>
              <View style={styles.availabilityWeekdays}>
                {["S", "M", "T", "W", "T", "F", "S"].map((label, index) => (
                  <Text key={`${label}-${index}`} style={styles.availabilityWeekday}>{label}</Text>
                ))}
              </View>
              <View style={styles.availabilityCalendarGrid}>
                {cells.map((cell) => {
                  if (!cell.day) return <View key={cell.key} style={styles.availabilityCalendarDayBlank} />;
                  const current = new Date(monthStart.getFullYear(), monthStart.getMonth(), cell.day);
                  const status = statusByDate.get(dateKey(current));
                  return (
                    <View
                      key={cell.key}
                      style={[
                        styles.availabilityCalendarDay,
                        status === "available" && styles.availabilityDayOpen,
                        status === "busy" && styles.availabilityDayBusy,
                      ]}
                    >
                      <Text
                        style={[
                          styles.availabilityCalendarNumber,
                          status === "available" && styles.availabilityCalendarNumberOpen,
                          status === "busy" && styles.availabilityCalendarNumberBusy,
                        ]}
                      >
                        {cell.day}
                      </Text>
                      {status ? <View style={[styles.availabilityDot, status === "busy" && styles.availabilityDotBusy]} /> : null}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function VendorDetailScreen({
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
}) {
  const labels = copy[language];
  const [loadedVendor, setLoadedVendor] = useState<{ slug: string; vendor: VendorDetail } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeGalleryImage, setActiveGalleryImage] = useState<string | null>(null);
  const sectionPositions = useRef<Record<string, number>>({});
  const initialDetailVendor = initialVendor?.slug === slug ? (initialVendor as VendorDetail) : null;
  const vendor = loadedVendor?.slug === slug ? loadedVendor.vendor : initialDetailVendor;

  function registerSection(key: string) {
    return (event: LayoutChangeEvent) => {
      sectionPositions.current[key] = event.nativeEvent.layout.y;
    };
  }

  function handleSectionPress(key: string) {
    if (disableSectionScroll) return;
    const y = sectionPositions.current[key];
    if (typeof y === "number") onScrollToSection(Math.max(y - 8, 0));
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
    let isMounted = true;

    async function loadVendorDetail() {
      setIsLoading(true);
      setMessage("");

      try {
        const detail = await fetchVendorDetail(slug);
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
  }, [slug]);

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

      <View style={styles.detailHero}>
        {heroUrl ? (
          <Image source={{ uri: heroUrl }} style={styles.detailHeroImage} />
        ) : (
          <View style={styles.detailHeroFallback}>
            <Text style={styles.vendorImageFallbackText}>{vendor.business_name.slice(0, 2).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.detailHeroShade} />
        <View style={styles.detailHeroActions}>
          <TouchableOpacity onPress={() => onToggleSaved(vendor)} style={styles.detailIconButton}>
            <Ionicons name={isSaved ? "heart" : "heart-outline"} size={20} color={isSaved ? "#B42318" : colors.ink} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => void handleShare()} style={styles.detailIconButton}>
            <Ionicons name="share-outline" size={20} color={colors.ink} />
          </TouchableOpacity>
        </View>
        <View style={styles.detailHeroCopy}>
          <Text style={styles.heroBadge}>{labels.vendorProfile}</Text>
          <Text style={styles.detailTitle}>{vendor.business_name}</Text>
          {categoriesText ? <Text style={styles.detailCategories}>{categoriesText}</Text> : null}
        </View>
      </View>

      <View style={styles.detailSheet}>
      <View style={styles.detailActionBar}>
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
      </View>

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
          value={formatMoney(vendor.starting_price_cents, vendor.starting_price_currency ?? "USD", language)}
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
        <View style={styles.pricingRows}>
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
        </View>
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
        <TouchableOpacity onPress={() => onRequestQuote(vendor)} style={styles.detailQuoteButton}>
          <Ionicons name="send-outline" size={17} color="#FFFFFF" />
          <Text style={styles.detailQuoteText}>{labels.requestQuote}</Text>
        </TouchableOpacity>
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

function ScreenContent({
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
}: {
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

  if (tab === "home") {
    return (
      <View>
        <View style={styles.heroCard}>
          <Image source={{ uri: heroImageUrl }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay} />
          <View style={styles.heroCopy}>
            <Text style={styles.heroBadge}>{labels.heroBadgeHome}</Text>
            <Text style={styles.heroTitle}>{labels.heroTitleHome}</Text>
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
          </View>
        </View>

        <View style={styles.homeBody}>
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
            <TouchableOpacity onPress={() => onNavigate("search")} style={styles.primaryButton}>
              <Ionicons name="search-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>{labels.browseVendors}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (tab === "search") {
    return (
      <VendorSearchScreen
        initialCategory={initialSearchCategory}
        savedVendorIds={savedVendorIds}
        language={language}
        onOpenVendor={onOpenVendor}
        onRequestQuote={onRequestQuote}
        onToggleSaved={onToggleSaved}
      />
    );
  }

  if (tab === "vendor") {
    if (role === "guest") {
      return <ProtectedScreen title={labels.signInVendorPage} language={language} onSignedIn={onSignedIn} />;
    }

    if (role === "vendor" || role === "admin") {
      return (
        <VendorPublicProfileScreen
          savedVendorIds={savedVendorIds}
          language={language}
          onRequestQuote={onRequestQuote}
          onToggleSaved={onToggleSaved}
        />
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
    if (role === "vendor") {
      return <VendorWorkspaceScreen language={language} />;
    }

    return (
      <AccountProfileScreen
        userEmail={userEmail}
        language={language}
        onProfileUpdated={onProfileUpdated}
        onLanguageUpdated={onLanguageUpdated}
      />
    );
  }

  if (tab === "favorites") {
    return (
      <FavoritesScreen
        savedVendorIds={savedVendorIds}
        language={language}
        onOpenVendor={onOpenVendor}
        onRequestQuote={onRequestQuote}
        onRequestQuoteBatch={onRequestQuoteBatch}
        onToggleSaved={onToggleSaved}
      />
    );
  }

  if (tab === "inbox") {
    return <InboxScreen role={role} language={language} />;
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
  const [language, setLanguage] = useState<"en" | "es">("en");
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
  const applyAuthenticatedState = useCallback((state: AuthState) => {
    setUserEmail(state.user?.email ?? null);
    setProfile(state.profile);
    setLanguage(state.profile?.language ?? "en");
    setActiveTab(roleTabs(state.profile?.role ?? (state.user ? "client" : "guest"))[0].key);
    setIsAccountMenuOpen(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const handleAuthUrl = async (url: string, showConfirmation: boolean) => {
      try {
        const state = await createSessionFromMobileAuthUrl(url);
        if (!state || !isMounted) return false;

        applyAuthenticatedState(state);
        if (showConfirmation) {
          const labels = copy[state.profile?.language ?? "en"];
          Alert.alert(labels.emailConfirmedTitle, labels.emailConfirmedBody);
        }
        return true;
      } catch (error) {
        if (isMounted) {
          const message = error instanceof Error ? error.message : copy.en.emailConfirmationFailed;
          Alert.alert(copy.en.emailConfirmationErrorTitle, message);
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
          if (isMounted) applyAuthenticatedState(state);
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
    setUserEmail(nextState.userEmail);
    setProfile(nextState.profile);
    setLanguage(nextState.profile?.language ?? "en");
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
    setLanguage(nextLanguage);
    setProfile((current) => current ? { ...current, language: nextLanguage } : current);
    setIsAccountMenuOpen(false);

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
            <Ionicons name="sparkles-outline" size={18} color={colors.gold} />
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
              <TouchableOpacity
                onPress={() => {
                  void handleLanguageChange(language === "en" ? "es" : "en");
                }}
                style={styles.accountMenuItem}
              >
                <Ionicons name="language-outline" size={18} color={colors.tealDark} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.accountMenuText}>
                    {copy[language].language}: {language === "es" ? copy[language].spanish : copy[language].english}
                  </Text>
                  <Text style={styles.accountMenuMeta}>
                    {language === "en" ? copy[language].switchToSpanish : copy[language].switchToEnglish}
                  </Text>
                </View>
              </TouchableOpacity>
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
              <TouchableOpacity
                onPress={() => {
                  setIsAccountMenuOpen(false);
                  void openPublicWebPath("/privacy");
                }}
                style={styles.accountMenuItem}
              >
                <Ionicons name="shield-checkmark-outline" size={18} color={colors.tealDark} />
                <Text style={styles.accountMenuText}>{copy[language].privacyPolicy}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setIsAccountMenuOpen(false);
                  void openPublicWebPath("/terms");
                }}
                style={styles.accountMenuItem}
              >
                <Ionicons name="document-text-outline" size={18} color={colors.tealDark} />
                <Text style={styles.accountMenuText}>{copy[language].termsOfService}</Text>
              </TouchableOpacity>
              {userEmail ? (
                <>
                  <TouchableOpacity
                    onPress={() => {
                      setIsAccountMenuOpen(false);
                      void openPublicWebPath("/account-deletion");
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
            onLanguageUpdated={setLanguage}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centeredRoot: {
    alignItems: "center",
    backgroundColor: colors.paper,
    flex: 1,
    justifyContent: "center",
  },
  root: {
    flex: 1,
    backgroundColor: colors.paper,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0,
  },
  authShell: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  authScroll: {
    flexGrow: 1,
  },
  authModeSegment: {
    backgroundColor: colors.soft,
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    marginTop: 18,
    padding: 5,
  },
  authModeButton: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  authModeButtonActive: {
    backgroundColor: colors.ink,
  },
  authModeText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900",
  },
  authModeTextActive: {
    color: colors.paper,
  },
  signupProgressRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 2,
  },
  signupProgressDot: {
    backgroundColor: colors.line,
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  signupProgressDotActive: {
    backgroundColor: colors.ink,
    width: 24,
  },
  signupStepCard: {
    backgroundColor: "transparent",
    borderRadius: 0,
    gap: 10,
    padding: 0,
  },
  signupWelcomeCard: {
    alignItems: "flex-start",
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  signupIntroPanel: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
  },
  signupIconBubble: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: 999,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  signupKicker: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  signupStepTitle: {
    color: colors.ink,
    fontFamily: fontFamilies.displayMedium,
    fontSize: 24,
    fontWeight: "500",
    lineHeight: 31,
  },
  signupStepTitleSmall: {
    color: colors.ink,
    fontFamily: fontFamilies.displayMedium,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 26,
    marginTop: 6,
  },
  signupStepBody: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  signupNavRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  signupBackButton: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flex: 0.42,
    minHeight: 50,
    justifyContent: "center",
  },
  signupBackText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
  },
  signupNextButton: {
    borderRadius: 999,
    flex: 1,
    marginTop: 0,
    minHeight: 50,
  },
  signupNextButtonFull: {
    flex: 1,
  },
  signupModalRoot: {
    backgroundColor: "#F8F8FC",
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0,
  },
  signupModalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 96,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  signupModalLogo: {
    alignItems: "center",
    justifyContent: "center",
  },
  signupModalLogoText: {
    color: colors.ink,
    fontFamily: fontFamilies.displayMedium,
    fontSize: 25,
    fontWeight: "500",
    letterSpacing: 0,
  },
  signupModalCloseButton: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 999,
    height: 46,
    justifyContent: "center",
    position: "absolute",
    right: 14,
    top: 14,
    width: 46,
  },
  signupModalBody: {
    gap: 18,
    paddingHorizontal: 44,
    paddingTop: 4,
    paddingBottom: 28,
  },
  signupModalFooter: {
    alignItems: "center",
    backgroundColor: "#F8F8FC",
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 44,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 28 : 22,
  },
  signupProgressTrack: {
    backgroundColor: "#E2E4EC",
    borderRadius: 999,
    height: 4,
    overflow: "hidden",
    width: "100%",
  },
  signupProgressFill: {
    backgroundColor: colors.ink,
    borderRadius: 999,
    height: "100%",
  },
  weddingStyleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  weddingStyleCard: {
    borderColor: "transparent",
    borderRadius: 20,
    borderWidth: 2,
    height: 112,
    overflow: "hidden",
    position: "relative",
    width: "48%",
  },
  weddingStyleCardActive: {
    borderColor: colors.gold,
  },
  weddingStyleImage: {
    height: "100%",
    width: "100%",
  },
  weddingStyleOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.24)",
  },
  weddingStyleLabel: {
    bottom: 12,
    color: colors.paper,
    fontSize: 15,
    fontWeight: "900",
    left: 12,
    position: "absolute",
    right: 38,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  weddingStyleCheck: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: 999,
    height: 26,
    justifyContent: "center",
    position: "absolute",
    right: 10,
    top: 10,
    width: 26,
  },
  datePickerCard: {
    backgroundColor: colors.soft,
    borderRadius: 22,
    padding: 12,
  },
  datePickerHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  datePickerArrow: {
    alignItems: "center",
    backgroundColor: colors.paper,
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  datePickerMonth: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  datePickerWeekRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  datePickerWeekday: {
    color: colors.muted,
    flex: 1,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
  },
  datePickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  datePickerDay: {
    alignItems: "center",
    aspectRatio: 1,
    justifyContent: "center",
    width: "14.2857%",
  },
  datePickerDaySelected: {
    backgroundColor: colors.ink,
    borderRadius: 999,
  },
  datePickerDayText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  datePickerDayTextSelected: {
    color: colors.paper,
  },
  selectedDateText: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 8,
    textAlign: "center",
  },
  header: {
    alignItems: "center",
    backgroundColor: colors.paper,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    zIndex: 20,
  },
  headerOverlay: {
    backgroundColor: "transparent",
    left: 0,
    position: "absolute",
    right: 0,
    top: Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0,
    zIndex: 50,
  },
  headerBrandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    flex: 1,
  },
  logoMark: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: 18,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  authLogo: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    marginBottom: 14,
    width: 44,
  },
  brand: {
    color: colors.ink,
    fontFamily: fontFamilies.displayMedium,
    fontSize: 21,
    fontWeight: "500",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  headerOverlayText: {
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.28)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  headerOverlaySubtitle: {
    color: "rgba(255,255,255,0.86)",
    textShadowColor: "rgba(0,0,0,0.24)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  authTitle: {
    color: colors.ink,
    fontFamily: fontFamilies.displayMedium,
    fontSize: 26,
    fontWeight: "500",
    lineHeight: 32,
    marginTop: 18,
  },
  form: {
    gap: 10,
    marginTop: 24,
  },
  languageSegment: {
    alignSelf: "flex-start",
    backgroundColor: colors.soft,
    borderRadius: 999,
    flexDirection: "row",
    gap: 4,
    padding: 4,
  },
  languageSegmentButton: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  languageSegmentButtonActive: {
    backgroundColor: colors.ink,
  },
  languageSegmentText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900",
  },
  languageSegmentTextActive: {
    color: "#FFFFFF",
  },
  formField: {
    gap: 7,
  },
  formSection: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    marginTop: 14,
    padding: 16,
  },
  favoriteBatchButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.ink,
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 14,
    minHeight: 48,
    paddingHorizontal: 18,
  },
  label: {
    color: colors.ink,
    fontFamily: fontFamilies.body,
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  textArea: {
    minHeight: 108,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  inputDisabled: {
    backgroundColor: colors.soft,
    color: colors.muted,
  },
  nativeSelectBlock: {
    gap: 8,
    marginTop: 4,
  },
  nativeSelectHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  nativeSelectHelper: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  nativeSelectOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  nativeSelectPill: {
    backgroundColor: colors.soft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  nativeSelectPillActive: {
    backgroundColor: colors.ink,
  },
  nativeSelectText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  nativeSelectTextActive: {
    color: colors.paper,
  },
  countryDropdownBlock: {
    gap: 8,
  },
  countryDropdownTrigger: {
    alignItems: "center",
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 48,
    paddingHorizontal: 12,
  },
  countryDropdownTriggerActive: {
    borderColor: colors.ink,
  },
  countryDropdownValue: {
    color: colors.ink,
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  countryDropdownPlaceholder: {
    color: colors.muted,
  },
  countryDropdownMenu: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    padding: 10,
  },
  countrySearchInputWrap: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
    minHeight: 42,
    paddingHorizontal: 10,
  },
  countrySearchInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 15,
    minHeight: 42,
    padding: 0,
  },
  countryOptionsList: {
    marginTop: 8,
    maxHeight: 220,
  },
  countryOptionRow: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 40,
    paddingHorizontal: 10,
  },
  countryOptionRowActive: {
    backgroundColor: colors.soft,
  },
  countryOptionText: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  countryOptionTextActive: {
    fontWeight: "900",
  },
  countryNoResults: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    padding: 12,
    textAlign: "center",
  },
  modalBackdrop: {
    backgroundColor: "rgba(22,26,29,0.32)",
    flex: 1,
    justifyContent: "flex-end",
  },
  quoteModal: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    maxHeight: "92%",
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  quoteModalHandle: {
    alignSelf: "center",
    backgroundColor: colors.line,
    borderRadius: 999,
    height: 5,
    marginBottom: 12,
    width: 52,
  },
  quoteModalHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingBottom: 12,
  },
  quoteModalBody: {
    gap: 10,
    paddingBottom: 28,
  },
  modalCloseButton: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: 999,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  formTwoColumn: {
    flexDirection: "row",
    gap: 10,
  },
  formHalf: {
    flex: 1,
    gap: 7,
  },
  checkboxRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    minHeight: 38,
  },
  checkboxText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  profileHero: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: 28,
    flexDirection: "row",
    gap: 14,
    padding: 18,
  },
  profileAvatar: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  dashboardHero: {
    backgroundColor: colors.soft,
    borderRadius: 28,
    marginBottom: 14,
    padding: 18,
  },
  dashboardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  dashboardStat: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 24,
    borderWidth: 1,
    minHeight: 118,
    padding: 14,
    width: "48%",
  },
  dashboardStatValue: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: "900",
    marginTop: 12,
  },
  dashboardStatLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
  },
  vendorWorkspaceHero: {
    borderRadius: 28,
    height: 270,
    marginBottom: 14,
    overflow: "hidden",
    position: "relative",
  },
  vendorWorkspaceImage: {
    height: "100%",
    width: "100%",
  },
  vendorWorkspaceOverlay: {
    backgroundColor: "rgba(0,0,0,0.32)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  vendorWorkspaceCopy: {
    bottom: 0,
    left: 0,
    padding: 18,
    position: "absolute",
    right: 0,
  },
  editorTabs: {
    gap: 8,
    paddingBottom: 12,
  },
  editorTab: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 13,
  },
  editorTabActive: {
    backgroundColor: colors.ink,
  },
  editorTabText: {
    color: colors.tealDark,
    fontSize: 12,
    fontWeight: "900",
  },
  editorTabTextActive: {
    color: colors.paper,
  },
  editorPanel: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 26,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  editorSubCard: {
    backgroundColor: colors.soft,
    borderRadius: 22,
    gap: 10,
    padding: 14,
  },
  editorChipSelected: {
    backgroundColor: "#DFF1ED",
    borderColor: colors.teal,
    borderWidth: 1,
  },
  imageUploadGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  imageUploadButton: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: 20,
    flexDirection: "row",
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 12,
    width: "48%",
  },
  currentMediaGrid: {
    gap: 12,
  },
  currentMediaCard: {
    backgroundColor: colors.soft,
    borderRadius: 24,
    gap: 10,
    overflow: "hidden",
    padding: 12,
  },
  currentMediaCardCompact: {
    alignItems: "center",
  },
  currentMediaImage: {
    borderRadius: 18,
    height: 180,
    width: "100%",
  },
  currentMediaImageCompact: {
    height: 96,
    width: 140,
  },
  currentMediaFallback: {
    alignItems: "center",
    backgroundColor: "#D7D7D4",
    borderRadius: 18,
    height: 180,
    justifyContent: "center",
    width: "100%",
  },
  currentMediaFallbackText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "900",
  },
  uploadProgressCard: {
    backgroundColor: "#E8F7EE",
    borderRadius: 20,
    gap: 9,
    padding: 12,
  },
  uploadProgressHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  uploadProgressTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900",
  },
  uploadProgressPercent: {
    color: colors.tealDark,
    fontSize: 13,
    fontWeight: "900",
  },
  uploadProgressTrack: {
    backgroundColor: "rgba(29,122,114,0.18)",
    borderRadius: 999,
    height: 8,
    overflow: "hidden",
  },
  uploadProgressFill: {
    backgroundColor: colors.teal,
    borderRadius: 999,
    height: "100%",
  },
  uploadProgressStatus: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  inboxList: {
    gap: 10,
  },
  inboxCard: {
    alignItems: "center",
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  inboxIcon: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  inboxTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
  },
  inboxSubtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  inboxMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  inboxAmount: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900",
    maxWidth: 96,
    textAlign: "right",
  },
  quoteSummaryCard: {
    backgroundColor: colors.ink,
    borderRadius: 26,
    gap: 8,
    marginBottom: 12,
    padding: 18,
  },
  quoteSummaryHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  acceptedBadge: {
    backgroundColor: "#DDF5E7",
    borderRadius: 999,
    color: "#146C43",
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  quoteSummaryAmount: {
    color: colors.paper,
    fontSize: 28,
    fontWeight: "900",
  },
  quoteSummaryBody: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 14,
    lineHeight: 21,
  },
  messageBubble: {
    borderRadius: 22,
    gap: 5,
    maxWidth: "88%",
    padding: 12,
  },
  messageBubbleOwn: {
    alignSelf: "flex-end",
    backgroundColor: "#E5F4F1",
  },
  messageBubbleOther: {
    alignSelf: "flex-start",
    backgroundColor: colors.soft,
  },
  messageBubbleClient: {
    alignSelf: "flex-end",
    backgroundColor: "#E5F4F1",
  },
  messageBubbleVendor: {
    alignSelf: "flex-start",
    backgroundColor: colors.soft,
  },
  messageSender: {
    color: colors.tealDark,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  messageBody: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 20,
  },
  proposalActivityCard: {
    alignSelf: "stretch",
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    padding: 13,
  },
  characterCount: {
    alignSelf: "flex-end",
    color: colors.muted,
    fontSize: 11,
    marginTop: -6,
  },
  contactLink: {
    color: colors.tealDark,
    fontSize: 14,
    fontWeight: "800",
    textDecorationLine: "underline",
  },
  replyComposer: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    marginTop: 12,
    padding: 14,
  },
  successBanner: {
    backgroundColor: "#E8F7EE",
    borderRadius: 18,
    marginTop: 12,
    padding: 12,
  },
  successBannerText: {
    color: "#067647",
    fontSize: 13,
    fontWeight: "800",
  },
  errorBanner: {
    backgroundColor: "#FFF0EE",
    borderRadius: 18,
    marginTop: 12,
    padding: 12,
  },
  errorBannerText: {
    color: "#B42318",
    fontSize: 13,
    fontWeight: "800",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    minHeight: 50,
    justifyContent: "center",
    marginTop: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  signOutButton: {
    alignItems: "center",
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: colors.paper,
    justifyContent: "center",
    minHeight: 38,
    minWidth: 38,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  signOutText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700",
  },
  headerActions: {
    position: "relative",
    zIndex: 30,
  },
  accountButton: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: 23,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  accountButtonOverlay: {
    backgroundColor: "rgba(255,255,255,0.88)",
  },
  accountAvatarImage: {
    borderRadius: 23,
    height: 46,
    width: 46,
  },
  accountAvatarText: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900",
  },
  accountMenu: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 22,
    borderWidth: 1,
    elevation: 8,
    minWidth: 230,
    padding: 8,
    position: "absolute",
    right: 0,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    top: 54,
    zIndex: 40,
  },
  accountMenuHeader: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    marginBottom: 4,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  accountMenuTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900",
  },
  accountMenuSubtitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
    textTransform: "capitalize",
  },
  accountMenuItem: {
    alignItems: "center",
    borderRadius: 18,
    flexDirection: "row",
    gap: 9,
    minHeight: 42,
    paddingHorizontal: 10,
  },
  accountMenuText: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
  },
  accountMenuMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  accountMenuDanger: {
    color: "#B42318",
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 12,
  },
  errorText: {
    color: "#B42318",
    fontSize: 13,
  },
  successText: {
    color: "#067647",
    fontSize: 13,
    fontWeight: "800",
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    marginTop: 14,
    minHeight: 44,
  },
  secondaryButtonText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 122,
  },
  homeContent: {
    paddingBottom: 122,
  },
  detailContent: {
    paddingBottom: 0,
  },
  panel: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  heroPanel: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  heroCard: {
    borderRadius: 0,
    height: 610,
    overflow: "hidden",
    position: "relative",
  },
  heroImage: {
    height: "100%",
    position: "absolute",
    width: "100%",
  },
  heroOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.34)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  heroCopy: {
    bottom: 0,
    left: 0,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 86,
    position: "absolute",
    right: 0,
  },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 999,
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.displayRegular,
    fontSize: 34,
    fontWeight: "400",
    lineHeight: 38,
  },
  heroText: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
  },
  heroButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  heroPrimaryButton: {
    alignItems: "center",
    backgroundColor: colors.paper,
    borderRadius: 999,
    flexDirection: "row",
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  heroPrimaryButtonText: {
    color: colors.tealDark,
    fontSize: 14,
    fontWeight: "800",
  },
  heroSecondaryButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderColor: "rgba(255,255,255,0.42)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
  },
  heroSecondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  homeActions: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E0D6",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 18,
  },
  homeBody: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    marginTop: -22,
    paddingHorizontal: 18,
    paddingTop: 28,
    position: "relative",
    zIndex: 3,
  },
  statStrip: {
    backgroundColor: colors.ink,
    borderRadius: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    color: colors.gold,
    fontSize: 15,
    fontWeight: "900",
  },
  statLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  logoCarouselBlock: {
    marginTop: 22,
  },
  logoCarousel: {
    gap: 10,
    paddingRight: 18,
  },
  logoCarouselItem: {
    alignItems: "center",
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    height: 72,
    justifyContent: "center",
    padding: 8,
    width: 76,
  },
  logoCarouselImage: {
    borderRadius: 999,
    height: 54,
    resizeMode: "contain",
    width: 54,
  },
  logoCarouselFallback: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: 999,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  logoCarouselInitials: {
    color: colors.tealDark,
    fontSize: 16,
    fontWeight: "900",
  },
  sectionBlock: {
    marginTop: 26,
  },
  sectionHeaderRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: fontFamilies.displayMedium,
    fontSize: 22,
    fontWeight: "500",
    lineHeight: 28,
    marginTop: 4,
  },
  textLinkButton: {
    paddingBottom: 3,
    paddingLeft: 12,
  },
  textLink: {
    color: colors.teal,
    fontSize: 13,
    fontWeight: "800",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryTile: {
    borderRadius: 24,
    height: 142,
    overflow: "hidden",
    position: "relative",
    width: "48%",
  },
  categoryTileImage: {
    height: "100%",
    width: "100%",
  },
  categoryTileOverlay: {
    backgroundColor: "rgba(8, 35, 36, 0.30)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  categoryIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 999,
    height: 26,
    justifyContent: "center",
    position: "absolute",
    right: 10,
    top: 10,
    width: 26,
  },
  categoryTileLabel: {
    bottom: 12,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    left: 12,
    position: "absolute",
    right: 12,
  },
  workflowList: {
    gap: 10,
    marginTop: 14,
  },
  workflowItem: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  workflowNumber: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: 21,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  workflowCopy: {
    flex: 1,
  },
  workflowLabel: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 2,
  },
  workflowTitle: {
    color: colors.ink,
    fontFamily: fontFamilies.displayMedium,
    fontSize: 16,
    fontWeight: "500",
  },
  workflowDescription: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  ctaBand: {
    backgroundColor: colors.ink,
    borderRadius: 28,
    marginTop: 26,
    padding: 18,
  },
  ctaTitle: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.displayMedium,
    fontSize: 22,
    fontWeight: "500",
    lineHeight: 28,
  },
  ctaText: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
    marginTop: 8,
  },
  kicker: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: {
    color: colors.ink,
    fontFamily: fontFamilies.displayMedium,
    fontSize: 22,
    fontWeight: "500",
    lineHeight: 28,
  },
  body: {
    color: colors.muted,
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
  },
  searchHeader: {
    marginBottom: 16,
  },
  searchBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  searchSuggestions: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 24,
    borderWidth: 1,
    elevation: 3,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  searchSuggestionState: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    padding: 14,
  },
  searchSuggestionItem: {
    alignItems: "center",
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  searchSuggestionLogo: {
    backgroundColor: colors.line,
    borderRadius: 18,
    height: 36,
    width: 36,
  },
  searchSuggestionLogoFallback: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  searchSuggestionInitial: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900",
  },
  searchSuggestionName: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900",
  },
  searchSuggestionMeta: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  searchSuggestionEmpty: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    padding: 14,
  },
  searchInputWrap: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: 999,
    flex: 1,
    flexDirection: "row",
    gap: 9,
    minHeight: 50,
    paddingHorizontal: 13,
  },
  searchInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 16,
    minHeight: 48,
  },
  searchButton: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: 24,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 14,
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  searchState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  filterPanel: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 14,
    padding: 14,
  },
  filterHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  filterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  filterChip: {
    backgroundColor: colors.soft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  filterChipActive: {
    backgroundColor: colors.ink,
  },
  filterChipText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  filterChipTextActive: {
    color: colors.paper,
  },
  activeFilterRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  activeFilterChip: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
  },
  activeFilterText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  activeFilterRemove: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  categoryPills: {
    gap: 8,
    paddingBottom: 14,
  },
  categoryPill: {
    backgroundColor: colors.soft,
    borderColor: colors.soft,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  categoryPillActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  categoryPillText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  categoryPillTextActive: {
    color: "#FFFFFF",
  },
  resultCount: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  vendorList: {
    gap: 12,
  },
  vendorCard: {
    backgroundColor: colors.paper,
    borderRadius: 26,
    elevation: 3,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  vendorMediaWrap: {
    position: "relative",
  },
  vendorImage: {
    backgroundColor: colors.line,
    height: 220,
    width: "100%",
  },
  vendorImageFallback: {
    alignItems: "center",
    backgroundColor: "#E1F3F0",
    height: 150,
    justifyContent: "center",
    width: "100%",
  },
  vendorImageFallbackText: {
    color: colors.teal,
    fontSize: 26,
    fontWeight: "700",
  },
  favoriteButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 999,
    height: 38,
    justifyContent: "center",
    position: "absolute",
    right: 12,
    top: 12,
    width: 38,
  },
  availabilityBadge: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 999,
    bottom: 12,
    flexDirection: "row",
    gap: 5,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: "absolute",
  },
  availabilityText: {
    color: colors.tealDark,
    fontSize: 12,
    fontWeight: "800",
  },
  vendorCardBody: {
    padding: 16,
  },
  vendorCardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  vendorName: {
    color: colors.ink,
    flex: 1,
    fontFamily: fontFamilies.displayMedium,
    fontSize: 18,
    fontWeight: "500",
    lineHeight: 23,
  },
  ratingBadge: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: 999,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  vendorRating: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  vendorCategories: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
  },
  vendorBio: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  vendorFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  vendorMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  vendorMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  quoteButton: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  quoteButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  tabs: {
    backgroundColor: colors.ink,
    borderRadius: 999,
    bottom: 18,
    elevation: 8,
    flexDirection: "row",
    gap: 8,
    left: 22,
    padding: 8,
    position: "absolute",
    right: 22,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
  },
  tab: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    gap: 3,
    minHeight: 50,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tabActive: {
    backgroundColor: colors.paper,
  },
  tabText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 10,
    fontWeight: "600",
  },
  tabTextActive: {
    color: colors.ink,
  },
  viewToggle: {
    alignSelf: "flex-start",
    backgroundColor: "#E9EFEC",
    borderRadius: 8,
    flexDirection: "row",
    marginBottom: 12,
    padding: 3,
  },
  viewToggleButton: {
    alignItems: "center",
    borderRadius: 7,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  viewToggleButtonActive: {
    backgroundColor: colors.paper,
  },
  viewToggleText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  viewToggleTextActive: {
    color: colors.tealDark,
    fontSize: 12,
    fontWeight: "800",
  },
  mapResults: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  mapCanvas: {
    backgroundColor: "#DDEBE6",
    height: 280,
    overflow: "hidden",
    position: "relative",
  },
  mapGridLine: {
    backgroundColor: "rgba(255,255,255,0.64)",
    position: "absolute",
  },
  mapGridLineVerticalOne: {
    bottom: 0,
    left: "33%",
    top: 0,
    width: 1,
  },
  mapGridLineVerticalTwo: {
    bottom: 0,
    left: "66%",
    top: 0,
    width: 1,
  },
  mapGridLineHorizontalOne: {
    height: 1,
    left: 0,
    right: 0,
    top: "35%",
  },
  mapGridLineHorizontalTwo: {
    height: 1,
    left: 0,
    right: 0,
    top: "68%",
  },
  mapMarker: {
    alignItems: "center",
    backgroundColor: colors.tealDark,
    borderColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 2,
    elevation: 3,
    height: 34,
    justifyContent: "center",
    marginLeft: -17,
    marginTop: -17,
    position: "absolute",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    width: 34,
  },
  mapList: {
    gap: 1,
  },
  mapVendorRow: {
    alignItems: "center",
    backgroundColor: colors.paper,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: "row",
  },
  mapVendorMain: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 58,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  mapExternalButton: {
    alignItems: "center",
    borderLeftColor: colors.line,
    borderLeftWidth: 1,
    justifyContent: "center",
    minHeight: 58,
    width: 52,
  },
  mapVendorPin: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  mapVendorCopy: {
    flex: 1,
  },
  mapVendorName: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900",
  },
  mapVendorLocation: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  detailBackButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 999,
    flexDirection: "row",
    gap: 4,
    left: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: "absolute",
    top: 18,
    zIndex: 10,
  },
  detailBackText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  backButtonInline: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    marginBottom: 14,
  },
  backButtonText: {
    color: colors.tealDark,
    fontSize: 13,
    fontWeight: "800",
  },
  detailHero: {
    borderRadius: 0,
    height: 340,
    overflow: "hidden",
    position: "relative",
  },
  detailHeroImage: {
    height: "100%",
    width: "100%",
  },
  detailHeroFallback: {
    alignItems: "center",
    backgroundColor: "#E1F3F0",
    height: "100%",
    justifyContent: "center",
    width: "100%",
  },
  detailHeroShade: {
    backgroundColor: "rgba(0, 0, 0, 0.28)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  detailHeroActions: {
    flexDirection: "row",
    gap: 8,
    position: "absolute",
    right: 18,
    top: 18,
  },
  detailIconButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  detailHeroCopy: {
    bottom: 36,
    left: 0,
    padding: 22,
    position: "absolute",
    right: 0,
  },
  detailScreen: {
    backgroundColor: colors.paper,
    minHeight: "100%",
  },
  detailSheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    marginTop: -32,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  detailTitle: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.displayRegular,
    fontSize: 34,
    fontWeight: "400",
    lineHeight: 38,
  },
  detailCategories: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 8,
  },
  detailActionBar: {
    backgroundColor: colors.paper,
    borderRadius: 28,
    elevation: 4,
    flexDirection: "row",
    gap: 10,
    marginTop: -22,
    marginHorizontal: 12,
    padding: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
  },
  detailTabs: {
    gap: 8,
    paddingTop: 18,
    paddingBottom: 2,
  },
  detailTabPill: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderColor: colors.soft,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  detailTabText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800",
  },
  detailQuoteButton: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: 999,
    flex: 1,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 48,
  },
  detailQuoteText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  detailGhostButton: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 14,
  },
  detailGhostButtonDisabled: {
    opacity: 0.45,
  },
  detailGhostText: {
    color: colors.tealDark,
    fontSize: 14,
    fontWeight: "900",
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  metricCard: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    flexGrow: 1,
    minHeight: 104,
    padding: 13,
    width: "31%",
  },
  metricValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 18,
    marginTop: 9,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 4,
  },
  detailSection: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 14,
    padding: 16,
  },
  detailSectionTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 4,
  },
  detailSectionIcon: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: 19,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  detailBody: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  detailChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  detailChip: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: 999,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  detailChipText: {
    color: colors.tealDark,
    fontSize: 12,
    fontWeight: "800",
  },
  galleryStrip: {
    gap: 10,
    paddingRight: 4,
  },
  galleryImage: {
    backgroundColor: colors.line,
    borderRadius: 22,
    height: 150,
    width: 210,
  },
  galleryModal: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.94)",
    flex: 1,
    justifyContent: "center",
  },
  galleryModalClose: {
    alignItems: "center",
    backgroundColor: colors.paper,
    borderRadius: 999,
    height: 46,
    justifyContent: "center",
    position: "absolute",
    right: 18,
    top: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 16 : 56,
    width: 46,
    zIndex: 2,
  },
  galleryModalImage: {
    height: "82%",
    width: "100%",
  },
  pricingRows: {
    gap: 10,
    marginTop: 12,
  },
  pricingRow: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pricingLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800",
  },
  pricingValue: {
    color: colors.ink,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "900",
    marginLeft: 12,
    textAlign: "right",
  },
  pricingNote: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  spaceList: {
    gap: 10,
    marginTop: 12,
  },
  spaceCard: {
    backgroundColor: colors.soft,
    borderRadius: 20,
    padding: 12,
  },
  spaceTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
  },
  amenityGrid: {
    gap: 12,
    marginTop: 12,
  },
  amenityGroup: {
    backgroundColor: colors.soft,
    borderRadius: 20,
    padding: 12,
  },
  amenityGroupTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 8,
  },
  amenityItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 7,
  },
  amenityText: {
    color: colors.muted,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  teamList: {
    gap: 12,
    marginTop: 12,
  },
  teamCard: {
    backgroundColor: colors.soft,
    borderRadius: 22,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  teamAvatar: {
    backgroundColor: colors.line,
    borderRadius: 8,
    height: 72,
    width: 72,
  },
  teamAvatarFallback: {
    alignItems: "center",
    backgroundColor: "#E1F3F0",
    borderRadius: 8,
    height: 72,
    justifyContent: "center",
    width: 72,
  },
  teamAvatarText: {
    color: colors.tealDark,
    fontSize: 24,
    fontWeight: "900",
  },
  teamName: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  teamBio: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  responseTime: {
    color: colors.tealDark,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 7,
  },
  availabilityMonths: {
    gap: 12,
    marginTop: 12,
  },
  availabilityMonthScroller: {
    gap: 12,
    paddingRight: 4,
  },
  availabilityLegend: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  availabilityLegendItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  availabilityLegendDot: {
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  availabilityLegendOpen: {
    backgroundColor: "#26A269",
  },
  availabilityLegendBusy: {
    backgroundColor: "#D92D20",
  },
  availabilityMonthCard: {
    backgroundColor: colors.soft,
    borderRadius: 22,
    padding: 12,
  },
  availabilityCalendarTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 10,
  },
  availabilityWeekdays: {
    flexDirection: "row",
    marginBottom: 6,
  },
  availabilityWeekday: {
    color: colors.muted,
    flex: 1,
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
  },
  availabilityCalendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 6,
  },
  availabilityCalendarDayBlank: {
    aspectRatio: 1,
    width: "14.285%",
  },
  availabilityCalendarDay: {
    alignItems: "center",
    aspectRatio: 1,
    borderColor: "rgba(15,118,110,0.12)",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    position: "relative",
    width: "14.285%",
  },
  availabilityCalendarNumber: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
    includeFontPadding: false,
    left: 0,
    lineHeight: 18,
    position: "absolute",
    right: 0,
    textAlign: "center",
    textAlignVertical: "center",
    top: "50%",
    transform: [{ translateY: -9 }],
  },
  availabilityCalendarNumberOpen: {
    color: "#067647",
  },
  availabilityCalendarNumberBusy: {
    color: "#B42318",
  },
  availabilityDot: {
    backgroundColor: "#067647",
    borderRadius: 999,
    bottom: 5,
    height: 5,
    position: "absolute",
    width: 5,
  },
  availabilityDotBusy: {
    backgroundColor: "#B42318",
  },
  availabilityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  availabilityDay: {
    alignItems: "center",
    borderRadius: 8,
    minHeight: 82,
    paddingVertical: 10,
    width: "23%",
  },
  availabilityDayOpen: {
    backgroundColor: "#D8F5E4",
    borderColor: "#26A269",
  },
  availabilityDayBusy: {
    backgroundColor: "#FFE1DF",
    borderColor: "#D92D20",
  },
  availabilityMonth: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  availabilityDate: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 3,
  },
  availabilityStatus: {
    color: colors.tealDark,
    fontSize: 10,
    fontWeight: "900",
    marginTop: 3,
    textTransform: "uppercase",
  },
  aiReviewSummary: {
    alignItems: "flex-start",
    backgroundColor: colors.soft,
    borderRadius: 20,
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    padding: 12,
  },
  aiReviewText: {
    color: colors.ink,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  distributionList: {
    gap: 7,
    marginTop: 12,
  },
  distributionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  distributionLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    width: 48,
  },
  distributionTrack: {
    backgroundColor: colors.line,
    borderRadius: 999,
    flex: 1,
    height: 8,
    overflow: "hidden",
  },
  distributionFill: {
    backgroundColor: colors.gold,
    height: "100%",
  },
  distributionCount: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
    width: 24,
  },
  contactList: {
    gap: 10,
    marginBottom: 14,
    marginTop: 12,
  },
  contactRow: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: 20,
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  contactText: {
    color: colors.ink,
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
  },
  reviewList: {
    gap: 10,
    marginTop: 12,
  },
  reviewCard: {
    backgroundColor: colors.soft,
    borderRadius: 20,
    padding: 12,
  },
  reviewHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  reviewTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 10,
  },
  reviewBody: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
});

