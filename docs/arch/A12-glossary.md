# 12 Architekturglossar

| Begriff | Architektur-Bedeutung |
|---|---|
| Application Layer | Orchestriert Use Cases, Transaktionen und Berechtigungsprüfungen. |
| Domain Layer | Fachliche Regeln ohne UI-/Providerwissen. |
| Availability Engine | Zentrale Komponente zur deterministischen Slotberechnung. |
| Outbox | Persistente Warteschlange für externe Nebenwirkungen nach erfolgreichem DB-Commit. |
| Adapter | Implementierung einer Schnittstelle zu externem Dienst. |
| Booking Draft | Temporärer Zustand eines noch nicht bestätigten öffentlichen Buchungsflows. |
| Snapshot | Kopie historisch relevanter Felder im Termin. |
| RBAC | Rollenbasierte Zugriffssteuerung. |
| PII | Personenbezogene Informationen. |

| Ergänzender Begriff | Bedeutung |
|---|---|
| MeetingModePolicy | Service-Auswahlregel FIXED/CLIENT_CHOICE, niemals gespeicherter Terminmodus |
| MeetingSnapshot | Konkreter Modus und validierte Orts-/Anruf-/Linkinformation des Termins |
| version | Optimistische Version jeder fachlichen Terminänderung |
| calendarSequence | Nur kalenderrelevante Änderungen erhöhen diese iCalendar-Version |
| Reminder-Generation | Entwertet bei Zeit-/Statuswechsel alte Reminder ohne Neuanlage durch reine Metadatenänderung |
| Capability | Geheimer, auf einen Termin beschränkter Kundenzugriff ohne Kundenkonto |
