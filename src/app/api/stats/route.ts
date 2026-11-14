import { NextResponse } from "next/server";

import { getPlatformStats } from "@/lib/platform-stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getPlatformStats());
}
