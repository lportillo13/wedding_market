import type { User } from "@supabase/supabase-js";
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

export async function signInWithEmail(email: string, password: string) {
  if (!supabase) {
    throw new Error("Supabase is not configured. Check mobile/.env.");
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(error.message);
  }

  return loadAuthState();
}

export async function signUpWithEmail(input: MobileSignUpInput) {
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

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        language: input.language,
        role: isVendor ? "vendor" : "user",
      },
    },
  });

  if (signUpError) {
    throw new Error(signUpError.message);
  }

  if (!signUpData.session) {
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      throw new Error(signInError.message);
    }
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error(userError?.message ?? "Unable to create your account session.");
  }

  const profilePayload = {
    id: user.id,
    role: isVendor ? "vendor" : "user",
    full_name: fullName,
    phone,
    country,
    language: input.language,
    tentative_wedding_date: isVendor ? null : input.tentativeWeddingDate?.trim() || null,
    guest_count: isVendor ? null : parsePositiveInteger(input.guestCount),
    wedding_budget: isVendor ? null : parseMoney(input.weddingBudget),
    wedding_theme: isVendor ? null : input.weddingTheme?.trim() || null,
  };

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" });

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (isVendor) {
    let slug = slugify(businessName) || `vendor-${user.id.slice(0, 8)}`;
    const { data: slugConflict } = await supabase
      .from("vendors")
      .select("id")
      .eq("slug", slug)
      .neq("owner_id", user.id)
      .maybeSingle();

    if (slugConflict) {
      slug = `${slug}-${user.id.slice(0, 4)}`;
    }

    const { data: existingVendor, error: existingVendorError } = await supabase
      .from("vendors")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle<{ id: string }>();

    if (existingVendorError) {
      throw new Error(existingVendorError.message);
    }

    const vendorPayload = {
      owner_id: user.id,
      slug,
      business_name: businessName,
      bio: { en: "", es: "" },
      extra_info: {},
      phone,
      address_label: [input.city, input.region, country].map((part) => part?.trim()).filter(Boolean).join(", ") || null,
      is_published: false,
    };

    const vendorResult = existingVendor
      ? await supabase.from("vendors").update(vendorPayload).eq("id", existingVendor.id).select("id").single()
      : await supabase.from("vendors").insert(vendorPayload).select("id").single();

    if (vendorResult.error) {
      throw new Error(vendorResult.error.message);
    }

    const vendorId = vendorResult.data?.id;
    if (vendorId) {
      const { error: locationError } = await supabase
        .from("vendor_locations")
        .upsert(
          {
            vendor_id: vendorId,
            address: null,
            city: input.city?.trim() || null,
            state: input.region?.trim() || null,
            country,
            lat: null,
            lng: null,
            service_radius_km: 50,
          },
          { onConflict: "vendor_id" },
        );

      if (locationError) {
        throw new Error(locationError.message);
      }

      if (input.category?.trim()) {
        const { data: category } = await supabase
          .from("categories")
          .select("id")
          .eq("key", input.category.trim())
          .maybeSingle<{ id: string }>();

        if (category?.id) {
          const { error: categoryError } = await supabase
            .from("vendor_categories")
            .upsert({ vendor_id: vendorId, category_id: category.id });

          if (categoryError) {
            throw new Error(categoryError.message);
          }
        }
      }
    }
  }

  return loadAuthState();
}

export async function signOut() {
  if (!supabase) {
    return;
  }

  await supabase.auth.signOut();
}
