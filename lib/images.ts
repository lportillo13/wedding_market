import type { CloudinaryImage } from "@/types/images";

export function isCloudinaryImage(value: unknown): value is CloudinaryImage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.url === "string" &&
    typeof record.public_id === "string" &&
    typeof record.width === "number" &&
    typeof record.height === "number" &&
    typeof record.format === "string"
  );
}

export function parseCloudinaryImage(value: unknown): CloudinaryImage | null {
  if (!isCloudinaryImage(value)) {
    return null;
  }

  const { url, public_id, width, height, format, bytes } = value as CloudinaryImage;
  return {
    url,
    public_id,
    width,
    height,
    format,
    ...(typeof bytes === "number" ? { bytes } : {}),
  };
}
