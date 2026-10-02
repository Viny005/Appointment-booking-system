# Sprint 12 â€“ Interne VerwaltungsoberflÃ¤che

Branch `feat/internal-management-ui`, Basis ist der validierte Sprint-11-Stand `1e7f8c6`.

## OberflÃ¤che

Der geschÃ¼tzte Bereich unter `/internal` besitzt eine gemeinsame semantische Navigation fÃ¼r Termine, Administration und Berater. Die Terminansicht verwendet ausschlieÃŸlich den serverseitig authentifizierten `internalAppointmentApi` und unterstÃ¼tzt Tag, Woche und Monat. Detailseiten zeigen personenbezogene Daten nur nach der bestehenden serverseitigen BerechtigungsprÃ¼fung.

Interne Terminaktionen werden Ã¼ber Server Actions an die vorhandenen Application-Use-Cases weitergegeben. UnterstÃ¼tzt sind Umbuchung, DetailÃ¤nderung, GÃ¤ste, Absage, Ergebnisstatus und erneuter BestÃ¤tigungsversand. Actor-ID und Rolle kommen nie aus Formularfeldern.

ADMIN erhÃ¤lt eine KontenÃ¼bersicht mit Aktivierung, Deaktivierung und Rollenwechsel Ã¼ber `InternalAdmin`. Der bestehende Schutz des letzten aktiven Administrators und Session-Widerruf bleiben damit maÃŸgeblich. Der Katalog zeigt auch DRAFT/INACTIVE-Profile Ã¼ber eine interne Application-Query und nutzt die vorhandenen CatalogCommands fÃ¼r Profil-, Leistungs- und BeziehungsÃ¤nderungen. Die VerfÃ¼gbarkeitsseite liest Ã¼ber `AvailabilityManagement`.

## Accessibility und Datenschutz

Interaktive Elemente besitzen Tastatur-Fokus, mindestens 44px BedienhÃ¶he, semantische Ãœberschriften, Labels sowie status/alert-RÃ¼ckmeldungen. Das responsive Layout bleibt bei 320 CSS px ohne festes Desktop-Raster bedienbar. Status wird zusÃ¤tzlich als Text ausgegeben, nicht nur Ã¼ber Farbe.

Keine PII wird in URLs geschrieben. Interne Seiten bleiben durch den Sprint-11-Session-Guard geschÃ¼tzt. Es wurden keine Sicherheits-, Retention-, Notification-, Appointment- oder Datenbankregeln abgeschwÃ¤cht und keine historische Migration verÃ¤ndert.

## Validierung

Vor Push werden Prisma Generate/Validate, lint, TypeScript, Unit- und PostgreSQL-Integrationstests, Production Build, Chromium-Browsertests, npm audit, DokumentationsprÃ¼fung und `git diff --check` ausgefÃ¼hrt. Die gestapelte PR zielt auf `feat/internal-admin-foundation`; kein automatischer Merge.
