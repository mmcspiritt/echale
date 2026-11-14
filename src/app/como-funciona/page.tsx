import { HowItWorksSection } from "@/components/site/how-it-works-section";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen bg-[#fcfcfd]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-8">
        <section className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-[#fff8fc] via-white to-[#fffaf4] p-6 shadow-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Guía rápida
          </p>
          <h1 className="mt-2 text-balance text-4xl font-black tracking-[-0.03em] text-zinc-900 md:text-5xl">
            ¿Cómo funciona Échale?
          </h1>
          <p className="mt-3 text-base leading-relaxed text-zinc-600">
            Un flujo transparente para apoyar metas solidarias con CoDi® vía Pey y seguimiento en
            tiempo real.
          </p>
        </section>
        <HowItWorksSection />
      </main>
      <SiteFooter />
    </div>
  );
}
