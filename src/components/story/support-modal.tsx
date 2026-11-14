"use client";

import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { CheckCircle2, Loader2, Phone, X } from "lucide-react";
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

    ctx.fillStyle = "#fff8fc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#111827";
    ctx.font = "700 54px Poppins, sans-serif";
    ctx.fillText("Comprobante de apoyo", 64, 110);
    ctx.fillStyle = "#E4007C";
    ctx.font = "800 68px Poppins, sans-serif";
    ctx.fillText(formatCurrency(resolvedAmount), 64, 205);

    const rows = [
      ["Historia", storyTitle],
      ["Beneficiario", personName],
      ["Fecha (CDMX)", mexicoDateTime(statusSnapshot?.paidAt)],
      ["Pey transactionId", shortId(statusSnapshot?.providerTransactionId)],
      ["CoDi QR ID", shortId(statusSnapshot?.codiQrId ?? checkout.codiQrId)],
      ["Gestionado por", organizationName],
    ];

    ctx.font = "600 28px Poppins, sans-serif";
    rows.forEach(([label, value], index) => {
      const y = 280 + index * 58;
      ctx.fillStyle = "#6B7280";
      ctx.fillText(`${label}:`, 64, y);
      ctx.fillStyle = "#111827";
      ctx.fillText(value, 360, y);
    });

    ctx.fillStyle = "#6B7280";
    ctx.font = "500 24px Poppins, sans-serif";
    ctx.fillText("Échale · Confirmado por CoDi vía Pey", 64, 635);

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `comprobante-${slug}-${Date.now()}.png`;
    link.click();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/45 p-0 backdrop-blur-[2px] md:items-center md:p-8">
      <div
        data-testid="support-modal-panel"
        className="max-h-[95vh] w-full overflow-auto rounded-t-3xl bg-white p-5 shadow-2xl md:max-w-xl md:rounded-3xl md:p-7"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-semibold tracking-[-0.02em] text-zinc-900">
              Apoyar a {personName}
            </h3>
            <p className="mt-0.5 text-sm text-zinc-500">Pago seguro con CoDi® vía Pey</p>
          </div>
          <button
            className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!checkout ? (
          <div className="space-y-4">
            <p className="text-base leading-relaxed text-zinc-600">
              Elige un monto, agrega un mensaje si quieres y generamos tu cobro CoDi al instante.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {amountOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setAmount(option);
                    setCustomAmount("");
                  }}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                    amount === option && customAmount.length === 0
                      ? "border-[#E4007C] bg-[#fff0f8] text-[#E4007C]"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                  }`}
                >
                  {formatCurrency(option)}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Otro monto</label>
              <Input
                inputMode="decimal"
                placeholder="Ej. 350"
                value={customAmount}
                onChange={(event) => setCustomAmount(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Tu nombre (opcional)</label>
              <Input
                placeholder="Como quieras que aparezca"
                value={donorName}
                onChange={(event) => setDonorName(event.target.value)}
                maxLength={80}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Mensaje (opcional)</label>
              <Textarea
                placeholder="Un mensaje de ánimo siempre ayuda 💗"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={180}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">
                Teléfono 10 dígitos (opcional para push CoDi)
              </label>
              <Input
                placeholder="5512345678"
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/[^\d]/g, "").slice(0, 10))}
                maxLength={10}
              />
            </div>

            {error ? (
              <p className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
            ) : null}

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
        ) : status === "paid" ? (
          <div className="space-y-5 text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 shadow-[0_0_0_14px_rgba(16,185,129,0.12)]">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h4 className="text-3xl font-black text-zinc-900">¡Gracias por echar la mano!</h4>
            <p className="text-zinc-600">
              Tu apoyo ya se registró y la meta se actualizó en tiempo real.
            </p>
            <p className="rounded-2xl bg-[#fff0f8] px-4 py-3 text-lg font-semibold text-[#E4007C]">
              Aporte confirmado: {formatCurrency(resolvedAmount)}
            </p>
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-left text-sm text-zinc-700">
              <p className="mb-2 text-sm font-semibold text-zinc-900">Comprobante</p>
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
            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="mb-3 flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                <p className="text-sm text-zinc-600">Monto elegido</p>
                <p className="text-2xl font-black text-[#E4007C]">{formatCurrency(resolvedAmount)}</p>
              </div>
              <p className="text-sm text-zinc-600">
                1) Abre tu app bancaria 2) Escanea este QR CoDi 3) Confirma tu pago.
              </p>
              <div className="relative mt-4 flex justify-center">
                <span className="absolute mt-5 h-56 w-56 animate-ping rounded-2xl bg-[#E4007C]/8" />
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt="Código QR CoDi"
                    className="relative h-56 w-56 rounded-2xl border border-zinc-200 bg-white p-3 shadow-lg"
                  />
                ) : (
                  <div className="grid h-56 w-56 place-items-center rounded-2xl border border-zinc-200 bg-white text-zinc-400">
                    Cargando QR...
                  </div>
                )}
              </div>
              <p className="mt-3 text-center text-xs text-zinc-500">
                Referencia #{checkout.codiQrId} · Esperando confirmación...
              </p>
              <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#fff0f8] px-3 py-1 text-xs font-medium text-[#a5005a]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Estado: esperando pago
              </p>
            </div>

            {checkout.paymentLink ? (
              <a
                href={checkout.paymentLink}
                target="_blank"
                rel="noreferrer"
                className="block rounded-2xl border border-zinc-200 bg-white p-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Abrir en app bancaria
              </a>
            ) : (
              <p className="text-xs text-zinc-500">
                Si tu banco lo permite, también puedes completar desde el enlace de pago.
              </p>
            )}

            <div className="rounded-2xl border border-zinc-200 p-3 text-sm text-zinc-600">
              <p className="font-medium text-zinc-800">¿Prefieres push a tu celular?</p>
              <p className="mt-1 inline-flex items-center gap-1">
                <Phone className="h-4 w-4" /> Si pusiste número, enviamos la solicitud automáticamente.
              </p>
            </div>

            {checkout.mode === "mock" ? (
              <Button variant="secondary" className="w-full" onClick={simulatePayment}>
                Simular pago exitoso (demo)
              </Button>
            ) : null}

            <Button variant="ghost" className="w-full" onClick={onClose}>
              Cerrar por ahora
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
