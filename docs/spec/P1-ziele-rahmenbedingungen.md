# P1 — Ziele und Rahmenbedingungen

## P1.1 Mission

Das Appointment Booking System stellt eine zentrale, leicht bedienbare Weboberfläche bereit, über die Kundinnen und Kunden ohne eigenes Konto Termine mit einem oder mehreren Beratern buchen können. Die tatsächlichen Buchungsmöglichkeiten ergeben sich aus den persönlichen Verfügbarkeiten der beteiligten Berater, bereits vorhandenen Terminen, Ausnahmen und den Regeln des gewählten Services.

## P1.2 Geschäftsziele

| ID | Ziel |
|---|---|
| <a id="g-01"></a>G-01 | Terminbuchungen sollen ohne manuelle Abstimmung per Telefon oder Chat möglich sein. |
| <a id="g-02"></a>G-02 | Kundinnen und Kunden sollen ausschließlich tatsächlich buchbare Tage und Uhrzeiten sehen. |
| <a id="g-03"></a>G-03 | Mehrpersonen-Termine sollen automatisch auf die gemeinsamen Verfügbarkeiten aller tatsächlichen Teilnehmer beschränkt werden. |
| <a id="g-04"></a>G-04 | Jeder Berater soll einen eigenen Kalender und eigene wiederkehrende Verfügbarkeiten besitzen. |
| <a id="g-05"></a>G-05 | Administratoren sollen Profile, Services, Beziehungen und Berechtigungen ohne Codeänderung verwalten können. |
| <a id="g-06"></a>G-06 | Nach einer Buchung sollen Teilnehmer klare Bestätigungen und eine standardisierte Kalenderdatei erhalten. |
| <a id="g-07"></a>G-07 | Das System soll datenschutzorientiert, sicher und für den Betrieb in Deutschland geeignet aufgebaut werden. |

## P1.3 Rollen und Stakeholder

| Rolle | Beschreibung |
|---|---|
| **Kunde** | Öffentlicher Besucher. Benötigt kein Konto. Bucht und verwaltet ausschließlich den eigenen Termin über einen sicheren Link. |
| **Berater** | Authentifizierter interner Nutzer. Sieht eigene Termine und pflegt eigene Verfügbarkeiten. |
| **Administrator** | Authentifizierter interner Nutzer mit globalen Rechten. Verwaltet Profile, Services, Beziehungen, Rollen, Berechtigungen und Einstellungen. |
| **Gast** | Zusätzliche E-Mail-Adresse, die ein Kunde optional zu einem konkreten Termin einlädt. Kein Benutzerkonto. |
| **E-Mail-Dienst** | Versendet Bestätigungen, Änderungen, Absagen und Erinnerungen. |
| **Hosting-/Datenbankanbieter** | Technische Betriebsumgebung. |
| **Microsoft Teams** | Zukünftiger optionaler Meeting-Provider; nicht für V1 erforderlich. |

## P1.4 Scope

### In Scope

- Öffentliche Anzeige aktiver Beraterprofile.
- Profilfoto, Name, Rolle und Kurzbeschreibung.
- Eigene Services pro Profil; mindestens ein aktiver Service pro öffentlich buchbarem Profil.
- Mehrseitiger Buchungsprozess.
- Wiederkehrende Wochenverfügbarkeit mit mehreren Zeitfenstern pro Tag.
- Konkrete Ausnahmen, geänderte Tageszeiten und Blockierungen.
- Mehrpersonen-Termine mit Schnittmenge der Verfügbarkeiten.
- Konfigurierbare Profilbeziehungen, z. B. „Merveil + Fabrice“.
- Standardmäßig vorausgewählter zusätzlicher Teilnehmer, der vom Kunden entfernt werden kann, sofern die Beziehung dies erlaubt.
- Buchungsfenster: frühestens 24 Stunden vor Beginn, höchstens 3 Monate im Voraus.
- Keine Pause zwischen aufeinanderfolgenden Terminen.
- Kundendaten und optionale Gäste.
- Bestätigung, Änderung und Stornierung ohne Kundenkonto über sicheren Link.
- E-Mail-Benachrichtigungen ausschließlich an tatsächlich beteiligte Personen und Gäste.
- `.ics`-Kalenderdateien für Bestätigung, Änderung und Stornierung.
- Interne Anmeldung für Administratoren und Berater.
- Sitzungs- und Rollenprüfung auf jeder privaten Route.
- Termin- und Verfügbarkeitsverwaltung.
- Historie mit späterer Anonymisierung personenbezogener Daten.
- Impressum und Datenschutzerklärung.

### Out of Scope

| ID | Nicht-Ziel |
|---|---|
| <a id="ng-01"></a>NG-01 | Shop, Produktkatalog, Warenkorb oder Bestellprozess. |
| <a id="ng-02"></a>NG-02 | Online-Zahlungen oder Zahlungsabwicklung. |
| <a id="ng-03"></a>NG-03 | Kundenkonten oder Kundenlogin. |
| <a id="ng-04"></a>NG-04 | CRM für Kundenhistorie oder Vertriebsmanagement. |
| <a id="ng-05"></a>NG-05 | Automatische Microsoft-Teams-Erstellung in V1. |
| <a id="ng-06"></a>NG-06 | Native iOS-/Android-App. |
| <a id="ng-07"></a>NG-07 | Vollständige Synchronisation mit privaten Outlook-/Google-Kalendern in V1. |
| <a id="ng-08"></a>NG-08 | Marketing-Newsletter, Werbetracking oder Profiling. |

## P1.5 Erfolgskennzahlen

| ID | Kriterium |
|---|---|
| <a id="sc-01"></a>SC-01 | Ein Kunde kann einen Termin vollständig ohne Benutzerkonto buchen. |
| <a id="sc-02"></a>SC-02 | Ein Tag ist öffentlich nur auswählbar, wenn mindestens ein gültiger Startzeitpunkt existiert. |
| <a id="sc-03"></a>SC-03 | Bei mehreren Beratern werden nur gemeinsame Zeiträume angeboten. |
| <a id="sc-04"></a>SC-04 | Eine erfolgreiche Buchung kann nicht zu einer Doppelbelegung eines Beraters führen. |
| <a id="sc-05"></a>SC-05 | Nach Bestätigung erhält jeder tatsächliche Teilnehmer und jeder eingeladene Gast die vorgesehenen Informationen und eine Kalenderdatei. |
| <a id="sc-06"></a>SC-06 | Nicht beteiligte Personen erhalten keine E-Mail zum Termin. |
| <a id="sc-07"></a>SC-07 | Eine Änderung oder Stornierung aktualisiert den fachlichen Terminstatus und das Kalenderartefakt konsistent. |
| <a id="sc-08"></a>SC-08 | Jede private Route verweigert unauthentifizierten Zugriff und leitet zur Anmeldung um. |

## P1.6 Grundannahmen

- Standardzeitzone ist `Europe/Berlin`.
- Die öffentliche V1-Oberfläche ist primär deutschsprachig.
- Profile und Services sind dynamische Daten und nicht im Frontend fest codiert.
- Fabrice ist ein initialer Test-/Hauptberater, aber technisch kein Sonderfall.
- Die Architektur muss beliebig viele weitere Berater und Beziehungen unterstützen.
