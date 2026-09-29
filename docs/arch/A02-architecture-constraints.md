# 2 Architektur-Randbedingungen

## 2.1 Technische Baseline

- **Next.js mit App Router** als Full-Stack-Webanwendung.
- **TypeScript** für Frontend und Serverlogik.
- **React** für UI.
- **Tailwind CSS** mit Design-Tokens.
- **PostgreSQL** als relationale Datenbank.
- **Prisma** für typisierte Datenzugriffe und Migrationen; DB-spezifische Constraints dürfen über SQL-Migrationen ergänzt werden.
- **Better Auth 1.7.6** mit Prisma-Adapter und Datenbanksitzungen gemäß [ADR-011](../../adr/011-authentication-library.md).
- **Docker Compose** für reproduzierbare lokale Entwicklung.
- E-Mail und Dateispeicher über eigene Adapter.

Entwicklungsbaseline: Next.js 16.3.7, React/ReactDOM 19.3.0, TypeScript 5.9.3, Prisma/Client/pg-Adapter 7.10.0, Node.js 24 LTS, PostgreSQL 17.11. Deklarierte Kompatibilität und Quellen stehen in ADR-011; Lockfile und konkrete Node-Patchversion werden beim ersten Implementierungscommit fixiert. Kein ungeprüfter Majorwechsel. Styling verwendet Tailwind CSS mit Design-Tokens; keine Auswahlfrage mehr.

## 2.2 Fachlich bedingte Constraints

- Kein Kundenlogin.
- Kein Payment.
- `.ics` statt verpflichtender Kalenderkonto-Verknüpfung.
- V1 ohne automatische Teams-Erstellung.
- Standardzeitzone Europe/Berlin.

## 2.3 Organisations-/Dokumentationsconstraints

- `docs/spec` bleibt implementierungsfrei.
- `docs/arch` enthält Technologieentscheidungen.
- Signifikante Entscheidungen werden als ADR gepflegt.
- Änderungen an Kernregeln benötigen Tests und Dokumentationsabgleich.
