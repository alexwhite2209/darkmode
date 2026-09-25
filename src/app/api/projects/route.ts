import { NextResponse } from "next/server";
import { getProjects } from "@/services/content";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({ items: await getProjects() });
}
