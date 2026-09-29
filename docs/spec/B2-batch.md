# B2 — Automatisierte Hintergrundprozesse

Grundlage: [F1](F1-geschaeftsprozesse.md), [F3](F3-anwendungsfunktionen.md), [Aufbewahrung](D2-datentypen.md). Die technische Ausführung wird in [A07](../arch/A07-deployment-view.md) festgelegt.

| Prozess | Auslöser und Auswahl | Ergebnis und Fehlerregel |
|---|---|---|
| Benachrichtigungen | Erfolgreiche Buchung, Umbuchung oder Absage | Nachricht je tatsächlichem Empfänger; Ausfall verändert keinen Termin. Fehlgeschlagene Sendungen werden erneut versucht und nach ausgeschöpften Versuchen sichtbar eskaliert. |
| Erinnerung | Standardmäßig 24 Stunden vor Beginn, nur bestätigte Termine | Höchstens ein fachlicher Erinnerungsauftrag je Terminversion und Empfänger. Nach Absage kein Versand; nach Umbuchung gilt nur die aktuelle Version. Bei Buchung genau am Erinnerungszeitpunkt reicht die Bestätigung. Nach Terminbeginn keine verspätete Erinnerung. |
| Aufbewahrung | Tägliche Prüfung der konfigurierten Frist | Kunden- und Gästedaten, freie Texte, Verwaltungsschlüssel und personenbezogene Versandkopien löschen/anonymisieren. Keine offenen zukünftigen Termine entfernen. |

**Review-Präzisierung:** Wiederholungen dürfen keine neuen Termine oder Statusänderungen erzeugen. Betreiber sieht Rückstand und Fehler ohne geheime Links. Erneuter Start setzt beim nicht erledigten Auftrag fort. Reminder- und Retention-Regeln werden unabhängig von einer offenen Browsersitzung ausgeführt.
