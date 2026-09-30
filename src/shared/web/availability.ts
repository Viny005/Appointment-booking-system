import "server-only";
import { randomUUID } from "node:crypto";
import { AvailabilityManagement, PublicAvailability } from "@/modules/availability/application/availability";
import type { OccupancyReader } from "@/modules/availability/application/ports";
import { prismaAvailability } from "@/modules/availability/infrastructure/prisma-availability";
import { getDatabase } from "@/shared/infrastructure/database";
import { getInternalSession } from "./internal-session";

// Deliberately no default empty occupancy adapter: future booking integration must supply it.
export function publicAvailability(occupancy: OccupancyReader) {
  return new PublicAvailability(prismaAvailability(getDatabase()), occupancy, Date.now);
}
export async function internalAvailability(headers: Headers) {
  const actor = await getInternalSession(headers, true);
  if (!actor) return null;
  return { actorId: actor.id, management: new AvailabilityManagement(prismaAvailability(getDatabase()), randomUUID) };
}
