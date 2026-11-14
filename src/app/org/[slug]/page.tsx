import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { orgBySlug, storyBelongsToOrg } from "@/lib/orgs";
import { listPublicStoriesWithStats, seedDemoStories } from "@/lib/store";
import { toPublicStory } from "@/lib/public-story";
import { formatCurrency } from "@/lib/utils";

interface OrgPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: OrgPageProps): Promise<Metadata> {
  const { slug } = await params;
  const org = orgBySlug(slug);
  if (!org) return { title: "Organización | Échale" };
  return {
    title: `${org.name} | Échale`,
    description: `${org.name} acompaña las historias que publica en Échale. Organización ilustrativa.`,
  };
}

export default async function OrgPage({ params }: OrgPageProps) {
  const { slug } = await params;
  const org = orgBySlug(slug);
  if (!org) notFound();
  await seedDemoStories();
  const stories = (await listPublicStoriesWithStats())
    .filter((story) => storyBelongsToOrg(story.organizationName, org))
    .map((story) => toPublicStory(story));

  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8">
        <p className="text-small font-semibold text-ink-2">Organización ilustrativa</p>
        <h1 className="mt-2 text-balance text-h2 text-ink">{org.name}</h1>
        <p className="mt-3 max-w-[62ch] text-body text-ink-2">
          {org.caseworker}, {org.role}. El nombre y las revisiones de abajo son un ejemplo. El pago con CoDi, cuando
          aparece, sí es real.
        </p>

        <section className="mt-8 space-y-3">
          <h2 className="text-h3 text-ink">Así revisa cada caso</h2>
          <ul className="space-y-2 text-small text-ink">
            {org.checks.map((check) => (
              <li key={check}>{check}</li>
            ))}
            <li>Cuenta CLABE registrada en Pey, cuando la historia ya tiene cuenta</li>
          </ul>
          <p className="text-small text-ink">La cuenta es de la persona, no de la organización.</p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-h3 text-ink">Casos</h2>
          {stories.length === 0 ? (
            <p className="text-small text-ink-2">Todavía no hay una historia publicada de esta organización.</p>
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {stories.map((story) => (
                <li key={story.slug} className="space-y-2 py-4">
                  <Link href={`/${story.slug}`} className="text-body font-semibold text-ink">
                    {story.personName}
                  </Link>
                  <p className="text-small text-ink-2">
                    {formatCurrency(story.amountRaised)} de {formatCurrency(story.goalAmount)}
                  </p>
                  <ul className="space-y-1 text-small text-ink">
                    {org.checks.map((check) => (
                      <li key={`${story.slug}-${check}`}>{check}</li>
                    ))}
                    <li>
                      {story.clabeRegistered
                        ? "Cuenta CLABE registrada en Pey ✓"
                        : "Cuenta CLABE pendiente de registro en Pey"}
                    </li>
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
