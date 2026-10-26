export type ProfileSection =
  | "details"
  | "contact"
  | "images"
  | "pricing"
  | "amenities"
  | "team"
  | "availability"
  | "reviews";

export function getProfileEssentials(input: {
  name: string;
  description: string;
  hasPhoto: boolean;
  hasContact: boolean;
  hasPricing: boolean;
}): { id: ProfileSection; complete: boolean }[] {
  return [
    {
      id: "details",
      complete: Boolean(input.name.trim() && input.description.trim()),
    },
    { id: "images", complete: input.hasPhoto },
    { id: "contact", complete: input.hasContact },
    { id: "pricing", complete: input.hasPricing },
  ];
}
