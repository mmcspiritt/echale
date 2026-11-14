"use client";

import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { Loader2, Phone, Sparkles, X } from "lucide-react";
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

export function SupportModal({
  slug,
  personName,
  initialAmount,
  onClose,
  onPaid,
}: {
  slug: string;
  personName: string;
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
      const data = (await response.json()) as { status: string };
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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/40 p-0 backdrop-blur-[2px] md:items-center md:p-8">
      <div
        data-testid="support-modal-panel"
        className="max-h-[95vh] w-full overflow-auto rounded-t-3xl bg-white p-5 shadow-2xl md:max-w-xl md:rounded-3xl md:p-7"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-zinc-900">Apoyar a {personName}</h3>
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
            <p className="text-sm text-zinc-600">
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
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 shadow-[0_0_0_10px_rgba(16,185,129,0.12)]">
              <Sparkles className="h-10 w-10 text-emerald-600" />
            </div>
            <h4 className="text-3xl font-black text-zinc-900">¡Gracias por echar la mano!</h4>
            <p className="text-zinc-600">
              Tu apoyo ya se registró y la meta se actualizó en tiempo real.
            </p>
            <p className="rounded-2xl bg-[#fff0f8] px-4 py-3 text-lg font-semibold text-[#E4007C]">
              Aporte confirmado: {formatCurrency(resolvedAmount)}
            </p>
            <Button className="w-full" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="mb-3 flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                <p className="text-sm text-zinc-600">Monto elegido</p>
                <p className="text-2xl font-black text-[#E4007C]">{formatCurrency(resolvedAmount)}</p>
              </div>
              <p className="text-sm text-zinc-600">
                Escanea el código con tu app bancaria para completar el apoyo:
              </p>
              <div className="relative mt-4 flex justify-center">
                <span className="absolute mt-5 h-56 w-56 animate-ping rounded-2xl bg-[#E4007C]/6" />
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
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#fff0f8] px-3 py-1 text-xs font-medium text-[#a5005a]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Esperando confirmación de tu banco
              </div>
            </div>

            {checkout.paymentLink ? (
              <a
                href={checkout.paymentLink}
                target="_blank"
                rel="noreferrer"
                className="block rounded-2xl border border-zinc-200 p-3 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                Abrir liga de pago
              </a>
            ) : null}

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
