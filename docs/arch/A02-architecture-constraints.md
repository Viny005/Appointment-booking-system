# 2 Architektur-Randbedingungen

## 2.1 Technische Baseline

- **Next.js mit App Router** als Full-Stack-Webanwendung.
- **TypeScript** für Frontend und Serverlogik.
- **React** für UI.
- **Tailwind CSS** oder vergleichbares tokenbasiertes Styling.
- **PostgreSQL** als relationale Datenbank.
- **Prisma** für typisierte Datenzugriffe und Migrationen; DB-spezifische Constraints dürfen über SQL-Migrationen ergänzt werden.
- **Auth.js** bzw. gleichwertiges serverseitiges Session-Modul mit Datenbanksitzungen.
- **Docker Compose** für reproduzierbare lokale Entwicklung.
- E-Mail und Dateispeicher über eigene Adapter.

Versionen werden nicht als dauerhafte Architekturconstraint festgeschrieben; Lockfiles definieren die jeweilige Implementierungsversion.

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
