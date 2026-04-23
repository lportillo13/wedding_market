import { NextRequest, NextResponse } from "next/server";
import { loadManagedSiteContent } from "@/lib/content/siteContentServer";

export async function GET(request: NextRequest) {
  const language = request.nextUrl.searchParams.get("lang");
  const content = await loadManagedSiteContent(language);

  return NextResponse.json(content);
}
