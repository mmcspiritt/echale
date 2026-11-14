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

  const recent = useMemo(() => (data?.recentPayments ?? []).slice(0, 5), [data]);
  const hasExamples = recent.some((item) => item.isExample);

  const numberBlock = (
    <div>
      <p className="text-small text-ink-2">Recibido hoy con CoDi</p>
      <p className="font-display text-[72px] leading-[0.95] text-ink md:text-[96px]">
        {formatCurrency(data?.totals.amountRaisedTodayReal ?? 0)}
      </p>
      <p className="mt-2 text-small text-ink-2">
        En toda la plataforma: {formatCurrency(data?.totals.amountRaisedPlatformTotal ?? 0)} (incluye ejemplos)
      </p>
    </div>
  );

  const qrBlock = (
    <div className="space-y-4">
        <div className="rounded-xl bg-white p-4 shadow-card sm:p-6">
        <div className="mx-auto grid aspect-square w-full max-w-[420px] place-items-center">
          {miriamQr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={miriamQr} alt="QR de Miriam Nava" className="h-full w-full" />
          ) : (
            <div className="grid h-full w-full place-items-center bg-[#efe8dc] text-small text-ink-2">Cargando QR...</div>
          )}
        </div>
        <p className="mt-3 break-all text-center text-small text-ink-2">
          Miriam Nava
          <br />
          echale.vercel.app/miriam
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Adrian Soto", url: adrianUrl, qr: adrianQr },
          { label: "Santiago Tena", url: santiagoUrl, qr: santiagoQr },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-white p-4 shadow-card">
            <div className="grid place-items-center">
              {item.qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.qr} alt={`QR de ${item.label}`} className="h-28 w-28" />
              ) : (
                <div className="grid h-28 w-28 place-items-center bg-[#efe8dc] text-micro text-ink-2">Cargando</div>
              )}
            </div>
            <p className="mt-2 break-all text-center text-small text-ink-2">
              {item.label}
              <br />
              {item.url.replace(/^https?:\/\//, "")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const feedBlock = (
    <div>
      <h2 className="text-h3 text-ink">Llegando ahora</h2>
      {recent.length === 0 ? (
        <p className="mt-3 border-y border-line py-3 text-small text-ink-2">Esperando pagos confirmados...</p>
      ) : (
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {recent.map((item) => {
            const verb = supportVerbForDisplayName(item.donorName);
            const keepLong = item.donorName.toLowerCase().includes("prueba en vivo");
            return (
              <li key={item.id} className="flex items-start justify-between gap-3 py-3 text-small leading-snug text-ink-2 lg:text-[20px]">
                <p className="min-w-0">
                  <span className="font-semibold text-ink">{item.donorName}</span> {verb}{" "}
                  {keepLong ? "la historia de " : "a "}
                  <span className="font-semibold text-ink">{item.beneficiaryFirstName}</span>
                  {" · "}
                  <span className="font-semibold tabular-nums text-ink">{formatCurrency(item.amount)}</span>
                  {item.isConfirmed ? (
                    <span className="mt-1 flex items-center gap-1 text-micro font-semibold uppercase tracking-[0.08em] text-jade">
                      <CircleDot className="h-3.5 w-3.5" />
                      Confirmado por CoDi
                    </span>
                  ) : null}
                </p>
                <span className="shrink-0 whitespace-nowrap text-small text-ink-2">{formatRelative(item.paidAt)}</span>
              </li>
            );
          })}
        </ul>
      )}
      {hasExamples ? (
        <p className="mt-3 text-micro text-ink-2/80">Los aportes sin sello son ejemplos del demo.</p>
      ) : null}
    </div>
  );

  const howBlock = (
    <div className="border-t border-line pt-6">
      <h2 className="text-h3 text-ink">Cómo está hecho</h2>
      <ul className="mt-3 space-y-2 text-small text-ink-2">
        <li>POST /codi/qr crea el cobro y regresa el qrString.</li>
        <li>El QR se dibuja en el navegador a partir de ese qrString.</li>
        <li>El webhook codi.qr.payment_received se verifica con Standard Webhooks y actualiza la meta.</li>
        <li>
          Código:{" "}
          <a href="https://github.com/mmcspiritt/echale" className="inline-flex min-h-11 items-center font-semibold text-ink hover:text-rosa" target="_blank" rel="noreferrer">
            github.com/mmcspiritt/echale
          </a>
        </li>
      </ul>
    </div>
  );

  return (
    <section className="relative mx-auto w-full max-w-[1280px] overflow-x-clip px-4 py-8 md:px-10 md:py-10">
      {toast ? (
        <div className="fixed right-4 top-6 z-50 rounded-md bg-jade px-4 py-2 text-small font-semibold text-white shadow-card">
          {toast}
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-2">
        <article className="order-2 space-y-8 lg:order-1">
          <div className="space-y-3">
            <p className="text-micro uppercase tracking-[0.08em] text-terracota">Demo en vivo</p>
            <h1 className="text-display text-pretty text-ink">Escanea y mira llegar el apoyo</h1>
            <p className="text-body text-ink-2">
              Abre la historia de Miriam con tu celular y apoya con CoDi desde tu banco.
            </p>
          </div>
          <div className="hidden lg:block">{numberBlock}</div>
          <div className="hidden lg:block">{howBlock}</div>
        </article>
        <article className="order-1 space-y-8 lg:order-2">{qrBlock}</article>
      </div>
      <div className="mt-8 space-y-8 lg:hidden">
        {numberBlock}
        {feedBlock}
        {howBlock}
      </div>
      <div className="mt-10 hidden lg:block">{feedBlock}</div>
    </section>
  );
}
