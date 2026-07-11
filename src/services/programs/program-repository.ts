import { type HydratedDocument, Types } from "mongoose";

import { defaultLocale, locales } from "@/config/i18n";
import { connectToDatabase } from "@/lib/mongoose";
import { ProgramModel, type ProgramDocument } from "@/models/program";
import type {
  CreateProgramRecordInput,
  ProgramCoverImageState,
  ProgramImageAssetUpload,
  ProgramRecord,
  ProgramSnapshot,
  ProgramWorkflowMutationInput,
  PublishProgramInput,
  UpdateProgramDraftInput,
} from "@/types/program";
import {
  parseProgramRecord,
  parseProgramSnapshot,
  validateProgramSnapshotForPublish,
  validatePublishedSlugImmutability,
} from "@/validators/program";

import { programCatalog } from "./program-source";

const legacyProgramFallbackCoverImage =
  "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1200&q=80";

let programRepositoryMaintenancePromise: Promise<void> | null = null;
let programSeedBootstrapPromise: Promise<void> | null = null;

type RawProgramDocument = {
  _id: Types.ObjectId;
  workflowState: unknown;
  draftSnapshot: unknown;
  publishedSnapshot: unknown;
  firstPublishedAt: unknown;
  createdBy: unknown;
  updatedBy: unknown;
  createdAt: unknown;
  updatedAt: unknown;
  slug?: unknown;
  title?: unknown;
  description?: unknown;
  requirements?: unknown;
  location?: unknown;
  duration?: unknown;
  imageUrl?: unknown;
  active?: unknown;
};

type PersistedProgramMutation = {
  workflowState: ProgramRecord["workflowState"];
  draftSnapshot: ProgramSnapshot;
  publishedSnapshot: ProgramSnapshot | null;
  firstPublishedAt: Date | null;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
};

const programCoverImageProjection = {
  "draftSnapshot.coverImageAsset.data": 0,
  "publishedSnapshot.coverImageAsset.data": 0,
} as const;

function isLegacyProgramDocument(document: RawProgramDocument): boolean {
  return document.draftSnapshot === null || document.draftSnapshot === undefined;
}

function normalizeLegacyString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function createLocalizedText(value: string) {
  return Object.fromEntries(locales.map((locale) => [locale, value])) as unknown as ProgramSnapshot["location"];
}

function splitLegacyList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter((entry) => entry.length > 0);
  }

  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function normalizeLegacySlug(value: string, fallback: string): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized.length > 0 ? normalized : fallback;
}

function buildProgramCoverImagePath(id: string, state: ProgramCoverImageState): string {
  return `/api/programs/${id}/cover-image?state=${state}`;
}

function normalizeProgramSnapshotCoverImage(
  id: string,
  state: ProgramCoverImageState,
  snapshot: ProgramSnapshot,
): ProgramSnapshot {
  const parsedSnapshot = parseProgramSnapshot(snapshot);

  if (!parsedSnapshot.coverImageAsset) {
    return parsedSnapshot;
  }

  return parseProgramSnapshot({
    ...parsedSnapshot,
    coverImage: buildProgramCoverImagePath(id, state),
  });
}

function preserveExistingCoverImageAsset(
  currentSnapshot: ProgramSnapshot,
  nextSnapshot: ProgramSnapshot,
): ProgramSnapshot {
  if (
    nextSnapshot.coverImageAsset ||
    !currentSnapshot.coverImageAsset ||
    nextSnapshot.coverImage !== currentSnapshot.coverImage
  ) {
    return nextSnapshot;
  }

  return parseProgramSnapshot({
    ...nextSnapshot,
    coverImageAsset: currentSnapshot.coverImageAsset,
  });
}

function buildLegacyProgramSnapshot(document: RawProgramDocument): ProgramSnapshot {
  const fallbackSlug = `legacy-program-${document._id.toString().slice(-6).toLowerCase()}`;
  const title = normalizeLegacyString(document.title) || "Programa legado";
  const description = normalizeLegacyString(document.description) || title;
  const requirements = splitLegacyList(document.requirements);
  const included = ["Acompañamiento básico del equipo local"];
  const snapshot = {
    slug: normalizeLegacySlug(normalizeLegacyString(document.slug) || title, fallbackSlug),
    category: "volunteer",
    featured: false,
    coverImage: normalizeLegacyString(document.imageUrl) || legacyProgramFallbackCoverImage,
    location: createLocalizedText(normalizeLegacyString(document.location)),
    duration: createLocalizedText(normalizeLegacyString(document.duration)),
    availability: createLocalizedText(
      typeof document.active === "boolean" && document.active === false
        ? "No disponible"
        : "Consultar disponibilidad",
    ),
    translations: Object.fromEntries(
      locales.map((locale) => [
        locale,
        {
          title,
          shortDescription: description,
          fullDescription: description,
          requirements,
          included,
        },
      ]),
    ) as unknown as ProgramSnapshot["translations"],
    seo: Object.fromEntries(
      locales.map((locale) => [
        locale,
        {
          title,
          description,
        },
      ]),
    ) as unknown as ProgramSnapshot["seo"],
  } satisfies ProgramSnapshot;

  return parseProgramSnapshot(snapshot, "legacyProgramSnapshot");
}

function buildLegacyProgramRecord(document: RawProgramDocument): ProgramRecord {
  const createdAt = normalizeDateLike(document.createdAt, new Date(0).toISOString());
  const updatedAt = normalizeDateLike(document.updatedAt, createdAt);
  const workflowState = document.active === false ? "archived" : "published";
  const draftSnapshot = buildLegacyProgramSnapshot(document);
  const publishedSnapshot = workflowState === "published" ? draftSnapshot : null;

  return parseProgramRecord({
    id: document._id.toString(),
    workflowState,
    draftSnapshot,
    publishedSnapshot,
    firstPublishedAt: publishedSnapshot ? updatedAt : null,
    createdBy: "legacy-bootstrap",
    updatedBy: "legacy-bootstrap",
    createdAt,
    updatedAt,
  });
}

function toPersistedProgramMutation(record: ProgramRecord): PersistedProgramMutation {
  return {
    workflowState: record.workflowState,
    draftSnapshot: record.draftSnapshot,
    publishedSnapshot: record.publishedSnapshot,
    firstPublishedAt: record.firstPublishedAt ? new Date(record.firstPublishedAt) : null,
    createdBy: record.createdBy,
    updatedBy: record.updatedBy,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  };
}

function normalizeDateLike(value: unknown, fallback: string): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsedDate = new Date(value);

    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString();
    }
  }

  return fallback;
}

function normalizeProgramRecordDocument(document: RawProgramDocument) {
  const createdAt = normalizeDateLike(document.createdAt, new Date(0).toISOString());
  const updatedAt = normalizeDateLike(document.updatedAt, createdAt);

  return {
    id: document._id.toString(),
    workflowState: document.workflowState,
    draftSnapshot: document.draftSnapshot,
    publishedSnapshot: document.publishedSnapshot,
    firstPublishedAt:
      document.firstPublishedAt === null || document.firstPublishedAt === undefined
        ? null
        : normalizeDateLike(document.firstPublishedAt, updatedAt),
    createdBy: typeof document.createdBy === "string" ? document.createdBy : "",
    updatedBy: typeof document.updatedBy === "string" ? document.updatedBy : "",
    createdAt,
    updatedAt,
  };
}

function mapProgramRecord(document: RawProgramDocument): ProgramRecord {
  if (isLegacyProgramDocument(document)) {
    return buildLegacyProgramRecord(document);
  }

  return parseProgramRecord(normalizeProgramRecordDocument(document));
}

function mapSeedSnapshot(seed: (typeof programCatalog)[number]): ProgramSnapshot {
  return parseProgramSnapshot({
    slug: seed.slug,
    category: seed.category,
    featured: seed.featured,
    coverImage: seed.coverImage,
    location: seed.location,
    duration: seed.duration,
    availability: seed.availability,
    translations: seed.translations,
    seo: seed.seo,
  });
}

function toLegacyCompatibilityFields(snapshot: ProgramSnapshot, active: boolean) {
  const translation = snapshot.translations[defaultLocale];

  return {
    title: translation.title,
    slug: snapshot.slug,
    description: translation.fullDescription,
    requirements: translation.requirements.join("\n"),
    location: snapshot.location[defaultLocale],
    duration: snapshot.duration[defaultLocale],
    imageUrl: snapshot.coverImage,
    active,
  };
}

function selectLegacyCompatibilitySnapshot(
  workflowState: ProgramRecord["workflowState"],
  draftSnapshot: ProgramSnapshot,
  publishedSnapshot: ProgramSnapshot | null,
): ProgramSnapshot {
  if ((workflowState === "published" || workflowState === "archived") && publishedSnapshot) {
    return publishedSnapshot;
  }

  return draftSnapshot;
}

function toLegacyCompatibilityUpdate(
  workflowState: ProgramRecord["workflowState"],
  draftSnapshot: ProgramSnapshot,
  publishedSnapshot: ProgramSnapshot | null,
) {
  return toLegacyCompatibilityFields(
    selectLegacyCompatibilitySnapshot(workflowState, draftSnapshot, publishedSnapshot),
    workflowState === "published",
  );
}

function toProgramSeedDocument(seed: (typeof programCatalog)[number]) {
  const snapshot = mapSeedSnapshot(seed);
  const isPublished = seed.status === "published";

  return {
    workflowState: seed.status,
    draftSnapshot: snapshot,
    publishedSnapshot: isPublished ? snapshot : null,
    firstPublishedAt: isPublished ? new Date(seed.updatedAt) : null,
    createdBy: seed.createdBy,
    updatedBy: seed.updatedBy,
    createdAt: new Date(seed.createdAt),
    updatedAt: new Date(seed.updatedAt),
    ...toLegacyCompatibilityFields(snapshot, isPublished),
  };
}

async function runProgramRepositoryMaintenance(): Promise<void> {
  const legacyDocuments = await ProgramModel.find({ draftSnapshot: { $exists: false } }).lean().exec();

  if (legacyDocuments.length > 0) {
    await Promise.all(
      legacyDocuments.map(async (document) => {
        const record = buildLegacyProgramRecord(document as RawProgramDocument);

        await ProgramModel.updateOne(
          { _id: document._id },
          {
            $set: toPersistedProgramMutation(record) as unknown as Record<string, unknown>,
          },
        ).exec();
      }),
    );
  }

  await ProgramModel.syncIndexes();
}

async function runProgramSeedBootstrap(): Promise<void> {
  await ensureProgramRepositoryMaintenance();

  const existingDocuments = await ProgramModel.find({}, { draftSnapshot: 1 }).lean().exec();
  const existingSlugs = new Set(
    existingDocuments
      .map((document) => {
        const draftSnapshot = document.draftSnapshot as { slug?: unknown } | undefined;
        return typeof draftSnapshot?.slug === "string" ? draftSnapshot.slug.trim().toLowerCase() : "";
      })
      .filter((slug) => slug.length > 0),
  );

  const missingSeedPrograms = programCatalog.filter((program) => !existingSlugs.has(program.slug));

  if (missingSeedPrograms.length === 0) {
    return;
  }

  await Promise.all(
    missingSeedPrograms.map(async (program) => {
      await ProgramModel.collection.updateOne(
        { "draftSnapshot.slug": program.slug },
        {
          $setOnInsert: toProgramSeedDocument(program) as unknown as Record<string, unknown>,
        },
        { upsert: true },
      );
    }),
  );
}

async function ensureProgramRepositoryMaintenance(): Promise<void> {
  await connectToDatabase();

  if (!programRepositoryMaintenancePromise) {
    programRepositoryMaintenancePromise = runProgramRepositoryMaintenance().catch((error) => {
      programRepositoryMaintenancePromise = null;
      throw error;
    });
  }

  await programRepositoryMaintenancePromise;
}

async function ensureProgramBootstrap(options?: { seedBootstrap?: boolean }): Promise<void> {
  await ensureProgramRepositoryMaintenance();

  if (!options?.seedBootstrap) {
    return;
  }

  if (!programSeedBootstrapPromise) {
    programSeedBootstrapPromise = runProgramSeedBootstrap().catch((error) => {
      programSeedBootstrapPromise = null;
      throw error;
    });
  }

  await programSeedBootstrapPromise;
}

function assertActor(value: string, path: string): string {
  if (value.trim().length === 0) {
    throw new Error(`${path} must be a non-empty string.`);
  }

  return value.trim();
}

async function getCurrentRecordOrNull(
  id: string,
  options?: { includeAssetData?: boolean },
): Promise<ProgramRecord | null> {
  if (!Types.ObjectId.isValid(id)) {
    return null;
  }

  await ensureProgramRepositoryMaintenance();

  const query = ProgramModel.findById(id);

  if (!options?.includeAssetData) {
    query.select(programCoverImageProjection);
  }

  const document = await query.lean().exec();

  return document ? mapProgramRecord(document as RawProgramDocument) : null;
}

export type ProgramRepository = {
  list(options?: { seedBootstrap?: boolean }): Promise<ProgramRecord[]>;
  findById(id: string): Promise<ProgramRecord | null>;
  findCoverImageById(id: string, state: ProgramCoverImageState): Promise<ProgramImageAssetUpload | null>;
  findPublishedBySlug(slug: string): Promise<ProgramRecord | null>;
  create(input: CreateProgramRecordInput): Promise<ProgramRecord>;
  saveDraft(input: UpdateProgramDraftInput): Promise<ProgramRecord | null>;
  publish(input: PublishProgramInput): Promise<ProgramRecord | null>;
  archive(input: ProgramWorkflowMutationInput): Promise<ProgramRecord | null>;
  reactivate(input: ProgramWorkflowMutationInput): Promise<ProgramRecord | null>;
};

const mongoProgramRepository: ProgramRepository = {
  async list(options) {
    if (options?.seedBootstrap) {
      await ensureProgramBootstrap({ seedBootstrap: true });
    } else {
      await ensureProgramBootstrap();
    }

    const documents = await ProgramModel.find({})
      .select(programCoverImageProjection)
      .sort({ updatedAt: -1 })
      .lean()
      .exec();

    return documents.map((document) => mapProgramRecord(document as RawProgramDocument));
  },
  async findById(id) {
    return getCurrentRecordOrNull(id);
  },
  async findCoverImageById(id, state) {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    await ensureProgramRepositoryMaintenance();

    const selectPath = state === "draft" ? "draftSnapshot.coverImageAsset" : "publishedSnapshot.coverImageAsset";
    const document = await ProgramModel.findById(id).select({ [selectPath]: 1 }).exec();
    const coverImageAsset = document?.get(selectPath) as
      | {
          fileName?: unknown;
          contentType?: unknown;
          sizeBytes?: unknown;
          uploadedAt?: unknown;
          data?: unknown;
        }
      | null
      | undefined;

    if (
      !coverImageAsset ||
      typeof coverImageAsset.fileName !== "string" ||
      typeof coverImageAsset.contentType !== "string" ||
      typeof coverImageAsset.sizeBytes !== "number" ||
      !(coverImageAsset.uploadedAt instanceof Date) ||
      !Buffer.isBuffer(coverImageAsset.data)
    ) {
      return null;
    }

    return {
      fileName: coverImageAsset.fileName.trim(),
      contentType: coverImageAsset.contentType.trim(),
      sizeBytes: coverImageAsset.sizeBytes,
      uploadedAt: coverImageAsset.uploadedAt.toISOString(),
      data: coverImageAsset.data,
    };
  },
  async findPublishedBySlug(slug) {
    const normalizedSlug = slug.trim();

    if (normalizedSlug.length === 0) {
      return null;
    }

    await ensureProgramBootstrap({ seedBootstrap: true });

    const document = await ProgramModel.findOne({
      workflowState: "published",
      "publishedSnapshot.slug": normalizedSlug,
    })
      .select(programCoverImageProjection)
      .lean()
      .exec();

    return document ? mapProgramRecord(document as RawProgramDocument) : null;
  },
  async create({ draftSnapshot, createdBy, updatedBy }) {
    await ensureProgramRepositoryMaintenance();

    const parsedDraftSnapshot = parseProgramSnapshot(draftSnapshot);
    const document = (await ProgramModel.create({
      workflowState: "draft",
      draftSnapshot: parsedDraftSnapshot,
      publishedSnapshot: null,
      firstPublishedAt: null,
      createdBy: assertActor(createdBy, "createProgramRecordInput.createdBy"),
      updatedBy: assertActor(updatedBy, "createProgramRecordInput.updatedBy"),
      ...toLegacyCompatibilityFields(parsedDraftSnapshot, false),
    })) as HydratedDocument<ProgramDocument>;

    const createdRecord = mapProgramRecord(document.toObject() as RawProgramDocument);

    if (!parsedDraftSnapshot.coverImageAsset) {
      return createdRecord;
    }

    const normalizedDraftSnapshot = normalizeProgramSnapshotCoverImage(
      createdRecord.id,
      "draft",
      createdRecord.draftSnapshot,
    );
    await ProgramModel.updateOne(
      { _id: createdRecord.id },
      {
        $set: {
          "draftSnapshot.coverImage": normalizedDraftSnapshot.coverImage,
          imageUrl: normalizedDraftSnapshot.coverImage,
        },
      },
    ).exec();

    return (await getCurrentRecordOrNull(createdRecord.id)) ?? createdRecord;
  },
  async saveDraft({ id, draftSnapshot, updatedBy }) {
    const currentRecord = await getCurrentRecordOrNull(id, { includeAssetData: true });

    if (!currentRecord) {
      return null;
    }

    const parsedDraftSnapshot = normalizeProgramSnapshotCoverImage(
      id,
      "draft",
      preserveExistingCoverImageAsset(currentRecord.draftSnapshot, parseProgramSnapshot(draftSnapshot)),
    );

    validatePublishedSlugImmutability(currentRecord, parsedDraftSnapshot, "draftSnapshot");

    const document = await ProgramModel.findByIdAndUpdate(
      id,
      {
        $set: {
          draftSnapshot: parsedDraftSnapshot,
          updatedBy: assertActor(updatedBy, "updateProgramDraftInput.updatedBy"),
          ...toLegacyCompatibilityUpdate(
            currentRecord.workflowState,
            parsedDraftSnapshot,
            currentRecord.publishedSnapshot,
          ),
        },
      },
      { returnDocument: "after" },
    )
      .select(programCoverImageProjection)
      .lean()
      .exec();

    return document ? mapProgramRecord(document as RawProgramDocument) : null;
  },
  async publish({ id, updatedBy }) {
    const currentRecord = await getCurrentRecordOrNull(id, { includeAssetData: true });

    if (!currentRecord) {
      return null;
    }

    validateProgramSnapshotForPublish(currentRecord.draftSnapshot, "draftSnapshot");
    validatePublishedSlugImmutability(currentRecord, currentRecord.draftSnapshot, "draftSnapshot");

    const publishedSnapshot = normalizeProgramSnapshotCoverImage(id, "published", currentRecord.draftSnapshot);

    const now = new Date();
    const document = await ProgramModel.findByIdAndUpdate(
      id,
      {
        $set: {
          workflowState: "published",
          draftSnapshot: publishedSnapshot,
          publishedSnapshot,
          firstPublishedAt: currentRecord.firstPublishedAt ? new Date(currentRecord.firstPublishedAt) : now,
          updatedBy: assertActor(updatedBy, "publishProgramInput.updatedBy"),
          ...toLegacyCompatibilityFields(publishedSnapshot, true),
        },
      },
      { returnDocument: "after" },
    )
      .select(programCoverImageProjection)
      .lean()
      .exec();

    return document ? mapProgramRecord(document as RawProgramDocument) : null;
  },
  async archive({ id, updatedBy }) {
    const currentRecord = await getCurrentRecordOrNull(id);

    if (!currentRecord) {
      return null;
    }

    const document = await ProgramModel.findByIdAndUpdate(
      id,
      {
        $set: {
          workflowState: "archived",
          updatedBy: assertActor(updatedBy, "programWorkflowMutationInput.updatedBy"),
          ...toLegacyCompatibilityUpdate(
            "archived",
            currentRecord.draftSnapshot,
            currentRecord.publishedSnapshot,
          ),
        },
      },
      { returnDocument: "after" },
    )
      .select(programCoverImageProjection)
      .lean()
      .exec();

    return document ? mapProgramRecord(document as RawProgramDocument) : null;
  },
  async reactivate({ id, updatedBy }) {
    const currentRecord = await getCurrentRecordOrNull(id);

    if (!currentRecord) {
      return null;
    }

    const document = await ProgramModel.findByIdAndUpdate(
      id,
      {
        $set: {
          workflowState: "draft",
          updatedBy: assertActor(updatedBy, "programWorkflowMutationInput.updatedBy"),
          ...toLegacyCompatibilityUpdate(
            "draft",
            currentRecord.draftSnapshot,
            currentRecord.publishedSnapshot,
          ),
        },
      },
      { returnDocument: "after" },
    )
      .select(programCoverImageProjection)
      .lean()
      .exec();

    return document ? mapProgramRecord(document as RawProgramDocument) : null;
  },
};

export function getProgramRepository(): ProgramRepository {
  return mongoProgramRepository;
}
