import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

import { demoStories } from "@/lib/seed-data";
import {
  BankAccountEntity,
  CodiStatus,
  Story,
  StoryStatus,
  StoryWithStats,
  SupportPayment,
  SupporterItem,
  PaymentMethod,
} from "@/lib/types";

interface CreatePaymentInput {
  storyId: string;
  reference: number;
  peyApiKeyEnv: string | null;
  amount: number;
  donorName: string | null;
  message: string | null;
  phone: string | null;
  concept: string;
  method: PaymentMethod;
  providerChargeId: string | null;
  qrString: string | null;
  paymentLink: string | null;
}

const usePostgres = Boolean(process.env.DATABASE_URL?.trim());
const dataFilePath =
  process.env.MOCK_DATA_PATH?.trim() ||
  (process.env.VERCEL
    ? path.join("/tmp", "echale-mock-db.json")
    : path.join(process.cwd(), "data", "mock-db.json"));

const sql = usePostgres
  ? postgres(process.env.DATABASE_URL as string, {
      prepare: false,
      ssl: "require",
      max: 1,
    })
  : null;

const storeGlobals = globalThis as typeof globalThis & {
  __echaleSchemaPromise?: Promise<void>;
};

let schemaPromise: Promise<void> | null = storeGlobals.__echaleSchemaPromise ?? null;

interface MockStoreData {
  stories: Story[];
  payments: SupportPayment[];
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeStory(input: Story): Story {
  return {
    ...input,
    accountHolderName: input.accountHolderName ?? "",
    clabe: input.clabe ?? null,
    clabeMasked: input.clabeMasked ?? "",
    peyKeyEnv: input.peyKeyEnv ?? "PEY_API_KEY",
    peyEntity: input.peyEntity ?? "PERSON",
    peyTaxId: input.peyTaxId ?? null,
    bankAccountId: input.bankAccountId ?? null,
    codiStatus: input.codiStatus ?? "ACTIVE",
    status: input.status ?? "aprobada",
    previewToken: input.previewToken ?? null,
    contactEmail: input.contactEmail ?? "",
    galleryImages: Array.isArray(input.galleryImages) ? input.galleryImages : [],
    milestones: Array.isArray(input.milestones) ? input.milestones : [],
  };
}

async function ensurePostgresSchema() {
  if (!sql) return;
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS stories (
          id TEXT PRIMARY KEY,
          slug TEXT UNIQUE NOT NULL,
          person_name TEXT NOT NULL,
          title TEXT NOT NULL,
          summary TEXT NOT NULL,
          story TEXT NOT NULL,
          location TEXT NOT NULL,
          category TEXT NOT NULL,
          organization_name TEXT NOT NULL,
          account_holder_name TEXT NOT NULL DEFAULT '',
          clabe TEXT,
          clabe_masked TEXT NOT NULL DEFAULT '',
          pey_key_env TEXT NOT NULL DEFAULT 'PEY_API_KEY',
          pey_entity TEXT NOT NULL DEFAULT 'PERSON',
          pey_tax_id TEXT,
          bank_account_id TEXT,
          codi_status TEXT NOT NULL DEFAULT 'ACTIVE',
          status TEXT NOT NULL DEFAULT 'aprobada',
          preview_token TEXT,
          contact_email TEXT NOT NULL DEFAULT '',
          goal_amount INTEGER NOT NULL,
          cover_image TEXT NOT NULL,
          gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb,
          milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
          is_example BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS payments (
          id TEXT PRIMARY KEY,
          story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
          reference INTEGER NOT NULL,
          pey_api_key_env TEXT,
          pey_api_key_id TEXT,
          provider_charge_id TEXT,
          provider_transaction_id TEXT,
          amount NUMERIC(12,2) NOT NULL,
          donor_name TEXT,
          message TEXT,
          phone TEXT,
          concept TEXT NOT NULL,
          method TEXT NOT NULL,
          status TEXT NOT NULL,
          qr_string TEXT,
          payment_link TEXT,
          paid_at TIMESTAMPTZ,
          released_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `;
      await sql`
        ALTER TABLE stories ADD COLUMN IF NOT EXISTS account_holder_name TEXT NOT NULL DEFAULT '';
      `;
      await sql`
        ALTER TABLE stories ADD COLUMN IF NOT EXISTS clabe TEXT;
      `;
      await sql`
        ALTER TABLE stories ADD COLUMN IF NOT EXISTS clabe_masked TEXT NOT NULL DEFAULT '';
      `;
      await sql`
        ALTER TABLE stories ADD COLUMN IF NOT EXISTS pey_key_env TEXT NOT NULL DEFAULT 'PEY_API_KEY';
      `;
      await sql`
        ALTER TABLE stories ADD COLUMN IF NOT EXISTS pey_entity TEXT NOT NULL DEFAULT 'PERSON';
      `;
      await sql`
        ALTER TABLE stories ADD COLUMN IF NOT EXISTS pey_tax_id TEXT;
      `;
      await sql`
        ALTER TABLE stories ADD COLUMN IF NOT EXISTS bank_account_id TEXT;
      `;
      await sql`
        ALTER TABLE stories ADD COLUMN IF NOT EXISTS codi_status TEXT NOT NULL DEFAULT 'ACTIVE';
      `;
      await sql`
        ALTER TABLE stories ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'aprobada';
      `;
      await sql`
        ALTER TABLE stories ADD COLUMN IF NOT EXISTS preview_token TEXT;
      `;
      await sql`
        ALTER TABLE stories ADD COLUMN IF NOT EXISTS contact_email TEXT NOT NULL DEFAULT '';
      `;
      await sql`
        ALTER TABLE payments ADD COLUMN IF NOT EXISTS pey_api_key_env TEXT;
      `;
      await sql`
        ALTER TABLE payments ADD COLUMN IF NOT EXISTS pey_api_key_id TEXT;
      `;
      await sql`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'payments' AND column_name = 'amount' AND data_type = 'integer'
          ) THEN
            ALTER TABLE payments ALTER COLUMN amount TYPE NUMERIC(12,2);
          END IF;
        END $$;
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS payments_story_idx ON payments (story_id);
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS payments_provider_charge_idx ON payments (provider_charge_id);
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS payments_reference_idx ON payments (reference);
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS payments_status_idx ON payments (status);
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS stories_status_idx ON stories (status);
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS stories_bank_account_id_idx ON stories (bank_account_id);
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS stories_preview_token_idx ON stories (preview_token);
      `;
    })();
    storeGlobals.__echaleSchemaPromise = schemaPromise;
  }
  await schemaPromise;
}

async function ensureMockFile() {
  await mkdir(path.dirname(dataFilePath), { recursive: true });
  try {
    await readFile(dataFilePath, "utf8");
  } catch {
    const payload: MockStoreData = {
      stories: demoStories,
      payments: [],
    };
    await writeFile(dataFilePath, JSON.stringify(payload, null, 2), "utf8");
  }
}

async function readMockStore(): Promise<MockStoreData> {
  await ensureMockFile();
  const raw = await readFile(dataFilePath, "utf8");
  const parsed = JSON.parse(raw) as MockStoreData;
  return {
    stories: parsed.stories.map(normalizeStory),
    payments: parsed.payments ?? [],
  };
}

async function writeMockStore(data: MockStoreData) {
  await writeFile(dataFilePath, JSON.stringify(data, null, 2), "utf8");
}

function toStoryWithStats(story: Story, payments: SupportPayment[]): StoryWithStats {
  const paidPayments = payments.filter(
    (payment) => payment.storyId === story.id && payment.status === "paid",
  );
  return {
    ...story,
    amountRaised: paidPayments.reduce((acc, payment) => acc + payment.amount, 0),
    supporterCount: paidPayments.length,
  };
}

function isRealPeyConfirmation(payment: SupportPayment) {
  if (payment.status !== "paid") return false;
  if (payment.method === "mock") return false;
  return Boolean(payment.providerTransactionId || payment.peyApiKeyId);
}

function mapStoryRow(row: Record<string, unknown>): Story {
  return normalizeStory({
    id: String(row.id),
    slug: String(row.slug),
    personName: String(row.person_name),
    title: String(row.title),
    summary: String(row.summary),
    story: String(row.story),
    location: String(row.location),
    category: String(row.category) as Story["category"],
    organizationName: String(row.organization_name),
    accountHolderName: String(row.account_holder_name ?? ""),
    clabe: row.clabe ? String(row.clabe) : null,
    clabeMasked: String(row.clabe_masked ?? ""),
    peyKeyEnv: String(row.pey_key_env ?? "PEY_API_KEY"),
    peyEntity: String(row.pey_entity ?? "PERSON") as BankAccountEntity,
    peyTaxId: row.pey_tax_id ? String(row.pey_tax_id) : null,
    bankAccountId: row.bank_account_id ? String(row.bank_account_id) : null,
    codiStatus: String(row.codi_status ?? "ACTIVE") as CodiStatus,
    status: String(row.status ?? "aprobada") as StoryStatus,
    previewToken: row.preview_token ? String(row.preview_token) : null,
    contactEmail: String(row.contact_email ?? ""),
    goalAmount: Number(row.goal_amount),
    coverImage: String(row.cover_image),
    galleryImages: (row.gallery_images as string[]) ?? [],
    milestones: (row.milestones as Story["milestones"]) ?? [],
    isExample: Boolean(row.is_example),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  });
}

function mapPaymentRow(row: Record<string, unknown>): SupportPayment {
  return {
    id: String(row.id),
    storyId: String(row.story_id),
    reference: Number(row.reference),
    peyApiKeyEnv: row.pey_api_key_env ? String(row.pey_api_key_env) : null,
    peyApiKeyId: row.pey_api_key_id ? String(row.pey_api_key_id) : null,
    providerChargeId: row.provider_charge_id ? String(row.provider_charge_id) : null,
    providerTransactionId: row.provider_transaction_id
      ? String(row.provider_transaction_id)
      : null,
    amount: Number(row.amount),
    donorName: row.donor_name ? String(row.donor_name) : null,
    message: row.message ? String(row.message) : null,
    phone: row.phone ? String(row.phone) : null,
    concept: String(row.concept),
    method: String(row.method) as SupportPayment["method"],
    status: String(row.status) as SupportPayment["status"],
    qrString: row.qr_string ? String(row.qr_string) : null,
    paymentLink: row.payment_link ? String(row.payment_link) : null,
    paidAt: row.paid_at ? new Date(String(row.paid_at)).toISOString() : null,
    releasedAt: row.released_at ? new Date(String(row.released_at)).toISOString() : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export function getStoreMode() {
  return usePostgres ? "postgres" : "mock";
}

export async function seedDemoStories() {
  if (sql) {
    await ensurePostgresSchema();
    const stories = await sql`SELECT id FROM stories LIMIT 1`;
    if (stories.length > 0) return;

    for (const story of demoStories) {
      await upsertStory(story);
    }
    return;
  }

  const current = await readMockStore();
  if (current.stories.length > 0) return;
  await writeMockStore({
    ...current,
    stories: demoStories,
  });
}

export async function listStoriesWithStats(): Promise<StoryWithStats[]> {
  if (sql) {
    await ensurePostgresSchema();
    const rows = await sql`
      SELECT * FROM stories ORDER BY created_at ASC
    `;
    const stories = rows.map((row) => mapStoryRow(row));
    const storyIds = stories.map((story) => story.id);
    if (storyIds.length === 0) return [];

    const paymentRows = await sql`
      SELECT * FROM payments WHERE story_id = ANY(${storyIds}) AND status = 'paid'
    `;
    const payments = paymentRows.map((row) => mapPaymentRow(row));
    return stories.map((story) => toStoryWithStats(story, payments));
  }

  const store = await readMockStore();
  return store.stories.map((story) => toStoryWithStats(story, store.payments));
}

export async function listPublicStoriesWithStats(): Promise<StoryWithStats[]> {
  const allStories = await listStoriesWithStats();
  return allStories.filter((story) => story.status === "aprobada");
}

export async function getStoryBySlugWithStats(
  slug: string,
): Promise<StoryWithStats | null> {
  if (sql) {
    await ensurePostgresSchema();
    const rows = await sql`
      SELECT * FROM stories WHERE slug = ${slug} LIMIT 1
    `;
    if (rows.length === 0) return null;
    const story = mapStoryRow(rows[0]);
    const payments = await sql`
      SELECT * FROM payments WHERE story_id = ${story.id} AND status = 'paid'
    `;
    return toStoryWithStats(story, payments.map((row) => mapPaymentRow(row)));
  }

  const store = await readMockStore();
  const story = store.stories.find((item) => item.slug === slug);
  if (!story) return null;
  return toStoryWithStats(story, store.payments);
}

export async function getStoryById(id: string): Promise<Story | null> {
  if (sql) {
    await ensurePostgresSchema();
    const rows = await sql`SELECT * FROM stories WHERE id = ${id} LIMIT 1`;
    return rows.length > 0 ? mapStoryRow(rows[0]) : null;
  }
  const store = await readMockStore();
  return store.stories.find((item) => item.id === id) ?? null;
}

export async function getStoryBySlug(slug: string): Promise<Story | null> {
  if (sql) {
    await ensurePostgresSchema();
    const rows = await sql`SELECT * FROM stories WHERE slug = ${slug} LIMIT 1`;
    return rows.length > 0 ? mapStoryRow(rows[0]) : null;
  }
  const store = await readMockStore();
  return store.stories.find((item) => item.slug === slug) ?? null;
}

export async function getStoryByBankAccountId(bankAccountId: string): Promise<Story | null> {
  if (sql) {
    await ensurePostgresSchema();
    const rows = await sql`
      SELECT * FROM stories WHERE bank_account_id = ${bankAccountId} LIMIT 1
    `;
    return rows.length > 0 ? mapStoryRow(rows[0]) : null;
  }
  const store = await readMockStore();
  return store.stories.find((item) => item.bankAccountId === bankAccountId) ?? null;
}

export async function listSupportersForStory(
  storyId: string,
  limit = 15,
): Promise<SupporterItem[]> {
  if (sql) {
    await ensurePostgresSchema();
    const rows = await sql`
      SELECT id, donor_name, message, amount, paid_at, method, provider_transaction_id, pey_api_key_id
      FROM payments
      WHERE story_id = ${storyId} AND status = 'paid' AND paid_at IS NOT NULL
      ORDER BY paid_at DESC
      LIMIT ${limit}
    `;
    return rows.map((row) => ({
      id: String(row.id),
      donorName: row.donor_name ? String(row.donor_name) : "Alguien que prefiere anonimato",
      message: row.message ? String(row.message) : null,
      amount: Number(row.amount),
      paidAt: new Date(String(row.paid_at)).toISOString(),
      isRealConfirmed:
        String(row.method) !== "mock" &&
        Boolean(row.provider_transaction_id || row.pey_api_key_id),
      isExample:
        String(row.method) === "mock" ||
        (!row.provider_transaction_id && !row.pey_api_key_id),
    }));
  }

  const store = await readMockStore();
  return store.payments
    .filter((payment) => payment.storyId === storyId && payment.status === "paid" && payment.paidAt)
    .sort((a, b) => (a.paidAt! < b.paidAt! ? 1 : -1))
    .slice(0, limit)
    .map((payment) => ({
      id: payment.id,
      donorName: payment.donorName ?? "Alguien que prefiere anonimato",
      message: payment.message,
      amount: payment.amount,
      paidAt: payment.paidAt as string,
      isRealConfirmed: isRealPeyConfirmation(payment),
      isExample: !isRealPeyConfirmation(payment),
    }));
}

export async function listPaymentsWithStory() {
  if (sql) {
    await ensurePostgresSchema();
    const rows = await sql`
      SELECT p.*, s.slug AS story_slug, s.title AS story_title, s.person_name AS story_person_name
      FROM payments p
      JOIN stories s ON p.story_id = s.id
      ORDER BY p.created_at DESC
    `;
    return rows.map((row) => ({
      ...mapPaymentRow(row),
      storySlug: String(row.story_slug),
      storyTitle: String(row.story_title),
      storyPersonName: String(row.story_person_name),
    }));
  }

  const store = await readMockStore();
  return store.payments
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((payment) => {
      const story = store.stories.find((item) => item.id === payment.storyId);
      return {
        ...payment,
        storySlug: story?.slug ?? "sin-slug",
        storyTitle: story?.title ?? "Historia eliminada",
        storyPersonName: story?.personName ?? "Persona",
      };
    });
}

export async function getPaymentById(id: string): Promise<SupportPayment | null> {
  if (sql) {
    await ensurePostgresSchema();
    const rows = await sql`SELECT * FROM payments WHERE id = ${id} LIMIT 1`;
    return rows.length > 0 ? mapPaymentRow(rows[0]) : null;
  }
  const store = await readMockStore();
  return store.payments.find((item) => item.id === id) ?? null;
}

export async function getPaymentByProviderOrReference(params: {
  providerChargeId: string | null;
  reference: number | null;
}): Promise<SupportPayment | null> {
  if (sql) {
    await ensurePostgresSchema();
    if (params.providerChargeId) {
      const byProvider = await sql`
        SELECT * FROM payments WHERE provider_charge_id = ${params.providerChargeId} LIMIT 1
      `;
      if (byProvider.length > 0) return mapPaymentRow(byProvider[0]);
    }
    if (params.reference !== null) {
      const byReference = await sql`
        SELECT * FROM payments WHERE reference = ${params.reference} ORDER BY created_at DESC LIMIT 1
      `;
      if (byReference.length > 0) return mapPaymentRow(byReference[0]);
    }
    return null;
  }

  const store = await readMockStore();
  if (params.providerChargeId) {
    const byProvider = store.payments.find(
      (item) => item.providerChargeId === params.providerChargeId,
    );
    if (byProvider) return byProvider;
  }
  if (params.reference !== null) {
    return (
      store.payments
        .slice()
        .reverse()
        .find((item) => item.reference === params.reference) ?? null
    );
  }
  return null;
}

export async function createPayment(input: CreatePaymentInput): Promise<SupportPayment> {
  const timestamp = nowIso();
  const payment: SupportPayment = {
    id: randomUUID(),
    storyId: input.storyId,
    reference: input.reference,
    peyApiKeyEnv: input.peyApiKeyEnv,
    peyApiKeyId: null,
    providerChargeId: input.providerChargeId,
    providerTransactionId: null,
    amount: input.amount,
    donorName: input.donorName,
    message: input.message,
    phone: input.phone,
    concept: input.concept,
    method: input.method,
    status: "pending",
    qrString: input.qrString,
    paymentLink: input.paymentLink,
    paidAt: null,
    releasedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (sql) {
    await ensurePostgresSchema();
    await sql`
      INSERT INTO payments (
        id, story_id, reference, pey_api_key_env, pey_api_key_id, provider_charge_id, provider_transaction_id, amount, donor_name, message, phone,
        concept, method, status, qr_string, payment_link, paid_at, released_at, created_at, updated_at
      ) VALUES (
        ${payment.id}, ${payment.storyId}, ${payment.reference}, ${payment.peyApiKeyEnv}, ${payment.peyApiKeyId}, ${payment.providerChargeId},
        ${payment.providerTransactionId}, ${payment.amount}, ${payment.donorName}, ${payment.message}, ${payment.phone},
        ${payment.concept}, ${payment.method}, ${payment.status}, ${payment.qrString}, ${payment.paymentLink},
        ${payment.paidAt}, ${payment.releasedAt}, ${payment.createdAt}, ${payment.updatedAt}
      )
    `;
    return payment;
  }

  const store = await readMockStore();
  store.payments.push(payment);
  await writeMockStore(store);
  return payment;
}

export async function markPaymentAsPaid(params: {
  paymentId: string;
  providerTransactionId: string | null;
  peyApiKeyId?: string | null;
  paidAt: string;
}) {
  if (sql) {
    await ensurePostgresSchema();
    await sql`
      UPDATE payments
      SET
        status = 'paid',
        provider_transaction_id = ${params.providerTransactionId},
        pey_api_key_id = COALESCE(${params.peyApiKeyId ?? null}, pey_api_key_id),
        paid_at = ${params.paidAt},
        updated_at = ${nowIso()}
      WHERE id = ${params.paymentId}
    `;
    return;
  }

  const store = await readMockStore();
  const payment = store.payments.find((item) => item.id === params.paymentId);
  if (!payment) return;
  payment.status = "paid";
  payment.providerTransactionId = params.providerTransactionId;
  payment.peyApiKeyId = params.peyApiKeyId ?? payment.peyApiKeyId;
  payment.paidAt = params.paidAt;
  payment.updatedAt = nowIso();
  await writeMockStore(store);
}

export async function markPaymentReleased(paymentId: string) {
  if (sql) {
    await ensurePostgresSchema();
    await sql`
      UPDATE payments
      SET released_at = ${nowIso()}, updated_at = ${nowIso()}
      WHERE id = ${paymentId}
    `;
    return;
  }

  const store = await readMockStore();
  const payment = store.payments.find((item) => item.id === paymentId);
  if (!payment) return;
  payment.releasedAt = nowIso();
  payment.updatedAt = nowIso();
  await writeMockStore(store);
}

export async function upsertStory(story: Story) {
  const normalized = normalizeStory(story);
  if (sql) {
    await ensurePostgresSchema();
    await sql`
      INSERT INTO stories (
        id, slug, person_name, title, summary, story, location, category, organization_name,
        account_holder_name, clabe, clabe_masked, pey_key_env, pey_entity, pey_tax_id,
        bank_account_id, codi_status, status, preview_token, contact_email,
        goal_amount, cover_image, gallery_images, milestones, is_example, created_at, updated_at
      ) VALUES (
        ${normalized.id}, ${normalized.slug}, ${normalized.personName}, ${normalized.title},
        ${normalized.summary}, ${normalized.story}, ${normalized.location}, ${normalized.category},
        ${normalized.organizationName}, ${normalized.accountHolderName}, ${normalized.clabe}, ${normalized.clabeMasked},
        ${normalized.peyKeyEnv}, ${normalized.peyEntity}, ${normalized.peyTaxId}, ${normalized.bankAccountId},
        ${normalized.codiStatus}, ${normalized.status}, ${normalized.previewToken}, ${normalized.contactEmail},
        ${normalized.goalAmount}, ${normalized.coverImage},
        ${sql.json(normalized.galleryImages)}, ${sql.json(normalized.milestones)},
        ${normalized.isExample}, ${normalized.createdAt}, ${normalized.updatedAt}
      )
      ON CONFLICT (id) DO UPDATE SET
        slug = EXCLUDED.slug,
        person_name = EXCLUDED.person_name,
        title = EXCLUDED.title,
        summary = EXCLUDED.summary,
        story = EXCLUDED.story,
        location = EXCLUDED.location,
        category = EXCLUDED.category,
        organization_name = EXCLUDED.organization_name,
        account_holder_name = EXCLUDED.account_holder_name,
        clabe = EXCLUDED.clabe,
        clabe_masked = EXCLUDED.clabe_masked,
        pey_key_env = EXCLUDED.pey_key_env,
        pey_entity = EXCLUDED.pey_entity,
        pey_tax_id = EXCLUDED.pey_tax_id,
        bank_account_id = EXCLUDED.bank_account_id,
        codi_status = EXCLUDED.codi_status,
        status = EXCLUDED.status,
        preview_token = EXCLUDED.preview_token,
        contact_email = EXCLUDED.contact_email,
        goal_amount = EXCLUDED.goal_amount,
        cover_image = EXCLUDED.cover_image,
        gallery_images = EXCLUDED.gallery_images,
        milestones = EXCLUDED.milestones,
        is_example = EXCLUDED.is_example,
        updated_at = EXCLUDED.updated_at
    `;
    return;
  }

  const store = await readMockStore();
  const index = store.stories.findIndex((item) => item.id === normalized.id);
  if (index >= 0) {
    store.stories[index] = normalized;
  } else {
    store.stories.push(normalized);
  }
  await writeMockStore(store);
}

export async function slugExists(slug: string) {
  if (sql) {
    await ensurePostgresSchema();
    const rows = await sql`SELECT id FROM stories WHERE slug = ${slug} LIMIT 1`;
    return rows.length > 0;
  }
  const store = await readMockStore();
  return store.stories.some((item) => item.slug === slug);
}

export async function updateStoryStatus(storyId: string, status: StoryStatus) {
  if (sql) {
    await ensurePostgresSchema();
    await sql`
      UPDATE stories
      SET status = ${status}, updated_at = ${nowIso()}
      WHERE id = ${storyId}
    `;
    return;
  }

  const store = await readMockStore();
  const story = store.stories.find((item) => item.id === storyId);
  if (!story) return;
  story.status = status;
  story.updatedAt = nowIso();
  await writeMockStore(store);
}

export async function updateStoryBankAccountStatus(params: {
  storyId: string;
  bankAccountId?: string | null;
  codiStatus: CodiStatus;
  peyTaxId?: string | null;
  clabe?: string | null;
  accountHolderName?: string | null;
}) {
  if (sql) {
    await ensurePostgresSchema();
    await sql`
      UPDATE stories
      SET
        bank_account_id = COALESCE(${params.bankAccountId ?? null}, bank_account_id),
        codi_status = ${params.codiStatus},
        pey_tax_id = COALESCE(${params.peyTaxId ?? null}, pey_tax_id),
        clabe = COALESCE(${params.clabe ?? null}, clabe),
        account_holder_name = COALESCE(${params.accountHolderName ?? null}, account_holder_name),
        updated_at = ${nowIso()}
      WHERE id = ${params.storyId}
    `;
    return;
  }

  const store = await readMockStore();
  const story = store.stories.find((item) => item.id === params.storyId);
  if (!story) return;
  if (params.bankAccountId) story.bankAccountId = params.bankAccountId;
  story.codiStatus = params.codiStatus;
  if (params.peyTaxId) story.peyTaxId = params.peyTaxId;
  if (params.clabe) story.clabe = params.clabe;
  if (params.accountHolderName) story.accountHolderName = params.accountHolderName;
  story.updatedAt = nowIso();
  await writeMockStore(store);
}

export async function nextReference() {
  if (sql) {
    await ensurePostgresSchema();
    const rows = await sql`
      SELECT reference FROM payments ORDER BY reference DESC LIMIT 1
    `;
    const current = rows.length > 0 ? Number(rows[0].reference) : 1000000;
    const candidate = current + 1;
    return Number(String(candidate).slice(-7));
  }

  const store = await readMockStore();
  const current = store.payments.reduce((max, item) => Math.max(max, item.reference), 1000000);
  return Number(String(current + 1).slice(-7));
}

export async function closeStoreConnections() {
  if (sql) {
    await sql.end({ timeout: 1 });
  }
}
