"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Copy, MapPin, Share2 } from "lucide-react";
import useSWR from "swr";

import { ArtDirectedImage } from "@/components/media/art-directed-image";
import { QrCardDownload } from "@/components/story/qr-card-download";
import { SupportModal } from "@/components/story/support-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { framingForSlug } from "@/lib/story-framing";
import { StoryLiveData } from "@/lib/types";
import { displayDomainFromUrl } from "@/lib/site-url";
import {
  formatCurrency,
  getStoryWideImagePath,
  peopleHelpedLabel,
  percentFromAmounts,
} from "@/lib/utils";

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

  const activeGalleryImage = galleryImages[galleryIndex] ?? story.coverImage;
  const activeDesktopImage = getStoryWideImagePath(activeGalleryImage);

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

  const framing = framingForSlug(story.slug);
  const firstName = story.personName.split(" ")[0];
  const remaining = Math.max(0, story.goalAmount - story.amountRaised);
  const hasExampleSupport = storyData.supporters.some((supporter) => !supporter.isRealConfirmed);

  const amountBlock = (
    <div className="space-y-2">
      <p className="font-display text-5xl leading-none text-ink">{formatCurrency(story.amountRaised)}</p>
      <p className="text-small text-ink-2">
        reunidos de {formatCurrency(story.goalAmount)} · {percent}%
      </p>
      <p className="text-small text-ink-2">{peopleHelpedLabel(story.supporterCount)}</p>
      <Progress value={percent} className="h-1.5" />
    </div>
  );

  const amountChoices = (
    <div className="grid grid-cols-2 gap-2">
      {[50, 100, 200, 500].map((option) => (
        <button
          key={option}
          onClick={() => setSelectedAmount(option)}
          className={`min-h-11 rounded-md border px-3 text-small transition ${
            selectedAmount === option
              ? "border-ink bg-ink text-white"
              : "border-line bg-white text-ink-2"
          }`}
        >
          {formatCurrency(option)}
        </button>
      ))}
    </div>
  );

  const trustList = (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-t border-line pt-4 text-small">
      <dt className="text-ink-2">Organización</dt>
      <dd className="text-ink">{story.organizationName}</dd>
      <dt className="text-ink-2">Recibe</dt>
      <dd className="text-ink">{story.accountHolderName}</dd>
      <dt className="text-ink-2">CLABE</dt>
      <dd className="text-ink">{story.clabeMasked}</dd>
    </dl>
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
        {codiPending ? (
          <Card className="mb-4 border-sky-200 bg-sky-50 p-4 text-small text-sky-900">
            Cuenta en verificación con Banxico (hasta 5 días hábiles). El botón de apoyo se
            habilita automáticamente en cuanto quede activa.
          </Card>
        ) : null}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <article className="space-y-5">
            <div className="relative -mx-4 aspect-[4/3] overflow-hidden bg-[#efe8dc] md:mx-0 md:aspect-[3/2] md:rounded-xl">
              <ArtDirectedImage
                mobileSrc={activeGalleryImage}
                desktopSrc={activeDesktopImage}
                alt={`Foto principal de ${story.personName}`}
                priority={galleryIndex === 0}
                mobileSizes="100vw"
                desktopSizes="65vw"
                mobileObjectPosition={activeGalleryImage === story.coverImage ? framing.coverFocus : "50% 45%"}
                desktopObjectPosition={activeGalleryImage === story.coverImage ? framing.coverFocus : "50% 45%"}
                mobileBlurDataURL={framing.blurDataURL}
                desktopBlurDataURL={framing.blurDataURL}
              />
            </div>

            <section className="space-y-3">
              <p className="inline-flex items-center gap-2 text-small text-ink-2">
                <MapPin className="h-4 w-4" /> {story.location}
              </p>
              <h1 className="text-balance text-h2 text-ink">{story.title}</h1>
              <div className="space-y-4 border-y border-line py-5 lg:hidden">{amountBlock}</div>
              <p className="max-w-[68ch] text-body text-ink-2">{story.summary}</p>
            </section>

            {galleryImages.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto">
                {galleryImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    onClick={() => setGalleryIndex(index)}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border transition ${
                      index === galleryIndex ? "border-ink" : "border-line"
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`Galería ${index + 1} de ${story.personName}`}
                      fill
                      placeholder="blur"
                      blurDataURL={framing.blurDataURL}
                      sizes="64px"
                      className="object-cover"
                      style={{ objectPosition: index === 0 ? framing.coverFocus : "50% 45%" }}
                    />
                  </button>
                ))}
              </div>
            ) : null}

            <section className="space-y-3 border-b border-line pb-5">
              <h2 className="text-h3 text-ink">Historia</h2>
              <p className="max-w-[68ch] text-body text-ink-2">{story.story}</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-h3 text-ink">En qué se usa el dinero</h2>
              <p className="text-small text-ink-2">Actualizado {lastUpdatedLabel}</p>
              <ul className="divide-y divide-line border-y border-line">
                {milestoneItems.map((milestone, index) => {
                  const previous = index === 0 ? 0 : milestoneItems[index - 1].targetAmount;
                  const cost = Math.max(0, milestone.targetAmount - previous);
                  const isLast = index === milestoneItems.length - 1;
                  const firstOpen = milestoneItems.find((item) => !item.completed)?.id === milestone.id;
                  return (
                    <li key={milestone.id} className="flex items-start justify-between gap-3 py-3">
                      <p className="text-small text-ink">{milestone.label}</p>
                      <div className="text-right">
                        <p className="text-small font-semibold tabular-nums text-ink">{formatCurrency(cost)}</p>
                        {milestone.completed ? (
                          <p className="text-small text-jade">Cubierto</p>
                        ) : firstOpen ? (
                          <p className="text-small text-ink-2">Faltan {formatCurrency(remaining)}</p>
                        ) : null}
                        {isLast ? (
                          <p className="text-small text-ink-2">meta {formatCurrency(story.goalAmount)}</p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-h3 text-ink">Quienes ya apoyaron</h2>
              {storyData.supporters.length === 0 ? (
                <p className="border-y border-line py-4 text-small text-ink-2">
                  Aún no hay mensajes. Sé la primera persona en apoyar.
                </p>
              ) : (
                <ul className="divide-y divide-line border-y border-line">
                  {storyData.supporters.map((supporter) => (
                    <li key={supporter.id} className="py-3.5 text-small text-ink-2">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold text-ink">{supporter.donorName}</p>
                        <p className="shrink-0 tabular-nums font-semibold text-ink">
                          {formatCurrency(supporter.amount)}
                        </p>
                      </div>
                      {supporter.isRealConfirmed ? (
                        <p className="mt-1 inline-flex items-center gap-1 text-micro font-semibold uppercase tracking-[0.08em] text-jade">
                          <span className="h-2 w-2 rounded-full bg-jade" />
                          Confirmado por CoDi
                        </p>
                      ) : null}
                      {supporter.message ? <p className="mt-1 leading-relaxed">{supporter.message}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
              {hasExampleSupport ? (
                <p className="text-micro text-ink-2/80">Los aportes sin sello son ejemplos del demo.</p>
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
              <QrCardDownload
                personName={story.personName}
                slug={story.slug}
                coverImage={story.coverImage}
                posterLine={framing.posterLine || story.title}
                focus={"posterFocus" in framing && framing.posterFocus ? framing.posterFocus : framing.coverFocus}
                mode="text-link"
              />
              <p className="text-small text-ink-2">
                Imprímelo o mándalo por WhatsApp. Quien lo escanee verá la historia de {firstName}.
              </p>
            </section>
          </article>

          <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
            <Card className="space-y-4 p-5">
              {amountBlock}
              {amountChoices}
              {canReceiveSupport ? (
                <Button size="lg" className="w-full" onClick={() => setShowModal(true)}>
                  Apoyar con CoDi
                </Button>
              ) : (
                <Button size="lg" className="w-full" disabled>
                  No disponible por ahora
                </Button>
              )}
              {trustList}
              {showExampleBadge ? (
                <p className="text-micro text-ink-2">Historia de ejemplo para demostración.</p>
              ) : null}
            </Card>
          </aside>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
        <div className="flex h-[72px] items-center justify-between gap-3 border-t border-line bg-paper px-4 pb-[env(safe-area-inset-bottom)]">
          <div className="min-w-0">
            <p className="leading-none">
              <span className="font-display text-xl tabular-nums text-ink">{formatCurrency(story.amountRaised)}</span>{" "}
              <span className="text-small text-ink-2">de {formatCurrency(story.goalAmount)}</span>
            </p>
            <div className="mt-2 h-1 w-28 overflow-hidden rounded-full bg-line">
              <div className="h-full bg-rosa" style={{ width: `${percent}%` }} />
            </div>
          </div>
          {canReceiveSupport ? (
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
