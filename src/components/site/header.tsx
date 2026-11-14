import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 md:h-20 md:px-8">
        <Link href="/" className="shrink-0 text-2xl font-extrabold text-[#E4007C] md:text-3xl">
          Échale
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-zinc-700 md:flex">
          <Link href="/como-funciona" className="transition hover:text-zinc-900">
            Cómo funciona
          </Link>
          <Link
            href="/crear"
            className="inline-flex h-10 items-center rounded-full bg-[#E4007C] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(228,0,124,0.28)] transition hover:bg-[#c9006d]"
          >
            Crea tu página
          </Link>
        </nav>

        <Link
          href="/crear"
          className="inline-flex h-9 items-center whitespace-nowrap rounded-full bg-[#E4007C] px-4 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(228,0,124,0.24)] transition hover:bg-[#c9006d] md:hidden"
        >
          Crea tu página
        </Link>
      </div>
    </header>
  );
}
