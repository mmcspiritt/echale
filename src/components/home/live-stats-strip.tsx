"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleDot } from "lucide-react";
import useSWR from "swr";

import { formatCurrency, supportVerbForDisplayName } from "@/lib/utils";

interface StatsResponse {
  totals: {
    amountRaised: number;
    supporters: number;
    stories: number;
    amountRaisedTodayAll: number;
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

function useCountUp(target: number, durationMs = 600) {
  const [value, setValue] = useState(target);
  useEffect(() => {
    const startValue = value;
    const startTime = performance.now();
    let frame: number | null = null;

    const tick = (time: number) => {
      const progress = Math.min(1, (time - startTime) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(startValue + (target - startValue) * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => {
      if (frame) cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return value;
}

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
      },
      recentPayments: [],
    },
  });

  const amountRaised = data?.totals.amountRaised ?? initialAmountRaised;
  const supporters = data?.totals.supporters ?? initialSupporters;
  const animatedAmount = useCountUp(amountRaised);
  const animatedSupporters = useCountUp(supporters, 500);
  const feedItems = useMemo(() => data?.recentPayments ?? [], [data]);

  return (
    <section className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">En vivo</p>
          <h2 className="text-2xl font-black tracking-[-0.02em] text-zinc-900">Actividad en vivo</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Los pagos reales llevan el sello Confirmado por CoDi
          </p>
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2">
            <p className="text-zinc-500">Total recaudado</p>
            <p className="text-lg font-bold text-zinc-900">{formatCurrency(animatedAmount)}</p>
            <p className="text-xs text-zinc-400">(incluye ejemplos)</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2">
            <p className="text-zinc-500">
              {Math.round(animatedSupporters) === 1 ? "Persona que ayudó" : "Personas que ayudaron"}
            </p>
            <p className="text-lg font-bold text-zinc-900">{Math.round(animatedSupporters)}</p>
            <p className="text-xs text-zinc-400">(incluye ejemplos)</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {feedItems.length === 0 ? (
          <p className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3 text-sm text-zinc-500">
            Aún no hay pagos confirmados en el feed en vivo.
          </p>
        ) : (
          feedItems.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-zinc-100 px-4 py-3 text-sm"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-4">
                <p className="min-w-0 break-words text-zinc-700 md:flex-1">
                  <span className="font-semibold">{item.donorName}</span>{" "}
                  {supportVerbForDisplayName(item.donorName)} la historia de{" "}
                  <span className="font-semibold">{item.beneficiaryFirstName}</span> con{" "}
                  <span className="font-semibold text-zinc-900">{formatCurrency(item.amount)}</span>{" "}
                  <span className="whitespace-nowrap">· {formatRelative(item.paidAt)}</span>
                </p>
                {item.isConfirmed ? (
                  <p className="inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    <CircleDot className="h-3.5 w-3.5 animate-pulse" />
                    Confirmado por CoDi
                  </p>
                ) : (
                  <p className="inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                    <CircleDot className="h-3.5 w-3.5" />
                    Aporte de ejemplo
                  </p>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
