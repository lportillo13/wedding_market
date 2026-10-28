/** UI labels follow the active dictionary, rather than a profile's first-render locale. */
export function localizeVendorCategory(category: { key?: string | null; slug?: string | null; label: string }, options: readonly { slug: string; label: string }[]): string {
  const keys = [category.key, category.slug].filter((key): key is string => typeof key === 'string').map(key => key.trim().toLowerCase());
  return options.find(option => keys.includes(option.slug.toLowerCase()))?.label ?? category.label;
}
