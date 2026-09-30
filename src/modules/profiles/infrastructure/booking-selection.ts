import type { Prisma } from "@/generated/prisma/client";
import { validateBookingSelection } from "../domain/selection";

export async function loadBookingSelection(tx: Prisma.TransactionClient, ids: string[], primaryId: string, serviceId: string) {
  const profiles = await tx.advisorProfile.findMany({ where: { id: { in: ids } }, include: { services: true } });
  const relations = await tx.profileRelation.findMany({ where: { sourceProfileId: primaryId } });
  return validateBookingSelection(primaryId, serviceId, ids, profiles.map(({ services, ...profile }) => ({ profile, services })), relations);
}
