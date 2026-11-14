"use client";

import { useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

import { Button } from "@/components/ui/button";

export function QrCardDownload({
  personName,
  slug,
}: {
  personName: string;
  slug: string;
}) {
  const [busy, setBusy] = useState(false);

  async function drawPosterCanvas() {
    const pageUrl = `${window.location.origin}/${slug}`;
    const qrDataUrl = await QRCode.toDataURL(pageUrl, {
      width: 500,
      margin: 1,
      color: { dark: "#121212", light: "#FFFFFF" },
    });
    const qrImage = await loadImage(qrDataUrl);

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1500;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo crear el canvas");

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#E4007C";
    ctx.fillRect(0, 0, canvas.width, 210);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "700 72px Inter, Arial, sans-serif";
    ctx.fillText("Échale", 70, 120);
    ctx.font = "500 44px Inter, Arial, sans-serif";
    ctx.fillText("Escanea para apoyar", 70, 185);

    ctx.fillStyle = "#111827";
    ctx.font = "700 58px Inter, Arial, sans-serif";
    ctx.fillText(personName, 70, 330);
    ctx.font = "400 34px Inter, Arial, sans-serif";
    ctx.fillStyle = "#4B5563";
    ctx.fillText("Historia gestionada por una organización aliada verificada", 70, 385);

    ctx.fillStyle = "#F8FAFC";
    roundRect(ctx, 70, 440, 940, 940, 46);
    ctx.fill();

    ctx.drawImage(qrImage, 200, 575, 680, 680);
    ctx.fillStyle = "#6B7280";
    ctx.font = "500 30px Inter, Arial, sans-serif";
    ctx.fillText(pageUrl.replace("https://", "").replace("http://", ""), 220, 1300);

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
      <Button variant="outline" size="sm" onClick={downloadPng} disabled={busy}>
        Descargar PNG
      </Button>
      <Button variant="outline" size="sm" onClick={downloadPdf} disabled={busy}>
        Descargar PDF
      </Button>
    </div>
  );
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

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}
