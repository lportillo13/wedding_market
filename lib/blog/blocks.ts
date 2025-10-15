type HeadingLevel = "h2" | "h3" | "h4";

export type BlogBlock =
  | { type: "heading"; level: HeadingLevel; text: string }
  | { type: "paragraph"; text: string }
  | { type: "image"; url: string; alt: string; caption: string; fullWidth: boolean }
  | { type: "quote"; text: string; attribution: string }
  | { type: "list"; style: "ordered" | "unordered"; items: string[] }
  | { type: "cta"; text: string; url: string; align: "left" | "center" }
  | { type: "divider" };

export type BlogPostRecord = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  excerpt: string | null;
  hero_image_url: string | null;
  published_at: string | null;
  updated_at: string | null;
  body: string | null;
};

const ALLOWED_HEADINGS = new Set<HeadingLevel>(["h2", "h3", "h4"]);
const DEFAULT_URL = "https://";

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeHeading(data: unknown): BlogBlock | null {
  if (!data || typeof data !== "object") return null;
  const { level, text } = data as { level?: unknown; text?: unknown };
  const normalizedText = asString(text).trim();
  if (!normalizedText) return null;
  const normalizedLevel = asString(level);
  return {
    type: "heading",
    level: ALLOWED_HEADINGS.has(normalizedLevel as HeadingLevel)
      ? (normalizedLevel as HeadingLevel)
      : "h2",
    text: normalizedText,
  };
}

function normalizeParagraph(data: unknown): BlogBlock | null {
  if (!data || typeof data !== "object") return null;
  const { text } = data as { text?: unknown };
  const normalized = asString(text).trim();
  if (!normalized) return null;
  return { type: "paragraph", text: normalized };
}

function normalizeImage(data: unknown): BlogBlock | null {
  if (!data || typeof data !== "object") return null;
  const { url, alt, caption, fullWidth } = data as {
    url?: unknown;
    alt?: unknown;
    caption?: unknown;
    fullWidth?: unknown;
  };
  const normalizedUrl = asString(url).trim();
  if (!normalizedUrl) return null;
  const normalizedAlt = asString(alt).trim();
  const normalizedCaption = asString(caption).trim();
  const normalizedFullWidth = Boolean(fullWidth);
  return {
    type: "image",
    url: normalizedUrl,
    alt: normalizedAlt,
    caption: normalizedCaption,
    fullWidth: normalizedFullWidth,
  };
}

function normalizeQuote(data: unknown): BlogBlock | null {
  if (!data || typeof data !== "object") return null;
  const { text, attribution } = data as { text?: unknown; attribution?: unknown };
  const normalizedText = asString(text).trim();
  if (!normalizedText) return null;
  const normalizedAttribution = asString(attribution).trim();
  return {
    type: "quote",
    text: normalizedText,
    attribution: normalizedAttribution,
  };
}

function normalizeList(data: unknown): BlogBlock | null {
  if (!data || typeof data !== "object") return null;
  const { style, items } = data as { style?: unknown; items?: unknown };
  const normalizedItems = Array.isArray(items)
    ? items
        .map((item) => asString(item).trim())
        .filter((item) => item.length > 0)
    : [];
  if (!normalizedItems.length) return null;
  return {
    type: "list",
    style: style === "ordered" ? "ordered" : "unordered",
    items: normalizedItems,
  };
}

function normalizeCta(data: unknown): BlogBlock | null {
  if (!data || typeof data !== "object") return null;
  const { text, url, align } = data as { text?: unknown; url?: unknown; align?: unknown };
  const normalizedText = asString(text).trim();
  if (!normalizedText) return null;
  const normalizedUrl = asString(url).trim() || DEFAULT_URL;
  const normalizedAlign = align === "left" ? "left" : "center";
  return {
    type: "cta",
    text: normalizedText,
    url: normalizedUrl,
    align: normalizedAlign,
  };
}

function normalizeBlock(entry: unknown): BlogBlock | null {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const type = (entry as { type?: unknown }).type;
  const data = (entry as { data?: unknown }).data;

  switch (type) {
    case "heading":
      return normalizeHeading(data);
    case "paragraph":
      return normalizeParagraph(data);
    case "image":
      return normalizeImage(data);
    case "quote":
      return normalizeQuote(data);
    case "list":
      return normalizeList(data);
    case "cta":
      return normalizeCta(data);
    case "divider":
      return { type: "divider" };
    default:
      return null;
  }
}

export function parseBlogBody(body: string | null | undefined): BlogBlock[] {
  if (!body) {
    return [];
  }

  try {
    const parsed = JSON.parse(body) as { blocks?: unknown };
    if (!parsed || !Array.isArray(parsed.blocks)) {
      return [];
    }

    const blocks: BlogBlock[] = [];
    for (const entry of parsed.blocks) {
      const block = normalizeBlock(entry);
      if (block) {
        blocks.push(block);
      }
    }
    return blocks;
  } catch {
    const fallback = body.trim();
    return fallback ? [{ type: "paragraph", text: fallback }] : [];
  }
}

export function countWords(blocks: BlogBlock[]): number {
  const relevantText = blocks.flatMap((block) => {
    switch (block.type) {
      case "heading":
      case "paragraph":
        return [block.text];
      case "quote":
        return [block.text, block.attribution];
      case "list":
        return block.items;
      case "cta":
        return [block.text];
      default:
        return [];
    }
  });

  return relevantText
    .join(" ")
    .split(/\s+/)
    .filter((word) => word.trim().length > 0).length;
}

export function estimateReadingMinutes(blocks: BlogBlock[]): number {
  const words = countWords(blocks);
  if (!words) return 0;
  return Math.max(1, Math.round(words / 200));
}
