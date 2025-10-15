import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin/requireAdmin";
import { getSupabaseForAdmin } from "@/lib/admin/supabase";

export async function GET() {
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await getSupabaseForAdmin();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, title, slug, status, excerpt, hero_image_url, body, published_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ posts: data ?? [] });
}

export async function POST(request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { title, slug, excerpt, hero_image_url, body: content, status } = body as Record<string, unknown>;

  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "Slug must contain only lowercase letters, numbers, and hyphens" }, { status: 400 });
  }

  const supabase = await getSupabaseForAdmin();
  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      title,
      slug,
      excerpt: typeof excerpt === "string" ? excerpt : null,
      hero_image_url: typeof hero_image_url === "string" ? hero_image_url : null,
      body: typeof content === "string" ? content : null,
      status: status === "published" ? "published" : "draft",
    })
    .select("id, title, slug, status, excerpt, hero_image_url, body, published_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post: data });
}

export async function PATCH(request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { id, updates } = body as { id?: string; updates?: Record<string, unknown> };
  if (!id || typeof id !== "string" || !updates || typeof updates !== "object") {
    return NextResponse.json({ error: "Missing id or updates" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (typeof updates.title === "string") payload.title = updates.title;
  if (typeof updates.slug === "string") payload.slug = updates.slug;
  if (typeof updates.excerpt === "string") payload.excerpt = updates.excerpt;
  if (typeof updates.hero_image_url === "string") payload.hero_image_url = updates.hero_image_url;
  if (typeof updates.body === "string") payload.body = updates.body;
  if (typeof updates.status === "string" && ["draft", "published"].includes(updates.status)) {
    payload.status = updates.status;
    if (updates.status === "published") {
      payload.published_at = new Date().toISOString();
    } else if (updates.status === "draft") {
      payload.published_at = null;
    }
  }

  if (!Object.keys(payload).length) {
    return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
  }

  const supabase = await getSupabaseForAdmin();
  const { data, error } = await supabase
    .from("blog_posts")
    .update(payload)
    .eq("id", id)
    .select("id, title, slug, status, excerpt, hero_image_url, body, published_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post: data });
}

export async function DELETE(request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = await getSupabaseForAdmin();
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
