# 9 Architekturentscheidungen

Zulässige Status: **Proposed** (noch nicht beschlossen), **Accepted** (getroffen), **Superseded** (durch verlinkte Folgeentscheidung ersetzt), **Rejected** (bewusst verworfen). Accepted ist keine Behauptung fertigen Codes oder juristischer Produktionsfreigabe. Für die Implementierung sind alle unten genannten Entscheidungen getroffen; reale Anbieter-/Betreiberfreigaben bleiben Go-live-Gates.

| ID | Entscheidung | Status |
|---|---|---|
| [ADR-001](../../adr/001-modular-nextjs-monolith.md#adr-001) | Modularer Next.js-Full-Stack-Monolith | Accepted |
| [ADR-002](../../adr/002-postgresql-prisma.md#adr-002) | PostgreSQL und Prisma | Accepted |
| [ADR-003](../../adr/003-central-availability-engine.md#adr-003) | Zentrale Availability Engine | Accepted |
| [ADR-004](../../adr/004-database-sessions-rbac.md#adr-004) | Datenbanksitzungen und RBAC | Accepted |
| [ADR-005](../../adr/005-ics-calendar-integration.md#adr-005) | iCalendar als V1-Kalenderintegration | Accepted |
| [ADR-006](../../adr/006-notification-outbox.md#adr-006) | Transaktionale E-Mail-Outbox | Accepted |
| [ADR-007](../../adr/007-atomic-booking.md#adr-007) | Atomare Buchung und Kollisionsschutz | Accepted |
| [ADR-008](../../adr/008-retention-anonymization.md#adr-008) | Historie und begrenzte PII-Aufbewahrung | Accepted |
| [ADR-009](../../adr/009-meeting-provider-abstraction.md#adr-009) | MeetingProvider-Abstraktion | Accepted |
| [ADR-010](../../adr/010-no-ecommerce.md#adr-010) | Ausschließlich Terminorganisation | Accepted |
| [ADR-011](../../adr/011-authentication-library.md#adr-011) | Better Auth für interne Passwortanmeldung | Accepted |

ADR-011 konkretisiert ADR-004; die Entscheidung für DB-Sitzungen/RBAC bleibt gültig. Die Produktionsfristen in ADR-008 sind separat freizugeben. Änderungen erfolgen mit expliziter Nachfolge-/Ablösungsbeziehung und Abgleich von [Spezifikation](../spec/README.md) und [Matrix](../TRACEABILITY.md).
