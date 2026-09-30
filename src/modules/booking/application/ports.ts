import type { AppointmentWriter, BookingRuntime } from "@/modules/appointments/application/ports";
import type { reserveAppointment } from "@/modules/appointments/application/booking";
import type { Draft } from "../domain/draft";
import type { MeetingMode } from "@/modules/profiles/domain/model";
export type Confirmation = Omit<Awaited<ReturnType<typeof reserveAppointment>>, "rawManagementToken">;
export type Idempotency = { id: string; capabilityHash: string; commandKey: string; payloadHash: string; appointmentId: string; result: Confirmation; expiresAt: Date };
export interface DraftWriter extends AppointmentWriter {
  getDraft(): Promise<Draft | null>;
  saveDraft(draft: Draft): Promise<void>;
  deleteDraft(): Promise<void>;
  primary(profileId: string): Promise<void>;
  defaults(primaryId: string, serviceId: string): Promise<{ participantIds: string[]; mode: MeetingMode }>;
  getIdempotency(commandKey: string): Promise<Idempotency | null>;
  saveIdempotency(record: Idempotency): Promise<void>;
}
export interface DraftRepository {
  transaction<T>(capabilityHash: string, work: (writer: DraftWriter) => Promise<T>): Promise<T>;
  read(capabilityHash: string): Promise<Draft | null>;
  purge(now: Date, limit: number): Promise<number>;
}
export interface DraftRuntime extends BookingRuntime { hash(value: string): string }
