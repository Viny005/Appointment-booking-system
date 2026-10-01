# Sprint 8: Kunden-Terminverwaltung

Branch `feat/customer-appointment-management`, Basis `feat/booking-notifications`. Eigene gestapelte PR, kein Merge.

## Fachlicher Umfang

UC-08/UC-09/UC-10 und AF-13/AF-14/AF-15: Lesen ueber Verwaltungsfaehigkeit, Umbuchen und Absagen. Kundenaktionen verlangen CONFIRMED und streng `start - now > 24h`. Genau 24 Stunden ist gesperrt. Terminale Termine koennen nicht umgebucht werden. Die Entscheidung erfolgt mit nach Sperrerwerb erfasstem Jetzt.

Termin-ID, UID, Service, Dauer, Kundenadresse und tatsaechliche Beratermenge bleiben unveraendert. Reine Zeitverschiebung erhaelt den gespeicherten Meeting-Snapshot auch nach Profil-/Servicedeaktivierung. Moduswechsel verwenden ausschliesslich aktuell erlaubte, valide konkrete Serviceoptionen. No-op erzeugt weder Version noch Kalenderereignis. Zeit-/Modusaenderung und Absage erhoehen Version und calendarSequence genau einmal.

## Schichten und Transaktion

Domain: Capability-Grenzen, 24h-Regel, Befehls-Allowlist, minimale Kundenprojektion. Application: CustomerManagement mit read, slots, change; Repository-Ports und injizierte Uhr/Hashfunktion. Infrastruktur: PostgreSQL/Prisma, SHA-256, HTTP und serverseitige Composition.

Mutation sperrt Capability-Befehl, sortierte tatsaechliche AdvisorProfile und Appointment. Danach Token, Ablauf, Widerruf und Version erneut pruefen. Gemeinsame Availability Engine mit Europe/Berlin/Temporal und exakt gewaehltem UTC-Instant; nur eigene Belegung wird ausgeschlossen. Fremde Belegungen bleiben gesperrt. Reservierungen, Termin, Outbox und Replay-Quittung committen gemeinsam. GiST und deferred Aggregate-Constraints bleiben letzte DB-Integritaetsgrenze. Bekannte Serialization-/Deadlockfehler werden maximal dreimal versucht; keine blinden Retries von Constraintfehlern.

Umbuchung ersetzt Reservierungen atomar, setzt Faehigkeitsablauf auf neues Ende und behaelt deren Hash. Absage entfernt Reservierungen und widerruft Faehigkeit. Alte PENDING/FAILED-Auftraege werden SUPERSEDED und ihre Secrets/Leases entfernt. Aktuelle Empfaenger erhalten REQUEST bzw. CANCEL. Reminder-Generation wird erneuert; neuer Reminder nur bei start-24h > now. Versand bleibt at-least-once mit den dokumentierten Grenzen bereits laufender SMTP-Sendungen.

## Replay und Migration

Additives Modell AppointmentMutationReceipt mit Hash der Faehigkeit, Befehlsschluessel, Payloadhash, minimalem Ergebnis (Status/Version), Ablauf und Erstellungszeit. Unique(scope,key), Hash-/Schluessel-/JSON-Allowlist-Checks; keine Namen, Kontakte, Tokens oder Termindetails in Ergebnissen. Migration 20261001090000_customer_management veraendert keine bestehende Migration.

Identischer Befehl kann 24 Stunden dieselbe minimale Quittung erhalten, auch wenn seine Absage den Link widerrufen hat. Dies oeffnet keinen Lesezugriff; anderer Schluessel oder anderer Payload erhaelt keinen neuen Erfolg. Ablauf wird bei jedem Zugriff geprueft. Der Versandworker entfernt abgelaufene Quittungen in begrenzten Batches mit erneuter Ablaufpruefung am DELETE; Schedulerbetrieb bleibt Go-live-Voraussetzung. Bereichsuebergreifende Termin-Retention folgt im vorgesehenen Sprint 10.

## HTTP, Browser und Datenschutz

POST /api/customer-appointment fuer read/slots/change: konfigurierte Same-Origin-Pruefung, Cross-Site-Abweisung, JSON, gestreamtes 8-KiB-Limit, no-store/no-referrer, generische Betriebsfehler. Kein mutierendes GET. Rohfaehigkeit nur im POST-Body, niemals Query, Log oder persistenter Browserspeicher. Die /manage-Seite liest das E-Mail-Fragment in Arbeitsspeicher und entfernt es vor dem ersten Zugriff aus der URL. Ungueltig/abgelaufen/widerrufen liefert keine Termindaten. Ohne JavaScript gibt es keinen Capability-Zugriff.

Keine Analytics, externen Fonts oder Drittinhalte. Explizite Formularlabels/Legenden, Statusregion, Fokus nach Aktionen, native Tastaturbedienung, Absagebestaetigung und mobile 320-Pixel-Darstellung. Beide Herbstzeiten werden mit UTC-Offset unterscheidbar angeboten. Automatisierte axe-Checks ersetzen keine vollstaendige manuelle Barrierefreiheitsabnahme.

Datensparsame Projektion und technische Schutzmassnahmen orientieren sich an Art. 5/25/32 DSGVO, am 01.10.2026 mit [EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32016R0679) abgeglichen. Keine Aussage ueber Rechtsgrundlage/Betreiberidentitaet erfunden. Verantwortlichenangaben, Kontaktweg und vollstaendige Datenschutztexte bleiben Betreiber-Go-live-Aufgaben, siehe [Compliance](LEGAL-COMPLIANCE-DE.md). Die Seite verweist bei gesperrter Selbstbedienung auf den bekannten Kontaktweg, ohne unbekannte Kontaktdaten zu erfinden.

## Validierung

Unit: strikte Grenze, Status, sichere Projektion, erlaubte Modi, Origin/Methoden/Inputlimit/Headers. PostgreSQL: Tokenablauf/-widerruf, atomare Absage und Replay, Snapshot/UID/Sequenz, inaktive Profile, Kollision und Rollback, konkurrierende Umbuchungen, direkte Receipt-DB-Checks. Browser: Fragment/Referrer/Storage, mobile Breite, axe, Tastatur, explizite Absage, getrennte DST-Offsets und ungueltiger Link. Browser-Routen sind synthetisch gemockt; fachliche Transaktionen werden separat auf echter PostgreSQL-17-DB geprueft.

CI prueft frische DB, wiederholte Migration und Upgrade aus Outbox-Stand mit vorhandenen Terminen/Benachrichtigungen, neben allen bisherigen Upgrade-Pfaden. Finale Zahlen/CI-SHAs im Sprintbericht und in der PR.

Keine internen Verwaltungsrechte/UI vorweggenommen, keine Kundenkonten, kein E-Commerce. Kein fachlicher Spezifikationswiderspruch gefunden.

Lokaler Endstand: 241 Unit-Tests, 129 PostgreSQL-Tests und 4 Chromium-Browsertests bestanden. npm ci, Prisma generate/validate, lint/typecheck/build, npm audit (0), frische Migration/Upgrade/wiederholtes Deploy und git diff --check erfolgreich. Dokumentationspruefung: 59 Dateien, 1214 Links, 192 IDs, keine Fehler.
