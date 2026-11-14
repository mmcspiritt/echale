import Link from "next/link";

import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="text-display text-balance text-ink">
          Ups, esta página ya no existe
        </h1>
        <p className="mt-3 text-body text-ink-2">
          Revisa el enlace o mira las historias que siguen activas.
        </p>
        <Link href="/" className="mt-6">
          <Button>Volver a historias</Button>
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
