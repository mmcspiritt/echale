"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import { StoryCard } from "@/components/home/story-card";
import { Button } from "@/components/ui/button";
import { categories } from "@/lib/categories";
import { StoryCategory, StoryWithStats } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function DiscoverView({ stories }: { stories: StoryWithStats[] }) {
  const [category, setCategory] = useState<StoryCategory | "all">("all");

  const filteredStories = useMemo(() => {
    if (category === "all") return stories;
    return stories.filter((story) => story.category === category);
  }, [category, stories]);

  const totals = useMemo(() => {
    return filteredStories.reduce(
      (acc, story) => {
        acc.amount += story.amountRaised;
        acc.people += story.supporterCount;
        return acc;
      },
      { amount: 0, people: 0 },
    );
  }, [filteredStories]);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-14 md:px-8">
      <div className="relative mt-6 overflow-hidden rounded-[36px] border border-[#ffd6ea] bg-gradient-to-br from-[#fff3f9] via-white to-[#fff8ef] p-7 md:mt-8 md:p-12">
        <span className="absolute -right-12 -top-10 h-56 w-56 rounded-full bg-[#f9bbdf]/50 blur-2xl" />
        <span className="absolute -bottom-16 left-1/4 h-56 w-56 rounded-full bg-[#ffd88b]/45 blur-2xl" />
        <div className="relative max-w-3xl space-y-4">
          <p className="inline-flex rounded-full bg-white/95 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#E4007C]">
            Apoyo comunitario con CoDi
          </p>
          <h1 className="text-balance text-4xl font-black leading-[1.04] text-zinc-900 md:text-6xl">
            Échale la mano a quien hoy más lo necesita.
          </h1>
          <p className="text-lg text-zinc-600">
            Historias gestionadas por organizaciones aliadas verificadas. Tu apoyo llega rápido y
            con referencia directa por persona.
          </p>
          <div className="inline-flex items-center rounded-full border border-[#a3dec8] bg-white px-4 py-2 text-sm font-medium text-[#0f7b59]">
            ⚡ Pagos instantáneos con CoDi, sin comisiones para quien dona.
          </div>
          <div className="pt-1">
            <Link
              href="/crear"
              className="inline-flex h-11 items-center rounded-full bg-[#E4007C] px-6 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(228,0,124,0.28)] transition hover:bg-[#c9006d]"
            >
              Crea tu página
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-zinc-100 bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCategory("all")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              category === "all"
                ? "bg-[#E4007C] text-white"
                : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
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
                  : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {item.emoji} {item.label}
            </button>
          ))}
          <div className="ml-auto hidden items-center gap-2 md:flex">
            <Button variant="outline" size="sm">
              Ver más
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-zinc-100 bg-white p-5 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-zinc-500">En esta vista</p>
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-sm text-zinc-600">
            <span className="text-xl font-semibold text-zinc-900">
              {formatCurrency(totals.amount)}
            </span>{" "}
            recaudados
          </p>
          <p className="text-sm text-zinc-600">
            <span className="text-xl font-semibold text-zinc-900">{totals.people}</span> personas
            ayudaron
          </p>
        </div>
      </div>

      {filteredStories.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
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
        <motion.div layout className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredStories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </motion.div>
      )}
    </section>
  );
}
