# Sprint 11 – Interne Administrations- und Authentifizierungsbasis

Stand: 2026-10-02. Branch: `feat/internal-admin-foundation`, gestapelt auf `feat/audit-retention-security`.

## Umfang

UC-11, UC-18 und UC-20 erhalten die technische Basis für interne Konten. Öffentliche Kundenkonten bleiben ausgeschlossen. Die vorhandene Better-Auth-/Prisma-Basis bleibt maßgeblich; alte Migrationen werden nicht geändert.

Interne Seiten liegen unter `/internal`. Der gemeinsame Server-Guard prüft die DB-Sitzung, Kontostatus, 30 Minuten Inaktivität, acht Stunden absolute Dauer und Sicherheitsgeneration. Ohne gültige Sitzung erfolgt Redirect auf `/login`; ADMIN und ADVISOR werden rollenabhängig weitergeleitet. Logout löscht die Sitzung.

## Benutzerverwaltung

`InternalAdmin` kapselt ADMIN-only Lesen, Provisionierung, Rolle, Aktivstatus und `canManageOwnServices`. Konto-/Profilzuordnung bleibt beim bereits transaktionalen Katalog-Use-Case. Änderungen sperren aktive Administratoren in stabiler Reihenfolge; der letzte aktive ADMIN kann weder deaktiviert noch zu ADVISOR herabgestuft werden.

Deaktivierung und Rollenwechsel erhöhen die persistente Sicherheitsgeneration und löschen vorhandene Sitzungen. Neue Sessions übernehmen die aktuelle Generation; Guard und Touch lehnen alte Generationen sowie `passwordMutationPending` ab. USER_CHANGED-Audit wird in derselben Transaktion geschrieben.
## Passwort-Reset

`request-password-reset` antwortet unabhängig von der Kontoexistenz allgemein. Better Auth erzeugt einen 30-Minuten-Einmaltoken; nur aktive interne Konten erhalten einen PASSWORD_RESET-Outboxauftrag. Der Link liegt ausschließlich AES-GCM-verschlüsselt in der Outbox und wird bei neuerem Reset superseded.

Vor einer gültigen Passwortmutation wird der Nutzer unter DB-Sperre auf eine neue Sicherheitsgeneration gesetzt, `passwordMutationPending` aktiviert und alle Sessions werden gelöscht. Dadurch bleibt ein Teilfehler fail-closed. Nach erfolgreichem Better-Auth-Reset werden weitere Resetnachweise und noch offene Resetmails invalidiert und der Pending-Status gelöscht. Das alte Passwort und derselbe Reset-Token sind danach nicht erneut nutzbar.

## Sicherheitsgrenzen

Origin-/CSRF-, Body- und Rate-Limit-Grenzen des Security-Wrappers bleiben für Login, Logout und Reset aktiv. Keine Passwörter oder Reset-Tokens werden geloggt. Reset-Secrets erscheinen nicht in Query-Logs, Auditfeldern oder öffentlichen Seiten. Die Mail-Worker-Ausgabe für USER enthält keine Termindaten oder ICS.

## Abnahme

Gezielte Unit-Tests prüfen ADMIN-Rechte, letzten Administrator, Sessionwiderruf und Auth-Konfiguration. PostgreSQL-Tests prüfen Benutzeränderung/Audit, DB-Constraints und den realen Better-Auth-Reset mit Einmalverbrauch, Passwortwechsel und Sessionwiderruf.

Die vollständige Sprintvalidierung umfasst Prisma Generate/Validate, Migrationen auf frischer und bestehender PostgreSQL-17-Datenbank, lint, typecheck, Unit-/Integrationstests, Production Build, Browserprüfung, npm audit, Dokumentationsprüfung und `git diff --check`.

## Grenzen

Die vollständige Verwaltungsoberfläche für Profile, Services, Beziehungen, Verfügbarkeit und Termine gehört zu Sprint 12. Der erste Produktions-ADMIN bleibt ein gesicherter einmaliger Betriebsprozess; es gibt kein Standardpasswort. Provider-, Betreiber- und Go-live-Freigaben werden nicht erfunden. Kein E-Commerce und kein automatischer Merge.
