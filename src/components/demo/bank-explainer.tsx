"use client";

import { useEffect, useState } from "react";

const steps = [
  { id: "codi", label: "CoDi" },
  { id: "qr", label: "Pagar con QR" },
  { id: "confirm", label: "Confirmar" },
  { id: "sent", label: "Pago enviado" },
] as const;

function Viewfinder() {
  return (
    <span className="mb-2 grid h-10 w-10 grid-cols-2 gap-1" aria-hidden>
      <span className="border-l-2 border-t-2 border-ink" />
      <span className="border-r-2 border-t-2 border-ink" />
      <span className="border-b-2 border-l-2 border-ink" />
      <span className="border-b-2 border-r-2 border-ink" />
    </span>
  );
}

export function BankExplainer() {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stop = () => setPaused(media.matches);
    stop();
    media.addEventListener("change", stop);
    return () => media.removeEventListener("change", stop);
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setStep((current) => (current + 1) % steps.length);
    }, 1800);
    return () => window.clearInterval(timer);
  }, [paused]);

  const current = steps[step];

  return (
    <figure className="flex max-w-md items-center gap-4">
      <div className="h-[176px] w-[96px] shrink-0 rounded-[24px] border-2 border-ink bg-ink p-1.5" aria-hidden>
        <div className="flex h-full flex-col overflow-hidden rounded-[18px] bg-[#F7F3EC] px-2 py-3">
          <p className="text-center text-[11px] font-semibold text-ink-2">Tu banco</p>
          <div key={current.id} className="arrive-in grid flex-1 place-items-center text-center">
            {current.id === "qr" ? <Viewfinder /> : null}
            {current.id === "sent" ? <span className="mb-1 text-lg text-jade">✓</span> : null}
            {current.id === "confirm" ? (
              <span className="rounded-md bg-ink px-2 py-1 text-[11px] font-semibold text-paper">Confirmar</span>
            ) : (
              <p className="text-[13px] font-semibold leading-tight text-ink">{current.label}</p>
            )}
          </div>
        </div>
      </div>
      <figcaption className="min-w-0">
        <p className="text-small font-semibold text-ink">Así se ve en tu banco</p>
        <ol className="mt-2 space-y-1">
          {steps.map((item, index) => (
            <li
              key={item.id}
              className={`text-small ${index === step ? "font-semibold text-ink" : "text-ink-2"}`}
            >
              {index + 1}. {item.label}
            </li>
          ))}
        </ol>
        <p className="mt-2 text-micro font-semibold text-ink-2">Recreación ilustrativa. No es un pago real.</p>
      </figcaption>
    </figure>
  );
}
