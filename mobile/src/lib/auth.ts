import type { User } from "@supabase/supabase-js";
import { MOBILE_AUTH_CALLBACK_URL, parseMobileAuthCallback } from "./authUtils";
import { supabase } from "./supabase";

export type AppRole = "guest" | "client" | "vendor" | "admin";

export type AuthProfile = {
  role: AppRole;
  fullName: string | null;
  language: "en" | "es";
  avatarUrl: string | null;
  vendorLogoUrl: string | null;
};

export type AuthState = {
  user: User | null;
  profile: AuthProfile | null;
};

export type SignUpRole = "client" | "vendor";

export type MobileSignUpInput = {
  role: SignUpRole;
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  country?: string;
  language: "en" | "es";
  tentativeWeddingDate?: string;
  guestCount?: string;
  weddingBudget?: string;
  weddingTheme?: string;
  businessName?: string;
  category?: string;
  city?: string;
  region?: string;
};

export type MobileSignUpResult =
  | { status: "signed_in"; state: AuthState }
  | { status: "confirmation_required"; email: string };

type PendingMobileSignUp = {
  version: 1;
  role: SignUpRole;
  fullName: string;
  phone: string | null;
  country: string | null;
  language: "en" | "es";
  tentativeWeddingDate: string | null;
  guestCount: number | null;
  weddingBudget: number | null;
  weddingTheme: string | null;
  businessName: string | null;
  category: string | null;
  city: string | null;
  region: string | null;
};

function normalizeRole(role: unknown): AppRole {
  if (role === "admin") return "admin";
  if (role === "vendor") return "vendor";
  if (role === "user") return "client";
  return "client";
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parsePositiveInteger(value?: string) {
  const normalized = value?.trim();
  if (!normalized) return null;
  const parsed = Number.parseInt(normalized, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseMoney(value?: string) {
  const normalized = value?.replace(/[^0-9,.-]/g, "").replace(/,/g, ".").trim();
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function requireText(value: string | undefined, message: string) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    throw new Error(message);
  }
  return trimmed;
}

function avatarUrlFromMetadata(metadata: User["user_metadata"]) {
  const avatar = metadata?.avatar_image ?? metadata?.avatar_url ?? metadata?.picture;

  if (typeof avatar === "string" && avatar.trim()) {
    return avatar;
  }

  if (avatar && typeof avatar === "object" && "url" in avatar && typeof avatar.url === "string") {
    return avatar.url;
  }

  return null;
}

function optionalMetadataText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function pendingSignUpFromUser(user: User): PendingMobileSignUp | null {
  const value = user.user_metadata?.wedding_market_signup;
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const pending = value as Record<string, unknown>;
  if (pending.version !== 1) return null;

  const rawGuestCount = pending.guestCount;
  const rawWeddingBudget = pending.weddingBudget;

  return {
    version: 1,
    role: pending.role === "vendor" ? "vendor" : "client",
    fullName:
      optionalMetadataText(pending.fullName) ??
      optionalMetadataText(user.user_metadata?.full_name) ??
      user.email ??
      "Wedding Market user",
    phone: optionalMetadataText(pending.phone),
    country: optionalMetadataText(pending.country),
    language: pending.language === "es" ? "es" : "en",
    tentativeWeddingDate: optionalMetadataText(pending.tentativeWeddingDate),
    guestCount: typeof rawGuestCount === "number" && Number.isInteger(rawGuestCount) && rawGuestCount > 0
      ? rawGuestCount
      : null,
    weddingBudget: typeof rawWeddingBudget === "number" && Number.isFinite(rawWeddingBudget) && rawWeddingBudget >= 0
      ? rawWeddingBudget
      : null,
    weddingTheme: optionalMetadataText(pending.weddingTheme),
    businessName: optionalMetadataText(pending.businessName),
    category: optionalMetadataText(pending.category),
    city: optionalMetadataText(pending.city),
    region: optionalMetadataText(pending.region),
  };
}

export async function loadAuthState(): Promise<AuthState> {
  if (!supabase) {
    return { user: null, profile: null };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, language")
    .eq("id", user.id)
    .maybeSingle();

  const role = normalizeRole(profile?.role);
  let vendorLogoUrl: string | null = null;
  if (role === "vendor" || role === "admin") {
    const { data: vendor } = await supabase
      .from("vendors")
      .select("logo_url")
      .eq("owner_id", user.id)
      .maybeSingle();
    vendorLogoUrl = typeof vendor?.logo_url === "string" && vendor.logo_url.trim() ? vendor.logo_url : null;
  }

  return {
    user,
    profile: {
      role,
      fullName: typeof profile?.full_name === "string" ? profile.full_name : null,
      language: profile?.language === "es" ? "es" : "en",
      avatarUrl: avatarUrlFromMetadata(user.user_metadata),
      vendorLogoUrl,
    },
  };
}

async function provisionAuthenticatedAccount(authenticatedUser?: User | null): Promise<AuthState> {
  if (!supabase) {
    throw new Error("Supabase is not configured. Check mobile/.env.");
  }

  let user = authenticatedUser ?? null;
  if (!user) {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw new Error(error.message);
    user = data.user;
  }
  if (!user) return { user: null, profile: null };

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle<{ id: string }>();

  if (existingProfileError) {
    throw new Error(existingProfileError.message);
  }

  const pending = pendingSignUpFromUser(user);
  if (existingProfile && !pending) {
    return loadAuthState();
  }

  const metadataRole = user.user_metadata?.role === "vendor" ? "vendor" : "client";
  const role = pending?.role ?? metadataRole;
  const isVendor = role === "vendor";
  const fullName =
    pending?.fullName ??
    optionalMetadataText(user.user_metadata?.full_name) ??
    user.email ??
    "Wedding Market user";
  const language = pending?.language ?? (user.user_metadata?.language === "es" ? "es" : "en");

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        role: isVendor ? "vendor" : "user",
        full_name: fullName,
        phone: pending?.phone ?? null,
        country: pending?.country ?? null,
        language,
        tentative_wedding_date: isVendor ? null : pending?.tentativeWeddingDate ?? null,
        guest_count: isVendor ? null : pending?.guestCount ?? null,
        wedding_budget: isVendor ? null : pending?.weddingBudget ?? null,
        wedding_theme: isVendor ? null : pending?.weddingTheme ?? null,
      },
      { onConflict: "id" },
    );

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (isVendor) {
    const businessName =
      pending?.businessName ??
      optionalMetadataText(user.user_metadata?.business_name) ??
      fullName;
    let slug = slugify(businessName) || `vendor-${user.id.slice(0, 8)}`;
    const { data: slugConflict, error: slugConflictError } = await supabase
      .from("vendors")
      .select("id")
      .eq("slug", slug)
      .neq("owner_id", user.id)
      .maybeSingle<{ id: string }>();

    if (slugConflictError) throw new Error(slugConflictError.message);
    if (slugConflict) slug = `${slug}-${user.id.slice(0, 4)}`;

    const { data: existingVendor, error: existingVendorError } = await supabase
      .from("vendors")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle<{ id: string }>();

    if (existingVendorError) throw new Error(existingVendorError.message);

    let vendorId = existingVendor?.id ?? null;
    if (!vendorId) {
      const { data: createdVendor, error: createVendorError } = await supabase
        .from("vendors")
        .insert({
          owner_id: user.id,
          slug,
          business_name: businessName,
          bio: { en: "", es: "" },
          extra_info: {},
          phone: pending?.phone ?? null,
          address_label: [pending?.city, pending?.region, pending?.country].filter(Boolean).join(", ") || null,
          is_published: false,
        })
        .select("id")
        .single<{ id: string }>();

      if (createVendorError) throw new Error(createVendorError.message);
      vendorId = createdVendor?.id ?? null;
    }

    if (vendorId) {
      const { error: locationError } = await supabase
        .from("vendor_locations")
        .upsert(
          {
            vendor_id: vendorId,
            address: null,
            city: pending?.city ?? null,
            state: pending?.region ?? null,
            country: pending?.country ?? null,
            lat: null,
            lng: null,
            service_radius_km: 50,
          },
          { onConflict: "vendor_id" },
        );

      if (locationError) throw new Error(locationError.message);

      if (pending?.category) {
        const { data: category, error: categoryLookupError } = await supabase
          .from("categories")
          .select("id")
          .eq("key", pending.category)
          .maybeSingle<{ id: string }>();

        if (categoryLookupError) throw new Error(categoryLookupError.message);
        if (category?.id) {
          const { error: categoryError } = await supabase
            .from("vendor_categories")
            .upsert({ vendor_id: vendorId, category_id: category.id });

          if (categoryError) throw new Error(categoryError.message);
        }
      }
    }
  }

  if (pending) {
    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        wedding_market_signup: null,
        wedding_market_signup_completed_at: new Date().toISOString(),
      },
    });
    if (metadataError && process.env.NODE_ENV !== "production") {
      console.warn("Account was provisioned, but pending signup metadata could not be cleared", metadataError.message);
    }
  }

  return loadAuthState();
}

export async function restoreMobileAuthState() {
  if (!supabase) return { user: null, profile: null };

  const state = await loadAuthState();
  if (!state.user) return state;
  return provisionAuthenticatedAccount(state.user);
}

export async function createSessionFromMobileAuthUrl(url: string): Promise<AuthState | null> {
  if (!supabase) {
    throw new Error("Supabase is not configured. Check mobile/.env.");
  }

  const callback = parseMobileAuthCallback(url);
  if (!callback) return null;

  let user: User | null = null;
  if (callback.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(callback.code);
    if (error) throw new Error(error.message);
    user = data.user;
  } else if (callback.accessToken && callback.refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: callback.accessToken,
      refresh_token: callback.refreshToken,
    });
    if (error) throw new Error(error.message);
    user = data.user;
  } else {
    throw new Error("The confirmation link did not include a valid account session.");
  }

  return provisionAuthenticatedAccount(user);
}

export async function resendSignUpConfirmation(email: string) {
  if (!supabase) {
    throw new Error("Supabase is not configured. Check mobile/.env.");
  }

  const normalizedEmail = requireText(email, "Email is required.").toLowerCase();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: normalizedEmail,
    options: { emailRedirectTo: MOBILE_AUTH_CALLBACK_URL },
  });

  if (error) throw new Error(error.message);
}

export async function signInWithEmail(email: string, password: string) {
  if (!supabase) {
    throw new Error("Supabase is not configured. Check mobile/.env.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(error.message);
  }

  return provisionAuthenticatedAccount(data.user);
}

export async function signUpWithEmail(input: MobileSignUpInput): Promise<MobileSignUpResult> {
  if (!supabase) {
    throw new Error("Supabase is not configured. Check mobile/.env.");
  }

  const fullName = requireText(input.fullName, "Name is required.");
  const email = requireText(input.email, "Email is required.").toLowerCase();
  const password = requireText(input.password, "Password is required.");
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const isVendor = input.role === "vendor";
  const businessName = isVendor ? requireText(input.businessName, "Business name is required.") : "";
  const country = input.country?.trim() || null;
  const phone = input.phone?.trim() || null;
  const pendingSignUp: PendingMobileSignUp = {
    version: 1,
    role: input.role,
    fullName,
    phone,
    country,
    language: input.language,
    tentativeWeddingDate: isVendor ? null : input.tentativeWeddingDate?.trim() || null,
    guestCount: isVendor ? null : parsePositiveInteger(input.guestCount),
    weddingBudget: isVendor ? null : parseMoney(input.weddingBudget),
    weddingTheme: isVendor ? null : input.weddingTheme?.trim() || null,
    businessName: isVendor ? businessName : null,
    category: isVendor ? input.category?.trim() || null : null,
    city: isVendor ? input.city?.trim() || null : null,
    region: isVendor ? input.region?.trim() || null : null,
  };

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: MOBILE_AUTH_CALLBACK_URL,
      data: {
        full_name: fullName,
        language: input.language,
        role: isVendor ? "vendor" : "user",
        business_name: isVendor ? businessName : null,
        wedding_market_signup: pendingSignUp,
      },
    },
  });

  if (signUpError) {
    throw new Error(signUpError.message);
  }

  if (!signUpData.session) {
    return { status: "confirmation_required", email };
  }

  const state = await provisionAuthenticatedAccount(signUpData.user ?? signUpData.session.user);
  return { status: "signed_in", state };
}

export async function signOut() {
  if (!supabase) {
    return;
  }

  await supabase.auth.signOut();
}
