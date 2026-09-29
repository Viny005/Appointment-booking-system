# 11 Risiken und technische Schulden

| ID | Risiko | Gegenmaßnahme |
|---|---|---|
| <a id="r-01"></a>R-01 | Komplexe Kalenderlogik führt zu Randfallfehlern. | Pure Domain-Tests + Szenariotests + DST-Tests. |
| <a id="r-02"></a>R-02 | Doppelbuchung trotz UI-Prüfung. | DB-Transaktion und DB-seitiger Kollisionsschutz. |
| <a id="r-03"></a>R-03 | E-Mail-Provider-Ausfall. | Outbox, Retry, Admin-Fehlerübersicht. |
| <a id="r-04"></a>R-04 | Scheduler fällt aus → Reminder/Retention verzögert. | Monitoring/Health-Check und idempotente Jobs. |
| <a id="r-05"></a>R-05 | Statische Online-Meeting-Links sind für manche Beratungsszenarien ungeeignet. | MeetingProvider-Schnittstelle; Teams V2. |
| <a id="r-06"></a>R-06 | Rechtliche Texte werden mit Platzhaltern produktiv geschaltet. | Go-Live-Checkliste mit echten Betreiber-/Dienstleisterdaten. |
| <a id="r-07"></a>R-07 | Profilbildspeicher ist providerabhängig. | MediaStorage-Adapter. |
| <a id="r-08"></a>R-08 | Öffentlicher Buchungsendpunkt kann Spam erzeugen. | Rate Limit, Honeypot/optional CAPTCHA erst bei Bedarf, Monitoring. |
| <a id="r-09"></a>R-09 | Scope wächst Richtung CRM/Payment. | ADR-010 und klare Out-of-Scope-Regeln. |

## Bewusst verschobene Punkte

- automatische Microsoft-Teams-Erstellung
- direkte Outlook-/Google-Kalendersynchronisation
- Kundenkonten bleiben ausgeschlossen; keine zugesagte spätere Funktion
- Mehrsprachigkeit über Deutsch hinaus
- erweiterte Reporting-Funktionen

## Risikoverantwortung und Review

Entwicklung verantwortet Kalender/Konkurrenz (R-01, R-02), Betreiber Versand und Scheduler (R-03, R-04), Produktverantwortung Meetingeignung und Scope (R-05, R-09), Betreiber/Datenschutz die Freigabe echter Texte (R-06), Betrieb Medien und Missbrauchsschutz (R-07, R-08). Review jeweils vor Implementierung des betroffenen Bausteins und erneut vor Go-Live. Noch keine technischen Schulden aus produktivem Code; dokumentierte Trade-offs sind Entwurfsrisiken.

Zusätzliche Risiken: Mailduplikate bei unklarem Providerresultat, Tokenkopien in der Versandwarteschlange und Grenzen manueller Kalenderimporte. Gegenmaßnahmen und verbleibende Grenzen stehen in [A08](A08-cross-cutting-concepts.md). Die dokumentierte Bibliothekskombination ist gewählt; spätere Versionswechsel benötigen erneute Kompatibilitäts- und Sicherheitstests.

Definitionslinks: [R-01](A11-risks-and-technical-debts.md#r-01), [R-02](A11-risks-and-technical-debts.md#r-02), [R-03](A11-risks-and-technical-debts.md#r-03), [R-04](A11-risks-and-technical-debts.md#r-04), [R-05](A11-risks-and-technical-debts.md#r-05), [R-06](A11-risks-and-technical-debts.md#r-06), [R-07](A11-risks-and-technical-debts.md#r-07), [R-08](A11-risks-and-technical-debts.md#r-08), [R-09](A11-risks-and-technical-debts.md#r-09).

## Review-Ergebnis vor Implementierung

Die Entscheidung für Bibliothek und unterstützte Kombination steht in [ADR-011](../../adr/011-authentication-library.md); noch auszuführende Integrationstests sind Entwicklungsarbeit, kein unentschiedener Architekturpunkt. Upload, Capability-Leaks, falsche Empfängermengen und Reminderduplikate sind in A08/A10 mit Gegenmaßnahmen und Abnahmen konkretisiert. Produktionsprovider und rechtliche Betreiberfreigabe bleiben ausschließlich [Go-live blockers](../OPEN-QUESTIONS.md).
