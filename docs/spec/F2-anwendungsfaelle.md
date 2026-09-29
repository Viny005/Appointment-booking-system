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

<a id="uc-01"></a>
## UC-01 — Beraterprofil auswählen

**Vorbedingung:** Öffentliche Seite ist erreichbar.\
**Hauptablauf:** System zeigt nur aktive Profile, die mindestens einen aktiven Service besitzen. Kunde wählt ein Profil.\
**Nachbedingung:** Primärberater ist im Buchungsentwurf gesetzt.

<a id="uc-02"></a>
## UC-02 — Service auswählen

**Vorbedingung:** UC-01 abgeschlossen.\
**Hauptablauf:** System zeigt ausschließlich aktive Services des gewählten Profils mit Name, Beschreibung, Dauer und Meetingmodus. Kunde wählt einen Service.\
**Nachbedingung:** Service und Servicedauer sind gesetzt.

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
**Nachbedingung:** Terminstatus `CONFIRMED`, Kalender-UID erzeugt, Verwaltungslink erzeugt, Benachrichtigungen geplant.

<a id="uc-07"></a>
## UC-07 — Kalenderdatei hinzufügen

Nach Bestätigung bietet das System eine `.ics`-Datei an. Dieselbe Terminidentität wird in E-Mails verwendet. Änderungen erhöhen die Kalendersequenz; Stornierungen verwenden dieselbe UID als Cancel-Update.

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

Berater darf eigene Termine verwalten; Admin alle. Änderungen erzeugen Audit-Einträge und passende Benachrichtigungen.

<a id="uc-15"></a>
## UC-15 — Profile verwalten

Admin legt Profile mit Name, Foto, Rolle/Titel, Kurzbeschreibung, E-Mail und Aktivstatus an oder ändert sie. Deaktivierung löscht keine Termin-Historie.

<a id="uc-16"></a>
## UC-16 — Services verwalten

Admin erstellt, ändert, aktiviert/deaktiviert Services pro Profil. Ein öffentlich aktives Profil muss mindestens einen aktiven Service behalten. Eine spätere Berechtigung `canManageOwnServices` kann pro Berater aktiviert werden.

<a id="uc-17"></a>
## UC-17 — Beziehungen zwischen Profilen verwalten

Admin definiert z. B. Merveil → Fabrice mit Eigenschaften `angeboten`, `standardmäßig ausgewählt`, `vom Kunden entfernbar`, `aktiv`.

<a id="uc-18"></a>
## UC-18 — Benutzer/Rollen/Berechtigungen verwalten

Admin verwaltet interne Konten und Rollen `ADMIN`, `ADVISOR`. Erweiterbare Berechtigungen erlauben spätere Delegation ohne Rollenumbau.

<a id="uc-19"></a>
## UC-19 — Systemparameter verwalten

Admin verwaltet u. a. Mindestvorlauf, Buchungshorizont, Slot-Schrittweite, Erinnerungszeitpunkt und Aufbewahrungs-/Anonymisierungsfristen.

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
