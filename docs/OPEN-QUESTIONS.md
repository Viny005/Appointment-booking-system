# Offene Fragen und Freigabegrenzen

Stand: 2026-09-29. Entscheidungen für den ersten Implementierungssprint sind getroffen; Produktionsfreigaben sind separat nachzuweisen.

## Implementation blockers

**0 — keine offenen Einträge.**

Die abgeschlossenen Entscheidungen stehen in [READY-FOR-IMPLEMENTATION](READY-FOR-IMPLEMENTATION.md): deutscher V1-Arbeitstitel, Meetingpolicy/-modi, interne Änderungsregeln, Profil-/Kontolebenszyklus, Zeitzone, Reminder-Grenze, konkrete Authentifizierungsbibliothek, Adapterverträge und lokale Adapter. Branding verwendet zunächst neutrale Tokens und den Arbeitstitel; spätere Gestaltung blockiert keinen Code.

## Go-live blockers

| Offener Produktionsnachweis | Verantwortlich | Erforderliches Ergebnis |
|---|---|---|
| Betreiberidentität und echte Impressums-/Datenschutzangaben | Betreiber | Alle zutreffenden DDG-/DSGVO-Felder statt Platzhaltern, Kontakt-/Rechteprozess |
| Rechtliche Qualifikation des Buchungsvorgangs | Betreiber mit fachkundiger Prüfung | Entscheidung Terminorganisation/Vertrag; BFSG/BFSGV und VSBG §§36/37 geprüft, erforderliche Informationen umgesetzt |
| Rechtsgrundlagen und finale Aufbewahrung | Betreiber/Datenschutzverantwortung | Zwecke, Pflichttelefon, Gästeverarbeitung, 12/6-Monatswerte und Backupfenster freigegeben |
| Hosting, Datenbank, Region, Medien, Monitoring | Betrieb | Konkrete Provider, Zugriffsschutz, erforderliche AVV/Unterauftragnehmer-/Transferprüfung |
| Domäne, TLS, HSTS und Mailabsender | Betrieb | Domaininhaberschaft, HTTPS, Absenderauthentifizierung, Zustell- und Headerprüfung |
| Produktive Integration und Betriebsabnahme | Betrieb/Entwicklung | Gewählte Provider bestehen Adaptertests; Last-, Backup-/Restore-, Alert-, Session-, Upload- und Barrierefreiheitstests bestanden |
| Öffentliche Inhalte und Online-/Telefon-/Präsenzangaben | Betreiber | Richtige Profile, Services, Orte/Nummern/geeignete manuelle Links, keine Demo-Daten |

Die detaillierten Nachweise stehen in der [Deutschland-Checkliste](LEGAL-COMPLIANCE-DE.md) und [S3](spec/S3-inbetriebnahme.md). Kein offener Punkt gestattet einen stillen Wechsel zu Tracking, Kundenkonten, Verkauf oder Payment. Änderungen an bereits entschiedenen Regeln erfordern bewusste Änderung der Spezifikation und ggf. neue ADR.
