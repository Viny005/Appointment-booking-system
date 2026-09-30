import "server-only";
import { randomUUID } from "node:crypto";
import { AvailabilityManagement, PublicAvailability } from "@/modules/availability/application/availability";
import { appointmentOccupancy } from "@/modules/appointments/infrastructure/prisma-appointments";
import type { OccupancyReader } from "@/modules/availability/application/ports";
import { prismaAvailability } from "@/modules/availability/infrastructure/prisma-availability";
import { getDatabase } from "@/shared/infrastructure/database";
import { getInternalSession } from "./internal-session";

// Production reads confirmed appointments; no empty default occupancy.
export function publicAvailability(occupancy: OccupancyReader = appointmentOccupancy(getDatabase())) {
  return new PublicAvailability(prismaAvailability(getDatabase()), occupancy, Date.now);
}
export async function internalAvailability(headers: Headers) {
  const actor = await getInternalSession(headers, true);
  if (!actor) return null;
  return { actorId: actor.id, management: new AvailabilityManagement(prismaAvailability(getDatabase()), randomUUID) };
}
