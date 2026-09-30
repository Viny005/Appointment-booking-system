# Sprint 5: Appointment Core und atomare Buchung



## Basis und Umfang



Branch `feat/appointment-core`, PR-Basis `main`, Basiscommit `7dcc85dee89710f6d11036d6fe875d40ca4067aa`.

Der Sprint implementiert den persistenten Reservierungskern von [UC-06](spec/F2-anwendungsfaelle.md#uc-06), nicht den vollständigen öffentlichen Bestätigungsprozess. Verbindlich bleiben [Datenmodell](spec/D1-datenmodell.md), [ADR-007](../adr/007-atomic-booking.md) und die [Availability Engine](AVAILABILITY-SPRINT.md).



## Datenmodell und Migration



`Appointment` enthält UTC-Beginn/-Ende, Europe/Berlin, Service- und Meeting-Snapshots, Kundendaten, Status, Version, Kalender-UID/-Sequenz und Management-Token-Hash mit Ablauf am Terminende. `AppointmentParticipant` hält tatsächliche Profile und historische Namens-/Titel-Snapshots; genau ein PRIMARY gehört zum Service. `AppointmentGuest` enthält höchstens zehn eindeutige Adressen. `AppointmentReservation` ist die abgeleitete Ressourcenbelegung gemäß ADR-007, keine zweite Terminchronik.



Enums: `AppointmentStatus` (CONFIRMED, CANCELLED, COMPLETED, NO_SHOW), `ParticipantRole` (PRIMARY, ADDITIONAL). Bestehende MeetingMode-/PhoneDirection-Typen werden wiederverwendet. Neue Termine beginnen mit Version und calendarSequence 0. Kundenfelder sind technisch nullable für spätere Retention; Neuanlage verlangt die fachlichen Pflichtfelder.



Neue additive Migration: `20260930120000_appointment_core`. Keine der drei gemergten Migrationen wird verändert. PostgreSQL 17.11 mit `btree_gist` ist erforderlich; die Extension wird bereits von der Availability-Migration eingerichtet.



## Regeln und Architektur



Domain: Kundennormalisierung mit Feldgrenzen, Telefonnummernprüfung, E-Mail-Domain in Kleinschreibung bei unverändertem Localpart, keine Alias-Zusammenführung. Gäste dürfen weder Kunde noch tatsächliche Berater duplizieren. Aktive, veröffentlichbare Profile, aktiver eigener Service und konkrete erlaubte MeetingModes werden geprüft. Nur aktive direkte ProfileRelations erlauben Zusatzteilnehmer; nicht entfernbare Teilnehmer sind Pflicht, auch wenn nicht öffentlich vorgeschlagen. Rekursive Beziehungen erweitern die Auswahl nicht.



Application: `AppointmentCore.bookAppointment` und autorisierter minimaler `getInternalSummary`. `reserveAppointment` ist der transaktionale Orchestrierungspunkt für spätere Draft-/Outbox-Integration. Ports: `AppointmentRepository`, `AppointmentReader`, `AppointmentWriter`, `BookingRuntime`; Belegung über den vorhandenen `OccupancyReader`. Domain/Application importieren keine Web- oder Prisma-Infrastruktur.



Infrastruktur: Prisma-Adapter lädt Service, Dauer, Teilnehmer und Meeting-Konfiguration serverseitig. Browserwerte für Dauer oder Meeting-Zugangsdaten werden nicht übernommen. Nur relevante Meeting-Felder gelangen in den Snapshot. Spätere Serviceänderungen verändern gespeicherte Termine nicht.



## Transaktion und Concurrency



Unter READ COMMITTED wird die Auswahl zunächst geprüft; alle tatsächlichen Profilzeilen werden in sortierter ID-Reihenfolge mit FOR UPDATE gesperrt. Danach werden Auswahl, Service und Verfügbarkeit erneut geladen. Die maßgebliche Uhrzeit wird einmal nach dem Warten auf Sperren erfasst. Die bestehende Engine revalidiert den exakten UTC-Slot mit aktueller Belegung innerhalb derselben Transaktion. Termin, Teilnehmer, Gäste und Reservierungen werden gemeinsam committed oder vollständig zurückgerollt. Profil-/Availability-Mutationen verwenden dieselben Profilsperren.



Die GiST-Exclusion-Constraint verhindert überlappende halb offene UTC-Intervalle pro Profil auch bei direktem SQL. Angrenzende Termine sind erlaubt. Ein zusammengesetzter, verzögerter Fremdschlüssel verbindet Reservierungen mit tatsächlichen Teilnehmern. Verzögerte Constraint-Trigger prüfen am Commit: genau einen passenden PRIMARY, Gästegrenzen, vollständige zeitgleiche Reservierungen für CONFIRMED und keine Reservierungen für terminale Zustände. Unique-Indizes schützen Kalender-UID, Token-Hash, Teilnehmer und Gäste. CHECK-Constraints schützen Zeitfolge, Dauer, Version, Zeitzone, Tokenform und Meeting-Feldkombinationen.



Belegung zählt ausschließlich tatsächliche Teilnehmer bestätigter Termine, einschließlich Intervallen, die vor dem Abfragefenster beginnen. Beziehungen und Gäste belegen keine Beraterressource. Terminale Status werden bisher nur durch Test-Fixtures gesetzt; Lifecycle-Use-Cases folgen später.



## Zeit und Sicherheit



`@js-temporal/polyfill` 0.5.1 bleibt die einzige Zeitzonenlösung. UTC-Instants werden mit Europe/Berlin-Regeln erzeugt; keine eigene DST-Heuristik. Genau 24 Stunden Vorlauf ist bei Neuanlage erlaubt. Drei Kalendermonate werden lokal berechnet und an Monatsenden geklemmt. Submillisekunden- und rasterfremde Starts werden abgelehnt.



Management-Token: 32 kryptographische Zufallsbytes, Base64url, dauerhaft ausschließlich SHA-256-Hash. Der Rohwert wird nur einmal an die vertrauenswürdige Server-Orchestrierung nach erfolgreichem Commit zurückgegeben; keine öffentliche Route, kein normales Read Model, kein Log. Der spätere Versand muss gemäß Outbox-Konzept innerhalb derselben fachlichen Transaktion geplant werden.



Interne Reads prüfen den aktuellen aktiven Actor: ADMIN oder ADVISOR mit tatsächlich beteiligtem eigenem Profil. ProfileRelation verleiht keine Rechte. Der Web-Kompositionsadapter ist server-only; Actor wird nicht aus Browserdaten konstruiert. Fehler enthalten keine Prisma-/SQL-Details.



## Validierung und Grenzen



39 neue Unit-Tests; 32 neue PostgreSQL-Tests. Integration deckt parallele Einzel-/Mehrberaterbuchung, umgekehrte Teilnehmerreihenfolge, angrenzende Termine, Rollback nach Insert, veraltete Slots, Aktivierungsänderungen, Pflichtteilnehmer, Snapshot-Stabilität, direkte Constraint-Verletzungen und Zugriffsschutz ab. DST: beide Herbst-02:30-Instants bleiben separat buchbar; Frühjahr-02:30 wird nicht erzeugt; lokale Zeit ohne Offset wird nicht als UTC-Buchung akzeptiert.



Migrationen werden auf frischer Datenbank sowie als Upgrade von Foundation, Profile-Service und gemergter Availability mit synthetischen Bestandsdaten geprüft; migrate deploy wird wiederholt. CI prüft auch PRs gegen Feature-Branches für die folgenden gestapelten Sprints. Finale Ausführungsergebnisse und CI-Links werden im Sprintbericht und in der PR dokumentiert.



Noch nicht enthalten: BookingDraft, 24h-Idempotency, öffentlicher Confirm-Endpunkt, Outbox, E-Mail, ICS, Reminder, Kundenverwaltung, Umbuchung, Stornierungs-Use-Case, Admin-UI, Audit und Retention-Job. Deshalb ist UC-06 ausdrücklich nur teilweise umgesetzt. Keine vollständige Produktionsfreigabe und kein E-Commerce-Code. Kein fachlicher Spezifikationswiderspruch festgestellt.


Lokale Abschlussvalidierung: npm ci, Prisma Generate/Validate, Lint, Typecheck, 181 Unit-Tests, 76 PostgreSQL-Tests, Production Build, npm audit (0 Schwachstellen), Dokumentationspruefung (56 Dateien, 1188 Links, 192 IDs, 0 Fehler), git diff --check erfolgreich. Frischinstallation und alle drei Upgrade-Pfade inklusive wiederholtem Deploy erfolgreich. CI-Nachweis folgt als PR-Check am finalen Commit.
