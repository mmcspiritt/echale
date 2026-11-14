"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { loginAdminAction } from "@/app/admin/actions";
import { SiteFooter } from "@/components/site/footer";
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
    <div className="min-h-screen bg-paper">
      <main className="mx-auto flex w-full max-w-md items-center px-5 py-12">
        <div className="w-full rounded-xl border border-line bg-white p-7 shadow-card">
          <h1 className="text-h2 text-ink">Panel de organización</h1>
          <p className="mt-2 text-body text-ink-2">
            Ingresa la contraseña compartida para gestionar historias y pagos.
          </p>

          <form action={formAction} className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-small font-medium text-ink">Contraseña</label>
              <Input name="password" type="password" required autoFocus />
            </div>
            {state.error ? (
              <p className="rounded-md bg-rose-50 p-3 text-small text-rose-700">{state.error}</p>
            ) : null}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Entrando..." : "Entrar al panel"}
            </Button>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
