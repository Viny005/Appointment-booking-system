# F2 — Anwendungsfälle

## F2.1 Index

| ID | Anwendungsfall | Primärer Akteur |
|---|---|---|
| [UC-01](#uc-01) | Beraterprofil auswählen | Kunde |
| [UC-02](#uc-02) | Service auswählen | Kunde |
| [UC-03](#uc-03) | Zusätzliche Teilnehmer konfigurieren | Kunde |
| [UC-04](#uc-04) | Datum und Uhrzeit auswählen | Kunde |
| [UC-05](#uc-05) | Kontaktdaten und Gäste erfassen | Kunde |
| [UC-06](#uc-06) | Termin bestätigen | Kunde |
| [UC-07](#uc-07) | Kalenderdatei hinzufügen | Kunde/Beteiligter |
| [UC-08](#uc-08) | Eigenen Termin verwalten | Kunde |
| [UC-09](#uc-09) | Termin ändern | Kunde |
| [UC-10](#uc-10) | Termin stornieren | Kunde |
| [UC-11](#uc-11) | Intern anmelden | Admin/Berater |
| [UC-12](#uc-12) | Eigene Verfügbarkeit pflegen | Berater |
| [UC-13](#uc-13) | Eigenen Kalender und Termine anzeigen | Berater |
| [UC-14](#uc-14) | Termin intern ändern/stornieren | Berater/Admin |
| [UC-15](#uc-15) | Profile verwalten | Admin |
| [UC-16](#uc-16) | Services verwalten | Admin |
| [UC-17](#uc-17) | Beziehungen zwischen Profilen verwalten | Admin |
| [UC-18](#uc-18) | Benutzer/Rollen/Berechtigungen verwalten | Admin |
| [UC-19](#uc-19) | Systemparameter verwalten | Admin |
| [UC-20](#uc-20) | Passwort zurücksetzen | Admin/Berater |
| [UC-21](#uc-21) | Internes Termindetail öffnen | Admin/tatsächlich beteiligter Berater |
| [UC-22](#uc-22) | Erlaubte Termininformationen bearbeiten | Admin/tatsächlich beteiligter Berater |
| [UC-23](#uc-23) | Gästeliste verwalten | Admin/tatsächlich beteiligter Berater |
| [UC-24](#uc-24) | Bestätigung manuell erneut senden | Admin/tatsächlich beteiligter Berater |
| [UC-25](#uc-25) | Terminergebnis erfassen | Admin/tatsächlich beteiligter Berater |

<a id="uc-01"></a>
## UC-01 — Beraterprofil auswählen

**Vorbedingung:** Öffentliche Seite ist erreichbar.\
**Hauptablauf:** System zeigt nur aktive Profile, die mindestens einen aktiven Service besitzen. Kunde wählt ein Profil.\
**Nachbedingung:** Primärberater ist im Buchungsentwurf gesetzt.

<a id="uc-02"></a>
## UC-02 — Service auswählen

**Vorbedingung:** UC-01 abgeschlossen.\
**Hauptablauf:** System zeigt ausschließlich aktive Services des gewählten Profils mit Name, Beschreibung, Dauer und Meetingmodus. Kunde wählt einen Service.\
**Nachbedingung:** Service, Dauer und genau ein konkreter Modus sind gesetzt. FIXED erlaubt genau eine, CLIENT_CHOICE nur konfigurierte Optionen; mode CLIENT_CHOICE als Terminwert wird abgewiesen. Erforderliche Orts-/Telefon-/Onlineangaben folgen [D2](D2-datentypen.md).

<a id="uc-03"></a>
## UC-03 — Zusätzliche Teilnehmer konfigurieren

**Vorbedingung:** Profil und Service gewählt.\
**Hauptablauf:** System zeigt konfigurierte zusätzliche Teilnehmer. Standardteilnehmer sind vorausgewählt. Entfernbare Teilnehmer können abgewählt werden.\
**Beispiel:** Nach Wahl von Merveil ist Fabrice vorausgewählt; der Kunde kann Fabrice entfernen und „nur Merveil“ buchen.\
**Nachbedingung:** Menge der tatsächlichen Beraterteilnehmer ist festgelegt.

<a id="uc-04"></a>
## UC-04 — Datum und Uhrzeit auswählen

**Vorbedingung:** Service und Teilnehmermenge stehen fest.\
**Hauptablauf:** System berechnet für maximal drei Monate im Voraus effektive Verfügbarkeiten. Tage ohne gültigen Slot sind deaktiviert. Erst nach Klick auf einen aktiven Tag werden dessen Startzeiten angezeigt.\
**Regeln:** Mindestens 24 Stunden Vorlauf; kein Slot darf die Verfügbarkeit überschreiten; kein Puffer zwischen Terminen; bestehende Belegungen werden ausgeschlossen.\
**Nachbedingung:** Gewählter Startzeitpunkt ist im Entwurf gespeichert.

<a id="uc-05"></a>
## UC-05 — Kontaktdaten und Gäste erfassen

**Pflichtfelder:** Vorname, Nachname, E-Mail, Telefon.\
**Optional:** Adresse, Wünsche/Anmerkungen, null bis mehrere Gast-E-Mail-Adressen.\
**Nachbedingung:** Formulardaten sind validiert und nur temporär im Buchungsentwurf vorhanden.

<a id="uc-06"></a>
## UC-06 — Termin bestätigen

**Vorbedingung:** Vollständiger Entwurf.\
**Hauptablauf:** System zeigt Zusammenfassung. Nach Bestätigung wird die Verfügbarkeit serverseitig erneut geprüft und der Termin atomar gespeichert.\
**Alternativ:** Slot ist inzwischen belegt → keine Buchung; Kunde erhält aktualisierte Verfügbarkeiten.\
**Nachbedingung:** Terminstatus `CONFIRMED`, konkreter Meeting-Snapshot, Kalender-UID/Sequenz 0 und Verwaltungsfähigkeit erzeugt, Bestätigungen atomar geplant. Reminder nur bei reminderAt > now; bei genau 24 Stunden Vorlauf genügt die Bestätigung.

<a id="uc-07"></a>
## UC-07 — Kalenderdatei hinzufügen

Nach Bestätigung bietet das System eine `.ics`-Datei an. Dieselbe Terminidentität wird in E-Mails verwendet. Nur kalenderrelevante Änderungen nach N2 erhöhen die Kalendersequenz; Stornierungen verwenden dieselbe UID als Cancel-Update.

<a id="uc-08"></a>
## UC-08 — Eigenen Termin verwalten

Kunde öffnet einen nicht erratbaren Verwaltungslink. Ohne gültigen Token werden keine Termindaten angezeigt. Es ist kein Kundenkonto erforderlich.

<a id="uc-09"></a>
## UC-09 — Termin ändern

**Kunde:** nur wenn mehr als 24 Stunden bis Terminbeginn verbleiben; bei genau 24 Stunden gesperrt.\
**Intern:** Admin/Berater dürfen bei ausreichender Berechtigung auch später ändern.\
**Regel:** Änderung muss dieselben Verfügbarkeits- und Kollisionsprüfungen wie eine neue Buchung durchlaufen.

<a id="uc-10"></a>
## UC-10 — Termin stornieren

Stornierung setzt den Termin auf `CANCELLED`, gibt die Beraterbelegung frei und löst E-Mail-/Kalenderstornierungen für tatsächliche Beteiligte und Gäste aus.

<a id="uc-11"></a>
## UC-11 — Intern anmelden

E-Mail + Passwort. Erfolgreiche Anmeldung erzeugt serverseitige Sitzung. Jede private Route prüft Authentifizierung; bei fehlender Sitzung erfolgt Redirect auf `/login`.

<a id="uc-12"></a>
## UC-12 — Eigene Verfügbarkeit pflegen

Berater kann wiederkehrende Wochenintervalle, konkrete Tagesausnahmen und mehrtägige Blockierungszeiträume für das eigene Profil verwalten. Mehrere Intervalle pro Tag sind erlaubt. Überlappungen erzeugen einen Fusionsvorschlag.

<a id="uc-13"></a>
## UC-13 — Eigenen Kalender und Termine anzeigen

Berater sieht ausschließlich Termine, an denen das eigene Profil tatsächlich beteiligt ist. Ansichten: Tag, Woche, Monat sowie Terminliste.

<a id="uc-14"></a>
## UC-14 — Termin intern ändern/stornieren

Aktiver ADVISOR benötigt tatsächliche Beteiligung seines eigenen Profils; ADMIN darf alle Termine verwalten. Zeit-/Modusänderung revalidiert alle Teilnehmer unter Sperre. Absage vor Ende bleibt auch bei nachträglich blockierter Verfügbarkeit möglich. Details, Gäste, Resend und Ergebnis sind in UC-21 bis UC-25 geregelt. Alle Mutationen prüfen erwartete Version und Rechte; Audit/Outbox committen atomar. Die Empfänger- und Sequenzregeln stehen in [N2](N2-querschnittskonzepte.md#n211-aenderungen-und-empfaenger).

<a id="uc-15"></a>
## UC-15 — Profile verwalten

ADMIN legt Profile zunächst als DRAFT an, auch ohne Konto. Veröffentlichung verlangt Name, geprüftes Foto, Rolle/Titel, Kurzbeschreibung, Profil-E-Mail und mindestens einen aktiven vollständigen Service. ACTIVE/INACTIVE und Kontozuordnung folgen D1; keine historische Löschung. Fotoersatz nur ADMIN, validiert gemäß NFR-SEC-09.

<a id="uc-16"></a>
## UC-16 — Services verwalten

Admin erstellt, ändert, aktiviert/deaktiviert Services pro Profil. Ein öffentlich aktives Profil muss mindestens einen aktiven Service behalten. Die explizite Berechtigung `canManageOwnServices` erlaubt nur eigene Services. Konfiguration prüft MeetingModePolicy und jeden angebotenen konkreten Modus samt Pflichtinformationen; historische Snapshots bleiben unverändert.

<a id="uc-17"></a>
## UC-17 — Beziehungen zwischen Profilen verwalten

Admin definiert z. B. Merveil → Fabrice mit Eigenschaften `angeboten`, `standardmäßig ausgewählt`, `vom Kunden entfernbar`, `aktiv`.

<a id="uc-18"></a>
## UC-18 — Benutzer/Rollen/Berechtigungen verwalten

Admin verwaltet interne Konten und Rollen `ADMIN`, `ADVISOR`. Erweiterbare Berechtigungen erlauben spätere Delegation ohne Rollenumbau.

<a id="uc-19"></a>
## UC-19 — Systemparameter verwalten

Admin verwaltet gültige Slot-Schrittweite und Aufbewahrungs-/Anonymisierungsfristen. Vorlauf 24 verstrichene Stunden, Horizont drei Kalendermonate, Reminder 24 Stunden und timeZone Europe/Berlin sind die feste V1-Baseline; ihre Änderung verlangt eine dokumentierte fachliche Folgeentscheidung, keinen freien V1-Parameterwechsel.

<a id="uc-20"></a>
## UC-20 — Passwort zurücksetzen

Interner Nutzer fordert einen zeitlich begrenzten Einmallink an. Nach erfolgreicher Änderung werden alte Reset-Token invalidiert; bestehende Sitzungen werden beendet (Sicherheitspräzisierung der Baseline).

## Gemeinsame Alternativ- und Abnahmebedingungen

- Keine aktiven Profile/Services oder kein gemeinsamer Slot: verständlicher Leerzustand ohne ungültige Auswahl; Änderungen an Profil, Service oder Teilnehmern verwerfen abhängige Datumswahl.
- Fehlerhafte Pflichtfelder: feldbezogene Meldung; noch gültige Eingaben bleiben im temporären Entwurf. Manipulierte oder inzwischen inaktive Teilnehmer/Services werden bei Bestätigung erneut zurückgewiesen.
- Veralteter Verwaltungslink: keine Termindaten; Kontaktweg anzeigen. Erneute Stornierung ist fachlich idempotent, ohne weitere Absagen. Abgeschlossene/abgesagte Termine lassen keine Umbuchung zu.
- Verfügbarkeitsfusion erfordert Bestätigung; Abbruch speichert nichts. Bearbeitung einer fremden Ressource wird auch bei direktem URL-Aufruf verweigert.
- Profilaktivierung ohne aktiven Service bzw. Deaktivierung des letzten aktiven Services eines öffentlichen Profils wird mit Korrekturhinweis abgelehnt.
- Fehlgeschlagener Login oder Reset antwortet ohne Offenlegung der Kontoexistenz. Logout beendet die Sitzung; Deaktivierung/Rollenentzug wirken spätestens beim nächsten privaten Request.
- Admin-Verwaltung schützt den letzten aktiven Administrator vor Deaktivierung/Rollenentzug. Ungültige Systemparameter speichern nichts; Änderungen betreffen künftige Berechnungen, keine stillen Terminänderungen.

Für jeden Use Case sind Baustein und geplanter Abnahmenachweis in der [Matrix](../TRACEABILITY.md) aufgeführt. Diese Szenarien sind vor Implementierung nicht ausgeführte Tests.

<a id="uc-21"></a>
## UC-21 — Internes Termindetail öffnen

**Vorbedingung:** Aktiver ADVISOR als tatsächlicher Teilnehmer oder ADMIN.

**Ablauf:** Termin-ID anfordern; Server prüft Eigentum und liefert Kundenname, Telefon, E-Mail, Gäste, Service, Teilnehmer, Wünsche, Modus, Ort/URL und Status.

**Alternativen:** Fremde/ungültige ID liefert keine Daten; personenbezogene Felder nach Retention leer markieren.

**Nachbedingung:** Nur erlaubter Detailzugriff; keine Mutation.

<a id="uc-22"></a>
## UC-22 — Erlaubte Termininformationen bearbeiten

**Vorbedingung:** Berechtigter interner Nutzer; CONFIRMED und now < end; erwartete Version.

**Ablauf:** Erlaubte Namens-/Telefon-/Adress-/Wunsch- und Meetingfelder ändern. Service, Kunde-E-Mail, Dauer und Beratermenge bleiben fest. Alle Teilnehmerverfügbarkeiten, Feld-Allowlist und Modus werden erneut geprüft.

**Alternativen:** Konflikt/verbotenes Feld: unveränderte Daten und keine Nachricht.

**Nachbedingung:** Version +1, Sequenz nur bei Kalenderwirkung, Audit und Empfängerprojektion nach N2.

<a id="uc-23"></a>
## UC-23 — Gästeliste verwalten

**Vorbedingung:** Berechtigter interner Nutzer; CONFIRMED vor Ende.

**Ablauf:** Höchstens zehn eindeutige externe Adressen; Kundene-Mail und Berateradressen ausgeschlossen. Delta hinzufügen/beibehalten/entfernen berechnen und atomar speichern.

**Alternativen:** Ungültige Adresse, Konflikt oder fehlendes Recht: nichts speichern.

**Nachbedingung:** Neue Gäste erhalten REQUEST/Art14, verbleibende Beteiligte aktualisierten REQUEST, entfernte nur ihren CANCEL mit altem sicheren Snapshot. Nur +1 Sequenz, keine Absage an verbleibende Teilnehmer.

<a id="uc-24"></a>
## UC-24 — Bestätigung manuell erneut senden

**Vorbedingung:** Berechtigter interner Nutzer; CONFIRMED vor Ende.

**Ablauf:** Nichtleere Teilmenge aktueller Empfänger wählen, Standard Kunde; höchstens drei Befehle in zehn Minuten. Befehl-ID verhindert Doppelausführung. Bei Kunde Managementtoken rotieren.

**Alternativen:** Freie fremde Adresse abweisen; Mailfehler bleibt retryfähig, Termin unverändert.

**Nachbedingung:** Neues Versandereignis mit Audit; gleiche UID/calendarSequence, kein weiterer Reminder, kein Token an Gäste/Berater.

<a id="uc-25"></a>
## UC-25 — Terminergebnis erfassen

**Vorbedingung:** Berechtigter interner Nutzer, CONFIRMED und now >= end.

**Ablauf:** COMPLETED oder NO_SHOW setzen; vorhandene Reservationen atomar entfernen.

**Alternativen:** Vor Ende oder anderer terminaler Status: abweisen. Identische Wiederholung bleibt No-op.

**Nachbedingung:** Version/Audit aktualisiert; keine E-Mail, keine Sequenzänderung.
