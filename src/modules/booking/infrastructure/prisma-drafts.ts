import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { AppointmentError } from "@/modules/appointments/domain/appointment";
import { appointmentWriter } from "@/modules/appointments/infrastructure/prisma-appointments";
import { assertPublishable } from "@/modules/profiles/domain/policies";
import { loadBookingSelection } from "@/modules/profiles/infrastructure/booking-selection";
import type { DraftRepository, DraftWriter, Idempotency } from "../application/ports";
import type { Draft, DraftPayload } from "../domain/draft";
const asDraft = (row: { id: string; capabilityHash: string; payload: unknown; version: number; expiresAt: Date } | null): Draft | null => row ? { ...row, payload: row.payload as DraftPayload } : null;
function writer(tx: Prisma.TransactionClient, capabilityHash: string): DraftWriter {
  return { ...appointmentWriter(tx),
    getDraft: async () => asDraft(await tx.bookingDraft.findUnique({ where: { capabilityHash } })),
    async saveDraft(draft) { const data = { ...draft, payload: draft.payload as unknown as Prisma.InputJsonValue }; await tx.bookingDraft.upsert({ where: { capabilityHash }, create: data, update: data }); },
    async deleteDraft() { await tx.bookingDraft.deleteMany({ where: { capabilityHash } }); },
    async primary(profileId) {
      const profile = await tx.advisorProfile.findUnique({ where: { id: profileId }, include: { services: true } });
      if (!profile || profile.status !== "ACTIVE") throw new AppointmentError("NOT_FOUND", "Profil nicht verfuegbar.");
      assertPublishable({ profile, services: profile.services });
    },
    async defaults(primaryId, serviceId) {
      const relations = await tx.profileRelation.findMany({ where: { sourceProfileId: primaryId, active: true }, include: { targetProfile: { include: { services: true } } } });
      const participantIds = [primaryId];
      for (const r of relations) {
        if (!r.clientCanRemove) participantIds.push(r.targetProfileId);
        else if (r.proposedToClient && r.defaultSelected && r.targetProfile.status === "ACTIVE") {
          try { assertPublishable({ profile: r.targetProfile, services: r.targetProfile.services }); participantIds.push(r.targetProfileId); } catch { /* Optional unavailable profile is not preselected. */ }
        }
      }
      const selection = await loadBookingSelection(tx, participantIds, primaryId, serviceId);
      return { participantIds: participantIds.sort(), mode: selection.service.allowedMeetingModes[0] };
    },
    async getIdempotency(commandKey) { const row = await tx.bookingIdempotency.findUnique({ where: { capabilityHash_commandKey: { capabilityHash, commandKey } } }); return row ? { ...row, result: row.result as unknown as Idempotency["result"] } : null; },
    async saveIdempotency(record) { const data = { ...record, result: record.result as Prisma.InputJsonValue }; await tx.bookingIdempotency.upsert({ where: { capabilityHash_commandKey: { capabilityHash, commandKey: record.commandKey } }, create: data, update: data }); },
  };
}
export function prismaDrafts(db: PrismaClient): DraftRepository {
  return {
    read: async capabilityHash => asDraft(await db.bookingDraft.findUnique({ where: { capabilityHash } })),
    async transaction(capabilityHash, work) {
      for (let attempt = 0; ; attempt++) {
        try { return await db.$transaction(async tx => {
          // Serializes draft updates, deletion and idempotency even after the draft row is removed.
          await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${capabilityHash}, 0))::text`;
          return work(writer(tx, capabilityHash));
        }, { isolationLevel: "ReadCommitted", timeout: 20000, maxWait: 10000 }); }
        catch (e) {
          if (e instanceof Prisma.PrismaClientKnownRequestError && (e.code === "P2034" || e.code === "P2010" && ["40001", "40P01"].includes(String(e.meta?.code))) && attempt < 2) continue;
          if (e instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2004", "P2034"].includes(e.code)) throw new AppointmentError("CONFLICT", "Buchung kollidiert mit einer Aenderung.");
          throw e;
        }
      }
    },
    async purge(now, limit) {
      if (!Number.isInteger(limit) || limit < 1 || limit > 1000) throw new AppointmentError("INVALID_INPUT", "Ungueltige Batchgroesse.");
      // Expiry predicate is repeated at DELETE so a concurrently refreshed draft survives.
      const drafts = await db.bookingDraft.findMany({ where: { expiresAt: { lte: now } }, select: { id: true }, take: limit });
      const deleted = await db.bookingDraft.deleteMany({ where: { id: { in: drafts.map(d => d.id) }, expiresAt: { lte: now } } });
      const keys = await db.bookingIdempotency.findMany({ where: { expiresAt: { lte: now } }, select: { id: true }, take: limit });
      const expired = await db.bookingIdempotency.deleteMany({ where: { id: { in: keys.map(k => k.id) }, expiresAt: { lte: now } } });
      return deleted.count + expired.count;
    },
  };
}
