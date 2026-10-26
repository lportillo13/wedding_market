import LegalPage from "@/components/legal/LegalPage";

export const metadata = { title: "Privacy Policy | Wedding Market", alternates: { canonical: "https://thewedmarket.com/privacy" } };

export default function Page({searchParams}:{searchParams:Promise<{lang?:string}>}) {
  return <LegalPage kind="privacy" searchParams={searchParams} />;
}
