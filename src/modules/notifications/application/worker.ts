import { Temporal } from "@js-temporal/polyfill";
import { requireAppointment } from "@/modules/appointments/domain/appointment";
import { renderIcs } from "../domain/icalendar";
import type { Mail, MailConfiguration, MailTransport, NotificationRepository, PreparedNotification, WorkerTelemetry } from "./ports";
export function composeMail(item: PreparedNotification, config: MailConfiguration, now: Date): Mail {
  const { payload } = item, lines = [payload.text];
  const local = (utc: string) => { const z = Temporal.Instant.from(utc).toZonedDateTimeISO("Europe/Berlin"); return `${z.toPlainDate()} ${z.toPlainTime().toString({ smallestUnit: "minute" })} (Europe/Berlin, UTC${z.offset})`; };
  if (payload.calendar) lines.push(payload.calendar.summary, `Beginn: ${local(payload.calendar.startUtc)}`, `Ende: ${local(payload.calendar.endUtc)}`, payload.calendar.description, payload.calendar.location);
  if (item.secret) {
    requireAppointment(item.recipient.category === "CUSTOMER", "Faehigkeit nur fuer Kunden.");
    lines.push(`Termin verwalten: ${config.publicOrigin}/manage#token=${encodeURIComponent(item.secret)}`);
  }
  if (payload.guestSource) lines.push(payload.guestSource === "CUSTOMER" ? "Quelle Ihrer E-Mail-Adresse: von der buchenden Person angegeben." : "Quelle Ihrer E-Mail-Adresse: von einem berechtigten internen Nutzer erfasst.", "Verarbeitete Daten: Gast-E-Mail-Adresse und Terminzuordnung; Zweck: Einladung und notwendige Terminbenachrichtigungen.", `Datenschutzinformation fuer Gaeste: ${config.guestPrivacyUrl}`);
  return { id: item.id, to: item.recipient.email, subject: payload.text, text: lines.filter(Boolean).join(String.fromCharCode(10, 10)), method: payload.method,
    ics: payload.calendar && payload.method ? renderIcs(payload.calendar, payload.method, config.from, item.recipient.email, now) : null };
}
export class NotificationWorker {
  constructor(private readonly repository: NotificationRepository, private readonly transport: MailTransport, private readonly config: MailConfiguration, private readonly now: () => number, private readonly telemetry: WorkerTelemetry) {}
  async run(limit = 10) {
    requireAppointment(Number.isInteger(limit) && limit > 0 && limit <= 50, "Batch muss 1 bis 50 sein.");
    await this.repository.purgeSecrets(new Date(this.now()), 1000);
    const jobs = await this.repository.claim(new Date(this.now()), limit, 120000);
    const counts = { sent: 0, deferred: 0, skipped: 0 };
    const outcomes = await Promise.allSettled(jobs.map(async job => {
      try {
        const prepared = await this.repository.prepare(job, new Date(this.now()));
        if (!prepared) { counts.skipped++; this.telemetry.emit({ action: "SUPERSEDED", count: 1 }); return; }
        await this.transport.send(composeMail(prepared, this.config, new Date(this.now())));
        const recorded = await this.repository.finish(job, new Date(this.now()), true);
        if (recorded) counts.sent++; else counts.skipped++;
        this.telemetry.emit({ action: recorded ? "SENT" : "LEASE_LOST", count: 1 });
      } catch {
        const recorded = await this.repository.finish(job, new Date(this.now()), false); counts.deferred++;
        this.telemetry.emit({ action: !recorded ? "LEASE_LOST" : job.attempts >= 6 ? "FAILED" : "RETRY", count: 1 });
      }
    }));
    if (outcomes.some(outcome => outcome.status === "rejected")) throw new Error("WORKER_UNAVAILABLE");
    const metrics = await this.repository.metrics();
    if (metrics.failed) this.telemetry.emit({ action: "FAILED", count: metrics.failed });
    return { ...counts, ...metrics };
  }
}
