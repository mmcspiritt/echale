import Link from "next/link";

const steps = [
  {
    step: "01",
    title: "La organización aliada verifica la historia",
    copy: "Antes de publicarse, cada caso pasa por revisión para cuidar transparencia y confianza.",
  },
  {
    step: "02",
    title: "Eliges monto y escaneas el QR CoDi",
    copy: "Apoyas desde tu app bancaria, sin tarjeta y sin comisiones para quien dona.",
  },
  {
    step: "03",
    title: "El dinero llega directo por Pey",
    copy: "El pago se enruta a la cuenta receptora del beneficiario, en segundos.",
  },
  {
    step: "04",
    title: "La página se actualiza en vivo",
    copy: "El webhook firmado confirma el pago y cada peso queda etiquetado por persona.",
  },
];

const faqs = [
  {
    question: "¿Qué es CoDi?",
    answer: "CoDi® es la infraestructura de cobros digitales impulsada por Banxico.",
  },
  {
    question: "¿Quién recibe el dinero?",
    answer: "La cuenta receptora mostrada en cada historia, vinculada en Pey.",
  },
  {
    question: "¿Por qué hay una organización aliada?",
    answer:
      "Para verificar historias, acompañar a beneficiarios y mantener trazabilidad del apoyo.",
  },
  {
    question: "¿Cuánto cobran?",
    answer: "Échale no agrega comisión a quien dona en esta experiencia de hackathon.",
  },
];

export function HowItWorksSection({ compact = false }: { compact?: boolean }) {
  return (
    <section
      id="como-funciona"
      className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm md:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Cómo funciona
          </p>
          <h2 className="text-2xl font-black tracking-[-0.02em] text-zinc-900">
            Apoyo directo, claro y verificable
          </h2>
        </div>
        {compact ? (
          <Link href="/como-funciona" className="text-sm font-semibold text-[#E4007C] hover:underline">
            Ver explicación completa
          </Link>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((item) => (
          <article key={item.step} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs font-semibold tracking-[0.14em] text-[#E4007C]">{item.step}</p>
            <h3 className="mt-1 text-base font-semibold text-zinc-900">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">{item.copy}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {faqs.map((faq) => (
          <article key={faq.question} className="rounded-2xl border border-zinc-200 px-4 py-3">
            <h4 className="text-sm font-semibold text-zinc-900">{faq.question}</h4>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600">{faq.answer}</p>
          </article>
        ))}
      </div>
      <p className="mt-4 text-sm font-medium text-zinc-600">
        Pagos con CoDi® vía Pey · Hecho en CDMX con Cursor.
      </p>
    </section>
  );
}
