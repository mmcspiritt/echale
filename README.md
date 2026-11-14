# Échale

Échale is a mobile-first Mexican community fundraising platform with real-time CoDi payments via Pey.  
The project is framed around **goals managed by a verified partner organization** (not generic crowdfunding), with per-person earmarking via `numRef` and stored QR records.

## Tech stack

- Next.js App Router + TypeScript
- Tailwind CSS + polished custom UI primitives
- Framer Motion micro-interactions
- Storage:
  - **Production:** Postgres (`DATABASE_URL`, Neon recommended)
  - **Fallback (no DB):** JSON file (`data/mock-db.json` locally, `/tmp/echale-mock-db.json` on Vercel)
- Pey integration:
  - CoDi QR (`POST /codi/qr`)
  - Bank account onboarding (`POST /bank-account`, `GET /bank-account/:id`)
  - Signed webhooks (Standard Webhooks + legacy fallback)

## What’s implemented

- Home/discover page with categories, totals, and a prominent **“Crea tu página”** CTA.
- Public story pages with:
  - gallery, summary, progress tracker, milestones, recent supporters
  - “Gestionado por” and “Cuenta receptora” block
  - share actions + downloadable QR poster PNG/PDF
  - support modal with CoDi QR + waiting state + confetti success
- Payment pipeline:
  - `numRef` sent as **string**
  - minimum amount `0.01`
  - amounts with cents supported end-to-end
  - webhook attribution by stored `codiQrId` / `numRef` (not `apiKeyId` only)
- Admin (`/admin`):
  - edit stories
  - moderation approve/reject
  - view `codiStatus` and manually refresh status from Pey (`GET /bank-account/:id`)
  - payment list and “mark released”
- Self-serve `/crear`:
  - multi-step intake form
  - CLABE validation (18 digits + check digit)
  - creates story in `en_revision`
  - registers bank account in Pey and stores `bankAccountId` + `codiStatus`
- Story visibility/payment states:
  - `en_revision`/`rechazada`: preview link only (`?preview=...`)
  - `aprobada + PENDING/PROCESSING`: public but donation disabled with explanation
  - `aprobada + ACTIVE`: payable

## Content migration

`scripts/round3-content.sql` updates story copy, organization names, galleries and example donations without changing each story's total or any real CoDi payment. Apply it with `DATABASE_URL` set:

```bash
node scripts/apply-round3-content.mjs
```

`node scripts/apply-round3-content.mjs --mock` updates only `data/mock-db.json`.

`scripts/round4-adrian-shelter.sql` replaces the leftover “Casa de Paso Esperanza” in Adrián’s story body with “Albergue Camino a Casa”. It is safe to run more than once. Apply it with `DATABASE_URL` set:

```bash
node scripts/apply-round4-adrian-shelter.mjs
```

## Local setup

1. Install:

   ```bash
   npm install
   ```

2. Copy env:

   ```bash
   cp .env.example .env.local
   ```

3. Seed demo data:

   ```bash
   npm run seed
   ```

4. Run:

   ```bash
   npm run dev -- --port 43123
   ```

5. Open `http://localhost:43123`

## Environment variables

See `.env.example` for full list.

### Core

- `NEXT_PUBLIC_APP_URL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SALT`

### Storage

- `DATABASE_URL` (recommended in production)
- `MOCK_DATA_PATH` (optional override for JSON fallback)

### Pey keys

- `PEY_MODE` (`live` or `mock`)
- `PEY_API_KEY` (global fallback)
- `PEY_API_KEY_ADRIAN`
- `PEY_API_KEY_SANTIAGO`
- `PEY_API_KEY_MIRIAM`
- `PEY_PLATFORM_API_KEY` (for `/crear` bank account onboarding + bankAccountId-based QR)

### Pey webhook secrets

- `PEY_WEBHOOK_SECRET` (global fallback)
- `PEY_WEBHOOK_SECRET_ADRIAN`
- `PEY_WEBHOOK_SECRET_SANTIAGO`
- `PEY_WEBHOOK_SECRET_MIRIAM`
- `PEY_WEBHOOK_SECRET_PLATFORM`

### Pey behavior/config

- `PEY_BASE_URL` (default `https://api.pey.mx`)
- `PEY_QR_EXPIRATION_SECONDS` (default `600`)
- `PEY_PUSH_ENDPOINT` (default `/codi/push`)
- `PEY_TRANSACTION_LOOKUP_PATH` (default `/transactions/{transactionId}`)
- `PEY_BANK_ACCOUNT_MODE` (`mock`/`live`; use `mock` for local tests to avoid real `/bank-account` calls)
- `PEY_CLABE` (kept for handout compatibility)

## Pey integration notes

### CoDi QR

- Endpoint: `POST https://api.pey.mx/codi/qr`
- Uses per-story key (`peyKeyEnv`) for demo stories.
- Uses platform key + `bankAccountId` for self-serve onboarded stories.
- `numRef` is always sent as string.

### Bank account onboarding

- Endpoint: `POST https://api.pey.mx/bank-account`
- Fields used:
  - `alias`
  - `name`
  - `clabe`
  - `entity` (`PERSON` or `BUSINESS`)
  - optional `taxId`
- Status checked with `GET /bank-account/:id`.

### Webhook endpoint

- Route: `POST /api/webhooks/pey`
- Signature headers:
  - `webhook-signature`
  - `webhook-id`
  - `webhook-timestamp`
- Verifies Standard Webhooks signature (`id.timestamp.body`) against all configured secrets, with legacy fallback.
- Handles:
  - `codi.qr.payment_received`
  - `bank.account.updated` (flips story `codiStatus` to `ACTIVE` when applicable)

## Vercel deployment

1. Import project in Vercel.
2. Add env vars from the section above (especially all `PEY_*`, admin vars, and `DATABASE_URL`).
3. Deploy.
4. Register webhook URL in Pey Portal:
   - `https://<your-domain>/api/webhooks/pey`
5. For live demo:
   - set `PEY_MODE=live`
   - optionally set `PEY_BANK_ACCOUNT_MODE=live` (only when you want `/crear` to hit real `POST /bank-account`)
6. Validate with a `$0.01 MXN` payment.

## 3-minute demo script

1. Home + “Crea tu página”.
2. Story page + milestones + share + QR poster.
3. Support modal + CoDi + live/mock success update.
4. Admin moderation + bank account status check.

## Submission text

Spanish submission-ready copy is in `SUBMISSION_ES.md`.

## Qué hay en el demo

- Llegada en vivo en `/demo`: el total **Recibido con CoDi en vivo** y la traza del webhook firmado (`POST /codi/qr` → pago en el banco → webhook → meta).
- Comprobantes en `/apoyo/<id>` para cada pago CoDi confirmado.
- Página de la organización en `/org/<slug>` y una **Bitácora** en cada campaña.
- Alcancía de mostrador en `/<slug>/alcancia`.
- Walkthrough ilustrado **Así se ve en tu banco** en `/demo`, etiquetado como recreación ilustrativa (no es un pago real).
