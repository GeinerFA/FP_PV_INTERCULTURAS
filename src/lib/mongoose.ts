import mongoose from "mongoose";

const defaultServerSelectionTimeoutMs = 2_000;

type MongooseCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  __mongooseCache?: MongooseCache;
};

const mongooseCache = globalForMongoose.__mongooseCache ?? {
  connection: null,
  promise: null,
};

globalForMongoose.__mongooseCache = mongooseCache;

function getMongoDbUri(): string {
  const value = process.env.MONGODB_URI;

  if (!value || value.trim().length === 0) {
    throw new Error("MONGODB_URI environment variable is required.");
  }

  return value;
}

function getMongoServerSelectionTimeoutMs(): number {
  const rawValue = process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS;

  if (!rawValue || rawValue.trim().length === 0) {
    return defaultServerSelectionTimeoutMs;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    throw new Error("MONGODB_SERVER_SELECTION_TIMEOUT_MS must be a positive number.");
  }

  return Math.floor(parsedValue);
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (mongooseCache.connection) {
    return mongooseCache.connection;
  }

  if (!mongooseCache.promise) {
    mongooseCache.promise = mongoose.connect(getMongoDbUri(), {
      bufferCommands: false,
      serverSelectionTimeoutMS: getMongoServerSelectionTimeoutMs(),
    });
  }

  try {
    mongooseCache.connection = await mongooseCache.promise;
  } catch (error) {
    mongooseCache.promise = null;
    throw error;
  }

  return mongooseCache.connection;
}
