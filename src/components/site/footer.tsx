import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-0 border-t border-line bg-paper">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
        <p className="font-display text-[28px] font-bold tracking-[-0.02em] text-ink">
          <span className="text-rosa" style={{ fontVariationSettings: '"SOFT" 50, "WONK" 1' }}>É</span>chale
        </p>
        <p className="mt-1 text-small text-ink-2">Apoyo directo, con nombre y apellido.</p>
        <nav className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-small font-medium text-ink-2">
          <Link href="/demo" className="inline-flex min-h-11 items-center hover:text-ink">
            Demo en vivo
          </Link>
          <Link href="/como-funciona" className="inline-flex min-h-11 items-center hover:text-ink">
            Cómo funciona
          </Link>
          <Link href="/crear" className="inline-flex min-h-11 items-center hover:text-ink">
            Crea una página
          </Link>
          <Link href="/admin/login" className="inline-flex min-h-11 items-center hover:text-ink">
            Acceso para organizaciones
          </Link>
          <Link href="/org/camino-a-casa" className="inline-flex min-h-11 items-center hover:text-ink">
            Albergue Camino a Casa
          </Link>
          <Link href="/org/comunidad-sana" className="inline-flex min-h-11 items-center hover:text-ink">
            Comunidad Sana
          </Link>
          <Link href="/org/cuarto-firme" className="inline-flex min-h-11 items-center hover:text-ink">
            Cuarto Firme
          </Link>
        </nav>
        <p className="mt-4 max-w-[62ch] text-small text-ink-2">
          Demo del Hackatón Cursor CDMX: historias y organizaciones ilustrativas; el pago con CoDi es real.
        </p>
        <p className="mt-2 text-[13px] text-ink-2">© 2026 Échale</p>
      </div>
    </footer>
  );
}
