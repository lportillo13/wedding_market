import LegalPage from "@/components/legal/LegalPage";

export const metadata = { title: "Terms of Service | Wedding Market", alternates: { canonical: "https://thewedmarket.com/terms" } };

export default function Page({searchParams}:{searchParams:Promise<{lang?:string}>}) {
  return <LegalPage kind="terms" searchParams={searchParams} />;
}
