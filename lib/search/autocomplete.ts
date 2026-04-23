export function buildAutocompleteSuggestions(values: Array<string | null | undefined>, limit = 12): string[] {
  const unique = new Set<string>();

  for (const value of values) {
    const normalized = value?.replace(/\s+/g, " ").trim();
    if (!normalized) {
      continue;
    }

    unique.add(normalized);
    if (unique.size >= limit) {
      break;
    }
  }

  return Array.from(unique);
}
