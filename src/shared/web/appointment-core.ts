import "server-only";
import { randomUUID } from "node:crypto";
import { AppointmentCore } from "@/modules/appointments/application/booking";
import { prismaAppointments } from "@/modules/appointments/infrastructure/prisma-appointments";
import { generateManagementToken } from "@/modules/appointments/infrastructure/management-token";
import { getDatabase } from "@/shared/infrastructure/database";

// Composition only, no HTTP route/Server Action. Not a complete public confirmation endpoint.
export function appointmentCore() {
  return new AppointmentCore(prismaAppointments(getDatabase()), { id: randomUUID, now: Date.now, token: generateManagementToken });
}
