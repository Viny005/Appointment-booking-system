# P2 — Fachlicher Systemüberblick

P2 beschreibt die fachliche Struktur ohne konkrete Framework- oder Bibliothekswahl.

## P2.1 Fachliche Teilbereiche

1. **Öffentliche Buchung** — Profile, Services, Teilnehmerauswahl, Datum/Uhrzeit, Kundendaten, Bestätigung.
2. **Verfügbarkeitsmanagement** — Wochenmuster, mehrere Tagesintervalle, Ausnahmen, Blockierungen und Zusammenführungshinweise.
3. **Terminmanagement** — Terminstatus, Teilnehmer, Gäste, Änderung, Stornierung, Historie.
4. **Administration** — Profile, Services, Beziehungen, Berechtigungen, Systemparameter.
5. **Beraterbereich** — eigene Termine, eigener Kalender, eigene Verfügbarkeit.
6. **Benachrichtigung und Kalenderartefakte** — E-Mails, Erinnerungen und `.ics`.
7. **Zugriff und Datenschutz** — interne Authentifizierung, Rollen, Kundentoken, Anonymisierung, rechtliche Seiten.

## P2.2 Fachliche Kernregel

Die buchbare Zeit eines Termins ergibt sich aus:

`effektive Verfügbarkeit aller tatsächlichen Berater`
`− bestehende Termine`
`− Blockierungen`
`− Mindestvorlauf / Buchungshorizont`
`− unpassende Restzeiten für die Servicedauer`

Bei mehreren Beratern wird die **Schnittmenge** ihrer effektiven Verfügbarkeiten verwendet.

## P2.3 Fabrice als Beispiel, nicht als Sonderfall

Fabrice kann als erster Testberater angelegt werden. Beziehungen wie „Merveil → Fabrice, standardmäßig zusätzlich ausgewählt, aber abwählbar“ werden datengetrieben modelliert. Der Quellcode darf keine fest verdrahtete Fabrice-Sonderlogik benötigen.
