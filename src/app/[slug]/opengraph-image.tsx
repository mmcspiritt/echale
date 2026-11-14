import { ImageResponse } from "next/og";

import { getStoryBySlugWithStats } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";

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
            background: "white",
            color: "#111827",
            fontSize: 42,
          }}
        >
          Échale
        </div>
      ),
      size,
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg,#fff7fb,#ffffff,#fff8ef)",
          padding: "56px 64px",
          color: "#111827",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              color: "#E4007C",
              fontWeight: 900,
              fontSize: 64,
            }}
          >
            Échale
          </div>
          <div
            style={{
              borderRadius: 999,
              background: "white",
              border: "1px solid #fbcfe8",
              color: "#BE185D",
              padding: "10px 22px",
              fontSize: 24,
            }}
          >
            {story.location}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <p style={{ fontSize: 56, lineHeight: 1.05, fontWeight: 800, margin: 0 }}>{story.title}</p>
          <p style={{ margin: 0, fontSize: 30, color: "#374151", maxWidth: 950 }}>{story.summary}</p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              gap: 14,
              alignItems: "center",
              fontSize: 34,
              color: "#047857",
            }}
          >
            <span style={{ fontWeight: 800 }}>{formatCurrency(story.amountRaised)}</span>
            <span style={{ color: "#4B5563", fontSize: 28 }}>{`de ${formatCurrency(story.goalAmount)}`}</span>
          </div>
          <div style={{ fontSize: 28, color: "#6B7280" }}>{`Gestionado por ${story.organizationName}`}</div>
        </div>
      </div>
    ),
    size,
  );
}
