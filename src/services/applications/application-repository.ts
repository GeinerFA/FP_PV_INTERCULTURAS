import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/mongoose";
import { ApplicationModel } from "@/models/application";
import type {
  Application,
  ApplicationChangeActor,
  ApplicationStatus,
  ApplicationTypeSnapshot,
  CreateApplicationRecordInput,
  UpdateApplicationStatusInput,
} from "@/types/application";
import { parseApplication } from "@/validators/application";

const normalizedApplicationTypeDefaults: ApplicationTypeSnapshot = {
  code: "volunteering",
  name: "Volunteering",
};

type PlainObject = Record<string, unknown>;

type RawApplicationDocument = {
  _id: Types.ObjectId;
  firstName: unknown;
  lastName: unknown;
  fullName: unknown;
  email: unknown;
  phone: unknown;
  nationality: unknown;
  residenceCountry: unknown;
  residenceCity: unknown;
  birthDate: unknown;
  identityDocument: unknown;
  message: unknown;
  availability: unknown;
  applicationType: unknown;
  applicationTypeHistory: unknown;
  status: unknown;
  statusHistory: unknown;
  createdAt: unknown;
  updatedAt: unknown;
};

function isPlainObject(value: unknown): value is PlainObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
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

function normalizeNullableText(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function normalizeStatus(value: unknown): ApplicationStatus {
  switch (value) {
    case "pending":
    case "in_process":
    case "resolved":
    case "cancelled":
      return value;
    case "in_review":
      return "in_process";
    case "finalized":
      return "resolved";
    default:
      return "pending";
  }
}

function normalizeApplicationType(value: unknown): ApplicationTypeSnapshot {
  if (!isPlainObject(value)) {
    return { ...normalizedApplicationTypeDefaults };
  }

  return {
    code: normalizedApplicationTypeDefaults.code,
    name: isNonEmptyString(value.name) ? value.name.trim() : normalizedApplicationTypeDefaults.name,
  };
}

function normalizeApplicationChangeActor(value: unknown): ApplicationChangeActor {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return { email: value.trim() };
  }

  if (!isPlainObject(value)) {
    return null;
  }

  const actor: NonNullable<ApplicationChangeActor> = {};

  if (isNonEmptyString(value.userId)) {
    actor.userId = value.userId.trim();
  }

  if (isNonEmptyString(value.email)) {
    actor.email = value.email.trim().toLowerCase();
  }

  if (isNonEmptyString(value.role)) {
    actor.role = value.role.trim();
  }

  return Object.keys(actor).length > 0 ? actor : null;
}

function normalizeApplicationTypeHistory(
  value: unknown,
  currentType: ApplicationTypeSnapshot,
  changedAtFallback: string,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!isPlainObject(entry)) {
        return null;
      }

      return {
        from: entry.from === null || entry.from === undefined ? null : normalizeApplicationType(entry.from),
        to: entry.to === null || entry.to === undefined ? currentType : normalizeApplicationType(entry.to),
        reason: normalizeNullableText(entry.reason),
        changedAt: normalizeDateLike(entry.changedAt, changedAtFallback),
        changedBy: normalizeApplicationChangeActor(entry.changedBy),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}

function normalizeStatusHistory(
  value: unknown,
  currentStatus: ApplicationStatus,
  createdAt: string,
  updatedAt: string,
) {
  if (!Array.isArray(value) || value.length === 0) {
    return [
      {
        from: null,
        to: currentStatus,
        reason: null,
        changedAt: createdAt,
        changedBy: null,
      },
    ];
  }

  const history = value
    .map((entry) => {
      if (!isPlainObject(entry)) {
        return null;
      }

      return {
        from:
          entry.from === null || entry.from === undefined ? null : normalizeStatus(entry.from),
        to: normalizeStatus(entry.to ?? entry.status),
        reason: normalizeNullableText(entry.reason),
        changedAt: normalizeDateLike(entry.changedAt, updatedAt),
        changedBy: normalizeApplicationChangeActor(entry.changedBy),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return history.length > 0
    ? history
    : [
        {
          from: null,
          to: currentStatus,
          reason: null,
          changedAt: createdAt,
          changedBy: null,
        },
      ];
}

function normalizeApplicationDocument(document: RawApplicationDocument) {
  const createdAt = normalizeDateLike(document.createdAt, new Date(0).toISOString());
  const updatedAt = normalizeDateLike(document.updatedAt, createdAt);
  const applicationType = normalizeApplicationType(document.applicationType);
  const status = normalizeStatus(document.status);
  const firstName = typeof document.firstName === "string" ? document.firstName : "";
  const lastName = typeof document.lastName === "string" ? document.lastName : "";
  const fullName =
    typeof document.fullName === "string" && document.fullName.trim().length > 0
      ? document.fullName
      : `${firstName} ${lastName}`.trim();

  return {
    id: document._id.toString(),
    firstName,
    lastName,
    fullName,
    email: typeof document.email === "string" ? document.email : "",
    phone: typeof document.phone === "string" ? document.phone : "",
    nationality: typeof document.nationality === "string" ? document.nationality : "",
    residenceCountry: normalizeNullableText(document.residenceCountry),
    residenceCity: normalizeNullableText(document.residenceCity),
    birthDate:
      document.birthDate === null || document.birthDate === undefined
        ? null
        : normalizeDateLike(document.birthDate, createdAt),
    identityDocument: normalizeNullableText(document.identityDocument),
    message: normalizeNullableText(document.message),
    availability: normalizeNullableText(document.availability),
    applicationType,
    applicationTypeHistory: normalizeApplicationTypeHistory(
      document.applicationTypeHistory,
      applicationType,
      updatedAt,
    ),
    status,
    statusHistory: normalizeStatusHistory(document.statusHistory, status, createdAt, updatedAt),
    createdAt,
    updatedAt,
  };
}

export type ApplicationRepository = {
  create(input: CreateApplicationRecordInput): Promise<Application>;
  list(): Promise<Application[]>;
  findById(id: string): Promise<Application | null>;
  updateStatus(input: UpdateApplicationStatusInput): Promise<Application | null>;
};

function mapApplicationDocument(document: RawApplicationDocument): Application {
  return parseApplication(normalizeApplicationDocument(document));
}

const mongoApplicationRepository: ApplicationRepository = {
  async create(input) {
    await connectToDatabase();

    const document = await ApplicationModel.create(input);

    return mapApplicationDocument(document.toObject() as RawApplicationDocument);
  },
  async list() {
    await connectToDatabase();

    const documents = await ApplicationModel.find({}).sort({ createdAt: -1 }).lean().exec();

    return documents.map((document) => mapApplicationDocument(document as RawApplicationDocument));
  },
  async findById(id) {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    await connectToDatabase();

    const document = await ApplicationModel.findById(id).lean().exec();

    return document ? mapApplicationDocument(document as RawApplicationDocument) : null;
  },
  async updateStatus({ id, nextStatus, changedBy, reason }) {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    await connectToDatabase();

    const currentDocument = await ApplicationModel.findById(id).lean().exec();

    if (!currentDocument) {
      return null;
    }

    const currentStatus = normalizeStatus(currentDocument.status);
    const document = await ApplicationModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: nextStatus,
        },
        $push: {
          statusHistory: {
            from: currentStatus,
            to: nextStatus,
            reason,
            changedAt: new Date(),
            changedBy,
          },
        },
      },
      { returnDocument: "after" },
    )
      .lean()
      .exec();

    return document ? mapApplicationDocument(document as RawApplicationDocument) : null;
  },
};

export function getApplicationRepository(): ApplicationRepository {
  return mongoApplicationRepository;
}
