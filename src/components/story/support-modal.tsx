"use client";

import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { CheckCircle2, ChevronDown, Loader2, X } from "lucide-react";
import QRCode from "qrcode";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";

const amountOptions = [50, 100, 200, 500];

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
  providerTransactionId: string | null;
  codiQrId: string | null;
}

export function SupportModal({
  slug,
  personName,
  storyTitle,
  organizationName,
  initialAmount,
  onClose,
  onPaid,
}: {
  slug: string;
  personName: string;
  storyTitle: string;
  organizationName: string;
  initialAmount: number;
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
  const [status, setStatus] = useState<"idle" | "pending" | "paid">("idle");
  const [statusSnapshot, setStatusSnapshot] = useState<PaymentStatusSnapshot | null>(null);

  const resolvedAmount = useMemo(() => {
    if (customAmount.trim().length > 0) {
      const parsed = Number(customAmount);
      if (!Number.isNaN(parsed) && parsed > 0) return parsed;
    }
    return amount;
  }, [amount, customAmount]);

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
      ["Pey transactionId", shortId(statusSnapshot?.providerTransactionId)],
      ["CoDi QR ID", shortId(statusSnapshot?.codiQrId ?? checkout.codiQrId)],
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
    ctx.fillText("Échale · Confirmado por CoDi vía Pey", 64, 635);

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `comprobante-${slug}-${Date.now()}.png`;
    link.click();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 md:items-center md:p-8">
      <div
        data-testid="support-modal-panel"
        className="h-auto max-h-[92dvh] w-full overflow-auto rounded-t-xl border border-line bg-paper p-5 shadow-card md:max-h-[90vh] md:max-w-xl md:rounded-xl md:p-7"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-h2 text-ink">
              Apoyar a {personName}
            </h3>
            <p className="mt-0.5 text-small text-ink-2">Pagas con CoDi desde tu banco · sin comisión</p>
          </div>
          <button
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink-2 transition hover:bg-black/5"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!checkout ? (
          <div className="space-y-4 pb-20">
            <p className="text-body text-ink-2">
              Elige cuánto quieres dar. Te mostramos un QR para pagar desde tu app bancaria.
            </p>

            <div className="grid grid-cols-4 gap-2">
              {amountOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setAmount(option);
                    setCustomAmount("");
                  }}
                  className={`min-h-11 rounded-md border px-3 py-2 text-center text-small font-semibold transition ${
                    amount === option && customAmount.length === 0
                      ? "border-ink bg-ink text-white"
                      : "border-line bg-white text-ink-2 hover:border-ink-2/40"
                  }`}
                >
                  {formatCurrency(option)}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-small font-medium text-ink">Otro monto</label>
              <Input
                inputMode="decimal"
                placeholder="Ej. 350"
                value={customAmount}
                onChange={(event) => setCustomAmount(event.target.value)}
              />
            </div>

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
                  <label className="text-small font-medium text-ink">Tu nombre (opcional)</label>
                  <Input
                    placeholder="Como quieras aparecer"
                    value={donorName}
                    onChange={(event) => setDonorName(event.target.value)}
                    maxLength={80}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-small font-medium text-ink">Mensaje (opcional)</label>
                  <Textarea
                    placeholder={`Buen viaje, ${personName.split(" ")[0]}`}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    maxLength={180}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-small font-medium text-ink">
                    Recibir la solicitud en mi celular (opcional)
                  </label>
                  <Input
                    placeholder="5512345678"
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value.replace(/[^\d]/g, "").slice(0, 10))
                    }
                    maxLength={10}
                  />
                </div>
              </div>
            </details>

            {error ? (
              <p className="rounded-md bg-rose-50 p-3 text-small text-rose-700">{error}</p>
            ) : null}

            <div className="sticky bottom-0 -mx-5 mt-4 border-t border-line bg-paper px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
              <Button className="w-full" size="lg" onClick={submitSupport} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando cobro...
                  </>
                ) : (
                  <>Apoyar con CoDi · {formatCurrency(resolvedAmount)}</>
                )}
              </Button>
            </div>
          </div>
        ) : status === "paid" ? (
          <div className="space-y-5 text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h4 className="text-h2 text-ink">¡Gracias por echar la mano!</h4>
            <p className="text-small text-ink-2">
              Tu apoyo ya se registró y la meta se actualizó en tiempo real.
            </p>
            <p className="rounded-md bg-white px-4 py-3 text-body font-semibold text-rosa shadow-card">
              Aporte confirmado: {formatCurrency(resolvedAmount)}
            </p>
            <div className="rounded-md border border-line bg-white p-4 text-left text-small text-ink-2 shadow-card">
              <p className="mb-2 text-small font-semibold text-ink">Comprobante</p>
              <div className="space-y-1">
                <p>
                  <span className="font-medium">Monto:</span> {formatCurrency(resolvedAmount)}
                </p>
                <p>
                  <span className="font-medium">Historia:</span> {storyTitle}
                </p>
                <p>
                  <span className="font-medium">Fecha (CDMX):</span>{" "}
                  {mexicoDateTime(statusSnapshot?.paidAt)}
                </p>
                <p>
                  <span className="font-medium">Pey transactionId:</span>{" "}
                  {shortId(statusSnapshot?.providerTransactionId)}
                </p>
                <p>
                  <span className="font-medium">CoDi QR ID:</span>{" "}
                  {shortId(statusSnapshot?.codiQrId ?? checkout?.codiQrId)}
                </p>
                <p>
                  <span className="font-medium">Gestionado por:</span> {organizationName}
                </p>
              </div>
            </div>
            <div className="grid gap-2">
              <Button variant="outline" className="w-full" onClick={downloadReceiptPng}>
                Descargar comprobante
              </Button>
              <Button className="w-full" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-small text-ink-2">
                Vas a apoyar con{" "}
                <strong className="font-display text-2xl tabular-nums text-rosa">
                  {formatCurrency(resolvedAmount)}
                </strong>
              </p>
              <ol className="mt-3 space-y-2 text-[15px] leading-relaxed text-ink-2">
                <li>
                  <span className="mr-2 font-semibold text-rosa">1.</span>Abre tu app bancaria.
                </li>
                <li>
                  <span className="mr-2 font-semibold text-rosa">2.</span>Escanea este QR CoDi.
                </li>
                <li>
                  <span className="mr-2 font-semibold text-rosa">3.</span>Confirma tu pago.
                </li>
              </ol>
              <div className="mt-4 flex justify-center">
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt="Código QR CoDi"
                    className="h-60 w-60 rounded-md bg-white p-4"
                  />
                ) : (
                  <div className="grid h-60 w-60 place-items-center rounded-md bg-[#efe8dc] text-ink-2">
                    Cargando QR...
                  </div>
                )}
              </div>
              <div className="mt-4 hidden [@media(pointer:coarse)]:block">
                <Button variant="outline" className="h-12 w-full" onClick={saveQrToPhotos}>
                  Guardar QR en mis fotos
                </Button>
                <p className="mt-2 text-small text-ink-2">
                  Luego ábrelo en tu app bancaria: CoDi → Pagar con QR → elegir de la galería.
                </p>
              </div>
              <p className="mt-3 text-center font-mono text-small text-ink-2">
                Referencia {checkout.codiQrId}
              </p>
              <p className="mt-2 inline-flex items-center gap-2 text-small text-ink-2">
                <Loader2 className="h-4 w-4 animate-spin text-rosa" />
                Esperando tu pago…
              </p>
            </div>

            {checkout.paymentLink ? (
              <a
                href={checkout.paymentLink}
                target="_blank"
                rel="noreferrer"
                className="block rounded-md border border-line bg-white p-3 text-small font-medium text-ink hover:bg-black/5"
              >
                Abrir en app bancaria
              </a>
            ) : null}

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
    </div>
  );
}
