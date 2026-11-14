import { NextResponse } from "next/server";

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

  return NextResponse.json({
    id: payment.id,
    status: payment.status,
    paidAt: payment.paidAt,
  });
}
