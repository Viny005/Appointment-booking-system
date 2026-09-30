import type { Appointment, appointmentSummary } from "../domain/appointment";
import type { validateBookingSelection } from "@/modules/profiles/domain/selection";
import type { AvailabilityReader, OccupancyReader } from "@/modules/availability/application/ports";

export interface AppointmentReader {
  actor(id: string): ReturnType<AvailabilityReader["actor"]>;
  summary(id: string): Promise<{ summary: ReturnType<typeof appointmentSummary>; participantIds: string[] } | null>;
}
export interface AppointmentWriter extends AppointmentReader {
  selection(ids: string[], primaryId: string, serviceId: string): Promise<ReturnType<typeof validateBookingSelection>>;
  lockProfiles(ids: string[]): Promise<void>;
  schedules: AvailabilityReader["schedules"];
  occupancy: OccupancyReader;
  create(appointment: Appointment): Promise<void>;
}
export interface AppointmentRepository {
  transaction<T>(work: (writer: AppointmentWriter) => Promise<T>): Promise<T>;
  read<T>(work: (reader: AppointmentReader) => Promise<T>): Promise<T>;
}
export interface BookingRuntime { now(): number; id(): string; token(): { raw: string; hash: string } }
