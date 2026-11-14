"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, MapPin, Share2 } from "lucide-react";
import useSWR from "swr";

import { PaymentTrace } from "@/components/story/payment-trace";
import { QrCardDownload } from "@/components/story/qr-card-download";
import { SupportModal } from "@/components/story/support-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { announceArrival, setBocinaEnabled } from "@/lib/arrival";
import { orgForName } from "@/lib/orgs";
import { framingForSlug } from "@/lib/story-framing";
import { StoryLiveData } from "@/lib/types";
import { displayDomainFromUrl } from "@/lib/site-url";
import {
  formatCurrency,
  peopleHelpedLabel,
  percentFromAmounts,
} from "@/lib/utils";

function formatShortDay(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    timeZone: "America/Mexico_City",
  })
    .format(new Date(value))
    .replace(".", "");
}

const supportPresets: Record<string, { amount: number; label: string }[]> = {
  adrian: [
    { amount: 70, label: "Comida para el camino" },
    { amount: 180, label: "Completa su boleto" },
  ],
  santiago: [{ amount: 800, label: "Una sesión de rehabilitación" }],
  miriam: [{ amount: 350, label: "Una lámina para el techo" }],
};

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("No se pudo refrescar la historia");
  return (await response.json()) as StoryLiveData;
};

export function StoryExperience({
  initialData,
  previewToken,
  publicBaseUrl,
  canSimulate = false,
  goalPreview = false,
}: {
  initialData: StoryLiveData;
  previewToken?: string | null;
  publicBaseUrl: string;
  canSimulate?: boolean;
  goalPreview?: boolean;
}) {
  const { data, mutate } = useSWR<StoryLiveData>(
    `/api/stories/${initialData.story.slug}/live${
      previewToken ? `?preview=${encodeURIComponent(previewToken)}` : ""
    }`,
    fetcher,
    {
      fallbackData: initialData,
      refreshInterval: 3000,
      revalidateOnFocus: true,
    },
  );

  const [galleryIndex, setGalleryIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const presets = supportPresets[initialData.story.slug] ?? [
    { amount: 50, label: "" },
    { amount: 100, label: "" },
    { amount: 200, label: "" },
    { amount: 500, label: "" },
  ];
  const [selectedAmount, setSelectedAmount] = useState(
    presets.find((item) => item.amount === 180)?.amount ?? presets[0]?.amount ?? 100,
  );
  const [showSticky, setShowSticky] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [bocinaOn, setBocinaOn] = useState(false);
  const [simulatedId, setSimulatedId] = useState<string | null>(null);
  const seenRealId = useRef<string | null>(null);
  const amountAnchorRef = useRef<HTMLDivElement>(null);

  const storyData = data ?? initialData;
  const story = storyData.story;
  const percent = percentFromAmounts(story.amountRaised, story.goalAmount);
  const isPreview = story.status !== "aprobada";
  const codiPending = story.status === "aprobada" && story.codiStatus !== "ACTIVE";
  const goalMet = story.amountRaised >= story.goalAmount;
  const showFulfilled = goalMet || goalPreview;
  const canReceiveSupport = story.status === "aprobada" && story.codiStatus === "ACTIVE" && !showFulfilled;
  const org = orgForName(story.organizationName);
  const showExampleBadge = story.showExampleBadge;
  const displayDomain = displayDomainFromUrl(publicBaseUrl);
  const fullUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${story.slug}`
      : `${publicBaseUrl}/${story.slug}`;
  const goodNewsHref = `https://wa.me/?text=${encodeURIComponent(`La meta de ${story.personName} ya se cumplió. ${fullUrl}`)}`;

  const milestoneItems = useMemo(() => {
    return story.milestones
      .slice()
      .sort((a, b) => a.targetAmount - b.targetAmount)
      .map((milestone) => ({
        ...milestone,
        completed: story.amountRaised >= milestone.targetAmount,
      }));
  }, [story.amountRaised, story.milestones]);

  const galleryImages = useMemo(() => {
    const unique = Array.from(
      new Set([story.coverImage, ...story.galleryImages].filter((item): item is string => Boolean(item))),
    );
    return unique.length > 0 ? unique : [story.coverImage];
  }, [story.coverImage, story.galleryImages]);

  const lastUpdatedLabel = useMemo(() => {
    const latestSupport = storyData.supporters[0]?.paidAt;
    const latest = latestSupport ?? story.updatedAt;
    const latestDate = new Date(latest);
    const diffSeconds = Math.max(1, Math.round((Date.now() - latestDate.getTime()) / 1000));
    if (diffSeconds < 60) return "hace unos segundos";
    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) return `hace ${diffMinutes} min`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `hace ${diffHours} h`;
    const diffDays = Math.round(diffHours / 24);
    return `hace ${diffDays} días`;
  }, [story.updatedAt, storyData.supporters]);

  async function copyLink() {
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  async function shareNative() {
    if (navigator.share) {
      await navigator.share({
        title: story.title,
        text: `Échale la mano a ${story.personName} en Échale`,
        url: fullUrl,
      });
      return;
    }
    await copyLink();
  }

  useEffect(() => {
    const node = amountAnchorRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      setShowSticky(!entry.isIntersecting);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const framing = framingForSlug(story.slug);
  const mobileFocus = "mobileCoverFocus" in framing ? framing.mobileCoverFocus : framing.coverFocus;
  const remaining = Math.max(0, story.goalAmount - story.amountRaised);
  const hasExampleSupport = storyData.supporters.some((supporter) => !supporter.isRealConfirmed);
  const latestReal = storyData.supporters.find((supporter) => supporter.isRealConfirmed) ?? null;
  const personLabel = story.personName.replace(/^(doña|don)\s+/i, "");

  const latestRealId = latestReal?.id ?? null;
  const latestRealAmount = latestReal?.amount ?? 0;

  useEffect(() => {
    if (!latestRealId) return;
    if (seenRealId.current === null) {
      seenRealId.current = latestRealId;
      return;
    }
    if (latestRealId === seenRealId.current) return;
    seenRealId.current = latestRealId;
    setToast(`Alguien le echó la mano a ${personLabel} con ${formatCurrency(latestRealAmount)}`);
    announceArrival(latestRealAmount, story.personName);
    const timeout = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [latestRealAmount, latestRealId, personLabel, story.personName]);

  const amountBlock = (
    <div className="space-y-2">
      <p className="font-display text-5xl leading-none text-ink">{formatCurrency(story.amountRaised)}</p>
      <p className="text-small text-ink-2">
        reunidos de {formatCurrency(story.goalAmount)} · {percent}%
      </p>
      <p className="text-small text-ink-2">{peopleHelpedLabel(story.supporterCount)}</p>
      <Progress value={showFulfilled ? 100 : percent} className="h-1.5" />
      {showFulfilled ? <p className="text-small font-semibold text-ink">¡Meta cumplida!</p> : null}
    </div>
  );

  const selectedPreset = presets.find((item) => item.amount === selectedAmount);
  const supportLabel = selectedPreset?.label
    ? `Apoyar con ${formatCurrency(selectedAmount)} · ${selectedPreset.label.charAt(0).toLowerCase()}${selectedPreset.label.slice(1)}`
    : `Apoyar con ${formatCurrency(selectedAmount)}`;

  const amountChoices = (
    <div className="grid gap-2">
      {presets.map((option) => (
        <button
          key={option.amount}
          onClick={() => setSelectedAmount(option.amount)}
          className={`min-h-11 rounded-md border px-3 text-left text-small transition ${
            selectedAmount === option.amount
              ? "border-ink bg-ink text-white"
              : "border-line bg-white text-ink-2"
          }`}
        >
          {formatCurrency(option.amount)}
          {option.label ? ` · ${option.label}` : ""}
        </button>
      ))}
    </div>
  );

  const trustList = (
    <div className="space-y-1 border-t border-line pt-4 text-small text-ink-2">
      <p className="text-ink">Gestionado por · {story.organizationName}</p>
      <p>Revisó identidad y meta el 12 nov · acompaña a la persona</p>
      <p>CLABE {story.clabeMasked}</p>
      {org ? (
        <Link href={`/org/${org.slug}`} className="inline-flex min-h-11 items-center font-semibold text-ink">
          Ver a {org.name}
        </Link>
      ) : null}
    </div>
  );

  return (
    <>
      <section className="mx-auto w-full max-w-7xl px-4 pb-4 pt-4 md:px-8 lg:pb-16 lg:pt-6">
        {isPreview ? (
          <Card className="mb-4 border-amber-200 bg-amber-50 p-4 text-small text-amber-900">
            Esta historia está en revisión por la organización aliada. Solo tú y el equipo pueden
            verla con este enlace de preview.
          </Card>
        ) : null}
        {goalPreview ? (
          <Card className="mb-4 border-amber-200 bg-amber-50 p-4 text-small text-amber-900">
            Vista previa de la meta cumplida. Los pesos reunidos de abajo siguen siendo los reales.
          </Card>
        ) : null}
        {codiPending ? (
          <Card className="mb-4 border-sky-200 bg-sky-50 p-4 text-small text-sky-900">
            Cuenta en verificación con Banxico (hasta 5 días hábiles). El botón de apoyo se
            habilita automáticamente en cuanto quede activa.
          </Card>
        ) : null}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <article className="space-y-5">
            <div className="relative -mx-4 md:hidden">
              <div
                className="flex snap-x snap-mandatory overflow-x-auto"
                onScroll={(event) => {
                  const el = event.currentTarget;
                  const width = el.clientWidth || 1;
                  const index = Math.round(el.scrollLeft / width);
                  setGalleryIndex(Math.min(galleryImages.length - 1, Math.max(0, index)));
                }}
              >
                {galleryImages.map((image, index) => (
                  <div key={`${image}-${index}`} className="relative aspect-[4/3] w-full shrink-0 snap-center overflow-hidden bg-[#efe8dc]">
                    <Image
                      src={image}
                      alt={`Foto ${index + 1} de ${story.personName}`}
                      fill
                      priority={index === 0}
                      placeholder="blur"
                      blurDataURL={framing.blurDataURL}
                      sizes="100vw"
                      className="object-cover"
                      style={{ objectPosition: index === 0 ? mobileFocus : "50% 45%" }}
                    />
                  </div>
                ))}
              </div>
              <p className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-paper/90 px-2.5 py-1 text-small tabular-nums text-ink">
                {galleryIndex + 1}/{galleryImages.length}
              </p>
            </div>
            <div className="hidden h-[460px] grid-cols-[2fr_1fr] gap-2 overflow-hidden rounded-2xl md:grid">
              <div className="relative h-full overflow-hidden bg-[#efe8dc]">
                <Image
                  src={galleryImages[0]}
                  alt={`Foto principal de ${story.personName}`}
                  fill
                  priority
                  placeholder="blur"
                  blurDataURL={framing.blurDataURL}
                  sizes="50vw"
                  className="object-cover"
                  style={{ objectPosition: framing.coverFocus }}
                />
              </div>
              <div className={`grid h-full gap-2 ${galleryImages.length > 2 ? "grid-rows-2" : "grid-rows-1"}`}>
                {galleryImages.slice(1, 3).map((image, index) => (
                  <div key={`${image}-${index}`} className="relative h-full overflow-hidden bg-[#efe8dc]">
                    <Image
                      src={image}
                      alt={`Foto ${index + 2} de ${story.personName}`}
                      fill
                      placeholder="blur"
                      blurDataURL={framing.blurDataURL}
                      sizes="25vw"
                      className="object-cover"
                      style={{ objectPosition: "50% 45%" }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <section className="space-y-3">
              <p className="inline-flex items-center gap-2 text-small text-ink-2">
                <MapPin className="h-4 w-4" /> {story.location}
              </p>
              <h1 className="text-balance text-h2 text-ink">{story.title}</h1>
              <div ref={amountAnchorRef} className="space-y-4 border-y border-line py-5 lg:hidden">
                {amountBlock}
                {showFulfilled ? null : amountChoices}
                {showFulfilled ? null : canReceiveSupport ? (
                  <Button size="lg" className="h-auto w-full whitespace-normal py-3 text-center" onClick={() => setShowModal(true)}>
                    {supportLabel}
                  </Button>
                ) : null}
                <p className="text-xs text-ink-2">Pago con CoDi desde tu banco · procesado por Pey · sin comisión</p>
                {latestReal ? (
                  <PaymentTrace
                    createdAt={latestReal.createdAt}
                    paidAt={latestReal.paidAt}
                    verified
                    beforeAmount={Math.max(0, story.amountRaised - latestReal.amount)}
                    afterAmount={story.amountRaised}
                  />
                ) : null}
              </div>
              <p className="max-w-[68ch] text-body text-ink-2">{story.summary}</p>
            </section>

            <section className="space-y-3 border-b border-line pb-5">
              <h2 className="text-h3 text-ink">Historia</h2>
              <p className="max-w-[68ch] text-body text-ink-2">{story.story}</p>
            </section>

            {story.slug === "adrian" ? (
              <section className="rounded-xl border border-ink bg-white p-4">
                <p className="text-small text-ink-2">Boleto</p>
                <p className="font-display text-2xl text-ink">CDMX Central Norte → Guanajuato</p>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-line">
                  <div className="h-full bg-rosa" style={{ width: `${Math.min(100, showFulfilled ? 100 : percent)}%` }} />
                </div>
                {showFulfilled ? (
                  <p className="mt-4 inline-block -rotate-6 border-2 border-jade px-3 py-1 text-small font-semibold uppercase tracking-wide text-jade">
                    Cubierto · Listo para viajar
                  </p>
                ) : (
                  <p className="mt-3 text-small text-ink-2">El boleto se va llenando con cada apoyo.</p>
                )}
              </section>
            ) : null}
            {story.slug === "santiago" ? (
              <section className="space-y-3">
                <h2 className="text-h3 text-ink">Sesiones de rehabilitación</h2>
                <div className="grid grid-cols-9 gap-1.5 sm:grid-cols-[repeat(17,minmax(0,1fr))]">
                  {Array.from({ length: 17 }, (_, index) => {
                    const filled = index < Math.round(((showFulfilled ? 100 : percent) / 100) * 17);
                    return (
                      <span
                        key={index}
                        className={`h-8 rounded-sm ${filled ? "bg-rosa" : "bg-line"}`}
                        aria-hidden
                      />
                    );
                  })}
                </div>
                <p className="text-small text-ink-2">17 bloques. Cada uno es una sesión del plan.</p>
              </section>
            ) : null}
            {story.slug === "miriam" && milestoneItems.length > 0 ? (
              <section className="space-y-3">
                <h2 className="text-h3 text-ink">La obra</h2>
                <ol className="grid gap-2 sm:grid-cols-4">
                  {milestoneItems.slice(0, 4).map((milestone, index) => (
                    <li key={milestone.id} className="rounded-md border border-line p-3">
                      <div className={`mb-3 h-2 rounded-full ${milestone.completed || showFulfilled ? "bg-rosa" : "bg-line"}`} />
                      <p className="text-small text-ink">
                        {index + 1}. {milestone.label}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            <section className="space-y-3">
              <h2 className="text-h3 text-ink">En qué se usa el dinero</h2>
              <p className="text-small text-ink-2">Actualizado {lastUpdatedLabel}</p>
              <ul className="divide-y divide-line border-y border-line">
                {milestoneItems.map((milestone, index) => {
                  const previous = index === 0 ? 0 : milestoneItems[index - 1].targetAmount;
                  const cost = Math.max(0, milestone.targetAmount - previous);
                  const firstOpen = milestoneItems.find((item) => !item.completed)?.id === milestone.id;
                  return (
                    <li key={milestone.id} className="flex items-start justify-between gap-3 py-3">
                      <p className="text-small text-ink">
                        {milestone.label} · {formatCurrency(cost)}
                      </p>
                      {milestone.completed ? (
                        <p className="shrink-0 text-small text-jade">Cubierto</p>
                      ) : firstOpen ? (
                        <p className="shrink-0 text-small text-ink-2">Faltan {formatCurrency(remaining)}</p>
                      ) : null}
                    </li>
                  );
                })}
                <li className="flex items-center justify-between gap-3 border-t border-line py-3 font-semibold">
                  <p className="text-small text-ink">Meta total · {formatCurrency(story.goalAmount)}</p>
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-h3 text-ink">Bitácora</h2>
              <p className="text-small text-ink-2">Las notas sin la marca verde son un ejemplo.</p>
              <ul className="divide-y divide-line border-y border-line">
                {storyData.supporters
                  .filter((supporter) => supporter.isRealConfirmed)
                  .map((supporter) => (
                    <li key={supporter.id} className="py-3 text-small text-ink">
                      {formatShortDay(supporter.paidAt)} · {supporter.donorName} apoyó con {formatCurrency(supporter.amount)}
                      <Link href={`/apoyo/${supporter.id}`} className="mt-1 block font-semibold text-jade">
                        ✓ Confirmado por CoDi
                      </Link>
                    </li>
                  ))}
                {(org?.log ?? []).map((entry) => (
                  <li key={entry} className="py-3 text-small text-ink-2">
                    {entry} <span className="text-ink">ejemplo</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-h3 text-ink">Así la revisamos</h2>
              <p className="text-small text-ink-2">
                {org
                  ? `${org.caseworker}, ${org.role} de ${org.name}. Los nombres y las revisiones de esta sección son un ejemplo.`
                  : "Las revisiones de esta sección son un ejemplo."}
              </p>
              <ul className="space-y-2 text-small text-ink">
                {(org?.checks ?? ["La organización dice que conoce a la persona en persona."]).map((check) => (
                  <li key={check}>{check}</li>
                ))}
                <li>
                  {story.clabeRegistered
                    ? "Cuenta CLABE registrada en Pey ✓"
                    : "Cuenta CLABE pendiente de registro en Pey"}
                </li>
              </ul>
              <p className="text-small text-ink">La cuenta es de la persona, no de la organización.</p>
              <a
                href={`mailto:reportar@example.org?subject=${encodeURIComponent(`Reportar la historia de ${story.personName}`)}`}
                className="inline-flex min-h-11 items-center text-small font-semibold text-ink"
              >
                Reportar esta historia
              </a>
            </section>

            <section className="space-y-3">
              <h2 className="text-h3 text-ink">Quiénes ya apoyaron</h2>
              {storyData.supporters.length === 0 ? (
                <p className="border-y border-line py-4 text-small text-ink-2">
                  Aún no hay mensajes. Sé la primera persona en apoyar.
                </p>
              ) : (
                <ul className="divide-y divide-line border-y border-line">
                  {simulatedId ? (
                    <li className="arrive-in py-3.5 text-small text-ink-2">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold text-ink">Diego <span className="font-normal text-ink-2">ejemplo</span></p>
                        <p className="shrink-0 tabular-nums font-semibold text-ink">{formatCurrency(10)}</p>
                      </div>
                      <p className="mt-1 text-small font-semibold tracking-normal text-jade">
                        ✓ Confirmado por CoDi · hace unos segundos
                      </p>
                    </li>
                  ) : null}
                  {storyData.supporters.map((supporter) => {
                    const justArrived = supporter.isRealConfirmed && supporter.id === latestReal?.id && seenRealId.current === supporter.id && toast !== null;
                    return (
                    <li key={supporter.id} className={`py-3.5 text-small text-ink-2 ${justArrived ? "arrive-in" : ""}`}>
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold text-ink">{supporter.donorName}</p>
                        <p className="shrink-0 tabular-nums font-semibold text-ink">
                          {formatCurrency(supporter.amount)}
                        </p>
                      </div>
                      {supporter.isRealConfirmed ? (
                        <Link href={`/apoyo/${supporter.id}`} className="mt-1 block text-small font-semibold tracking-normal text-jade">
                          ✓ Confirmado por CoDi{justArrived ? " · hace unos segundos" : ""}
                        </Link>
                      ) : null}
                      {supporter.message ? <p className="mt-1 leading-relaxed">{supporter.message}</p> : null}
                    </li>
                    );
                  })}
                </ul>
              )}
              {hasExampleSupport ? (
                <p className="text-micro text-ink-2">Los aportes sin la marca verde de CoDi son de ejemplo.</p>
              ) : null}
            </section>

            <section className="space-y-3 lg:hidden">{trustList}</section>

            <section className="space-y-3">
              <h3 className="text-h3 text-ink">Compartir</h3>
              <p className="text-small text-ink-2">
                {displayDomain}/{story.slug}
              </p>
              <div className="grid grid-cols-3 gap-2">
                <a
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-3 text-small font-semibold text-ink hover:bg-black/5"
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Échale la mano a ${story.personName}: ${fullUrl}`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
                <Button variant="outline" onClick={copyLink} className="w-full px-2">
                  <Copy className="mr-1.5 h-4 w-4" /> {copied ? "Copiado" : "Copiar"}
                </Button>
                <Button variant="outline" onClick={shareNative} className="w-full px-2">
                  <Share2 className="mr-1.5 h-4 w-4" /> Más
                </Button>
              </div>
              <Link href={`/${story.slug}/alcancia`} className="inline-flex min-h-11 items-center text-small font-semibold text-ink">
                Poner alcancía en tu negocio
              </Link>
              <QrCardDownload
                personName={story.personName}
                slug={story.slug}
                coverImage={story.coverImage}
                posterLine={framing.posterLine || story.title}
                focus={"posterFocus" in framing && framing.posterFocus ? framing.posterFocus : framing.coverFocus}
                mode="text-link"
              />
            </section>
          </article>

          <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
            <Card className="space-y-4 p-5">
              {amountBlock}
              {showFulfilled ? null : amountChoices}
              {showFulfilled ? (
                <a
                  href={goodNewsHref}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-ink px-4 text-small font-semibold text-paper"
                >
                  Compartir la buena noticia
                </a>
              ) : canReceiveSupport ? (
                <Button size="lg" className="h-auto w-full whitespace-normal py-3 text-center" onClick={() => setShowModal(true)}>
                  {supportLabel}
                </Button>
              ) : (
                <Button size="lg" className="w-full" disabled>
                  No disponible por ahora
                </Button>
              )}
              <p className="text-xs text-ink-2">Pago con CoDi desde tu banco · procesado por Pey · sin comisión</p>
              {latestReal ? (
                <PaymentTrace
                  createdAt={latestReal.createdAt}
                  paidAt={latestReal.paidAt}
                  verified
                  beforeAmount={Math.max(0, story.amountRaised - latestReal.amount)}
                  afterAmount={story.amountRaised}
                />
              ) : null}
              {trustList}
              {showExampleBadge ? (
                <p className="text-micro text-ink-2">Historia de ejemplo para demostración.</p>
              ) : null}
            </Card>
          </aside>
        </div>
      </section>

      {showSticky ? (
        <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
          <div className="flex h-[72px] items-center justify-between gap-3 border-t border-line bg-paper px-4 pb-[env(safe-area-inset-bottom)]">
            <p className="font-display text-xl tabular-nums text-ink">
              {showFulfilled ? "¡Meta cumplida!" : `Faltan ${formatCurrency(remaining)}`}
            </p>
            {showFulfilled ? (
              <a
                href={goodNewsHref}
                className="inline-flex h-12 shrink-0 items-center rounded-md bg-ink px-4 text-small font-semibold text-paper"
              >
                Compartir
              </a>
            ) : canReceiveSupport ? (
              <Button className="h-12 shrink-0 px-6 text-white" onClick={() => setShowModal(true)}>
                Apoyar
              </Button>
            ) : (
              <Button className="h-12 shrink-0 px-6" disabled>
                Apoyar
              </Button>
            )}
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed right-4 top-20 z-50 max-w-xs rounded-md bg-ink px-4 py-3 text-small font-semibold text-paper shadow-card">
          {toast}
        </div>
      ) : null}
      <div className="mx-auto flex w-full max-w-7xl flex-wrap gap-3 px-4 pb-6 md:px-8">
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
        {canSimulate ? (
          <button
            type="button"
            className="inline-flex min-h-11 items-center text-small font-semibold text-ink-2"
            onClick={() => {
              setSimulatedId(`sim-${Date.now()}`);
              setToast(`Alguien le echó la mano a ${personLabel} con ${formatCurrency(10)}`);
              announceArrival(10, story.personName);
              window.setTimeout(() => setToast(null), 4200);
            }}
          >
            Simular llegada (no es un pago)
          </button>
        ) : null}
      </div>

      {showModal && canReceiveSupport ? (
        <SupportModal
          slug={story.slug}
          personName={story.personName}
          storyTitle={story.title}
          organizationName={story.organizationName}
          initialAmount={selectedAmount}
          remaining={remaining}
          raisedBefore={story.amountRaised}
          onClose={() => setShowModal(false)}
          onPaid={() => {
            void mutate();
          }}
        />
      ) : null}
    </>
  );
}
