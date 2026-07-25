import { type HydratedDocument, Types } from "mongoose";

import { connectToDatabase } from "@/lib/mongoose";
import { FaqModel, type FaqDocument } from "@/models/faq";
import type { CreateFaqInput, DeleteFaqInput, FaqEntry, MoveFaqInput, UpdateFaqInput } from "@/types/faq";
import { parseFaqContent, parseFaqRecord } from "@/validators/faq";

import { getLegacyFaqSeedEntries } from "./faq-source";

type RawFaqDocument = {
  _id: Types.ObjectId;
  question: unknown;
  answer: unknown;
  order: unknown;
  seedKey?: unknown;
  createdBy: unknown;
  updatedBy: unknown;
  createdAt: unknown;
  updatedAt: unknown;
};

let faqSeedBootstrapPromise: Promise<void> | null = null;

const FAQ_BOOTSTRAP_STATE_COLLECTION = "bootstrap_state";
const FAQ_BOOTSTRAP_STATE_KEY = "faq-legacy-seed-v1";

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

function mapFaqDocument(document: RawFaqDocument): FaqEntry {
  const createdAt = normalizeDateLike(document.createdAt, new Date(0).toISOString());
  const updatedAt = normalizeDateLike(document.updatedAt, createdAt);

  return parseFaqRecord({
    id: document._id.toString(),
    question: assertString(document.question),
    answer: assertString(document.answer),
    order: typeof document.order === "number" ? document.order : 1,
    createdBy: assertString(document.createdBy, "legacy-bootstrap"),
    updatedBy: assertString(document.updatedBy, "legacy-bootstrap"),
    createdAt,
    updatedAt,
  });
}

async function ensureFaqBootstrap(options?: { seedBootstrap?: boolean }): Promise<void> {
  const connection = await connectToDatabase();
  const database = connection.connection.db;

  if (!database) {
    throw new Error("MongoDB connection is missing the database handle.");
  }

  if (!options?.seedBootstrap) {
    await FaqModel.syncIndexes();
    return;
  }

  if (!faqSeedBootstrapPromise) {
    faqSeedBootstrapPromise = (async () => {
      await FaqModel.syncIndexes();

      const bootstrapStateCollection = database.collection<{ key: string; completedAt?: Date }>(
        FAQ_BOOTSTRAP_STATE_COLLECTION,
      );
      const existingBootstrapState = await bootstrapStateCollection.findOne({ key: FAQ_BOOTSTRAP_STATE_KEY });

      if (!existingBootstrapState) {
        const seedEntries = getLegacyFaqSeedEntries();

        if (seedEntries.length > 0) {
          await Promise.all(
            seedEntries.map((entry, index) => {
              const now = new Date();

              return FaqModel.collection.updateOne(
                { seedKey: `legacy-faq-${index + 1}` },
                {
                  $setOnInsert: {
                    ...entry,
                    active: true,
                    seedKey: `legacy-faq-${index + 1}`,
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
        }

        await bootstrapStateCollection.updateOne(
          { key: FAQ_BOOTSTRAP_STATE_KEY },
          {
            $set: {
              key: FAQ_BOOTSTRAP_STATE_KEY,
              completedAt: new Date(),
            },
          },
          { upsert: true },
        );
      }
    })().catch((error) => {
      faqSeedBootstrapPromise = null;
      throw error;
    });
  }

  await faqSeedBootstrapPromise;
}

async function listFaqDocuments(): Promise<FaqEntry[]> {
  const documents = await FaqModel.find({}).sort({ order: 1, updatedAt: -1 }).lean().exec();

  return documents.map((document) => mapFaqDocument(document as RawFaqDocument));
}

async function normalizeFaqOrder(): Promise<void> {
  const entries = await listFaqDocuments();

  await Promise.all(
    entries.map((entry, index) =>
      FaqModel.updateOne({ _id: entry.id }, { $set: { order: index + 1 } }).exec(),
    ),
  );
}

async function getFaqById(id: string): Promise<FaqEntry | null> {
  if (!Types.ObjectId.isValid(id)) {
    return null;
  }

  const document = await FaqModel.findById(id).lean().exec();

  return document ? mapFaqDocument(document as RawFaqDocument) : null;
}

export type FaqRepository = {
  list(options?: { seedBootstrap?: boolean }): Promise<FaqEntry[]>;
  create(input: CreateFaqInput): Promise<FaqEntry>;
  update(input: UpdateFaqInput): Promise<FaqEntry | null>;
  delete(input: DeleteFaqInput): Promise<FaqEntry | null>;
  move(input: MoveFaqInput): Promise<FaqEntry[] | null>;
};

const mongoFaqRepository: FaqRepository = {
  async list(options) {
    await ensureFaqBootstrap(options);

    return listFaqDocuments();
  },
  async create({ question, answer, createdBy, updatedBy }) {
    await ensureFaqBootstrap({ seedBootstrap: true });

    const parsedContent = parseFaqContent({ question, answer });
    const lastEntry = await FaqModel.findOne({}).sort({ order: -1 }).lean().exec();
    const nextOrder = typeof lastEntry?.order === "number" ? lastEntry.order + 1 : 1;
    const document = (await FaqModel.create({
      ...parsedContent,
      order: nextOrder,
      createdBy: assertString(createdBy),
      updatedBy: assertString(updatedBy),
    })) as HydratedDocument<FaqDocument>;

    return mapFaqDocument(document.toObject() as RawFaqDocument);
  },
  async update({ id, question, answer, updatedBy }) {
    await ensureFaqBootstrap({ seedBootstrap: true });

    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const parsedContent = parseFaqContent({ question, answer });
    const document = await FaqModel.findByIdAndUpdate(
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

    return document ? mapFaqDocument(document as RawFaqDocument) : null;
  },
  async delete({ id }) {
    await ensureFaqBootstrap({ seedBootstrap: true });

    const existingEntry = await getFaqById(id);

    if (!existingEntry) {
      return null;
    }

    await FaqModel.findByIdAndDelete(id).exec();
    await normalizeFaqOrder();

    return existingEntry;
  },
  async move({ id, direction, updatedBy }) {
    await ensureFaqBootstrap({ seedBootstrap: true });

    const entries = await listFaqDocuments();
    const currentIndex = entries.findIndex((entry) => entry.id === id);

    if (currentIndex === -1) {
      return null;
    }

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= entries.length) {
      return entries;
    }

    const reorderedEntries = [...entries];
    const [movedEntry] = reorderedEntries.splice(currentIndex, 1);
    reorderedEntries.splice(targetIndex, 0, movedEntry);

    await Promise.all(
      reorderedEntries.map((entry, index) =>
        FaqModel.updateOne(
          { _id: entry.id },
          {
            $set: {
              order: index + 1,
              updatedBy: entry.id === id ? assertString(updatedBy) : entry.updatedBy,
            },
          },
        ).exec(),
      ),
    );

    return listFaqDocuments();
  },
};

export function getFaqRepository(): FaqRepository {
  return mongoFaqRepository;
}
