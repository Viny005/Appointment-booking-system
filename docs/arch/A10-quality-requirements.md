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
Mit timeZone Europe/Berlin erzeugt der 29.03.2026 um 02:30 keinen Slot. Am 25.10.2026 werden bei freier Verfügbarkeit zwei unterschiedliche Instanzen angeboten: 02:30 MESZ (UTC+02:00, 00:30Z) und 02:30 MEZ (UTC+01:00, 01:30Z). Beide sind in Auswahl, Zusammenfassung und internem Detail unterscheidbar; UTC-Persistenz/ICS behalten genau die gewählte Instanz. Servicedauer misst verstrichene Minuten.

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

<a id="qs-17"></a>
### QS-17 Konkrete Meetingmodi

Service mit leerer allowedMeetingModes-Menge oder FIXED mit zwei Modi wird abgewiesen. CLIENT_CHOICE bietet nur konfigurierte Modi. Manipulierter Appointment-Modus CLIENT_CHOICE/unbekannter Modus scheitert. IN_PERSON ohne Ort, PHONE mit fehlendem erforderlichem Ziel oder ONLINE ohne gültige HTTPS-URL scheitern. Snapshot und UI zeigen den konkreten Modus; manuelle Online-URL erzeugt keinen Graph-Aufruf.

<a id="qs-18"></a>
### QS-18 Interne Details und Empfängerwechsel

ADMIN und tatsächlich beteiligter ADVISOR können Detaildaten sehen und erlaubte Felder ändern; bloß relationierter Berater erhält 403 ohne Daten. Konkurrierende Versionen: genau eine Änderung gewinnt. Metadatenänderung erhöht version, keine Kalendersequenz; Kunden und tatsächliche Berater erhalten die dafür vorgesehene Nachricht, Gäste keine Kontaktdaten. Gästeänderung: neue Gäste erhalten REQUEST mit Art.-14-Hinweis, bisherige entfernte ausschließlich CANCEL; übrige Beteiligte aktualisierten REQUEST. Anschließende Änderung erreicht entfernten Gast nicht. Verfügbarkeitsprüfung aller Berater und Audit mit Ereignis-ID nachweisen.

<a id="qs-19"></a>
### QS-19 Manuelles Bestätigungs-Resend

Nur berechtigter interner Nutzer wählt aus aktuellen Empfängern; freie Adresse wird abgewiesen. Gleiche Command-ID erzeugt einen Auftrag, neuer bewusster Versand einen neuen. UID/SEQUENCE bleiben erhalten; Kundenauswahl rotiert Capability und entwertet alte wartende geheime Nachrichten. Gäste/Berater erhalten keinen Kundenlink. Versandfehler ändert Termin nicht; Audit enthält Akteur, Empfängerkategorien/-anzahl, Zeitpunkt und Ergebnis ohne Adressen oder Token.

<a id="qs-20"></a>
### QS-20 Terminabschluss

Vor Ende scheitern COMPLETED/NO_SHOW. Danach kann ein berechtigter interner Nutzer CONFIRMED einmalig abschließen, Reservation entfernen und Audit schreiben. Keine Mail/ICS-Sequenzänderung. Wiederholung des gleichen Ergebnisses hat keine weitere Wirkung; anderer terminaler Status oder unberechtigter Zugriff wird abgewiesen.

<a id="qs-21"></a>
### QS-21 Reminder-Grenze

Mit injizierter Referenzzeit ist Start now+24h buchbar. reminderAt==now erzeugt nur Bestätigung und keinen Reminder. Bei Umbuchung mit reminderAt<now entsteht nur Änderungsbestätigung. Genau 24h vor Beginn bleiben Kundenumbuchung/-storno gesperrt. Bei reminderAt>now genau ein Auftrag; Resend/Metadatenänderung erzeugen keinen zweiten. Alte Reminder nach Umbuchung/Absage werden nicht gesendet.

<a id="qs-22"></a>
### QS-22 Sichere Profilbilder

Unberechtigter Upload, gefälschtes MIME, Polyglot/Decoderfehler, SVG, Animation, mehr als 5MiB oder 4096 Pixel je Dimension: abweisen. Gültige JPEG/PNG/WebP werden neu enkodiert, Metadaten entfernt und unter generiertem Key ausgeliefert. Traversal-Dateiname überschreibt nichts. Speicherfehler erhält altes Bild, erfolgreicher Tausch entfernt altes Objekt mit Retry; Historie bleibt lesbar.

<a id="qs-23"></a>
### QS-23 HTTP und Capability-Isolation

Produktionsantworten einschließlich Fehlerseiten auf CSP, nosniff, framing, Referrer, Permissions und sichere Cookies prüfen. Erst validierte Domain erhält HSTS. Capability-Seite hat no-referrer, no-store und keine Drittrequests; GET führt keine fachliche Mutation aus. Proxy-, Applikations- und CSP-Logs enthalten keine Tokens. Next.js-Hydration funktioniert mit Nonce-CSP.

<a id="qs-24"></a>
### QS-24 Information und Go-live-Sperren

Staging zeigt Impressum/Datenschutz direkt auf jeder öffentlichen Seite. Art.-13-Hinweis vor Kundenübermittlung, Art.-14-Hinweis in erster Gastmail, keine Pflicht-Einwilligung ohne entsprechende Rechtsgrundlage. Browserinventar zeigt nur notwendige Speicher und kein Standardbanner. Produktionsfreigabe scheitert organisatorisch solange ein Legal-/AVV-/BFSG-/VSBG-/Vertragsqualifikations-Gate offen ist; Demo-Werte werden nie als reale Betreiberangaben ausgegeben.

<a id="qs-25"></a>
### QS-25 Profil und Konto

DRAFT-Profil ohne Konto ist zulässig. ACTIVE nur mit Pflichtdaten und aktivem gültigen Service. Konto deaktivieren: Login sofort gesperrt, Profil und Termine bleiben; Profil INACTIVE: keine Neubuchung, bestehende Termine/Benachrichtigungen erhalten. Letzter aktiver ADMIN gegen konkurrierende Deaktivierung schützen. Historisch referenzierte Profile/Services nicht hard löschen.

<a id="qs-26"></a>
### QS-26 Adapterverträge

Dieselben Mail-/Media-Vertragstests gegen InMemory und lokale Adapter ausführen. Mail simuliert ACCEPTED/RETRYABLE/PERMANENT/UNKNOWN ohne Terminrollback; lokaler SMTP-Capture sendet nicht ins Internet. Media put/delete sind bei Wiederholung definiert; manipulierte Keys werden abgewiesen. MeetingProvider MANUAL hat keine Netzabhängigkeit. Vor Produktion dieselben Verträge gegen gewählten Provider prüfen.

<a id="qs-27"></a>
### QS-27 Konkreter Authentifizierungsvertrag

Bibliotheksintegration gemäß ADR-011 mit E-Mail/Passwort und PostgreSQL-Sitzungen: Ablehnung bei genau 30 Minuten Idle oder 8 Stunden seit Login, selbst bei laufender Aktivität. Polling verlängert Idle nicht. Logout, Reset, Rollenentzug und deaktiviertes Konto wirken beim nächsten Serverzugriff ohne Cookie-Cachefenster. Paralleler Resetgebrauch höchstens einmal erfolgreich; keine offene Registrierung. Application-Tests umgehen UI und Bibliotheksclient für Ownership-Prüfung.
