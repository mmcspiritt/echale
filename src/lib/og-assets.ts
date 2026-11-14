import { readFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

export async function loadOgFonts() {
  const [fraunces, instrument] = await Promise.all([
    readFile(path.join(process.cwd(), "public/fonts/Fraunces-Bold.ttf")),
    readFile(path.join(process.cwd(), "public/fonts/InstrumentSans-Medium.ttf")),
  ]);

  return [
    { name: "Fraunces", data: fraunces, weight: 700 as const, style: "normal" as const },
    { name: "Instrument Sans", data: instrument, weight: 500 as const, style: "normal" as const },
  ];
}

export async function loadOgJpeg(publicPath: string) {
  const relative = publicPath.replace(/^\//, "");
  if (!relative || relative.includes("..")) return null;
  try {
    const file = await readFile(path.join(process.cwd(), "public", relative));
    const jpeg = await sharp(file).rotate().jpeg({ quality: 82 }).toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return null;
  }
}
