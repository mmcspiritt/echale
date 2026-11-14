import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-100 bg-white/92 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 md:h-20 md:px-8">
        <Link href="/" className="shrink-0 text-2xl font-extrabold text-[#E4007C] md:text-3xl">
          Échale
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-zinc-600 md:flex">
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
          className="inline-flex h-9 items-center rounded-full bg-[#E4007C] px-4 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(228,0,124,0.24)] transition hover:bg-[#c9006d] md:hidden"
        >
          Crea tu página
        </Link>
      </div>
      <div aria-hidden className="border-t border-zinc-100">
        <svg
          viewBox="0 0 320 24"
          preserveAspectRatio="none"
          className="h-4 w-full opacity-55 md:h-5"
          role="presentation"
        >
          <defs>
            <pattern id="papel-picado-pattern" x="0" y="0" width="80" height="24" patternUnits="userSpaceOnUse">
              <path d="M0 0h80v6H0z" fill="#ffffff" />
              <path d="M2 6h16v12l-8 5-8-5z" fill="#fce7f3" />
              <path d="M22 6h16v12l-8 5-8-5z" fill="#ffedd5" />
              <path d="M42 6h16v12l-8 5-8-5z" fill="#fef9c3" />
              <path d="M62 6h16v12l-8 5-8-5z" fill="#dcfce7" />
              <circle cx="10" cy="12" r="1.2" fill="#f9a8d4" />
              <circle cx="30" cy="12" r="1.2" fill="#fdba74" />
              <circle cx="50" cy="12" r="1.2" fill="#facc15" />
              <circle cx="70" cy="12" r="1.2" fill="#4ade80" />
            </pattern>
          </defs>
          <rect width="320" height="24" fill="url(#papel-picado-pattern)" />
        </svg>
      </div>
    </header>
  );
}
