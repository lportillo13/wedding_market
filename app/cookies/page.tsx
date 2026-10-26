import LegalPage from "@/components/legal/LegalPage";

export const metadata = { title: "Cookies and Device Storage | Wedding Market", alternates: { canonical: "https://thewedmarket.com/cookies" } };

export default function Page({searchParams}:{searchParams:Promise<{lang?:string}>}) {
  return <LegalPage kind="cookies" searchParams={searchParams} />;
}
