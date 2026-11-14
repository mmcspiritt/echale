import Link from "next/link";

import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#fcfcfd]">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center px-6 py-20 text-center">
        <p className="rounded-full bg-[#fff0f8] px-4 py-1 text-sm font-medium text-[#E4007C]">
          Historia no encontrada
        </p>
        <h1 className="mt-4 text-balance text-4xl font-black tracking-[-0.03em] text-zinc-900">
          Ups, esta página ya no existe
        </h1>
        <p className="mt-3 text-base leading-relaxed text-zinc-600">
          Puede que la historia se haya movido o que el enlace esté incompleto. Regresa al inicio
          para explorar otras historias activas.
        </p>
        <Link href="/" className="mt-6">
          <Button>Volver a historias</Button>
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
