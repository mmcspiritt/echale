"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import confetti from "canvas-confetti";
import useSWR from "swr";

import { BankExplainer } from "@/components/demo/bank-explainer";
import { SupportModal } from "@/components/story/support-modal";
import { announceArrival, setBocinaEnabled } from "@/lib/arrival";
import type { PlatformStats } from "@/lib/platform-stats";
import { formatCurrency } from "@/lib/utils";

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("No se pudo cargar la actividad en vivo");
  return (await response.json()) as PlatformStats;
};

function useQrData(url: string, size = 460) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  useEffect(() => {
    QRCode.toDataURL(url, {
      width: size,
      margin: 1,
      color: { dark: "#1C1A17", light: "#FFFFFF" },
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(null));
  }, [size, url]);
  return dataUrl;
}

function formatRelative(input: string) {
  const paidAt = new Date(input).getTime();
  const diffSeconds = Math.max(1, Math.round((Date.now() - paidAt) / 1000));
  if (diffSeconds < 60) return "hace unos segundos";
  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return `hace ${diffMinutes} min`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `hace ${diffHours} h`;
  const diffDays = Math.round(diffHours / 24);
  return `hace ${diffDays} días`;
}

export function DemoView({
  baseUrl,
  initialStats,
  pantalla = false,
  canSimulate = false,
  miriamRaised = null,
}: {
  baseUrl: string;
  initialStats: PlatformStats;
  pantalla?: boolean;
  canSimulate?: boolean;
  miriamRaised?: number | null;
}) {
  const { data } = useSWR<PlatformStats>("/api/stats", fetcher, {
    refreshInterval: 3000,
    fallbackData: initialStats,
  });
  const [toast, setToast] = useState<string | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const [bocinaOn, setBocinaOn] = useState(false);
  const [arrivalCard, setArrivalCard] = useState<string | null>(null);
  const lastSeenRealId = useRef<string | null>(null);

  const latestReal = data?.recentPayments.find((item) => item.isConfirmed) ?? null;
  const latestRealId = latestReal?.id ?? null;
  const latestRealAmount = latestReal?.amount ?? 0;
  const latestRealName = latestReal?.beneficiaryFirstName ?? "";
  const latestRealDonor = latestReal?.donorName ?? "";

  useEffect(() => {
    if (!latestRealId) return;
    if (!lastSeenRealId.current) {
      lastSeenRealId.current = latestRealId;
      return;
    }
    if (latestRealId === lastSeenRealId.current) return;
    lastSeenRealId.current = latestRealId;
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.3 },
      colors: ["#E4007C", "#F6D743", "#0F7B59"],
    });
    setToast(`Alguien le echó la mano a ${latestRealName} con ${formatCurrency(latestRealAmount)}`);
    const pantallaName = latestRealName === "Miriam" ? "Doña Miriam" : latestRealName;
    setArrivalCard(
      `Llegó ${formatCurrency(latestRealAmount)} de ${latestRealDonor} · para ${pantallaName} ✓ Confirmado por CoDi`,
    );
    announceArrival(latestRealAmount, latestRealName);
    const timeout = setTimeout(() => {
      setToast(null);
      setArrivalCard(null);
    }, 4000);
    return () => clearTimeout(timeout);
  }, [latestRealAmount, latestRealDonor, latestRealId, latestRealName]);

  const miriamUrl = `${baseUrl}/miriam`;
  const adrianUrl = `${baseUrl}/adrian`;
  const santiagoUrl = `${baseUrl}/santiago`;
  const miriamQr = useQrData(miriamUrl, 420);
  const adrianQr = useQrData(adrianUrl, 180);
  const santiagoQr = useQrData(santiagoUrl, 180);

  const recent = useMemo(() => (data?.recentPayments ?? []).slice(0, 5), [data]);
  const hasExamples = recent.some((item) => item.isExample);
  const realTotal = data?.totals.amountRaisedRealTotal ?? 0;
  const todayReal = data?.totals.amountRaisedTodayReal ?? 0;
  const lastReal = data?.lastRealPayment ?? null;

  const numberBlock = (
    <div>
      <p className="text-small text-ink-2">Recibido con CoDi en vivo</p>
      <p className="font-display text-4xl leading-none text-ink">{formatCurrency(realTotal)}</p>
      {lastReal ? (
        <p className="mt-2 text-small text-ink-2">
          Último pago confirmado: {formatRelative(lastReal.paidAt)} · {lastReal.beneficiaryFirstName}
        </p>
      ) : null}
      {todayReal > 0 ? (
        <p className="mt-1 text-small text-ink-2">Hoy: {formatCurrency(todayReal)}</p>
      ) : null}
      <p className="mt-2 text-small text-ink-2">
        En toda la plataforma: {formatCurrency(data?.totals.amountRaisedPlatformTotal ?? 0)} (incluye ejemplos)
      </p>
    </div>
  );

  const smallStories = [
    { label: "Adrián", path: "/adrian", url: adrianUrl, qr: adrianQr },
    { label: "Santiago", path: "/santiago", url: santiagoUrl, qr: santiagoQr },
  ];

  const qrBlock = (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-4 shadow-card sm:p-6">
        <div className="mx-auto grid aspect-square w-full max-w-[420px] place-items-center">
          {miriamQr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={miriamQr} alt="QR para abrir la historia de Doña Miriam" className="h-full w-full" />
          ) : (
            <div className="grid h-full w-full place-items-center bg-[#efe8dc] text-small text-ink-2">Cargando QR...</div>
          )}
        </div>
        <p className="mt-3 text-center text-small text-ink-2">
          Doña Miriam
          <br />
          <span className="whitespace-nowrap">/miriam</span>
        </p>
        <button
          type="button"
          onClick={() => setSupportOpen(true)}
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-rosa px-4 text-small font-semibold text-white"
        >
          Apoyar a Doña Miriam con CoDi
        </button>
      </div>

      <div className="grid gap-2 md:hidden">
        {smallStories.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className="inline-flex min-h-11 items-center justify-between text-small font-semibold text-ink"
          >
            Abrir historia de {item.label} →
            <span className="whitespace-nowrap font-normal text-ink-2">{item.path}</span>
          </Link>
        ))}
      </div>

      <div className="hidden gap-3 md:grid md:grid-cols-2">
        {smallStories.map((item) => (
          <Link key={item.path} href={item.path} className="rounded-xl bg-white p-4 shadow-card">
            <div className="grid place-items-center">
              {item.qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.qr} alt="" className="h-28 w-28" />
              ) : (
                <div className="grid h-28 w-28 place-items-center bg-[#efe8dc] text-micro text-ink-2">Cargando</div>
              )}
            </div>
            <p className="mt-2 text-center text-small font-semibold text-ink">Abrir historia</p>
            <p className="text-center text-small text-ink-2">
              {item.label} <span className="whitespace-nowrap">{item.path}</span>
            </p>
          </Link>
        ))}
      </div>
    </div>
  );

  const feedBlock = (
    <div>
      <h2 className="text-h3 text-ink">Últimos apoyos</h2>
      {recent.length === 0 ? (
        <p className="mt-3 border-y border-line py-3 text-small text-ink-2">Esperando pagos confirmados...</p>
      ) : (
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {recent.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 py-3 text-small leading-snug text-ink-2">
              <p className="min-w-0">
                <span className="font-semibold text-ink">{item.donorName}</span> le echó la mano a{" "}
                <span className="font-semibold text-ink">{item.beneficiaryFirstName}</span> con{" "}
                <span className="font-semibold tabular-nums text-ink">{formatCurrency(item.amount)}</span>
                {item.isConfirmed ? (
                  <Link href={`/apoyo/${item.id}`} className="mt-1 block text-small font-semibold tracking-normal text-jade">
                    ✓ Confirmado por CoDi
                  </Link>
                ) : null}
              </p>
              <span className="shrink-0 whitespace-nowrap text-small text-ink-2">
                {item.paidAt ? formatRelative(item.paidAt) : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
      {hasExamples ? (
        <p className="mt-3 text-micro text-ink-2">Los aportes sin la marca verde de CoDi son de ejemplo.</p>
      ) : null}
    </div>
  );

  const howBlock = (
    <div className="border-t border-line pt-6">
      <h2 className="text-h3 text-ink">Cómo está hecho</h2>
      <p className="mt-3 font-mono text-small leading-relaxed text-ink-2">
        1 · POST /codi/qr (Pey) → 2 · Pagas en tu banco (CoDi / Banxico) → 3 · Webhook firmado → meta +$
      </p>
      <a
        href="https://github.com/mmcspiritt/echale"
        className="mt-3 inline-flex min-h-11 items-center rounded-md border border-line px-4 text-small font-semibold text-ink hover:text-rosa"
        target="_blank"
        rel="noreferrer"
      >
        Ver código
      </a>
    </div>
  );

  function simulateArrival() {
    setToast("Alguien le echó la mano a Miriam con $10");
    setArrivalCard("Llegó $10 de Diego · para Doña Miriam ✓ Confirmado por CoDi");
    announceArrival(10, "Doña Miriam");
    window.setTimeout(() => {
      setToast(null);
      setArrivalCard(null);
    }, 4000);
  }

  const bocinaButton = (
    <button
      type="button"
      className="inline-flex min-h-11 items-center text-small font-semibold text-ink"
      onClick={() => {
        const next = !bocinaOn;
        setBocinaOn(next);
        setBocinaEnabled(next);
      }}
    >
      {bocinaOn ? "Bocina activa" : "Activar bocina"}
    </button>
  );

  if (pantalla) {
    return (
      <section className="relative flex min-h-[100dvh] flex-col justify-between bg-paper px-6 py-8 text-ink">
        {arrivalCard ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-ink px-8 text-center text-paper">
            <p className="max-w-4xl font-display text-4xl leading-tight md:text-6xl">{arrivalCard}</p>
          </div>
        ) : null}
        <div>
          <p className="text-small text-ink-2">Recibido con CoDi en vivo</p>
          <p className="font-display text-[clamp(4.5rem,14vw,9rem)] leading-none">{formatCurrency(realTotal)}</p>
          {lastReal ? (
            <p className="mt-3 text-body text-ink-2">
              Último pago confirmado: {formatRelative(lastReal.paidAt)} · {lastReal.beneficiaryFirstName}
            </p>
          ) : null}
        </div>
        <div className="mx-auto w-full max-w-xl space-y-4">
          <button
            type="button"
            onClick={() => setSupportOpen(true)}
            className="inline-flex min-h-16 w-full items-center justify-center rounded-md bg-rosa px-6 text-body font-semibold text-white"
          >
            Apoyar a Doña Miriam con CoDi
          </button>
          <div className="flex flex-wrap items-center justify-between gap-3">
            {bocinaButton}
            {canSimulate ? (
              <button type="button" className="min-h-11 text-small font-semibold text-ink-2" onClick={simulateArrival}>
                Simular llegada (no es un pago)
              </button>
            ) : null}
          </div>
        </div>
        {supportOpen ? (
          <SupportModal
            slug="miriam"
            personName="Doña Miriam"
            storyTitle="Doña Miriam vuelve a tener un cuarto seguro"
            organizationName="Fundación Cuarto Firme A.C."
            initialAmount={10}
            raisedBefore={miriamRaised}
            onClose={() => setSupportOpen(false)}
            onPaid={() => setSupportOpen(false)}
          />
        ) : null}
      </section>
    );
  }

  return (
    <section className="relative mx-auto w-full max-w-[1280px] overflow-x-clip">
      {toast ? (
        <div className="fixed right-4 top-6 z-50 rounded-md bg-jade px-4 py-2 text-small font-semibold text-white shadow-card">
          {toast}
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-2">
        <article className="order-1 space-y-8">
          <div className="space-y-3">
            <h1 className="text-display text-balance text-ink">Escanea, paga desde tu banco y míralo llegar aquí</h1>
          </div>
          {numberBlock}
          <BankExplainer />
          <div className="hidden lg:block">{howBlock}</div>
        </article>
        <article className="order-2 space-y-8">{qrBlock}</article>
      </div>
      <div className="mt-8 space-y-8 lg:hidden">
        {feedBlock}
        {howBlock}
      </div>
      <div className="mt-10 hidden lg:block">{feedBlock}</div>
      <div className="mt-6 flex flex-wrap gap-4">
        {bocinaButton}
        {canSimulate ? (
          <button type="button" className="min-h-11 text-small font-semibold text-ink-2" onClick={simulateArrival}>
            Simular llegada (no es un pago)
          </button>
        ) : null}
      </div>
      {arrivalCard && !pantalla ? (
        <div className="pointer-events-none fixed inset-x-4 bottom-6 z-40 rounded-md bg-ink px-4 py-3 text-small font-semibold text-paper md:hidden">
          {arrivalCard}
        </div>
      ) : null}

      {supportOpen ? (
        <SupportModal
          slug="miriam"
          personName="Doña Miriam"
          storyTitle="Doña Miriam vuelve a tener un cuarto seguro"
          organizationName="Fundación Cuarto Firme A.C."
          initialAmount={10}
          raisedBefore={miriamRaised}
          onClose={() => setSupportOpen(false)}
          onPaid={() => setSupportOpen(false)}
        />
      ) : null}
    </section>
  );
}
