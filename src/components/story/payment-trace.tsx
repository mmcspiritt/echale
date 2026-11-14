import { formatClockCDMX } from "@/lib/arrival";
import { formatCurrency } from "@/lib/utils";

export function PaymentTrace({
  createdAt,
  paidAt,
  verified,
  beforeAmount,
  afterAmount,
}: {
  createdAt?: string | null;
  paidAt?: string | null;
  verified: boolean;
  beforeAmount?: number | null;
  afterAmount?: number | null;
}) {
  const created = formatClockCDMX(createdAt);
  const paid = formatClockCDMX(paidAt);
  const meta =
    beforeAmount != null && afterAmount != null
      ? `Meta ${formatCurrency(beforeAmount)} → ${formatCurrency(afterAmount)}`
      : "Meta";

  return (
    <p className="text-small leading-relaxed text-ink-2">
      QR creado en Pey{created ? ` ${created}` : ""} → Pagado desde tu banco{paid ? ` ${paid}` : ""} → Webhook
      firmado verificado{verified ? " ✓" : ""} → {meta}
    </p>
  );
}
