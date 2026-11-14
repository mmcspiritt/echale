import { HowItWorksSection } from "@/components/site/how-it-works-section";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-8">
        <section className="space-y-3 border-b border-line pb-6">
          <h1 className="text-display text-balance text-ink">¿Cómo funciona Échale?</h1>
          <p className="max-w-[70ch] text-body text-ink-2">
            Una organización revisa cada historia, tú apoyas con CoDi desde tu banco y ves el avance
            al momento.
          </p>
        </section>
        <HowItWorksSection compact={false} />
      </main>
      <SiteFooter />
    </div>
  );
}
