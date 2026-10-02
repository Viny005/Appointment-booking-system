import { randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { payloadFor, recipients, reminderAt, type NotificationType, type Recipient } from "../domain/notification";
import type { SecretBox } from "../application/ports";
import { secretContext } from "./secret-box";
export const mailInclude = { participants: { include: { advisorProfile: { select: { id: true, notificationEmail: true } } } }, guests: true } satisfies Prisma.AppointmentInclude;
export type MailAppointment = Prisma.AppointmentGetPayload<{ include: typeof mailInclude }>;
export function appointmentRecipients(a: MailAppointment) {
  if (!a.email) return [];
  return recipients(a.email, a.participants.map(p => ({ id: p.advisorProfileId, email: p.advisorProfile.notificationEmail })), a.guests.map(g => g.email));
}
export async function queueEvent(tx: Prisma.TransactionClient, a: MailAppointment, options: { eventId: string; type: NotificationType; recipients: Recipient[]; now: number; dueAt?: Date; method?: "REQUEST" | "CANCEL" | null; removedGuest?: boolean; guestSource?: "CUSTOMER" | "INTERNAL"; secret?: { raw: string; box: SecretBox } }) {
  const rows = options.recipients.map(recipient => {
    const id = randomUUID(), needsSecret = recipient.category === "CUSTOMER" && !!options.secret;
    return { id, appointmentId: a.id, type: options.type, recipientCategory: recipient.category, recipientEmail: recipient.email, advisorProfileId: recipient.advisorProfileId,
      createdAt: new Date(options.now), eventId: options.eventId, eventNumber: a.notificationEventNumber, appointmentVersion: a.version, calendarSequence: a.calendarSequence,
      reminderGeneration: options.type === "REMINDER" ? a.reminderGeneration : null, removedGuest: options.removedGuest ?? false,
      payload: payloadFor(a, options.type, recipient, options.method === undefined ? "REQUEST" : options.method, options.guestSource) as unknown as Prisma.InputJsonValue,
      requiresSecret: needsSecret, secretCipher: needsSecret ? options.secret!.box.seal(options.secret!.raw, secretContext(id, a.id, recipient.email)) : null,
      secretExpiresAt: needsSecret ? new Date(options.now + 86400000) : null, secretTokenHash: needsSecret ? a.managementTokenHash : null, dueAt: options.dueAt ?? new Date(options.now) };
  });
  await tx.notification.createMany({ data: rows, skipDuplicates: true });
}
export async function queueReminders(tx: Prisma.TransactionClient, a: MailAppointment, now: number, selected = appointmentRecipients(a)) {
  const dueAt = reminderAt(a.startAt, now); if (!dueAt) return;
  await queueEvent(tx, a, { eventId: `${a.id}:reminder:${a.reminderGeneration}`, type: "REMINDER", recipients: selected, now, dueAt, method: null });
}
export function bookingNotificationPlanner(box: SecretBox) {
  return async (tx: Prisma.TransactionClient, appointmentId: string, raw: string, now: number) => {
    await tx.$queryRaw`SELECT id FROM "Appointment" WHERE id = ${appointmentId} FOR UPDATE`;
    const eventId = `${appointmentId}:created`;
    if (await tx.notification.count({ where: { eventId } })) return;
    const a = await tx.appointment.update({ where: { id: appointmentId }, data: { notificationEventNumber: { increment: 1 }, reminderGeneration: { increment: 1 } }, include: mailInclude });
    await queueEvent(tx, a, { eventId, type: "BOOKING_CONFIRMATION", recipients: appointmentRecipients(a), now, secret: { raw, box } });
    await queueReminders(tx, a, now);
  };
}
