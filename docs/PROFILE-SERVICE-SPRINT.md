# Profil-/Service-Domain-Sprint

Basis: Merge `026ec00f8add59a2693ae1298cffb6df1086534b`, Branch `feat/profile-service-domain`. Fachliche Quellen unverändert: [D1](spec/D1-datenmodell.md), [D2](spec/D2-datentypen.md), [F2](spec/F2-anwendungsfaelle.md), [F3](spec/F3-anwendungsfunktionen.md), [N2](spec/N2-querschnittskonzepte.md), [A05](arch/A05-building-block-view.md) und [A08](arch/A08-cross-cutting-concepts.md).

## Modelle und Grenzen

Neue Prisma-Modelle AdvisorProfile, Service und ProfileRelation; Enums ProfileStatus, MeetingMode, MeetingModePolicy und PhoneDirection. Optionale User-Zuordnung über nullable unique userId am Profil; keine Kontoanlage beim Erstellen eines Profils. User.canManageOwnServices ist standardmäßig false und erlaubt ausschließlich die ausdrücklich delegierte Verwaltung eigener Services. Eine Beziehung gewährt keine Rechte.

Neue Migration `20260930090000_profile_service_domain` auf der unveränderten Identity-Migration. Modelle enthalten createdAt/updatedAt und optimistische version für Bearbeitungskonflikte. Beziehungen sind gerichtet; die Identität eines Source/Target-Paars bleibt beim Bearbeiten erhalten. Flag-Änderung und Deaktivierung erfolgen am bestehenden Datensatz; kein automatisches Gegenstück und keine Hard-Delete-Use-Cases.

## Domainregeln

Neue Profile sind DRAFT und ohne Konto/Service möglich. Veröffentlichung/Reaktivierung erfordert Name, Titel, Kurzbeschreibung, gültige Benachrichtigungs-E-Mail, sicheren imageKey und mindestens einen aktiven vollständig gültigen Service. ACTIVE kann nur INACTIVE werden, nicht erneut DRAFT. Ein noch nie veröffentlichtes DRAFT wird nicht durch Deaktivierung künstlich INACTIVE. Konto-Deaktivierung verändert den Profilstatus nicht.

imageKey ist ein opaque Key (Buchstaben/Ziffern/Unterstrich/Bindestrich, optional jpg/jpeg/png/webp-Endung), keine URL oder Pfadangabe. Noch kein Upload, Storagezugriff oder Nachweis eines real geprüften Bildes. Der Auftrag erlaubt in diesem Sprint ausdrücklich die reine Referenz; eine spätere Medienintegration muss vor Veröffentlichung die tatsächliche Bildprüfung sicherstellen.

Service: ganzzahlige Dauer 1–480, nichtleere duplikatfreie konkrete Modi, FIXED genau ein Modus, CLIENT_CHOICE ein oder mehrere. Aktive Services benötigen vollständige Konfiguration für jeden angebotenen Modus: Ort/Adresse zusammen höchstens 1000 Zeichen; bei Anruf durch Kunden Beraternummer bis 32 Zeichen; ONLINE absolute HTTPS-URL bis 2048 Zeichen ohne Zugangsdaten und Provider bis 100 Zeichen. Standard ist ADVISOR_CALLS_CLIENT. Inaktive Services können unvollständige modusspezifische Details enthalten, müssen aber Dauer und Modusstruktur bereits erfüllen. Bei Aktivierung wird vollständig geprüft. Kein Fetch von Online-URLs.

`resolveMeetingMode` liefert den ausdrücklich gewählten erlaubten konkreten Modus mit passenden Daten. CLIENT_CHOICE wird nie als konkrete Terminform akzeptiert. Es entstehen keine Termine, Kalenderartefakte oder Kundendaten.

Letzten aktiven Service eines ACTIVE Profils nicht deaktivieren oder durch ungültige Daten ersetzen. Zuerst Profil ausdrücklich deaktivieren. Änderungen an veröffentlichten Profilen dürfen Pflichtdaten nicht entfernen. Unbekannte zusätzliche Eingabefelder werden nicht auf Persistenzobjekte übertragen.

## Application und öffentliche Projektionen

PublicCatalog implementiert ListBookableProfiles, ListProfileServices und ResolveParticipantOptions. Öffentliche Profildaten enthalten keine Konto-ID oder interne Benachrichtigungs-E-Mail. Serviceprojektionen enthalten Name/Beschreibung/Dauer und Modusauswahl, keine privaten Online-URLs oder Konfigurationsdetails.

Teilnehmerauflösung liest nur direkte aktive Beziehungen. Optionale inaktive Ziele und nicht vorgeschlagene optionale Beziehungen werden nicht angeboten. Pflichtteilnehmer sind immer vorausgewählt und nicht entfernbar. Ein inaktives/unvollständiges Pflichtziel liefert REQUIRED_PARTICIPANT_UNAVAILABLE, auch bei proposedToClient=false. Aktive nicht vorgeschlagene Pflichtziele stehen separat in requiredParticipants; options enthält nur vorgeschlagene Ziele. So steuert proposedToClient die Auswahl, ohne Pflichtteilnehmer still zu entfernen. Keine Rekursion, Verfügbarkeitsprüfung oder automatische Berechtigung.

CatalogCommands implementiert Profilanlage/-änderung, Aktivierung/Deaktivierung, Serviceanlage/-änderung/-aktivierung/-deaktivierung, Relationsanlage/-änderung/-deaktivierung und optionale Konto-Zuordnung/-Lösung. Statusänderungen verwenden setProfileStatus/setServiceActive, Relationsdeaktivierung updateRelation mit active=false. Alle Mutationen prüfen aktiven Akteur und Rolle aus der Datenbank; ADMIN verwaltet alles, ADVISOR nur ausdrücklich delegierte eigene Services. Actor-ID stammt beim späteren Webaufruf aus dem bestehenden Session-Guard, niemals aus einem Browser-Rollenfeld.

Repository-Ports und strukturierte Result-Fehler liegen im Application-/Domain-Layer. Keine Next-/React-/Prisma-/Better-Auth-Imports dort. Prisma und SQL verbleiben im Adapter. Kein neuer HTTP-Endpunkt oder UI; eine server-only Kompositionsstelle verbindet die Use Cases mit dem Session-Guard. Domainfehler enthalten verständliche Codes/Meldungen; rohe DB-Fehler/Constraint-Namen werden nicht an Aufrufer zurückgegeben.

## Konkurrenz und Datenbankschutz

Jede Mutation verwendet eine PostgreSQL-Transaktion. Zuerst betroffene Userzeilen, anschließend Profilzeilen, jeweils sortiert und mit FOR UPDATE. Profil-/Serviceänderungen teilen dieselbe Profilsperre, Relationsänderungen sperren Source und Target. Nach Sperrerwerb werden Akteur, Profil und Services neu gelesen; keine alleinige Prüfung vor der Transaktion. Erwartete Version schützt gegen veraltete Bearbeitung desselben Datensatzes. Öffentliche zusammengesetzte Reads nutzen Repeatable Read.

DB-Constraints: unique userId, unique Source/Target, Self-Relation-Verbot, Pflichtteilnehmer => Defaultauswahl, Dauer 1–480, Modusarray NOT NULL/eindimensional/nichtleer/ohne NULLs oder Duplikate, FIXED => genau ein Modus, sichere Bildreferenz. PostgreSQL-Enums schließen CLIENT_CHOICE als konkreten Modus aus. Foreign Keys mit RESTRICT verhindern das Entfernen referenzierter Eltern.

Übergreifende Aktivierungs-/Letzter-Service-Regeln werden nach gemeinsamen Zeilensperren durch Application/Domain geprüft; dafür gibt es keinen zusätzlichen DB-Trigger. Direkte administrative SQL-Schreibzugriffe müssen diese Regeln beachten und sind kein unterstützter Application-Zugangsweg. Der Unique-Index bleibt auch unabhängig vom Adapter die letzte Sicherung gegen doppelte Konto-Zuordnung. Kein In-Memory-Lock und kein alleiniger Vorab-SELECT.

## Tests und Ausführung

Unit-Tests prüfen Lifecycle, Publikationspflichtfelder, Bildreferenzen, Servicegrenzen, alle Meetingvarianten, Relationsregeln, direkte öffentliche Auswahl, Pflichtziele und Datenminimierung. Echte PostgreSQL-Tests prüfen sämtliche Mindest-DB-Constraints auch unter Umgehung der Domain, Application-Fehler/RBAC, Persistenz und parallele Deaktivierungen/Aktivierungen/Zuordnungen.

CI: frische DB mit beiden Migrationen; separate Upgrade-DB mit ausschließlich der ursprünglichen Identity-Migration und synthetischer Identität, danach neue Migration und Identitätserhalt; erneutes migrate deploy; unveränderter sicherer Development-Seed zweimal. Unit- und Integrationstestläufe sind jetzt getrennt, sodass die Integrationszahl keine erneut gezählten Unit-Tests enthält. Lokaler Docker-Daemon nicht verfügbar; DB-Nachweise werden auf dem GitHub-Runner mit PostgreSQL 17.11 erbracht und in der PR dokumentiert.

Kommandos: npm ci, npm run prisma:generate, npm run prisma:validate, npm run lint, npm run typecheck, npm test, npm run test:integration, npm run build, npm audit, python tools/check_docs.py, git diff --check. Lokale Einrichtung und Test-DB: [README](../README.md).

## Nicht implementiert

Keine WeeklyAvailability, AvailabilityException, Slots, Appointment, Booking Draft, Kunden-/Gastdaten, E-Mail, Outbox, ICS, Reminder, Kalender, Teams, Admin-Oberfläche, öffentlicher Wizard oder E-Commerce. Bildvalidierung/MediaStorage und Kontoverwaltungs-UI folgen später. Kein neues fachliches Seed-Profil und keine echten Personen; Foundation-Seed bleibt unverändert. Keine fachliche Spezifikation zur Vereinfachung des Codes geändert und kein Widerspruch gefunden, der eine Spezifikationsänderung erfordert.
