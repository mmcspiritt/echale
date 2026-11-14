"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import { LiveStatsStrip } from "@/components/home/live-stats-strip";
import { StoryCard } from "@/components/home/story-card";
import { HowItWorksSection } from "@/components/site/how-it-works-section";
import { categories } from "@/lib/categories";
import { StoryCategory, StoryWithStats } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function DiscoverView({ stories }: { stories: StoryWithStats[] }) {
  const [category, setCategory] = useState<StoryCategory | "all">("all");

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
    <section className="mx-auto w-full max-w-7xl px-4 pb-14 md:px-8">
      <div className="relative mt-6 overflow-hidden rounded-[34px] border border-zinc-200 bg-gradient-to-br from-[#fff8fc] via-white to-[#fffaf4] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:mt-8 md:p-10">
        <div className="grid items-center gap-7 md:grid-cols-[1.1fr_0.9fr]">
          <div className="relative space-y-5 md:pl-2">
            <p className="inline-flex rounded-full border border-[#f7c6df] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#E4007C]">
            Apoyo comunitario con CoDi
          </p>
            <h1 className="max-w-[16ch] text-balance text-[2.05rem] font-black leading-[1.03] tracking-[-0.03em] text-zinc-900 md:text-[3.45rem]">
            Échale la mano a quien hoy más lo necesita.
          </h1>
            <p className="max-w-[62ch] text-[1.03rem] leading-relaxed text-zinc-600 md:text-lg">
            Historias gestionadas por organizaciones aliadas verificadas. Tu apoyo llega rápido y
            con referencia directa por persona.
          </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="#historias"
                className="inline-flex h-11 items-center rounded-full border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50"
              >
                Apoyar una historia
              </Link>
              <Link
                href="/crear"
                className="inline-flex h-11 items-center rounded-full bg-[#E4007C] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(228,0,124,0.26)] transition hover:bg-[#c7006b]"
              >
                Crea tu página
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-sm md:max-w-[530px]">
              <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">Recaudado</p>
                <p className="text-base font-bold text-zinc-900">{formatCurrency(globalTotals.amount)}</p>
                <p className="text-[11px] text-zinc-400">(incluye ejemplos)</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                  {globalTotals.people === 1 ? "Donante" : "Donantes"}
                </p>
                <p className="text-base font-bold text-zinc-900">{globalTotals.people}</p>
                <p className="text-[11px] text-zinc-400">(incluye ejemplos)</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                  {stories.length === 1 ? "Historia" : "Historias"}
                </p>
                <p className="text-base font-bold text-zinc-900">{stories.length}</p>
                <p className="text-[11px] text-zinc-400">(incluye ejemplos)</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {stories.slice(0, 3).map((story, index) => (
              <div
                key={story.id}
                className={`relative overflow-hidden rounded-3xl border border-white/60 bg-zinc-100 shadow-sm ${
                  index === 0 ? "col-span-2 aspect-[16/9]" : "aspect-[4/5]"
                }`}
              >
                <Image
                  src={story.coverImage}
                  alt={`Foto de ${story.personName}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 30vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <LiveStatsStrip
        initialAmountRaised={globalTotals.amount}
        initialSupporters={globalTotals.people}
      />

      <div className="mt-6">
        <HowItWorksSection compact />
      </div>

      <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCategory("all")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              category === "all"
                ? "bg-[#E4007C] text-white"
                : "border border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            Todas
          </button>
          {categories.map((item) => (
            <button
              key={item.key}
              onClick={() => setCategory(item.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                category === item.key
                  ? "bg-[#E4007C] text-white"
                  : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {item.emoji} {item.label}
            </button>
          ))}
        </div>
      </div>

      {filteredStories.length === 0 ? (
        <div className="mt-7 rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
          <h3 className="text-xl font-semibold text-zinc-800">Aún no hay historias aquí</h3>
          <p className="mt-2 text-sm text-zinc-600">
            Prueba otro filtro o crea tu solicitud en{" "}
            <Link href="/crear" className="text-[#E4007C] hover:underline">
              Crea tu página
            </Link>
            .
          </p>
        </div>
      ) : (
        <motion.div id="historias" layout className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredStories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </motion.div>
      )}
    </section>
  );
}
