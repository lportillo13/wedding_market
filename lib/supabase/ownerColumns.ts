export type OwnerColumn = "owner_id" | "owner_uuid";

function extractMessage(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (typeof error === "object" && "message" in error) {
    const value = (error as { message?: unknown }).message;
    return typeof value === "string" ? value : value ? String(value) : "";
  }
  return "";
}

export function isMissingOwnerColumnError(error: unknown, column: OwnerColumn): boolean {
  const message = extractMessage(error).toLowerCase();
  if (!message) return false;
  if (!message.includes(column)) return false;
  return (
    message.includes("does not exist") ||
    message.includes("unknown column") ||
    message.includes("missing from the selection set") ||
    message.includes("invalid reference")
  );
}

