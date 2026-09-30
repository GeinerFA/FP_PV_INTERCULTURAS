import type { AppLocale, TranslationTargetLocale } from "@/config/i18n";
import type { TranslationMeta } from "@/lib/translation/types";
import type { ProgramCategory, ProgramCategorySummary } from "@/types/category";

export const programStatuses = ["draft", "published", "archived"] as const;

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

export type ProgramImageAssetSummary = {
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
};

export type ProgramImageAssetUpload = ProgramImageAssetSummary & {
  data: Buffer;
};

export type ProgramImageAsset = ProgramImageAssetSummary | ProgramImageAssetUpload;

export type ProgramCoverImageState = "draft" | "published";

export type ProgramSnapshot = {
  slug: string;
  category: ProgramCategory;
  featured: boolean;
  coverImage: string;
  coverImageAsset?: ProgramImageAsset | null;
  location: LocalizedText;
  duration: LocalizedText;
  availability: LocalizedText;
  translations: Record<AppLocale, ProgramTranslation>;
  seo: Record<AppLocale, ProgramSeoEntry>;
  /** Origin and freshness of each translated locale; absent until the locale is first translated. */
  translationMeta?: ProgramTranslationMetaMap;
};

export type ProgramTranslationMetaMap = Partial<Record<TranslationTargetLocale, TranslationMeta>>;

/** Every translatable text of a program in one locale: the same list is hashed, translated and edited. */
export type ProgramTranslatableContent = {
  title: string;
  shortDescription: string;
  fullDescription: string;
  requirements: string[];
  included: string[];
  location: string;
  duration: string;
  availability: string;
  seoTitle: string;
  seoDescription: string;
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
    categoryDetails: ProgramCategorySummary | null;
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

export type DeleteProgramInput = {
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
   categoryDetails: ProgramCategorySummary | null;
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
