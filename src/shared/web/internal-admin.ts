import "server-only";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { InternalAdmin } from "@/modules/identity/application/admin";
import { prismaAdminRepository } from "@/modules/identity/infrastructure/prisma-admin";
import { getDatabase } from "@/shared/infrastructure/database";

export function internalAdminService() {
  return new InternalAdmin(prismaAdminRepository(getDatabase()), randomUUID, hashPassword);
}
