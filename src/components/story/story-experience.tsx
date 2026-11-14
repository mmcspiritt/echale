"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Copy, MapPin, Share2, Users2 } from "lucide-react";
import useSWR from "swr";

import { QrCardDownload } from "@/components/story/qr-card-download";
import { ProgressRing } from "@/components/story/progress-ring";
import { SupportModal } from "@/components/story/support-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StoryLiveData } from "@/lib/types";
import { displayDomainFromUrl } from "@/lib/site-url";
import { formatCurrency, peopleHelpedLabel, percentFromAmounts } from "@/lib/utils";

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("No se pudo refrescar la historia");
  return (await response.json()) as StoryLiveData;
};

export function StoryExperience({
  initialData,
  previewToken,
  publicBaseUrl,
}: {
  initialData: StoryLiveData;
  previewToken?: string | null;
  publicBaseUrl: string;
}) {
  const { data, mutate } = useSWR<StoryLiveData>(
    `/api/stories/${initialData.story.slug}/live${
      previewToken ? `?preview=${encodeURIComponent(previewToken)}` : ""
    }`,
    fetcher,
    {
      fallbackData: initialData,
      refreshInterval: 4500,
      revalidateOnFocus: true,
    },
  );

  const [galleryIndex, setGalleryIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(100);
  const [showMobileBar, setShowMobileBar] = useState(false);

  const storyData = data ?? initialData;
  const story = storyData.story;
  const percent = percentFromAmounts(story.amountRaised, story.goalAmount);
  const isPreview = story.status !== "aprobada";
  const codiPending = story.status === "aprobada" && story.codiStatus !== "ACTIVE";
  const canReceiveSupport = story.status === "aprobada" && story.codiStatus === "ACTIVE";
  const liveKeyStories = ["PEY_API_KEY_ADRIAN", "PEY_API_KEY_SANTIAGO", "PEY_API_KEY_MIRIAM"];
  const showExampleBadge = story.isExample && !liveKeyStories.includes(story.peyKeyEnv);
  const displayDomain = displayDomainFromUrl(publicBaseUrl);
  const fullUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${story.slug}`
      : `${publicBaseUrl}/${story.slug}`;

  const milestoneItems = useMemo(() => {
    function usageFromMilestoneLabel(label: string) {
      const lower = label.toLowerCase();
      if (lower.includes("techo")) return "Uso de los fondos: materiales de techado y mano de obra.";
      if (lower.includes("muro")) return "Uso de los fondos: block, cemento y refuerzo estructural.";
      if (lower.includes("piso")) return "Uso de los fondos: firme, nivelación y acabados básicos.";
      if (lower.includes("puerta")) return "Uso de los fondos: carpintería, cerradura y colocación.";
      if (lower.includes("cocina")) return "Uso de los fondos: instalación básica y utensilios esenciales.";
      if (lower.includes("estudio")) return "Uso de los fondos: estudios clínicos y valoración médica.";
      if (lower.includes("procedimiento")) return "Uso de los fondos: honorarios médicos y quirófano.";
      if (lower.includes("rehabilit")) return "Uso de los fondos: terapias y seguimiento postoperatorio.";
      if (lower.includes("boleto")) return "Uso de los fondos: transporte terrestre y costo de traslado.";
      if (lower.includes("comida")) return "Uso de los fondos: alimentos durante trayecto y llegada.";
      return "Uso de los fondos: gastos directos para completar esta etapa.";
    }

    return story.milestones
      .slice()
      .sort((a, b) => a.targetAmount - b.targetAmount)
      .map((milestone) => ({
        ...milestone,
        completed: story.amountRaised >= milestone.targetAmount,
        usage: usageFromMilestoneLabel(milestone.label),
      }));
  }, [story.amountRaised, story.milestones]);

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
    const updateBarVisibility = () => {
      setShowMobileBar(window.scrollY > 170);
    };

    updateBarVisibility();
    window.addEventListener("scroll", updateBarVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateBarVisibility);
  }, []);

  return (
    <>
      <section className="mx-auto w-full max-w-7xl px-4 pb-[calc(10rem+env(safe-area-inset-bottom))] pt-6 md:px-8 md:pb-16">
        {isPreview ? (
          <Card className="mb-4 border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Esta historia está en revisión por la organización aliada. Solo tú y el equipo pueden
            verla con este enlace de preview.
          </Card>
        ) : null}
        {codiPending ? (
          <Card className="mb-4 border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
            Cuenta en verificación con Banxico (hasta 5 días hábiles). El botón de apoyo se
            habilita automáticamente en cuanto quede activa.
          </Card>
        ) : null}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <article className="space-y-5">
            <Card className="overflow-hidden border-zinc-200/90 shadow-[0_14px_36px_rgba(15,23,42,0.08)]">
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src={story.galleryImages[galleryIndex] ?? story.coverImage}
                  alt={`Foto principal de ${story.personName}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 65vw"
                  className="object-cover"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto p-3">
                {story.galleryImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    onClick={() => setGalleryIndex(index)}
                    className={`relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                      index === galleryIndex
                        ? "border-[#E4007C] ring-2 ring-[#E4007C]/15"
                        : "border-transparent"
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`Galería ${index + 1} de ${story.personName}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </Card>

            <Card className="space-y-4 border-zinc-200/90 p-6">
              <p className="inline-flex items-center gap-2 rounded-full bg-[#fff2f9] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#E4007C]">
                <MapPin className="h-3.5 w-3.5" /> {story.location}
              </p>
              <h1 className="text-balance text-[2rem] font-black leading-[1.05] tracking-[-0.03em] text-zinc-900 md:text-[2.5rem]">
                {story.title}
              </h1>
              <p className="max-w-[68ch] text-base leading-relaxed text-zinc-700 md:text-[1.05rem]">
                {story.story}
              </p>
            </Card>

            <Card className="space-y-4 border-zinc-200/90 p-6">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
                Última actualización: {lastUpdatedLabel}
              </p>
              <h2 className="text-xl font-semibold tracking-[-0.01em] text-zinc-900">Avance por metas</h2>
              <div className="space-y-4">
                {milestoneItems.map((milestone, index) => (
                  <div key={milestone.id} className="flex gap-3">
                    <div className="flex w-6 flex-col items-center">
                      <span
                        className={`mt-1 grid h-5 w-5 place-items-center rounded-full border ${
                          milestone.completed
                            ? "border-emerald-600 bg-emerald-50 text-emerald-600"
                            : "border-zinc-300 bg-white text-zinc-300"
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </span>
                      {index < milestoneItems.length - 1 ? (
                        <span className="mt-1 h-full w-px bg-zinc-200" />
                      ) : null}
                    </div>
                    <div className="flex-1 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3">
                      <p className="text-sm font-semibold text-zinc-800">{milestone.label}</p>
                      <p
                        className={`mt-1 text-sm ${
                          milestone.completed ? "font-semibold text-emerald-700" : "text-zinc-500"
                        }`}
                      >
                        {formatCurrency(milestone.targetAmount)}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-500">{milestone.usage}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="space-y-4 border-zinc-200/90 p-5">
                <h3 className="text-lg font-semibold text-zinc-900">Comparte este enlace</h3>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                  {displayDomain}/{story.slug}
                </div>
                <div className="grid gap-2">
                  <Button variant="outline" onClick={copyLink}>
                    <Copy className="mr-1.5 h-4 w-4" /> {copied ? "¡Copiado!" : "Copiar enlace"}
                  </Button>
                  <a
                    className="inline-flex h-11 items-center justify-center rounded-full bg-[#25D366] px-4 text-sm font-medium text-white"
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Échale la mano a ${story.personName}: ${fullUrl}`,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Compartir por WhatsApp
                  </a>
                  <Button variant="outline" onClick={shareNative}>
                    <Share2 className="mr-1.5 h-4 w-4" /> Compartir
                  </Button>
                </div>
              </Card>

              <Card className="space-y-4 border-zinc-200/90 p-5">
                <h3 className="text-lg font-semibold text-zinc-900">Escanea para apoyar</h3>
                <p className="text-sm text-zinc-600">
                  Descarga una tarjeta lista para imprimir o compartir.
                </p>
                <QrCardDownload personName={story.personName} slug={story.slug} />
              </Card>
            </div>

            <Card className="space-y-4 border-zinc-200/90 p-6">
              <h3 className="text-xl font-semibold text-zinc-900">Mensajes recientes</h3>
              {storyData.supporters.length === 0 ? (
                <p className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-600">
                  Aún no hay mensajes. Sé la primera persona en echar la mano 💗
                </p>
              ) : (
                <div className="space-y-3">
                  {storyData.supporters.map((supporter) => (
                    <div
                      key={supporter.id}
                      className="rounded-2xl border border-zinc-100 px-4 py-3 text-sm text-zinc-700"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold">{supporter.donorName}</p>
                        <p className="font-semibold text-[#0F7B59]">{formatCurrency(supporter.amount)}</p>
                      </div>
                      {supporter.message ? (
                        <p className="mt-1 leading-relaxed text-zinc-600">{supporter.message}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </article>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Card className="space-y-4 border-zinc-200/90 p-5 shadow-[0_16px_34px_rgba(15,23,42,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                Meta actual
              </p>
              <div className="grid items-center gap-4 sm:grid-cols-[112px_1fr] lg:grid-cols-1">
                <ProgressRing value={percent} size={112} stroke={10} />
                <div>
                  <p className="text-3xl font-black tracking-[-0.02em] text-[#E4007C]">
                    {formatCurrency(story.amountRaised)}
                  </p>
                  <p className="text-base text-zinc-600">
                    de <strong>{formatCurrency(story.goalAmount)}</strong>
                  </p>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                    <Users2 className="h-4 w-4" />
                    {peopleHelpedLabel(story.supporterCount)}
                  </div>
                </div>
              </div>
              <Progress value={percent} className="h-2.5" />
              <div className="grid grid-cols-2 gap-2">
                {[50, 100, 200, 500].map((option) => (
                  <button
                    key={option}
                    onClick={() => setSelectedAmount(option)}
                    className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                      selectedAmount === option
                        ? "border-[#E4007C] bg-[#fff0f8] text-[#E4007C]"
                        : "border-zinc-300 bg-white text-zinc-700"
                    }`}
                  >
                    {formatCurrency(option)}
                  </button>
                ))}
              </div>
              {canReceiveSupport ? (
                <Button size="lg" className="w-full" onClick={() => setShowModal(true)}>
                  Apoyar con CoDi
                </Button>
              ) : (
                <Button size="lg" className="w-full" disabled>
                  No disponible por ahora
                </Button>
              )}
              {showExampleBadge ? (
                <p className="text-xs text-zinc-500">Historia de ejemplo para demo hackathon.</p>
              ) : null}
            </Card>

            <Card className="space-y-2 border-zinc-200/90 p-5 text-sm text-zinc-700">
              <p>
                <span className="font-semibold">Gestionado por:</span> {story.organizationName}
              </p>
              <p>
                <span className="font-semibold">Cuenta receptora:</span> {story.accountHolderName}
              </p>
              <p>
                <span className="font-semibold">CLABE destino:</span> {story.clabeMasked}
              </p>
            </Card>
          </aside>
        </div>
      </section>

      {showMobileBar ? (
        <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
          <div className="border-t border-zinc-200 bg-white/98 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-14px_30px_rgba(15,23,42,0.1)] backdrop-blur">
            <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
              {[50, 100, 200, 500].map((option) => (
                <button
                  key={option}
                  onClick={() => setSelectedAmount(option)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-sm font-medium transition ${
                    selectedAmount === option
                      ? "border-[#E4007C] bg-[#fff0f8] text-[#E4007C]"
                      : "border-zinc-200 bg-white text-zinc-700"
                  }`}
                >
                  {formatCurrency(option)}
                </button>
              ))}
            </div>
            {canReceiveSupport ? (
              <Button className="w-full" size="lg" onClick={() => setShowModal(true)}>
                Apoyar con CoDi
              </Button>
            ) : (
              <Button className="w-full" size="lg" disabled>
                No disponible por ahora
              </Button>
            )}
          </div>
        </div>
      ) : null}

      {showModal && canReceiveSupport ? (
        <SupportModal
          slug={story.slug}
          personName={story.personName}
          storyTitle={story.title}
          organizationName={story.organizationName}
          initialAmount={selectedAmount}
          onClose={() => setShowModal(false)}
          onPaid={() => {
            void mutate();
          }}
        />
      ) : null}
    </>
  );
}
