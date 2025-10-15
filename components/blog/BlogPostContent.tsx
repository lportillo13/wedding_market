import { parseBlogBody, type BlogBlock } from "@/lib/blog/blocks";

type Props = {
  body: string | null;
};

export default function BlogPostContent({ body }: Props) {
  const blocks = parseBlogBody(body);

  if (!blocks.length) {
    return <p className="text-secondary">This post doesn&apos;t have any content yet.</p>;
  }

  return <div className="d-grid gap-4">{blocks.map(renderBlock)}</div>;
}

function renderBlock(block: BlogBlock, index: number) {
  switch (block.type) {
    case "heading":
      return (
        <h2 key={`heading-${index}`} className="fw-bold display-6">
          {block.text}
        </h2>
      );
    case "paragraph":
      return (
        <p key={`paragraph-${index}`} className="fs-5 text-secondary mb-0">
          {block.text}
        </p>
      );
    case "image": {
      const figureClasses = block.fullWidth ? "" : "mx-auto";
      return (
        <figure key={`image-${index}`} className={`text-center ${figureClasses}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.url} alt={block.alt} className="img-fluid rounded-4 shadow-sm" />
          {block.caption && <figcaption className="mt-2 text-secondary small">{block.caption}</figcaption>}
        </figure>
      );
    }
    case "quote":
      return (
        <blockquote key={`quote-${index}`} className="blockquote border-start border-4 ps-3">
          <p className="fs-4 mb-1">{block.text}</p>
          {block.attribution && <footer className="blockquote-footer">{block.attribution}</footer>}
        </blockquote>
      );
    case "list": {
      const ListTag = block.style === "ordered" ? "ol" : "ul";
      return (
        <ListTag key={`list-${index}`} className="ps-3 fs-5 text-secondary mb-0">
          {block.items.map((item, itemIndex) => (
            <li key={`${index}-${itemIndex}`} className="mb-1">
              {item}
            </li>
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
          <a href={block.url} className="btn btn-primary btn-lg">
            {block.text}
          </a>
        </div>
      );
    case "divider":
      return <hr key={`divider-${index}`} className="my-4" />;
    default:
      return null;
  }
}
