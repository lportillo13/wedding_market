import type { BlogPostRecord } from "@/lib/blog/blocks";
import { getSupabaseForBlog } from "@/lib/blog/supabase";

export type BlogSummary = Pick<
  BlogPostRecord,
  "id" | "title" | "slug" | "excerpt" | "hero_image_url" | "published_at"
> & {
  category?: string;
  author?: string;
};

type BlogBodyMetadata = {
  category?: string;
  author?: string;
};

function getBodyMetadata(body: string | null | undefined): BlogBodyMetadata {
  if (!body) {
    return {};
  }

  try {
    const parsed = JSON.parse(body) as { category?: unknown; author?: unknown };
    return {
      category: typeof parsed.category === "string" ? parsed.category : undefined,
      author: typeof parsed.author === "string" ? parsed.author : undefined,
    };
  } catch {
    return {};
  }
}

export async function loadPublishedPosts(): Promise<BlogSummary[]> {
  try {
    const supabase = await getSupabaseForBlog();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, hero_image_url, published_at, body")
      .eq("status", "published")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(50);

    if (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Unable to load blog posts", error.message);
      }
      return [];
    }

    return (data ?? []).map((post) => {
      const metadata = getBodyMetadata(post.body);
      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        hero_image_url: post.hero_image_url,
        published_at: post.published_at,
        category: metadata.category,
        author: metadata.author,
      };
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Unable to load blog posts", error);
    }

    return [];
  }
}

export async function loadPost(slug: string): Promise<BlogPostRecord | null> {
  try {
    const supabase = await getSupabaseForBlog();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, title, slug, status, excerpt, hero_image_url, published_at, updated_at, body")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle<BlogPostRecord>();

    if (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Unable to load blog post", error.message);
      }
      return null;
    }

    return data ?? null;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Unable to load blog post", error);
    }

    return null;
  }
}
