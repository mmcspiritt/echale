import { createHmac, timingSafeEqual } from "node:crypto";
import { BankAccountEntity, CodiStatus } from "@/lib/types";

interface CreateCodiChargeInput {
  amount: number;
  concept: string;
  numRef: number;
  expiration: number;
  phone: string | null;
  apiKey: string | null;
  bankAccountId?: string | null;
  metadata?: Record<string, string>;
}

interface CreateCodiChargeOutput {
  id: string;
  qrString: string;
  paymentLink: string | null;
}

interface PeyPaymentWebhookPayload {
  amount: number;
  apiKeyId: string;
  codiQrId: string;
  concept: string;
  datePaid: number;
  numRef: number | string;
  transactionId: string;
  type: "codi.qr.payment_received";
}

interface PeyBankAccountWebhookPayload {
  type: "bank.account.updated";
  bankAccountId: string;
  name: string;
  ownerType: string;
  ownerId: string;
  taxId?: string;
  codiStatus: CodiStatus;
  clabe: string;
  entity: BankAccountEntity;
}

interface PeyUnknownWebhookPayload {
  type: string;
  [key: string]: unknown;
}

const peyBaseUrl = process.env.PEY_BASE_URL ?? "https://api.pey.mx";
const peyMode = process.env.PEY_MODE ?? (process.env.PEY_API_KEY ? "live" : "mock");
const defaultExpiration = Number(process.env.PEY_QR_EXPIRATION_SECONDS ?? "600");

export function isPeyMockMode() {
  return peyMode !== "live";
}

function parseJsonOrThrow(input: string) {
  try {
    return JSON.parse(input) as Record<string, unknown>;
  } catch {
    throw new Error(`Pey respondió con JSON inválido: ${input.slice(0, 200)}`);
  }
}

export async function createCodiCharge({
  amount,
  concept,
  numRef,
  expiration,
  phone,
  apiKey,
  bankAccountId,
  metadata,
}: CreateCodiChargeInput): Promise<CreateCodiChargeOutput> {
  if (isPeyMockMode()) {
    const mockId = `mock-${Math.random().toString(36).slice(2, 10)}`;
    return {
      id: mockId,
      qrString: JSON.stringify({
        TYP: 20,
        mock: true,
        amount,
        concept,
        ref: numRef,
      }),
      paymentLink: null,
    };
  }

  if (!apiKey) {
    throw new Error("No hay API key de Pey configurada para esta historia");
  }

  const response = await fetch(`${peyBaseUrl}/codi/qr`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Number(amount.toFixed(2)),
      concept,
      expiration: expiration || defaultExpiration,
      // Pey only accepts numRef as a numeric string (up to 7 digits); a JSON number is rejected.
      numRef: String(numRef),
      bankAccountId: bankAccountId ?? undefined,
      metadata: metadata && Object.keys(metadata).length > 0 ? metadata : undefined,
    }),
    cache: "no-store",
  });

  const bodyText = await response.text();
  const body = parseJsonOrThrow(bodyText);

  if (!response.ok) {
    throw new Error(
      `Pey /codi/qr falló (${response.status}): ${JSON.stringify(body).slice(0, 300)}`,
    );
  }

  const codiQrId = String(body.id ?? "");
  const qrString = String(body.qrString ?? "");

  if (!codiQrId || !qrString) {
    throw new Error("Pey no devolvió id o qrString");
  }

  if (phone) {
    await tryCreatePushRequest({
      amount,
      concept,
      numRef,
      phone,
      codiQrId,
      apiKey,
    });
  }

  return {
    id: codiQrId,
    qrString,
    paymentLink: typeof body.paymentLink === "string" ? body.paymentLink : null,
  };
}

async function tryCreatePushRequest(input: {
  amount: number;
  concept: string;
  numRef: number;
  phone: string;
  codiQrId: string;
  apiKey: string;
}) {
  if (isPeyMockMode()) return;

  const endpoint = process.env.PEY_PUSH_ENDPOINT ?? "/codi/push";
  try {
    await fetch(`${peyBaseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Number(input.amount.toFixed(2)),
        concept: input.concept,
        numRef: input.numRef,
        codiQrId: input.codiQrId,
        phone: input.phone,
      }),
      cache: "no-store",
    });
  } catch {
    // El push es opcional para el UX; si falla, mantenemos activo el flujo de QR.
  }
}

export interface WebhookSignatureMeta {
  id?: string | null;
  timestamp?: string | null;
}

function extractProvidedSignatures(signatureHeader: string) {
  // Standard Webhooks: space-delimited list of "v1,<base64>" entries.
  return signatureHeader
    .split(" ")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .flatMap((chunk) => {
      const match = chunk.match(/^v\d+[,=](.+)$/);
      if (match) return [match[1]];
      return chunk.split(",").map((part) => part.trim());
    })
    .map((chunk) => chunk.replace(/^v\d+=?/, ""))
    .filter(Boolean);
}

function digestVariants(key: Buffer | string, content: string) {
  const digestBuffer = createHmac("sha256", key).update(content).digest();
  const base64 = digestBuffer.toString("base64");
  const base64Url = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  const hex = digestBuffer.toString("hex");
  return [base64, base64Url, hex];
}

function standardWebhookKey(secret: string): Buffer | null {
  const raw = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  try {
    const decoded = Buffer.from(raw, "base64");
    return decoded.length > 0 ? decoded : null;
  } catch {
    return null;
  }
}

function doesSignatureMatch(
  rawBody: string,
  signatureHeader: string,
  secret: string,
  meta?: WebhookSignatureMeta,
) {
  const providedSignatures = extractProvidedSignatures(signatureHeader);
  const expectedVariants: string[] = [];

  // Standard Webhooks (what Pey uses): HMAC-SHA256 over "{id}.{timestamp}.{body}"
  // keyed with the base64-decoded secret (without the "whsec_" prefix).
  if (meta?.id && meta?.timestamp) {
    const signedContent = `${meta.id}.${meta.timestamp}.${rawBody}`;
    const key = standardWebhookKey(secret);
    if (key) expectedVariants.push(...digestVariants(key, signedContent));
    expectedVariants.push(...digestVariants(secret, signedContent));
  }

  // Legacy fallback: HMAC over the raw body with the raw secret string.
  expectedVariants.push(...digestVariants(secret, rawBody));

  for (const candidate of providedSignatures) {
    for (const expected of expectedVariants) {
      const candidateBuffer = Buffer.from(candidate);
      const expectedBuffer = Buffer.from(expected);
      if (
        candidateBuffer.length === expectedBuffer.length &&
        timingSafeEqual(candidateBuffer, expectedBuffer)
      ) {
        return true;
      }
    }
  }

  return false;
}

export function getConfiguredWebhookSecrets() {
  return Object.entries(process.env)
    .filter(([envName, value]) => {
      return (
        value &&
        (envName === "PEY_WEBHOOK_SECRET" || envName.startsWith("PEY_WEBHOOK_SECRET_"))
      );
    })
    .map(([envName, value]) => ({
      envName,
      value: String(value),
    }));
}

export function verifyPeyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  meta?: WebhookSignatureMeta,
) {
  if (isPeyMockMode()) {
    return { valid: true, matchedSecretEnv: "mock-mode" };
  }
  if (!signatureHeader) return { valid: false };

  const secrets = getConfiguredWebhookSecrets();
  for (const secret of secrets) {
    if (doesSignatureMatch(rawBody, signatureHeader, secret.value, meta)) {
      return { valid: true, matchedSecretEnv: secret.envName };
    }
  }
  return { valid: false };
}

export function parsePeyWebhookPayload(rawBody: string): PeyWebhookPayload {
  const parsed = JSON.parse(rawBody) as PeyWebhookPayload;
  return parsed;
}

export async function lookupPeyTransaction(transactionId: string, apiKey: string | null) {
  if (isPeyMockMode()) {
    return { mode: "mock", transactionId };
  }

  if (!apiKey) {
    throw new Error("PEY_API_KEY no está configurada");
  }

  const template = process.env.PEY_TRANSACTION_LOOKUP_PATH ?? "/transactions/{transactionId}";
  const endpoint = template.replace("{transactionId}", encodeURIComponent(transactionId));
  const response = await fetch(`${peyBaseUrl}${endpoint}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const text = await response.text();
  const body = parseJsonOrThrow(text);
  if (!response.ok) {
    throw new Error(
      `Pey lookup falló (${response.status}): ${JSON.stringify(body).slice(0, 300)}`,
    );
  }

  return body;
}

export function resolvePeyApiKey(peyKeyEnv: string | null | undefined) {
  const envName = peyKeyEnv?.trim() ? peyKeyEnv.trim() : "PEY_API_KEY";
  const scopedKey = process.env[envName];
  const fallbackKey = process.env.PEY_API_KEY;
  return {
    envName,
    apiKey: scopedKey ?? fallbackKey ?? null,
  };
}

export function resolvePeyPlatformApiKey() {
  const envName = "PEY_PLATFORM_API_KEY";
  const platformKey = process.env.PEY_PLATFORM_API_KEY?.trim();
  const miriamKey = process.env.PEY_API_KEY_MIRIAM?.trim();
  const fallback = process.env.PEY_API_KEY?.trim();
  return {
    envName,
    apiKey: platformKey || miriamKey || fallback || null,
  };
}

export function isBankAccountMockMode() {
  if (process.env.PEY_BANK_ACCOUNT_MODE === "mock") return true;
  if (process.env.PEY_BANK_ACCOUNT_MODE === "live") return false;
  return isPeyMockMode();
}

interface RegisterBankAccountInput {
  alias: string;
  name: string;
  clabe: string;
  entity: BankAccountEntity;
  taxId?: string | null;
  apiKey: string | null;
}

interface BankAccountResult {
  id: string;
  alias: string;
  name: string;
  clabe: string;
  entity: BankAccountEntity;
  taxId: string | null;
  codiStatus: CodiStatus;
}

function resolveCodiStatus(value: unknown): CodiStatus {
  if (
    value === "PENDING" ||
    value === "PROCESSING" ||
    value === "ACTIVE" ||
    value === "ERROR"
  ) {
    return value;
  }
  return "UNKNOWN";
}

export async function registerBankAccount(input: RegisterBankAccountInput): Promise<BankAccountResult> {
  if (isBankAccountMockMode()) {
    return {
      id: `mock-bank-${Math.random().toString(36).slice(2, 12)}`,
      alias: input.alias,
      name: input.name,
      clabe: input.clabe,
      entity: input.entity,
      taxId: input.taxId?.trim() || null,
      codiStatus: "PENDING",
    };
  }

  if (!input.apiKey) {
    throw new Error("No hay API key de plataforma para registrar la cuenta bancaria");
  }

  const response = await fetch(`${peyBaseUrl}/bank-account`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      alias: input.alias,
      name: input.name,
      clabe: input.clabe,
      entity: input.entity,
      taxId: input.taxId?.trim() || undefined,
    }),
    cache: "no-store",
  });

  const bodyText = await response.text();
  const body = parseJsonOrThrow(bodyText);
  if (!response.ok) {
    throw new Error(
      `Pey /bank-account falló (${response.status}): ${JSON.stringify(body).slice(0, 300)}`,
    );
  }

  return {
    id: String(body.id ?? ""),
    alias: String(body.alias ?? input.alias),
    name: String(body.name ?? input.name),
    clabe: String(body.clabe ?? input.clabe),
    entity:
      body.entity === "BUSINESS" || body.entity === "PERSON"
        ? body.entity
        : input.entity,
    taxId: body.taxId ? String(body.taxId) : input.taxId?.trim() || null,
    codiStatus: resolveCodiStatus(body.codiStatus),
  };
}

export async function getBankAccount(params: {
  id: string;
  apiKey: string | null;
}): Promise<BankAccountResult> {
  if (isBankAccountMockMode()) {
    return {
      id: params.id,
      alias: "Cuenta demo",
      name: "Cuenta demo",
      clabe: "012180000000000000",
      entity: "PERSON",
      taxId: null,
      codiStatus: "PENDING",
    };
  }

  if (!params.apiKey) {
    throw new Error("No hay API key de plataforma para consultar la cuenta bancaria");
  }

  const response = await fetch(`${peyBaseUrl}/bank-account/${encodeURIComponent(params.id)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const text = await response.text();
  const body = parseJsonOrThrow(text);
  if (!response.ok) {
    throw new Error(
      `Pey /bank-account/:id falló (${response.status}): ${JSON.stringify(body).slice(0, 300)}`,
    );
  }

  return {
    id: String(body.id ?? params.id),
    alias: String(body.alias ?? ""),
    name: String(body.name ?? ""),
    clabe: String(body.clabe ?? ""),
    entity: body.entity === "BUSINESS" || body.entity === "PERSON" ? body.entity : "PERSON",
    taxId: body.taxId ? String(body.taxId) : null,
    codiStatus: resolveCodiStatus(body.codiStatus),
  };
}

export type PeyWebhookPayload =
  | PeyPaymentWebhookPayload
  | PeyBankAccountWebhookPayload
  | PeyUnknownWebhookPayload;
