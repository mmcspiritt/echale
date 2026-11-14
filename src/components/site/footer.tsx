import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-14 border-t border-zinc-200/80 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-8">
        <div>
          <p className="text-xl font-extrabold tracking-tight text-[#E4007C]">Échale</p>
          <p className="mt-1 max-w-[55ch] text-sm text-zinc-600">
            Metas solidarias gestionadas por organizaciones aliadas, con pagos CoDi® vía Pey y
            confirmación en tiempo real.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-zinc-600">
          <Link href="/como-funciona" className="transition hover:text-zinc-900">
            Cómo funciona
          </Link>
          <Link href="/crear" className="transition hover:text-zinc-900">
            Crea tu página
          </Link>
          <Link href="/admin/login" className="transition hover:text-zinc-900">
            Organizaciones aliadas / admin
          </Link>
          <span className="text-zinc-500">Pagos con CoDi® vía Pey</span>
          <span className="text-zinc-500">Hecho en CDMX con Cursor</span>
        </nav>
      </div>
    </footer>
  );
}
