"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { MapPin, Users } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { categoryLabelMap } from "@/lib/categories";
import { StoryWithStats } from "@/lib/types";
import { formatCurrency, percentFromAmounts } from "@/lib/utils";

export function StoryCard({ story }: { story: StoryWithStats }) {
  const percent = percentFromAmounts(story.amountRaised, story.goalAmount);
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      layout
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={reducedMotion ? undefined : { duration: 0.32, ease: "easeOut" }}
    >
      <Card className="overflow-hidden border-zinc-200/90 shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(15,23,42,0.1)]">
        <Link href={`/${story.slug}`} className="group block focus-visible:outline-none">
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <Image
              src={story.coverImage}
              alt={story.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute left-3 top-3 rounded-full border border-white/80 bg-white/95 px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm">
              {categoryLabelMap.get(story.category)}
            </div>
          </div>

          <div className="space-y-3 p-5">
            <h3 className="line-clamp-2 text-[1.42rem] font-semibold leading-tight tracking-[-0.02em] text-zinc-900">
              {story.title}
            </h3>
            <p className="line-clamp-2 text-base leading-relaxed text-zinc-600">{story.summary}</p>
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500">
              <MapPin className="h-4 w-4 text-zinc-400" />
              {story.location}
            </p>

            <Progress value={percent} className="h-2.5" />

            <div className="flex items-center justify-between text-sm font-medium text-zinc-700">
              <span className="text-zinc-500">{percent}%</span>
              <span className="text-zinc-900">
                {formatCurrency(story.amountRaised)} de {formatCurrency(story.goalAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-zinc-100 pt-3 text-sm text-zinc-500">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4 text-[#E4007C]" />
                {story.supporterCount} {story.supporterCount === 1 ? "donante" : "donantes"}
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                /{story.slug}
              </span>
            </div>
          </div>
        </Link>
      </Card>
    </motion.div>
  );
}
