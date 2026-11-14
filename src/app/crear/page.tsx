import Link from "next/link";

import { CreateStoryForm } from "@/components/create-story/create-story-form";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";

export default function CreateStoryPage() {
  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl space-y-4 px-4 py-6 md:px-8">
        <section className="space-y-3 pb-2">
          <h1 className="text-display text-ink">Cuéntanos tu historia</h1>
          <p className="text-body text-ink-2">Una organización aliada la revisa antes de publicarla.</p>
          <p className="text-small text-ink-2">
            ¿Eres organización aliada?{" "}
            <Link
              href="/admin/login"
              className="inline-flex min-h-11 items-center font-semibold text-ink hover:text-rosa"
            >
              Entra al panel
            </Link>
          </p>
        </section>
        <CreateStoryForm />
      </main>
      <SiteFooter />
    </div>
  );
}
