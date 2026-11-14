"use client";

import Link from "next/link";

import { ArtDirectedImage } from "@/components/media/art-directed-image";
import { categoryLabelMap } from "@/lib/categories";
import { framingForSlug } from "@/lib/story-framing";
import { StoryWithStats } from "@/lib/types";
import { formatCurrency, getStoryWideImagePath, peopleHelpedLabel, percentFromAmounts } from "@/lib/utils";

export function StoryCard({ story }: { story: StoryWithStats }) {
  const percent = percentFromAmounts(story.amountRaised, story.goalAmount);
  const framing = framingForSlug(story.slug);
  const desktopCoverImage = getStoryWideImagePath(story.coverImage);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-card">
      <Link href={`/${story.slug}`} className="group flex h-full flex-col focus-visible:outline-none">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#efe8dc]">
          <ArtDirectedImage
            mobileSrc={story.coverImage}
            desktopSrc={desktopCoverImage}
            alt={story.title}
            mobileSizes="100vw"
            desktopSizes="(max-width: 1280px) 50vw, 33vw"
            mobileObjectPosition={framing.coverFocus}
            desktopObjectPosition={framing.coverFocus}
            mobileBlurDataURL={framing.blurDataURL}
            desktopBlurDataURL={framing.blurDataURL}
            className="transition duration-500 group-hover:scale-[1.03]"
          />
        </div>

        <div className="flex flex-1 flex-col p-5">
          <p className="mb-2 text-[13px] uppercase tracking-[0.08em] text-terracota">
            {categoryLabelMap.get(story.category)}
          </p>
          <h3 className="line-clamp-2 text-h3 text-ink">{story.title}</h3>
          <p className="mt-2 line-clamp-2 text-small leading-relaxed text-ink-2">{story.summary}</p>
          <p className="mt-2 text-small text-ink-2">{story.location}</p>

          <div className="mt-auto pt-4">
            <div className="h-1.5 overflow-hidden rounded-full bg-line">
              <div className="h-full bg-rosa" style={{ width: `${percent}%` }} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 text-small text-ink-2">
              <span className="tabular-nums text-ink">
                {formatCurrency(story.amountRaised)} de {formatCurrency(story.goalAmount)}
              </span>
              <span>{peopleHelpedLabel(story.supporterCount)}</span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
