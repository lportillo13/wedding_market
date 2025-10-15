"use client";

import type { CSSProperties, FormEvent, ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type AdminPost = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  excerpt: string | null;
  hero_image_url: string | null;
  published_at: string | null;
  updated_at: string | null;
  body?: string | null;
};

type BlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "quote"
  | "list"
  | "cta"
  | "divider";

type HeadingBlock = {
  id: string;
  type: "heading";
  data: {
    level: "h2" | "h3" | "h4";
    text: string;
  };
};

type ParagraphBlock = {
  id: string;
  type: "paragraph";
  data: {
    text: string;
  };
};

type ImageBlock = {
  id: string;
  type: "image";
  data: {
    url: string;
    alt: string;
    caption: string;
    fullWidth: boolean;
  };
};

type QuoteBlock = {
  id: string;
  type: "quote";
  data: {
    text: string;
    attribution: string;
  };
};

type ListBlock = {
  id: string;
  type: "list";
  data: {
    style: "unordered" | "ordered";
    items: string[];
  };
};

type CtaBlock = {
  id: string;
  type: "cta";
  data: {
    text: string;
    url: string;
    align: "left" | "center";
  };
};

type DividerBlock = {
  id: string;
  type: "divider";
  data: Record<string, never>;
};

type BuilderBlock =
  | HeadingBlock
  | ParagraphBlock
  | ImageBlock
  | QuoteBlock
  | ListBlock
  | CtaBlock
  | DividerBlock;

type EditorState = {
  title: string;
  slug: string;
  excerpt: string;
  hero_image_url: string;
  status: "draft" | "published";
  blocks: BuilderBlock[];
};

type PaletteItem = {
  type: BlockType;
  label: string;
  description: string;
  sample: string;
};

const PALETTE: PaletteItem[] = [
  {
    type: "heading",
    label: "Heading",
    description: "Section headings keep long-form content scannable.",
    sample: "Elegant receptions made effortless",
  },
  {
    type: "paragraph",
    label: "Paragraph",
    description: "Tell the story with rich descriptive copy.",
    sample: "Share planning tips, vendor spotlights, and behind-the-scenes details.",
  },
  {
    type: "image",
    label: "Image",
    description: "Showcase photography with captions and alt text.",
    sample: "https://cdn.example.com/weddings/ballroom.jpg",
  },
  {
    type: "quote",
    label: "Pull quote",
    description: "Highlight a powerful testimonial or insight.",
    sample: "\"This platform transformed how we planned our celebration.\"",
  },
  {
    type: "list",
    label: "List",
    description: "Break down steps, features, or vendor highlights.",
    sample: "Create, compare, confirm",
  },
  {
    type: "cta",
    label: "Call to action",
    description: "Invite readers to explore services or contact the team.",
    sample: "Plan your dream wedding",
  },
  {
    type: "divider",
    label: "Divider",
    description: "Visually separate sections for a better reading rhythm.",
    sample: "Horizontal rule",
  },
];

const DEFAULT_BLOCK_DATA: Record<BlockType, BuilderBlock["data"]> = {
  heading: {
    level: "h2",
    text: "New section heading",
  },
  paragraph: {
    text: "Compose an engaging story here. Paste or type freely.",
  },
  image: {
    url: "",
    alt: "",
    caption: "",
    fullWidth: true,
  },
  quote: {
    text: "Add an inspiring quote or client testimonial.",
    attribution: "",
  },
  list: {
    style: "unordered",
    items: ["First highlight", "Second highlight", "Third highlight"],
  },
  cta: {
    text: "Plan your dream wedding",
    url: "https://",
    align: "center",
  },
  divider: {},
};

const BLOCK_LABELS: Record<BlockType, string> = {
  heading: "Heading",
  paragraph: "Paragraph",
  image: "Image",
  quote: "Pull quote",
  list: "List",
  cta: "Call to action",
  divider: "Divider",
};

type Props = {
  initialPosts: AdminPost[];
  errorMessage?: string;
};

type Status = "idle" | "saving" | "error" | "success";

type BuilderResponse = {
  version: number;
  blocks: BuilderBlock[];
  html: string;
};

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function createBlock(type: BlockType): BuilderBlock {
  const defaults = DEFAULT_BLOCK_DATA[type];
  return {
    id: createId(),
    type,
    data: JSON.parse(JSON.stringify(defaults)),
  } as BuilderBlock;
}

function createEmptyEditor(): EditorState {
  return {
    title: "",
    slug: "",
    excerpt: "",
    hero_image_url: "",
    status: "draft",
    blocks: [],
  };
}

function normalizeBlock(raw: unknown): BuilderBlock | null {
  if (!raw || typeof raw !== "object" || !("type" in raw)) {
    return null;
  }

  const block = raw as Partial<BuilderBlock> & { type?: BlockType; id?: string };
  switch (block.type) {
    case "heading": {
      const data = block.data as HeadingBlock["data"] | undefined;
      return {
        id: block.id || createId(),
        type: "heading",
        data: {
          level: data?.level === "h2" || data?.level === "h3" || data?.level === "h4" ? data.level : "h2",
          text: typeof data?.text === "string" ? data.text : "",
        },
      };
    }
    case "paragraph": {
      const data = block.data as ParagraphBlock["data"] | undefined;
      return {
        id: block.id || createId(),
        type: "paragraph",
        data: {
          text: typeof data?.text === "string" ? data.text : "",
        },
      };
    }
    case "image": {
      const data = block.data as ImageBlock["data"] | undefined;
      return {
        id: block.id || createId(),
        type: "image",
        data: {
          url: typeof data?.url === "string" ? data.url : "",
          alt: typeof data?.alt === "string" ? data.alt : "",
          caption: typeof data?.caption === "string" ? data.caption : "",
          fullWidth: typeof data?.fullWidth === "boolean" ? data.fullWidth : true,
        },
      };
    }
    case "quote": {
      const data = block.data as QuoteBlock["data"] | undefined;
      return {
        id: block.id || createId(),
        type: "quote",
        data: {
          text: typeof data?.text === "string" ? data.text : "",
          attribution: typeof data?.attribution === "string" ? data.attribution : "",
        },
      };
    }
    case "list": {
      const data = block.data as ListBlock["data"] | undefined;
      const items = Array.isArray(data?.items)
        ? data.items.filter((item): item is string => typeof item === "string")
        : [];
      return {
        id: block.id || createId(),
        type: "list",
        data: {
          style: data?.style === "ordered" ? "ordered" : "unordered",
          items: items.length ? items : [""],
        },
      };
    }
    case "cta": {
      const data = block.data as CtaBlock["data"] | undefined;
      return {
        id: block.id || createId(),
        type: "cta",
        data: {
          text: typeof data?.text === "string" ? data.text : "",
          url: typeof data?.url === "string" ? data.url : "https://",
          align: data?.align === "left" ? "left" : "center",
        },
      };
    }
    case "divider":
      return {
        id: block.id || createId(),
        type: "divider",
        data: {},
      };
    default:
      return null;
  }
}

function parseBodyToBlocks(body: string | null | undefined): BuilderBlock[] {
  if (!body) {
    return [];
  }

  try {
    const parsed = JSON.parse(body) as Partial<BuilderResponse>;
    if (parsed && Array.isArray(parsed.blocks)) {
      const result: BuilderBlock[] = [];
      for (const entry of parsed.blocks) {
        const block = normalizeBlock(entry);
        if (block) result.push(block);
      }
      return result;
    }
  } catch {
    return [
      {
        id: createId(),
        type: "paragraph",
        data: {
          text: body,
        },
      },
    ];
  }

  return [];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderBlockToHtml(block: BuilderBlock): string {
  switch (block.type) {
    case "heading":
      return `<${block.data.level}>${escapeHtml(block.data.text)}</${block.data.level}>`;
    case "paragraph":
      return `<p>${escapeHtml(block.data.text)}</p>`;
    case "image": {
      if (!block.data.url) return "";
      const classes = block.data.fullWidth ? " class=\"full-width\"" : "";
      const img = `<img src="${escapeHtml(block.data.url)}" alt="${escapeHtml(block.data.alt)}"${classes}>`;
      if (block.data.caption) {
        return `<figure>${img}<figcaption>${escapeHtml(block.data.caption)}</figcaption></figure>`;
      }
      return `<figure>${img}</figure>`;
    }
    case "quote": {
      const citation = block.data.attribution
        ? `<cite>${escapeHtml(block.data.attribution)}</cite>`
        : "";
      return `<blockquote><p>${escapeHtml(block.data.text)}</p>${citation}</blockquote>`;
    }
    case "list": {
      const tag = block.data.style === "ordered" ? "ol" : "ul";
      const items = block.data.items
        .filter((item) => item.trim().length > 0)
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("");
      return `<${tag}>${items}</${tag}>`;
    }
    case "cta": {
      if (!block.data.text.trim()) return "";
      const alignClass = block.data.align === "left" ? "cta-left" : "cta-center";
      const href = block.data.url ? ` href="${escapeHtml(block.data.url)}"` : "";
      return `<p class="cta ${alignClass}"><a${href}>${escapeHtml(block.data.text)}</a></p>`;
    }
    case "divider":
      return "<hr />";
    default:
      return "";
  }
}

function blocksToHtml(blocks: BuilderBlock[]): string {
  return blocks
    .map((block) => renderBlockToHtml(block))
    .filter((value) => value.length > 0)
    .join("\n");
}

function countWords(blocks: BuilderBlock[]): number {
  const relevantText = blocks.flatMap((block) => {
    switch (block.type) {
      case "heading":
        return [block.data.text];
      case "paragraph":
        return [block.data.text];
      case "quote":
        return [block.data.text, block.data.attribution];
      case "list":
        return block.data.items;
      case "cta":
        return [block.data.text];
      default:
        return [];
    }
  });

  return relevantText
    .join(" ")
    .split(/\s+/)
    .filter((word) => word.trim().length > 0).length;
}

function generateExcerpt(blocks: BuilderBlock[], maxLength = 220): string {
  const text = blocks
    .flatMap((block) => {
      switch (block.type) {
        case "heading":
        case "paragraph":
          return [block.data.text];
        case "quote":
          return [block.data.text];
        case "list":
          return block.data.items;
        default:
          return [];
      }
    })
    .join(" ")
    .trim();

  if (!text) return "";
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const cutIndex = truncated.lastIndexOf(" ");
  return (cutIndex > 0 ? truncated.slice(0, cutIndex) : truncated).concat("…");
}

type SortableBlockProps = {
  block: BuilderBlock;
  onChange(block: BuilderBlock): void;
  onRemove(id: string): void;
};

function SortableBlock({ block, onChange, onRemove }: SortableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border border-slate-800 bg-slate-950/80 shadow-sm shadow-slate-950/20 transition ${
        isDragging ? "z-10 ring-2 ring-emerald-400/60" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 px-4 py-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 hover:text-emerald-200"
        >
          <span aria-hidden className="text-lg leading-none">
            ⋮⋮
          </span>
          Drag
        </button>
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{BLOCK_LABELS[block.type]}</span>
        <button
          type="button"
          onClick={() => onRemove(block.id)}
          className="rounded-xl border border-slate-700 px-2 py-1 text-xs font-semibold text-slate-300 transition hover:border-rose-500/60 hover:text-rose-300"
        >
          Remove
        </button>
      </div>
      <div className="px-5 py-4">
        <BlockFields block={block} onChange={onChange} />
      </div>
    </div>
  );
}

type BlockFieldsProps = {
  block: BuilderBlock;
  onChange(block: BuilderBlock): void;
};

function BlockFields({ block, onChange }: BlockFieldsProps) {
  switch (block.type) {
    case "heading":
      return (
        <div className="space-y-3">
          <label className="grid gap-2 text-sm text-slate-200">
            Level
            <select
              value={block.data.level}
              onChange={(event) =>
                onChange({
                  ...block,
                  data: {
                    ...block.data,
                    level: event.target.value as HeadingBlock["data"]["level"],
                  },
                })
              }
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
            >
              <option value="h2">H2 – Section heading</option>
              <option value="h3">H3 – Sub heading</option>
              <option value="h4">H4 – Supporting heading</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm text-slate-200">
            Text
            <input
              value={block.data.text}
              onChange={(event) =>
                onChange({
                  ...block,
                  data: {
                    ...block.data,
                    text: event.target.value,
                  },
                })
              }
              placeholder="Elegant receptions made effortless"
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </label>
        </div>
      );
    case "paragraph":
      return (
        <label className="grid gap-2 text-sm text-slate-200">
          Text
          <textarea
            value={block.data.text}
            onChange={(event) =>
              onChange({
                ...block,
                data: {
                  ...block.data,
                  text: event.target.value,
                },
              })
            }
            rows={6}
            placeholder="Compose an engaging narrative, include planning tips, or spotlight partner vendors."
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
          />
        </label>
      );
    case "image":
      return (
        <div className="space-y-3">
          <label className="grid gap-2 text-sm text-slate-200">
            Image URL
            <input
              value={block.data.url}
              onChange={(event) =>
                onChange({
                  ...block,
                  data: {
                    ...block.data,
                    url: event.target.value,
                  },
                })
              }
              placeholder="https://cdn.example.com/weddings/ballroom.jpg"
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-200">
            Alt text
            <input
              value={block.data.alt}
              onChange={(event) =>
                onChange({
                  ...block,
                  data: {
                    ...block.data,
                    alt: event.target.value,
                  },
                })
              }
              placeholder="Couple dancing during their reception"
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-200">
            Caption
            <input
              value={block.data.caption}
              onChange={(event) =>
                onChange({
                  ...block,
                  data: {
                    ...block.data,
                    caption: event.target.value,
                  },
                })
              }
              placeholder="Photography by Coastal Lens Studio"
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={block.data.fullWidth}
              onChange={(event) =>
                onChange({
                  ...block,
                  data: {
                    ...block.data,
                    fullWidth: event.target.checked,
                  },
                })
              }
              className="h-4 w-4 rounded border border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
            />
            Display edge-to-edge
          </label>
        </div>
      );
    case "quote":
      return (
        <div className="space-y-3">
          <label className="grid gap-2 text-sm text-slate-200">
            Quote
            <textarea
              value={block.data.text}
              onChange={(event) =>
                onChange({
                  ...block,
                  data: {
                    ...block.data,
                    text: event.target.value,
                  },
                })
              }
              rows={4}
              placeholder="\"Our vendors were incredible. Wedding Market matched us perfectly.\""
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-200">
            Attribution
            <input
              value={block.data.attribution}
              onChange={(event) =>
                onChange({
                  ...block,
                  data: {
                    ...block.data,
                    attribution: event.target.value,
                  },
                })
              }
              placeholder="Alex & Jordan, married October 2024"
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </label>
        </div>
      );
    case "list":
      return (
        <div className="space-y-3">
          <label className="grid gap-2 text-sm text-slate-200">
            Style
            <select
              value={block.data.style}
              onChange={(event) =>
                onChange({
                  ...block,
                  data: {
                    ...block.data,
                    style: event.target.value as ListBlock["data"]["style"],
                  },
                })
              }
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
            >
              <option value="unordered">Bullet list</option>
              <option value="ordered">Numbered list</option>
            </select>
          </label>
          <div className="space-y-2">
            {block.data.items.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  value={item}
                  onChange={(event) => {
                    const items = [...block.data.items];
                    items[index] = event.target.value;
                    onChange({
                      ...block,
                      data: {
                        ...block.data,
                        items,
                      },
                    });
                  }}
                  placeholder={`Item ${index + 1}`}
                  className="grow rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const items = block.data.items.filter((_, idx) => idx !== index);
                    onChange({
                      ...block,
                      data: {
                        ...block.data,
                        items: items.length ? items : [""],
                      },
                    });
                  }}
                  className="rounded-xl border border-slate-700 px-2 py-1 text-xs font-semibold text-slate-300 transition hover:border-rose-500/60 hover:text-rose-300"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...block,
                  data: {
                    ...block.data,
                    items: [...block.data.items, ""],
                  },
                })
              }
              className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:border-emerald-400 hover:text-emerald-200"
            >
              Add list item
            </button>
          </div>
        </div>
      );
    case "cta":
      return (
        <div className="space-y-3">
          <label className="grid gap-2 text-sm text-slate-200">
            Button text
            <input
              value={block.data.text}
              onChange={(event) =>
                onChange({
                  ...block,
                  data: {
                    ...block.data,
                    text: event.target.value,
                  },
                })
              }
              placeholder="Plan your dream wedding"
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-200">
            Destination URL
            <input
              value={block.data.url}
              onChange={(event) =>
                onChange({
                  ...block,
                  data: {
                    ...block.data,
                    url: event.target.value,
                  },
                })
              }
              placeholder="https://weddingmarket.com/planning"
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-200">
            Alignment
            <select
              value={block.data.align}
              onChange={(event) =>
                onChange({
                  ...block,
                  data: {
                    ...block.data,
                    align: event.target.value as CtaBlock["data"]["align"],
                  },
                })
              }
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
            >
              <option value="center">Centered button</option>
              <option value="left">Left aligned button</option>
            </select>
          </label>
        </div>
      );
    case "divider":
      return (
        <p className="text-sm text-slate-400">
          A subtle horizontal rule separates major sections for easier scanning.
        </p>
      );
    default:
      return null;
  }
}

function PaletteButton({ item, onAdd }: { item: PaletteItem; onAdd(type: BlockType): void }) {
  return (
    <button
      type="button"
      onClick={() => onAdd(item.type)}
      className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4 text-left shadow shadow-slate-950/20 transition hover:border-emerald-400 hover:bg-slate-900/80"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">{item.label}</p>
      <p className="mt-2 text-sm text-slate-100">{item.description}</p>
      <p className="mt-3 text-xs italic text-slate-500">Example: {item.sample}</p>
    </button>
  );
}

function palettePlaceholder(onAdd: (type: BlockType) => void): ReactNode {
  return (
    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-6 text-center">
      <p className="text-sm text-slate-300">
        Drag blocks from the right or click below to start building a beautiful blog post.
      </p>
      <div className="mt-6 grid gap-3">
        {PALETTE.slice(0, 3).map((item) => (
          <PaletteButton key={item.type} item={item} onAdd={onAdd} />
        ))}
      </div>
    </div>
  );
}

export default function BlogPostManager({ initialPosts, errorMessage }: Props) {
  const [posts, setPosts] = useState<AdminPost[]>(initialPosts);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(errorMessage ?? null);
  const [busyPostId, setBusyPostId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>(createEmptyEditor);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [slugDirty, setSlugDirty] = useState(false);

  useEffect(() => {
    if (slugDirty) return;
    setEditor((prev) => {
      const nextSlug = prev.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      if (prev.slug === nextSlug) return prev;
      return {
        ...prev,
        slug: nextSlug,
      };
    });
  }, [editor.title, slugDirty]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const htmlPreview = useMemo(() => blocksToHtml(editor.blocks), [editor.blocks]);
  const wordCount = useMemo(() => countWords(editor.blocks), [editor.blocks]);

  const resetEditor = useCallback(() => {
    setEditor(createEmptyEditor());
    setEditorMode("create");
    setEditingId(null);
    setSlugDirty(false);
  }, []);

  const handleSelectPost = useCallback(
    (post: AdminPost) => {
      setEditor({
        title: post.title ?? "",
        slug: post.slug ?? "",
        excerpt: post.excerpt ?? "",
        hero_image_url: post.hero_image_url ?? "",
        status: post.status,
        blocks: parseBodyToBlocks(post.body),
      });
      setEditorMode("edit");
      setEditingId(post.id);
      setSlugDirty(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setMessage(`Editing “${post.title || "Untitled post"}”`);
    },
    []
  );

  const handleAddBlock = useCallback((type: BlockType) => {
    setEditor((prev) => ({
      ...prev,
      blocks: [...prev.blocks, createBlock(type)],
    }));
  }, []);

  const handleChangeBlock = useCallback((updated: BuilderBlock) => {
    setEditor((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) => (block.id === updated.id ? updated : block)),
    }));
  }, []);

  const handleRemoveBlock = useCallback((id: string) => {
    setEditor((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((block) => block.id !== id),
    }));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setEditor((prev) => {
      const oldIndex = prev.blocks.findIndex((block) => block.id === active.id);
      const newIndex = prev.blocks.findIndex((block) => block.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return {
        ...prev,
        blocks: arrayMove(prev.blocks, oldIndex, newIndex),
      };
    });
  }, []);

  const submitEditor = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setStatus("saving");
      setMessage(null);

      const { title, slug, excerpt, hero_image_url, status: postStatus, blocks } = editor;

      if (!title.trim()) {
        setStatus("error");
        setMessage("Title is required.");
        return;
      }
      if (!slug.trim()) {
        setStatus("error");
        setMessage("Slug is required.");
        return;
      }
      if (!/^[a-z0-9-]+$/.test(slug)) {
        setStatus("error");
        setMessage("Slug can only include lowercase letters, numbers, and hyphens.");
        return;
      }
      if (!blocks.length) {
        setStatus("error");
        setMessage("Add at least one content block to publish your post.");
        return;
      }

      const html = blocksToHtml(blocks);
      const payload = {
        title,
        slug,
        excerpt,
        hero_image_url,
        body: JSON.stringify({
          version: 1,
          blocks,
          html,
        } satisfies BuilderResponse),
        status: postStatus,
      };

      try {
        if (editorMode === "edit" && editingId) {
          setBusyPostId(editingId);
          const response = await fetch("/api/admin/blog-posts", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: editingId, updates: payload }),
          });
          const body = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(body.error ?? "Unable to update post");
          }
          const post = body.post as AdminPost | undefined;
          setPosts((current) =>
            current.map((item) =>
              item.id === editingId
                ? {
                    ...(post ?? item),
                    ...payload,
                  }
                : item
            )
          );
          setMessage("Post updated");
        } else {
          const response = await fetch("/api/admin/blog-posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const body = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(body.error ?? "Unable to create post");
          }
          const post = body.post as AdminPost | undefined;
          if (post) {
            setPosts((current) => [post, ...current]);
          }
          resetEditor();
          setMessage("Post created");
        }
        setStatus("success");
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setBusyPostId(null);
      }
    },
    [editor, editorMode, editingId, resetEditor]
  );

  async function handleToggleStatus(post: AdminPost) {
    setBusyPostId(post.id);
    setMessage(null);
    try {
      const nextStatus = post.status === "published" ? "draft" : "published";
      const response = await fetch("/api/admin/blog-posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, updates: { status: nextStatus } }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update status");
      }
      const updated = payload.post as AdminPost | undefined;
      setPosts((current) =>
        current.map((item) =>
          item.id === post.id
            ? {
                ...(updated ?? item),
                status: nextStatus,
              }
            : item
        )
      );
      if (editingId === post.id) {
        setEditor((prev) => ({ ...prev, status: nextStatus }));
      }
      setMessage(nextStatus === "published" ? "Post published" : "Post moved to drafts");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setBusyPostId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this post? This action cannot be undone.")) {
      return;
    }

    setBusyPostId(id);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/blog-posts?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to delete post");
      }
      setPosts((current) => current.filter((post) => post.id !== id));
      if (editingId === id) {
        resetEditor();
      }
      setMessage("Post deleted");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setBusyPostId(null);
    }
  }

  const hasPosts = posts.length > 0;

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 shadow-xl shadow-slate-900/20">
      <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Publishing</p>
          <h2 className="text-2xl font-semibold text-white">Blog post studio</h2>
        </div>
        <p className="max-w-xl text-sm text-slate-400">
          Draft, design, and publish beautiful editorial content with drag-and-drop blocks, inline editing, and live previews.
        </p>
      </header>

      {message && (
        <div
          className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
            status === "error"
              ? "border-rose-500/40 bg-rose-500/10 text-rose-100"
              : "border-slate-700 bg-slate-900/70 text-slate-200"
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={submitEditor} className="grid gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm text-slate-200">
            Title
            <input
              required
              value={editor.title}
              onChange={(event) =>
                setEditor((prev) => ({
                  ...prev,
                  title: event.target.value,
                }))
              }
              placeholder="Inside a coastal chic celebration"
              className="rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-200">
            Slug
            <input
              required
              value={editor.slug}
              onChange={(event) => {
                setSlugDirty(true);
                setEditor((prev) => ({
                  ...prev,
                  slug: event.target.value,
                }));
              }}
              placeholder="inside-a-coastal-celebration"
              className="rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-200 sm:col-span-2">
            Excerpt
            <textarea
              value={editor.excerpt}
              onChange={(event) =>
                setEditor((prev) => ({
                  ...prev,
                  excerpt: event.target.value,
                }))
              }
              rows={3}
              placeholder="Summarise the story in one irresistible paragraph for listings and social previews."
              className="rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <button
              type="button"
              onClick={() =>
                setEditor((prev) => ({
                  ...prev,
                  excerpt: generateExcerpt(prev.blocks),
                }))
              }
              className="rounded-xl border border-slate-700 px-3 py-2 font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-emerald-400 hover:text-emerald-200"
            >
              Auto-excerpt from content
            </button>
            <span>Recommended 150–220 characters.</span>
          </div>
          <label className="grid gap-2 text-sm text-slate-200">
            Hero image URL
            <input
              value={editor.hero_image_url}
              onChange={(event) =>
                setEditor((prev) => ({
                  ...prev,
                  hero_image_url: event.target.value,
                }))
              }
              placeholder="https://cdn.example.com/blog/hero.jpg"
              className="rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={editor.status === "published"}
              onChange={(event) =>
                setEditor((prev) => ({
                  ...prev,
                  status: event.target.checked ? "published" : "draft",
                }))
              }
              className="h-4 w-4 rounded border border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
            />
            Publish immediately
          </label>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Block library</h3>
            {PALETTE.map((item) => (
              <PaletteButton key={item.type} item={item} onAdd={handleAddBlock} />
            ))}
          </aside>
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Canvas</h3>
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <SortableContext items={editor.blocks.map((block) => block.id)}>
                <div className="grid gap-4">
                  {editor.blocks.length === 0
                    ? palettePlaceholder(handleAddBlock)
                    : editor.blocks.map((block) => (
                        <SortableBlock
                          key={block.id}
                          block={block}
                          onChange={handleChangeBlock}
                          onRemove={handleRemoveBlock}
                        />
                      ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Live preview</h3>
            <div className="mt-4 space-y-4">
              <article
                className="prose prose-invert max-w-none space-y-4 text-slate-100"
                dangerouslySetInnerHTML={{ __html: htmlPreview || "<p class=\"text-slate-400\">Add blocks to see the article preview.</p>" }}
              />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-sm text-slate-300">
            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Content checklist</h3>
            <ul className="mt-4 space-y-3">
              <li>Word count: {wordCount} words</li>
              <li>{editor.hero_image_url ? "Hero image added" : "Add a hero image for richer previews"}</li>
              <li>{editor.excerpt ? "Custom excerpt provided" : "Add an excerpt for SEO and sharing"}</li>
              <li>{editor.status === "published" ? "Will publish immediately" : "Will remain in drafts"}</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t border-slate-800 pt-6">
          <div className="text-sm text-slate-400">
            {editorMode === "edit"
              ? `Editing existing post${editingId ? ` (#${editingId.slice(0, 8)})` : ""}`
              : "Creating new post"}
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            {editorMode === "edit" && (
              <button
                type="button"
                onClick={resetEditor}
                className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-emerald-400 hover:text-emerald-200"
              >
                Cancel editing
              </button>
            )}
            <button
              type="submit"
              className="rounded-2xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60"
              disabled={status === "saving"}
            >
              {status === "saving"
                ? editorMode === "edit"
                  ? "Saving changes…"
                  : "Publishing…"
                : editorMode === "edit"
                  ? "Save changes"
                  : "Publish post"}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-12 grid gap-6">
        {hasPosts ? (
          posts.map((post) => (
            <article key={post.id} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6">
              <div className="flex flex-wrap items-start gap-4">
                <div className="grow">
                  <h3 className="text-xl font-semibold text-white">{post.title || "Untitled"}</h3>
                  <p className="text-sm text-slate-400">/{post.slug}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                    post.status === "published"
                      ? "bg-emerald-500/20 text-emerald-200"
                      : "bg-amber-500/20 text-amber-200"
                  }`}
                >
                  {post.status}
                </span>
              </div>
              <dl className="mt-4 grid gap-2 text-xs text-slate-400 sm:grid-cols-3">
                <div>
                  <dt className="uppercase tracking-[0.2em]">Updated</dt>
                  <dd>{formatTimestamp(post.updated_at)}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-[0.2em]">Published</dt>
                  <dd>{formatTimestamp(post.published_at)}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-[0.2em]">Hero image</dt>
                  <dd>{post.hero_image_url || "—"}</dd>
                </div>
              </dl>
              <p className="mt-4 text-sm text-slate-300">{post.excerpt || "No excerpt yet."}</p>
              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => handleSelectPost(post)}
                  className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-emerald-400 hover:text-emerald-200"
                  disabled={busyPostId === post.id}
                >
                  Edit in studio
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleStatus(post)}
                  className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-emerald-400 hover:text-emerald-200"
                  disabled={busyPostId === post.id}
                >
                  {post.status === "published" ? "Move to draft" : "Publish"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(post.id)}
                  className="ml-auto rounded-2xl border border-rose-500/60 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/10"
                  disabled={busyPostId === post.id}
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        ) : (
          <p className="text-sm text-slate-400">No blog posts yet. Use the studio above to create your first story.</p>
        )}
      </div>
    </section>
  );
}

function formatTimestamp(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}
