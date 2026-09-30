import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { CatalogError } from "../domain/errors";
import type { CatalogReader, CatalogRepository, CatalogWriter } from "../application/ports";

function reader(tx: Prisma.TransactionClient): CatalogReader {
  return {
    async listProfiles() { return (await tx.advisorProfile.findMany({ include: { services: true }, orderBy: { id: "asc" } })).map(({ services, ...profile }) => ({ profile, services })); },
    async getProfile(id) { const row = await tx.advisorProfile.findUnique({ where: { id }, include: { services: true } }); if (!row) return null; const { services, ...profile } = row; return { profile, services }; },
    getRelations: sourceProfileId => tx.profileRelation.findMany({ where: { sourceProfileId }, orderBy: { id: "asc" } }),
  };
}
function writer(tx: Prisma.TransactionClient): CatalogWriter {
  return { ...reader(tx),
    async getActor(id) {
      const row = await tx.user.findUnique({ where: { id }, include: { advisorProfile: { select: { id: true } } } });
      return row ? { id: row.id, role: row.role, active: row.active, canManageOwnServices: row.canManageOwnServices, profileId: row.advisorProfile?.id ?? null } : null;
    },
    async getUserAssignment(id) { const user = await tx.user.findUnique({ where: { id }, include: { advisorProfile: { select: { id: true } } } }); return user ? { profileId: user.advisorProfile?.id ?? null } : null; },
    async saveProfile(data, create = false) { if (create) await tx.advisorProfile.create({ data }); else await tx.advisorProfile.update({ where: { id: data.id }, data }); },
    async saveService(data, create = false) { if (create) await tx.service.create({ data }); else await tx.service.update({ where: { id: data.id }, data }); },
    async saveRelation(data, create = false) { if (create) await tx.profileRelation.create({ data }); else await tx.profileRelation.update({ where: { id: data.id }, data }); },
  };
}
async function translate<T>(work: () => Promise<T>): Promise<T> {
  try { return await work(); } catch (error) {
    if (error instanceof CatalogError) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (["P2002", "P2034"].includes(error.code)) throw new CatalogError("CONFLICT", "Zuordnung existiert bereits oder wurde parallel geändert. Bitte neu laden.");
      if (["P2003", "P2025"].includes(error.code)) throw new CatalogError("NOT_FOUND", "Referenzierter Eintrag fehlt oder wird noch verwendet.");
      if (error.code === "P2004") throw new CatalogError("INVALID_INPUT", "Daten verletzen eine Katalogregel.");
    }
    throw new CatalogError("PERSISTENCE_UNAVAILABLE", "Katalog konnte nicht gespeichert oder geladen werden.");
  }
}
export function prismaCatalog(database: PrismaClient): CatalogRepository {
  return {
    read: work => translate(() => database.$transaction(tx => work(reader(tx)), { isolationLevel: "RepeatableRead" })),
    write: (locks, work) => translate(() => database.$transaction(async tx => {
      // Every writer takes users first, then profiles, each in lexical order. No SQL string interpolation.
      for (const id of [...new Set(locks.userIds)].sort()) await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${id} FOR UPDATE`;
      for (const id of [...new Set(locks.profileIds)].sort()) await tx.$queryRaw`SELECT "id" FROM "AdvisorProfile" WHERE "id" = ${id} FOR UPDATE`;
      return work(writer(tx));
    }, { isolationLevel: "ReadCommitted", timeout: 10000, maxWait: 10000 })),
  };
}
