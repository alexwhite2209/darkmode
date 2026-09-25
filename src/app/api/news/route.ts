import { NextResponse } from "next/server";
import { getNews } from "@/services/content";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({ items: await getNews() });
}
