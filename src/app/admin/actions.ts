"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { signInAdmin, signOutAdmin } from "@/lib/admin-auth";
import { getBankAccount, resolvePeyPlatformApiKey } from "@/lib/pey";
import { Story } from "@/lib/types";
import { toSlug } from "@/lib/utils";
import { adminStorySchema } from "@/lib/validation";
import {
  getStoryById,
  markPaymentReleased,
  updateStoryBankAccountStatus,
  updateStoryStatus,
  upsertStory,
} from "@/lib/store";

export async function loginAdminAction(_prev: unknown, formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const result = await signInAdmin(password);
  if (!result.ok) {
    return { error: result.error };
  }
  return { success: true };
}

export async function logoutAdminAction() {
  await signOutAdmin();
}

function parseLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function saveStoryAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim() || randomUUID();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const personName = String(formData.get("personName") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const story = String(formData.get("story") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const organizationName = String(formData.get("organizationName") ?? "").trim();
  const accountHolderName = String(formData.get("accountHolderName") ?? "").trim();
  const clabe = String(formData.get("clabe") ?? "").trim();
  const clabeMasked = String(formData.get("clabeMasked") ?? "").trim();
  const peyKeyEnv = String(formData.get("peyKeyEnv") ?? "").trim().toUpperCase();
  const peyEntity = String(formData.get("peyEntity") ?? "PERSON").trim();
  const peyTaxId = String(formData.get("peyTaxId") ?? "").trim();
  const bankAccountId = String(formData.get("bankAccountId") ?? "").trim();
  const codiStatus = String(formData.get("codiStatus") ?? "UNKNOWN").trim();
  const status = String(formData.get("status") ?? "aprobada").trim();
  const previewToken = String(formData.get("previewToken") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  const goalAmount = Number(formData.get("goalAmount") ?? 0);
  const coverImage = String(formData.get("coverImage") ?? "").trim();
  const galleryRaw = String(formData.get("galleryImages") ?? "");
  const milestonesRaw = String(formData.get("milestones") ?? "");
  const isExample = String(formData.get("isExample") ?? "") === "on";

  const galleryImages = parseLines(galleryRaw);
  const milestones = parseLines(milestonesRaw).map((line, index) => {
    const [label, amountRaw] = line.split("|").map((chunk) => chunk.trim());
    return {
      id: `${id}-m-${index + 1}`,
      label,
      targetAmount: Number(amountRaw),
    };
  });

  const current = await getStoryById(id);
  const candidate: Story = {
    id,
    slug: toSlug(slugInput || personName),
    personName,
    title,
    summary,
    story,
    location,
    category: category as Story["category"],
    organizationName,
    accountHolderName,
    clabe: clabe || null,
    clabeMasked,
    peyKeyEnv: peyKeyEnv || "PEY_API_KEY",
    peyEntity: peyEntity as Story["peyEntity"],
    peyTaxId: peyTaxId || null,
    bankAccountId: bankAccountId || null,
    codiStatus: codiStatus as Story["codiStatus"],
    status: status as Story["status"],
    previewToken: previewToken || null,
    contactEmail,
    goalAmount,
    coverImage,
    galleryImages,
    milestones,
    isExample,
    createdAt: current?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const parsed = adminStorySchema.safeParse(candidate);
  if (!parsed.success) {
    throw new Error(`Formulario inválido: ${JSON.stringify(parsed.error.flatten())}`);
  }

  const validatedStory: Story = {
    ...parsed.data,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
  };

  await upsertStory(validatedStory);
  revalidatePath("/");
  revalidatePath(`/${validatedStory.slug}`);
  revalidatePath("/admin");
}

export async function markReleasedAction(formData: FormData) {
  const paymentId = String(formData.get("paymentId") ?? "");
  if (!paymentId) return;
  await markPaymentReleased(paymentId);
  revalidatePath("/admin");
}

export async function approveStoryAction(formData: FormData) {
  const storyId = String(formData.get("storyId") ?? "");
  if (!storyId) return;
  await updateStoryStatus(storyId, "aprobada");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function rejectStoryAction(formData: FormData) {
  const storyId = String(formData.get("storyId") ?? "");
  if (!storyId) return;
  await updateStoryStatus(storyId, "rechazada");
  revalidatePath("/admin");
}

export async function refreshBankAccountStatusAction(formData: FormData) {
  const storyId = String(formData.get("storyId") ?? "");
  const bankAccountId = String(formData.get("bankAccountId") ?? "");
  if (!storyId || !bankAccountId) return;

  const platformCredential = resolvePeyPlatformApiKey();
  const account = await getBankAccount({
    id: bankAccountId,
    apiKey: platformCredential.apiKey,
  });

  await updateStoryBankAccountStatus({
    storyId,
    bankAccountId,
    codiStatus: account.codiStatus,
    clabe: account.clabe || null,
    accountHolderName: account.name || null,
    peyTaxId: account.taxId,
  });

  revalidatePath("/admin");
  revalidatePath("/");
}
