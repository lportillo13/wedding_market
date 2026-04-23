import BlogIndexPageContent from "@/components/blog/BlogIndexPageContent";
import { loadPublishedPosts } from "@/lib/blog/content";

export default async function BlogIndexPage() {
  const posts = await loadPublishedPosts();

  return <BlogIndexPageContent posts={posts} />;
}
