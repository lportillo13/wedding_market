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
  home: {
    hero: {
      badge: "All-in-one wedding marketplace",
      title: "Plan your dream wedding with less stress",
      description:
        "Discover trusted professionals, compare quotes instantly and book your favourites without leaving the platform.",
      primaryCta: "Get personalised quotes",
      secondaryCta: "Browse vendors",
    },
    highlights: {
      heading: "Why couples choose us",
      items: [
        {
          title: "Curated vendor matches",
          description:
            "Answer a few questions and we will surface venues, photographers, florists and more who fit your style and budget.",
        },
        {
          title: "One place to compare quotes",
          description:
            "Send requests with a single click and keep every response organised so you can review availability, pricing and reviews side by side.",
        },
        {
          title: "Plan with total confidence",
          description:
            "Favourite the vendors you love, share shortlists with your partner and book with the support of our wedding planning team.",
        },
      ],
    },
    categories: {
      heading: "Explore popular categories",
      description:
        "Whether you're searching for the perfect venue or putting the finishing touches on decor, our directory showcases vetted professionals across every category.",
      seeVendors: "See vendors →",
      items: [
        { label: "Venues", slug: "venues" },
        { label: "Photography", slug: "photography" },
        { label: "Catering", slug: "catering" },
        { label: "Beauty", slug: "beauty" },
        { label: "Entertainment", slug: "entertainment" },
        { label: "Decor", slug: "decor" },
      ],
    },
    plan: {
      heading: "Ready to start planning?",
      description:
        "Build a shortlist, share it with your partner and message vendors directly. Wedding Market keeps your planning journey organised from the first idea to the final booking.",
      cta: "View your shortlist",
    },
  },
} as const;

export type CommonTranslations = typeof common;

export default common;
