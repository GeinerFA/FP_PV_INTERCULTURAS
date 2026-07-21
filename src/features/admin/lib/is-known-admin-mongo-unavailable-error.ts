export function isKnownAdminMongoUnavailableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === "MongooseServerSelectionError" ||
    error.name === "MongoServerSelectionError" ||
    error.name === "MongoParseError" ||
    error.message.includes("MONGODB_URI environment variable is required") ||
    error.message.includes("MONGODB_SERVER_SELECTION_TIMEOUT_MS must be a positive number")
  );
}
