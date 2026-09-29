# F1 — Geschäftsprozesse

## F1.1 Termin buchen

1. Kunde öffnet die öffentliche Startseite.
2. System zeigt alle aktiven, buchbaren Profile.
3. Kunde wählt ein Profil.
4. System zeigt die aktiven Services dieses Profils.
5. Kunde wählt einen Service.
6. System zeigt konfigurierte zusätzliche Teilnehmer. Ein als Standard markierter Teilnehmer ist vorausgewählt und kann entfernt werden, sofern `removable=true`.
7. System berechnet buchbare Tage für die tatsächliche Teilnehmermenge.
8. Kunde wählt einen aktiven Tag.
9. System zeigt nur für diesen Tag gültige Startzeiten.
10. Kunde wählt eine Startzeit.
11. Kunde erfasst Pflicht- und optionale Kontaktdaten sowie optionale Gäste.
12. System zeigt eine Zusammenfassung.
13. Kunde bestätigt.
14. System prüft serverseitig erneut alle Regeln und verhindert Doppelbelegung.
15. System speichert den Termin.
16. System zeigt Bestätigung und „Zum Kalender hinzufügen“.
17. System versendet Bestätigung und `.ics` an Beteiligte/Gäste.

## F1.2 Verfügbarkeit pflegen

1. Berater meldet sich an.
2. Berater öffnet eigene Verfügbarkeit.
3. Berater definiert pro Wochentag null bis mehrere Intervalle.
4. Wochenmuster gilt automatisch für Folgewoche(n).
5. Berater kann für ein konkretes Datum das Standardmuster ersetzen, ergänzen oder vollständig blockieren; außerdem kann er mehrtägige Abwesenheitszeiträume (z. B. Urlaub) in einem Schritt blockieren.
6. Bei überlappender Eingabe zeigt das System bestehende und neue Intervalle und bietet eine Fusion an.
7. Änderungen wirken auf zukünftig neu berechnete Buchungsmöglichkeiten, nicht rückwirkend auf bereits bestätigte Termine.

## F1.3 Termin ändern oder stornieren — Kunde

1. Kunde öffnet den sicheren Verwaltungslink aus der E-Mail.
2. System prüft den Token und zeigt ausschließlich diesen Termin.
3. Ist der Beginn mehr als 24 Stunden entfernt, kann der Kunde ändern oder stornieren.
4. Änderung: neue Verfügbarkeit wird berechnet; alter Termin bleibt bis zur atomaren Umbuchung geschützt.
5. Nach erfolgreicher Änderung werden aktualisierte Bestätigung und `.ics` versendet.
6. Stornierung setzt Status `CANCELLED`, gibt die belegten Ressourcen frei und versendet eine Kalenderstornierung.
7. Innerhalb der letzten 24 Stunden wird Selbstbedienung gesperrt; Kontakt zum Berater wird angezeigt.

## F1.4 Termin intern verwalten

- Berater verwaltet eigene Termine.
- Administrator verwaltet alle Termine.
- Interne Nutzer können auch innerhalb der letzten 24 Stunden ändern/stornieren.
- Relevante Änderungen erzeugen Audit-Einträge und Benachrichtigungen.

## F1.5 Profil und Services verwalten

- Administrator legt Profile an, ändert sie, deaktiviert sie und ordnet Services zu.
- Jeder aktive öffentliche Berater braucht mindestens einen aktiven Service.
- Services gehören zu einem Profil.
- Der Administrator kann später pro Berater die Berechtigung aktivieren, eigene Services selbst zu verwalten.

## F1.6 Erinnerung und Anonymisierung

- Das System versendet standardmäßig eine Terminerinnerung 24 Stunden vor Beginn, sofern der Termin weiterhin bestätigt ist.
- Abgeschlossene Termine bleiben als Historie erhalten.
- Personenbezogene Daten werden nach definierter Frist automatisiert anonymisiert; fachliche Terminmetadaten bleiben erhalten.
