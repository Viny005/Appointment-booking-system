# Sprint 9: Interne Terminverwaltung

Branch `feat/internal-appointment-management`, Basis `feat/customer-appointment-management`. Application Layer zuerst; geschuetzte Server-Composition, noch keine neue Verwaltungsoberflaeche. Eigene gestapelte PR, kein Merge.

## Use Cases und Rechte

UC-13/UC-14/UC-21 bis UC-25: paginierte Liste und Tages-/Wochen-/Monatsdaten, Detail, interne Slotauswahl, Umbuchung/Absage, erlaubte Details, Gaeste, Bestaetigung erneut senden und COMPLETED/NO_SHOW. Interne Listen liefern nur Identitaet/Zeit/Status/Service und Namen; Kontaktdaten/Freitext ausschliesslich im autorisierten Detail. Token/Hash/verschluesselte Faehigkeit bleiben auch dort verborgen.

Aktiver ADMIN darf alle Termine bearbeiten. Aktiver ADVISOR ausschliesslich Termine mit seinem tatsaechlich teilnehmenden Profil, auch als Zusatzberater und bei inaktivem Profil. ProfileRelation verleiht keine Rechte. Kontoaktivitaet und Rolle werden auch vor einem Replay erneut geprueft. Die server-only Composition gewinnt die Actor-ID ausschliesslich aus der vorhandenen Better-Auth-/DB-Session; keine Formulardaten bestimmen den Actor.

## Regeln und Ereignisse

Neue interne Startzeit mindestens now und innerhalb desselben Drei-Kalendermonats-Horizonts. Dieselbe Availability Engine erlaubt intern explizit null statt 24 Stunden Vorlauf, kein zweiter Slotalgorithmus. Bei unveraendertem, bereits begonnenem Termin sind bis zum Ende Details erlaubt. Alle ressourcenerhaltenden Zeit-/Detail-/Gaesteaenderungen pruefen jede Teilnehmerverfuegbarkeit und fremde Belegung erneut. Absage gibt Ressourcen frei.

Service, Dauer, Kunden-E-Mail und Teilnehmer sind unveraenderlich. Detail-Patch weist unbekannte Felder ab. Moduswechsel nur zu aktuell erlaubter Serviceoption; terminspezifische Orts-/Telefon-/Onlineangaben werden vollstaendig validiert. Unveraenderter Snapshot bleibt nach Profil-/Servicedeaktivierung erhalten.

Version steigt einmal je fachlicher Mutation; No-op nicht. Zeit/Meeting/Gaeste/Absage erhoehen calendarSequence genau einmal. Reine Kundenmetadaten informieren nur Kunde/Berater ohne ICS und ohne Freitextinhalt. Ergebnisstatus und Resend lassen UID/Sequence unveraendert. COMPLETED/NO_SHOW erst ab Ende; terminale Zustaende nicht reaktivierbar, dasselbe Ergebnis wiederholt bleibt No-op.

## Gaeste und Datenschutz

GuestSource speichert CUSTOMER bzw. INTERNAL. Historische Gaeste stammen vor diesem Sprint ausschliesslich aus Kundenbuchungen; Migration setzt entsprechend CUSTOMER. Neue interne Einladungen benennen INTERNAL als Quelle. Alle Gastnachrichten erhalten den korrekten Herkunfts-/Datenschutzhinweis, auch wenn die erste Nachricht durch eine Aenderung ersetzt wurde. Technischer Abgleich Art. 14/25/32 anhand [EUR-Lex DSGVO](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32016R0679), Quellenpruefung 01.10.2026; Betreiber-/Rechtsgrundlagenangaben werden weiterhin nicht erfunden, siehe [Compliance](LEGAL-COMPLIANCE-DE.md).

Entfernte Gaeste erhalten nur CANCEL fuer ihre Einladung mit altem sicheren Meeting-Snapshot. Verbleibende Teilnehmer erhalten REQUEST, keine Absage. Die Entfernungsabsage bleibt bei spaeterer Terminbearbeitung erhalten; neue Details gehen nicht an entfernte Gaeste. Bei Wiederaufnahme eines Gastes wird seine alte offene Entfernungsabsage verworfen. Ein vor reminderAt wiederaufgenommener Gast kann denselben SUPERSEDED, noch nie gesendeten Reminder weiterverwenden; SENT wird niemals reaktiviert. Nach reminderAt keine neue Soforterinnerung.

Offene Erstbestaetigungen an weiterhin berechtigte Empfaenger bleiben erhalten, damit eine interne Aenderung vor dem Erstversand den Kundenlink nicht verschluckt. Der Worker aktualisiert ihre sichere Kalenderprojektion vor Versand auf den aktuellen Termin, prueft Empfaenger/Token erneut und sendet keine veraltete Erstbestaetigung nach Absage. Alte entfernte Gastdaten werden dadurch nicht erneut berechtigt.

## Resend und Concurrency

Nichtleere Teilmenge aktueller Empfaenger, standardmaessig Kunde; keine beliebigen Adressen. Hoechstens drei Befehle pro Termin innerhalb zehn Minuten, auch ueber mehrere Administratoren hinweg. Dieselbe Befehls-ID ist idempotent. Bei Kundenempfang rotieren Hash und verschluesselte Outbox atomar; alte Links und alte offene Secret-Payloads werden ungueltig. Berater-/Gast-Resend rotiert den Kundenlink nicht. Kein zusaetzlicher Reminder.

Lockreihenfolge User, sortierte tatsaechliche Profile, Appointment. Rechte/Version/Jetzt nach Lock erneut pruefen. Reservationen, Termin, Gaestedelta, Outbox und minimale Befehlsquittung committen gemeinsam. GiST/deferred Constraints bleiben aktiv. Bounded Retry nur bei echten Transaktionskonflikten. Fehler beim Versandplan rollen die gesamte Mutation zurueck.

## Migration und Betrieb

Additive Migration 20261001100000_internal_appointment_management: GuestSource, AppointmentGuest.source und InternalAppointmentReceipt. Receipt enthaelt nur Actor-/Ressourcenreferenz, Aktionsname, Hash, Status/Version/No-op, Zeit/Ablauf; JSON-Allowlist, Unique(actor,key), maximal 24h. Keine Kontaktwerte, Freitexte oder Rohfaehigkeiten. Worker bereinigt abgelaufene Quittungen begrenzt und mit erneuter Ablaufpruefung. Dauerhafter Audit-/Retention-Job folgt gemaess Plan in Sprint 10; diese kurzlebigen Quittungen werden nicht als Auditarchiv ausgegeben.

Frische PostgreSQL-DB, alle bisherigen Upgradepfade plus Kundenverwaltung mit vorhandenen Gaesten/Quittungen/Outbox, wiederholtes Deploy. Keine alte Migration veraendert. Unit-/PostgreSQL-Nachweise decken Rechte, Fristen, DST-Kalendergrenzen, Ereignismatrix, Concurrency, Rollback, Rate Limit, Tokenrotation, Gaeste und direkte DB-Constraints ab. Bestehende Browserpruefungen bleiben aktiv; keine neue UI in diesem Sprint.

Korrigierter Randfall aus der Integration: reine Kunden-Modusaenderung behaelt vorhandene Reminder statt eine neue Generation zu planen. Kein Spezifikationswechsel. Kein E-Commerce, kein Merge. Produktionsscheduler, Betreibertexte, Providervertraege und manuelle Kalender-/Accessibility-Abnahme bleiben Go-live-Themen.

Lokaler Endstand: 262 Unit-Tests, 154 PostgreSQL-Tests und 4 Chromium-Browsertests bestanden. npm ci, Prisma generate/validate, lint/typecheck/build, npm audit (0), frische DB/Upgrade/wiederholtes Deploy, Dokumentation (60 Dateien/1218 Links/192 IDs/0 Fehler) und git diff --check erfolgreich.
