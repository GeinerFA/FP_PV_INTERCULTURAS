import { type HydratedDocument, Types } from "mongoose";

import { connectToDatabase } from "@/lib/mongoose";
import { ProgramCategoryModel, type ProgramCategoryDocument } from "@/models/category";
import { ProgramModel } from "@/models/program";
import type {
  AdminProgramCategory,
  CreateProgramCategoryInput,
  DeleteProgramCategoryInput,
  ProgramCategoryRecord,
  UpdateProgramCategoryInput,
} from "@/types/category";
import {
  parseProgramCategoryContent,
  parseProgramCategoryRecord,
  parseProgramCategoryUpdateContent,
} from "@/validators/category";

import { legacyProgramCategorySeeds } from "./category-source";

type RawProgramCategoryDocument = {
  _id: Types.ObjectId;
  code: unknown;
  slug?: unknown;
  name: unknown;
  theme: unknown;
  order: unknown;
  createdBy: unknown;
  updatedBy: unknown;
  createdAt: unknown;
  updatedAt: unknown;
};

const PROGRAM_CATEGORY_BOOTSTRAP_STATE_COLLECTION = "bootstrap_state";
const PROGRAM_CATEGORY_BOOTSTRAP_STATE_KEY = "program-category-legacy-seed-v1";

let programCategorySeedBootstrapPromise: Promise<void> | null = null;

function assertString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
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

function mapProgramCategoryDocument(document: RawProgramCategoryDocument): ProgramCategoryRecord {
  const createdAt = normalizeDateLike(document.createdAt, new Date(0).toISOString());
  const updatedAt = normalizeDateLike(document.updatedAt, createdAt);

  return parseProgramCategoryRecord({
    id: document._id.toString(),
    code: assertString(document.code) || assertString(document.slug),
    name: assertString(document.name),
    theme: assertString(document.theme, "slate"),
    order: typeof document.order === "number" ? document.order : 1,
    createdBy: assertString(document.createdBy, "legacy-bootstrap"),
    updatedBy: assertString(document.updatedBy, "legacy-bootstrap"),
    createdAt,
    updatedAt,
  });
}

async function ensureProgramCategoryBootstrap(options?: { seedBootstrap?: boolean }): Promise<void> {
  const connection = await connectToDatabase();
  const database = connection.connection.db;

  if (!database) {
    throw new Error("MongoDB connection is missing the database handle.");
  }

  if (!options?.seedBootstrap) {
    await ProgramCategoryModel.syncIndexes();
    return;
  }

  if (!programCategorySeedBootstrapPromise) {
    programCategorySeedBootstrapPromise = (async () => {
      await ProgramCategoryModel.syncIndexes();

      const bootstrapStateCollection = database.collection<{ key: string; completedAt?: Date }>(
        PROGRAM_CATEGORY_BOOTSTRAP_STATE_COLLECTION,
      );
      const existingBootstrapState = await bootstrapStateCollection.findOne({ key: PROGRAM_CATEGORY_BOOTSTRAP_STATE_KEY });

      if (!existingBootstrapState) {
        await Promise.all(
          legacyProgramCategorySeeds.map((category, index) => {
            const now = new Date();

            return ProgramCategoryModel.collection.updateOne(
              { code: category.code },
              {
                $setOnInsert: {
                  ...category,
                  order: index + 1,
                  seedKey: `legacy-program-category-${index + 1}`,
                  createdBy: "legacy-bootstrap",
                  updatedBy: "legacy-bootstrap",
                  createdAt: now,
                  updatedAt: now,
                },
              },
              { upsert: true },
            );
          }),
        );

        await bootstrapStateCollection.updateOne(
          { key: PROGRAM_CATEGORY_BOOTSTRAP_STATE_KEY },
          {
            $set: {
              key: PROGRAM_CATEGORY_BOOTSTRAP_STATE_KEY,
              completedAt: new Date(),
            },
          },
          { upsert: true },
        );
      }
    })().catch((error) => {
      programCategorySeedBootstrapPromise = null;
      throw error;
    });
  }

  await programCategorySeedBootstrapPromise;
}

async function listProgramCategoryDocuments(): Promise<ProgramCategoryRecord[]> {
  const documents = await ProgramCategoryModel.find({}).sort({ order: 1, updatedAt: -1 }).lean().exec();

  return documents.map((document) => mapProgramCategoryDocument(document as RawProgramCategoryDocument));
}

async function buildProgramUsageCountByCode(code: string): Promise<number> {
  return ProgramModel.countDocuments({
    $or: [{ "draftSnapshot.category": code }, { "publishedSnapshot.category": code }],
  }).exec();
}

async function getProgramCategoryById(id: string): Promise<ProgramCategoryRecord | null> {
  if (!Types.ObjectId.isValid(id)) {
    return null;
  }

  const document = await ProgramCategoryModel.findById(id).lean().exec();

  return document ? mapProgramCategoryDocument(document as RawProgramCategoryDocument) : null;
}

function isDuplicateKeyError(error: unknown, key: "code"): boolean {
  return error instanceof Error && error.message.includes(`dup key`) && error.message.includes(`${key}:`);
}

export class ProgramCategoryInUseError extends Error {
  constructor(readonly categoryCode: string, readonly programCount: number) {
    super(`Cannot delete category ${categoryCode} because it is used by ${programCount} program(s).`);
    this.name = "ProgramCategoryInUseError";
  }
}

export class ProgramCategoryDuplicateFieldError extends Error {
  constructor(readonly field: "code") {
    super(`Program category ${field} must be unique.`);
    this.name = "ProgramCategoryDuplicateFieldError";
  }
}

export type ProgramCategoryRepository = {
  list(options?: { seedBootstrap?: boolean }): Promise<ProgramCategoryRecord[]>;
  listForAdmin(options?: { seedBootstrap?: boolean }): Promise<AdminProgramCategory[]>;
  findById(id: string): Promise<ProgramCategoryRecord | null>;
  findByCode(code: string, options?: { seedBootstrap?: boolean }): Promise<ProgramCategoryRecord | null>;
  create(input: CreateProgramCategoryInput): Promise<ProgramCategoryRecord>;
  update(input: UpdateProgramCategoryInput): Promise<ProgramCategoryRecord | null>;
  delete(input: DeleteProgramCategoryInput): Promise<ProgramCategoryRecord | null>;
};

const mongoProgramCategoryRepository: ProgramCategoryRepository = {
  async list(options) {
    await ensureProgramCategoryBootstrap(options);

    return listProgramCategoryDocuments();
  },
  async listForAdmin(options) {
    const categories = await this.list(options);

    const categoriesWithUsage = await Promise.all(
      categories.map(async (category) => ({
        ...category,
        programCount: await buildProgramUsageCountByCode(category.code),
      })),
    );

    return categoriesWithUsage;
  },
  async findById(id) {
    await ensureProgramCategoryBootstrap({ seedBootstrap: true });

    return getProgramCategoryById(id);
  },
  async findByCode(code, options) {
    await ensureProgramCategoryBootstrap(options ?? { seedBootstrap: true });

    const normalizedCode = code.trim().toLowerCase();

    if (normalizedCode.length === 0) {
      return null;
    }

    const document = await ProgramCategoryModel.findOne({ code: normalizedCode }).lean().exec();

    return document ? mapProgramCategoryDocument(document as RawProgramCategoryDocument) : null;
  },
  async create({ name, theme, createdBy, updatedBy }) {
    await ensureProgramCategoryBootstrap({ seedBootstrap: true });

    const parsedContent = parseProgramCategoryContent({ name, theme });
    const lastEntry = await ProgramCategoryModel.findOne({}).sort({ order: -1 }).lean().exec();
    const nextOrder = typeof lastEntry?.order === "number" ? lastEntry.order + 1 : 1;

    try {
      const document = (await ProgramCategoryModel.create({
        ...parsedContent,
        order: nextOrder,
        createdBy: assertString(createdBy),
        updatedBy: assertString(updatedBy),
      })) as HydratedDocument<ProgramCategoryDocument>;

      return mapProgramCategoryDocument(document.toObject() as RawProgramCategoryDocument);
    } catch (error) {
      if (isDuplicateKeyError(error, "code")) {
        throw new ProgramCategoryDuplicateFieldError("code");
      }

      throw error;
    }
  },
  async update({ id, name, theme, updatedBy }) {
    await ensureProgramCategoryBootstrap({ seedBootstrap: true });

    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const parsedContent = parseProgramCategoryUpdateContent({ name, theme });

    const document = await ProgramCategoryModel.findByIdAndUpdate(
      id,
      {
        $set: {
          ...parsedContent,
          updatedBy: assertString(updatedBy),
        },
      },
      { returnDocument: "after" },
    )
      .lean()
      .exec();

    return document ? mapProgramCategoryDocument(document as RawProgramCategoryDocument) : null;
  },
  async delete({ id }) {
    await ensureProgramCategoryBootstrap({ seedBootstrap: true });

    const existingCategory = await getProgramCategoryById(id);

    if (!existingCategory) {
      return null;
    }

    const programCount = await buildProgramUsageCountByCode(existingCategory.code);

    if (programCount > 0) {
      throw new ProgramCategoryInUseError(existingCategory.code, programCount);
    }

    await ProgramCategoryModel.findByIdAndDelete(id).exec();

    return existingCategory;
  },
};

export function getProgramCategoryRepository(): ProgramCategoryRepository {
  return mongoProgramCategoryRepository;
}
