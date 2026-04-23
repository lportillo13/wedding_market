import type { Metadata } from "next";
import AboutPageContent from "./AboutPageContent";

export const metadata: Metadata = {
  title: "About Wedding Market",
  description: "Learn how Wedding Market helps couples find vendors, compare quotes, and plan with clarity.",
};

export default function AboutPage() {
  return <AboutPageContent />;
}
