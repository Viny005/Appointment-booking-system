import { retentionConfiguration } from "@/modules/privacy/infrastructure/config";
import { randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { AppointmentError, requireAppointment } from "@/modules/appointments/domain/appointment";
import { payloadFor, retryAt, type NotificationPayload, type Recipient } from "../domain/notification";
import type { NotificationRepository, SecretBox, LeasedNotification } from "../application/ports";
import { secretContext } from "./secret-box";
import { mailInclude, appointmentRecipients } from "./planner";
import { retentionDue } from "@/modules/privacy/domain/retention";
const clearLease = { leaseToken: null, leaseUntil: null };
const clearSecret = { secretCipher: null, secretExpiresAt: null, secretTokenHash: null };
export function prismaNotifications(db: PrismaClient, box: SecretBox): NotificationRepository {
  return {
    async metrics() { const [pending, failed] = await Promise.all([db.notification.count({ where: { status: "PENDING" } }), db.notification.count({ where: { status: "FAILED" } })]); return { pending, failed }; },
    async claim(now, limit, leaseMilliseconds) {
      requireAppointment(Number.isInteger(limit) && limit >= 1 && limit <= 50 && leaseMilliseconds >= 30000 && leaseMilliseconds <= 600000, "Ungueltige Lease-Konfiguration.");
      await db.$executeRaw`
        WITH exhausted AS (SELECT id FROM "Notification" WHERE status = 'PENDING' AND attempts >= 6 AND "leaseUntil" <= ${now} FOR UPDATE SKIP LOCKED LIMIT 1000)
        UPDATE "Notification" n SET status = 'FAILED', "lastErrorCode" = 'LEASE_EXHAUSTED', "leaseToken" = NULL, "leaseUntil" = NULL FROM exhausted e WHERE n.id = e.id`;
      const token = randomUUID(), until = new Date(now.getTime() + leaseMilliseconds);
      return db.$queryRaw<LeasedNotification[]>(Prisma.sql`
        WITH candidates AS (
          SELECT n.id FROM "Notification" n
          WHERE n.status = 'PENDING' AND n.attempts < 6 AND n."dueAt" <= ${now} AND (n."leaseUntil" IS NULL OR n."leaseUntil" <= ${now})
            AND NOT EXISTS (SELECT 1 FROM "Notification" earlier WHERE earlier."appointmentId" = n."appointmentId" AND earlier."recipientEmail" = n."recipientEmail"
              AND (earlier."eventNumber" < n."eventNumber" OR n.type = 'REMINDER' AND earlier."eventNumber" = n."eventNumber") AND earlier.type <> 'REMINDER' AND earlier.status IN ('PENDING','FAILED'))
          ORDER BY n."dueAt", n."eventNumber", n.id FOR UPDATE SKIP LOCKED LIMIT ${limit}
        ) UPDATE "Notification" n SET "leaseToken" = ${token}, "leaseUntil" = ${until}, attempts = n.attempts + 1
          FROM candidates c WHERE n.id = c.id RETURNING n.id, n."leaseToken", n.attempts`);
    },
    async prepare(job, now) {
      return db.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM "Notification" WHERE id = ${job.id} FOR UPDATE`;
        const n = await tx.notification.findUnique({ where: { id: job.id } });
        if (!n || n.status !== "PENDING" || n.leaseToken !== job.leaseToken || !n.leaseUntil || n.leaseUntil <= now) return null;
        const supersede = async () => { await tx.notification.update({ where: { id: n.id }, data: { status: "SUPERSEDED", ...clearLease, ...clearSecret } }); return null; };
        if (n.type === "PASSWORD_RESET") {
          const parts = n.eventId.split(":");
          const userId = parts.length === 3 && parts[0] === "password-reset" ? parts[1] : null;
          if (!userId || n.recipientCategory !== "USER" || !n.requiresSecret || !n.secretCipher || !n.secretExpiresAt || n.secretExpiresAt <= now) return supersede();
          const user = await tx.user.findUnique({ where: { id: userId }, select: { active: true, email: true } });
          if (!user?.active || user.email.toLowerCase() !== n.recipientEmail.toLowerCase()) return supersede();
          const secret = box.open(n.secretCipher, secretContext(n.id, `user:${userId}`, n.recipientEmail));
          return { id: n.id, type: n.type, recipient: { email: n.recipientEmail, category: "USER", advisorProfileId: null }, secret, payload: n.payload as unknown as NotificationPayload };
        }
        if (!n.appointmentId) return supersede();
        const a = await tx.appointment.findUnique({ where: { id: n.appointmentId }, include: mailInclude });
        if (!a || a.piiErasedAt || retentionDue(a, now.getTime(), retentionConfiguration())) return supersede();
        const recipient: Recipient = { email: n.recipientEmail, category: n.recipientCategory, advisorProfileId: n.advisorProfileId };
        const current = appointmentRecipients(a).some(r => r.email === recipient.email && r.category === recipient.category && r.advisorProfileId === recipient.advisorProfileId);
        const removal = n.type === "BOOKING_CANCELLED" && n.removedGuest && n.recipientCategory === "GUEST" && !a.guests.some(g => g.email === n.recipientEmail);
        if (!current && !removal) return supersede();
        if (n.type === "BOOKING_CANCELLED" ? !removal && a.status !== "CANCELLED" : a.status !== "CONFIRMED" || a.endAt <= now) return supersede();
        if (n.type === "REMINDER" && (n.reminderGeneration !== a.reminderGeneration || a.startAt <= now)) return supersede();
        let secret: string | null = null;
        if (n.requiresSecret) {
          if (n.recipientCategory !== "CUSTOMER" || a.managementTokenRevokedAt || a.managementTokenHash !== n.secretTokenHash) return supersede();
          if (!n.secretCipher || !n.secretExpiresAt || n.secretExpiresAt <= now) { await tx.notification.update({ where: { id: n.id }, data: { status: "FAILED", lastErrorCode: "SECRET_EXPIRED", ...clearLease, ...clearSecret } }); return null; }
          secret = box.open(n.secretCipher, secretContext(n.id, a.id, n.recipientEmail));
        }
        return { id: n.id, type: n.type, recipient, secret, payload: n.type === "REMINDER" || n.type === "BOOKING_CONFIRMATION" ? payloadFor(a, n.type, recipient, n.type === "REMINDER" ? null : "REQUEST", a.guests.find(g => g.email === recipient.email)?.source) : n.payload as unknown as NotificationPayload };
      });
    },
    async finish(job, now, delivered) {
      const next = retryAt(job.attempts, now.getTime());
      const result = await db.notification.updateMany({ where: { id: job.id, leaseToken: job.leaseToken, status: "PENDING", leaseUntil: { gt: now } },
        data: delivered ? { status: "SENT", sentAt: now, lastErrorCode: null, ...clearLease, ...clearSecret } : { status: next ? "PENDING" : "FAILED", ...(next ? { dueAt: next } : {}), lastErrorCode: "DELIVERY_FAILED", ...clearLease } });
      return result.count === 1;
    },
    async purgeSecrets(now, limit) {
      requireAppointment(Number.isInteger(limit) && limit > 0 && limit <= 1000, "Ungueltige Bereinigungsgroesse.");
      return db.$transaction(async tx => {
        const rows = await tx.notification.findMany({ where: { secretExpiresAt: { lte: now } }, select: { id: true }, take: limit });
        const ids = rows.map(r => r.id);
        await tx.notification.updateMany({ where: { id: { in: ids }, status: "PENDING", secretExpiresAt: { lte: now } }, data: { status: "FAILED", lastErrorCode: "SECRET_EXPIRED", ...clearLease } });
        return (await tx.notification.updateMany({ where: { id: { in: ids }, secretExpiresAt: { lte: now } }, data: clearSecret })).count;
      });
    },
    async retryFailed(actorId, notificationId, now) {
      await db.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${actorId} FOR UPDATE`;
        const actor = await tx.user.findUnique({ where: { id: actorId }, select: { active: true, role: true } });
        if (!actor?.active || actor.role !== "ADMIN") throw new AppointmentError("FORBIDDEN", "Kein Zugriff auf Versandverwaltung.");
        await tx.$queryRaw`SELECT id FROM "Notification" WHERE id = ${notificationId} FOR UPDATE`;
        const n = await tx.notification.findUnique({ where: { id: notificationId } });
        if (!n) throw new AppointmentError("NOT_FOUND", "Versandauftrag fehlt.");
        if (n.status !== "FAILED") return;
        if (n.requiresSecret && (!n.secretCipher || !n.secretExpiresAt || n.secretExpiresAt <= now)) throw new AppointmentError("CONFLICT", "Neuer autorisierter Bestaetigungsversand erforderlich.");
        await tx.notification.update({ where: { id: n.id }, data: { status: "PENDING", attempts: 0, dueAt: now, lastErrorCode: null, ...clearLease } });
      });
    },
  };
}
