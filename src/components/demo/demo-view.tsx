"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import confetti from "canvas-confetti";
import { CircleDot } from "lucide-react";
import useSWR from "swr";

import { formatCurrency, supportVerbForDisplayName } from "@/lib/utils";

interface StatsResponse {
  totals: {
    amountRaised: number;
    supporters: number;
    stories: number;
    amountRaisedTodayAll: number;
    amountRaisedTodayReal?: number;
    amountRaisedPlatformTotal?: number;
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
  if (!response.ok) throw new Error("No se pudo cargar la actividad en vivo");
  return (await response.json()) as StatsResponse;
};

function useQrData(url: string, size = 460) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  useEffect(() => {
    QRCode.toDataURL(url, {
      width: size,
      margin: 1,
      color: {
        dark: "#111827",
        light: "#FFFFFF",
      },
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(null));
  }, [size, url]);
  return dataUrl;
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

export function DemoView({ baseUrl }: { baseUrl: string }) {
  const { data } = useSWR<StatsResponse>("/api/stats", fetcher, {
    refreshInterval: 3000,
  });
  const [toast, setToast] = useState<string | null>(null);
  const lastSeenPaymentId = useRef<string | null>(null);

  useEffect(() => {
    const latest = data?.recentPayments?.[0];
    if (!latest) return;
    if (!lastSeenPaymentId.current) {
      lastSeenPaymentId.current = latest.id;
      return;
    }
    if (latest.id !== lastSeenPaymentId.current) {
      lastSeenPaymentId.current = latest.id;
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.3 },
        colors: ["#E4007C", "#F6D743", "#0F7B59"],
      });
      setToast("¡Pago confirmado por CoDi!");
      const timeout = setTimeout(() => setToast(null), 2600);
      return () => clearTimeout(timeout);
    }
  }, [data]);

  const miriamUrl = `${baseUrl}/miriam`;
  const adrianUrl = `${baseUrl}/adrian`;
  const santiagoUrl = `${baseUrl}/santiago`;
  const miriamQr = useQrData(miriamUrl, 420);
  const adrianQr = useQrData(adrianUrl, 180);
  const santiagoQr = useQrData(santiagoUrl, 180);

  const recent = useMemo(() => data?.recentPayments ?? [], [data]);

  return (
    <section className="relative rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm md:p-8">
      {toast ? (
        <div className="fixed right-4 top-20 z-50 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Demo para jurado
          </p>
          <h1 className="text-balance text-5xl font-black tracking-[-0.03em] text-zinc-900 md:text-6xl">
            Échale · Demo en vivo
          </h1>
          <p className="text-lg leading-relaxed text-zinc-600">
            Escanea para abrir la historia de Miriam y apoyar al instante con CoDi®.
          </p>

          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
            <p className="text-sm text-zinc-600">Recaudado hoy (solo CoDi confirmado)</p>
            <p className="text-5xl font-black tracking-[-0.03em] text-[#E4007C]">
              {formatCurrency(data?.totals.amountRaisedTodayReal ?? 0)}
            </p>
            <p className="mt-2 text-sm text-zinc-600">
              Total en la plataforma (incluye ejemplos):{" "}
              <span className="font-semibold text-zinc-900">
                {formatCurrency(data?.totals.amountRaisedPlatformTotal ?? 0)}
              </span>
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
            <h2 className="text-lg font-semibold text-zinc-900">Integración Pey (resumen técnico)</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600">
              <li>POST /codi/qr para crear cobro y obtener qrString.</li>
              <li>qrString se renderiza como QR en cliente para pago CoDi.</li>
              <li>Webhook codi.qr.payment_received verificado con Standard Webhooks.</li>
            </ul>
            <a
              href="https://github.com/mmcspiritt/echale"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex text-sm font-semibold text-[#E4007C] hover:underline"
            >
              Ver repo público en GitHub
            </a>
          </div>
        </article>

        <article className="space-y-4">
          <div className="rounded-3xl border border-zinc-200 p-4">
            <p className="mb-2 text-center text-sm font-medium text-zinc-600">Miriam · QR principal</p>
            <div className="grid place-items-center rounded-2xl bg-white p-3">
              {miriamQr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={miriamQr} alt="QR principal de Miriam" className="h-[320px] w-[320px] md:h-[390px] md:w-[390px]" />
              ) : (
                <div className="grid h-[320px] w-[320px] place-items-center rounded-2xl bg-zinc-100 text-sm text-zinc-500">
                  Cargando QR...
                </div>
              )}
            </div>
            <p className="mt-2 text-center text-xs text-zinc-500">{miriamUrl}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Adrian", url: adrianUrl, qr: adrianQr },
              { label: "Santiago", url: santiagoUrl, qr: santiagoQr },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-zinc-200 p-3">
                <p className="mb-1 text-center text-sm font-medium text-zinc-700">{item.label}</p>
                <div className="grid place-items-center">
                  {item.qr ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.qr} alt={`QR de ${item.label}`} className="h-[128px] w-[128px]" />
                  ) : (
                    <div className="grid h-[128px] w-[128px] place-items-center rounded-xl bg-zinc-100 text-xs text-zinc-500">
                      Cargando
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="mt-6 rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
        <h3 className="text-lg font-semibold text-zinc-900">Feed en vivo</h3>
        <div className="mt-3 space-y-2">
          {recent.length === 0 ? (
            <p className="rounded-2xl bg-white p-3 text-sm text-zinc-500">
              Esperando pagos confirmados...
            </p>
          ) : (
            recent.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl bg-white px-4 py-3 text-sm"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-4">
                  <p className="min-w-0 break-words text-zinc-700 md:flex-1">
                    {item.donorName} {supportVerbForDisplayName(item.donorName)} la historia de{" "}
                    <span className="font-semibold">{item.beneficiaryFirstName}</span> con{" "}
                    <span className="font-semibold text-zinc-900">{formatCurrency(item.amount)}</span>{" "}
                    <span className="whitespace-nowrap">· {formatRelative(item.paidAt)}</span>
                  </p>
                  {item.isConfirmed ? (
                    <p className="inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      <CircleDot className="h-3.5 w-3.5 animate-pulse" />
                      Confirmado por CoDi
                    </p>
                  ) : (
                    <p className="inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                      <CircleDot className="h-3.5 w-3.5" />
                      Aporte de ejemplo
                    </p>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
