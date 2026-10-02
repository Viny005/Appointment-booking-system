import { createHash, randomUUID } from "node:crypto";
import type { AuditAction, Prisma, PrismaClient } from "@/generated/prisma/client";
export type AuditInput = { actorKind: "CUSTOMER" | "INTERNAL" | "SYSTEM" | "ANONYMOUS"; actorId?: string | null; action: AuditAction;
  resource: string; resourceId?: string | null; version?: number | null; changedFields?: string[]; recipientCount?: number; now: number };
export async function writeAudit(tx: Prisma.TransactionClient, input: AuditInput) {
  await tx.auditLog.create({ data: { id: randomUUID(), timestamp: new Date(input.now), actorKind: input.actorKind, actorId: input.actorId ?? null,
    action: input.action, resource: input.resource, resourceId: input.resourceId ?? null, version: input.version ?? null,
    changedFields: input.changedFields ?? [], recipientCount: input.recipientCount ?? 0, result: "SUCCESS" } });
}
export async function recordDenied(db: PrismaClient, actorId: string | null, resourceId: string | null, reason: "AUTHORIZATION" | "INVALID_CAPABILITY" | "ORIGIN" | "RATE_LIMIT", now = Date.now()) {
  const actor = actorId ? await db.user.findUnique({ where: { id: actorId }, select: { id: true } }) : null;
  const safeResource = resourceId && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(resourceId) ? resourceId : null;
  const eventKey = createHash("sha256").update(JSON.stringify([actor?.id ?? null, safeResource, reason, Math.floor(now / 60000)])).digest("hex");
  await db.auditLog.upsert({ where: { eventKey }, create: { id: randomUUID(), eventKey, timestamp: new Date(now), actorKind: actor ? "INTERNAL" : "ANONYMOUS", actorId: actor?.id,
    action: "ACCESS_DENIED", resource: "SECURITY", resourceId: safeResource, result: "DENIED", reason, changedFields: [], recipientCount: 0 }, update: { occurrences: { increment: 1 } } });
}
