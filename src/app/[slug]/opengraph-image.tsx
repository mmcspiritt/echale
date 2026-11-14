import { ImageResponse } from "next/og";

import { loadOgFonts, loadOgJpeg } from "@/lib/og-assets";
import { framingForSlug } from "@/lib/story-framing";
import { getStoryBySlugWithStats } from "@/lib/store";
import { formatCurrency, getStoryWideImagePath, percentFromAmounts } from "@/lib/utils";

export const runtime = "nodejs";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const story = await getStoryBySlugWithStats(slug);
  const fonts = await loadOgFonts();

  if (!story || story.status !== "aprobada") {
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#F7F3EC",
            color: "#1C1A17",
            fontSize: 42,
            fontFamily: "Fraunces",
          }}
        >
          Échale
        </div>
      ),
      { ...size, fonts },
    );
  }

  const framing = framingForSlug(story.slug);
  const imageSrc = await loadOgJpeg(getStoryWideImagePath(story.coverImage));
  const percent = percentFromAmounts(story.amountRaised, story.goalAmount);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          background: "#F7F3EC",
          color: "#1C1A17",
          fontFamily: "Instrument Sans",
        }}
      >
        {imageSrc ? (
          <div style={{ width: "50%", height: "100%", display: "flex" }}>
            <img
              src={imageSrc}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: framing.coverFocus,
              }}
            />
          </div>
        ) : null}
        <div
          style={{
            width: imageSrc ? "50%" : "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 56,
            background: "#F7F3EC",
          }}
        >
          <div style={{ display: "flex", fontFamily: "Fraunces", fontSize: 40, fontWeight: 700 }}>
            <span style={{ color: "#C8006A" }}>É</span>
            <span>chale</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontFamily: "Fraunces",
                fontSize: 52,
                lineHeight: 1.05,
                fontWeight: 700,
              }}
            >
              {story.title}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", fontFamily: "Fraunces", fontSize: 44, fontWeight: 700 }}>
              {`${formatCurrency(story.amountRaised)} de ${formatCurrency(story.goalAmount)}`}
            </div>
            <div style={{ display: "flex", width: "100%", height: 10, background: "#E4DDD2" }}>
              <div style={{ display: "flex", width: `${percent}%`, height: 10, background: "#C8006A" }} />
            </div>
            <div style={{ display: "flex", fontSize: 22, color: "#4A453F" }}>
              {`Organización: ${story.organizationName}`}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
