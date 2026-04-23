const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

function loadEnvFile() {
  const filePath = path.join(process.cwd(), ".env.local");
  const env = {};

  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator === -1) continue;
    env[line.slice(0, separator)] = line.slice(separator + 1);
  }

  return env;
}

function body(category, author, blocks) {
  return JSON.stringify({
    version: 1,
    category,
    author,
    blocks,
  });
}

const posts = [
  {
    title: "How To Design A Garden Wedding That Feels Elegant, Not Overdone",
    slug: "garden-wedding-elegant-design-tips",
    status: "published",
    excerpt:
      "A soft palette, layered florals, and a disciplined ceremony setup can make an outdoor wedding feel editorial and effortless.",
    hero_image_url: "/blog/garden-wedding-hero.svg",
    published_at: "2026-03-10T09:00:00.000Z",
    category: "Planning",
    author: "Wedding Market Editorial",
    body: body("Planning", "Wedding Market Editorial", [
      { type: "paragraph", data: { text: "Garden weddings work best when the landscape does some of the visual heavy lifting. Instead of competing with the venue, build a restrained palette, leave space between design moments, and let the ceremony focal points feel intentional." } },
      { type: "heading", data: { level: "h2", text: "Start with shape before color" } },
      { type: "paragraph", data: { text: "Choose your ceremony arch, aisle width, guest chair style, and table silhouettes first. Once those structural decisions are strong, color becomes an accent instead of a correction." } },
      { type: "image", data: { url: "/blog/garden-wedding-detail.svg", alt: "Illustrated garden wedding table with layered florals", caption: "Low arrangements, candlelight, and soft linens create movement without crowding the table.", fullWidth: true } },
      { type: "list", data: { style: "unordered", items: ["Use one hero flower and two supporting blooms for cleaner arrangements.", "Keep aisle decor lower than seated eye level so the garden remains visible.", "Repeat one textile tone across tablecloths, lounge pieces, and stationery."] } },
      { type: "quote", data: { text: "The most beautiful outdoor weddings feel edited. They never try to decorate every inch.", attribution: "Lead planner note" } },
      { type: "cta", data: { text: "Browse wedding planners", url: "/vendors?category=wedding-planners", align: "left" } },
    ]),
  },
  {
    title: "The Wedding Photo Timeline That Keeps The Day Calm",
    slug: "wedding-photo-timeline-calm-day",
    status: "published",
    excerpt:
      "A strong photo schedule protects the ceremony, keeps family portraits efficient, and gives the couple space to actually enjoy the day.",
    hero_image_url: "/blog/photo-timeline-hero.svg",
    published_at: "2026-03-06T09:00:00.000Z",
    category: "Photography",
    author: "Wedding Market Editorial",
    body: body("Photography", "Wedding Market Editorial", [
      { type: "paragraph", data: { text: "Photography timelines should create margin, not just fill a spreadsheet. The right plan gives hair and makeup room to breathe, prevents portrait drift, and avoids asking guests to wait while logistics get sorted out in real time." } },
      { type: "heading", data: { level: "h2", text: "Build around fixed moments" } },
      { type: "list", data: { style: "ordered", items: ["Lock ceremony start time and sunset first.", "Work backward for first look, family photos, and wedding party portraits.", "Add a 10 to 15 minute buffer between every major transition."] } },
      { type: "image", data: { url: "/blog/photo-timeline-detail.svg", alt: "Illustrated photographer directing a couple at sunset", caption: "Golden hour portraits rarely need long. They need the right window.", fullWidth: false } },
      { type: "paragraph", data: { text: "If family formals happen immediately after the ceremony, assign one relative from each side to help gather people. That single decision often saves more time than cutting an entire photo set." } },
      { type: "cta", data: { text: "Find photographers", url: "/vendors?category=photography", align: "left" } },
    ]),
  },
  {
    title: "Reception Lighting Ideas That Instantly Upgrade Your Room",
    slug: "reception-lighting-ideas-upgrade-room",
    status: "published",
    excerpt:
      "Lighting changes more than ambiance. It shapes the guest experience, the photography, and how polished the full room feels at first glance.",
    hero_image_url: "/blog/reception-lighting-hero.svg",
    published_at: "2026-03-02T09:00:00.000Z",
    category: "Decor",
    author: "Wedding Market Editorial",
    body: body("Decor", "Wedding Market Editorial", [
      { type: "paragraph", data: { text: "Some receptions look expensive because of the florals. Many more look expensive because of the lighting plan. Once the sun drops, warm layered light creates depth on tables, draws attention to the dance floor, and keeps large rooms from feeling flat." } },
      { type: "image", data: { url: "/blog/reception-lighting-detail.svg", alt: "Illustrated reception room with chandeliers and candlelight", caption: "Think in layers: overhead glow, table light, and one architectural spotlight.", fullWidth: true } },
      { type: "heading", data: { level: "h2", text: "Three lighting moves with the biggest payoff" } },
      { type: "list", data: { style: "unordered", items: ["Pin-spot centerpieces so florals still register after dinner service begins.", "Use dimmable warm uplighting to soften blank ballroom walls.", "Anchor the dance floor with one clear focal point like a wash, monogram, or statement fixture."] } },
      { type: "quote", data: { text: "Guests rarely say the word lighting, but they always feel it.", attribution: "Production team insight" } },
      { type: "cta", data: { text: "Explore decor and rentals", url: "/vendors?category=decor-rentals", align: "left" } },
    ]),
  },
  {
    title: "How To Make A Destination Wedding Weekend Feel Cohesive",
    slug: "destination-wedding-weekend-cohesive",
    status: "published",
    excerpt:
      "Welcome dinners, local touches, and a small set of repeat details can make a multi-day celebration feel curated instead of disconnected.",
    hero_image_url: "/blog/destination-weekend-hero.svg",
    published_at: "2026-02-26T09:00:00.000Z",
    category: "Travel",
    author: "Wedding Market Editorial",
    body: body("Travel", "Wedding Market Editorial", [
      { type: "paragraph", data: { text: "Destination weekends succeed when guests understand the rhythm from the moment they arrive. Good hospitality design removes friction: clear transportation notes, recognizable visual cues, and event spaces that feel related without being repetitive." } },
      { type: "heading", data: { level: "h2", text: "Repeat a few signals across every event" } },
      { type: "paragraph", data: { text: "Carry one signature color, one floral ingredient, and one typography style through every printed and physical touchpoint. That consistency does more than a new theme for each event." } },
      { type: "image", data: { url: "/blog/destination-weekend-detail.svg", alt: "Illustrated destination wedding welcome setup by the sea", caption: "A welcome moment can be simple: drinks, signage, shade, and a clear sense of arrival.", fullWidth: false } },
      { type: "list", data: { style: "unordered", items: ["Welcome bag delivery before guests leave for the first event", "One host note with timing, dress suggestions, and transport details", "A farewell brunch that feels lighter and more relaxed than the wedding day"] } },
      { type: "cta", data: { text: "Discover destination venues", url: "/vendors?category=venues", align: "left" } },
    ]),
  },
  {
    title: "Where To Spend Your Floral Budget For Maximum Impact",
    slug: "floral-budget-maximum-impact",
    status: "published",
    excerpt:
      "If the budget needs discipline, concentrate flowers where guests first arrive, where photos happen most, and where the room needs shape.",
    hero_image_url: "/blog/floral-budget-hero.svg",
    published_at: "2026-02-18T09:00:00.000Z",
    category: "Flowers",
    author: "Wedding Market Editorial",
    body: body("Flowers", "Wedding Market Editorial", [
      { type: "paragraph", data: { text: "Florals can disappear fast when they are spread evenly across every surface. Strong design comes from concentration. Put investment where guests first experience the day and where photographers will naturally frame the couple again and again." } },
      { type: "heading", data: { level: "h2", text: "Priority order when the budget is tight" } },
      { type: "list", data: { style: "ordered", items: ["Ceremony backdrop or altar focal point", "Head table or sweetheart table", "Dance floor surround or statement bar arrangement", "Personal flowers with excellent ribbon and finishing details"] } },
      { type: "image", data: { url: "/blog/floral-budget-detail.svg", alt: "Illustrated floral installation above a sweetheart table", caption: "One concentrated installation often beats twenty small arrangements.", fullWidth: true } },
      { type: "quote", data: { text: "If every table gets a little, nothing reads as memorable. Choose one place to make people stop and look.", attribution: "Floral designer perspective" } },
      { type: "cta", data: { text: "Find florists", url: "/vendors?category=florists", align: "left" } },
    ]),
  },
];

async function main() {
  const env = loadEnvFile();
  const supabaseUrl =
    env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const payload = posts.map((post) => ({
    title: post.title,
    slug: post.slug,
    status: post.status,
    excerpt: post.excerpt,
    hero_image_url: post.hero_image_url,
    body: post.body,
    published_at: post.published_at,
  }));

  const { data, error } = await supabase
    .from("blog_posts")
    .upsert(payload, { onConflict: "slug" })
    .select("id, title, slug, status, published_at");

  if (error) {
    throw error;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        imported: data?.length ?? 0,
        slugs: posts.map((post) => post.slug),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
