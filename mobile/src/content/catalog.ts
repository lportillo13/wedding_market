import { type IconName } from "../application/types";

export const heroImageUrl =
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=82";


export const categories = [
  {
    label: "Venues",
    slug: "venues",
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80",
  },
  {
    label: "Photography",
    slug: "photography",
    image: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=900&q=80",
  },
  {
    label: "Catering",
    slug: "catering",
    image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80",
  },
  {
    label: "Beauty",
    slug: "beauty",
    image: "https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?auto=format&fit=crop&w=900&q=80",
  },
  {
    label: "Entertainment",
    slug: "entertainment",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=80",
  },
  {
    label: "Decor",
    slug: "decor",
    image: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=900&q=80",
  },
];


export const detailSections = [
  { key: "photos", label: "Photos", icon: "images-outline" as IconName },
  { key: "about", label: "About", icon: "information-circle-outline" as IconName },
  { key: "spaces", label: "Spaces", icon: "business-outline" as IconName },
  { key: "pricing", label: "Pricing", icon: "cash-outline" as IconName },
  { key: "amenities", label: "Services", icon: "checkmark-circle-outline" as IconName },
  { key: "team", label: "Team", icon: "people-outline" as IconName },
  { key: "availability", label: "Availability", icon: "calendar-outline" as IconName },
  { key: "reviews", label: "Reviews", icon: "star-outline" as IconName },
  { key: "contact", label: "Contact", icon: "call-outline" as IconName },
];


export const weddingThemeOptions = [
  { value: "", label: "No theme selected" },
  { value: "classic", label: "Classic" },
  { value: "boho", label: "Boho" },
  { value: "rustic", label: "Rustic" },
  { value: "beach", label: "Beach" },
  { value: "garden", label: "Garden" },
  { value: "modern", label: "Modern" },
  { value: "vintage", label: "Vintage" },
];


export const weddingStyleCards = [
  {
    value: "classic",
    image: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=700&q=80",
  },
  {
    value: "boho",
    image: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=700&q=80",
  },
  {
    value: "modern",
    image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=700&q=80",
  },
  {
    value: "garden",
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=700&q=80",
  },
  {
    value: "beach",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=700&q=80",
  },
  {
    value: "rustic",
    image: "https://images.unsplash.com/photo-1505944357431-27579db47558?auto=format&fit=crop&w=700&q=80",
  },
  {
    value: "vintage",
    image: "https://images.unsplash.com/photo-1509610973147-232dfea52a97?auto=format&fit=crop&w=700&q=80",
  },
];


export function categoryLabel(slugOrLabel: string, language: "en" | "es") {
  const key = slugOrLabel.toLowerCase();
  const labels: Record<string, { en: string; es: string }> = {
    venues: { en: "Venues", es: "Lugares" },
    photography: { en: "Photography", es: "Fotografia" },
    catering: { en: "Catering", es: "Catering" },
    beauty: { en: "Beauty", es: "Belleza" },
    entertainment: { en: "Entertainment", es: "Entretenimiento" },
    decor: { en: "Decor", es: "Decoracion" },
  };
  return labels[key]?.[language] ?? slugOrLabel;
}


export function themeOptions(language: "en" | "es") {
  if (language === "en") return weddingThemeOptions;
  return [
    { value: "", label: "Sin estilo seleccionado" },
    { value: "classic", label: "Clásico" },
    { value: "boho", label: "Boho" },
    { value: "rustic", label: "Rústico" },
    { value: "beach", label: "Playa" },
    { value: "garden", label: "Jardín" },
    { value: "modern", label: "Moderno" },
    { value: "vintage", label: "Vintage" },
  ];
}
