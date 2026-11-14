import Link from "next/link";

import { CreateStoryForm } from "@/components/create-story/create-story-form";
import { SiteHeader } from "@/components/site/header";

export default function CreateStoryPage() {
  return (
    <div className="min-h-screen bg-[#fcfcfd]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl space-y-5 px-4 py-6 md:px-8">
        <section className="rounded-3xl border border-[#ffd6ea] bg-gradient-to-br from-[#fff3f9] via-white to-[#fff8ef] p-6 md:p-8">
          <p className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-[#E4007C]">
            Crea tu página
          </p>
          <h1 className="mt-3 text-4xl font-black leading-tight text-zinc-900">
            Cuéntanos tu historia y la revisamos contigo
          </h1>
          <p className="mt-2 text-zinc-600">
            En Échale, las páginas públicas se gestionan por una organización aliada para cuidar
            la transparencia. Tu información entra en revisión antes de publicarse.
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            ¿Ya tienes acceso de organización?{" "}
            <Link href="/admin/login" className="text-[#E4007C] hover:underline">
              Entrar a admin
            </Link>
          </p>
        </section>
        <CreateStoryForm />
      </main>
    </div>
  );
}
