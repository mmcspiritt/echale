import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import {
  parsePeyWebhookPayload,
  verifyPeyWebhookSignature,
} from "@/lib/pey";
import {
  getStoryByBankAccountId,
  getPaymentByProviderOrReference,
  getStoryById,
  markPaymentAsPaid,
  updateStoryBankAccountStatus,
} from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("webhook-signature");
  const signatureResult = verifyPeyWebhookSignature(rawBody, signature, {
    id: request.headers.get("webhook-id"),
    timestamp: request.headers.get("webhook-timestamp"),
  });

  if (!signatureResult.valid) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  let payload: ReturnType<typeof parsePeyWebhookPayload>;
  try {
    payload = parsePeyWebhookPayload(rawBody);
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  if (payload.type === "bank.account.updated") {
    if (typeof payload.bankAccountId !== "string" || payload.bankAccountId.length === 0) {
      return NextResponse.json({ ok: true, ignored: "bank.account.updated-without-bankAccountId" });
    }

    const story = await getStoryByBankAccountId(payload.bankAccountId);
    if (!story) {
      return NextResponse.json({ ok: true, ignored: "bank.account.updated-not-mapped" });
    }

    await updateStoryBankAccountStatus({
      storyId: story.id,
      bankAccountId: payload.bankAccountId,
      codiStatus:
        payload.codiStatus === "PENDING" ||
        payload.codiStatus === "PROCESSING" ||
        payload.codiStatus === "ACTIVE" ||
        payload.codiStatus === "ERROR"
          ? payload.codiStatus
          : "UNKNOWN",
      clabe: typeof payload.clabe === "string" ? payload.clabe : null,
      accountHolderName: typeof payload.name === "string" ? payload.name : null,
      peyTaxId: typeof payload.taxId === "string" ? payload.taxId : null,
    });

    revalidatePath(`/${story.slug}`);
    revalidatePath("/admin");
    revalidatePath("/");
    return NextResponse.json({
      ok: true,
      updatedStory: story.slug,
      matchedSecretEnv: signatureResult.matchedSecretEnv ?? null,
    });
  }

  if (payload.type !== "codi.qr.payment_received") {
    return NextResponse.json({ ok: true, ignored: payload.type ?? "unknown" });
  }

  if (typeof payload.codiQrId !== "string" || payload.codiQrId.length === 0) {
    return NextResponse.json({ error: "Webhook de pago sin codiQrId" }, { status: 400 });
  }

  const payment = await getPaymentByProviderOrReference({
    providerChargeId: payload.codiQrId ?? null,
    reference:
      payload.numRef !== null && payload.numRef !== undefined
        ? Number(payload.numRef)
        : null,
  });

  if (!payment) {
    return NextResponse.json(
      { error: "No se encontró el pago para ese codiQrId/numRef" },
      { status: 404 },
    );
  }

  if (payment.status === "paid") {
    return NextResponse.json({ ok: true, idempotent: true });
  }

  await markPaymentAsPaid({
    paymentId: payment.id,
    providerTransactionId:
      typeof payload.transactionId === "string" ? payload.transactionId : null,
    peyApiKeyId: typeof payload.apiKeyId === "string" ? payload.apiKeyId : null,
    paidAt: new Date(
      typeof payload.datePaid === "number" ? payload.datePaid * 1000 : Date.now(),
    ).toISOString(),
  });

  const story = await getStoryById(payment.storyId);
  if (story) {
    revalidatePath(`/${story.slug}`);
  }
  revalidatePath("/");

  return NextResponse.json({
    ok: true,
    apiKeyId: typeof payload.apiKeyId === "string" ? payload.apiKeyId : null,
    matchedSecretEnv: signatureResult.matchedSecretEnv ?? null,
  });
}
