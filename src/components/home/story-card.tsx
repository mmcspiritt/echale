"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bookmark, Users } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { categoryLabelMap } from "@/lib/categories";
import { StoryWithStats } from "@/lib/types";
import { formatCurrency, percentFromAmounts } from "@/lib/utils";

export function StoryCard({ story }: { story: StoryWithStats }) {
  const percent = percentFromAmounts(story.amountRaised, story.goalAmount);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card className="overflow-hidden">
        <Link href={`/${story.slug}`} className="group block">
          <div className="relative h-52 w-full overflow-hidden">
            <Image
              src={story.coverImage}
              alt={story.title}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-zinc-700 shadow">
              {categoryLabelMap.get(story.category)}
            </div>
          </div>

          <div className="space-y-3 p-4 md:p-5">
            <h3 className="line-clamp-2 text-2xl font-semibold leading-tight text-zinc-900">
              {story.title}
            </h3>
            <p className="line-clamp-2 text-sm text-zinc-600">{story.summary}</p>

            <Progress value={percent} />

            <div className="flex items-center justify-between text-sm font-medium text-zinc-700">
              <span>{percent}%</span>
              <span>
                {formatCurrency(story.amountRaised)} de {formatCurrency(story.goalAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-zinc-100 pt-3 text-sm text-zinc-500">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4 text-[#E4007C]" />
                {story.supporterCount} donantes
              </span>
              <Bookmark className="h-4 w-4" />
            </div>
          </div>
        </Link>
      </Card>
    </motion.div>
  );
}
