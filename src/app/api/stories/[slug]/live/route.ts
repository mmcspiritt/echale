import { NextResponse } from "next/server";

import { getStoryBySlugWithStats, listSupportersForStory } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const story = await getStoryBySlugWithStats(slug);
  if (!story) {
    return NextResponse.json({ error: "Historia no encontrada" }, { status: 404 });
  }

  const url = new URL(request.url);
  const preview = url.searchParams.get("preview");
  const canAccess =
    story.status === "aprobada" ||
    (preview !== null && story.previewToken !== null && preview === story.previewToken);
  if (!canAccess) {
    return NextResponse.json({ error: "Historia no disponible" }, { status: 404 });
  }

  const supporters = await listSupportersForStory(story.id);
  return NextResponse.json({
    story,
    supporters,
  });
}
