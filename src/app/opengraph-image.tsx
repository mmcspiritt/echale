import { ImageResponse } from "next/og";

import { loadOgFonts, loadOgJpeg } from "@/lib/og-assets";

export const runtime = "nodejs";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function HomeOpenGraphImage() {
  const fonts = await loadOgFonts();
  const imageSrc = await loadOgJpeg("/images/home-hero-3x2.webp");

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
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 46%" }}
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
          }}
        >
          <div style={{ display: "flex", fontFamily: "Fraunces", fontSize: 40, fontWeight: 700 }}>
            <span style={{ color: "#C8006A" }}>É</span>
            <span>chale</span>
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Fraunces",
              fontSize: 52,
              lineHeight: 1.05,
              fontWeight: 700,
            }}
          >
            Cuando alguien necesita una mano, se la echamos.
          </div>
          <div style={{ display: "flex", fontSize: 24, color: "#4A453F" }}>
            Historias reales. Apoyas con CoDi desde tu banco.
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
