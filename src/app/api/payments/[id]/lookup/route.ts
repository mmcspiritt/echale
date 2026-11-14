import { NextResponse } from "next/server";

import { lookupPeyTransaction, resolvePeyApiKey } from "@/lib/pey";
import { getPaymentById } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const payment = await getPaymentById(id);
  if (!payment) {
    return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
  }

  if (!payment.providerTransactionId) {
    return NextResponse.json(
      { error: "Este pago aún no tiene transactionId confirmado" },
      { status: 400 },
    );
  }

  try {
    const credential = resolvePeyApiKey(payment.peyApiKeyEnv);
    const transaction = await lookupPeyTransaction(
      payment.providerTransactionId,
      credential.apiKey,
    );
    return NextResponse.json({ paymentId: payment.id, transaction });
  } catch (error) {
    return NextResponse.json(
      {
        error: "No se pudo consultar la transacción en Pey",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    );
  }
}
