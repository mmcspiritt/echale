import { z } from "zod";

const imageUrlSchema = z.string().refine(
  (value) => value.startsWith("/") || /^https?:\/\//.test(value),
  "La imagen debe ser una URL http(s) o una ruta local que empiece con /",
);

export const createPaymentSchema = z.object({
  slug: z.string().min(1),
  amount: z.number().min(0.01).max(1000000),
  donorName: z.string().max(80).optional().nullable(),
  message: z.string().max(180).optional().nullable(),
  phone: z
    .string()
    .regex(/^\d{10}$/)
    .optional()
    .nullable(),
});

export const adminStorySchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  personName: z.string().min(2),
  title: z.string().min(4),
  summary: z.string().min(10),
  story: z.string().min(20),
  location: z.string().min(2),
  category: z.enum([
    "sismo",
    "salud",
    "regresar-a-casa",
    "vivienda",
    "educacion",
  ]),
  organizationName: z.string().min(2),
  accountHolderName: z.string().min(2),
  clabe: z
    .string()
    .regex(/^\d{18}$/)
    .nullable(),
  clabeMasked: z.string().min(8),
  peyKeyEnv: z
    .string()
    .regex(/^(PEY_API_KEY[A-Z0-9_]*|PEY_PLATFORM_API_KEY)$/)
    .min(11),
  peyEntity: z.enum(["PERSON", "BUSINESS"]),
  peyTaxId: z.string().max(20).nullable(),
  bankAccountId: z.string().max(64).nullable(),
  codiStatus: z.enum(["PENDING", "PROCESSING", "ACTIVE", "ERROR", "UNKNOWN"]),
  status: z.enum(["en_revision", "aprobada", "rechazada"]),
  previewToken: z.string().max(128).nullable(),
  contactEmail: z.string().email(),
  goalAmount: z.number().min(100),
  coverImage: imageUrlSchema,
  galleryImages: z.array(imageUrlSchema).min(1),
  milestones: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(2),
        targetAmount: z.number().min(1),
      }),
    )
    .min(1),
  isExample: z.boolean(),
});

function computeClabeCheckDigit(first17Digits: string) {
  const weights = [3, 7, 1];
  const sum = first17Digits.split("").reduce((acc, digitChar, index) => {
    const digit = Number(digitChar);
    const weighted = (digit * weights[index % 3]) % 10;
    return acc + weighted;
  }, 0);
  return (10 - (sum % 10)) % 10;
}

export function isValidClabe(value: string) {
  if (!/^\d{18}$/.test(value)) return false;
  const expected = computeClabeCheckDigit(value.slice(0, 17));
  return Number(value[17]) === expected;
}

const milestoneSchema = z.object({
  label: z.string().min(2).max(80),
  targetAmount: z.number().positive().max(10000000),
});

export const createStorySubmissionSchema = z
  .object({
    beneficiaryName: z.string().min(2).max(120),
    photoUrl: imageUrlSchema,
    city: z.string().min(2).max(120),
    category: z.enum([
      "sismo",
      "salud",
      "regresar-a-casa",
      "vivienda",
      "educacion",
    ]),
    story: z.string().min(50).max(3000),
    goalAmount: z.number().min(100).max(10000000),
    milestones: z.array(milestoneSchema).length(3),
    clabe: z
      .string()
      .regex(/^\d{18}$/)
      .refine((value) => isValidClabe(value), "La CLABE no es válida"),
    accountHolderName: z.string().min(2).max(120),
    entity: z.enum(["PERSON", "BUSINESS"]).default("PERSON"),
    taxId: z.string().max(20).optional().nullable(),
    contactEmail: z.string().email(),
  })
  .refine(
    (input) =>
      input.milestones.every((milestone) => milestone.targetAmount <= input.goalAmount),
    {
      message: "Las metas intermedias no pueden superar la meta total",
      path: ["milestones"],
    },
  );
