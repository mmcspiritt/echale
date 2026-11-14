import type { Metadata } from "next";
import { DiscoverView } from "@/components/home/discover-view";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { getPublicBaseUrl } from "@/lib/site-url";
import { getPlatformStats } from "@/lib/platform-stats";
import { listPublicStoriesWithStats, seedDemoStories } from "@/lib/store";

export const revalidate = 0;

const publicBaseUrl = getPublicBaseUrl();

export const metadata: Metadata = {
  title: "Échale | Historias solidarias con CoDi",
  description:
    "Apoya metas gestionadas por organizaciones aliadas con pagos instantáneos CoDi vía Pey.",
  openGraph: {
    title: "Échale | Historias solidarias con CoDi",
    description:
      "Apoya metas gestionadas por organizaciones aliadas con pagos instantáneos CoDi vía Pey.",
    images: [`${publicBaseUrl}/opengraph-image`],
  },
  twitter: {
    card: "summary_large_image",
    title: "Échale | Historias solidarias con CoDi",
    description:
      "Apoya metas gestionadas por organizaciones aliadas con pagos instantáneos CoDi vía Pey.",
    images: [`${publicBaseUrl}/opengraph-image`],
  },
};

export default async function Home() {
  await seedDemoStories();
  const [stories, stats] = await Promise.all([listPublicStoriesWithStats(), getPlatformStats()]);

  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader />
      <DiscoverView stories={stories} realTotal={stats.totals.amountRaisedRealTotal} />
      <SiteFooter />
    </div>
  );
}
