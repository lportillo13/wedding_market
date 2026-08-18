type MobileConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  webUrl: string;
  webApiUrl: string;
};

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function sameOrigin(left: string, right: string) {
  try {
    return new URL(left).origin.toLowerCase() === new URL(right).origin.toLowerCase();
  } catch {
    return false;
  }
}

export function resolveMobileWebApiUrl(config: Pick<MobileConfig, "supabaseUrl" | "webUrl" | "webApiUrl">) {
  const configuredApiUrl = config.webApiUrl.trim();
  const publicWebUrl = config.webUrl.trim();

  // A common EAS configuration mistake is to put the Supabase project URL in
  // WEB_API_URL. Use the public website when it is available and distinct.
  if (sameOrigin(configuredApiUrl, config.supabaseUrl) && publicWebUrl && !sameOrigin(publicWebUrl, config.supabaseUrl)) {
    return publicWebUrl;
  }

  return configuredApiUrl;
}

const configuredMobileConfig: MobileConfig = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
  webUrl: process.env.EXPO_PUBLIC_WEB_URL ?? "",
  webApiUrl: process.env.EXPO_PUBLIC_WEB_API_URL ?? "",
};

export const mobileConfig = {
  ...configuredMobileConfig,
  webApiUrl: resolveMobileWebApiUrl(configuredMobileConfig),
};

export function getMobileConfigErrors(config: MobileConfig = mobileConfig, production = process.env.NODE_ENV === "production") {
  const errors: string[] = [];
  const resolvedWebApiUrl = resolveMobileWebApiUrl(config);
  const urls = [
    ["EXPO_PUBLIC_SUPABASE_URL", config.supabaseUrl],
    ["EXPO_PUBLIC_WEB_API_URL", resolvedWebApiUrl],
  ] as const;

  for (const [name, value] of urls) {
    if (!value.trim()) errors.push(`${name} is required.`);
    else if (!isHttpUrl(value)) errors.push(`${name} must be an HTTP(S) URL.`);
    else if (production && !value.trim().toLowerCase().startsWith("https://")) {
      errors.push(`${name} must use HTTPS in production.`);
    }
  }

  if (!config.supabaseAnonKey.trim()) errors.push("EXPO_PUBLIC_SUPABASE_ANON_KEY is required.");
  if (resolvedWebApiUrl && sameOrigin(resolvedWebApiUrl, config.supabaseUrl)) {
    errors.push("EXPO_PUBLIC_WEB_API_URL must point to the Wedding Market website, not Supabase.");
  }
  if (config.webUrl.trim() && !isHttpUrl(config.webUrl)) {
    errors.push("EXPO_PUBLIC_WEB_URL must be an HTTP(S) URL.");
  } else if (production && config.webUrl.trim() && !config.webUrl.trim().toLowerCase().startsWith("https://")) {
    errors.push("EXPO_PUBLIC_WEB_URL must use HTTPS in production.");
  }

  return errors;
}
