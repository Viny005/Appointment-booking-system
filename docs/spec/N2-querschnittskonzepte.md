# N2 — Querschnittskonzepte

## N2.1 Zeit und Zeitzonen

Wochenregeln und lokale Kalendertage verwenden `SystemSettings.timeZone = Europe/Berlin`; andere Zonen sind in V1 nicht auswählbar. Termine speichern UTC-Instants. Zeitabstände wie 24 Stunden und Servicedauern sind verstrichene Zeit. Der Drei-Monats-Horizont ist eine lokale Kalenderrechnung. Nichtexistierende Frühjahrszeiten liefern keine Slots; beide Herbstvorkommen erhalten unterschiedliche UTC-Offsets in Auswahl und Bestätigung, siehe [D2](D2-datentypen.md).

## N2.2 Verfügbarkeitsauflösung

Effektive Verfügbarkeit = Wochenmuster + Tages-/Zeitraumausnahmen − Blockierungen − bestätigte Belegungen. Für mehrere Berater wird die Schnittmenge gebildet. Erst danach entstehen Startslots aus Servicedauer und Slot-Schritt. Eine angezeigte Verfügbarkeit reserviert nichts.

## N2.3 Keine stillen Datenkorrekturen

Bei überschneidenden Verfügbarkeitsfenstern wird nicht automatisch gespeichert. Nutzer erhalten einen Fusionsvorschlag und bestätigen aktiv. Eine veraltete Terminversion wird als Konflikt abgelehnt und niemals still überschrieben.

## N2.4 Benachrichtigungsprinzip

Nur Kunde, tatsächliche Berater und explizite Gäste sind Empfänger. Eine Profilbeziehung oder ADMIN-Rolle allein erzeugt keine Nachricht. Entfernte Gäste erhalten ausschließlich eine einmalige Absage ihrer vorherigen Einladung; danach sind sie keine Empfänger mehr. Gleiche Empfängeradressen werden dedupliziert. Gäste dürfen nicht dieselbe Adresse wie Kunde oder tatsächliche Berater haben.

## N2.5 Historische Snapshots

Service, Beraterdarstellung und konkrete Meetingdaten werden bei Buchung als Snapshot gesichert. Änderungen der Katalogdaten und die Deaktivierung von Konto/Profil/Service ändern bestehende Termine nicht. Bewusste Terminbearbeitung ändert nur die erlaubten Snapshotfelder. Historische Termine speichern keine Profilfoto-Dateireferenz, sodass ein ersetztes Foto gelöscht werden kann.

## N2.6 Fehlerbehandlung

- Buchungs-/Änderungsfehler: keine teilweise Persistenz, kein Audit über eine vermeintlich erfolgreiche Änderung, keine Benachrichtigung.
- E-Mail-Fehler: Termin bleibt bestehen; Auftrag wird nachvollziehbar wiederholt. `SENT` bedeutet Providerannahme, keine garantierte Zustellung.
- Derselbe Mutationsschlüssel darf keine zweite fachliche Änderung oder einen zweiten Versandauftrag erzeugen.
- Künftige automatische Meeting-Provider liegen außerhalb V1; ein konfigurierter manueller Link ist für V1 ausreichend.

## N2.7 Berechtigungen

`ADMIN` darf alle Termine verwalten. `ADVISOR` benötigt ein aktives Konto und muss über sein eigenes zugeordnetes Profil tatsächlich in `AppointmentParticipant` enthalten sein. Eine Profilbeziehung, die Rolle eines anderen Kontos oder eine erratene ID genügt nie. Ein zusätzlich teilnehmender Berater hat dieselben Terminbearbeitungsrechte wie der Primärberater. Ein deaktiviertes Profil entzieht seinem weiterhin aktiven Konto nicht die Bearbeitung bestehender eigener Termine.

Der Server prüft Sitzung, Konto, Rolle und aktuelle Teilnahme vor jedem Lesen, Download, Bearbeiten und Versand. Aufeinanderfolgende Requests verwenden keine veraltete Rechteentscheidung. Kundenfähigkeiten erlauben nur ihren konkreten Termin sowie Zeit-/Modusänderung und Absage nach der Kundenfrist. Gäste erhalten keine Verwaltungsfähigkeit. Eigene Serviceverwaltung ist nur bei ausdrücklichem `canManageOwnServices` erlaubt; Profilaktivierung, Foto-Upload und Kontozuordnung bleiben ADMIN vorbehalten.

## N2.8 Datenaufbewahrung

Kunden-/Gäste-PII, Wünsche, Verwaltungsfähigkeit und personenbezogene Versandkopien werden nach [D2](D2-datentypen.md) gelöscht/anonymisiert. Fachliche Historie und notwendige interne Beraterreferenzen können bleiben. Aufbewahrung gilt auch für technische Nebenbestände und überholte Aufträge. Betrieb und Rechtsprüfung: [Deutschland-Checkliste](../LEGAL-COMPLIANCE-DE.md).

## N2.9 Rechtliche Information und notwendige Speicherung

Impressum und Datenschutz sind auf jeder öffentlichen Seite leicht erkennbar, unmittelbar erreichbar und dauerhaft verfügbar. Im Kundendatenformular steht die Information nach Art. 13 DSGVO beim Erheben; sie ist keine künstliche Pflicht-Einwilligung. Gäste erhalten beim ersten Kontakt die Art.-14-Information einschließlich tatsächlicher Datenquelle: buchende Person oder erfassender interner Nutzer. Zwecke und Grenzen der einzelnen Felder stehen in [D2](D2-datentypen.md).

V1 verwendet ausschließlich notwendige interne Session-, Entwurfs- und Sicherheits-/CSRF-Speicherung. Keine Tracking-/Marketing-Cookies oder Analytics. Ohne nicht notwendige Speicherung gibt es kein voreingestelltes Cookiebanner. Zusätzliche Speicherung verlangt vor Aktivierung eine erneute Prüfung und erforderlichenfalls Einwilligungsmanagement. Verantwortlicher, Rechtsgrundlagen, Auftragsverarbeiter und gesetzliche Anwendbarkeit werden vor Produktion gemäß [Checkliste](../LEGAL-COMPLIANCE-DE.md) dokumentiert.

## N2.10 Eindeutige Rechenregeln

Pro Profil und lokalem Datum: Wochenintervalle lesen; bei `REPLACE_DAY` vollständig ersetzen; `ADD_INTERVAL` ergänzen; abschließend `BLOCK_DAY` anwenden (höchste Priorität). Mehrtägige Sperren umfassen beide Datumsgrenzen. Höchstens ein Ersatzsatz pro Tag; widersprüchliche Ersatzsätze werden abgelehnt. Überlappende Ergänzungen müssen beim Bearbeiten ausdrücklich zusammengeführt werden.

Resultierende Intervalle schneiden und bestätigte Belegungen aller Teilnehmer abziehen. Startzeiten liegen auf dem Raster ab lokaler Mitternacht, initial 30 Minuten. Nur vollständig freie Dauerintervalle anbieten. „Jetzt“ wird je Berechnung einmal erfasst; finale Mutation erfasst es erneut nach Sperrerwerb. Die eigene alte Belegung wird bei Umbuchung ignoriert, fremde Belegungen niemals.

Alle Ressourcen erhaltenden Terminänderungen prüfen unter denselben sortierten Profilsperren die Verfügbarkeit sämtlicher tatsächlicher Berater und die erwartete Terminversion. Auch Metadaten-/Gästeänderungen dürfen einen erkannten Verfügbarkeitskonflikt nicht unbemerkt übernehmen; sie werden mit Konflikthinweis abgelehnt. Zeitänderung löst den Konflikt durch einen verfügbaren Zielslot. Absage und Abschluss prüfen Status, Version und vorhandene Belegungen unter Sperre, benötigen aber keinen freien Zielslot; eine zwischenzeitliche Verfügbarkeitssperre darf diese Auflösung nicht verhindern. Manuelles Resenden verändert keine Belegung.

<a id="n211-aenderungen-und-empfaenger"></a>
## N2.11 Änderungen, Empfänger und Kalendersequenz

V1 hält Service, Primärprofil, tatsächliche Beratermenge, Dauer und Kunden-E-Mail eines bestätigten Termins fest. Änderung der buchenden Identität oder des Termintyps erfordert Absage und Neubuchung. Es gibt keinen impliziten Austausch interner Teilnehmer durch Relationsänderung.

Intern veränderbar sind Datum/Startzeit (Ende aus unveränderter Dauer), Kundenname, Telefon, optionale Adresse, Wünsche, erlaubter konkreter Modus, gültige terminspezifische Meetinginformationen sowie Gäste. Kunden dürfen nur Datum/Startzeit und erlaubten Modus ändern; Gäste verwalten nach Bestätigung ausschließlich berechtigte interne Nutzer. Moduswechsel verwendet aktuelle erlaubte Serviceoptionen; bei unverändertem Modus bleibt der bestehende Snapshot gültig.

Kalenderprojektionen enthalten Servicebezeichnung, Zeitpunkt und empfängerbezogene Meetinginformationen. Sie enthalten keine Kundenadresse, freien Wünsche, vollständige Gästeliste, fremden Kontaktdaten oder Verwaltungstokens. Insbesondere erhalten Gäste keine Kundentelefonnummer: bei einem Berateranruf sehen sie nur die vereinbarte Anrufrichtung. Kunden-/Berater-E-Mails können ihre jeweils benötigten Kontaktinformationen enthalten; Gäste erhalten nur die minimalen Einladungsdaten. BCC-Verteiler ersetzen nicht die getrennten Projektionen.

| Ereignis | Empfänger und Nachricht | Kalendersequenz / Auditaktion |
|---|---|---|
| Neuanlage | Kunde, tatsächliche Berater, Gäste: Bestätigung mit empfängerbezogener `REQUEST`-ICS; Kundenfähigkeit nur an Kunde. | Startwert 0; `APPOINTMENT_CREATED`. |
| Datum/Start, konkreter Modus, Ort, Anrufrichtung/-ziel oder Online-URL/Provider ändern | Kunde, tatsächliche Berater, aktuelle Gäste: Änderungsbestätigung mit `REQUEST`. Die Kundenrufnummer bleibt aus jeder ICS ausgeschlossen; deren Änderung allein ist deshalb kein Kalenderupdate, sondern die folgende Metadatenänderung. Gäste sehen keine Kundennummer; eine vereinbarte öffentliche Berater-Zielnummer darf enthalten sein. | Genau +1 pro Mutation; `APPOINTMENT_RESCHEDULED` bei Zeitänderung, sonst `APPOINTMENT_DETAILS_CHANGED`. |
| Nur Name, optionale Kundenadresse, Wünsche oder Kundentelefon ändern | Kunde und tatsächliche Berater: sachliche Änderungsinformation, keine ICS; keine Nachricht an Gäste. Keine vollständigen freien Wünsche in der E-Mail, nur Änderungshinweis und geschützter Detailzugriff. | Unverändert; `APPOINTMENT_DETAILS_CHANGED`. |
| Gäste hinzufügen/entfernen | Kunde und tatsächliche Berater sowie verbleibende Gäste: aktualisierte `REQUEST`; neue Gäste: Bestätigung/`REQUEST` mit Art.-14-Information. Entfernte Gäste: einmalige `CANCEL` mit altem sicherem Meeting-Snapshot. Keine neue URL/Details an entfernte Gäste. | Genau +1 für gesamten Gästeänderungsbefehl; `APPOINTMENT_GUESTS_CHANGED`. Der Termin selbst bleibt `CONFIRMED`. |
| Absage | Kunde, tatsächliche Berater, zum Absagezeitpunkt aktuelle Gäste: `CANCEL`, gleiche UID; alle noch offenen Reminder verwerfen, Kundenfähigkeit widerrufen. | Genau +1; `APPOINTMENT_CANCELLED`. |
| Bestätigung manuell erneut senden | Explizit gewählte nichtleere Teilmenge aus Kunde, tatsächlichen Beratern und aktuellen Gästen; Standardauswahl Kunde. Keine frei eingegebenen Empfänger. Aktuelle sichere Bestätigung/`REQUEST`, kein neuer Reminder. | UID und Sequenz unverändert; `CONFIRMATION_RESENT` mit Ereignis-/Befehls-ID und Empfängeranzahl. |
| `COMPLETED` oder `NO_SHOW` nach Ende setzen | Keine E-Mail und keine neue ICS; interner Ergebnisstatus. | Sequenz unverändert; `APPOINTMENT_COMPLETED` oder `APPOINTMENT_NO_SHOW`. |

Jede fachliche Bearbeitung erhöht die optimistische `version` einmal; mehrere kalenderwirksame Feldänderungen in demselben Befehl erhöhen `calendarSequence` ebenfalls nur einmal. Identische Wiederholung oder unveränderter Inhalt ist ein No-op ohne zusätzliche Nachricht/Sequenz. Versandaufträge sind je fachlichem Ereignis und Empfänger eindeutig; die Kalendersequenz allein genügt nicht als Schlüssel für Metadatenänderungen oder Resenden.

Termin-/Belegungsänderung, minimale Auditereignisse und Outbox werden gemeinsam atomar persistiert. Audit enthält Akteur, Ressource, Ergebnis, Zeit, Version, geänderte Feldnamen und Empfängerkategorien/-anzahl; keine alten/neuen Kontaktwerte, Freitexte oder Tokens. Abgelehnte Rechteprüfungen erzeugen ein bereinigtes Sicherheitsereignis, keinen fachlichen Erfolgseintrag.

Bei manuellem Resenden an den Kunden wird die Kundenfähigkeit atomar rotiert; der alte Link und ältere noch offene Fähigkeitspayloads werden ungültig. Neuer Rohwert ausschließlich in kurzlebig verschlüsselter Kunden-Outbox (höchstens 24 Stunden, nach Versand löschen). Andere Empfänger bekommen niemals diesen Link. Derselbe Resend-Befehl ist idempotent; bewusster erneuter Versand braucht einen neuen Befehl. Höchstens drei Resend-Befehle pro Termin innerhalb zehn Minuten. Vor Ausführung und Versand gelten aktueller Status und Empfängerberechtigung; veraltete Bestätigungen an inzwischen entfernte Gäste werden verworfen. Ein Versandauftrag an ehemalige Gäste ist ausschließlich für die explizite Entfernungsabsage zulässig.

## N2.12 Erinnerungsgrenze

Standard ist `reminderAt = start - 24h`. Nach atomarer Anlage oder Umbuchung wird ein neuer Reminder nur geplant, wenn `reminderAt > now`. Bei Gleichheit oder Vergangenheit reicht die Bestätigung/Änderungsbestätigung; es gibt keinen sofortigen zweiten E-Mail-Auftrag. Eine neue Buchung bei `start = now + 24h` bleibt zulässig, Kundenänderung/-storno bei genau 24 Stunden bleibt gesperrt.

Umbuchung verwirft die alten Reminder und wertet die Grenze für den neuen Start erneut aus. Reine Detail-/Gästeänderungen und Resenden erzeugen keinen Ersatz-Reminder; ein bereits geplanter, noch fälliger Auftrag verwendet beim Versand die aktuelle berechtigte Empfängermenge und Projektion. Für neu hinzugefügte Gäste wird nur vor `reminderAt` ein Auftrag angelegt; nach Erreichen genügt ihre Einladung. Bereits versandte Reminder werden durch Metadatenänderung nicht erneut gesendet. Absage, Entfernung des Empfängers oder Terminbeginn verhindert Versand. Nach einem Worker-Ausfall darf ein ursprünglich rechtzeitig geplanter Reminder zwischen Fälligkeit und Beginn nachgeholt werden; das ist keine bei Anlage/Änderung übersprungene Soforterinnerung.
