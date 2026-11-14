import { NextResponse } from "next/server";

import {
  createCodiCharge,
  isPeyMockMode,
  resolvePeyApiKey,
  resolvePeyPlatformApiKey,
} from "@/lib/pey";
import { createPaymentSchema } from "@/lib/validation";
import { createPayment, getStoryBySlug, nextReference } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const parsed = createPaymentSchema.safeParse({
      slug: payload.slug,
      amount: Number(payload.amount),
      donorName: payload.donorName ?? null,
      message: payload.message ?? null,
      phone: payload.phone ?? null,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const story = await getStoryBySlug(parsed.data.slug);
    if (!story) {
      return NextResponse.json({ error: "Historia no encontrada" }, { status: 404 });
    }
    if (story.status !== "aprobada") {
      return NextResponse.json(
        { error: "Esta historia todavía está en revisión y no acepta apoyos" },
        { status: 403 },
      );
    }
    if (story.codiStatus !== "ACTIVE") {
      return NextResponse.json(
        {
          error:
            "La cuenta receptora sigue en verificación con Banxico (hasta 5 días hábiles).",
        },
        { status: 409 },
      );
    }

    const reference = await nextReference();
    const concept = `Apoyo para ${story.personName}`;
    const peyCredential = story.bankAccountId
      ? resolvePeyPlatformApiKey()
      : resolvePeyApiKey(story.peyKeyEnv);

    const charge = await createCodiCharge({
      amount: parsed.data.amount,
      concept,
      numRef: reference,
      expiration: Number(process.env.PEY_QR_EXPIRATION_SECONDS ?? "600"),
      phone: parsed.data.phone ?? null,
      apiKey: peyCredential.apiKey,
      bankAccountId: story.bankAccountId,
      metadata: {
        storyId: story.id,
        storySlug: story.slug,
      },
    });

    const payment = await createPayment({
      storyId: story.id,
      reference,
      peyApiKeyEnv: peyCredential.envName,
      amount: parsed.data.amount,
      donorName: parsed.data.donorName ?? null,
      message: parsed.data.message ?? null,
      phone: parsed.data.phone ?? null,
      concept,
      method: isPeyMockMode() ? "mock" : "codi_qr",
      providerChargeId: charge.id,
      qrString: charge.qrString,
      paymentLink: charge.paymentLink,
    });

    return NextResponse.json({
      paymentId: payment.id,
      codiQrId: charge.id,
      qrString: charge.qrString,
      paymentLink: charge.paymentLink,
      expiresInSeconds: Number(process.env.PEY_QR_EXPIRATION_SECONDS ?? "600"),
      mode: isPeyMockMode() ? "mock" : "live",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "No se pudo crear el cobro CoDi",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    );
  }
}
