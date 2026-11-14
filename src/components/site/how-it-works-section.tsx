import Link from "next/link";

const steps = [
  {
    step: "1",
    title: "La organización aliada revisa la historia",
    copy: "Solo se publica si la organización conoce a la persona en persona.",
  },
  {
    step: "2",
    title: "Compartes la historia",
    copy: "Cada una tiene su enlace corto y un cartel con QR para mandar por WhatsApp o pegar en la tienda.",
  },
  {
    step: "3",
    title: "La gente apoya con CoDi desde su banco",
    copy: "El dinero llega directo a la cuenta de la persona. Sin comisión para quien apoya.",
  },
  {
    step: "4",
    title: "La meta se actualiza al momento",
    copy: "Pey nos avisa por webhook firmado en cuanto tu banco confirma. No hay que recargar.",
  },
];

const faqs = [
  {
    question: "¿Qué es CoDi?",
    answer:
      "Es el sistema de cobros del Banco de México. Pagas desde la app de tu banco escaneando un QR, sin tarjeta y sin comisión.",
  },
  {
    question: "¿Quién recibe el dinero?",
    answer:
      "La persona de la historia. En cada página ves a nombre de quién está la cuenta y qué organización la acompaña.",
  },
  {
    question: "¿Por qué hay una organización aliada?",
    answer:
      "Para checar que cada historia sea cierta, acompañar a la persona y que se sepa en qué se fue cada peso.",
  },
  {
    question: "¿Cuánto cobran?",
    answer: "Quien dona no paga comisión. CoDi es gratuito para las personas.",
  },
];

export function HowItWorksSection({ compact = false }: { compact?: boolean }) {
  const visibleFaqs = compact ? faqs.slice(0, 3) : faqs;

  return (
    <section id="como-funciona" className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {compact ? (
          <h2 className="text-h2 text-ink">Así llega tu apoyo</h2>
        ) : (
          <span />
        )}
        {compact ? (
          <Link href="/como-funciona" className="inline-flex min-h-11 items-center text-small font-semibold text-ink hover:text-rosa">
            Ver explicación completa
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {steps.map((item) => (
          <article key={item.step} className="grid grid-cols-[36px_1fr] gap-3 border-b border-line/70 pb-4 last:border-b-0">
            <p className="font-display text-3xl text-ink-2">{item.step}</p>
            <div>
              <h3 className="text-h3 text-ink">{item.title}</h3>
              <p className="mt-1 text-small text-ink-2">{item.copy}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {visibleFaqs.map((faq) => (
          <article key={faq.question} className="border-b border-line/70 pb-3">
            <h4 className="text-small font-semibold text-ink">{faq.question}</h4>
            <p className="mt-1 text-small text-ink-2">{faq.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
