import Link from "next/link";
import { redirect } from "next/navigation";

import {
  approveStoryAction,
  refreshBankAccountStatusAction,
  rejectStoryAction,
  logoutAdminAction,
  markReleasedAction,
  saveStoryAction,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { categories } from "@/lib/categories";
import { requireAdminAuth } from "@/lib/admin-auth";
import { SiteFooter } from "@/components/site/footer";
import {
  getStoryById,
  listPaymentsWithStory,
  listStoriesWithStats,
} from "@/lib/store";
import { formatCurrency } from "@/lib/utils";

interface AdminPageProps {
  searchParams: Promise<{ story?: string }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  await requireAdminAuth();
  const query = await searchParams;
  const selectedStory = query.story ? await getStoryById(query.story) : null;
  const stories = await listStoriesWithStats();
  const payments = await listPaymentsWithStory();

  async function logout() {
    "use server";
    await logoutAdminAction();
    redirect("/admin/login");
  }

  const initialStory = selectedStory ?? {
    id: "",
    slug: "",
    personName: "",
    title: "",
    summary: "",
    story: "",
    location: "",
    category: "sismo",
    organizationName: "",
    accountHolderName: "",
    clabeMasked: "",
    peyKeyEnv: "PEY_API_KEY",
    clabe: null,
    peyEntity: "PERSON",
    peyTaxId: null,
    bankAccountId: null,
    codiStatus: "UNKNOWN",
    status: "aprobada",
    previewToken: null,
    contactEmail: "",
    goalAmount: 50000,
    coverImage: "",
    galleryImages: [],
    milestones: [],
    isExample: true,
  };

  return (
    <>
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-8">
      <header className="rounded-3xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black text-zinc-900">Admin · Organización aliada</h1>
            <p className="text-sm text-zinc-600">
              Crea historias, revisa cobros y marca fondos entregados.
            </p>
          </div>
          <form action={logout}>
            <Button variant="outline">Cerrar sesión</Button>
          </form>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-zinc-900">Historias</h2>
          <Link href="/admin" className="text-sm text-[#E4007C] hover:underline">
            + Nueva historia
          </Link>
          <div className="space-y-3">
            {stories.map((story) => (
              <Link
                key={story.id}
                href={`/admin?story=${story.id}`}
                className="block rounded-2xl border border-zinc-100 p-3 transition hover:border-[#E4007C]/30 hover:bg-zinc-50"
              >
                <p className="font-semibold text-zinc-900">{story.personName}</p>
                <p className="text-sm text-zinc-500">{story.slug}</p>
                <p className="text-xs text-zinc-600">
                  {formatCurrency(story.amountRaised)} / {formatCurrency(story.goalAmount)}
                </p>
                <p className="text-xs text-zinc-500">
                  {story.accountHolderName} · {story.clabeMasked}
                </p>
                <p className="text-xs text-zinc-500">
                  Estado: <span className="font-medium">{story.status}</span> · CoDi{" "}
                  <span className="font-medium">{story.codiStatus}</span>
                </p>
              </Link>
            ))}
          </div>
          <div className="space-y-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
            <h3 className="text-sm font-semibold text-zinc-800">Moderación</h3>
            {stories.filter((story) => story.status === "en_revision").length === 0 ? (
              <p className="text-xs text-zinc-500">No hay historias pendientes por ahora.</p>
            ) : (
              stories
                .filter((story) => story.status === "en_revision")
                .map((story) => (
                  <div key={`${story.id}-review`} className="rounded-xl border border-zinc-200 bg-white p-3">
                    <p className="text-sm font-semibold text-zinc-900">{story.personName}</p>
                    <p className="text-xs text-zinc-500">/{story.slug}</p>
                    <p className="mt-1 text-xs text-zinc-600">CoDi: {story.codiStatus}</p>
                    <div className="mt-2 flex gap-2">
                      <form action={approveStoryAction}>
                        <input type="hidden" name="storyId" value={story.id} />
                        <Button size="sm" type="submit">
                          Aprobar
                        </Button>
                      </form>
                      <form action={rejectStoryAction}>
                        <input type="hidden" name="storyId" value={story.id} />
                        <Button variant="outline" size="sm" type="submit">
                          Rechazar
                        </Button>
                      </form>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-zinc-900">
            {selectedStory ? "Editar historia" : "Crear historia"}
          </h2>
          <form action={saveStoryAction} className="mt-4 grid gap-3">
            <input name="id" type="hidden" defaultValue={initialStory.id} />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm text-zinc-600">Nombre de la persona</label>
                <Input name="personName" defaultValue={initialStory.personName} required />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-zinc-600">Slug</label>
                <Input name="slug" defaultValue={initialStory.slug} placeholder="lupita" required />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-zinc-600">Título visible</label>
              <Input name="title" defaultValue={initialStory.title} required />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-zinc-600">Resumen corto</label>
              <Textarea
                name="summary"
                defaultValue={initialStory.summary}
                className="min-h-[80px]"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-zinc-600">Historia completa</label>
              <Textarea name="story" defaultValue={initialStory.story} required />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm text-zinc-600">Ubicación</label>
                <Input name="location" defaultValue={initialStory.location} required />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-zinc-600">Categoría</label>
                <select
                  name="category"
                  defaultValue={initialStory.category}
                  className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#E4007C]"
                >
                  {categories.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm text-zinc-600">Organización aliada</label>
                <Input
                  name="organizationName"
                  defaultValue={initialStory.organizationName}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-zinc-600">Cuenta receptora</label>
                <Input
                  name="accountHolderName"
                  defaultValue={initialStory.accountHolderName}
                  placeholder="Ej. Miriam Nava"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-zinc-600">Correo de contacto</label>
                <Input
                  name="contactEmail"
                  type="email"
                  defaultValue={initialStory.contactEmail}
                  required
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm text-zinc-600">CLABE (opcional)</label>
                <Input
                  name="clabe"
                  defaultValue={initialStory.clabe ?? ""}
                  placeholder="012180001234567899"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-zinc-600">CLABE enmascarada</label>
                <Input
                  name="clabeMasked"
                  defaultValue={initialStory.clabeMasked}
                  placeholder="0121••••••••5713"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-zinc-600">Variable de API key Pey</label>
                <Input
                  name="peyKeyEnv"
                  defaultValue={initialStory.peyKeyEnv}
                  placeholder="PEY_API_KEY_MIRIAM"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-zinc-600">Tipo de entidad Pey</label>
                <select
                  name="peyEntity"
                  defaultValue={initialStory.peyEntity}
                  className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#E4007C]"
                >
                  <option value="PERSON">PERSON</option>
                  <option value="BUSINESS">BUSINESS</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-zinc-600">RFC (taxId)</label>
                <Input name="peyTaxId" defaultValue={initialStory.peyTaxId ?? ""} />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-zinc-600">ID de cuenta Pey</label>
                <Input name="bankAccountId" defaultValue={initialStory.bankAccountId ?? ""} />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-zinc-600">CoDi status</label>
                <select
                  name="codiStatus"
                  defaultValue={initialStory.codiStatus}
                  className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#E4007C]"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="ERROR">ERROR</option>
                  <option value="UNKNOWN">UNKNOWN</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-zinc-600">Estado de publicación</label>
                <select
                  name="status"
                  defaultValue={initialStory.status}
                  className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#E4007C]"
                >
                  <option value="en_revision">En revisión</option>
                  <option value="aprobada">Aprobada</option>
                  <option value="rechazada">Rechazada</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-zinc-600">Preview token</label>
                <Input name="previewToken" defaultValue={initialStory.previewToken ?? ""} />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-zinc-600">Meta (MXN)</label>
                <Input
                  name="goalAmount"
                  type="number"
                  min={100}
                  defaultValue={initialStory.goalAmount}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-zinc-600">Portada (ruta /stories/... o URL http)</label>
              <Input
                name="coverImage"
                defaultValue={initialStory.coverImage}
                placeholder="/stories/miriam/miriam-cover-4x5.webp"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-zinc-600">Galería (una ruta o URL por línea)</label>
              <Textarea
                name="galleryImages"
                defaultValue={initialStory.galleryImages.join("\n")}
                className="min-h-[90px]"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-zinc-600">
                Metas (formato: nombre|monto, una por línea)
              </label>
              <Textarea
                name="milestones"
                defaultValue={initialStory.milestones.map((item) => `${item.label}|${item.targetAmount}`).join("\n")}
                className="min-h-[120px]"
                required
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-zinc-600">
              <input
                type="checkbox"
                name="isExample"
                defaultChecked={initialStory.isExample}
                className="h-4 w-4 rounded border-zinc-300 text-[#E4007C] focus:ring-[#E4007C]"
              />
              Marcar como historia de ejemplo
            </label>

            {selectedStory?.bankAccountId ? (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                <input type="hidden" name="storyId" value={selectedStory.id} />
                <input type="hidden" name="bankAccountId" value={selectedStory.bankAccountId} />
                <p className="mb-2 text-xs text-zinc-600">
                  Cuenta en Pey: <span className="font-semibold">{selectedStory.bankAccountId}</span>
                </p>
                <Button variant="outline" size="sm" type="submit" formAction={refreshBankAccountStatusAction}>
                  Revisar estado
                </Button>
              </div>
            ) : null}

            <Button type="submit">Guardar historia</Button>
          </form>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-5">
        <h2 className="text-xl font-semibold text-zinc-900">Pagos recientes</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-zinc-500">
                <th className="px-2 py-2">Historia</th>
                <th className="px-2 py-2">Monto</th>
                <th className="px-2 py-2">Estado</th>
                <th className="px-2 py-2">Referencia</th>
                <th className="px-2 py-2">Cuenta Pey</th>
                <th className="px-2 py-2">Liberación</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-zinc-100 text-zinc-700">
                  <td className="px-2 py-3">
                    <p className="font-medium">{payment.storyTitle}</p>
                    <p className="text-xs text-zinc-500">/{payment.storySlug}</p>
                  </td>
                  <td className="px-2 py-3">{formatCurrency(payment.amount)}</td>
                  <td className="px-2 py-3 capitalize">{payment.status}</td>
                  <td className="px-2 py-3">#{payment.reference}</td>
                  <td className="px-2 py-3">
                    <p className="text-xs">{payment.peyApiKeyEnv ?? "PEY_API_KEY"}</p>
                    <p className="text-[11px] text-zinc-500">{payment.peyApiKeyId ?? "sin apiKeyId"}</p>
                  </td>
                  <td className="px-2 py-3">
                    {payment.releasedAt ? (
                      <span className="text-emerald-700">Liberado</span>
                    ) : payment.status === "paid" ? (
                      <form action={markReleasedAction}>
                        <input type="hidden" name="paymentId" value={payment.id} />
                        <Button variant="outline" size="sm" type="submit">
                          Marcar liberado
                        </Button>
                      </form>
                    ) : (
                      <span className="text-zinc-400">Pendiente</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      </main>
      <SiteFooter />
    </>
  );
}
