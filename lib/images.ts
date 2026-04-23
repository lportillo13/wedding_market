import type { MediaAsset } from "@/types/images";

export function isMediaAsset(value: unknown): value is MediaAsset {
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

export function parseMediaAsset(value: unknown): MediaAsset | null {
  if (!isMediaAsset(value)) {
    return null;
  }

  const { url, public_id, width, height, format, bytes, type } = value as MediaAsset;
  return {
    url,
    public_id,
    width,
    height,
    format,
    ...(typeof bytes === "number" ? { bytes } : {}),
    ...(type === "video" || type === "image" ? { type } : {}),
  };
}

export const isCloudinaryImage = isMediaAsset;
export const parseCloudinaryImage = parseMediaAsset;
