import { createHash, randomUUID } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";
import type { SecretBox } from "@/modules/notifications/application/ports";
import { secretContext } from "@/modules/notifications/infrastructure/secret-box";

export async function queuePasswordReset(db: PrismaClient, box: SecretBox, input: { userId: string; email: string; url: string; token: string }, now = new Date()) {
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);
  await db.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${input.userId} FOR UPDATE`;
    const user = await tx.user.findUnique({ where: { id: input.userId }, select: { active: true, email: true } });
    if (!user?.active || user.email.toLowerCase() !== input.email.toLowerCase()) {
      const identifier = createHash("sha256").update(`reset-password:${input.token}`).digest("base64url");
      await tx.verification.deleteMany({ where: { identifier } });
      return;
    }
    await tx.notification.updateMany({
      where: { type: "PASSWORD_RESET", recipientCategory: "USER", recipientEmail: user.email, status: "PENDING" },
      data: { status: "SUPERSEDED", secretCipher: null, secretExpiresAt: null, secretTokenHash: null },
    });
    const id = randomUUID(), eventId = `password-reset:${input.userId}:${id}`;
    await tx.notification.create({ data: {
      id, appointmentId: null, type: "PASSWORD_RESET", recipientCategory: "USER", recipientEmail: user.email,
      eventId, eventNumber: 0, appointmentVersion: 0, calendarSequence: 0, payload: { calendar: null, method: null, guestSource: null, text: "Passwort zuruecksetzen" },
      requiresSecret: true, secretCipher: box.seal(input.url, secretContext(id, `user:${input.userId}`, user.email)),
      secretExpiresAt: expiresAt, secretTokenHash: createHash("sha256").update(input.token).digest("hex"), dueAt: now,
    } });
  });
}

export async function preparePasswordResetMutation(db: PrismaClient, request: Request, now = new Date()) {
  const body = await request.json().catch(() => null) as { token?: unknown; newPassword?: unknown } | null;
  if (!body || typeof body.token !== "string" || typeof body.newPassword !== "string" || body.newPassword.length < 16 || body.newPassword.length > 128) return;
  const identifier = createHash("sha256").update(`reset-password:${body.token}`).digest("base64url");
  const verification = await db.verification.findFirst({ where: { identifier, expiresAt: { gt: now } }, select: { value: true } });
  if (!verification) return;
  await db.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${verification.value} FOR UPDATE`;
    const current = await tx.verification.findFirst({ where: { identifier, value: verification.value, expiresAt: { gt: now } }, select: { id: true } });
    if (!current) return;
    await tx.user.update({ where: { id: verification.value }, data: { securityGeneration: { increment: 1 }, passwordMutationPending: true } });
    await tx.session.deleteMany({ where: { userId: verification.value } });
  });
}
