"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { categories } from "@/lib/categories";
import { StoryCategory } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface FormMilestone {
  label: string;
  targetAmount: number;
}

const presetImages = [
  { label: "Oaxaca · Reconstrucción", value: "/images/lupita-oaxaca.jpg" },
  { label: "Hospital · Salud", value: "/images/javier-hospital.jpg" },
  { label: "Terminal · Regresar a casa", value: "/images/ramiro-terminal.jpg" },
];

const defaultMilestones: FormMilestone[] = [
  { label: "Meta inicial", targetAmount: 5000 },
  { label: "Meta intermedia", targetAmount: 12000 },
  { label: "Meta final", targetAmount: 20000 },
];

export function CreateStoryForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    slug: string;
    previewPath: string;
    codiStatus: string;
  } | null>(null);

  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState<StoryCategory>("sismo");
  const [story, setStory] = useState("");
  const [goalAmount, setGoalAmount] = useState("20000");
  const [milestones, setMilestones] = useState<FormMilestone[]>(defaultMilestones);
  const [photoUrl, setPhotoUrl] = useState(presetImages[0].value);
  const [clabe, setClabe] = useState("");
  const [entity, setEntity] = useState<"PERSON" | "BUSINESS">("PERSON");
  const [taxId, setTaxId] = useState("");

  const canContinueStep1 =
    beneficiaryName.trim().length > 1 &&
    accountHolderName.trim().length > 1 &&
    contactEmail.includes("@");
  const canContinueStep2 =
    city.trim().length > 1 && story.trim().length >= 50 && Number(goalAmount) >= 100;
  const canContinueStep3 =
    milestones.every(
      (milestone) =>
        milestone.label.trim().length > 1 &&
        Number.isFinite(milestone.targetAmount) &&
        milestone.targetAmount > 0 &&
        milestone.targetAmount <= Number(goalAmount || "0"),
    ) && photoUrl.startsWith("/");
  const canSubmit = canContinueStep3 && clabe.replace(/\D/g, "").length === 18;

  const milestoneProgress = useMemo(() => {
    const total = Number(goalAmount || "0");
    if (total <= 0) return [0, 0, 0];
    return milestones.map((item) => Math.min(100, Math.round((item.targetAmount / total) * 100)));
  }, [goalAmount, milestones]);

  function updateMilestone(index: number, patch: Partial<FormMilestone>) {
    setMilestones((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    );
  }

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          beneficiaryName,
          accountHolderName,
          contactEmail,
          city,
          category,
          story,
          goalAmount: Number(goalAmount),
          milestones,
          photoUrl,
          clabe: clabe.replace(/\D/g, ""),
          entity,
          taxId: taxId.trim() || null,
        }),
      });
      const result = (await response.json()) as
        | { slug: string; previewPath: string; codiStatus: string }
        | { error: string; details?: string };
      if (!response.ok) {
        const detail = "details" in result && result.details ? `: ${result.details}` : "";
        throw new Error(("error" in result ? result.error : "Error inesperado") + detail);
      }
      setSuccess(result as { slug: string; previewPath: string; codiStatus: string });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No pudimos crear tu página. Inténtalo de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <section className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-black text-zinc-900">¡Tu página ya está en revisión!</h2>
          <p className="text-zinc-600">
            Nuestro equipo aliado revisará la solicitud. Te avisaremos por correo cuando quede
            aprobada.
          </p>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-left text-sm text-zinc-700">
            <p>
              <span className="font-semibold">URL preliminar:</span> /{success.slug}
            </p>
            <p className="mt-1">
              <span className="font-semibold">Preview privado:</span> {success.previewPath}
            </p>
            <p className="mt-1">
              <span className="font-semibold">Estado CoDi:</span> {success.codiStatus}
            </p>
          </div>
          <a
            href={success.previewPath}
            className="inline-flex rounded-full bg-[#E4007C] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(228,0,124,0.28)]"
          >
            Ver mi página de vista previa
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm md:p-8">
      <div className="mb-6 grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className={`h-2 rounded-full ${
              index <= step ? "bg-[#E4007C]" : "bg-zinc-200"
            }`}
          />
        ))}
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-900">1) ¿Quién necesita apoyo?</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm text-zinc-600">Nombre de la persona</label>
              <Input value={beneficiaryName} onChange={(event) => setBeneficiaryName(event.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-zinc-600">Nombre titular de la cuenta</label>
              <Input
                value={accountHolderName}
                onChange={(event) => setAccountHolderName(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-zinc-600">Correo de contacto</label>
            <Input
              type="email"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!canContinueStep1}>
              Continuar
            </Button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-900">2) Cuenta tu historia</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm text-zinc-600">Ciudad</label>
              <Input value={city} onChange={(event) => setCity(event.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-zinc-600">Categoría</label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as StoryCategory)}
                className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#E4007C]"
              >
                {categories.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-zinc-600">Historia (mínimo 50 caracteres)</label>
            <Textarea value={story} onChange={(event) => setStory(event.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-zinc-600">Meta total (MXN)</label>
            <Input
              type="number"
              min={100}
              value={goalAmount}
              onChange={(event) => setGoalAmount(event.target.value)}
            />
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              Atrás
            </Button>
            <Button onClick={() => setStep(3)} disabled={!canContinueStep2}>
              Continuar
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-900">3) Foto y metas</h2>
          <div className="space-y-2">
            <p className="text-sm text-zinc-600">Elige una foto de ejemplo para tu página</p>
            <div className="grid gap-2 md:grid-cols-3">
              {presetImages.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setPhotoUrl(item.value)}
                  className={`rounded-2xl border px-3 py-2 text-left text-sm transition ${
                    photoUrl === item.value
                      ? "border-[#E4007C] bg-[#fff0f8] text-[#E4007C]"
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
            <p className="text-sm font-semibold text-zinc-800">Define 3 hitos de avance</p>
            {milestones.map((milestone, index) => (
              <div key={index} className="grid gap-2 md:grid-cols-[1.5fr_1fr]">
                <Input
                  value={milestone.label}
                  onChange={(event) => updateMilestone(index, { label: event.target.value })}
                />
                <Input
                  type="number"
                  min={1}
                  value={milestone.targetAmount}
                  onChange={(event) =>
                    updateMilestone(index, { targetAmount: Number(event.target.value || "0") })
                  }
                />
              </div>
            ))}
            <div className="grid gap-2 md:grid-cols-3">
              {milestoneProgress.map((percent, index) => (
                <p key={index} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600">
                  Meta {index + 1}: {formatCurrency(milestones[index].targetAmount)} ({percent}%)
                </p>
              ))}
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              Atrás
            </Button>
            <Button onClick={() => setStep(4)} disabled={!canContinueStep3}>
              Continuar
            </Button>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-900">4) Cuenta bancaria en Pey</h2>
          <p className="text-sm text-zinc-600">
            Registraremos esta cuenta para CoDi. Banxico puede tardar hasta 5 días hábiles en
            activarla.
          </p>
          <div className="space-y-1">
            <label className="text-sm text-zinc-600">CLABE (18 dígitos)</label>
            <Input
              inputMode="numeric"
              maxLength={18}
              value={clabe}
              onChange={(event) => setClabe(event.target.value.replace(/[^\d]/g, "").slice(0, 18))}
              placeholder="012180001234567899"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm text-zinc-600">Tipo de titular</label>
              <select
                value={entity}
                onChange={(event) => setEntity(event.target.value as "PERSON" | "BUSINESS")}
                className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#E4007C]"
              >
                <option value="PERSON">Persona física</option>
                <option value="BUSINESS">Persona moral</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-zinc-600">RFC (opcional)</label>
              <Input value={taxId} onChange={(event) => setTaxId(event.target.value.toUpperCase())} />
            </div>
          </div>

          {error ? <p className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(3)}>
              Atrás
            </Button>
            <Button onClick={submit} disabled={!canSubmit || loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar a revisión"
              )}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
