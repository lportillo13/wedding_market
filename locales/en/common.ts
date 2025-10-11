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
  shortlistButton: {
    add: "Add to shortlist",
    inList: "In shortlist",
  },
  vendorsPage: {
    title: "Vendors",
    searchForm: {
      queryPlaceholder: "Search vendors (name, bio)…",
      categoryPlaceholder: "Filter by category slug (e.g. photography)",
      submit: "Search",
    },
    empty: "No vendors found.",
    pagination: {
      prev: "Prev",
      next: "Next",
      pageLabel: "Page {current} / {total}",
    },
  },
  vendorProfile: {
    writeReview: "Write a review",
    moreComing: "More details (gallery, FAQs, coupons) coming soon.",
  },
  vendorDashboard: {
    heading: "Vendor Dashboard",
    tabs: {
      overview: "Overview",
      rfqs: "RFQs",
      quotes: "Quotes",
      profile: "Profile",
      location: "Location",
      categories: "Categories",
      publish: "Publish",
    },
    overview: {
      welcome:
        "Welcome! Use the tabs above to manage your profile, review RFQs, and track quotes you’ve sent.",
    },
    profileForm: {
      businessNameLabel: "Business name",
      slugLabel: "Slug",
      slugPlaceholder: "my-amazing-vendor",
      slugHelp: "Only letters, numbers and hyphens.",
      bioEnLabel: "Bio (EN)",
      bioEsLabel: "Bio (ES)",
      save: "Save profile",
      saving: "Saving…",
    },
    location: {
      heading: "Location & Service Area",
      form: {
        addressLabel: "Address (formatted)",
        cityLabel: "City",
        stateLabel: "State/Region",
        countryLabel: "Country",
        radiusLabel: "Service radius (km)",
        save: "Save location",
        saving: "Saving…",
      },
      map: {
        searchLabel: "Search address",
        searchPlaceholder: "Type an address…",
      },
    },
    categories: {
      instructions: "Choose all that apply",
      save: "Save categories",
      saving: "Saving…",
      success: "Categories saved!",
    },
    publish: {
      heading: "Publish",
      description: "Toggle whether your vendor profile appears in public search.",
      status: {
        published: "Published (visible in catalog)",
        unpublished: "Unpublished (hidden from catalog)",
      },
      save: "Save",
      saving: "Saving…",
      viewPublic: "View public page",
    },
  },
  vendorInbox: {
    quoteForm: {
      amountLabel: "Quote (USD)",
      amountPlaceholder: "e.g. 2500",
      messageLabel: "Message",
      messagePlaceholder: "What’s included, availability, next steps…",
      submit: "Send quote",
      submitting: "Sending…",
      success: "Quote sent ✅",
    },
  },
  vendorRfqs: {
    title: "Received RFQs",
    noProfile: {
      message: "You don’t have a vendor profile yet. Create it in",
      linkLabel: "Vendor Profile",
    },
    empty: "No invites yet. You’ll see RFQs here when customers invite you.",
    rfqLabel: "RFQ",
    eventDateTbd: "Date TBD",
    guestCountTbd: "Guest count TBD",
    guestsLabel: "guests",
    budgetLabel: "Budget",
    invitedAtLabel: "Invited",
    expiresAtLabel: "Expires",
    status: {
      accepted: "ACCEPTED",
      responded: "RESPONDED",
      pending: "PENDING",
      declined: "DECLINED",
      expired: "EXPIRED",
      unknown: "STATUS",
    },
    contact: {
      revealed: "Contact revealed",
      hidden: "Contact hidden",
      hiddenNote: "Appears automatically if your quote is accepted.",
      noneShared: "No contact fields were shared.",
    },
    latestQuote: {
      heading: "Latest quote",
    },
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
  signup: {
    page: {
      title: "Create your account",
      description: "Sign up to request quotes, track vendors, and leave reviews.",
      alreadyHave: "Already have an account?",
      loginLink: "Log in",
    },
    form: {
      emailLabel: "Email",
      passwordLabel: "Password",
      passwordHelp: "At least 6 characters.",
      submit: "Create account",
      submitting: "Signing up…",
    },
    vendor: {
      gate: {
        title: "Become a vendor",
        description: "Log in or create an account to start building your vendor profile.",
        loginCta: "Log in",
        newHere: "New here?",
        signUpLink: "Sign up first",
      },
      formPage: {
        title: "Create your vendor profile",
        description: "Tell us who you are so we can set up your vendor dashboard.",
      },
      form: {
        businessNameLabel: "Business name",
        cityLabel: "City",
        countryLabel: "Country",
        submit: "Create vendor profile",
        submitting: "Creating…",
      },
    },
  },
} as const;

export type CommonTranslations = typeof common;

export default common;
