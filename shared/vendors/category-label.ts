/** UI labels follow the active dictionary, rather than a profile's first-render locale. */
export function localizeVendorCategory(category: { key?: string | null; slug?: string | null; label: string }, options: readonly { slug: string; label: string }[], categoryLabels: Readonly<Record<string, string>> = {}): string {
  const keys = [category.key, category.slug].filter((key): key is string => typeof key === 'string').map(key => key.trim().toLowerCase());
  return keys.map(key => Object.hasOwn(categoryLabels, key) ? categoryLabels[key] : undefined).find(Boolean) ?? options.find(option => keys.includes(option.slug.toLowerCase()))?.label ?? category.label;
}
