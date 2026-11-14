"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";

import { SupportModal } from "@/components/story/support-modal";
import { announceArrival, setBocinaEnabled } from "@/lib/arrival";
import { framingForSlug } from "@/lib/story-framing";
import { StoryLiveData } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const amounts = [20, 50, 100, 200];

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("No se pudo refrescar la historia");
  return (await response.json()) as StoryLiveData;
};

export function KioskView({ initialData }: { initialData: StoryLiveData }) {
  const { data, mutate } = useSWR<StoryLiveData>(`/api/stories/${initialData.story.slug}/live`, fetcher, {
    fallbackData: initialData,
    refreshInterval: 3000,
  });
  const story = data?.story ?? initialData.story;
  const remaining = Math.max(0, story.goalAmount - story.amountRaised);
  const canReceiveSupport = story.status === "aprobada" && story.codiStatus === "ACTIVE" && remaining > 0;
  const [chosen, setChosen] = useState<number | null>(null);
  const [thanksAmount, setThanksAmount] = useState<number | null>(null);
  const [bocinaOn, setBocinaOn] = useState(false);
  const idleRef = useRef<number | null>(null);
  const framing = framingForSlug(story.slug);

  function armIdle() {
    if (idleRef.current) window.clearTimeout(idleRef.current);
    idleRef.current = window.setTimeout(() => {
      setChosen(null);
      setThanksAmount(null);
    }, 120_000);
  }

  useEffect(() => {
    armIdle();
    const onPointer = () => armIdle();
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      if (idleRef.current) window.clearTimeout(idleRef.current);
    };
  }, []);

  useEffect(() => {
    if (thanksAmount == null) return;
    const timeout = window.setTimeout(() => setThanksAmount(null), 8000);
    return () => window.clearTimeout(timeout);
  }, [thanksAmount]);

  return (
    <section className="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-8">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/${story.slug}`} className="inline-flex min-h-11 items-center text-small font-semibold text-ink">
          Salir
        </Link>
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
      </div>

      <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#efe8dc]">
          <Image
            src={story.coverImage}
            alt={`Foto de ${story.personName}`}
            fill
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
            style={{ objectPosition: framing.coverFocus }}
          />
        </div>
        <div className="space-y-4">
          <p className="text-small text-ink-2">{story.personName}</p>
          <p className="font-display text-5xl leading-none text-ink md:text-6xl">Faltan {formatCurrency(remaining)}</p>
          <p className="text-body text-ink-2">
            {formatCurrency(story.amountRaised)} de {formatCurrency(story.goalAmount)}
          </p>
        </div>
      </div>

      {canReceiveSupport ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {amounts.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => setChosen(amount)}
              className="min-h-24 rounded-xl bg-rosa text-4xl font-semibold text-white"
            >
              {formatCurrency(amount)}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-h3 text-ink">¡Meta cumplida!</p>
      )}

      {thanksAmount != null ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink px-6 text-center text-paper">
          <p className="max-w-3xl font-display text-4xl leading-tight md:text-6xl">
            ¡Gracias! {story.personName} ya lleva {formatCurrency(story.amountRaised)} de {formatCurrency(story.goalAmount)}
          </p>
        </div>
      ) : null}

      {chosen != null && canReceiveSupport ? (
        <SupportModal
          slug={story.slug}
          personName={story.personName}
          storyTitle={story.title}
          organizationName={story.organizationName}
          initialAmount={chosen}
          remaining={remaining}
          raisedBefore={story.amountRaised}
          kiosk
          onClose={() => setChosen(null)}
          onPaid={() => {
            const paid = chosen;
            setChosen(null);
            setThanksAmount(paid);
            announceArrival(paid, story.personName);
            void mutate();
          }}
        />
      ) : null}
    </section>
  );
}
