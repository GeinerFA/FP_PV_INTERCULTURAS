import { type HydratedDocument, Types } from "mongoose";

import { connectToDatabase } from "@/lib/mongoose";
import { AdminActivityModel, type AdminActivityDocument } from "@/models/admin-activity";
import type { AdminActivityEntityType, AdminActivityLog, CreateAdminActivityLogInput } from "@/types/admin-activity";
import { parseAdminActivityLog } from "@/validators/admin-activity";

type RawAdminActivityDocument = {
  _id: Types.ObjectId;
  action: unknown;
  entityType: unknown;
  entityId: unknown;
  entityLabel: unknown;
  actor: unknown;
  metadata: unknown;
  happenedAt: unknown;
  createdAt: unknown;
  updatedAt: unknown;
};

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

function mapAdminActivityLog(document: RawAdminActivityDocument): AdminActivityLog {
  const createdAt = normalizeDateLike(document.createdAt, new Date(0).toISOString());
  const updatedAt = normalizeDateLike(document.updatedAt, createdAt);

  return parseAdminActivityLog({
    id: document._id.toString(),
    action: document.action,
    entityType: document.entityType,
    entityId: document.entityId,
    entityLabel: document.entityLabel,
    actor: document.actor,
    metadata: document.metadata,
    happenedAt: normalizeDateLike(document.happenedAt, updatedAt),
    createdAt,
    updatedAt,
  });
}

export type AdminActivityRepository = {
  create(input: CreateAdminActivityLogInput): Promise<AdminActivityLog>;
  list(options?: {
    entityId?: string;
    entityType?: AdminActivityLog["entityType"];
    includeEntityCounts?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<{
    currentPage: number;
    entries: AdminActivityLog[];
    entityCounts: Record<AdminActivityEntityType, number>;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  }>;
};

const mongoAdminActivityRepository: AdminActivityRepository = {
  async create(input) {
    await connectToDatabase();

    const document = (await AdminActivityModel.create({
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      entityLabel: input.entityLabel,
      actor: input.actor ?? null,
      metadata: input.metadata ?? null,
      happenedAt: input.happenedAt ? new Date(input.happenedAt) : new Date(),
    })) as HydratedDocument<AdminActivityDocument>;

    return mapAdminActivityLog(document.toObject() as RawAdminActivityDocument);
  },
  async list(options) {
    await connectToDatabase();

    const pageSize = Math.max(1, Math.min(options?.pageSize ?? 50, 100));
    const requestedPage = Math.max(1, options?.page ?? 1);
    const filters: Record<string, string> = {};

    if (options?.entityType) {
      filters.entityType = options.entityType;
    }

    if (options?.entityId) {
      filters.entityId = options.entityId;
    }

    const totalCount = await AdminActivityModel.countDocuments(filters).exec();
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const currentPage = Math.min(requestedPage, totalPages);
    const documents = await AdminActivityModel.find(filters)
      .sort({ happenedAt: -1, createdAt: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize)
      .lean()
      .exec();

    const entityCounts: Record<AdminActivityEntityType, number> = {
      application: 0,
      program: 0,
    };

    if (options?.includeEntityCounts) {
      const aggregates = await AdminActivityModel.aggregate<{ _id: AdminActivityEntityType; count: number }>([
        { $match: filters },
        { $group: { _id: "$entityType", count: { $sum: 1 } } },
      ]).exec();

      for (const aggregate of aggregates) {
        entityCounts[aggregate._id] = aggregate.count;
      }
    }

    return {
      currentPage,
      entries: documents.map((document) => mapAdminActivityLog(document as RawAdminActivityDocument)),
      entityCounts,
      pageSize,
      totalCount,
      totalPages,
    };
  },
};

export function getAdminActivityRepository(): AdminActivityRepository {
  return mongoAdminActivityRepository;
}
