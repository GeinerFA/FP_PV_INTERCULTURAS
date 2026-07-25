import type { AppLocale } from "@/config/i18n";
import type { CreateFaqInput, DeleteFaqInput, FaqEntry, MoveFaqInput, UpdateFaqInput } from "@/types/faq";

import { getFaqRepository } from "./faq-repository";
import { getLegacyFaqSeedEntries } from "./faq-source";

function isRecoverablePublicFaqReadError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === "MongooseServerSelectionError" ||
    error.name === "MongoServerSelectionError" ||
    error.name === "MongoParseError" ||
    error.message.includes("MONGODB_URI environment variable is required") ||
    error.message.includes("MONGODB_SERVER_SELECTION_TIMEOUT_MS must be a positive number")
  );
}

function buildPublicFallbackEntries(): FaqEntry[] {
  const now = new Date(0).toISOString();

  return getLegacyFaqSeedEntries().map((entry, index) => ({
    id: `legacy-faq-${index + 1}`,
    question: entry.question,
    answer: entry.answer,
    order: entry.order,
    createdBy: "legacy-bootstrap",
    updatedBy: "legacy-bootstrap",
    createdAt: now,
    updatedAt: now,
  }));
}

export async function listPublicFaqEntries(locale: AppLocale): Promise<FaqEntry[]> {
  try {
    return await getFaqRepository().list({ seedBootstrap: true });
  } catch (error) {
    if (!isRecoverablePublicFaqReadError(error)) {
      throw error;
    }

    console.error(`[faq-service] listPublicFaqEntries fallback (${locale})`, error);
    return buildPublicFallbackEntries();
  }
}

export async function listAdminFaqEntries(): Promise<FaqEntry[]> {
  return getFaqRepository().list({ seedBootstrap: true });
}

export async function createAdminFaq(input: CreateFaqInput): Promise<FaqEntry> {
  return getFaqRepository().create(input);
}

export async function updateAdminFaq(input: UpdateFaqInput): Promise<FaqEntry | null> {
  return getFaqRepository().update(input);
}

export async function deleteAdminFaq(input: DeleteFaqInput): Promise<FaqEntry | null> {
  return getFaqRepository().delete(input);
}

export async function moveAdminFaq(input: MoveFaqInput): Promise<FaqEntry[] | null> {
  return getFaqRepository().move(input);
}
