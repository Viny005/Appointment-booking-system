# Sprint 6: BookingDraft und Bestaetigungsorchestrierung

## Basis und Scope

Branch `feat/booking-draft`, PR-Basis `feat/appointment-core`, Basiscommit `6eb77fde14e87a07d423059c619b059e33b4773f`. Dieser Sprint baut auf dem [Appointment Core](APPOINTMENT-CORE-SPRINT.md) auf. [UC-01 bis UC-06](spec/F2-anwendungsfaelle.md), [Entwurfslebenszyklus](arch/A08-cross-cutting-concepts.md) und [ADR-007](../adr/007-atomic-booking.md) bleiben verbindlich.

## Datenmodell und Migration

`BookingDraft`: interne ID, Capability-Hash, strukturierte JSON-Payload, optimistische Version, expiresAt sowie Erstellungs-/Aenderungszeit. Payload enthaelt Profil, Service, tatsaechliche Teilnehmer, konkreten Modus, lokales Datum, eindeutigen UTC-Slot, Kundendaten und Gaeste. Keine PII in URLs oder Cookies.

`BookingIdempotency`: Capability-Hash plus Command-Key eindeutig, Payload-Hash, Appointment-ID, minimale Antwort ohne Kundendaten/Token und 24h-Ablauf. Kein FK auf den nach Erfolg geloeschten Entwurf. Migration `20260930150000_booking_draft`; frischer Aufbau und Upgrade von Appointment Core erhalten vorhandene Termine, Snapshots und Reservationen. Vorherige Migrationen bleiben unveraendert. Hashform, Version, JSON-Groesse, Command-Key und ausgeschlossene geheime Ergebnisfelder werden durch CHECK-Constraints gesichert.

## Domain und Application

`BookingDrafts.create/read/change/review/confirm` orchestrieren ueber `DraftRepository` und `DraftWriter`. `DraftRuntime` liefert Uhrzeit, IDs und Kryptografie. Domain/Application bleiben frameworkfrei. Auswahlentscheidungen, Default-/Pflichtteilnehmer, Service und erlaubte Modi kommen vom Server. Servicewechsel invalidiert Teilnehmer, Modus, Datum und Slot; Teilnehmerwechsel invalidiert Datum/Slot; Datumwechsel invalidiert den Slot. Primarprofilwechsel erzeugt einen leeren Auswahlzustand. Kundendaten bleiben bei Service-/Teilnehmerwechsel erhalten und werden erneut validiert.

Ein neuer Entwurf laeuft nach 30 Minuten ab; erfolgreiche Aenderungen setzen die Inaktivitaetsfrist erneut. Ein expliziter POST-Review verlaengert sie ebenfalls; GET-Lesen verlaengert sie nicht. Exakte Ablaufgleichheit ist ungueltig. Versionen verhindern Ueberschreiben zwischen parallelen Tabs. Review liefert Kundeneingaben, oeffentliche Namen/Servicedauer und einen Hash der kanonischen Buchungspayload; interne Accountdaten, Berater-E-Mails und Meeting-Zugangsdaten werden nicht offengelegt.

Bestaetigung bindet Command-Key an Cookie-Capability und Payload-Hash. Gleicher Key/Hash liefert 24h lang dieselbe minimale Antwort; anderer Hash ist CONFLICT. Die Wiederholung speichert weder ein zweites Appointment noch einen zweiten Roh-Token. Abgelaufene Idempotenz und geloeschter Entwurf erlauben keine Neubuchung. Der erste vertrauenswuerdige Serveraufruf erhaelt den Roh-Management-Token einmal fuer die folgende Outbox-Integration; normale Projektionen enthalten ihn nicht.

## Transaktion und Sicherheit

Eine PostgreSQL-Transaktionssperre auf dem Capability-Hash serialisiert Entwurfsmutationen und Bestaetigung auch nach Loeschen der Draft-Zeile. Danach folgen die bestehenden sortierten Profilsperren. Appointment, Reservationen, Idempotenzresultat und Draft-Loeschung committen gemeinsam. Fehler rollen alles zurueck und erhalten den Entwurf. Retry ist auf bekannte Transaktionsabbrueche begrenzt. `purge` entfernt begrenzt abgelaufene Entwuerfe/Idempotenzdaten, mit erneuter Ablaufpruefung beim Loeschen; produktive Job-Anbindung folgt im Betriebs-/Retention-Sprint.

Zugriff ausschliesslich ueber zufaellige 256-Bit-Capability im HttpOnly/SameSite=Lax-Cookie; in Produktion Secure mit __Host-Praefix und Path=/ ohne Domain. Dauer 24h ermoeglicht sichere Idempotenzwiederholung nach erfolgreicher Draft-Loeschung; PII bleibt maximal bis zur separaten 30-Minuten-Inaktivitaetsgrenze lesbar. Nur SHA-256-Hash wird gespeichert. Eine erratene Draft-ID ist kein Zugriffsschluessel. Doppelte Cookies werden abgewiesen.

`/api/booking/draft`: GET liest ohne Zustandsaenderung. POST erlaubt create/change/review mit exaktem konfiguriertem Origin, JSON-Content-Type und begrenztem Request-Body (32 KiB). Kein Vertrauen in Host-Header als Origin-Allowlist. Alle Antworten no-store/no-referrer; kein Tracking. Confirm ist noch kein HTTP-Endpunkt, da die verbindliche atomare Outbox erst im Folgesprint entsteht. HTTP-Adapter haelt die Bestaetigungsaktion bis dahin geschlossen.

## Tests und Grenzen

18 Unit-Tests fuer Invalidierung, Vollstaendigkeit, TTL, Cookie/Origin, GET-Semantik, JSON und Groessenlimit. 15 PostgreSQL-Tests fuer Isolation, Versionen, Pflichtteilnehmer, Double Submit, unterschiedliche Command-Keys, Payloadkonflikt, Ablauf, stale Slot, inaktiven Service, Rollback, direkte DB-Constraints und Cleanup. Tests laufen zusaetzlich zur bestehenden Suite.

Keine Outbox, E-Mail, ICS, Kundenverwaltung oder visuelle Wizard-UI in diesem Sprint. Keine vollstaendige UC-06-Abnahme vor Notifications. Keine neuen fachlichen Regeln oder Spezifikationswidersprueche. Kein E-Commerce. CI wird am finalen PR-HEAD geprueft und im Sprintbericht verlinkt.

Die DB-Tests verwenden maximal zwei Workerprozesse. Explizite Parallelbuchungs-/Double-Submit-Tests bleiben parallel; lediglich die Dateiverteilung ist begrenzt. Zwei lokale Vollsuite-Laeufe hatten zuvor einen nativen Workerabbruch (Windows Exit 3221226505), keine fachliche Assertion. Diese Laeufe gelten nicht als erfolgreich.

Lokaler Abschluss: npm ci, Prisma generate/validate, lint, typecheck, 203 Unit-Tests, 91 PostgreSQL-Tests, Production Build, npm audit (0), Dokumentationspruefung (57 Dateien, 1194 Links, 192 IDs, 0 Fehler) und git diff --check erfolgreich. Frische DB sowie Upgrade vom vorherigen Sprint mit Datenbestand und wiederholtem Deploy erfolgreich.
