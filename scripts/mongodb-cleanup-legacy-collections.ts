import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";

const cleanupCandidates = [
  "application_types",
  "audit_logs",
  "contact_messages",
  "email_jobs",
  "gallery",
  "response_templates",
  "reviews",
] as const;

const executionFlag = "--execute";
const confirmationFlag = "--confirm-drop-legacy";
const helpFlags = new Set(["--help", "-h"]);
const defaultServerSelectionTimeoutMs = 2_000;
const backupRootDirectory = path.resolve(process.cwd(), "backups", "mongodb-legacy-cleanup");

type CleanupCandidate = (typeof cleanupCandidates)[number];

type CollectionPlan = {
  name: CleanupCandidate;
  exists: boolean;
  documentCount: number;
  backupFilePath: string | null;
  dropped: boolean;
};

function printHelp(): void {
  console.log(`Prepare backup + cleanup for confirmed legacy MongoDB collections.

Usage:
  pnpm exec tsx scripts/mongodb-cleanup-legacy-collections.ts
  pnpm exec tsx scripts/mongodb-cleanup-legacy-collections.ts ${executionFlag} ${confirmationFlag}

Behavior:
  - Dry run is the default.
  - No collection is dropped unless BOTH ${executionFlag} and ${confirmationFlag} are provided.
  - When execution is enabled, the script creates JSON backups for each existing target collection before any drop happens.
  - Only these confirmed legacy collections are ever targeted:
    ${cleanupCandidates.join("\n    ")}

Environment:
  - Reads MONGODB_URI from process.env first.
  - Falls back to .env.local in the current working directory.
`);
}

function parseArgs(argv: string[]) {
  const args = new Set(argv);

  return {
    helpRequested: argv.some((value) => helpFlags.has(value)),
    execute: args.has(executionFlag),
    confirmed: args.has(confirmationFlag),
  };
}

function parseDotEnv(contents: string): Record<string, string> {
  const values: Record<string, string> = {};

  for (const rawLine of contents.split(/\r?\n/u)) {
    const line = rawLine.trim();

    if (line.length === 0 || line.startsWith("#")) {
      continue;
    }

    const normalizedLine = line.startsWith("export ") ? line.slice(7).trim() : line;
    const separatorIndex = normalizedLine.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = normalizedLine.slice(0, separatorIndex).trim();
    const rawValue = normalizedLine.slice(separatorIndex + 1).trim();

    if (!key) {
      continue;
    }

    const isQuoted =
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"));

    values[key] = isQuoted ? rawValue.slice(1, -1) : rawValue;
  }

  return values;
}

async function readDotEnvLocal(cwd: string): Promise<Record<string, string>> {
  const envLocalPath = path.join(cwd, ".env.local");

  try {
    const contents = await readFile(envLocalPath, "utf8");
    return parseDotEnv(contents);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

async function resolveMongoDbUri(cwd: string): Promise<{ uri: string; source: string }> {
  const environmentValue = process.env.MONGODB_URI?.trim();

  if (environmentValue) {
    return { uri: environmentValue, source: "process.env.MONGODB_URI" };
  }

  const envLocalValues = await readDotEnvLocal(cwd);
  const envLocalValue = envLocalValues.MONGODB_URI?.trim();

  if (envLocalValue) {
    return { uri: envLocalValue, source: ".env.local" };
  }

  throw new Error("MONGODB_URI is required. Set it in the environment or .env.local before running this script.");
}

function getMongoServerSelectionTimeoutMs(): number {
  const rawValue = process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS?.trim();

  if (!rawValue) {
    return defaultServerSelectionTimeoutMs;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    throw new Error("MONGODB_SERVER_SELECTION_TIMEOUT_MS must be a positive number.");
  }

  return Math.floor(parsedValue);
}

function getTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/gu, "-");
}

function serializeDocument(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((entry) => serializeDocument(entry));
  }

  if (Buffer.isBuffer(value)) {
    return {
      $type: "Buffer",
      data: value.toString("base64"),
    };
  }

  if (value && typeof value === "object") {
    if ("_bsontype" in value && (value as { _bsontype?: string })._bsontype === "ObjectId") {
      return {
        $type: "ObjectId",
        value: value.toString(),
      };
    }

    const serializedEntries = Object.entries(value).map(([key, entryValue]) => [key, serializeDocument(entryValue)]);
    return Object.fromEntries(serializedEntries);
  }

  return value;
}

async function main(): Promise<void> {
  const { helpRequested, execute, confirmed } = parseArgs(process.argv.slice(2));

  if (helpRequested) {
    printHelp();
    return;
  }

  if (execute && !confirmed) {
    console.error(`Refusing to drop collections without ${confirmationFlag}.`);
    process.exitCode = 1;
    return;
  }

  if (!execute && confirmed) {
    console.warn(`${confirmationFlag} was provided without ${executionFlag}; continuing in dry-run mode.`);
  }

  const cwd = process.cwd();
  const { uri, source } = await resolveMongoDbUri(cwd);
  const backupDirectory = path.join(backupRootDirectory, getTimestamp());
  const shouldDrop = execute && confirmed;
  const plans: CollectionPlan[] = [];

  console.log(`Mode: ${shouldDrop ? "EXECUTE" : "DRY RUN"}`);
  console.log(`MongoDB URI source: ${source}`);
  console.log(`Target collections: ${cleanupCandidates.join(", ")}`);
  console.log(`Backup directory: ${backupDirectory}`);

  await mongoose.connect(uri, {
    bufferCommands: false,
    serverSelectionTimeoutMS: getMongoServerSelectionTimeoutMs(),
  });

  try {
    const database = mongoose.connection.db;

    if (!database) {
      throw new Error("MongoDB connection established without an active database handle.");
    }

    const existingCollections = new Set(
      (await database.listCollections({}, { nameOnly: true }).toArray()).map((collection) => collection.name),
    );

    for (const name of cleanupCandidates) {
      const exists = existingCollections.has(name);
      const documentCount = exists ? await database.collection(name).estimatedDocumentCount() : 0;

      plans.push({
        name,
        exists,
        documentCount,
        backupFilePath: exists ? path.join(backupDirectory, `${name}.json`) : null,
        dropped: false,
      });
    }

    if (shouldDrop) {
      await mkdir(backupDirectory, { recursive: true });

      for (const plan of plans) {
        if (!plan.exists || !plan.backupFilePath) {
          continue;
        }

        const documents = await database.collection(plan.name).find({}).toArray();
        const payload = {
          collection: plan.name,
          exportedAt: new Date().toISOString(),
          documentCount: documents.length,
          documents: documents.map((document) => serializeDocument(document)),
        };

        await writeFile(plan.backupFilePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
      }

      const manifestPath = path.join(backupDirectory, "manifest.json");
      await writeFile(
        manifestPath,
        `${JSON.stringify({
          createdAt: new Date().toISOString(),
          targetCollections: plans
            .filter((plan) => plan.exists)
            .map((plan) => ({
              name: plan.name,
              documentCount: plan.documentCount,
              backupFilePath: plan.backupFilePath,
            })),
        }, null, 2)}\n`,
        "utf8",
      );

      for (const plan of plans) {
        if (!plan.exists) {
          continue;
        }

        await database.collection(plan.name).drop();
        plan.dropped = true;
      }
    }

    console.log("\nSummary:");

    for (const plan of plans) {
      const status = plan.exists ? (plan.dropped ? "backed up + dropped" : shouldDrop ? "backup prepared" : "would back up + drop") : "not present";
      const details = plan.exists
        ? `${plan.documentCount} document(s)${plan.backupFilePath ? `, backup: ${plan.backupFilePath}` : ""}`
        : "0 document(s)";

      console.log(`- ${plan.name}: ${status} (${details})`);
    }

    if (!shouldDrop) {
      console.log("\nNo changes were made. Re-run with both --execute and --confirm-drop-legacy to perform backups and drops.");
    }
  } finally {
    await mongoose.disconnect();
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Cleanup failed: ${message}`);
  process.exitCode = 1;
});
