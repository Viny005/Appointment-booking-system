import "server-only";
import { createHash } from "node:crypto";
import { InternalAppointments, type CalendarCursor } from "@/modules/appointments/application/internal-management";
import type { InternalCommand } from "@/modules/appointments/domain/internal-management";
import { AppointmentError } from "@/modules/appointments/domain/appointment";
import { prismaInternalAppointments } from "@/modules/appointments/infrastructure/prisma-internal-management";
import { aesSecretBox } from "@/modules/notifications/infrastructure/secret-box";
import { mailConfiguration } from "@/modules/notifications/infrastructure/config";
import { smtpConfiguration } from "@/modules/notifications/infrastructure/smtp";
import { getDatabase } from "@/shared/infrastructure/database";
import { getInternalSession } from "./internal-session";
// Actor comes exclusively from the verified server session, never from a form/body.
export async function internalAppointmentApi(headers: Headers, explicitUserAction = false) {
  const actor = await getInternalSession(headers, explicitUserAction);
  if (!actor) throw new AppointmentError("FORBIDDEN", "Anmeldung erforderlich.");
  const secretBox = () => { mailConfiguration(); smtpConfiguration(); return aesSecretBox(process.env.OUTBOX_ENCRYPTION_KEY ?? ""); };
  const api = new InternalAppointments(prismaInternalAppointments(getDatabase(), {
    seal: (raw, context) => secretBox().seal(raw, context), open: (cipher, context) => secretBox().open(cipher, context),
  }), Date.now, value => createHash("sha256").update(value).digest("hex"));
  return {
    detail: (id: string) => api.detail(actor.id, id),
    list: (date: string, view: "day" | "week" | "month", limit?: number, cursor?: CalendarCursor) => api.list(actor.id, date, view, limit, cursor),
    slots: (id: string, date: string) => api.slots(actor.id, id, date),
    change: (id: string, key: string, command: InternalCommand) => api.change(actor.id, id, key, command),
  };
}
