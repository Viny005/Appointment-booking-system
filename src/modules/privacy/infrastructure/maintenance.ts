import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { eraseExpiredAppointments } from "./retention";
import { retentionConfiguration } from "./config";

/** Every table is bounded independently; SKIP LOCKED allows overlapping scheduled runs. */
export async function runMaintenance(db: PrismaClient, now = Date.now(), limit = 100) {
  if (!Number.isSafeInteger(now) || !Number.isInteger(limit) || limit < 1 || limit > 1000) throw new Error("Invalid maintenance batch");
  const policy = retentionConfiguration(), timestamp = new Date(now);
  const erased = await eraseExpiredAppointments(db, now, limit, policy);
  let expired = 0;
  for (const table of ["BookingDraft", "BookingIdempotency", "AppointmentMutationReceipt", "InternalAppointmentReceipt", "RateLimitBucket"] as const) {
    // Identifier comes solely from the static allowlist above, never user/configuration input.
    const identifier = Prisma.raw(`"${table}"`), key = Prisma.raw(table === "RateLimitBucket" ? '"key"' : '"id"');
    expired += await db.$executeRaw(Prisma.sql`WITH candidates AS (
      SELECT ${key} FROM ${identifier} WHERE "expiresAt" <= ${timestamp} ORDER BY "expiresAt" FOR UPDATE SKIP LOCKED LIMIT ${limit}
    ) DELETE FROM ${identifier} t USING candidates c WHERE t.${key} = c.${key} AND t."expiresAt" <= ${timestamp}`);
  }
  const secrets = await db.$executeRaw`WITH candidates AS (
    SELECT id FROM "Notification" WHERE "secretExpiresAt" <= ${timestamp} FOR UPDATE SKIP LOCKED LIMIT ${limit}
  ) UPDATE "Notification" n SET "secretCipher"=NULL, "secretExpiresAt"=NULL, "secretTokenHash"=NULL,
    status=CASE WHEN n.status='PENDING' THEN 'FAILED'::"NotificationStatus" ELSE n.status END,
    "lastErrorCode"=CASE WHEN n.status='PENDING' THEN 'SECRET_EXPIRED' ELSE n."lastErrorCode" END,
    "leaseToken"=NULL, "leaseUntil"=NULL FROM candidates c WHERE n.id=c.id AND n."secretExpiresAt" <= ${timestamp}`;
  const deniedBefore = new Date(now - policy.denialDays * 86400000);
  const audit = await db.$executeRaw`WITH candidates AS (
    SELECT id FROM "AuditLog" WHERE (result='SUCCESS' AND ((timestamp AT TIME ZONE 'Europe/Berlin') + ${policy.auditMonths} * interval '1 month') AT TIME ZONE 'Europe/Berlin' <= ${timestamp}) OR (result='DENIED' AND timestamp <= ${deniedBefore})
    ORDER BY timestamp FOR UPDATE SKIP LOCKED LIMIT ${limit}
  ) DELETE FROM "AuditLog" a USING candidates c WHERE a.id=c.id`;
  return { erased, expired, secrets, audit };
}
