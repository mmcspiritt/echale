import { DiscoverView } from "@/components/home/discover-view";
import { SiteHeader } from "@/components/site/header";
import { listPublicStoriesWithStats, seedDemoStories } from "@/lib/store";

export const revalidate = 0;

export default async function Home() {
  await seedDemoStories();
  const stories = await listPublicStoriesWithStats();

  return (
    <div className="min-h-screen bg-[#fcfcfd]">
      <SiteHeader />
      <DiscoverView stories={stories} />
    </div>
  );
}
