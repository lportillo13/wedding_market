import LegalPage from "@/components/legal/LegalPage";

export const metadata = { title: "Community Guidelines | Wedding Market", alternates: { canonical: "https://thewedmarket.com/community-guidelines" } };

export default function Page({searchParams}:{searchParams:Promise<{lang?:string}>}) {
  return <LegalPage kind="community-guidelines" searchParams={searchParams} />;
}
