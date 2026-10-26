

export function imageUrlFromAsset(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const url = (value as Record<string, unknown>).url;
  return typeof url === "string" && url.trim() ? url : null;
}
