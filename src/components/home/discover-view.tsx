"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { LiveStatsStrip } from "@/components/home/live-stats-strip";
import { StoryCard } from "@/components/home/story-card";
import { ArtDirectedImage } from "@/components/media/art-directed-image";
import { HowItWorksSection } from "@/components/site/how-it-works-section";
import { categories } from "@/lib/categories";
import { homeHeroBlur } from "@/lib/story-framing";
import { StoryCategory, StoryWithStats } from "@/lib/types";
import { formatCurrency, peopleHelpedLabel } from "@/lib/utils";

export function DiscoverView({ stories }: { stories: StoryWithStats[] }) {
  const [category, setCategory] = useState<StoryCategory | "all">("all");

  const availableCategories = useMemo(
    () => categories.filter((item) => stories.some((story) => story.category === item.key)),
    [stories],
  );

  const filteredStories = useMemo(() => {
    if (category === "all") return stories;
    return stories.filter((story) => story.category === category);
  }, [category, stories]);

  const globalTotals = useMemo(() => {
    return stories.reduce(
      (acc, story) => {
        acc.amount += story.amountRaised;
        acc.people += story.supporterCount;
        return acc;
      },
      { amount: 0, people: 0 },
    );
  }, [stories]);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-16 md:px-8">
      <section className="mt-4 grid items-center gap-6 lg:mt-8 lg:grid-cols-12 lg:gap-10">
        <div className="order-2 space-y-4 lg:order-1 lg:col-span-6">
          <h1 className="text-pretty text-display text-ink lg:max-w-[13ch]">
            Cuando alguien necesita una mano, se&nbsp;la&nbsp;echamos.
          </h1>
          <p className="max-w-[65ch] text-body text-ink-2">
            Historias reales, revisadas por organizaciones aliadas. Apoyas con CoDi desde tu banco
            y el dinero llega directo a la persona.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="#historias"
              className="inline-flex min-h-12 items-center rounded-md bg-rosa px-5 text-small font-semibold text-white"
            >
              Ver historias
            </Link>
            <Link
              href="/crear"
              className="inline-flex min-h-11 items-center text-small font-semibold text-ink hover:text-rosa"
            >
              Crear una página →
            </Link>
          </div>
          <p className="text-small leading-relaxed text-ink-2">
            <span className="font-semibold tabular-nums text-ink">
              {formatCurrency(globalTotals.amount)}
            </span>{" "}
            reunidos ·{" "}
            <span className="font-semibold tabular-nums text-ink">{peopleHelpedLabel(globalTotals.people)}</span>{" "}
            ·{" "}
            <span className="font-semibold tabular-nums text-ink">{stories.length}</span>{" "}
            {stories.length === 1 ? "historia" : "historias"}
          </p>
          <p className="text-micro text-ink-2/80">Incluye aportes de ejemplo.</p>
        </div>

        <div className="order-1 lg:order-2 lg:col-span-6">
          <div className="relative aspect-[4/5] max-h-[28svh] overflow-hidden rounded-xl bg-[#efe8dc] sm:max-h-none sm:aspect-[3/2]">
            <ArtDirectedImage
              mobileSrc="/images/home-hero-4x5.webp"
              desktopSrc="/images/home-hero-3x2.webp"
              alt="En la tiendita del barrio, una vecina muestra su celular en el mostrador"
              priority
              mobileSizes="100vw"
              desktopSizes="50vw"
              mobileObjectPosition="center 42%"
              desktopObjectPosition="center 46%"
              mobileBlurDataURL={homeHeroBlur.portrait}
              desktopBlurDataURL={homeHeroBlur.wide}
            />
          </div>
        </div>
      </section>

      <section id="historias" className="mt-8">
        <h2 className="text-h2 text-ink">Historias que puedes apoyar hoy</h2>
        {availableCategories.length > 1 ? (
          <div className="mt-4 flex gap-5 overflow-x-auto border-b border-line pb-1 text-small [scrollbar-width:none]">
            <button
              onClick={() => setCategory("all")}
              className={`inline-flex min-h-11 shrink-0 items-center border-b-2 px-1 ${
                category === "all" ? "border-ink text-ink" : "border-transparent text-ink-2"
              }`}
            >
              Todas
            </button>
            {availableCategories.map((item) => (
              <button
                key={item.key}
                onClick={() => setCategory(item.key)}
                className={`inline-flex min-h-11 shrink-0 items-center border-b-2 px-1 ${
                  category === item.key ? "border-ink text-ink" : "border-transparent text-ink-2"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}

        {filteredStories.length === 0 ? (
          <div className="mt-6 border-y border-line py-10 text-center">
            <h3 className="text-h3 text-ink">Aún no hay historias aquí</h3>
            <p className="mx-auto mt-2 text-small text-ink-2">
              Prueba otro filtro o{" "}
              <Link href="/crear" className="font-semibold text-ink hover:text-rosa">
                crea tu página
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="mt-6 grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </section>

      <LiveStatsStrip
        initialAmountRaised={globalTotals.amount}
        initialSupporters={globalTotals.people}
      />

      <div className="mt-10">
        <HowItWorksSection compact />
      </div>
    </section>
  );
}
