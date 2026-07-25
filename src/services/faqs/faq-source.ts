import messages from "../../../messages/es.json";

import type { FaqEntry } from "@/types/faq";

type LegacyFaqMessages = {
  entries?: Record<string, { question?: string; answer?: string }>;
};

const legacyFaqMessages = messages.Faqs as LegacyFaqMessages;

export function getLegacyFaqSeedEntries(): Array<Pick<FaqEntry, "question" | "answer" | "order">> {
  return Object.values(legacyFaqMessages.entries ?? {})
    .map((entry, index) => ({
      question: entry.question?.trim() ?? "",
      answer: entry.answer?.trim() ?? "",
      order: index + 1,
    }))
    .filter((entry) => entry.question.length > 0 && entry.answer.length > 0);
}
