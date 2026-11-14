import { randomBytes, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { registerBankAccount, resolvePeyPlatformApiKey } from "@/lib/pey";
import { getStoryBySlug, upsertStory } from "@/lib/store";
import { Story } from "@/lib/types";
import { createStorySubmissionSchema } from "@/lib/validation";
import { maskClabe, toSlug } from "@/lib/utils";

export const runtime = "nodejs";

async function uniqueSlug(base: string) {
  const fallback = toSlug(base) || "historia";
  let candidate = fallback;
  let attempt = 1;
  while (await getStoryBySlug(candidate)) {
    attempt += 1;
    candidate = `${fallback}-${attempt}`;
  }
  return candidate;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const parsed = createStorySubmissionSchema.safeParse({
      beneficiaryName: payload.beneficiaryName,
      photoUrl: payload.photoUrl,
      city: payload.city,
      category: payload.category,
      story: payload.story,
      goalAmount: Number(payload.goalAmount),
      milestones: payload.milestones,
      clabe: payload.clabe,
      accountHolderName: payload.accountHolderName,
      entity: payload.entity ?? "PERSON",
      taxId: payload.taxId ?? null,
      contactEmail: payload.contactEmail,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const slug = await uniqueSlug(input.beneficiaryName);
    const previewToken = randomBytes(16).toString("hex");
    const now = new Date().toISOString();

    const platformCredential = resolvePeyPlatformApiKey();
    const registration = await registerBankAccount({
      alias: `Echale ${input.beneficiaryName}`.slice(0, 255),
      name: input.accountHolderName,
      clabe: input.clabe,
      entity: input.entity,
      taxId: input.taxId ?? null,
      apiKey: platformCredential.apiKey,
    });

    const story: Story = {
      id: randomUUID(),
      slug,
      personName: input.beneficiaryName,
      title: `${input.beneficiaryName} necesita echarle la mano`,
      summary: input.story.slice(0, 180),
      story: input.story,
      location: input.city,
      category: input.category,
      organizationName: "Organización aliada Échale",
      accountHolderName: registration.name || input.accountHolderName,
      clabe: registration.clabe || input.clabe,
      clabeMasked: maskClabe(registration.clabe || input.clabe),
      peyKeyEnv: "PEY_PLATFORM_API_KEY",
      peyEntity: registration.entity,
      peyTaxId: registration.taxId,
      bankAccountId: registration.id,
      codiStatus: registration.codiStatus,
      status: "en_revision",
      previewToken,
      contactEmail: input.contactEmail,
      goalAmount: Math.round(input.goalAmount),
      coverImage: input.photoUrl,
      galleryImages: [input.photoUrl],
      milestones: input.milestones.map((milestone, index) => ({
        id: `${slug}-m-${index + 1}`,
        label: milestone.label,
        targetAmount: Math.round(milestone.targetAmount),
      })),
      isExample: false,
      createdAt: now,
      updatedAt: now,
    };

    await upsertStory(story);
    revalidatePath("/admin");

    return NextResponse.json({
      ok: true,
      slug,
      status: story.status,
      codiStatus: story.codiStatus,
      bankAccountId: story.bankAccountId,
      previewPath: `/${slug}?preview=${previewToken}`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "No pudimos crear la página en este momento",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    );
  }
}
