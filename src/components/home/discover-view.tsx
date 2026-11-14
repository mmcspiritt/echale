"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";

import { LiveStatsStrip } from "@/components/home/live-stats-strip";
import { StoryCard } from "@/components/home/story-card";
import { categories } from "@/lib/categories";
import { homeHeroBlur } from "@/lib/story-framing";
import { StoryCategory, StoryWithStats } from "@/lib/types";
import { formatCurrency, peopleHelpedLabel } from "@/lib/utils";

export function DiscoverView({ stories, realTotal }: { stories: StoryWithStats[]; realTotal: number }) {
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
          <h1 className="text-balance text-display text-ink">
            Cuando alguien necesita una mano, se la echamos.
          </h1>
          <p className="max-w-[65ch] text-body text-ink-2">
            Cada historia la revisa y gestiona una organización aliada. Apoyas con CoDi desde la app de tu banco y el dinero llega directo a la cuenta de la persona.
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
              Crea una página
            </Link>
          </div>
          <p className="text-small font-semibold tabular-nums text-ink">
            <span className="whitespace-nowrap">{formatCurrency(realTotal)} confirmado con CoDi en vivo</span>
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-small text-ink-2">
            <span className="whitespace-nowrap tabular-nums">{formatCurrency(globalTotals.amount)} reunidos</span>
            <span className="whitespace-nowrap tabular-nums">{peopleHelpedLabel(globalTotals.people)}</span>
            <span className="whitespace-nowrap tabular-nums">
              {stories.length} {stories.length === 1 ? "historia" : "historias"}
            </span>
          </p>
          <p className="text-micro text-ink-2">
            Pagos CoDi procesados por Pey · confirmación automática por webhook firmado
          </p>
        </div>

        <div className="order-1 lg:order-2 lg:col-span-6">
          <div className="relative -mx-4 aspect-[4/3] w-[calc(100%+2rem)] overflow-hidden rounded-none bg-[#efe8dc] sm:mx-0 sm:aspect-[3/2] sm:w-full sm:rounded-xl">
            <Image
              src="/images/home-hero-3x2.webp"
              alt="En la tiendita del barrio, una vecina muestra su celular en el mostrador"
              width={2400}
              height={1600}
              priority
              sizes="(max-width: 640px) 100vw, 50vw"
              placeholder="blur"
              blurDataURL={homeHeroBlur.wide}
              className="absolute left-0 top-1/2 !h-[128%] !w-auto !max-w-none -translate-y-1/2 sm:!h-[146%]"
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

      <p className="mt-8 text-small text-ink-2">
        ¿Cómo llega el dinero? Directo a la cuenta de la persona, por CoDi.{" "}
        <Link href="/como-funciona" className="font-semibold text-ink hover:text-rosa">
          Ver cómo funciona →
        </Link>
      </p>
    </section>
  );
}
