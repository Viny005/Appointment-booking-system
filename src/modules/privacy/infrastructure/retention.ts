import type { PrismaClient } from "@/generated/prisma/client";
import { writeAudit } from "@/modules/audit/infrastructure/audit";
import { retentionDue } from "../domain/retention";
import { retentionConfiguration } from "./config";

/** Bounded, restartable erasure. Historical advisor references are retained, so this is not full anonymization. */
export async function eraseExpiredAppointments(db: PrismaClient, now: number, limit = 100, policy = retentionConfiguration()): Promise<number> {
  if (!Number.isFinite(now) || !Number.isInteger(limit) || limit < 1 || limit > 1000) throw new Error("Invalid retention batch");
  return db.$transaction(async tx => {
    const candidates = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Appointment" WHERE "piiErasedAt" IS NULL AND
      (CASE WHEN status = 'CANCELLED' THEN
        (("cancelledAt" AT TIME ZONE 'Europe/Berlin') + ${policy.cancelledMonths} * interval '1 month') AT TIME ZONE 'Europe/Berlin'
      ELSE (("endAt" AT TIME ZONE 'Europe/Berlin') + ${policy.endedMonths} * interval '1 month') AT TIME ZONE 'Europe/Berlin'
      END) <= ${new Date(now)} ORDER BY id FOR UPDATE SKIP LOCKED LIMIT ${limit}`;
    let erased = 0;
    for (const { id } of candidates) {
      const a = await tx.appointment.findUniqueOrThrow({ where: { id } });
      if (a.piiErasedAt || !retentionDue(a, now, policy)) continue;
      await tx.notification.deleteMany({ where: { appointmentId: id } });
      await tx.appointmentGuest.deleteMany({ where: { appointmentId: id } });
      await tx.bookingIdempotency.deleteMany({ where: { appointmentId: id } });
      await tx.internalAppointmentReceipt.deleteMany({ where: { appointmentId: id } });
      if (a.managementTokenHash) await tx.appointmentMutationReceipt.deleteMany({ where: { capabilityHash: a.managementTokenHash } });
      const updated = await tx.appointment.update({ where: { id }, data: {
        firstName: null, lastName: null, email: null, phone: null, address: null, remarks: null,
        placeName: null, visitAddress: null, phoneDirection: null, advisorPhone: null, onlineUrl: null, onlineProvider: null,
        managementTokenHash: null, managementTokenExpiresAt: null, serviceDescription: "",
        piiErasedAt: new Date(now), version: { increment: 1 },
      } });
      await writeAudit(tx, { actorKind: "SYSTEM", action: "RETENTION_APPLIED", resource: "APPOINTMENT", resourceId: id,
        version: updated.version, changedFields: ["personalData"], now });
      erased++;
    }
    return erased;
  });
}
