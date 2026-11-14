import { readFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const fontDirectory = path.join(process.cwd(), "public", "fonts");

export async function loadOgFonts() {
  const [fraunces, instrument] = await Promise.all([
    readFile(path.join(fontDirectory, "Fraunces-Bold.ttf")),
    readFile(path.join(fontDirectory, "InstrumentSans-Medium.ttf")),
  ]);

  return [
    { name: "Fraunces", data: fraunces, weight: 700 as const, style: "normal" as const },
    { name: "Instrument Sans", data: instrument, weight: 500 as const, style: "normal" as const },
  ];
}

export async function loadOgJpeg(publicPath: string, options?: { leftRatio?: number; widthRatio?: number }) {
  const relative = publicPath.replace(/^\//, "");
  if (!relative || relative.includes("..")) return null;
  try {
    const file = await readFile(path.join(process.cwd(), "public", relative));
    const meta = await sharp(file).rotate().metadata();
    const fullWidth = meta.width ?? 0;
    const fullHeight = meta.height ?? 0;
    const left = Math.max(0, Math.min(fullWidth - 1, Math.round(fullWidth * (options?.leftRatio ?? 0))));
    const width = Math.max(1, Math.min(fullWidth - left, Math.round(fullWidth * (options?.widthRatio ?? 1))));
    const jpeg = await sharp(file)
      .rotate()
      .extract({ left, top: 0, width, height: fullHeight })
      .jpeg({ quality: 82 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return null;
  }
}
