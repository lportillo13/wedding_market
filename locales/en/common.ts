const common = {
  languageSelector: {
    label: "Language",
    english: "English",
    spanish: "Spanish",
  },
  nav: {
    brand: "Wedding Market",
    vendors: "Vendors",
    myRequests: "My requests",
    requestQuotes: "Request quotes",
    shortlist: "Shortlist",
    shortlistCountLabel: "shortlisted",
    signUp: "Sign up",
    logIn: "Log in",
  },
  auth: {
    account: "Account",
    profile: "Profile",
    vendorRfqs: "Vendor RFQs",
    createVendorProfile: "Create vendor profile",
    logOut: "Log out",
  },
} as const;

export type CommonTranslations = typeof common;

export default common;
