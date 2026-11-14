import { NextResponse } from "next/server";

import { listPaymentsWithStory, listPublicStoriesWithStats } from "@/lib/store";

export const runtime = "nodejs";

const mxDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Mexico_City",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function mxDateKey(date: Date) {
  return mxDateFormatter.format(date);
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function isRealConfirmedPayment(payment: {
  status: string;
  method: string;
  providerTransactionId: string | null;
  peyApiKeyId: string | null;
}) {
  if (payment.status !== "paid") return false;
  if (payment.method === "mock") return false;
  return Boolean(payment.providerTransactionId || payment.peyApiKeyId);
}

function firstName(fullName: string) {
  const trimmed = fullName.trim();
  if (!trimmed) return "persona";
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

export async function GET() {
  const stories = await listPublicStoriesWithStats();
  const totals = stories.reduce(
    (acc, story) => {
      acc.amountRaised += story.amountRaised;
      acc.supporters += story.supporterCount;
      return acc;
    },
    { amountRaised: 0, supporters: 0 },
  );

  const payments = await listPaymentsWithStory();
  const paidPayments = payments
    .filter((payment) => payment.status === "paid" && payment.paidAt)
    .sort((a, b) => (a.paidAt! < b.paidAt! ? 1 : -1));
  const paidRealConfirmed = paidPayments.filter((payment) =>
    isRealConfirmedPayment(payment),
  );

  const todayKey = mxDateKey(new Date());
  const amountRaisedTodayAll = paidPayments.reduce((acc, payment) => {
    const paidAt = payment.paidAt ? new Date(payment.paidAt) : null;
    if (!paidAt) return acc;
    return mxDateKey(paidAt) === todayKey ? acc + payment.amount : acc;
  }, 0);
  const amountRaisedTodayReal = paidRealConfirmed.reduce((acc, payment) => {
    const paidAt = payment.paidAt ? new Date(payment.paidAt) : null;
    if (!paidAt) return acc;
    return mxDateKey(paidAt) === todayKey ? acc + payment.amount : acc;
  }, 0);

  const recent = paidPayments.slice(0, 5).map((payment) => ({
    id: payment.id,
    storySlug: payment.storySlug,
    beneficiaryFirstName: firstName(payment.storyPersonName),
    amount: payment.amount,
    donorName: payment.donorName ?? "Alguien que prefiere anonimato",
    paidAt: payment.paidAt,
    isConfirmed: isRealConfirmedPayment(payment),
    isExample: !isRealConfirmedPayment(payment),
  }));

  return NextResponse.json({
    totals: {
      amountRaised: roundMoney(totals.amountRaised),
      supporters: totals.supporters,
      stories: stories.length,
      amountRaisedTodayAll: roundMoney(amountRaisedTodayAll),
      amountRaisedTodayReal: roundMoney(amountRaisedTodayReal),
      amountRaisedPlatformTotal: roundMoney(totals.amountRaised),
    },
    recentPayments: recent.map((item) => ({
      ...item,
      amount: roundMoney(item.amount),
    })),
  });
}
