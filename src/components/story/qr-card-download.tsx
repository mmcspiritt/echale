"use client";

import { useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

import { Button } from "@/components/ui/button";

export function QrCardDownload({
  personName,
  slug,
  coverImage,
  posterLine,
  focus = "50% 45%",
  mode = "default",
}: {
  personName: string;
  slug: string;
  coverImage?: string;
  posterLine?: string;
  focus?: string;
  mode?: "default" | "text-link";
}) {
  const [busy, setBusy] = useState(false);

  async function drawPosterCanvas() {
    const pageUrl = getPageUrl(slug);
    if (!pageUrl) throw new Error("No se pudo construir el enlace de la historia");
    const qrDataUrl = await QRCode.toDataURL(pageUrl, {
      width: 500,
      margin: 1,
      color: { dark: "#1C1A17", light: "#FFFFFF" },
    });
    const qrImage = await loadImage(qrDataUrl);
    const posterImageSource =
      coverImage && coverImage.startsWith("/")
        ? `${window.location.origin}${coverImage}`
        : coverImage ?? `${window.location.origin}/images/lupita-oaxaca.jpg`;
    const posterImage = await loadImage(posterImageSource);

    await document.fonts.load("700 76px Fraunces");
    await document.fonts.load("500 34px Instrument Sans");

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo crear el canvas");

    drawCover(ctx, posterImage, 0, 0, 1080, 790, focus);
    ctx.fillStyle = "#F7F3EC";
    ctx.fillRect(0, 790, 1080, 560);

    ctx.fillStyle = "#1C1A17";
    ctx.font = "700 76px Fraunces, Georgia, serif";
    ctx.fillText(personName, 64, 880);

    ctx.fillStyle = "#4A453F";
    ctx.font = "500 34px Instrument Sans, Arial, sans-serif";
    const line = posterLine || "Échale la mano";
    wrapText(ctx, line, 64, 940, 536, 42, 2);

    const shortUrl = pageUrl.replace("https://", "").replace("http://", "");
    ctx.fillStyle = "#1C1A17";
    ctx.font = "500 28px Instrument Sans, Arial, sans-serif";
    ctx.fillText(shortUrl, 64, 1090);

    ctx.font = "700 44px Fraunces, Georgia, serif";
    ctx.fillStyle = "#C8006A";
    ctx.fillText("É", 64, 1270);
    const accentWidth = ctx.measureText("É").width;
    ctx.fillStyle = "#1C1A17";
    ctx.fillText("chale", 64 + accentWidth, 1270);

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(636, 850, 380, 380);
    ctx.drawImage(qrImage, 660, 874, 332, 332);

    ctx.fillStyle = "#4A453F";
    ctx.font = "500 24px Instrument Sans, Arial, sans-serif";
    const caption = "Escanea para ver la historia";
    const captionWidth = ctx.measureText(caption).width;
    ctx.fillText(caption, 636 + (380 - captionWidth) / 2, 1290);

    return canvas;
  }

  async function downloadPng() {
    setBusy(true);
    try {
      const canvas = await drawPosterCanvas();
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `echale-${slug}-qr.png`;
      link.click();
    } finally {
      setBusy(false);
    }
  }

  async function downloadPdf() {
    setBusy(true);
    try {
      const canvas = await drawPosterCanvas();
      const pngData = canvas.toDataURL("image/png");
      const bytes = await fetch(pngData).then((response) => response.arrayBuffer());

      const pdf = await PDFDocument.create();
      const page = pdf.addPage([595, 842]);
      const image = await pdf.embedPng(bytes);
      const helvetica = await pdf.embedFont(StandardFonts.Helvetica);

      const dimensions = image.scale(0.45);
      page.drawImage(image, {
        x: (595 - dimensions.width) / 2,
        y: 842 - dimensions.height - 70,
        width: dimensions.width,
        height: dimensions.height,
      });
      page.drawText("Imprime este póster o compártelo en tus redes", {
        x: 120,
        y: 40,
        size: 12,
        font: helvetica,
        color: rgb(0.4, 0.4, 0.45),
      });

      const pdfBytes = await pdf.save();
      const pdfBuffer = Uint8Array.from(pdfBytes).buffer;
      const blob = new Blob([pdfBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `echale-${slug}-qr.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {mode === "text-link" ? (
        <button
          type="button"
          onClick={downloadPng}
          disabled={busy}
          className="inline-flex min-h-11 items-center text-small font-semibold text-ink underline underline-offset-4 hover:text-rosa disabled:opacity-50"
        >
          Descargar cartel con QR
        </button>
      ) : (
        <>
          <Button variant="outline" size="sm" onClick={downloadPng} disabled={busy}>
            Descargar PNG
          </Button>
          <Button variant="outline" size="sm" onClick={downloadPdf} disabled={busy}>
            Descargar PDF
          </Button>
        </>
      )}
    </div>
  );
}

function getPageUrl(slug: string) {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/${slug}`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  focus: string,
) {
  const [fx, fy] = focus.split(" ").map((part) => {
    const value = Number.parseFloat(part);
    return Number.isFinite(value) ? value / 100 : 0.5;
  });
  const scale = Math.max(width / image.width, height / image.height);
  const drawnWidth = image.width * scale;
  const drawnHeight = image.height * scale;
  const offsetX = x + (width - drawnWidth) * fx;
  const offsetY = y + (height - drawnHeight) * fy;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  ctx.drawImage(image, offsetX, offsetY, drawnWidth, drawnHeight);
  ctx.restore();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  lines.slice(0, maxLines).forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}
