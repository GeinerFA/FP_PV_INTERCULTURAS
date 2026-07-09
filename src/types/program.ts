import type { AppLocale } from "@/config/i18n";

export const programCategories = ["volunteer", "internships", "spanish-classes"] as const;

export const programStatuses = ["draft", "published", "archived"] as const;

export type ProgramCategory = (typeof programCategories)[number];

export type ProgramStatus = (typeof programStatuses)[number];

export type ProgramWorkflowState = ProgramStatus;

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

export type ProgramSnapshot = {
  slug: string;
  category: ProgramCategory;
  featured: boolean;
  coverImage: string;
  location: LocalizedText;
  duration: LocalizedText;
  availability: LocalizedText;
  translations: Record<AppLocale, ProgramTranslation>;
  seo: Record<AppLocale, ProgramSeoEntry>;
};

export type ProgramSourceEntry = ProgramSnapshot & {
  id: string;
  status: ProgramStatus;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type ProgramRecord = {
  id: string;
  workflowState: ProgramWorkflowState;
  draftSnapshot: ProgramSnapshot;
  publishedSnapshot: ProgramSnapshot | null;
  firstPublishedAt: string | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type Program = ProgramRecord &
  ProgramSnapshot & {
    status: ProgramStatus;
  };

export type CreateProgramRecordInput = {
  draftSnapshot: ProgramSnapshot;
  createdBy: string;
  updatedBy: string;
};

export type UpdateProgramDraftInput = {
  id: string;
  draftSnapshot: ProgramSnapshot;
  updatedBy: string;
};

export type PublishProgramInput = {
  id: string;
  updatedBy: string;
};

export type ProgramWorkflowMutationInput = {
  id: string;
  updatedBy: string;
};

export type LocalizedProgram = {
  id: string;
  slug: string;
  category: ProgramCategory;
  status: ProgramStatus;
  workflowState: ProgramWorkflowState;
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
  firstPublishedAt: string | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};
