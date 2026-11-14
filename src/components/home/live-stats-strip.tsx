"use client";

import { useMemo } from "react";
import { CircleDot } from "lucide-react";
import useSWR from "swr";

import { formatCurrency, supportVerbForDisplayName } from "@/lib/utils";

interface StatsResponse {
  totals: {
    amountRaised: number;
    supporters: number;
    stories: number;
    amountRaisedTodayAll: number;
    amountRaisedTodayReal: number;
    amountRaisedPlatformTotal: number;
  };
  recentPayments: Array<{
    id: string;
    storySlug: string;
    beneficiaryFirstName: string;
    amount: number;
    donorName: string;
    paidAt: string;
    isConfirmed: boolean;
    isExample: boolean;
  }>;
}

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("No se pudo cargar actividad en vivo");
  return (await response.json()) as StatsResponse;
};

function formatRelative(input: string) {
  const now = Date.now();
  const paidAt = new Date(input).getTime();
  const diffSeconds = Math.max(1, Math.round((now - paidAt) / 1000));
  if (diffSeconds < 60) return "hace unos segundos";
  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return `hace ${diffMinutes} min`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `hace ${diffHours} h`;
  const diffDays = Math.round(diffHours / 24);
  return `hace ${diffDays} días`;
}

export function LiveStatsStrip({
  initialAmountRaised,
  initialSupporters,
}: {
  // Kept for API compatibility with home page props.
  initialAmountRaised: number;
  initialSupporters: number;
}) {
  const { data } = useSWR<StatsResponse>("/api/stats", fetcher, {
    refreshInterval: 5000,
    fallbackData: {
      totals: {
        amountRaised: initialAmountRaised,
        supporters: initialSupporters,
        stories: 0,
        amountRaisedTodayAll: 0,
        amountRaisedTodayReal: 0,
        amountRaisedPlatformTotal: initialAmountRaised,
      },
      recentPayments: [],
    },
  });

  const feedItems = useMemo(() => data?.recentPayments ?? [], [data]);
  const hasExamples = feedItems.some((item) => item.isExample);

  return (
    <section className="mt-12">
      <h2 className="text-h2 text-ink">Apoyos recientes</h2>
      {feedItems.length === 0 ? (
        <p className="mt-4 border-y border-line py-4 text-small text-ink-2">
          Aún no hay apoyos por aquí.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {feedItems.map((item) => {
            const verb = supportVerbForDisplayName(item.donorName);
            const keepLong =
              item.donorName.toLowerCase().includes("prueba en vivo");
            return (
              <li key={item.id} className="flex items-start justify-between gap-3 py-3.5">
                <p className="min-w-0 text-small leading-relaxed text-ink-2">
                  <span className="font-semibold text-ink">{item.donorName}</span> {verb}{" "}
                  {keepLong ? "la historia de " : "a "}
                  <span className="font-semibold text-ink">{item.beneficiaryFirstName}</span>
                  {" · "}
                  <span className="font-semibold tabular-nums text-ink">
                    {formatCurrency(item.amount)}
                  </span>
                  {item.isConfirmed ? (
                    <span className="mt-1 flex items-center gap-1 text-micro font-semibold uppercase tracking-[0.08em] text-jade">
                      <CircleDot className="h-3.5 w-3.5" />
                      Confirmado por CoDi
                    </span>
                  ) : null}
                </p>
                <span className="shrink-0 whitespace-nowrap text-small text-ink-2">
                  {formatRelative(item.paidAt)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {hasExamples ? (
        <p className="mt-3 text-micro text-ink-2/80">Los aportes sin sello son ejemplos del demo.</p>
      ) : null}
    </section>
  );
}
