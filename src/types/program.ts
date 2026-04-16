import type { AppLocale } from "@/config/i18n";

export const programCategories = ["volunteer", "internships", "spanish-classes"] as const;

export const programStatuses = ["draft", "published"] as const;

export type ProgramCategory = (typeof programCategories)[number];

export type ProgramStatus = (typeof programStatuses)[number];

export type LocalizedText = Record<AppLocale, string>;

export type ProgramTranslation = {
  title: string;
  shortDescription: string;
  fullDescription: string;
  requirements: string[];
  included: string[];
};

export type ProgramSeoEntry = {
  title: string;
  description: string;
};

export type Program = {
  id: string;
  slug: string;
  category: ProgramCategory;
  status: ProgramStatus;
  featured: boolean;
  coverImage: string;
  location: LocalizedText;
  duration: LocalizedText;
  availability: LocalizedText;
  translations: Record<AppLocale, ProgramTranslation>;
  seo: Record<AppLocale, ProgramSeoEntry>;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type LocalizedProgram = {
  id: string;
  slug: string;
  category: ProgramCategory;
  status: ProgramStatus;
  featured: boolean;
  coverImage: string;
  location: string;
  duration: string;
  availability: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  requirements: string[];
  included: string[];
  seoTitle: string;
  seoDescription: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};
