"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();
  const showCreateLink = pathname !== "/crear";

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 md:h-[72px] md:px-8">
        <Link
          href="/"
          aria-label="Échale, inicio"
          className="inline-flex min-h-11 items-center font-display text-[28px] font-bold tracking-[-0.02em] text-ink md:text-[32px]"
        >
          <span className="text-rosa">É</span>chale
        </Link>

        <nav className="hidden items-center gap-6 text-[15px] font-medium text-ink md:flex">
          <Link href="/#historias" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
            Historias
          </Link>
          <Link href="/como-funciona" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
            Cómo funciona
          </Link>
          {showCreateLink ? (
            <Link href="/crear" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
              Crear página
            </Link>
          ) : null}
        </nav>

        {showCreateLink ? (
          <Link
            href="/crear"
            className="inline-flex min-h-11 items-center text-[15px] font-medium text-ink underline-offset-4 hover:underline md:hidden"
          >
            Crear página
          </Link>
        ) : (
          <span className="md:hidden" />
        )}
      </div>
    </header>
  );
}
