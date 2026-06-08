const common = {
  "languageSelector": {
    "label": "Language",
    "english": "English",
    "spanish": "Spanish"
  },
  "nav": {
    "brand": "Wedding Market",
    "vendors": "Vendors",
    "vendorsMenu": {
      "panelLabel": "Vendor navigation",
      "searchEyebrow": "Find a vendor",
      "searchHeading": "Search by business name",
      "searchDescription": "Jump straight to a vendor profile or browse the full directory.",
      "searchPlaceholder": "Start typing a vendor name...",
      "loading": "Searching vendors...",
      "noResults": "No vendor matches that search yet.",
      "browseAll": "Browse all vendors",
      "categoriesEyebrow": "Browse by category",
      "categoriesHeading": "All vendor categories"
    },
    "about": "About",
    "blog": "Blog",
    "myRequests": "My requests",
    "requestQuotes": "Request quotes",
    "notifications": "Notifications",
    "notificationsUnreadLabel": "unread notifications",
    "notificationsLoading": "Loading notifications...",
    "notificationsEmpty": "No notifications yet.",
    "notificationsViewAll": "View all notifications",
    "shortlist": "Shortlist",
    "shortlistCountLabel": "shortlisted",
    "signUp": "Sign up",
    "logIn": "Log in"
  },
  "footer": {
    "eyebrow": "Plan beautifully",
    "title": "The modern wedding marketplace for couples with taste.",
    "description": "Discover standout vendors, compare offers with clarity, and move from inspiration to booking in one elegant workflow.",
    "primaryCta": "Request quotes",
    "secondaryCta": "Browse vendors",
    "brandBlurb": "Wedding Market brings venues, photographers, planners, beauty teams, and more into one polished planning experience.",
    "bottomTagline": "Designed for couples and professionals building exceptional celebrations.",
    "copyrightPrefix": "©",
    "sections": {
      "explore": "Explore",
      "categories": "Popular categories",
      "professionals": "For professionals",
      "navigation": "Navigation",
      "contact": "Contact",
      "socials": "Socials"
    },
    "newsletter": {
      "eyebrow": "Stay in the loop",
      "heading": "Stay updated on the latest from Wedding Market",
      "placeholder": "Your email address",
      "submit": "Subscribe",
      "successMessage": "You're on the list!"
    },
    "contact": {
      "email": "hello@weddingmarket.com",
      "phone": "+1 (800) 555-0199",
      "location": "Miami, FL"
    },
    "legal": {
      "terms": "Terms",
      "privacy": "Privacy"
    },
    "vendorLinks": {
      "join": "Become a vendor",
      "dashboard": "Vendor dashboard",
      "requests": "Customer requests"
    }
  },
  "auth": {
    "account": "Account",
    "profile": "Profile",
    "notifications": "Notifications",
    "vendorRfqs": "Customer requests",
    "createVendorProfile": "Create vendor profile",
    "logOut": "Log out"
  },
  "theme": {
    "switchToLight": "Switch to light theme",
    "switchToDark": "Switch to dark theme"
  },
  "account": {
    "layout": {
      "heading": "My account",
      "tabs": {
        "profile": "Profile",
        "inbox": "Inbox",
        "rfqs": "My requests",
        "quotes": "Quotes received",
        "notifications": "Notifications",
        "reviews": "Reviews"
      }
    },
    "profile": {
      "title": "Profile",
      "loginRequired": "Please log in to view your profile.",
      "intro": "Update your contact information and wedding preferences.",
      "avatar": {
        "heading": "Profile photo",
        "description": "Add a profile photo so vendors recognize you across the site.",
        "fileLabel": "Profile image",
        "messages": {
          "storageNotConfigured": "Image storage is not configured.",
          "chooseImage": "Please choose an image.",
          "emptyFile": "The selected file is empty.",
          "unsupportedType": "Unsupported file type.",
          "sizeLimit": "Image must be smaller than {mb}MB.",
          "loginRequired": "You must be logged in to update your profile.",
          "updated": "Profile photo updated.",
          "uploadFailed": "We couldn't upload your profile photo right now. Please try again."
        },
        "helpText": "We’ll optimize the image for fast loading.",
        "submit": {
          "label": "Upload photo",
          "pending": "Uploading…"
        }
      },
      "form": {
        "fullNameLabel": "Name",
        "phoneLabel": "Phone",
        "emailLabel": "Email",
        "emailHelp": "Email is managed via your login credentials.",
        "countryLabel": "Country",
        "countryPlaceholder": "Select a country",
        "preferredLanguageLabel": "Preferred language",
        "preferredLanguageHelp": "Changes the default language shown after you log in.",
        "weddingPreferencesHeading": "Wedding preferences",
        "tentativeWeddingDateLabel": "Tentative wedding date",
        "guestCountLabel": "Estimated number of guests",
        "budgetLabel": "Budget (USD)",
        "weddingThemeLabel": "Wedding theme",
        "weddingTheme": {
          "options": {
            "none": "—",
            "classic": "Classic",
            "boho": "Boho",
            "rustic": "Rustic",
            "beach": "Beach",
            "garden": "Garden",
            "modern": "Modern",
            "vintage": "Vintage"
          }
        },
        "validation": {
          "fullNameRequired": "Name is required.",
          "fullNameTooLong": "Name is too long.",
          "phoneTooLong": "Phone number is too long.",
          "countryTooLong": "Country name is too long.",
          "invalidDate": "Enter a valid date.",
          "invalidGuestCount": "Enter a valid guest count.",
          "invalidBudget": "Enter a valid budget.",
          "reviewForm": "Please review the form."
        },
        "messages": {
          "loginRequired": "You must be logged in to update your profile.",
          "updated": "Profile updated successfully.",
          "saveFailed": "We couldn't save your profile right now. Please try again."
        },
        "submit": {
          "label": "Save profile",
          "saving": "Saving…"
        }
      }
    },
    "notificationsPage": {
      "title": "Notifications",
      "missingTablePrefix": "The notifications table does not exist in the local database yet. Run the SQL in",
      "missingTableSuffix": "in Supabase to enable it.",
      "intro": "When a vendor responds to or updates a quote, you'll see it here.",
      "moveAllToDeleted": "Move all to deleted",
      "empty": "You don't have any notifications yet. Quote responses will appear here.",
      "deletedTitle": "Deleted",
      "deletedDescription": "You can restore them or delete them permanently.",
      "deleteDeletedForever": "Permanently delete deleted items",
      "deletedEmpty": "You don't have any deleted notifications.",
      "vendorFallback": "Vendor",
      "types": {
        "quoteUpdated": "Quote updated",
        "newQuote": "New quote received",
        "generic": "Notification",
        "deleted": "Deleted"
      },
      "titles": {
        "quoteUpdated": "Quote updated",
        "newQuote": "New quote received"
      },
      "messages": {
        "quoteUpdated": "{vendor} updated a quote{amountSuffix}.",
        "newQuote": "{vendor} sent a quote{amountSuffix}.",
        "generic": "You have a new notification.",
        "deleted": "Deleted notification.",
        "amountSuffix": " for {amount}",
        "requestSummary": "Request {rfq}... · Quote {quote}..."
      },
      "actions": {
        "replyReview": "Reply / review",
        "viewRequest": "View request",
        "moveToDeleted": "Move to deleted",
        "restore": "Restore",
        "deleteForever": "Delete permanently"
      }
    },
    "quotesPage": {
      "title": "Quotes received",
      "loginRequired": "Log in to view your quotes.",
      "loginAction": "Log in",
      "empty": "You haven't received any quotes yet.",
      "vendorFallback": "Vendor",
      "receivedAt": "Received {date}",
      "eventDateTbd": "Date TBD",
      "status": {
        "accepted": "Accepted",
        "pending": "Pending"
      },
      "messages": {
        "requestSummary": "Request {rfq}... · {location} · {date}",
        "quoteAccepted": "Quote accepted"
      },
    "actions": {
      "viewRequestDetails": "View request details"
    },
    "conversation": {
      "heading": "Conversation",
      "empty": "No replies yet.",
      "youLabel": "You",
      "replyAction": "Reply",
      "replyPending": "Sending...",
      "replyPlaceholder": "Ask a follow-up question or reply to this quote.",
      "replySuccess": "Reply sent."
    }
  },
    "reviewsPage": {
      "title": "My reviews",
      "loginRequired": "Log in to view your reviews.",
      "loginAction": "Log in",
      "empty": "You haven't written any reviews yet.",
      "requestLabel": "Request {rfq}...",
      "newTitle": "Write a review",
      "messages": {
        "ownRequestOnly": "You can only review your own requests.",
        "hiredOnly": "You can only review vendors you hired.",
        "alreadyReviewed": "You can only review vendors you hired and haven't reviewed yet."
      },
      "actions": {
        "backToRequests": "Back to my requests",
        "viewMyReviews": "View my reviews"
      }
    },
    "reviewForm": {
      "ratingLabel": "Rating",
      "titleLabel": "Title",
      "bodyLabel": "Review",
      "submit": "Submit review",
      "submitting": "Submitting...",
      "errors": {
        "invalidInput": "Please review the form and try again.",
        "notAuthenticated": "You must be logged in to submit a review.",
        "notAllowed": "You can only review vendors you hired.",
        "submitFailed": "We couldn't submit your review right now. Please try again."
      }
    },
    "rfqsPage": {
      "title": "My requests",
      "loginRequired": "Log in to view your requests.",
      "loginAction": "Log in",
      "loadFailed": "We couldn't load your requests right now. Please try again later.",
      "empty": "You haven't created any requests yet.",
      "acceptedBadge": "Accepted",
      "notFound": "We couldn't find that request.",
      "noAccess": "You don't have access to this request.",
      "backToRequests": "Back to my requests",
      "writeReview": "Write review",
      "writeReviewAria": "Write a review for this vendor",
      "dateTbd": "Date TBD",
      "guestCount": "{count} guests",
      "guestCountTbd": "Guest count TBD",
      "budget": "Budget: {min}-{max}",
      "quotesHeading": "Quotes ({count})",
      "winnerSelected": "Winner selected",
      "emptyQuotes": "There are no quotes yet. Vendors will appear here when they respond.",
      "vendorFallback": "Vendor",
      "winnerBadge": "Winner",
      "formatting": {
        "titleInLocation": "Wedding request in {location}",
        "titleForDate": "Wedding request for {date}",
        "titleFallback": "Wedding request",
        "locationTbd": "Location TBD"
      },
      "acceptQuote": {
        "shareEmail": "Share my email address",
        "sharePhone": "Share my phone number",
        "submit": "Accept quote",
        "submitting": "Accepting...",
        "errors": {
          "missingIds": "We couldn't match that request and quote.",
          "loginRequired": "Please log in first.",
          "notAllowed": "You're not allowed to accept this quote.",
          "alreadyAccepted": "A quote has already been accepted for this request.",
          "invalidQuote": "This quote doesn't belong to the current request.",
          "acceptFailed": "We couldn't accept this quote right now. Please try again."
        }
      }
    }
  },
  "login": {
    "title": "Log in",
    "emailLabel": "Email",
    "passwordLabel": "Password",
    "submit": "Log in",
    "submitting": "Logging in...",
    "google": "Continue with Google",
    "registerPrompt": "New here?",
    "registerLink": "Create your account"
  },
  "shortlistButton": {
    "add": "Add to shortlist",
    "inList": "In shortlist"
  },
  "shortlistPage": {
    "title": "Your favorites",
    "empty": {
      "title": "You haven't favorited any vendors yet.",
      "descriptionBeforeLink": "Browse the ",
      "descriptionAfterLink": " to add favorites, then request quotes when you're ready.",
      "directoryLink": "vendor directory"
    },
    "saved": {
      "heading": "Favorited vendors",
      "loading": "Loading...",
      "unavailable": "Vendor unavailable",
      "remove": "Remove",
      "loadError": "We couldn't load vendor details. Please try again later."
    },
    "cta": {
      "title": "Ready to contact your favorites?",
      "description": "Use the request quotes form to share your event details with these vendors.",
      "button": "Request quotes"
    }
  },
  "vendorsPage": {
    "title": "Vendors",
    "eyebrow": "Vendor directory",
    "description": "Discover top-rated wedding professionals and browse by name, style, or category.",
    "searchForm": {
      "queryPlaceholder": "Search vendors (name, bio)…",
      "categoryPlaceholder": "Filter by category",
      "categoryAllLabel": "All categories",
      "submit": "Search"
    },
    "empty": "No vendors found.",
    "pagination": {
      "prev": "Prev",
      "next": "Next",
      "pageLabel": "Page {current} / {total}"
    }
  },
  "vendorProfile": {
    "writeReview": "Write a review",
    "galleryHeading": "Gallery",
    "extraInfoHeading": "Additional details",
    "moreComing": "Have questions? Reach out to the vendor for more details.",
    "share": {
      "button": "Share",
      "shareMessage": "Check out {vendor} on Wedding Market.",
      "email": "Share via email",
      "emailSubject": "Check out {vendor}",
      "emailBody": "I found {vendor} on Wedding Market and thought you'd like to see it: {url}",
      "copyLink": "Copy link",
      "copySuccess": "Link copied!",
      "copyError": "Unable to copy link",
      "facebook": "Share on Facebook",
      "x": "Share on X",
      "whatsapp": "Share on WhatsApp"
    }
  },
  "vendorPublic": {
    "breadcrumbHome": "Home",
    "tabs": {
      "photos": "Photos",
      "about": "About",
      "pricing": "Pricing",
      "amenities": "Amenities",
      "team": "Team",
      "availability": "Availability",
      "reviews": "Reviews",
      "contact": "Contact"
    },
    "header": {
      "logoAlt": "Logo of {vendor}",
      "yearsInBusiness": "{years}+ years in business",
      "languages": "Languages: {languages}",
      "reviewsCount": "({count} reviews)",
      "noReviews": "No reviews yet",
      "startingPrice": "Starting at {price}",
      "typicalSpend": "Couples usually spend {price}",
      "loginToViewPricing": "Log in to view pricing and availability.",
      "requestQuote": "Request quote",
      "logInToRequestQuote": "Log in to request a quote",
      "viewReceivedRequests": "View received requests"
    },
    "about": {
      "heading": "About {vendor}",
      "teamSize": "Team size: {size}",
      "visitWebsite": "Visit {vendor}",
      "spacesHeading": "Event Spaces",
      "serviceDetailHeadings": {
        "default": "Service Details",
        "venues": "Event Spaces",
        "planners": "Planning Services",
        "photography": "Photo Coverage & Deliverables",
        "videography": "Film Coverage & Deliverables",
        "catering": "Menu & Service Formats",
        "cakes": "Cake & Dessert Options",
        "bar": "Bar Service Options",
        "music": "Entertainment Coverage",
        "flowers": "Floral & Decor Scope",
        "lighting": "Lighting & AV Scope",
        "rentals": "Rental Collections",
        "beauty": "Hair & Makeup Services",
        "attire": "Attire Services",
        "officiants": "Ceremony Services",
        "stationery": "Paper Goods & Signage",
        "photobooth": "Photo Booth Experiences",
        "transport": "Transportation Options",
        "accommodations": "Room Block Support",
        "destination_planning": "Travel Planning Support"
      },
      "capacity": "Supports up to {count} guests"
    },
    "amenities": {
      "heading": "Services & Details",
      "capacity": "Guest count supported: up to {count}",
      "empty": "Amenities are being updated.",
      "categoryHeadings": {
        "default": "Services & Details",
        "venues": "Amenities & Details",
        "planners": "Planning Details",
        "photography": "Photo Details",
        "videography": "Video Details",
        "catering": "Catering Details",
        "cakes": "Cake Details",
        "bar": "Bar Details",
        "music": "Entertainment Details",
        "flowers": "Floral & Decor Details",
        "lighting": "Lighting & AV Details",
        "rentals": "Rental Details",
        "beauty": "Beauty Details",
        "attire": "Attire Details",
        "officiants": "Ceremony Details",
        "stationery": "Stationery Details",
        "photobooth": "Photo Booth Details",
        "transport": "Transportation Details",
        "accommodations": "Hotel Block Details",
        "destination_planning": "Travel Planning Details"
      },
      "groups": {
        "amenities": "Amenities",
        "ceremonyTypes": "Ceremony Types",
        "settings": "Settings",
        "services": "Services"
      },
      "groupLabelsByCategory": {
        "default": {
          "amenities": "Highlights",
          "ceremonyTypes": "Coverage",
          "settings": "Style",
          "services": "Services"
        },
        "venues": {
          "amenities": "Amenities",
          "ceremonyTypes": "Ceremony Types",
          "settings": "Settings",
          "services": "Venue Services"
        },
        "planners": {
          "amenities": "Planning Scope",
          "ceremonyTypes": "Event Scope",
          "settings": "Planning Style",
          "services": "Coordination Services"
        },
        "photography": {
          "amenities": "Deliverables",
          "ceremonyTypes": "Shoot Types",
          "settings": "Photo Styles",
          "services": "Photo Services"
        },
        "videography": {
          "amenities": "Film Deliverables",
          "ceremonyTypes": "Coverage",
          "settings": "Film Styles",
          "services": "Video Services"
        },
        "catering": {
          "amenities": "Menu Services",
          "ceremonyTypes": "Cuisine",
          "settings": "Meal Formats",
          "services": "Catering Services"
        },
        "cakes": {
          "amenities": "Dessert Options",
          "ceremonyTypes": "Flavors",
          "settings": "Cake Styles",
          "services": "Bakery Services"
        },
        "bar": {
          "amenities": "Beverage Options",
          "ceremonyTypes": "Bar Formats",
          "settings": "Drink Style",
          "services": "Bar Services"
        },
        "music": {
          "amenities": "Equipment",
          "ceremonyTypes": "Events Covered",
          "settings": "Music Styles",
          "services": "Entertainment Services"
        },
        "flowers": {
          "amenities": "Floral Pieces",
          "ceremonyTypes": "Decor Elements",
          "settings": "Design Style",
          "services": "Floral Services"
        },
        "lighting": {
          "amenities": "Equipment",
          "ceremonyTypes": "Events Covered",
          "settings": "Production Style",
          "services": "AV Services"
        },
        "rentals": {
          "amenities": "Rental Inventory",
          "ceremonyTypes": "Collections",
          "settings": "Event Style",
          "services": "Rental Services"
        },
        "beauty": {
          "amenities": "Beauty Services",
          "ceremonyTypes": "Trial Options",
          "settings": "Service Location",
          "services": "Day-of Services"
        },
        "attire": {
          "amenities": "Attire Options",
          "ceremonyTypes": "Appointments",
          "settings": "Style Range",
          "services": "Alteration Services"
        },
        "officiants": {
          "amenities": "Ceremony Types",
          "ceremonyTypes": "Counseling",
          "settings": "Ceremony Style",
          "services": "Officiant Services"
        },
        "stationery": {
          "amenities": "Paper Goods",
          "ceremonyTypes": "Event Pieces",
          "settings": "Design Style",
          "services": "Stationery Services"
        },
        "photobooth": {
          "amenities": "Booth Features",
          "ceremonyTypes": "Events Covered",
          "settings": "Booth Style",
          "services": "Photo Booth Services"
        },
        "transport": {
          "amenities": "Vehicles",
          "ceremonyTypes": "Routes",
          "settings": "Fleet Style",
          "services": "Transportation Services"
        },
        "accommodations": {
          "amenities": "Hotel Support",
          "ceremonyTypes": "Guest Services",
          "settings": "Stay Style",
          "services": "Room Block Services"
        },
        "destination_planning": {
          "amenities": "Travel Support",
          "ceremonyTypes": "Itinerary Scope",
          "settings": "Destination Style",
          "services": "Planning Services"
        }
      }
    },
    "availability": {
      "heading": "Availability",
      "availableLegend": "Available",
      "busyLegend": "Busy",
      "monthSliderLabel": "Browse months",
      "monthSliderHelp": "Move the slider to browse up to 2 years ahead.",
      "empty": "Availability calendar coming soon. Contact the vendor for current openings.",
      "loginRequired": "Log in to view this vendor's availability details.",
      "logInAction": "Log in"
    },
    "gallery": {
      "photosHeading": "Photos",
      "videosHeading": "Videos",
      "seeAll": "See all ({count})",
      "noPhotos": "No photos uploaded yet.",
      "noVideos": "No videos available.",
      "close": "Close",
      "previousPhoto": "Previous photo",
      "nextPhoto": "Next photo",
      "defaultVideoCaption": "Video with description",
      "captionsLabel": "English captions",
      "unsupportedVideo": "Your browser does not support the video tag.",
      "videoCount": "{count} video{suffix}",
      "reviewPhotoAlt": "Review photo"
    },
    "pricing": {
      "heading": "Pricing",
      "typicalSpend": "Couples usually spend {price}",
      "peakSeason": "Peak season: {season}",
      "package": "Package",
      "price": "Price",
      "details": "Details",
      "contactForPrice": "Contact for price",
      "loginRequired": "Log in to view this vendor's pricing.",
      "logInAction": "Log in",
      "customQuote": "Reach out for a custom quote.",
      "items": {
        "reception": "Reception",
        "ceremony": "Ceremony",
        "bar": "Bar Service",
        "catering": "Catering",
        "venue_rental": "Venue Rental",
        "ceremony_site": "Ceremony Site",
        "reception_package": "Reception Package",
        "bar_package": "Bar Package",
        "catering_package": "Catering Package",
        "full_planning": "Full-Service Planning",
        "partial_planning": "Partial Planning",
        "month_of_coordination": "Month-of Coordination",
        "destination_weekend": "Destination Weekend",
        "photo_coverage": "Wedding Photo Coverage",
        "engagement_session": "Engagement Session",
        "second_shooter": "Second Photographer",
        "wedding_album": "Wedding Album",
        "highlight_film": "Highlight Film",
        "documentary_film": "Documentary Film",
        "raw_footage": "Raw Footage",
        "drone_addon": "Drone Add-On",
        "plated_dinner": "Plated Dinner",
        "buffet_service": "Buffet Service",
        "cocktail_hour": "Cocktail Hour",
        "late_night_snacks": "Late-Night Snacks",
        "wedding_cake": "Wedding Cake",
        "dessert_bar": "Dessert Bar",
        "tasting": "Tasting",
        "delivery_setup": "Delivery & Setup",
        "hosted_bar": "Hosted Bar",
        "signature_cocktails": "Signature Cocktails",
        "bartenders": "Bartenders",
        "non_alcoholic": "Non-Alcoholic Bar",
        "dj_reception": "DJ Reception",
        "ceremony_audio": "Ceremony Audio",
        "live_music": "Live Music",
        "lighting_addon": "Lighting Add-On",
        "bridal_party_flowers": "Bridal Party Flowers",
        "ceremony_installation": "Ceremony Installation",
        "reception_centerpieces": "Reception Centerpieces",
        "uplighting": "Uplighting",
        "av_package": "AV Package",
        "dance_floor_lighting": "Dance Floor Lighting",
        "tabletop_rentals": "Tabletop Rentals",
        "lounge_furniture": "Lounge Furniture",
        "tenting": "Tenting",
        "bridal_hair_makeup": "Bridal Hair & Makeup",
        "trial_session": "Trial Session",
        "bridal_party_member": "Bridal Party Member",
        "touch_up_service": "Touch-Up Service",
        "bridal_gown": "Bridal Gown",
        "alterations": "Alterations",
        "accessories": "Accessories",
        "suit_tux": "Suit / Tux",
        "ceremony_officiating": "Ceremony Officiating",
        "premarital_session": "Premarital Session",
        "rehearsal": "Rehearsal",
        "custom_ceremony": "Custom Ceremony",
        "invitation_suite": "Invitation Suite",
        "save_the_dates": "Save the Dates",
        "day_of_paper": "Day-of Paper",
        "signage": "Signage",
        "booth_package": "Booth Package",
        "prints_props": "Prints & Props",
        "digital_gallery": "Digital Gallery",
        "attendant": "Attendant",
        "getaway_car": "Getaway Car",
        "guest_shuttle": "Guest Shuttle",
        "party_bus": "Party Bus",
        "airport_transfer": "Airport Transfer",
        "room_block": "Room Block",
        "welcome_bags": "Welcome Bags",
        "hospitality_suite": "Hospitality Suite",
        "shuttle_coordination": "Shuttle Coordination",
        "travel_planning": "Travel Planning",
        "guest_itinerary": "Guest Itinerary",
        "vendor_sourcing": "Vendor Sourcing",
        "weekend_coordination": "Weekend Coordination",
        "signature": "Signature Package",
        "premium": "Premium Package",
        "full_service": "Full-Service Package"
      }
    },
    "reviews": {
      "heading": "Reviews",
      "basedOn": "Based on {count} review{suffix}",
      "googleSource": "Reviews are synced from this vendor's Google Business Profile.",
      "viewOnGoogle": "View on Google",
      "searchLabel": "Search reviews",
      "searchPlaceholder": "Search by keyword",
      "filterAria": "Filter reviews by rating",
      "all": "All",
      "sortBy": "Sort by",
      "newest": "Newest",
      "highest": "Highest rating",
      "lowest": "Lowest rating",
      "verifiedCouple": "Verified Couple",
      "vendorReply": "Vendor reply:",
      "noMatches": "No reviews match your filters yet.",
      "pagination": "Reviews pagination",
      "previous": "Previous",
      "next": "Next",
      "breakdownAria": "Rating breakdown",
      "distribution": "Rating distribution",
      "stars": "{count} stars",
      "distributionAria": "{count} reviews with {stars} stars",
      "noReviews": "No reviews yet."
    },
    "contact": {
      "heading": "Request pricing & availability",
      "intro": "Share a few details and {vendor} will reach out with tailored information.",
      "loginRequired": "Log in to view contact details and send a quote request to this vendor.",
      "logInAction": "Log in",
      "vendorHeading": "Manage received requests",
      "vendorIntro": "You are viewing this page as a vendor. Check your dashboard to review requests sent to {vendor}.",
      "success": "Thanks. Your request has been sent. We'll be in touch soon.",
      "unexpected": "Unexpected response.",
      "failed": "Failed to send your request.",
      "genericError": "Something went wrong.",
      "firstName": "First name",
      "firstNameRequired": "Please enter your first name.",
      "lastName": "Last name",
      "lastNameRequired": "Please enter your last name.",
      "email": "Email",
      "emailRequired": "Please enter your email.",
      "emailInvalid": "Enter a valid email.",
      "phoneOptional": "Phone (optional)",
      "eventDate": "Event date",
      "flexibleDate": "Date is flexible",
      "guestRange": "Guest count range",
      "guestRangePlaceholder": "e.g. 100-150",
      "guestRangeRequired": "Let us know your estimated guest count.",
      "message": "Message",
      "messagePlaceholder": "Share your vision, must-haves, or questions for the vendor.",
      "messageRequired": "Please include a short message.",
      "submitting": "Sending...",
      "submit": "Send request",
      "update": "Update request",
      "detailsHeading": "Vendor details",
      "phoneLabel": "Phone:",
      "websiteLabel": "Website:",
      "addressLabel": "Address:",
      "viewMap": "View on map"
    },
    "team": {
      "heading": "Meet the Team",
      "empty": "Team information coming soon.",
      "respondsWithin24": "Typically responds within 24 hours",
      "respondsWithin": "Typically responds within {hours} hours"
    }
  },
  "vendorDashboard": {
    "heading": "Vendor Dashboard",
    "tabs": {
      "overview": "Overview",
      "inbox": "Inbox",
      "rfqs": "Requests",
      "quotes": "Quotes",
      "notifications": "Notifications",
      "profile": "Profile",
      "location": "Location",
      "categories": "Categories",
      "publish": "Publish"
    },
    "overview": {
      "welcome": "Welcome! Use the tabs above to manage your profile, review customer requests, and track quotes you’ve sent."
    },
    "profileForm": {
      "businessNameLabel": "Business name",
      "slugLabel": "Slug",
      "slugPlaceholder": "my-amazing-vendor",
      "slugHelp": "Only letters, numbers and hyphens.",
      "bioEnLabel": "Bio (EN)",
      "bioEsLabel": "Bio (ES)",
      "extraInfoEnLabel": "Extra info (EN)",
      "extraInfoEsLabel": "Extra info (ES)",
      "translateFromEnglish": "Translate from English",
      "translating": "Translating…",
      "translationSourceMissing": "Add English text first to translate automatically.",
      "translationFailed": "Translation failed. Please try again.",
      "save": "Save profile",
      "saving": "Saving…"
    },
    "profileTabs": {
      "details": "Profile details",
      "contact": "Contact",
      "pricing": "Pricing",
      "amenities": "Amenities",
      "team": "Team",
      "availability": "Availability",
      "reviews": "Reviews",
      "images": "Images"
    },
    "profileContact": {
      "phoneLabel": "Phone number",
      "websiteLabel": "Website",
      "mapLabel": "Map link",
      "mapHelp": "Add a Google Maps or other mapping URL so couples can open directions.",
      "addressLabel": "Public address label",
      "startingPriceLabel": "Starting price",
      "startingPriceHelp": "Enter the price couples can expect to pay at minimum (numbers only).",
      "startingCurrencyLabel": "Currency",
      "currencyPlaceholder": "e.g. 2500",
      "yearsInBusinessLabel": "Years in business",
      "eventTypesLabel": "Event types",
      "languagesLabel": "Languages",
      "teamSizeLabel": "Team size range",
      "csvHelp": "Separate multiple values with commas (e.g. English, Spanish).",
      "saving": "Saving…",
      "save": "Save contact"
    },
    "profilePricing": {
      "typicalSpendLabel": "Typical spend",
      "typicalSpendPlaceholder": "e.g. 7500",
      "typicalSpendHelp": "What couples usually spend with you.",
      "peakSeasonsLabel": "Peak seasons",
      "csvHelp": "Separate seasons with commas (e.g. Spring, Fall).",
      "packageColumn": "Package",
      "priceColumn": "Price",
      "notesColumn": "Notes",
      "currencyPlaceholder": "e.g. 2500",
      "contactForPrice": "Contact for price",
      "notesEnLabel": "Notes (EN)",
      "notesEsLabel": "Notes (ES)",
      "reception": "Reception",
      "ceremony": "Ceremony",
      "bar": "Bar service",
      "catering": "Catering",
      "saving": "Saving…",
      "save": "Save pricing"
    },
    "profileAmenities": {
      "capacityLabel": "Maximum capacity",
      "eventTypesLabel": "Event types supported",
      "csvHelp": "Separate multiple values with commas.",
      "instructions": "Select everything that applies to your venue or service.",
      "groups": {
        "amenities": "Amenities",
        "ceremony_types": "Ceremony types",
        "settings": "Settings",
        "services": "Services"
      },
      "saving": "Saving…",
      "save": "Save amenities"
    },
    "profileTeam": {
      "heading": "Team members",
      "add": "Add team member",
      "empty": "No team members yet. Add your key contacts so couples know who they’ll meet.",
      "memberTitle": "Team member {index}",
      "remove": "Remove",
      "nameLabel": "Name",
      "titleLabel": "Title",
      "bioLabel": "Bio",
      "headshotLabel": "Headshot URL",
      "responseLabel": "Typical response time (hours)",
      "responsePlaceholder": "e.g. 24",
      "responseHelp": "Share how quickly couples can expect to hear back.",
      "saving": "Saving…",
      "save": "Save team"
    },
    "profileAvailability": {
      "calendarLabel": "Availability calendar",
      "calendarHelp": "Dates show as busy by default. Click dates to mark them available in green, or clear them to return them to busy.",
      "monthSliderLabel": "Browse months",
      "monthSliderHelp": "Move the slider to browse and edit dates up to 2 years ahead.",
      "markAvailable": "Mark available",
      "clearDate": "Reset to busy",
      "changeMarkedAvailable": "Date marked as available. Save to apply the change.",
      "changeResetBusy": "Date reset to busy. Save to apply the change.",
      "selectedDatesLabel": "Selected calendar dates",
      "availableChip": "Available",
      "busyChip": "Busy",
      "noDates": "No availability dates selected yet.",
      "saving": "Saving…",
      "save": "Save availability"
    },
    "profileReviews": {
      "summaryLabel": "Review highlight",
      "summaryHelp": "Summarize what couples love about working with you. This appears above your reviews.",
      "googleLinkLabel": "Google Business Profile link",
      "googleLinkHelp": "Paste the share link or Place ID for your Google Business Profile reviews.",
      "saving": "Saving…",
      "save": "Save reviews"
    },
    "profileImages": {
      "heading": "Images",
      "help": "Upload hero, thumbnail, and gallery images. We’ll optimize them for the site.",
      "heroLabel": "Hero image",
      "heroEmpty": "No hero image yet.",
      "thumbnailLabel": "Thumbnail image",
      "thumbnailEmpty": "No thumbnail image yet.",
      "galleryLabel": "Gallery",
      "galleryHelp": "Select one or many photos to keep your gallery fresh.",
      "gallerySelectHelp": "Hold Shift or Command/Ctrl to pick multiple files at once.",
      "galleryEmpty": "No gallery images yet.",
      "uploadSingle": "Upload image",
      "uploadMultiple": "Upload images",
      "uploading": "Uploading…",
      "remove": "Remove",
      "removing": "Removing…"
    },
    "location": {
      "heading": "Location & Service Area",
      "form": {
        "addressLabel": "Address (formatted)",
        "cityLabel": "City",
        "stateLabel": "State/Region",
        "countryLabel": "Country",
        "countryPlaceholder": "Select a country",
        "radiusLabel": "Service radius (km)",
        "save": "Save location",
        "saving": "Saving…"
      },
      "map": {
        "searchLabel": "Search address",
        "searchPlaceholder": "Type an address…"
      }
    },
    "categories": {
      "instructions": "Build your service mix",
      "helper": "Organize your profile like a professional studio. Pick the service families that fit your business, then choose the exact specialties couples should see.",
      "browseByGroup": "Browse by service group",
      "allServices": "All services",
      "specialtiesLabel": "Specialties",
      "selectedServices": "Selected specialties",
      "noSelection": "No specialties selected yet.",
      "selectAll": "Select family",
      "clear": "Clear family",
      "save": "Save categories",
      "saving": "Saving…",
      "success": "Categories saved!"
    },
    "publish": {
      "heading": "Publish",
      "description": "Toggle whether your vendor profile appears in public search.",
      "status": {
        "published": "Published (visible in catalog)",
        "unpublished": "Unpublished (hidden from catalog)"
      },
      "save": "Save",
      "saving": "Saving…",
      "viewPublic": "View public page"
    }
  },
  "vendorInbox": {
    "quoteForm": {
      "amountLabel": "Proposal (USD)",
      "amountPlaceholder": "e.g. 2500",
      "messageLabel": "Message",
      "messagePlaceholder": "What’s included, availability, next steps…",
      "submit": "Send proposal",
      "submitting": "Sending…",
      "success": "Proposal sent"
    }
  },
  "vendorQuotes": {
    "title": "Quotes sent",
    "empty": "You haven’t sent any quotes yet.",
    "sentLabel": "Sent",
    "status": {
      "sent": "SENT"
    },
    "conversation": {
      "heading": "Conversation",
      "empty": "No replies yet.",
      "youLabel": "You",
      "clientLabel": "Client",
      "replyAction": "Reply",
      "replyPending": "Sending...",
      "replyPlaceholder": "Reply to the client about this quote.",
      "replySuccess": "Reply sent."
    },
    "contact": {
      "hiddenNote": "Contact details unlock automatically once your quote is accepted."
    }
  },
  "vendorRfqs": {
    "title": "Received requests",
    "noProfile": {
      "message": "You don’t have a vendor profile yet. Create it in",
      "linkLabel": "Vendor Profile"
    },
    "empty": "No requests yet. You’ll see them here when couples reach out.",
    "rfqLabel": "Request",
    "eventDateTbd": "Date TBD",
    "guestCountTbd": "Guest count TBD",
    "guestsLabel": "guests",
    "budgetLabel": "Budget",
    "invitedAtLabel": "Invited",
    "expiresAtLabel": "Expires",
    "status": {
      "accepted": "ACCEPTED",
      "responded": "RESPONDED",
      "pending": "PENDING",
      "declined": "DECLINED",
      "expired": "EXPIRED",
      "unknown": "STATUS"
    },
    "contact": {
      "revealed": "Contact revealed",
      "hidden": "Contact hidden",
      "hiddenNote": "Appears automatically if your quote is accepted.",
      "noneShared": "No contact fields were shared."
    },
    "latestQuote": {
      "heading": "Latest quote"
    }
  },
  "home": {
    "hero": {
      "badge": "All-in-one wedding marketplace",
      "title": "Plan your dream wedding with less stress",
      "description": "Discover trusted professionals, compare quotes instantly and book your favourites without leaving the platform.",
      "primaryCta": "Get personalised quotes",
      "secondaryCta": "Browse vendors"
    },
    "highlights": {
      "heading": "Why couples choose us",
      "items": [
        {
          "title": "Curated vendor matches",
          "description": "Answer a few questions and we will surface venues, photographers, florists and more who fit your style and budget."
        },
        {
          "title": "One place to compare quotes",
          "description": "Send requests with a single click and keep every response organised so you can review availability, pricing and reviews side by side."
        },
        {
          "title": "Plan with total confidence",
          "description": "Favourite the vendors you love, share shortlists with your partner and book with the support of our wedding planning team."
        }
      ]
    },
    "categories": {
      "heading": "Explore popular categories",
      "description": "Whether you're searching for the perfect venue or putting the finishing touches on decor, our directory showcases vetted professionals across every category.",
      "viewAll": "See all categories",
      "spotlightLabel": "Popular pick",
      "seeVendors": "See vendors →",
      "items": [
        {
          "label": "Venues",
          "slug": "venues"
        },
        {
          "label": "Photography",
          "slug": "photography"
        },
        {
          "label": "Catering",
          "slug": "catering"
        },
        {
          "label": "Beauty",
          "slug": "beauty"
        },
        {
          "label": "Entertainment",
          "slug": "entertainment"
        },
        {
          "label": "Decor",
          "slug": "decor"
        }
      ]
    },
    "plan": {
      "heading": "Ready to start planning?",
      "description": "Build a shortlist, share it with your partner and message vendors directly. Wedding Market keeps your planning journey organised from the first idea to the final booking.",
      "cta": "View your shortlist"
    }
  },
  "rfq": {
    "newPage": {
      "title": "Request quotes",
      "emptyBeforeLink": "Your shortlist is empty. Go to ",
      "emptyLink": "Vendors",
      "emptyAfterLink": " and add a few.",
      "selectedVendors": "Selected vendors",
      "vendorsLoadError": "We couldn't load vendor details. You can still send your request.",
      "vendorLoading": "Loading...",
      "vendorUnavailable": "Vendor unavailable",
      "maxVendorsHelp": "Maximum 10 vendors per request.",
      "eventDateLabel": "Event date",
      "guestCountLabel": "Guest count",
      "cityLabel": "City",
      "stateLabel": "State/Region",
      "countryLabel": "Country",
      "countryPlaceholder": "Select a country",
      "budgetMinLabel": "Minimum budget (USD)",
      "budgetMaxLabel": "Maximum budget (USD)",
      "languageLabel": "Language",
      "themeLabel": "Wedding style (optional)",
      "notesLabel": "Notes for vendors",
      "submit": "Send request",
      "submitting": "Sending...",
      "clearShortlist": "Clear shortlist",
      "languageOptions": {
        "es": "Spanish",
        "en": "English",
        "de": "German",
        "fr": "French"
      },
      "themeOptions": {
        "none": "—",
        "classic": "Classic",
        "boho": "Boho",
        "rustic": "Rustic",
        "beach": "Beach",
        "garden": "Garden",
        "modern": "Modern",
        "vintage": "Vintage"
      },
      "errors": {
        "loginRequired": "Please log in first.",
        "invalidVendorList": "We couldn't read the selected vendors. Please try again.",
        "emptyShortlist": "Your shortlist is empty.",
        "submitFailed": "We couldn't create your request right now. Please try again.",
        "inviteFailed": "We created your request, but notifying vendors failed. Please try again."
      }
    },
    "sentPage": {
      "title": "Request sent",
      "lead": "We've notified {count} vendor(s).",
      "requestIdLabel": "Your request ID:",
      "findMoreVendors": "Find more vendors",
      "viewRequest": "View this request",
      "sendAnother": "Send another request"
    }
  },
  "blog": {
    "postPage": {
      "kicker": "Wedding Market Blog",
      "breadcrumbAria": "Breadcrumb",
      "minutesToRead": "{count} min read",
      "emptyContent": "This post doesn't have any content yet."
    }
  },
  "signup": {
    "page": {
      "eyebrow": "Couple onboarding",
      "title": "Create your account without the long, boring form",
      "description": "A guided setup that captures your date, budget, style, and vendor priorities in a few friendly steps.",
      "highlights": {
        "first": {
          "title": "Wedding snapshot",
          "description": "Capture the essentials before you start browsing so recommendations feel relevant right away."
        },
        "second": {
          "title": "Less repetitive typing",
          "description": "We use this profile to prefill future quote requests and planning flows across the site."
        },
        "third": {
          "title": "A calmer start",
          "description": "Step-by-step prompts keep the setup focused, warm, and easy to finish in one sitting."
        }
      },
      "sidebar": {
        "eyebrow": "Why we ask",
        "title": "This profile powers your next steps",
        "points": {
          "first": "We tailor vendor browsing around your wedding size, style, and planning stage.",
          "second": "Your budget and priorities help us surface the right categories faster.",
          "third": "Future request forms start with this information already in place."
        }
      },
      "alreadyHave": "Already have an account?",
      "loginLink": "Log in"
    },
    "form": {
      "emailLabel": "Email",
      "passwordLabel": "Password",
      "passwordHelp": "At least 6 characters.",
      "progressLabel": "Step",
      "submit": "Create my account",
      "submitting": "Finishing setup…",
      "actions": {
        "back": "Back",
        "next": "Continue"
      },
      "modal": {
        "startPlanning": "Start planning now",
        "closeLabel": "Close signup",
        "stopBody": "Stop creating your account? Your answers are not saved yet.",
        "stepOf": "Step",
        "chooseWeddingStyle": "Which style feels most like your wedding?",
        "selectedDate": "Selected date",
        "previousMonth": "Previous month",
        "nextMonth": "Next month",
        "weddingDate": "Wedding date",
        "phoneRequired": "Please add your phone number before moving on.",
        "styleRequired": "Choose a wedding style before moving on.",
        "accountTitle": "Now let us save your plan.",
        "accountBody": "Choose a password so you can come back to your favorites, quotes, and messages anytime.",
        "welcome": {
          "title": "Hi, I am happy you are here.",
          "body": "I will help you start your wedding plan without making it feel overwhelming. I just need a few details first."
        },
        "contact": {
          "title": "First, tell me who I am helping.",
          "body": "I will keep this simple. Your name, email, and phone help keep your quotes and saved vendors connected to you."
        },
        "style": {
          "title": "What kind of wedding are you picturing?",
          "body": "Pick the style that feels closest. It does not have to be perfect; we can adjust it later."
        },
        "date": {
          "title": "Do you already have a date in mind?",
          "body": "Choose the date you are planning around. If it changes later, that is completely okay."
        },
        "guests": {
          "title": "How many people should we plan for?",
          "body": "An estimate is enough for now. This helps vendors understand the size of your celebration."
        },
        "budget": {
          "title": "Where are we planning this wedding?",
          "body": "Choose your country and share a rough budget so I can help organize better vendor matches."
        }
      },
      "steps": {
        "account": {
          "shortLabel": "You",
          "title": "Let’s start with the easy details",
          "description": "Tell us who you are so your account already feels personal the moment you land inside."
        },
        "wedding": {
          "shortLabel": "Wedding",
          "title": "Now give us the shape of the celebration",
          "description": "These are the core details we use to personalize vendor discovery and quote requests."
        },
        "style": {
          "shortLabel": "Style",
          "title": "What kind of day are you building?",
          "description": "Choose the vibe and vendor priorities that matter most so the marketplace feels curated, not random."
        },
        "finish": {
          "shortLabel": "Finish",
          "title": "Quick recap before we open the doors",
          "description": "Check the snapshot below, then create your account and jump into planning."
        }
      },
      "fields": {
        "fullNameLabel": "What should we call you?",
        "phoneLabel": "Phone number",
        "phonePlaceholder": "Optional, but helpful for quick follow-ups",
        "cityLabel": "Wedding city",
        "cityPlaceholder": "Where will the celebration happen?",
        "regionLabel": "State / region",
        "regionPlaceholder": "Helpful for destination weekends or multi-day events",
        "planningStageLabel": "Where are you in the planning journey?",
        "prioritiesLabel": "Which vendor types matter most right now?"
      },
      "prompts": {
        "when": {
          "title": "The basics",
          "subtitle": "Give us the foundation so the rest of the marketplace can respond to your real plans."
        },
        "style": {
          "title": "The vibe",
          "subtitle": "This is where the experience starts to feel personalized instead of generic."
        },
        "finish": {
          "title": "You are almost in",
          "subtitle": "Here is the profile we will use to personalize vendor discovery and future requests."
        }
      },
      "options": {
        "planningStage": {
          "just-starting": "Just starting",
          "venue-booked": "Venue booked",
          "shortlisting": "Shortlisting vendors",
          "ready-to-book": "Ready to book"
        },
        "priorities": {
          "venue": "Venue",
          "photography": "Photography",
          "planner": "Planner / coordination",
          "beauty": "Hair + makeup",
          "decor": "Design + decor",
          "catering": "Catering",
          "music": "Music / entertainment"
        }
      },
      "hints": {
        "planningStage": {
          "just-starting": "You are still shaping the vision and likely want broad inspiration first.",
          "venue-booked": "You have a date and place, so the next vendors can get more specific.",
          "shortlisting": "You know what you want and are narrowing the list to strong contenders.",
          "ready-to-book": "You are actively comparing final options and want momentum."
        },
        "priorities": "Pick the services you want us to surface first once your account is ready."
      },
      "summary": {
        "pending": "Add a little more detail",
        "nameLabel": "Name",
        "dateLabel": "Date",
        "locationLabel": "Location",
        "guestCountLabel": "Guest count",
        "budgetLabel": "Budget",
        "stageLabel": "Planning stage",
        "themeLabel": "Theme",
        "prioritiesLabel": "Top priorities",
        "languageLabel": "Language"
      },
      "finishCard": {
        "title": "Next, we tailor the marketplace around this profile.",
        "description": "You can browse vendors, save favorites, and request quotes with much less repetitive typing."
      },
      "validation": {
        "fullNameRequired": "Please add your name before moving on.",
        "emailRequired": "Please add your email before moving on.",
        "passwordRequired": "Please add a password before moving on.",
        "passwordTooShort": "Use at least 6 characters for your password.",
        "dateRequired": "Choose a wedding date or tentative date before moving on.",
        "guestCountRequired": "Add your estimated guest count before moving on.",
        "budgetRequired": "Add a budget so we can personalize recommendations.",
        "countryRequired": "Select the country for your celebration before moving on.",
        "planningStageRequired": "Choose where you are in the planning process.",
        "prioritiesRequired": "Choose at least one vendor priority so we know where to start."
      }
    },
    "vendor": {
      "gate": {
        "title": "Become a vendor",
        "description": "Log in or create an account to start building your vendor profile.",
        "loginCta": "Log in",
        "newHere": "New here?",
        "signUpLink": "Sign up first"
      },
      "formPage": {
        "eyebrow": "Vendor onboarding",
        "title": "Build a vendor profile couples can understand fast",
        "description": "A guided setup to capture your services, coverage, contact details, and pricing without dropping you into a giant admin form.",
        "highlights": {
          "first": {
            "title": "Clear positioning",
            "description": "Lead with the specialties, style, and coverage area couples need to understand right away."
          },
          "second": {
            "title": "Better-fit leads",
            "description": "Starting price, languages, and event types help the right clients reach out faster."
          },
          "third": {
            "title": "A smoother setup",
            "description": "We group the questions into a short flow so you can launch a strong profile without the admin-page fatigue."
          }
        },
        "sidebar": {
          "eyebrow": "What this sets up",
          "title": "Your vendor dashboard starts with the right foundation",
          "points": {
            "first": "Core business details feed directly into your public vendor profile.",
            "second": "Coverage, languages, and event types help couples decide if you are a fit before they message you.",
            "third": "Pricing context reduces mismatched inquiries and makes your profile feel more trustworthy."
          }
        }
      },
      "form": {
        "businessNameLabel": "Business name",
        "cityLabel": "City",
        "countryLabel": "Country",
        "countryPlaceholder": "Select a country",
        "progressLabel": "Step",
        "submit": "Create my vendor profile",
        "submitting": "Launching your studio…",
        "actions": {
          "back": "Back",
          "next": "Continue"
        },
        "steps": {
          "brand": {
            "shortLabel": "Brand",
            "title": "Start with the version couples remember",
            "description": "Give us your business name, a strong one-line pitch, and the specialties you want attached to your profile."
          },
          "coverage": {
            "shortLabel": "Coverage",
            "title": "Show where and how you love to work",
            "description": "Define your service area and the kinds of celebrations you are best built for."
          },
          "contact": {
            "shortLabel": "Contact",
            "title": "Make it easy for couples to trust the next step",
            "description": "Add the contact details, language support, and social proof cues that make outreach feel low-friction."
          },
          "pricing": {
            "shortLabel": "Pricing",
            "title": "Set expectations without overloading people",
            "description": "A little pricing context goes a long way toward attracting the right inquiries."
          }
        },
        "fields": {
          "ownerNameLabel": "Your name",
          "taglineLabel": "One-line pitch",
          "taglinePlaceholder": "Tell couples what makes your business feel special.",
          "mediaPromptLabel": "Brand visuals",
          "mediaPromptTitle": "Add the two images couples look for first",
          "logoLabel": "Logo",
          "logoTitle": "Upload your brand logo",
          "logoHelp": "Use a clean version of your mark so it reads well in small profile spaces.",
          "logoPlaceholder": "Your logo preview will show here.",
          "logoEmpty": "No logo selected yet",
          "logoPreviewAlt": "Selected logo preview",
          "heroLabel": "Hero photo",
          "heroTitle": "Upload a hero image",
          "heroHelp": "Choose a strong first image that instantly shows your style and level of work.",
          "heroPlaceholder": "Your hero image preview will show here.",
          "heroEmpty": "No hero image selected yet",
          "heroPreviewAlt": "Selected hero image preview",
          "uploadCta": "Choose image",
          "replaceUploadCta": "Replace image",
          "categorySearchLabel": "Find your specialties",
          "categorySearchPlaceholder": "Search categories...",
          "serviceStyleLabel": "How would you describe your service style?",
          "serviceStylePlaceholder": "Examples: calm and editorial, high energy, concierge-level",
          "otherLanguagesLabel": "Other languages",
          "otherLanguagesPlaceholder": "Add more with commas if needed",
          "instagramLabel": "Instagram",
          "instagramPlaceholder": "@yourstudio",
          "bookingLeadTimeLabel": "Typical booking lead time",
          "bookingLeadTimePlaceholder": "Examples: 6-12 months, 3 months, flexible"
        },
        "accountPrompt": {
          "title": "Owner account",
          "subtitle": "Create the login for your vendor dashboard first, then we’ll use the rest of this flow to shape your public profile."
        },
        "options": {
          "eventTypes": {
            "intimate-weddings": "Intimate weddings",
            "destination-weekends": "Destination weekends",
            "large-receptions": "Large receptions",
            "cultural-celebrations": "Cultural celebrations",
            "civil-ceremonies": "Civil ceremonies"
          },
          "languages": {
            "english": "English",
            "spanish": "Spanish",
            "french": "French",
            "portuguese": "Portuguese"
          },
          "teamSizes": {
            "solo": "Solo owner",
            "small": "2-5 people",
            "growing": "6-10 people",
            "large": "11+ people"
          },
          "seasons": {
            "spring": "Spring",
            "summer": "Summer",
            "fall": "Fall",
            "winter": "Winter"
          }
        },
        "hints": {
          "media": "Both a logo and a hero image are required so your profile launches with a recognizable, polished first impression.",
          "categories": "Select the specialties couples should see first on your profile.",
          "eventTypes": "Choose the kinds of wedding days you are most excited to book.",
          "languages": "Select the languages your team can comfortably serve couples in.",
          "pricing": "These details help couples know whether they are in the right range before they reach out."
        },
        "summary": {
          "pending": "Still filling this in",
          "businessLabel": "Business",
          "logoLabel": "Logo",
          "heroLabel": "Hero image",
          "categoriesLabel": "Specialties",
          "coverageLabel": "Coverage",
          "contactLabel": "Primary contact",
          "languagesLabel": "Languages",
          "pricingLabel": "Pricing snapshot"
        },
        "finishCard": {
          "title": "You are about to create a much stronger first impression.",
          "description": "We use this setup to build your dashboard and give couples the essentials up front."
        },
        "validation": {
          "ownerNameRequired": "Add your name before continuing.",
          "emailRequired": "Add your email before continuing.",
          "passwordRequired": "Add a password before continuing.",
          "passwordTooShort": "Use at least 6 characters for your password.",
          "businessNameRequired": "Add your business name before moving on.",
          "taglineRequired": "Add a one-line pitch before moving on.",
          "logoRequired": "Upload your logo before continuing.",
          "heroRequired": "Upload a hero image before continuing.",
          "categoriesRequired": "Choose at least one specialty before moving on.",
          "countryRequired": "Select your main country before moving on.",
          "contactRequired": "Add a phone number or website so couples have a clear next step.",
          "languagesRequired": "Choose at least one language your business supports.",
          "startingPriceRequired": "Add a starting price before finishing setup."
        }
      }
    }
  }
} as const;

export type CommonTranslations = typeof common;

export default common;
