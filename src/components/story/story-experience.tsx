"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Copy, MapPin, QrCode, Share2, Users2 } from "lucide-react";
import useSWR from "swr";

import { QrCardDownload } from "@/components/story/qr-card-download";
import { ProgressRing } from "@/components/story/progress-ring";
import { SupportModal } from "@/components/story/support-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StoryLiveData } from "@/lib/types";
import { formatCurrency, percentFromAmounts } from "@/lib/utils";

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("No se pudo refrescar la historia");
  return (await response.json()) as StoryLiveData;
};

export function StoryExperience({
  initialData,
  previewToken,
}: {
  initialData: StoryLiveData;
  previewToken?: string | null;
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
  const fullUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${story.slug}`
      : `https://echale.mx/${story.slug}`;

  const milestoneItems = useMemo(() => {
    return story.milestones
      .slice()
      .sort((a, b) => a.targetAmount - b.targetAmount)
      .map((milestone) => ({
        ...milestone,
        completed: story.amountRaised >= milestone.targetAmount,
      }));
  }, [story.amountRaised, story.milestones]);

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
      setShowMobileBar(window.scrollY > 220);
    };

    updateBarVisibility();
    window.addEventListener("scroll", updateBarVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateBarVisibility);
  }, []);

  return (
    <>
      <section className="mx-auto w-full max-w-6xl px-4 pb-[calc(11rem+env(safe-area-inset-bottom))] pt-5 md:px-8 md:pb-16">
        {isPreview ? (
          <Card className="mb-4 border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Esta historia está en revisión por la organización aliada. Solo tú y el equipo pueden
            verla con este enlace de preview.
          </Card>
        ) : null}
        {codiPending ? (
          <Card className="mb-4 border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
            Cuenta en verificación con Banxico (hasta 5 días hábiles). El botón de apoyo se
            habilita automáticamente en cuanto quede ACTIVE.
          </Card>
        ) : null}
        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <Card className="overflow-hidden">
            <div className="relative h-[320px] w-full md:h-[500px]">
              <Image
                src={story.galleryImages[galleryIndex] ?? story.coverImage}
                alt={story.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto p-3">
              {story.galleryImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  onClick={() => setGalleryIndex(index)}
                  className={`relative h-20 w-24 shrink-0 overflow-hidden rounded-2xl border-2 transition ${
                    index === galleryIndex ? "border-[#E4007C]" : "border-transparent"
                  }`}
                >
                  <Image src={image} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="space-y-4 p-5 md:p-6">
              <p className="inline-flex items-center gap-2 rounded-full bg-[#fff0f8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#E4007C]">
                <MapPin className="h-3.5 w-3.5" /> {story.location}
              </p>
              <h1 className="text-3xl font-black leading-tight text-zinc-900 md:text-4xl">
                {story.title}
              </h1>
              <p className="text-zinc-600">{story.story}</p>
              <p className="rounded-2xl bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                <span className="font-semibold">Gestionado por:</span> {story.organizationName}
              </p>
              <div className="grid gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
                <p>
                  <span className="font-semibold">Cuenta receptora:</span> {story.accountHolderName}
                </p>
                <p>
                  <span className="font-semibold">CLABE destino:</span> {story.clabeMasked}
                </p>
              </div>
              {story.isExample ? (
                <p className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-500">
                  Historia de ejemplo
                </p>
              ) : null}
            </Card>

            <Card className="space-y-4 p-5 md:p-6">
              <div className="grid items-center gap-4 sm:grid-cols-[1fr_1.2fr]">
                <ProgressRing value={percent} size={150} stroke={11} />
                <div className="space-y-1">
                  <p className="text-5xl font-black text-[#E4007C]">
                    {formatCurrency(story.amountRaised)}
                  </p>
                  <p className="text-lg text-zinc-600">
                    recaudados de <strong>{formatCurrency(story.goalAmount)}</strong>
                  </p>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#ecfdf5] px-3 py-1 text-sm font-medium text-[#047857]">
                    <Users2 className="h-4 w-4" />
                    {story.supporterCount} personas han ayudado
                  </div>
                </div>
              </div>
              <Progress value={percent} className="h-2.5" />
            </Card>

            <Card className="p-5 md:p-6">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900">Avance por metas</h2>
              <div className="space-y-2">
                {milestoneItems.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="flex items-center justify-between rounded-2xl border border-zinc-100 px-4 py-3"
                  >
                    <p className="inline-flex items-center gap-2 text-zinc-700">
                      <CheckCircle2
                        className={`h-4 w-4 ${
                          milestone.completed ? "text-[#0F7B59]" : "text-zinc-300"
                        }`}
                      />
                      {milestone.label}
                    </p>
                    <p className={milestone.completed ? "font-semibold text-[#0F7B59]" : "text-zinc-500"}>
                      {formatCurrency(milestone.targetAmount)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card className="space-y-4 p-5 md:p-6">
            <h3 className="text-lg font-semibold text-zinc-900">Comparte este enlace</h3>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
              echale.mx/{story.slug}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button variant="outline" onClick={copyLink}>
                <Copy className="mr-1.5 h-4 w-4" /> {copied ? "¡Copiado!" : "Copiar"}
              </Button>
              <a
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#25D366] px-4 text-sm font-medium text-white"
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Échale la mano a ${story.personName}: ${fullUrl}`,
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
              <Button variant="outline" onClick={shareNative}>
                <Share2 className="mr-1.5 h-4 w-4" /> Compartir
              </Button>
            </div>
          </Card>

          <Card className="space-y-4 p-5 md:p-6">
            <h3 className="text-lg font-semibold text-zinc-900">Escanea para apoyar</h3>
            <p className="text-sm text-zinc-600">
              Descarga una tarjeta lista para imprimir o compartir en redes.
            </p>
            <QrCardDownload personName={story.personName} slug={story.slug} />
            <Link
              href={`/${story.slug}`}
              className="inline-flex items-center gap-2 text-sm text-[#E4007C] hover:underline"
            >
              <QrCode className="h-4 w-4" />
              Vista pública de la historia
            </Link>
          </Card>
        </div>

        <Card className="mt-4 p-5 md:p-6">
          <h3 className="text-lg font-semibold text-zinc-900">Mensajes recientes</h3>
          {storyData.supporters.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-600">
              Aún no hay mensajes. Sé la primera persona en echar la mano 💗
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {storyData.supporters.map((supporter) => (
                <div
                  key={supporter.id}
                  className="rounded-2xl border border-zinc-100 px-4 py-3 text-sm text-zinc-700"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{supporter.donorName}</p>
                    <p className="text-[#0F7B59]">{formatCurrency(supporter.amount)}</p>
                  </div>
                  {supporter.message ? <p className="mt-1 text-zinc-600">{supporter.message}</p> : null}
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      {showMobileBar ? (
        <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
          <div className="border-t border-zinc-200 bg-white/98 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-16px_28px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="mb-1.5 flex gap-2 overflow-x-auto pb-1">
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
      <div className="fixed bottom-6 right-6 z-20 hidden rounded-2xl border border-zinc-200 bg-white/95 p-3 shadow-xl backdrop-blur md:block">
        <div className="mb-2 flex items-center gap-2">
          {[50, 100, 200, 500].map((option) => (
            <button
              key={option}
              onClick={() => setSelectedAmount(option)}
              className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
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
          <Button size="lg" onClick={() => setShowModal(true)}>
            Apoyar con CoDi
          </Button>
        ) : (
          <Button size="lg" disabled>
            No disponible por ahora
          </Button>
        )}
      </div>

      {showModal && canReceiveSupport ? (
        <SupportModal
          slug={story.slug}
          personName={story.personName}
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
