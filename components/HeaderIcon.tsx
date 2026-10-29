import type { SVGProps } from "react";
export type HeaderIconName =
  | "search"
  | "menu"
  | "close"
  | "arrow"
  | "heart"
  | "user"
  | "inbox"
  | "bell"
  | "play"
  | "pause"
  | "grid"
  | "calendar"
  | "pin"
  | "chevron";
const paths: Record<HeaderIconName, string> = {
  search: "M21 21l-4.6-4.6M19 10.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0Z",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "m6 6 12 12M6 18 18 6",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  heart:
    "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
  user: "M20 21v-2a7 7 0 0 0-14 0v2M17 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  inbox: "M4 4h16v16H4V4ZM4 14h5l1 3h4l1-3h5",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4",
  grid: "M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z",
  calendar: "M5 5h14a2 2 0 0 1 2 2v13H3V7a2 2 0 0 1 2-2ZM7 3v4M17 3v4M3 10h18M7 14h2M12 14h2M7 17h2",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  chevron: "m8 10 4 4 4-4",
  play: "M8 5v14l11-7Z",
  pause: "M6 4h4v16H6ZM14 4h4v16h-4Z",
};
export default function HeaderIcon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: HeaderIconName }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
