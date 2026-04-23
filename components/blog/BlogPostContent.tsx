import { parseBlogBody, type BlogBlock } from "@/lib/blog/blocks";

type Props = {
  body: string | null;
  emptyMessage?: string;
};

export default function BlogPostContent({ body, emptyMessage = "" }: Props) {
  const blocks = parseBlogBody(body);

  if (!blocks.length) {
    return <p className="text-secondary">{emptyMessage}</p>;
  }

  return <div className="wm-blog-content d-grid gap-4">{blocks.map(renderBlock)}</div>;
}

function renderBlock(block: BlogBlock, index: number) {
  switch (block.type) {
    case "heading":
      if (block.level === "h3") {
        return (
          <h3 key={`heading-${index}`} className="wm-blog-heading-three">
            {block.text}
          </h3>
        );
      }
      if (block.level === "h4") {
        return (
          <h4 key={`heading-${index}`} className="wm-blog-heading-four">
            {block.text}
          </h4>
        );
      }
      return (
        <h2 key={`heading-${index}`} className="wm-blog-heading-two">
          {block.text}
        </h2>
      );
    case "paragraph":
      return (
        <p key={`paragraph-${index}`} className="wm-blog-paragraph mb-0">
          {block.text}
        </p>
      );
    case "image": {
      const figureClasses = block.fullWidth ? "" : "mx-auto";
      return (
        <figure key={`image-${index}`} className={`wm-blog-figure text-center ${figureClasses}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.url} alt={block.alt} className="img-fluid rounded-4 shadow-sm" />
          {block.caption && <figcaption className="wm-blog-caption">{block.caption}</figcaption>}
        </figure>
      );
    }
    case "quote":
      return (
        <blockquote key={`quote-${index}`} className="wm-blog-quote">
          <p className="mb-1">{block.text}</p>
          {block.attribution && <footer>{block.attribution}</footer>}
        </blockquote>
      );
    case "list": {
      const ListTag = block.style === "ordered" ? "ol" : "ul";
      return (
        <ListTag key={`list-${index}`} className="wm-blog-list mb-0">
          {block.items.map((item, itemIndex) => (
            <li key={`${index}-${itemIndex}`}>{item}</li>
          ))}
        </ListTag>
      );
    }
    case "cta":
      return (
        <div
          key={`cta-${index}`}
          className={`d-flex ${block.align === "left" ? "justify-content-start" : "justify-content-center"}`}
        >
          <a href={block.url} className="wm-blog-cta">
            {block.text}
          </a>
        </div>
      );
    case "divider":
      return <hr key={`divider-${index}`} className="wm-blog-divider" />;
    default:
      return null;
  }
}
