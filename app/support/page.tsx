import LegalPage from "@/components/legal/LegalPage";

export const metadata = { title: "Support | Wedding Market", alternates: { canonical: "https://thewedmarket.com/support" } };

export default function Page({searchParams}:{searchParams:Promise<{lang?:string}>}) {
  return <LegalPage kind="support" searchParams={searchParams} />;
}
