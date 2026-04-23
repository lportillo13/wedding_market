import { isSupportedLanguage } from "@/lib/i18n";
import {
  getDefaultBlogIndexContent,
  getDefaultHomepageContent,
  normalizeBlogIndexContent,
  normalizeHomepageContent,
} from "@/lib/content/siteContent";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function loadRawSettings(keys: string[]) {
  const admin = createSupabaseAdminClient();
  const supabase = admin ?? (await createSupabaseServerClient());

  const { data, error } = await supabase.from("site_settings").select("key, value").in("key", keys);

  if (error) {
    throw new Error(error.message);
  }

  return new Map((data ?? []).map((row) => [row.key, row.value]));
}

export async function loadManagedSiteContent(languageInput?: string | null) {
  const language = isSupportedLanguage(languageInput) ? languageInput : "en";

  try {
    const settings = await loadRawSettings(["homepage.content", "blog.index.content"]);
    return {
      language,
      homepage: normalizeHomepageContent(settings.get("homepage.content"), language),
      blogIndex: normalizeBlogIndexContent(settings.get("blog.index.content"), language),
    };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Unable to load managed site content", error);
    }

    return {
      language,
      homepage: getDefaultHomepageContent(language),
      blogIndex: getDefaultBlogIndexContent(language),
    };
  }
}
