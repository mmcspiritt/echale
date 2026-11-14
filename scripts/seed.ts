import {
  closeStoreConnections,
  createPayment,
  getStoryBySlug,
  listPaymentsWithStory,
  markPaymentAsPaid,
  nextReference,
  seedDemoStories,
} from "@/lib/store";

async function addPaidSupport(
  slug: string,
  amount: number,
  donorName: string,
  message: string,
  paidAt: string,
) {
  const story = await getStoryBySlug(slug);
  if (!story) return;

  const reference = await nextReference();
  const payment = await createPayment({
    storyId: story.id,
    reference,
    peyApiKeyEnv: story.peyKeyEnv,
    amount,
    donorName,
    message,
    phone: null,
    concept: `Apoyo para ${story.personName}`,
    method: "mock",
    providerChargeId: `seed-${reference}`,
    qrString: "{}",
    paymentLink: null,
  });

  await markPaymentAsPaid({
    paymentId: payment.id,
    providerTransactionId: `txn-seed-${reference}`,
    paidAt,
  });
}

async function run() {
  await seedDemoStories();
  const existing = await listPaymentsWithStory();
  if (existing.length > 0) {
    console.log("Seed ya aplicado. No se insertaron pagos de ejemplo.");
    await closeStoreConnections();
    return;
  }

  const now = Date.now();
  await addPaidSupport(
    "miriam",
    10000,
    "Ana Martínez",
    "Cuenta conmigo, Miriam.",
    new Date(now - 1000 * 60 * 60 * 6).toISOString(),
  );
  await addPaidSupport(
    "miriam",
    21000,
    "José y Fer",
    "Un abrazo grande para tu familia.",
    new Date(now - 1000 * 60 * 60 * 2).toISOString(),
  );
  await addPaidSupport(
    "santiago",
    22500,
    "Equipo de barrio",
    "Échale ganas, estamos contigo.",
    new Date(now - 1000 * 60 * 40).toISOString(),
  );
  await addPaidSupport(
    "adrian",
    720,
    "Majo",
    "Buen viaje de regreso, Adrian.",
    new Date(now - 1000 * 60 * 20).toISOString(),
  );

  console.log("Seed completado con historias y pagos de ejemplo.");
  await closeStoreConnections();
}

run().catch(async (error) => {
  console.error(error);
  await closeStoreConnections();
  process.exit(1);
});
