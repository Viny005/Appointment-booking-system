# 10 Qualitätsanforderungen

## Qualitätsszenarien

<a id="qs-01"></a>
### QS-01 Parallelbuchung
Zwei Kunden bestätigen nahezu gleichzeitig denselben Slot für denselben Berater. Höchstens eine Buchung darf erfolgreich sein; die andere erhält eine fachliche Konfliktantwort.

<a id="qs-02"></a>
### QS-02 Mehrpersonen-Termin
Merveil ist 10–12 Uhr verfügbar, Fabrice 11–13 Uhr; Service 60 min. Bei Auswahl beider darf nur 11:00 als einstündiger Start angeboten werden, abhängig von Slot-Schritt und Belegungen.

<a id="qs-03"></a>
### QS-03 Nicht beteiligter Berater
Kunde bucht „Merveil allein“. Fabrice ist zwar als Beziehung konfiguriert, aber abgewählt. Fabrices Kalender darf weder die Auswahl einschränken noch darf Fabrice eine Termin-E-Mail erhalten.

<a id="qs-04"></a>
### QS-04 Route Protection
Nicht angemeldeter Nutzer ruft direkte Admin-URL auf. Keine geschützten Daten werden gerendert; Redirect zu Login.

<a id="qs-05"></a>
### QS-05 E-Mail-Ausfall
Provider ist nach erfolgreicher Termintransaktion nicht erreichbar. Termin bleibt bestätigt; Notification wird für Retry markiert.

<a id="qs-06"></a>
### QS-06 DST
Termin in Woche des Sommer-/Winterzeitwechsels wird korrekt als lokaler Termin in Europe/Berlin angezeigt und als eindeutiger UTC-Zeitpunkt gespeichert.

<a id="qs-07"></a>
### QS-07 Serviceänderung
Admin ändert später Name/Dauer eines Services. Alter Termin bleibt historisch mit seinem Buchungs-Snapshot verständlich.

<a id="qs-08"></a>
### QS-08 Anonymisierung
Retention-Frist erreicht. Kunde/Gäste werden anonymisiert, aber Datum, Service-Snapshot, beteiligte Profile und Status bleiben für Historie erhalten.

## Messbare Abnahmeszenarien (noch nicht ausgeführt)

<a id="qs-09"></a>
### QS-09 Rechte und Sitzungen
ADVISOR ruft fremden Termin direkt auf: 403, keine Daten. Ohne Sitzung: Seite leitet um, API 401. Nach 30 Minuten ohne Aktivität oder 8 Stunden absolut wird auch ein vorhandener Cookie abgewiesen. Logout, Kontodeaktivierung und Reset widerrufen Zugriff.

<a id="qs-10"></a>
### QS-10 Last und Providerentkopplung
Vorgeschlagenes Lastprofil: 50 aktive Berater, maximal 5 je Terminkombination, 10.000 Termine, 20 parallele Leser, 100 Monatsabfragen nach Warm-up auf dokumentierter Staging-Hardware. Serverseitiges p95 unter 1 Sekunde. Ein 30 Sekunden verzögerter Mailprovider verlängert die Buchungstransaktion nicht. Ergebnisse und Hardware vor Go-Live protokollieren.

<a id="qs-11"></a>
### QS-11 Zugänglichkeit und Fehlerzustände
Öffentlichen Wizard, Verwaltung und interne Kernflows vollständig per Tastatur und Screenreader durchlaufen; 320 CSS-Pixel Breite ohne Verlust von Bedienfunktionen. Labels, Fokus, Fehlermeldungen und deaktivierte Tage prüfen; automatischer Scan plus manuelle WCAG-2.2-AA-Abnahme. Ungültige Formulare behalten gültige Entwurfsfelder.

<a id="qs-12"></a>
### QS-12 Grenzfälle und Änderungen
Genau 24 Stunden Vorlauf ist buchbar, Kundenänderung bei genau 24 Stunden gesperrt. Monatsende, überlappende Ausnahmen, Tagesblock und zwei Herbst-Offsets prüfen. Zwei angrenzende Termine sind erlaubt. Fehlgeschlagene Umbuchung lässt alte Reservation und Version bestehen; doppelte Stornierung erzeugt keinen zweiten Versandauftrag.

<a id="qs-13"></a>
### QS-13 Wiederholung und Wiederherstellung
Crash nach Termincommit und vor HTTP-Antwort: gleicher Schlüssel ergibt genau einen Termin und einen fachlichen Auftrag je Empfänger. Workercrash nach Übernahme: Lease läuft ab, Auftrag wird erneut verarbeitet. Backup isoliert wiederherstellen, Retention nachziehen und Rückstände kontrolliert freigeben; RPO/RTO aus A07 nachweisen.

<a id="qs-14"></a>
### QS-14 Datenschutz und Geheimnisse
Kunden-, Gast-, Reset- und interne Empfänger getrennt prüfen: kein Verwaltungslink in Gastmail/ICS/Log. Ungültiger oder abgelaufener Token zeigt keine Daten. Bereinigung umfasst alle PII-Kopien; 6-/12-Monatsgrenzen und `NO_SHOW` sowie vergangenes `CONFIRMED` prüfen. Öffentliche Seiten enthalten Betreiberlinks, Gastmail den Datenschutzhinweis; keine Marketingtracker.

<a id="qs-15"></a>
### QS-15 Konfiguration und Datenintegrität
Admin legt Profil, Service, Beziehung und Benutzer an. Letzten aktiven Service oder Administrator unzulässig deaktivieren: abgewiesen. Ungültige Parameter, Selbstbeziehung und doppelte Relation: kein Speichern. Deaktiviertes Profil verschwindet öffentlich, bestehende Termine und Snapshots bleiben. Delegierte Serviceverwaltung ist auf das eigene Profil begrenzt.

<a id="qs-16"></a>
### QS-16 Sicherheits- und Modulnachweise
Manipulierte Mutationen, fehlender CSRF-Nachweis, Rate-Limit-Überschreitung und zweiter Reset-Tokengebrauch werden abgewiesen. Passwortspeicher enthält ausschließlich geeignete Hashes; Produktionscookies haben die festgelegten Attribute. Repository/Browserbundles und Logs auf Secrets prüfen. Availability ohne UI/Mail testen; Adapter durch Testdoubles ersetzen. Alle Abnahmefälle referenzieren die stabilen Spezifikations-IDs.

[Vollständige Zuordnung aller NFRs und Funktionen](../TRACEABILITY.md). Ziele sind geplante Abnahmekriterien und keine behaupteten Messergebnisse.

Definitionslinks: [QS-01](A10-quality-requirements.md#qs-01), [QS-02](A10-quality-requirements.md#qs-02), [QS-03](A10-quality-requirements.md#qs-03), [QS-04](A10-quality-requirements.md#qs-04), [QS-05](A10-quality-requirements.md#qs-05), [QS-06](A10-quality-requirements.md#qs-06), [QS-07](A10-quality-requirements.md#qs-07), [QS-08](A10-quality-requirements.md#qs-08), [QS-09](A10-quality-requirements.md#qs-09), [QS-10](A10-quality-requirements.md#qs-10), [QS-11](A10-quality-requirements.md#qs-11), [QS-12](A10-quality-requirements.md#qs-12), [QS-13](A10-quality-requirements.md#qs-13), [QS-14](A10-quality-requirements.md#qs-14), [QS-15](A10-quality-requirements.md#qs-15), [QS-16](A10-quality-requirements.md#qs-16).
