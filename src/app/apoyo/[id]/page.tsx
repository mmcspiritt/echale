import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { PaymentTrace } from "@/components/story/payment-trace";
import { getPublicReceipt } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";

interface ReceiptPageProps {
  params: Promise<{ id: string }>;
}

function whenCDMX(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "America/Mexico_City",
  }).format(new Date(value));
}

export async function generateMetadata({ params }: ReceiptPageProps): Promise<Metadata> {
  const { id } = await params;
  const receipt = await getPublicReceipt(id);
  if (!receipt) return { title: "Comprobante | Échale" };
  return {
    title: `Comprobante de ${formatCurrency(receipt.amount)} para ${receipt.personName} | Échale`,
    description: `Apoyo confirmado por CoDi para ${receipt.personName}.`,
    openGraph: { images: [`/apoyo/${receipt.id}/opengraph-image`] },
  };
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { id } = await params;
  const receipt = await getPublicReceipt(id);
  if (!receipt) notFound();
  const when = whenCDMX(receipt.paidAt);

  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader />
      <main className="mx-auto w-full max-w-md px-4 py-8">
        <article className="border border-dashed border-ink bg-white px-5 py-6 text-ink shadow-card">
          <p className="text-center font-display text-3xl">Échale</p>
          <p className="mt-1 text-center text-small text-ink-2">Comprobante de apoyo</p>
          <p className="mt-6 text-center font-display text-5xl leading-none">{formatCurrency(receipt.amount)}</p>
          <p className="mt-3 text-center text-body">Para {receipt.personName}</p>
          <p className="text-center text-small text-ink-2">{receipt.organizationName}</p>
          <dl className="mt-6 space-y-3 border-t border-dashed border-line pt-4 text-small">
            <div>
              <dt className="text-ink-2">Folio Pey</dt>
              <dd className="break-all font-semibold">{receipt.folioPey || "Sin folio"}</dd>
            </div>
            <div>
              <dt className="text-ink-2">Folio CoDi</dt>
              <dd className="break-all font-semibold">{receipt.folioCodi || "Sin folio"}</dd>
            </div>
            <div>
              <dt className="text-ink-2">Fecha y hora (CDMX)</dt>
              <dd className="font-semibold">{when || "Sin hora registrada"}</dd>
            </div>
            <div>
              <dt className="text-ink-2">CLABE</dt>
              <dd className="font-semibold">{receipt.clabeMasked}</dd>
            </div>
          </dl>
          <p className="mt-5 text-small font-semibold text-jade">
            ✓ Confirmado por CoDi · webhook firmado verificado
          </p>
          <div className="mt-3">
            <PaymentTrace
              createdAt={receipt.createdAt}
              paidAt={receipt.paidAt}
              verified
              beforeAmount={receipt.beforeAmount}
              afterAmount={receipt.afterAmount}
            />
          </div>
        </article>

        <section className="mt-6 space-y-2">
          <h2 className="text-h3 text-ink">Verifícalo en Banxico</h2>
          <p className="text-small text-ink-2">
            La clave de rastreo es el número que tu banco pone en el comprobante del SPEI. Con esa clave, la fecha y
            el banco emisor puedes consultar el CEP. Este pago no trae la clave guardada, así que aquí no se muestra.
          </p>
          <a
            href="https://www.banxico.org.mx/cep/"
            className="inline-flex min-h-11 items-center text-small font-semibold text-ink"
          >
            Consultar el CEP en Banxico
          </a>
        </section>
        <p className="mt-6">
          <Link href={`/${receipt.slug}`} className="inline-flex min-h-11 items-center text-small font-semibold text-ink">
            Volver a la historia
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
