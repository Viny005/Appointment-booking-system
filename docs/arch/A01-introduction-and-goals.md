# 1 Einführung und Ziele

## 1.1 Architekturziele

1. **Korrekte Verfügbarkeit** — Kalenderberechnung muss wiederkehrende Regeln, Ausnahmen, Servicedauer und mehrere Teilnehmer korrekt kombinieren.
2. **Keine Doppelbuchungen** — auch bei parallelen Requests.
3. **Sichere private Bereiche** — Authentifizierung und Autorisierung serverseitig.
4. **Erweiterbare Integrationen** — E-Mail, `.ics` und später Teams ohne Domänenumbau.
5. **Klare Wartbarkeit** — öffentliche Buchung, Terminlogik, Administration und Integrationen sind logisch getrennt.
6. **Datenschutzorientierung** — möglichst wenig personenbezogene Daten und kontrollierte Anonymisierung.

## 1.2 Qualitätsziele

| ID | Ziel |
|---|---|
| <a id="qg-01"></a>QG-01 | Datenkonsistenz vor Komfort: kein erfolgreicher Request darf eine Doppelbelegung erzeugen. |
| <a id="qg-02"></a>QG-02 | Verfügbarkeitslogik ist deterministisch und automatisiert testbar. |
| <a id="qg-03"></a>QG-03 | Alle privaten Aktionen sind explizit autorisiert. |
| <a id="qg-04"></a>QG-04 | Externe Provider sind austauschbar. |
| <a id="qg-05"></a>QG-05 | Öffentliche Buchung bleibt mobil, zugänglich und ohne Kundenkonto. |

## 1.3 Stakeholder

- Kunde
- Berater
- Administrator
- Betreiber/Datenschutzverantwortlicher
- Entwickler/Wartung
- Hosting-/E-Mail-Dienstleister

Definitionslinks: [QG-01](A01-introduction-and-goals.md#qg-01), [QG-02](A01-introduction-and-goals.md#qg-02), [QG-03](A01-introduction-and-goals.md#qg-03), [QG-04](A01-introduction-and-goals.md#qg-04), [QG-05](A01-introduction-and-goals.md#qg-05).
