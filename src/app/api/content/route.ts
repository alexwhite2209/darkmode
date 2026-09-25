import { NextResponse } from "next/server";
import { getAllPublications, getContent } from "@/services/content";

export const dynamic = "force-static";

/** Everything the home page renders, in one payload (for a future CMS / headless client). */
export async function GET() {
  const [content, media] = await Promise.all([getContent(), getAllPublications()]);
  return NextResponse.json({ ...content, media });
}
