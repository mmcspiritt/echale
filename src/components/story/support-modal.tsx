"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { CheckCircle2, ChevronDown, Loader2, X } from "lucide-react";
import QRCode from "qrcode";

import { PaymentTrace } from "@/components/story/payment-trace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";

interface CheckoutState {
  paymentId: string;
  codiQrId: string;
  qrString: string;
  paymentLink: string | null;
  expiresInSeconds: number;
  mode: "mock" | "live";
}

interface PaymentStatusSnapshot {
  status: string;
  paidAt: string | null;
  createdAt: string | null;
  providerTransactionId: string | null;
  codiQrId: string | null;
}

export function SupportModal({
  slug,
  personName,
  storyTitle,
  organizationName,
  initialAmount,
  remaining = 0,
  raisedBefore = null,
  kiosk = false,
  onClose,
  onPaid,
}: {
  slug: string;
  personName: string;
  storyTitle: string;
  organizationName: string;
  initialAmount: number;
  remaining?: number;
  raisedBefore?: number | null;
  kiosk?: boolean;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [amount, setAmount] = useState(initialAmount);
  const [customAmount, setCustomAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<CheckoutState | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [payPath, setPayPath] = useState<"qr" | "phone">("qr");
  const [status, setStatus] = useState<"idle" | "pending" | "paid">("idle");
  const [statusSnapshot, setStatusSnapshot] = useState<PaymentStatusSnapshot | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const amountOptions = useMemo(() => {
    const options = initialAmount === 10 ? [10, 50, 100, 200, 500] : [50, 100, 200, 500];
    if (initialAmount > 0 && !options.includes(initialAmount)) options.unshift(initialAmount);
    if (remaining > 0 && remaining <= 600 && !options.includes(remaining)) options.push(remaining);
    return options;
  }, [initialAmount, remaining]);

  const resolvedAmount = useMemo(() => {
    if (customAmount.trim().length > 0) {
      const parsed = Number(customAmount);
      if (!Number.isNaN(parsed) && parsed > 0) return parsed;
    }
    return amount;
  }, [amount, customAmount]);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel?.focus();

    function focusable() {
      if (!panel) return [];
      return [...panel.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), summary")].filter(
        (element) => !element.hasAttribute("disabled"),
      );
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (items.length === 0) {
        event.preventDefault();
        panel?.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (active && panel && !panel.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, []);

  useEffect(() => {
    if (!checkout?.qrString) return;
    QRCode.toDataURL(checkout.qrString, {
      width: 320,
      margin: 1,
      color: {
        dark: "#111827",
        light: "#FFFFFF",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(null));
  }, [checkout]);

  useEffect(() => {
    if (!checkout || status === "paid") return;

    const interval = setInterval(async () => {
      const response = await fetch(`/api/payments/${checkout.paymentId}/status`, {
        cache: "no-store",
      });
      if (!response.ok) return;
      const data = (await response.json()) as PaymentStatusSnapshot;
      setStatusSnapshot(data);
      if (data.status === "paid") {
        setStatus("paid");
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.3 },
          colors: ["#E4007C", "#F6D743", "#0F7B59"],
        });
        onPaid();
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [checkout, status, onPaid]);

  async function submitSupport() {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          amount: resolvedAmount,
          donorName: donorName.trim() || null,
          message: message.trim() || null,
          phone: phone.trim() || null,
        }),
      });

      const data = (await response.json()) as
        | CheckoutState
        | { error?: string; details?: string };

      if (!response.ok) {
        throw new Error(
          "error" in data
            ? `${data.error}${data.details ? `: ${data.details}` : ""}`
            : "No se pudo generar el cobro",
        );
      }

      setCheckout(data as CheckoutState);
      setStatus("pending");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo iniciar el apoyo. Intenta de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveQrToPhotos() {
    if (!qrDataUrl || !checkout) return;
    const filename = `echale-${slug}-${checkout.codiQrId}.png`;
    const blob = await fetch(qrDataUrl).then((response) => response.blob());
    const file = new File([blob], filename, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: "QR para apoyar con CoDi" });
      return;
    }
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = filename;
    link.click();
  }

  async function simulatePayment() {
    if (!checkout) return;
    await fetch(`/api/payments/${checkout.paymentId}/simulate`, {
      method: "POST",
    });
  }

  function shortId(value: string | null | undefined) {
    if (!value) return "—";
    if (value.length <= 12) return value;
    return `${value.slice(0, 6)}…${value.slice(-4)}`;
  }

  function mexicoDateTime(value: string | null | undefined) {
    if (!value) return "Pendiente";
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Mexico_City",
    }).format(new Date(value));
  }

  function downloadReceiptPng() {
    if (!checkout) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 675;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#f7f3ec";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#1C1A17";
    ctx.font = "700 54px Fraunces, Georgia, serif";
    ctx.fillText("Comprobante de apoyo", 64, 110);
    ctx.fillStyle = "#C8006A";
    ctx.font = "700 68px Fraunces, Georgia, serif";
    ctx.fillText(formatCurrency(resolvedAmount), 64, 205);

    const rows = [
      ["Historia", storyTitle],
      ["Beneficiario", personName],
      ["Fecha (CDMX)", mexicoDateTime(statusSnapshot?.paidAt)],
      ["Folio Pey", shortId(statusSnapshot?.providerTransactionId)],
      ["Folio CoDi", shortId(statusSnapshot?.codiQrId ?? checkout.codiQrId)],
      ["Gestionado por", organizationName],
    ];

    ctx.font = "600 28px Instrument Sans, Arial, sans-serif";
    rows.forEach(([label, value], index) => {
      const y = 280 + index * 58;
      ctx.fillStyle = "#6B7280";
      ctx.fillText(`${label}:`, 64, y);
      ctx.fillStyle = "#111827";
      ctx.fillText(value, 360, y);
    });

    ctx.fillStyle = "#4A453F";
    ctx.font = "500 24px Instrument Sans, Arial, sans-serif";
    ctx.fillText("✓ Confirmado por CoDi", 64, 635);

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `comprobante-${slug}-${Date.now()}.png`;
    link.click();
  }

  const chipClass = (selected: boolean) =>
    `min-h-11 rounded-md border px-3 py-2 text-center text-small font-semibold transition ${
      selected
        ? "border-transparent bg-ink text-[#F7F3EC] ring-2 ring-ink ring-offset-2"
        : "border-transparent bg-transparent text-ink"
    }`;


  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 md:items-center md:p-8"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-dialog-title"
        tabIndex={-1}
        data-testid="support-modal-panel"
        onClick={(event) => event.stopPropagation()}
        className="flex h-auto max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-xl border border-line bg-paper shadow-card outline-none md:max-w-xl md:rounded-xl"
      >
        <div className="shrink-0 px-5 pt-3 md:px-7 md:pt-5">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line md:hidden" aria-hidden="true" />
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h3 id="support-dialog-title" className="text-h2 text-ink">
                Apoyar a {personName}
              </h3>
              {remaining > 0 ? (
                <p className="mt-1 text-small text-ink-2">Faltan {formatCurrency(remaining)} para la meta</p>
              ) : null}
            </div>
            <button
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink-2 transition hover:bg-black/5"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 md:px-7">
          {!checkout ? (
            <div className="space-y-4 pb-4">
              <p className="text-body text-ink-2">Te mostramos un QR para que pagues desde la app de tu banco.</p>

              <div className="flex flex-wrap gap-2">
                {amountOptions.map((option) => {
                  const selected = amount === option && customAmount.length === 0;
                  const completar = remaining > 0 && remaining <= 600 && option === remaining;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setAmount(option);
                        setCustomAmount("");
                      }}
                      className={chipClass(selected)}
                    >
                      {completar ? `Completar · ${formatCurrency(option)}` : formatCurrency(option)}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2">
                <label className="text-small font-medium text-ink" htmlFor="custom-amount">Otro monto</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-2">$</span>
                  <Input
                    id="custom-amount"
                    inputMode="decimal"
                    placeholder="350"
                    value={customAmount}
                    onChange={(event) => setCustomAmount(event.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button type="button" className={chipClass(payPath === "qr")} onClick={() => setPayPath("qr")}>
                  Pagar con QR
                </button>
                <button type="button" className={chipClass(payPath === "phone")} onClick={() => setPayPath("phone")}>
                  Recibir cobro en mi celular
                </button>
              </div>

              {payPath === "phone" ? (
                <div className="space-y-2">
                  <label className="text-small font-medium text-ink" htmlFor="support-phone">Celular</label>
                  <Input
                    id="support-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    placeholder="10 dígitos"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value.replace(/[^\d]/g, "").slice(0, 10))}
                    maxLength={10}
                  />
                </div>
              ) : null}

              <details
                className="border-t border-line"
                onToggle={(event) => setDetailsOpen((event.currentTarget as HTMLDetailsElement).open)}
              >
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-small font-medium text-ink">
                  Agregar nombre y mensaje
                  <ChevronDown className={`h-4 w-4 transition ${detailsOpen ? "rotate-180" : ""}`} />
                </summary>
                <div className="mt-3 space-y-3">
                  <div className="space-y-2">
                    <label className="text-small font-medium text-ink" htmlFor="support-name">Tu nombre (opcional)</label>
                    <Input
                      id="support-name"
                      placeholder="Como quieras aparecer"
                      value={donorName}
                      onChange={(event) => setDonorName(event.target.value)}
                      maxLength={80}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-small font-medium text-ink" htmlFor="support-message">Mensaje (opcional)</label>
                    <Textarea
                      id="support-message"
                      placeholder={`Buen viaje, ${personName.split(" ")[0]}`}
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      maxLength={180}
                    />
                  </div>
                </div>
              </details>
            </div>
          ) : status === "paid" ? (
            <div className="space-y-5 pb-5 text-center">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>
              <h4 className="text-h2 text-ink">¡Gracias por echar la mano!</h4>
              <p className="text-small text-ink-2">Tu apoyo ya se registró y la meta se actualizó en tiempo real.</p>
              <p className="rounded-md bg-white px-4 py-3 text-body font-semibold text-rosa">
                Aporte confirmado: {formatCurrency(resolvedAmount)}
              </p>
              <div className="rounded-md border border-line bg-white p-4 text-left text-small text-ink-2">
                <p className="mb-2 text-small font-semibold text-ink">Comprobante</p>
                <div className="space-y-1">
                  <p><span className="font-medium text-ink">Monto:</span> {formatCurrency(resolvedAmount)}</p>
                  <p><span className="font-medium text-ink">Historia:</span> {storyTitle}</p>
                  <p><span className="font-medium text-ink">Fecha (CDMX):</span> {mexicoDateTime(statusSnapshot?.paidAt)}</p>
                  <p><span className="font-medium text-ink">Folio Pey:</span> {shortId(statusSnapshot?.providerTransactionId)}</p>
                  <p><span className="font-medium text-ink">Folio CoDi:</span> {shortId(statusSnapshot?.codiQrId ?? checkout?.codiQrId)}</p>
                  <p><span className="font-medium text-ink">Gestionado por:</span> {organizationName}</p>
                </div>
              </div>
              <PaymentTrace
                createdAt={statusSnapshot?.createdAt}
                paidAt={statusSnapshot?.paidAt}
                verified={Boolean(statusSnapshot?.providerTransactionId)}
                beforeAmount={raisedBefore}
                afterAmount={raisedBefore == null ? null : raisedBefore + resolvedAmount}
              />
              <div className="grid gap-2">
                <a
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-rosa px-4 text-small font-semibold text-white"
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Comprobante de mi apoyo a ${personName}: ${typeof window !== "undefined" ? window.location.origin : ""}/apoyo/${checkout?.paymentId ?? ""}`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Mandar comprobante por WhatsApp
                </a>
                <Button variant="outline" className="w-full" onClick={downloadReceiptPng}>
                  Guardar imagen
                </Button>
                <Button variant="ghost" className="w-full" onClick={onClose}>
                  Cerrar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5 pb-5">
              <div className="hidden space-y-3 [@media(pointer:coarse)]:block">
                {checkout.paymentLink ? (
                  <a
                    href={checkout.paymentLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-rosa px-4 text-small font-semibold text-white"
                  >
                    Abrir mi app bancaria
                  </a>
                ) : (
                  <Button className="h-12 w-full" onClick={saveQrToPhotos}>
                    Guardar QR en mis fotos
                  </Button>
                )}
                <p className="text-small text-ink-2">
                  Guarda el QR → En tu app: CoDi → Pagar con QR → Galería → Confirma
                </p>
                <div className="flex justify-center">
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrDataUrl} alt="Código QR CoDi" className={kiosk ? "h-72 w-72 max-w-full rounded-md bg-white p-2" : "h-44 w-44 rounded-md bg-white p-2"} />
                  ) : (
                    <div className="grid h-44 w-44 place-items-center rounded-md bg-[#efe8dc] text-small text-ink-2">Cargando QR...</div>
                  )}
                </div>
                <p className="text-center text-small text-ink-2">¿Estás en compu u otro celular? Escanéalo directo.</p>
              </div>

              <div className="[@media(pointer:coarse)]:hidden">
                <p className="text-small text-ink-2">
                  Vas a apoyar con{" "}
                  <strong className="font-display text-2xl tabular-nums text-rosa">{formatCurrency(resolvedAmount)}</strong>
                </p>
                <ol className="mt-3 space-y-2 text-[15px] leading-relaxed text-ink-2">
                  <li><span className="mr-2 font-semibold text-rosa">1.</span>Abre tu app bancaria.</li>
                  <li><span className="mr-2 font-semibold text-rosa">2.</span>Escanea este QR CoDi.</li>
                  <li><span className="mr-2 font-semibold text-rosa">3.</span>Confirma tu pago.</li>
                </ol>
                <div className="mt-4 flex justify-center">
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrDataUrl} alt="Código QR CoDi" className={kiosk ? "h-80 w-80 max-w-full rounded-md bg-white p-4" : "h-60 w-60 rounded-md bg-white p-4"} />
                  ) : (
                    <div className="grid h-60 w-60 place-items-center rounded-md bg-[#efe8dc] text-ink-2">Cargando QR...</div>
                  )}
                </div>
                {checkout.paymentLink ? (
                  <a
                    href={checkout.paymentLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 block rounded-md border border-line bg-white p-3 text-small font-medium text-ink hover:bg-black/5"
                  >
                    Abrir en app bancaria
                  </a>
                ) : null}
              </div>

              <p className="text-small text-ink-2">Antes de confirmar, tu banco te muestra el titular de la cuenta.</p>
              <p className="text-center font-mono text-small text-ink-2">Referencia {checkout.codiQrId}</p>
              <p className="inline-flex items-center gap-2 text-small text-ink-2">
                <Loader2 className="h-4 w-4 animate-spin text-rosa" />
                Esperando tu pago…
              </p>
              {checkout.mode === "mock" ? (
                <Button variant="secondary" className="w-full" onClick={simulatePayment}>
                  Simular pago exitoso (demo)
                </Button>
              ) : null}
              <Button variant="ghost" className="w-full" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          )}
        </div>

        {!checkout ? (
          <div className="shrink-0 border-t border-line bg-paper px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] md:px-7">
            {error ? <p className="mb-3 rounded-md bg-rose-50 p-3 text-small text-rose-700">{error}</p> : null}
            <Button className="w-full" size="lg" onClick={submitSupport} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando cobro...
                </>
              ) : (
                <>Apoyar con {formatCurrency(resolvedAmount)}</>
              )}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
