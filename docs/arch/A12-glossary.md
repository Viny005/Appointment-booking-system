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
