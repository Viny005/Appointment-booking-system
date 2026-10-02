# Sprint 13 – Öffentliche Buchungsoberfläche

Branch `feat/public-booking-ui`, Basis: validierter Sprint 12.

Die öffentliche Oberfläche unter `/book` führt ohne Kundenkonto durch Profil, Leistung, Teilnehmende, Datum/Slot, Terminart, Kontaktdaten, Prüfung und Bestätigung. Auswahlzustand und personenbezogene Daten werden nicht in URLs geschrieben. Der Browser erhält nur die bestehende zufällige HttpOnly-Draft-Fähigkeit; serverseitige Draft-, Availability- und Appointment-Use-Cases bleiben autoritativ.

Slots werden als UTC-Instant plus lokale Uhrzeit und Offset dargestellt. Dadurch bleiben doppelte lokale Zeiten bei DST-Rückstellung unterscheidbar. Vor der ersten Eingabe personenbezogener Daten erscheint der Datenschutzhinweis; es gibt keine künstliche Datenschutz-Einwilligungscheckbox. Tracking, Analytics, Werbung und Kundenkonten wurden nicht ergänzt.

Die Oberfläche ist tastaturbedienbar, besitzt sichtbare Fokuszustände, Labels, textliche Fehler/Statusmeldungen und ein flexibles Layout bis 320 CSS px. Öffentliche Datenschutz- und Impressumsrouten sind erreichbar, enthalten jedoch ausdrücklich keine erfundenen Betreiberangaben. Die in LEGAL-COMPLIANCE-DE dokumentierten Betreiber-/Rechtsfreigaben bleiben Go-live-Blocker.

Neue öffentliche API-Endpunkte geben ausschließlich freigegebene Katalogdaten bzw. verfügbare Slots zurück. PII wird dort nicht übertragen. Buchungsänderungen laufen weiter über den origin-geprüften Draft-Endpunkt mit no-store/no-referrer.
