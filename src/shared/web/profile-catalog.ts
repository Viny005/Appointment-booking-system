import "server-only";
import { randomUUID } from "node:crypto";
import { PublicCatalog, CatalogCommands, InternalCatalogQueries } from "@/modules/profiles/application/catalog";
import { prismaCatalog } from "@/modules/profiles/infrastructure/prisma-catalog";
import { getDatabase } from "@/shared/infrastructure/database";
import { getInternalSession } from "./internal-session";

export function publicCatalog() { return new PublicCatalog(prismaCatalog(getDatabase())); }
// Composition seam for future server actions. Never accept actorId or role from request data.
export async function internalCatalog(headers: Headers) {
  const identity = await getInternalSession(headers, true);
  if (!identity) return null;
  const repository = prismaCatalog(getDatabase()); return { actorId: identity.id, role: identity.role, profileId: identity.profileId, canManageOwnServices: identity.canManageOwnServices, commands: new CatalogCommands(repository, { id: randomUUID, now: () => new Date() }), queries: new InternalCatalogQueries(repository) };
}
