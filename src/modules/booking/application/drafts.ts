import { AppointmentError, requireAppointment, validateGuests } from "@/modules/appointments/domain/appointment";
import { CatalogError } from "@/modules/profiles/domain/errors";
import { AvailabilityError } from "@/modules/availability/domain/values";
import { resolveMeetingMode } from "@/modules/profiles/domain/policies";
import { reserveAppointment, type BookingResult } from "@/modules/appointments/application/booking";
import { assertLive, assertVersion, bookingInput, changeDraft, draftView, emptyDraft, DRAFT_TTL, IDEMPOTENCY_TTL, type DraftCommand } from "../domain/draft";
import type { DraftRepository, DraftRuntime } from "./ports";

async function result<T>(work: () => Promise<T>): Promise<BookingResult<T>> {
  try { return { ok: true, value: await work() }; } catch (e) {
    if (e instanceof AppointmentError || e instanceof CatalogError || e instanceof AvailabilityError) return { ok: false, error: { code: e.code, message: e.message } };
    return { ok: false, error: { code: "UNAVAILABLE", message: "Entwurf konnte nicht verarbeitet werden." } };
  }
}
export class BookingDrafts {
  constructor(private readonly repository: DraftRepository, private readonly runtime: DraftRuntime) {}
  private capability(cookie: string) { requireAppointment(typeof cookie === "string" && /^[A-Za-z0-9_-]{43}$/.test(cookie), "Ungueltiger Entwurfszugriff."); return this.runtime.hash(cookie); }
  create() { return result(async () => {
    const token = this.runtime.token(), capabilityHash = this.runtime.hash(token.raw);
    return this.repository.transaction(capabilityHash, async tx => {
      const draft = { id: this.runtime.id(), capabilityHash, payload: emptyDraft(), version: 0, expiresAt: new Date(this.runtime.now() + DRAFT_TTL) };
      await tx.saveDraft(draft); return { ...draftView(draft), cookie: token.raw };
    });
  }); }
  read(cookie: string) { return result(async () => { const draft = await this.repository.read(this.capability(cookie)); assertLive(draft, this.runtime.now()); return draftView(draft); }); }
  change(cookie: string, expectedVersion: number, command: DraftCommand) { return result(() => this.repository.transaction(this.capability(cookie), async tx => {
    const draft = await tx.getDraft(); assertLive(draft, this.runtime.now()); assertVersion(draft, expectedVersion);
    let payload = changeDraft(draft.payload, command);
    if (command.type === "primary") await tx.primary(command.profileId);
    if (command.type === "service") {
      const defaults = await tx.defaults(payload.primaryProfileId!, payload.serviceId!);
      payload = { ...payload, participantIds: defaults.participantIds, meetingMode: defaults.mode };
    }
    if (payload.serviceId) {
      const selection = await tx.selection(payload.participantIds, payload.primaryProfileId!, payload.serviceId);
      if (payload.meetingMode) resolveMeetingMode(selection.service, payload.meetingMode);
      if (payload.customer) validateGuests(payload.guests, payload.customer.email, selection.participants.map(p => p.notificationEmail));
    }
    const updated = { ...draft, payload, version: draft.version + 1, expiresAt: new Date(this.runtime.now() + DRAFT_TTL) };
    await tx.saveDraft(updated); return draftView(updated);
  })); }
  review(cookie: string) { return result(() => this.repository.transaction(this.capability(cookie), async tx => {
    const draft = await tx.getDraft(); assertLive(draft, this.runtime.now()); const input = bookingInput(draft.payload);
    const selection = await tx.selection(input.participantIds, input.primaryProfileId, input.serviceId);
    resolveMeetingMode(selection.service, input.meetingMode); validateGuests(input.guests, input.customer.email, selection.participants.map(p => p.notificationEmail));
    draft.expiresAt = new Date(this.runtime.now() + DRAFT_TTL); await tx.saveDraft(draft);
    return { ...draftView(draft), payloadHash: this.runtime.hash(JSON.stringify(input)), service: { name: selection.service.name, durationMinutes: selection.service.durationMinutes }, participants: selection.participants.map(p => ({ name: p.name, title: p.title })) };
  })); }
  // Trusted server use only until transactional notification integration is installed.
  confirm(cookie: string, commandKey: string, payloadHash: string, expectedVersion: number) { return result(() => {
    requireAppointment(typeof commandKey === "string" && /^[A-Za-z0-9_-]{16,128}$/.test(commandKey) && /^[a-f0-9]{64}$/.test(payloadHash), "Ungueltige Bestaetigung.");
    const capabilityHash = this.capability(cookie);
    return this.repository.transaction(capabilityHash, async tx => {
      const now = this.runtime.now(), old = await tx.getIdempotency(commandKey);
      if (old && old.expiresAt.getTime() > now) {
        if (old.payloadHash !== payloadHash) throw new AppointmentError("CONFLICT", "Befehl wurde mit anderem Inhalt verwendet.");
        return { ...old.result, replay: true as const };
      }
      const draft = await tx.getDraft(); assertLive(draft, now); assertVersion(draft, expectedVersion);
      const input = bookingInput(draft.payload), actualHash = this.runtime.hash(JSON.stringify(input));
      if (payloadHash !== actualHash) throw new AppointmentError("CONFLICT", "Zusammenfassung ist veraltet.");
      const booked = await reserveAppointment(tx, input, this.runtime);
      const { rawManagementToken, ...safe } = booked;
      await tx.saveIdempotency({ id: this.runtime.id(), capabilityHash, commandKey, payloadHash, appointmentId: safe.appointmentId, result: safe, expiresAt: new Date(now + IDEMPOTENCY_TTL) });
      await tx.deleteDraft(); return { ...safe, rawManagementToken, replay: false as const };
    });
  }); }
}
