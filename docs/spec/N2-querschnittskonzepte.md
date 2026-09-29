# N2 — Querschnittskonzepte

## N2.1 Zeit und Zeitzonen

- Fachliche Wochenregeln werden in lokaler Profil-/Systemzeit interpretiert.
- Standard: `Europe/Berlin`.
- Konkrete Termine werden als eindeutige Zeitpunkte gespeichert.
- Sommer-/Winterzeitwechsel müssen explizit und reproduzierbar behandelt werden.

## N2.2 Verfügbarkeitsauflösung

Effektive Verfügbarkeit eines Profils = Wochenmuster + Tages-/Zeitraumausnahmen − Blockierungen − aktive Terminbelegungen.

Für mehrere Teilnehmer wird die Schnittmenge gebildet. Erst danach werden Startslots anhand Servicedauer und Slot-Schritt erzeugt.

## N2.3 Keine stillen Datenkorrekturen

Bei überschneidenden Verfügbarkeitsfenstern wird nicht automatisch gespeichert. Nutzer erhält Vorschlag zur Fusion und bestätigt aktiv.

## N2.4 Benachrichtigungsprinzip

Nur tatsächliche Teilnehmer und explizite Gäste erhalten Termin-E-Mails. Eine Profilbeziehung allein erzeugt keine Nachricht.

## N2.5 Historische Snapshots

Termine speichern relevante Service-/Profilinformationen als Snapshot, damit historische Einträge nach späteren Änderungen verständlich bleiben.

## N2.6 Fehlerbehandlung

- Buchungsfehler: keine teilweise Terminpersistenz.
- E-Mail-Fehler: Termin bleibt bestehen; Benachrichtigung wird als fehlgeschlagen protokolliert und erneut versucht.
- Externe Meeting-Provider-Fehler in späteren Versionen dürfen nicht zu unbemerkten inkonsistenten Terminen führen.

## N2.7 Berechtigungen

Rollen bilden grobe Zuständigkeit ab. Feingranulare Berechtigungen ermöglichen spätere Delegation, insbesondere `canManageOwnServices`, ohne einen neuen Rollentyp einzuführen.

## N2.8 Datenaufbewahrung

Historische Terminmetadaten können erhalten bleiben. Personenbezogene Felder sowie Gäste-E-Mails werden nach Frist entfernt/anonymisiert.

## N2.9 Rechtliche Informationsseiten

Impressum und Datenschutz werden als normale öffentliche Seiten behandelt und von jeder öffentlichen Seite erreichbar verlinkt.

## N2.10 Eindeutige Rechenregeln (Review-Präzisierung)

Pro Profil und lokalem Datum: Wochenintervalle lesen; bei `REPLACE_DAY` diese vollständig ersetzen; `ADD_INTERVAL` ergänzen; abschließend `BLOCK_DAY` anwenden (höchste Priorität). Mehrtägige Sperren umfassen beide angegebenen Datumsgrenzen. Höchstens ein Ersatzsatz pro Tag; widersprüchliche Ersatzsätze werden abgelehnt. Überlappende Ergänzungen müssen beim Bearbeiten ausdrücklich zusammengeführt werden.

Die resultierenden Intervalle werden geschnitten und bestätigte Belegungen sämtlicher Teilnehmer abgezogen. Startzeiten liegen auf einem Raster ab lokaler Mitternacht des Primärprofils, Standard 30 Minuten. Nur Kandidaten mit vollständig freiem Dauerintervall werden angeboten. „Jetzt“ wird je Berechnung einmal erfasst; Buchung revalidiert mit aktueller Zeit. Anzeige eines Slots reserviert ihn noch nicht.

## N2.11 Änderungen und Empfänger (Review-Präzisierung)

Eine Kundenumbuchung ändert in V1 nur Zeitpunkt und zulässigen Meetingmodus; Service, Primärprofil und Teilnehmermenge bleiben erhalten. Ein anderer Termintyp erfordert Stornierung und neue Buchung. Die alte Belegung wird bei Prüfung der eigenen Umbuchung ignoriert, fremde Belegungen niemals. Änderungen an Verfügbarkeiten oder deaktivierten Profilen stornieren bestehende Termine nicht; interne Nutzer erhalten einen Konflikthinweis und müssen bewusst handeln.

Bestätigungen und Änderungen gehen an Kunde, tatsächliche Berater und explizite Gäste; identische Empfängeradressen erhalten nicht mehrfach denselben Auftrag. Verwaltungslinks gehen ausschließlich an den Kunden. Gäste sehen keine fremden Kontaktdaten, freien Wünsche oder Verwaltungstokens. Für allgemeine Beziehungen werden keine E-Mails erzeugt.
