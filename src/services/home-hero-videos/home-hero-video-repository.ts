import { type HydratedDocument, Types } from "mongoose";

import { connectToDatabase } from "@/lib/mongoose";
import { HomeHeroVideoModel, type HomeHeroVideoDocument } from "@/models/home-hero-video";
import type {
  CreateHomeHeroVideoInput,
  DeleteHomeHeroVideoInput,
  HomeHeroVideoRecord,
  UpdateHomeHeroVideoOrderInput,
} from "@/types/home-hero-video";
import {
  clampHomeHeroVideoOrder,
  parseHomeHeroVideoCreateInput,
  parseHomeHeroVideoRecord,
} from "@/validators/home-hero-video";

import { legacyHomeHeroVideoSeeds } from "./home-hero-video-source";

type RawHomeHeroVideoDocument = {
  _id: Types.ObjectId;
  fileName: unknown;
  sourceUrl: unknown;
  mediaType?: unknown;
  mimeType: unknown;
  bytes?: unknown;
  displayDurationSeconds?: unknown;
  order: unknown;
  storageProvider: unknown;
  cloudinaryPublicId?: unknown;
  cloudinaryAssetId?: unknown;
  createdBy: unknown;
  updatedBy: unknown;
  createdAt: unknown;
  updatedAt: unknown;
};

const HOME_HERO_VIDEO_BOOTSTRAP_STATE_COLLECTION = "bootstrap_state";
const HOME_HERO_VIDEO_BOOTSTRAP_STATE_KEY = "home-hero-video-legacy-seed-v1";

let homeHeroVideoSeedBootstrapPromise: Promise<void> | null = null;

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

function mapHomeHeroVideoDocument(document: RawHomeHeroVideoDocument): HomeHeroVideoRecord {
  const createdAt = normalizeDateLike(document.createdAt, new Date(0).toISOString());
  const updatedAt = normalizeDateLike(document.updatedAt, createdAt);

  return parseHomeHeroVideoRecord({
    id: document._id.toString(),
    fileName: assertString(document.fileName),
    sourceUrl: assertString(document.sourceUrl),
    mediaType: assertString(document.mediaType, "video"),
    mimeType: assertString(document.mimeType, "video/mp4"),
    bytes: typeof document.bytes === "number" ? document.bytes : null,
    displayDurationSeconds: typeof document.displayDurationSeconds === "number" ? document.displayDurationSeconds : null,
    order: typeof document.order === "number" ? document.order : 1,
    storageProvider: assertString(document.storageProvider, "local"),
    cloudinaryPublicId: assertString(document.cloudinaryPublicId) || null,
    cloudinaryAssetId: assertString(document.cloudinaryAssetId) || null,
    createdBy: assertString(document.createdBy, "legacy-bootstrap"),
    updatedBy: assertString(document.updatedBy, "legacy-bootstrap"),
    createdAt,
    updatedAt,
  });
}

async function ensureHomeHeroVideoBootstrap(options?: { seedBootstrap?: boolean }): Promise<void> {
  const connection = await connectToDatabase();
  const database = connection.connection.db;

  if (!database) {
    throw new Error("MongoDB connection is missing the database handle.");
  }

  if (!options?.seedBootstrap) {
    await HomeHeroVideoModel.syncIndexes();
    return;
  }

  if (!homeHeroVideoSeedBootstrapPromise) {
    homeHeroVideoSeedBootstrapPromise = (async () => {
      await HomeHeroVideoModel.syncIndexes();

      const bootstrapStateCollection = database.collection<{ key: string; completedAt?: Date }>(
        HOME_HERO_VIDEO_BOOTSTRAP_STATE_COLLECTION,
      );
      const existingBootstrapState = await bootstrapStateCollection.findOne({ key: HOME_HERO_VIDEO_BOOTSTRAP_STATE_KEY });

      if (!existingBootstrapState) {
        await Promise.all(
          legacyHomeHeroVideoSeeds.map((video, index) => {
            const now = new Date();

            return HomeHeroVideoModel.collection.updateOne(
              { seedKey: `legacy-home-hero-video-${index + 1}` },
              {
                $setOnInsert: {
                  ...video,
                  order: index + 1,
                  seedKey: `legacy-home-hero-video-${index + 1}`,
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
          { key: HOME_HERO_VIDEO_BOOTSTRAP_STATE_KEY },
          {
            $set: {
              key: HOME_HERO_VIDEO_BOOTSTRAP_STATE_KEY,
              completedAt: new Date(),
            },
          },
          { upsert: true },
        );
      }
    })().catch((error) => {
      homeHeroVideoSeedBootstrapPromise = null;
      throw error;
    });
  }

  await homeHeroVideoSeedBootstrapPromise;
}

async function listHomeHeroVideoDocuments(): Promise<HomeHeroVideoRecord[]> {
  const documents = await HomeHeroVideoModel.find({}).sort({ order: 1, updatedAt: -1 }).lean().exec();

  return documents.map((document) => mapHomeHeroVideoDocument(document as RawHomeHeroVideoDocument));
}

async function normalizeHomeHeroVideoOrder(): Promise<void> {
  const entries = await listHomeHeroVideoDocuments();

  await Promise.all(
    entries.map((entry, index) => HomeHeroVideoModel.updateOne({ _id: entry.id }, { $set: { order: index + 1 } }).exec()),
  );
}

async function getHomeHeroVideoById(id: string): Promise<HomeHeroVideoRecord | null> {
  if (!Types.ObjectId.isValid(id)) {
    return null;
  }

  const document = await HomeHeroVideoModel.findById(id).lean().exec();

  return document ? mapHomeHeroVideoDocument(document as RawHomeHeroVideoDocument) : null;
}

export type HomeHeroVideoRepository = {
  list(options?: { seedBootstrap?: boolean }): Promise<HomeHeroVideoRecord[]>;
  findById(id: string, options?: { seedBootstrap?: boolean }): Promise<HomeHeroVideoRecord | null>;
  create(input: CreateHomeHeroVideoInput): Promise<HomeHeroVideoRecord>;
  updateOrder(input: UpdateHomeHeroVideoOrderInput): Promise<HomeHeroVideoRecord[] | null>;
  delete(input: DeleteHomeHeroVideoInput): Promise<HomeHeroVideoRecord | null>;
};

const mongoHomeHeroVideoRepository: HomeHeroVideoRepository = {
  async list(options) {
    await ensureHomeHeroVideoBootstrap(options);

    return listHomeHeroVideoDocuments();
  },
  async findById(id, options) {
    await ensureHomeHeroVideoBootstrap(options ?? { seedBootstrap: true });

    return getHomeHeroVideoById(id);
  },
  async create(input) {
    await ensureHomeHeroVideoBootstrap({ seedBootstrap: true });

    const parsedContent = parseHomeHeroVideoCreateInput(input);
    const lastEntry = await HomeHeroVideoModel.findOne({}).sort({ order: -1 }).lean().exec();
    const nextOrder = typeof lastEntry?.order === "number" ? lastEntry.order + 1 : 1;
    const document = (await HomeHeroVideoModel.create({
      ...parsedContent,
      order: nextOrder,
      createdBy: assertString(input.createdBy),
      updatedBy: assertString(input.updatedBy),
    })) as HydratedDocument<HomeHeroVideoDocument>;

    return mapHomeHeroVideoDocument(document.toObject() as RawHomeHeroVideoDocument);
  },
  async updateOrder({ id, order, displayDurationSeconds, updatedBy }) {
    await ensureHomeHeroVideoBootstrap({ seedBootstrap: true });

    const entries = await listHomeHeroVideoDocuments();
    const currentIndex = entries.findIndex((entry) => entry.id === id);

    if (currentIndex === -1) {
      return null;
    }

    const targetIndex = clampHomeHeroVideoOrder(order, entries.length) - 1;
    const selectedEntry = entries[currentIndex] ?? null;

    if (targetIndex === currentIndex) {
      if (selectedEntry?.mediaType === "image" && typeof displayDurationSeconds === "number") {
        await HomeHeroVideoModel.updateOne(
          { _id: id },
          {
            $set: {
              displayDurationSeconds,
              updatedBy: assertString(updatedBy),
            },
          },
        ).exec();

        return listHomeHeroVideoDocuments();
      }

      return entries;
    }

    const reorderedEntries = [...entries];
    const [movedEntry] = reorderedEntries.splice(currentIndex, 1);
    reorderedEntries.splice(targetIndex, 0, movedEntry);

    const updatedEntry = reorderedEntries.find((entry) => entry.id === id) ?? null;

    await Promise.all(
      reorderedEntries.map((entry, index) =>
        HomeHeroVideoModel.updateOne(
          { _id: entry.id },
          {
            $set: {
              order: index + 1,
              ...(entry.id === id
                ? {
                    updatedBy: assertString(updatedBy),
                  }
                : {
                    updatedBy: entry.updatedBy,
                  }),
            },
          },
        ).exec(),
      ),
    );

    if (updatedEntry && updatedEntry.mediaType === "image") {
      if (typeof displayDurationSeconds === "number") {
        await HomeHeroVideoModel.updateOne(
          { _id: id },
          {
            $set: {
              displayDurationSeconds,
              updatedBy: assertString(updatedBy),
            },
          },
        ).exec();
      }
    }

    return listHomeHeroVideoDocuments();
  },
  async delete({ id }) {
    await ensureHomeHeroVideoBootstrap({ seedBootstrap: true });

    const existingEntry = await getHomeHeroVideoById(id);

    if (!existingEntry) {
      return null;
    }

    await HomeHeroVideoModel.findByIdAndDelete(id).exec();
    await normalizeHomeHeroVideoOrder();

    return existingEntry;
  },
};

export function getHomeHeroVideoRepository(): HomeHeroVideoRepository {
  return mongoHomeHeroVideoRepository;
}
