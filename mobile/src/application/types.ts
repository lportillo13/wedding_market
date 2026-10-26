import Ionicons from "@expo/vector-icons/Ionicons";

export type TabKey = "home" | "search" | "favorites" | "inbox" | "profile" | "vendor" | "admin";


export type IconName = keyof typeof Ionicons.glyphMap;


export type SearchViewMode = "list" | "map";


export type ClientProfileForm = {
  full_name: string;
  phone: string;
  country: string;
  language: "en" | "es";
  tentative_wedding_date: string;
  guest_count: string;
  wedding_budget: string;
  wedding_theme: string;
};
