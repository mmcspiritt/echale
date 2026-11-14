import { ImageResponse } from "next/og";

import { loadOgFonts } from "@/lib/og-assets";
import { getPublicReceipt } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ReceiptOpenGraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [receipt, fonts] = await Promise.all([getPublicReceipt(id), loadOgFonts()]);
  const title = receipt
    ? `${formatCurrency(receipt.amount)} para ${receipt.personName}`
    : "Comprobante Échale";

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
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 760,
            border: "2px dashed #1C1A17",
            background: "#FFFFFF",
            padding: 48,
          }}
        >
          <div style={{ display: "flex", fontFamily: "Fraunces", fontSize: 42 }}>Échale</div>
          <div style={{ display: "flex", marginTop: 24, fontFamily: "Fraunces", fontSize: 72 }}>{title}</div>
          <div style={{ display: "flex", marginTop: 18, fontFamily: "Instrument Sans", fontSize: 28, color: "#1E6B55" }}>
            ✓ Confirmado por CoDi
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
