# 6 Laufzeitsicht

## 6.1 Neue Buchung

```mermaid
sequenceDiagram
    actor C as Kunde
    participant W as Web/UI
    participant A as AvailabilityEngine
    participant B as BookingService
    participant DB as PostgreSQL
    participant N as OutboxWorker

    C->>W: Profil/Service/Teilnehmer wählen
    W->>A: Monats-/Tagesverfügbarkeit berechnen
    A-->>W: buchbare Tage/Slots
    C->>W: Daten + Bestätigung
    W->>B: CreateAppointment(command)
    B->>DB: BEGIN, sperren, revalidieren
    B->>DB: Termin, Belegungen und Outbox schreiben
    B->>DB: COMMIT
    DB-->>B: Termin bestätigt
    N->>DB: Fällige Aufträge nach Commit übernehmen
    B-->>W: Success + Management Token
    W-->>C: Bestätigung + ICS-Aktion
```

## 6.2 Mehrpersonen-Verfügbarkeit

1. Für jedes ausgewählte Profil effektive Zeitintervalle auflösen.
2. Intervalle normalisieren.
3. Schnittmenge bilden.
4. Aktive Terminbelegungen abziehen.
5. Servicedauer und Slot-Schritt anwenden.
6. Nur Startzeiten innerhalb Buchungsfenster zurückgeben.

## 6.3 Umbuchung

Umbuchung läuft in einer Transaktion. Neuer Slot wird geprüft/reserviert, bevor die alte Belegung final freigegeben wird. Danach Kalendersequenz erhöhen und Änderungsnachrichten in Outbox legen.

## 6.4 E-Mail-Fehler

Notification Processor versucht Versand. Bei Fehler bleibt Termin unverändert; Notification erhält `FAILED`, Retry-Zähler und nächste Versuchzeit.

## 6.5 Session Guard

Jeder Request an private Route:
1. Session-Cookie lesen.
2. DB-Session validieren.
3. Idle-/Absolute-Timeout prüfen.
4. Benutzer/Rolle/Berechtigung prüfen.
5. Aktivitätstimestamp aktualisieren.
6. Fehlende/abgelaufene Sitzung: Seitenaufruf nach `/login`, API/Mutation mit 401. Fehlendes Recht: 403 ohne Daten. Kein Redirect als Ersatz für Autorisierung.

## 6.6 Konkurrenz, Wiederholung und Teilfehler

Parallele Bestätigungen sperren dieselben Profile in sortierter Reihenfolge. Nach der Sperre wird der Zustand neu gelesen. Höchstens ein konkurrierender Termin kann committen; ein Verlierer erhält 409 und aktualisierte Slots. Bei Constraintverletzung wird die gesamte Transaktion einschließlich Outbox zurückgerollt. Verbindungsabbruch nach Commit: Wiederholung desselben Idempotenzschlüssels liefert dieselbe Buchung, keine zweite.

Umbuchungen sperren alte und neue beteiligte Ressourcen sowie den Termin; erwartete Version verhindert verlorene Updates. Die eigene alte Belegung wird bei Verfügbarkeitsprüfung ausgeblendet. Bei Fehlschlag bleibt sie bestehen. Erfolgreich: Belegung ersetzen, Sequenz erhöhen, alte Reminder verwerfen, neue Aufträge schreiben und gemeinsam committen.

## 6.7 Aufbewahrung und Passwortreset

Retention-Worker liest fällige Termine, sperrt sie portionsweise und entfernt PII einschließlich Outbox-Payload, Entwurf, Token und freiem Snapshot-Text. Wiederholung ist wirkungsgleich. Fehler rollen den betroffenen Abschnitt zurück und erzeugen ein bereinigtes Betriebssignal.

Reset-Anfrage antwortet gleich für existierende/nicht existierende Konten. Ein gültiger kurzlebiger Einmaltoken wird atomar verbraucht; Passwort-Hash wird ersetzt, alle Sessions und übrigen Reset-Token des Kontos widerrufen. Ein konkurrierender zweiter Gebrauch schlägt fehl.

Diagrammquelle: [Buchungssequenz](diagrams/booking-sequence.puml). Die Abnahmefälle sind [A10](A10-quality-requirements.md) zugeordnet.
