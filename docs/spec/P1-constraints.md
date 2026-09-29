# P1-A — Verbindliche Constraints

| ID | Constraint | Begründung |
|---|---|---|
| <a id="con-01"></a>CON-01 | Keine E-Commerce-Funktionen. | Reiner Terminbuchungszweck. |
| <a id="con-02"></a>CON-02 | Kunden benötigen kein Benutzerkonto. | Niedrige Buchungshürde. |
| <a id="con-03"></a>CON-03 | Admin- und Beraterseiten sind nur nach erfolgreicher Authentifizierung erreichbar. | Zugriffsschutz. |
| <a id="con-04"></a>CON-04 | Rollen und Rechte werden serverseitig geprüft. | UI-Verstecken ist keine Autorisierung. |
| <a id="con-05"></a>CON-05 | Jeder öffentlich aktive Berater besitzt mindestens einen aktiven Service. | Vermeidung nicht buchbarer Profile. |
| <a id="con-06"></a>CON-06 | Jeder Berater besitzt eine unabhängige Verfügbarkeit. | Fachliche Grundlage der Kalenderlogik. |
| <a id="con-07"></a>CON-07 | Mehrere Zeitintervalle pro Wochentag sind zulässig. | Z. B. 08:00–10:00 und 14:00–17:00. |
| <a id="con-08"></a>CON-08 | Wiederkehrende Wochenregeln gelten automatisch für Folgewochen. | Wartbare Verfügbarkeitsplanung. |
| <a id="con-09"></a>CON-09 | Einzelne Daten können abweichende Verfügbarkeiten oder Blockierungen besitzen. | Urlaub, Termine, Sondertage. |
| <a id="con-10"></a>CON-10 | Überlappende Verfügbarkeitsintervalle werden nicht still abgelehnt; das System zeigt den Konflikt und bietet eine Fusion an. | Bessere UX. |
| <a id="con-11"></a>CON-11 | Ein Termin darf nie über das Ende einer effektiven Verfügbarkeitsperiode hinausgehen. | Konsistenz. |
| <a id="con-12"></a>CON-12 | Zwischen zwei Terminen ist kein obligatorischer Puffer vorgesehen. | Fachliche Entscheidung. |
| <a id="con-13"></a>CON-13 | Mindestvorlauf für Kundenbuchungen: 24 Stunden. | Fachliche Entscheidung. |
| <a id="con-14"></a>CON-14 | Maximales Buchungsfenster: 3 Monate. | Fachliche Entscheidung. |
| <a id="con-15"></a>CON-15 | Nur tatsächliche Terminbeteiligte und explizit eingeladene Gäste erhalten Termin-E-Mails. | Vermeidung unnötiger E-Mail-Belastung und Datenweitergabe. |
| <a id="con-16"></a>CON-16 | `.ics` ist der V1-Standard für Kalenderintegration. | Keine Pflicht zur Kalenderkonto-Verknüpfung. |
| <a id="con-17"></a>CON-17 | Keine automatische Teams-Konto-Verknüpfung in V1. | Externe Authentifizierung wird auf spätere Version verschoben. |
| <a id="con-18"></a>CON-18 | Private Sitzungen verfallen nach 30 Minuten Inaktivität; absolute maximale Sitzung 8 Stunden. | Sicherheit bei vertretbarer Nutzbarkeit. |
| <a id="con-19"></a>CON-19 | Historische Termine dürfen fachlich erhalten bleiben, personenbezogene Daten werden nach definierter Frist anonymisiert. | Datenschutz + Historie. |
| <a id="con-20"></a>CON-20 | Impressum und Datenschutzerklärung sind dauerhaft erreichbar. | Betrieb in Deutschland. |
| <a id="con-21"></a>CON-21 | Keine nicht notwendigen Tracking-/Marketing-Skripte in V1. | Datenschutz und reduzierte Komplexität. |
