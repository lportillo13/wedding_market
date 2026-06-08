import AsyncStorage from "@react-native-async-storage/async-storage";

const SHORTLIST_KEY = "wm_shortlist_v1";

export async function getShortlist() {
  try {
    const raw = await AsyncStorage.getItem(SHORTLIST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export async function setShortlist(ids: string[]) {
  await AsyncStorage.setItem(SHORTLIST_KEY, JSON.stringify(Array.from(new Set(ids))));
}

export async function toggleShortlist(id: string) {
  const current = await getShortlist();
  const exists = current.includes(id);
  const next = exists ? current.filter((item) => item !== id) : [...current, id];
  await setShortlist(next);
  return next;
}
