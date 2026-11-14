import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { KioskView } from "@/components/story/kiosk-view";
import { toPublicStory } from "@/lib/public-story";
import { getStoryBySlugWithStats, listSupportersForStory, seedDemoStories } from "@/lib/store";

interface AlcanciaPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: AlcanciaPageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStoryBySlugWithStats(slug);
  if (!story) return { title: "Alcancía | Échale" };
  return {
    title: `Alcancía de ${story.personName} | Échale`,
    description: `Apoya a ${story.personName} desde el mostrador, con CoDi.`,
  };
}

export default async function AlcanciaPage({ params }: AlcanciaPageProps) {
  await seedDemoStories();
  const { slug } = await params;
  const story = await getStoryBySlugWithStats(slug);
  if (!story || story.status !== "aprobada") notFound();
  const supporters = await listSupportersForStory(story.id);

  return (
    <div className="min-h-screen bg-paper">
      <KioskView initialData={{ story: toPublicStory(story), supporters }} />
    </div>
  );
}
