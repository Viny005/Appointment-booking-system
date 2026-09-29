# F1 — Geschäftsprozesse

## F1.1 Termin buchen

1. Kunde öffnet die öffentliche Startseite.
2. System zeigt alle aktiven, buchbaren Profile.
3. Kunde wählt ein Profil.
4. System zeigt die aktiven Services dieses Profils.
5. Kunde wählt einen Service und genau einen angebotenen konkreten Meetingmodus. FIXED zeigt die einzige Option; CLIENT_CHOICE lässt aus allowedMeetingModes wählen. Ort, Anrufrichtung oder manueller Onlinelink werden in der Zusammenfassung verständlich dargestellt.
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

- Aktiver Berater öffnet Details ausschließlich der Termine, an denen sein eigenes Profil tatsächlich beteiligt ist. Eine Profilrelation gibt kein Recht.
- Administrator verwaltet alle Termine.
- Interne Nutzer können auch innerhalb der letzten 24 Stunden ändern/stornieren.
- Detail enthält Kunde, Telefon, E-Mail, Gäste, Service, tatsächliche Berater, Wünsche, konkreten Modus, Ort/URL und Status. Interne Nutzer ändern erlaubte Kontaktdaten/Meetingangaben und Gäste, senden Bestätigungen erneut und erfassen nach Ende COMPLETED/NO_SHOW.
- Die [Ereignismatrix](N2-querschnittskonzepte.md#n211-aenderungen-und-empfaenger) legt Audit, Empfänger und Kalendersequenz fest. Resend ohne Kalenderänderung behält die Sequenz. Entfernter Gast erhält nur seinen Cancel; andere Beteiligte behalten ihr Ereignis.

## F1.5 Profil und Services verwalten

- Administrator legt Profile an, ändert sie, deaktiviert sie und ordnet Services zu.
- Profil beginnt in DRAFT, kann ohne Konto bestehen und wird erst mit vollständigen Publikationsdaten und aktivem gültigen Service ACTIVE. INACTIVE stoppt Neubuchungen ohne bestehende Termine zu verändern. Konto-Deaktivierung beendet Zugriff, nicht Profilhistorie.
- Services gehören zu einem Profil.
- Der Administrator kann später pro Berater die Berechtigung aktivieren, eigene Services selbst zu verwalten.

## F1.6 Erinnerung und Anonymisierung

- Standardreminder ist 24 Stunden vor Beginn. Bei Anlage/Umbuchung nur planen, wenn reminderAt strikt nach dem in der Transaktion erfassten now liegt; sonst genügt die Bestätigung. Genau now+24h ist buchbar, ohne zweite Sofortmail. Geplante Reminder werden nur bei weiterhin bestätigtem Termin vor Beginn gesendet.
- Abgeschlossene Termine bleiben als Historie erhalten.
- Personenbezogene Daten werden nach definierter Frist automatisiert anonymisiert; fachliche Terminmetadaten bleiben erhalten.
