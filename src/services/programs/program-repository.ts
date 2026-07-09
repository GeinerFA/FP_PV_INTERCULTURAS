import { type HydratedDocument, Types } from "mongoose";

import { locales } from "@/config/i18n";
import { connectToDatabase } from "@/lib/mongoose";
import { ProgramModel, type ProgramDocument } from "@/models/program";
import type {
  CreateProgramRecordInput,
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

let programBootstrapPromise: Promise<void> | null = null;

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

function toProgramSeedDocument(seed: (typeof programCatalog)[number]) {
  const snapshot = mapSeedSnapshot(seed);

  return {
    workflowState: seed.status,
    draftSnapshot: snapshot,
    publishedSnapshot: seed.status === "published" ? snapshot : null,
    firstPublishedAt: seed.status === "published" ? new Date(seed.updatedAt) : null,
    createdBy: seed.createdBy,
    updatedBy: seed.updatedBy,
    createdAt: new Date(seed.createdAt),
    updatedAt: new Date(seed.updatedAt),
  };
}

async function runProgramBootstrap(): Promise<void> {
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

  try {
    await ProgramModel.insertMany(missingSeedPrograms.map((program) => toProgramSeedDocument(program)), {
      ordered: false,
    });
  } catch (error) {
    const seededCount = await ProgramModel.countDocuments({ draftSnapshot: { $exists: true } }).exec();

    if (seededCount === 0) {
      throw error;
    }
  }
}

async function ensureProgramBootstrap(): Promise<void> {
  await connectToDatabase();

  if (!programBootstrapPromise) {
    programBootstrapPromise = runProgramBootstrap().catch((error) => {
      programBootstrapPromise = null;
      throw error;
    });
  }

  await programBootstrapPromise;
}

function assertActor(value: string, path: string): string {
  if (value.trim().length === 0) {
    throw new Error(`${path} must be a non-empty string.`);
  }

  return value.trim();
}

async function getCurrentRecordOrNull(id: string): Promise<ProgramRecord | null> {
  if (!Types.ObjectId.isValid(id)) {
    return null;
  }

  await ensureProgramBootstrap();

  const document = await ProgramModel.findById(id).lean().exec();

  return document ? mapProgramRecord(document as RawProgramDocument) : null;
}

export type ProgramRepository = {
  list(): Promise<ProgramRecord[]>;
  findById(id: string): Promise<ProgramRecord | null>;
  findPublishedBySlug(slug: string): Promise<ProgramRecord | null>;
  create(input: CreateProgramRecordInput): Promise<ProgramRecord>;
  saveDraft(input: UpdateProgramDraftInput): Promise<ProgramRecord | null>;
  publish(input: PublishProgramInput): Promise<ProgramRecord | null>;
  archive(input: ProgramWorkflowMutationInput): Promise<ProgramRecord | null>;
  reactivate(input: ProgramWorkflowMutationInput): Promise<ProgramRecord | null>;
};

const mongoProgramRepository: ProgramRepository = {
  async list() {
    await ensureProgramBootstrap();

    const documents = await ProgramModel.find({}).sort({ updatedAt: -1 }).lean().exec();

    return documents.map((document) => mapProgramRecord(document as RawProgramDocument));
  },
  async findById(id) {
    return getCurrentRecordOrNull(id);
  },
  async findPublishedBySlug(slug) {
    const normalizedSlug = slug.trim();

    if (normalizedSlug.length === 0) {
      return null;
    }

    await ensureProgramBootstrap();

    const document = await ProgramModel.findOne({
      workflowState: "published",
      "publishedSnapshot.slug": normalizedSlug,
    })
      .lean()
      .exec();

    return document ? mapProgramRecord(document as RawProgramDocument) : null;
  },
  async create({ draftSnapshot, createdBy, updatedBy }) {
    await ensureProgramBootstrap();

    const parsedDraftSnapshot = parseProgramSnapshot(draftSnapshot);
    const document = (await ProgramModel.create({
      workflowState: "draft",
      draftSnapshot: parsedDraftSnapshot,
      publishedSnapshot: null,
      firstPublishedAt: null,
      createdBy: assertActor(createdBy, "createProgramRecordInput.createdBy"),
      updatedBy: assertActor(updatedBy, "createProgramRecordInput.updatedBy"),
    })) as HydratedDocument<ProgramDocument>;

    return mapProgramRecord(document.toObject() as RawProgramDocument);
  },
  async saveDraft({ id, draftSnapshot, updatedBy }) {
    const currentRecord = await getCurrentRecordOrNull(id);

    if (!currentRecord) {
      return null;
    }

    const parsedDraftSnapshot = parseProgramSnapshot(draftSnapshot);

    validatePublishedSlugImmutability(currentRecord, parsedDraftSnapshot, "draftSnapshot");

    const document = await ProgramModel.findByIdAndUpdate(
      id,
      {
        $set: {
          draftSnapshot: parsedDraftSnapshot,
          updatedBy: assertActor(updatedBy, "updateProgramDraftInput.updatedBy"),
        },
      },
      { returnDocument: "after" },
    )
      .lean()
      .exec();

    return document ? mapProgramRecord(document as RawProgramDocument) : null;
  },
  async publish({ id, updatedBy }) {
    const currentRecord = await getCurrentRecordOrNull(id);

    if (!currentRecord) {
      return null;
    }

    validateProgramSnapshotForPublish(currentRecord.draftSnapshot, "draftSnapshot");
    validatePublishedSlugImmutability(currentRecord, currentRecord.draftSnapshot, "draftSnapshot");

    const now = new Date();
    const document = await ProgramModel.findByIdAndUpdate(
      id,
      {
        $set: {
          workflowState: "published",
          draftSnapshot: currentRecord.draftSnapshot,
          publishedSnapshot: currentRecord.draftSnapshot,
          firstPublishedAt: currentRecord.firstPublishedAt ? new Date(currentRecord.firstPublishedAt) : now,
          updatedBy: assertActor(updatedBy, "publishProgramInput.updatedBy"),
        },
      },
      { returnDocument: "after" },
    )
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
        },
      },
      { returnDocument: "after" },
    )
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
        },
      },
      { returnDocument: "after" },
    )
      .lean()
      .exec();

    return document ? mapProgramRecord(document as RawProgramDocument) : null;
  },
};

export function getProgramRepository(): ProgramRepository {
  return mongoProgramRepository;
}
