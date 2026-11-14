import { ImageResponse } from "next/og";

import { listPublicStoriesWithStats } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";

export const runtime = "nodejs";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function HomeOpenGraphImage() {
  const stories = await listPublicStoriesWithStats();
  const totals = stories.reduce(
    (acc, story) => {
      acc.amount += story.amountRaised;
      acc.people += story.supporterCount;
      return acc;
    },
    { amount: 0, people: 0 },
  );

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg,#fff8fc,#ffffff,#fffaf4)",
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
            Historias verificadas
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <p style={{ fontSize: 56, lineHeight: 1.05, fontWeight: 800, margin: 0 }}>
            Échale la mano a quien hoy más lo necesita
          </p>
          <p style={{ margin: 0, fontSize: 30, color: "#374151", maxWidth: 980 }}>
            Metas solidarias gestionadas por organizaciones aliadas con pagos instantáneos CoDi
            vía Pey.
          </p>
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
            <span style={{ fontWeight: 800 }}>{formatCurrency(totals.amount)}</span>
            <span style={{ color: "#4B5563", fontSize: 28 }}>
              {totals.people} {totals.people === 1 ? "apoyo" : "apoyos"}
            </span>
          </div>
          <div style={{ fontSize: 28, color: "#6B7280" }}>
            {`${stories.length} ${stories.length === 1 ? "historia activa" : "historias activas"}`}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
