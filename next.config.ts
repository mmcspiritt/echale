import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/[slug]/opengraph-image": ["./public/fonts/**"],
    "/[slug]/opengraph-image/route": ["./public/fonts/**"],
    "/opengraph-image": ["./public/fonts/**"],
    "/opengraph-image/route": ["./public/fonts/**"],
    "/apoyo/[id]/opengraph-image": ["./public/fonts/**"],
    "/apoyo/[id]/opengraph-image/route": ["./public/fonts/**"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
    ],
  },
};

export default nextConfig;
