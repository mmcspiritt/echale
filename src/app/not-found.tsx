import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-6 text-center">
      <p className="rounded-full bg-[#fff0f8] px-4 py-1 text-sm font-medium text-[#E4007C]">
        Historia no encontrada
      </p>
      <h1 className="mt-4 text-4xl font-black text-zinc-900">Ups, esta página ya no existe</h1>
      <p className="mt-3 text-zinc-600">
        Puede que la historia se haya movido o que el enlace esté incompleto.
      </p>
      <Link href="/" className="mt-6">
        <Button>Volver a historias</Button>
      </Link>
    </main>
  );
}
