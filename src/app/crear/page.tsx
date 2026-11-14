import Link from "next/link";
import Image from "next/image";

import { CreateStoryForm } from "@/components/create-story/create-story-form";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";

export default function CreateStoryPage() {
  return (
    <div className="min-h-screen bg-[#fcfcfd]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-8">
        <section className="grid gap-5 rounded-3xl border border-zinc-200 bg-gradient-to-br from-[#fff7fc] via-white to-[#fffaf4] p-6 shadow-sm md:grid-cols-[1.2fr_0.8fr] md:p-8">
          <div>
            <p className="inline-flex rounded-full border border-[#f7c6df] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-[#E4007C]">
            Crea tu página
          </p>
            <h1 className="mt-3 text-balance text-4xl font-black leading-[1.05] tracking-[-0.03em] text-zinc-900">
            Cuéntanos tu historia y la revisamos contigo
          </h1>
            <p className="mt-3 text-base leading-relaxed text-zinc-600">
            En Échale, las páginas públicas se gestionan por una organización aliada para cuidar
            la transparencia. Tu información entra en revisión antes de publicarse.
          </p>
            <p className="mt-3 text-sm text-zinc-500">
            ¿Ya tienes acceso de organización?{" "}
            <Link href="/admin/login" className="text-[#E4007C] hover:underline">
              Entrar a admin
            </Link>
          </p>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-white/80 bg-zinc-100">
            <Image
              src="/images/lupita-oaxaca.jpg"
              alt="Historia comunitaria en México"
              fill
              sizes="(max-width: 768px) 100vw, 35vw"
              className="object-cover"
            />
            <div className="absolute inset-x-3 bottom-3 rounded-xl bg-white/92 p-3 text-xs text-zinc-700 backdrop-blur">
              Publicación revisada por organización aliada · Pagos con CoDi® vía Pey
            </div>
          </div>
        </section>
        <CreateStoryForm />
      </main>
      <SiteFooter />
    </div>
  );
}
