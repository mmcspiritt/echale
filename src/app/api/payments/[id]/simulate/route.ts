import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { isPeyMockMode } from "@/lib/pey";
import { getPaymentById, getStoryById, markPaymentAsPaid } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isPeyMockMode()) {
    return NextResponse.json(
      { error: "La simulación solo está disponible en modo demo" },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  const payment = await getPaymentById(id);
  if (!payment) {
    return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
  }

  await markPaymentAsPaid({
    paymentId: payment.id,
    providerTransactionId: `mock-${Date.now()}`,
    paidAt: new Date().toISOString(),
  });

  const story = await getStoryById(payment.storyId);
  if (story) {
    revalidatePath(`/${story.slug}`);
  }
  revalidatePath("/");

  return NextResponse.json({ ok: true });
}
