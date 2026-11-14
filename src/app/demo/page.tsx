import { DemoView } from "@/components/demo/demo-view";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPlatformStats } from "@/lib/platform-stats";
import { getPublicBaseUrl } from "@/lib/site-url";
import { getStoryBySlugWithStats, seedDemoStories } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ pantalla?: string; simular?: string }>;
}) {
  const params = await searchParams;
  await seedDemoStories();
  const [stats, miriam, admin] = await Promise.all([
    getPlatformStats(),
    getStoryBySlugWithStats("miriam"),
    params.simular === "1" ? isAdminAuthenticated() : Promise.resolve(false),
  ]);
  const canSimulate = process.env.NODE_ENV !== "production" || (params.simular === "1" && admin);
  const pantalla = params.pantalla === "1";

  return (
    <div className={pantalla ? "min-h-screen bg-paper" : "min-h-screen bg-paper"}>
      {pantalla ? null : <SiteHeader />}
      <main className={pantalla ? "" : "mx-auto w-full max-w-7xl px-4 py-6 md:px-8"}>
        <DemoView
          baseUrl={getPublicBaseUrl()}
          initialStats={stats}
          pantalla={pantalla}
          canSimulate={canSimulate}
          miriamRaised={miriam?.amountRaised ?? null}
        />
      </main>
      {pantalla ? null : <SiteFooter />}
    </div>
  );
}
