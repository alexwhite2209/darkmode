import { NextResponse } from "next/server";
import { getGuides } from "@/services/content";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({ items: await getGuides() });
}
