import Link from "next/link";
import { Bell, Heart, Search, UserRound } from "lucide-react";

export function SiteHeader() {
  const colors = ["#E4007C", "#FF8A00", "#F6D743", "#1B8A5A"];

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-18 w-full max-w-7xl items-center gap-3 px-4 md:h-20 md:px-8">
        <Link href="/" className="shrink-0 text-3xl font-extrabold text-[#E4007C]">
          Échale
        </Link>

        <label className="hidden flex-1 items-center rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-zinc-500 md:flex">
          <Search className="mr-2 h-4 w-4" />
          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
            placeholder="Busca una historia o causa"
            aria-label="Buscar historias"
          />
        </label>

        <Link
          href="/crear"
          className="hidden h-9 items-center rounded-full bg-[#E4007C] px-4 text-xs font-medium text-white shadow-[0_10px_24px_rgba(228,0,124,0.28)] transition hover:bg-[#c9006d] md:inline-flex"
        >
          + Crear mi página
        </Link>

        <button
          className="grid h-10 w-10 place-items-center rounded-full text-zinc-600 transition hover:bg-zinc-100"
          aria-label="Favoritos"
        >
          <Heart className="h-5 w-5" />
        </button>
        <button
          className="grid h-10 w-10 place-items-center rounded-full text-zinc-600 transition hover:bg-zinc-100"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" />
        </button>
        <button
          className="grid h-10 w-10 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-600"
          aria-label="Perfil"
        >
          <UserRound className="h-5 w-5" />
        </button>
      </div>
      <div className="flex h-10 items-start overflow-hidden border-t border-zinc-100 bg-white px-2 md:px-8">
        {Array.from({ length: 30 }).map((_, index) => {
          const color = colors[index % colors.length];
          return (
            <span
              key={index}
              className="relative mx-0.5 mt-0.5 h-8 w-8 rounded-b-md"
              style={{ backgroundColor: color }}
            >
              <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/85" />
            </span>
          );
        })}
      </div>
    </header>
  );
}
