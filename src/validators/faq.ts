import { faqMoveDirections, type FaqEntry, type FaqMoveDirection } from "@/types/faq";

type PlainObject = Record<string, unknown>;

function assertPlainObject(value: unknown, path: string): PlainObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${path} must be an object.`);
  }

  return value as PlainObject;
}

function assertString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${path} must be a non-empty string.`);
  }

  return value.trim();
}

function assertInteger(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new Error(`${path} must be a positive integer.`);
  }

  return value;
}

function assertIsoDate(value: unknown, path: string): string {
  const isoDate = assertString(value, path);

  if (Number.isNaN(Date.parse(isoDate))) {
    throw new Error(`${path} must be a valid ISO date string.`);
  }

  return new Date(isoDate).toISOString();
}

function assertMoveDirection(value: unknown, path: string): FaqMoveDirection {
  if (typeof value !== "string" || !faqMoveDirections.includes(value as FaqMoveDirection)) {
    throw new Error(`${path} must be one of: ${faqMoveDirections.join(", ")}.`);
  }

  return value as FaqMoveDirection;
}

export function parseFaqContent(
  value: unknown,
  path = "faqContent",
): Pick<FaqEntry, "question" | "answer"> {
  const object = assertPlainObject(value, path);

  return {
    question: assertString(object.question, `${path}.question`),
    answer: assertString(object.answer, `${path}.answer`),
  };
}

export function parseFaqRecord(value: unknown, path = "faqRecord"): FaqEntry {
  const object = assertPlainObject(value, path);

  return {
    id: assertString(object.id, `${path}.id`),
    question: assertString(object.question, `${path}.question`),
    answer: assertString(object.answer, `${path}.answer`),
    order: assertInteger(object.order, `${path}.order`),
    createdBy: assertString(object.createdBy, `${path}.createdBy`),
    updatedBy: assertString(object.updatedBy, `${path}.updatedBy`),
    createdAt: assertIsoDate(object.createdAt, `${path}.createdAt`),
    updatedAt: assertIsoDate(object.updatedAt, `${path}.updatedAt`),
  };
}

export function parseFaqMoveDirection(value: unknown, path = "faqMoveDirection"): FaqMoveDirection {
  return assertMoveDirection(value, path);
}
