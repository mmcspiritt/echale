import { listPaymentsWithStory, listPublicStoriesWithStats } from "@/lib/store";

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
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "persona";
  const honorifics = new Set(["don", "doña", "dra", "dr"]);
  const given = parts.find((part) => !honorifics.has(part.toLowerCase().replace(/\./g, "")));
  return given ?? parts[0];
}

export interface PlatformStats {
  totals: {
    amountRaised: number;
    supporters: number;
    stories: number;
    amountRaisedTodayAll: number;
    amountRaisedTodayReal: number;
    amountRaisedPlatformTotal: number;
    amountRaisedRealTotal: number;
  };
  lastRealPayment: {
    paidAt: string;
    beneficiaryFirstName: string;
    amount: number;
  } | null;
  recentPayments: Array<{
    id: string;
    storySlug: string;
    beneficiaryFirstName: string;
    amount: number;
    donorName: string;
    paidAt: string | null;
    isConfirmed: boolean;
    isExample: boolean;
  }>;
}

export async function getPlatformStats(): Promise<PlatformStats> {
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
  const paidRealConfirmed = paidPayments.filter((payment) => isRealConfirmedPayment(payment));

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
  const amountRaisedRealTotal = paidRealConfirmed.reduce((acc, payment) => acc + payment.amount, 0);
  const latestReal = paidRealConfirmed[0] ?? null;

  const recent = paidPayments.slice(0, 5).map((payment) => ({
    id: payment.id,
    storySlug: payment.storySlug,
    beneficiaryFirstName: firstName(payment.storyPersonName),
    amount: roundMoney(payment.amount),
    donorName: payment.donorName ?? "Alguien que prefiere anonimato",
    paidAt: payment.paidAt,
    isConfirmed: isRealConfirmedPayment(payment),
    isExample: !isRealConfirmedPayment(payment),
  }));

  return {
    totals: {
      amountRaised: roundMoney(totals.amountRaised),
      supporters: totals.supporters,
      stories: stories.length,
      amountRaisedTodayAll: roundMoney(amountRaisedTodayAll),
      amountRaisedTodayReal: roundMoney(amountRaisedTodayReal),
      amountRaisedPlatformTotal: roundMoney(totals.amountRaised),
      amountRaisedRealTotal: roundMoney(amountRaisedRealTotal),
    },
    lastRealPayment: latestReal?.paidAt
      ? {
          paidAt: latestReal.paidAt,
          beneficiaryFirstName: firstName(latestReal.storyPersonName),
          amount: roundMoney(latestReal.amount),
        }
      : null,
    recentPayments: recent,
  };
}
