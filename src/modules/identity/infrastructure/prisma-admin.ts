import { randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { writeAudit } from "@/modules/audit/infrastructure/audit";
import { AdminError, type AdminRepository, type AdminWriter, type ManagedUser } from "../application/admin";

function project(row: {
  id: string; name: string; email: string; role: "ADMIN" | "ADVISOR"; active: boolean;
  canManageOwnServices: boolean; securityGeneration: number; advisorProfile?: { id: string } | null;
}): ManagedUser {
  return { id: row.id, name: row.name, email: row.email, role: row.role, active: row.active,
    canManageOwnServices: row.canManageOwnServices, securityGeneration: row.securityGeneration, profileId: row.advisorProfile?.id ?? null };
}
function writer(tx: Prisma.TransactionClient): AdminWriter {
  const include = { advisorProfile: { select: { id: true } } } as const;
  return {
    async getUser(id) { const row = await tx.user.findUnique({ where: { id }, include }); return row ? project(row) : null; },
    async listUsers() { return (await tx.user.findMany({ include, orderBy: [{ active: "desc" }, { name: "asc" }, { id: "asc" }] })).map(project); },
    async createUser(input) {
      const row = await tx.user.create({ data: { id: input.id, name: input.name, email: input.email, role: input.role, active: true, emailVerified: true,
        accounts: { create: { id: randomUUID(), accountId: input.id, providerId: "credential", password: input.passwordHash } } }, include });
      return project(row);
    },
    async updateUser(id, data) {
      const row = await tx.user.update({ where: { id }, data, include }); return project(row);
    },
    async revokeSessions(id) { await tx.session.deleteMany({ where: { userId: id } }); },
    countActiveAdmins() { return tx.user.count({ where: { active: true, role: "ADMIN" } }); },
    async audit(actorId, userId, changedFields) {
      await writeAudit(tx, { actorKind: "INTERNAL", actorId, action: "USER_CHANGED", resource: "USER", resourceId: userId,
        changedFields, now: Date.now() });
    },
  };
}
function translate(error: unknown): never {
  if (error instanceof AdminError) throw error;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (["P2002", "P2034"].includes(error.code)) throw new AdminError("CONFLICT", "Benutzer wurde parallel geaendert oder E-Mail ist bereits vergeben.");
    if (["P2003", "P2025"].includes(error.code)) throw new AdminError("NOT_FOUND", "Benutzer nicht gefunden.");
  }
  throw new AdminError("PERSISTENCE_UNAVAILABLE", "Benutzerverwaltung ist momentan nicht verfuegbar.");
}
export function prismaAdminRepository(db: PrismaClient): AdminRepository {
  return {
    read: work => db.$transaction(tx => work(writer(tx)), { isolationLevel: "RepeatableRead" }).catch(translate),
    write: (actorId, targetIds, work) => db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE active = true AND role = 'ADMIN' ORDER BY id FOR UPDATE`;
      const ids = [...new Set([actorId, ...targetIds])].sort();
      for (const id of ids) await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${id} FOR UPDATE`;
      return work(writer(tx));
    }, { isolationLevel: "ReadCommitted", timeout: 10000, maxWait: 10000 }).catch(translate),
  };
}
