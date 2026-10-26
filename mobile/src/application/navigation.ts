import { copy } from "../i18n/copy";
import { type AppRole } from "../lib/auth";
import { type IconName, type TabKey } from "./types";

export const tabIcons: Record<TabKey, IconName> = {
  home: "home-outline",
  search: "search-outline",
  favorites: "heart-outline",
  inbox: "chatbubbles-outline",
  profile: "person-outline",
  vendor: "briefcase-outline",
  admin: "shield-checkmark-outline",
};


export const clientTabs: { key: TabKey; label: string }[] = [
  { key: "home", label: "Home" },
  { key: "search", label: "Search" },
  { key: "favorites", label: "Favorites" },
  { key: "inbox", label: "Inbox" },
  { key: "profile", label: "Profile" },
];


export const guestTabs: { key: TabKey; label: string }[] = [
  { key: "home", label: "Home" },
  { key: "search", label: "Search" },
  { key: "favorites", label: "Favorites" },
  { key: "profile", label: "Profile" },
];


export const vendorTabs: { key: TabKey; label: string }[] = [
  { key: "home", label: "Home" },
  { key: "search", label: "Search" },
  { key: "vendor", label: "Vendor" },
  { key: "inbox", label: "Inbox" },
  { key: "profile", label: "Profile" },
];


export const adminTabs: { key: TabKey; label: string }[] = [
  { key: "admin", label: "Admin" },
  { key: "vendor", label: "Vendor" },
  { key: "inbox", label: "Inbox" },
  { key: "profile", label: "Profile" },
];


export function tabLabel(tab: TabKey, language: "en" | "es") {
  return copy[language][tab];
}


export function roleTabs(role: AppRole) {
  if (role === "admin") return adminTabs;
  if (role === "vendor") return vendorTabs;
  if (role === "guest") return guestTabs;
  return clientTabs;
}
