import { defaultRetentionPolicy, type RetentionPolicy } from "@/modules/privacy/domain/retention";
import { AppointmentError, requireAppointment } from "../domain/appointment";
import { internalDetail, internalRange, planInternalChange, requireInternalAccess, requireInternalActor, type InternalActor, type InternalAppointment, type InternalCommand, type InternalPlan } from "../domain/internal-management";
import type { Slot } from "@/modules/availability/domain/values";
export type InternalResult = { status: string; version: number; noOp: boolean };
export type InternalReceipt = { payloadHash: string; result: InternalResult; expiresAt: Date };
export type InternalListItem = Pick<ReturnType<typeof internalDetail>, "id" | "startUtc" | "endUtc" | "status" | "version" | "serviceName" | "firstName" | "lastName">;
export type CalendarCursor = { startUtc: string; id: string };
export interface InternalReader {
  actor(id: string): Promise<InternalActor | null>;
  get(id: string): Promise<InternalAppointment | null>;
  slots(a: InternalAppointment, date: string, now: number): Promise<Slot[]>;
  list(actor: InternalActor, range: { from: Date; to: Date }, limit: number, cursor?: CalendarCursor, now?: number, policy?: RetentionPolicy): Promise<{ items: InternalListItem[]; next: CalendarCursor | null }>;
}
export interface InternalWriter extends InternalReader {
  lock(actorId: string, appointmentId: string): Promise<void>;
  receipt(actorId: string, key: string): Promise<InternalReceipt | null>;
  record(actorId: string, appointmentId: string, key: string, command: InternalCommand, receipt: InternalReceipt, now: number, plan: InternalPlan): Promise<void>;
  apply(a: InternalAppointment, command: InternalCommand, plan: InternalPlan, now: number): Promise<InternalResult>;
}
export interface InternalRepository {
  read<T>(work: (tx: InternalReader) => Promise<T>): Promise<T>;
  write<T>(work: (tx: InternalWriter) => Promise<T>): Promise<T>;
}
export class InternalAppointments {
  constructor(private readonly repository: InternalRepository, private readonly now: () => number, private readonly hash: (value: string) => string, private readonly retentionPolicy = defaultRetentionPolicy) {}
  async detail(actorId: string, id: string) {
    return this.repository.read(async tx => { const actor = await tx.actor(actorId); requireInternalActor(actor); const a = await tx.get(id); requireInternalAccess(actor, a); return internalDetail(a, this.now(), this.retentionPolicy); });
  }
  async slots(actorId: string, id: string, date: string) {
    return this.repository.read(async tx => { const actor = await tx.actor(actorId); requireInternalActor(actor); const a = await tx.get(id); requireInternalAccess(actor, a);
      const now = this.now(); if (a.status !== "CONFIRMED" || now >= a.endAt.getTime()) throw new AppointmentError("FORBIDDEN", "Termin kann nicht umgebucht werden.");
      return tx.slots(a, date, now); });
  }
  async list(actorId: string, date: string, view: "day" | "week" | "month", limit = 100, cursor?: CalendarCursor) {
    requireAppointment(Number.isInteger(limit) && limit > 0 && limit <= 100, "Ungültige Seitengröße.");
    if (cursor) requireAppointment(typeof cursor.id === "string" && cursor.id.length <= 128 && Number.isFinite(Date.parse(cursor.startUtc)), "Ungültige Seitengrenze.");
    const range = internalRange(date, view);
    return this.repository.read(async tx => { const actor = await tx.actor(actorId); requireInternalActor(actor); return tx.list(actor, range, limit, cursor, this.now(), this.retentionPolicy); });
  }
  async change(actorId: string, id: string, key: string, command: InternalCommand) {
    requireAppointment(typeof key === "string" && /^[A-Za-z0-9_-]{16,128}$/.test(key), "Ungültiger Befehlsschlüssel.");
    const payloadHash = this.hash(JSON.stringify({ id, command }));
    return this.repository.write(async tx => {
      await tx.lock(actorId, id);
      const actor = await tx.actor(actorId); requireInternalActor(actor);
      const a = await tx.get(id); requireInternalAccess(actor, a);
      const now = this.now(), previous = await tx.receipt(actorId, key);
      if (previous && previous.expiresAt.getTime() > now) {
        if (previous.payloadHash !== payloadHash) throw new AppointmentError("CONFLICT", "Befehlsschlüssel bereits verwendet.");
        return { ...previous.result, replay: true };
      }
      const plan = planInternalChange(a, command, now);
      const result = plan.noOp ? { status: a.status, version: a.version, noOp: true } : await tx.apply(a, command, plan, now);
      await tx.record(actorId, id, key, command, { payloadHash, result, expiresAt: new Date(now + 86400000) }, now, plan);
      return { ...result, replay: false };
    });
  }
}
