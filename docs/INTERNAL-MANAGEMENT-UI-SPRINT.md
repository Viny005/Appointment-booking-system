# Sprint 12 – Interne Verwaltungsoberfläche

Branch `feat/internal-management-ui`, Basis ist der validierte Sprint-11-Stand `1e7f8c6`.

## Oberfläche

Der geschützte Bereich unter `/internal` besitzt eine gemeinsame semantische Navigation für Termine, Administration und Berater. Die Terminansicht verwendet ausschließlich den serverseitig authentifizierten `internalAppointmentApi` und unterstützt Tag, Woche und Monat. Detailseiten zeigen personenbezogene Daten nur nach der bestehenden serverseitigen Berechtigungsprüfung.

Interne Terminaktionen werden über Server Actions an die vorhandenen Application-Use-Cases weitergegeben. Unterstützt sind Umbuchung, Detailänderung, Gäste, Absage, Ergebnisstatus und erneuter Bestätigungsversand. Actor-ID und Rolle kommen nie aus Formularfeldern.

ADMIN erhält eine Kontenübersicht mit Aktivierung, Deaktivierung und Rollenwechsel über `InternalAdmin`. Der bestehende Schutz des letzten aktiven Administrators und Session-Widerruf bleiben damit maßgeblich. Der Katalog zeigt auch DRAFT/INACTIVE-Profile über eine interne Application-Query und nutzt die vorhandenen CatalogCommands für Profil-, Leistungs- und Beziehungsänderungen. Die Verfügbarkeitsseite liest über `AvailabilityManagement`.

## Accessibility und Datenschutz

Interaktive Elemente besitzen Tastatur-Fokus, mindestens 44px Bedienhöhe, semantische Überschriften, Labels sowie status/alert-Rückmeldungen. Das responsive Layout bleibt bei 320 CSS px ohne festes Desktop-Raster bedienbar. Status wird zusätzlich als Text ausgegeben, nicht nur über Farbe.

Keine PII wird in URLs geschrieben. Interne Seiten bleiben durch den Sprint-11-Session-Guard geschützt. Es wurden keine Sicherheits-, Retention-, Notification-, Appointment- oder Datenbankregeln abgeschwächt und keine historische Migration verändert.

## Validierung

Vor Push werden Prisma Generate/Validate, lint, TypeScript, Unit- und PostgreSQL-Integrationstests, Production Build, Chromium-Browsertests, npm audit, Dokumentationsprüfung und `git diff --check` ausgeführt. Die gestapelte PR zielt auf `feat/internal-admin-foundation`; kein automatischer Merge.
