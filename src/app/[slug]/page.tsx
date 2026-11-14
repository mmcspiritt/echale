import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPublicBaseUrl } from "@/lib/site-url";
import { StoryExperience } from "@/components/story/story-experience";
import { toPublicStory } from "@/lib/public-story";
import { getStoryBySlugWithStats, listSupportersForStory, seedDemoStories } from "@/lib/store";

interface StoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string; simular?: string; vista?: string }>;
}

export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStoryBySlugWithStats(slug);
  if (!story) notFound();
  if (story.status !== "aprobada") {
    return {
      title: "Historia en revisión | Échale",
      description: "Esta historia está en proceso de revisión por la organización aliada.",
    };
  }

  return {
    title: `${story.personName} | Échale`,
    description: story.summary,
    openGraph: {
      title: story.title,
      description: story.summary,
      images: [`/${story.slug}/opengraph-image`],
    },
    twitter: {
      card: "summary_large_image",
      title: story.title,
      description: story.summary,
      images: [`/${story.slug}/opengraph-image`],
    },
  };
}

export default async function StoryPage({ params, searchParams }: StoryPageProps) {
  await seedDemoStories();
  const { slug } = await params;
  const query = await searchParams;

  const story = await getStoryBySlugWithStats(slug);
  if (!story) {
    notFound();
  }
  const previewToken = query.preview?.trim() || null;
  const canAccess =
    story.status === "aprobada" ||
    (previewToken !== null && story.previewToken !== null && previewToken === story.previewToken);

  if (!canAccess) {
    notFound();
  }

  const supporters = await listSupportersForStory(story.id);
  const canSimulate =
    process.env.NODE_ENV !== "production" ||
    (query.simular === "1" && (await isAdminAuthenticated()));

  return (
    <div className="min-h-screen bg-paper pb-[calc(72px+env(safe-area-inset-bottom))] lg:pb-0">
      <SiteHeader />
      <StoryExperience
        initialData={{ story: toPublicStory(story), supporters }}
        previewToken={previewToken}
        publicBaseUrl={getPublicBaseUrl()}
        canSimulate={canSimulate}
        goalPreview={query.vista === "cumplida"}
      />
      <SiteFooter />
    </div>
  );
}
