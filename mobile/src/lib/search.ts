export function mergeUniqueById<T extends { id: string }>(current: T[], incoming: T[]) {
  const items = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) items.set(item.id, item);
  return Array.from(items.values());
}
