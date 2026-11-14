"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { loginAdminAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: { error?: string; success?: boolean } = {};

export default function AdminLoginPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(loginAdminAction, initialState);

  useEffect(() => {
    if (state.success) {
      router.push("/admin");
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-5">
      <div className="w-full rounded-3xl border border-zinc-200 bg-white p-7 shadow-lg">
        <h1 className="text-3xl font-black text-zinc-900">Panel de organización</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Ingresa la contraseña compartida para gestionar historias y pagos.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Contraseña</label>
            <Input name="password" type="password" required autoFocus />
          </div>
          {state.error ? (
            <p className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{state.error}</p>
          ) : null}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Entrando..." : "Entrar al panel"}
          </Button>
        </form>
      </div>
    </main>
  );
}
