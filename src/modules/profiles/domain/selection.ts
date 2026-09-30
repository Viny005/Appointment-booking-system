import { CatalogError } from "./errors";
import type { ProfileAggregate, ProfileRelation } from "./model";
import { assertPublishable, isValidActiveService } from "./policies";

// Shared by public availability and final booking. Relations never grant private access.
export function validateBookingSelection(primaryId: string, serviceId: string, requestedIds: string[], profiles: ProfileAggregate[], relations: ProfileRelation[]) {
  const invalid = () => { throw new CatalogError("INVALID_INPUT", "Teilnehmerauswahl ist nicht zulässig."); };
  if (!Array.isArray(requestedIds) || requestedIds.length < 1 || requestedIds.length > 50 || requestedIds.some(id => typeof id !== "string" || !id || id.length > 128) || new Set(requestedIds).size !== requestedIds.length || requestedIds.filter(id => id === primaryId).length !== 1) invalid();
  const direct = relations.filter(r => r.active && r.sourceProfileId === primaryId);
  for (const relation of direct) if (!relation.clientCanRemove && !requestedIds.includes(relation.targetProfileId)) invalid();
  for (const id of requestedIds) {
    if (id !== primaryId && !direct.some(r => r.targetProfileId === id && (r.proposedToClient || !r.clientCanRemove))) invalid();
    const aggregate = profiles.find(p => p.profile.id === id);
    if (!aggregate || aggregate.profile.status !== "ACTIVE") throw new CatalogError("NOT_FOUND", "Profil ist nicht öffentlich buchbar.");
    assertPublishable(aggregate);
  }
  const service = profiles.find(p => p.profile.id === primaryId)?.services.find(s => s.id === serviceId);
  if (!service || service.advisorProfileId !== primaryId || !isValidActiveService(service)) throw new CatalogError("NOT_FOUND", "Service ist nicht öffentlich buchbar.");
  return { service, participants: [...requestedIds].sort().map(id => profiles.find(p => p.profile.id === id)!.profile) };
}
