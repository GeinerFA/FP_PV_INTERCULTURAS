import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/mongoose";
import { AdminUserModel } from "@/models/admin-user";
import type { AdminUserBootstrapInput, AdminUserRecord, CreateAdminUserInput, UpdateAdminUserInput } from "@/types/admin-user";
import { createFullAdminPermissions, normalizeAdminEmail, normalizeAdminPermissions, parseAdminUserRecord } from "@/validators/admin-user";

type AdminUserRepository = {
  list(): Promise<AdminUserRecord[]>;
  findById(id: string): Promise<AdminUserRecord | null>;
  findByEmail(email: string): Promise<AdminUserRecord | null>;
  create(input: CreateAdminUserInput): Promise<AdminUserRecord>;
  update(input: UpdateAdminUserInput): Promise<AdminUserRecord | null>;
  bootstrapSuperadmin(input: AdminUserBootstrapInput): Promise<AdminUserRecord>;
  countActiveSuperadmins(excludeId?: string): Promise<number>;
};

const googleManagedPasswordHashPlaceholder = "__google_oauth_managed__";

function buildLegacyCompatibilityFields(input: Pick<CreateAdminUserInput | UpdateAdminUserInput, "fullName">) {
  return {
    name: input.fullName.trim(),
  };
}

function toPersistencePayload(input: CreateAdminUserInput | UpdateAdminUserInput) {
  return {
    email: normalizeAdminEmail(input.email),
    fullName: input.fullName.trim(),
    ...buildLegacyCompatibilityFields(input),
    nationalId: input.nationalId?.trim() || null,
    active: input.active,
    role: input.role,
    permissions: normalizeAdminPermissions(input.permissions, input.role),
  };
}

async function mapDocument(document: unknown): Promise<AdminUserRecord | null> {
  if (!document) {
    return null;
  }

  return parseAdminUserRecord(document);
}

const mongoAdminUserRepository: AdminUserRepository = {
  async list() {
    await connectToDatabase();

    const documents = await AdminUserModel.find({}).sort({ role: 1, fullName: 1, email: 1 }).lean().exec();

    return documents.map((document) => parseAdminUserRecord(document));
  },
  async findById(id) {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    await connectToDatabase();

    const document = await AdminUserModel.findById(id).lean().exec();

    return mapDocument(document);
  },
  async findByEmail(email) {
    const normalizedEmail = normalizeAdminEmail(email);

    if (!normalizedEmail) {
      return null;
    }

    await connectToDatabase();

    const document = await AdminUserModel.findOne({ email: normalizedEmail }).lean().exec();

    return mapDocument(document);
  },
  async create(input) {
    await connectToDatabase();

    const document = await AdminUserModel.create({
      ...toPersistencePayload({ ...input, active: input.active ?? true }),
      passwordHash: googleManagedPasswordHashPlaceholder,
    });

    return parseAdminUserRecord(document.toObject());
  },
  async update(input) {
    if (!Types.ObjectId.isValid(input.id)) {
      return null;
    }

    await connectToDatabase();

    const document = await AdminUserModel.findByIdAndUpdate(input.id, { $set: toPersistencePayload(input) }, { returnDocument: "after" })
      .lean()
      .exec();

    return mapDocument(document);
  },
  async bootstrapSuperadmin(input) {
    await connectToDatabase();

    const normalizedEmail = normalizeAdminEmail(input.email);
    const persisted = await AdminUserModel.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $setOnInsert: {
          email: normalizedEmail,
          fullName: input.fullName?.trim() || normalizedEmail,
          ...buildLegacyCompatibilityFields({ fullName: input.fullName?.trim() || normalizedEmail }),
          nationalId: input.nationalId?.trim() || null,
          passwordHash: googleManagedPasswordHashPlaceholder,
          active: true,
          role: "superadmin",
          permissions: createFullAdminPermissions(),
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
        lean: true,
      },
    ).exec();

    return parseAdminUserRecord(persisted);
  },
  async countActiveSuperadmins(excludeId) {
    await connectToDatabase();

    const filter: Record<string, unknown> = { role: "superadmin", active: true };

    if (excludeId && Types.ObjectId.isValid(excludeId)) {
      filter._id = { $ne: new Types.ObjectId(excludeId) };
    }

    return AdminUserModel.countDocuments(filter).exec();
  },
};

export function getAdminUserRepository(): AdminUserRepository {
  return mongoAdminUserRepository;
}
