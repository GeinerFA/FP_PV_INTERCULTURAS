import type { TranslationTargetLocale } from "@/config/i18n";
import type { TranslationMeta } from "@/lib/translation/types";

export const faqMoveDirections = ["up", "down"] as const;

export type FaqMoveDirection = (typeof faqMoveDirections)[number];

export const faqTranslatableFields = ["question", "answer"] as const;

export type FaqTranslatableContent = Record<(typeof faqTranslatableFields)[number], string>;

export type FaqTranslation = {
  content: FaqTranslatableContent;
  meta: TranslationMeta;
};

export type FaqEntry = {
  id: string;
  /** Source-locale question and answer. */
  question: string;
  answer: string;
  translations: Partial<Record<TranslationTargetLocale, FaqTranslation>>;
  order: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateFaqInput = {
  question: string;
  answer: string;
  createdBy: string;
  updatedBy: string;
};

export type UpdateFaqInput = {
  id: string;
  question: string;
  answer: string;
  updatedBy: string;
};

export type DeleteFaqInput = {
  id: string;
};

export type MoveFaqInput = {
  id: string;
  direction: FaqMoveDirection;
  updatedBy: string;
};
