import { NextResponse } from "next/server";
import { getFromR2 } from "@/lib/r2";

type RouteContext = {
  params: Promise<{
    key?: string[];
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const params = await context.params;
  const key = Array.isArray(params.key) ? params.key.join("/") : "";

  if (!key) {
    return NextResponse.json({ error: "Missing media key." }, { status: 400 });
  }

  try {
    const response = await getFromR2(key);
    const body = response.Body;
    if (!body || typeof (body as { transformToWebStream?: () => ReadableStream }).transformToWebStream !== "function") {
      return NextResponse.json({ error: "Media body unavailable." }, { status: 404 });
    }

    return new NextResponse((body as { transformToWebStream: () => ReadableStream }).transformToWebStream(), {
      status: 200,
      headers: {
        "Content-Type": response.ContentType ?? "application/octet-stream",
        "Cache-Control": response.CacheControl ?? "public, max-age=31536000, immutable",
        ...(response.ContentLength ? { "Content-Length": String(response.ContentLength) } : {}),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load media.";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
