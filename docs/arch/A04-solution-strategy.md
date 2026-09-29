# 4 Lösungsstrategie

## 4.1 Grundform

**Modularer Full-Stack-Monolith**: Eine Next.js-Anwendung bedient öffentliche Seiten, geschützte interne Seiten und serverseitige Use-Case-Handler. Domänenlogik wird nicht in UI-Komponenten eingebettet.

## 4.2 Schichten / Module

`UI` → `Application Use Cases` → `Domain Services` → `Repositories / Integrations`

Kernmodule:
- Identity & Access
- Profiles & Services
- Availability
- Booking
- Appointment Management
- Notifications & Calendar
- Privacy & Audit

## 4.3 Datenhaltung

PostgreSQL ist Source of Truth. Prisma bildet Standardzugriffe ab; zeitkritische Konsistenzregeln dürfen durch DB-Constraints/Transaktionen abgesichert werden.

## 4.4 Verfügbarkeit

Die Availability Engine nimmt Profile, Service, Zeitraum und Regelparameter entgegen und liefert deterministisch buchbare Startzeiten. UI und E-Mail-Code haben keine eigene Kalenderlogik.

## 4.5 Nebenwirkungen

Eine Buchung wird zuerst transaktional gespeichert. E-Mail-/Reminder-Aufträge werden über ein Outbox-/Notification-Modell entkoppelt, damit ein Providerfehler die Buchung nicht zurückrollt.

## 4.6 Erweiterbarkeit

Online-Meeting-Provider werden als Adapter modelliert. V1 kann einen manuellen/konfigurierten Link verwenden; eine spätere Teams-Integration implementiert denselben Vertrag.
