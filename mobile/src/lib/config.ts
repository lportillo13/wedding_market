export const mobileConfig = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
  webUrl: process.env.EXPO_PUBLIC_WEB_URL ?? "",
  webApiUrl: process.env.EXPO_PUBLIC_WEB_API_URL ?? "",
};

type MobileConfig = typeof mobileConfig;

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function getMobileConfigErrors(config: MobileConfig = mobileConfig, production = process.env.NODE_ENV === "production") {
  const errors: string[] = [];
  const urls = [
    ["EXPO_PUBLIC_SUPABASE_URL", config.supabaseUrl],
    ["EXPO_PUBLIC_WEB_API_URL", config.webApiUrl],
  ] as const;

  for (const [name, value] of urls) {
    if (!value.trim()) errors.push(`${name} is required.`);
    else if (!isHttpUrl(value)) errors.push(`${name} must be an HTTP(S) URL.`);
    else if (production && !value.trim().toLowerCase().startsWith("https://")) {
      errors.push(`${name} must use HTTPS in production.`);
    }
  }

  if (!config.supabaseAnonKey.trim()) errors.push("EXPO_PUBLIC_SUPABASE_ANON_KEY is required.");
  if (config.webUrl.trim() && !isHttpUrl(config.webUrl)) {
    errors.push("EXPO_PUBLIC_WEB_URL must be an HTTP(S) URL.");
  } else if (production && config.webUrl.trim() && !config.webUrl.trim().toLowerCase().startsWith("https://")) {
    errors.push("EXPO_PUBLIC_WEB_URL must use HTTPS in production.");
  }

  return errors;
}
