# Rechtliche Betriebsbaseline für Deutschland

Stand der Dokumentationsprüfung: 29.09.2026. Diese technische und organisatorische Checkliste legt Entwicklungsanforderungen und Nachweise für die Produktionsfreigabe fest. Sie ist keine Rechtsberatung und bestätigt weder die Rechtsform noch die rechtliche Zulässigkeit des späteren Betriebs. Betreiberbezogene Anwendbarkeit, Texte und Rechtsgrundlagen bleiben vor Go-live fachkundig zu prüfen.

`Service` bedeutet ausschließlich Terminart. Die Anwendung organisiert und verwaltet Termine; Verkauf, Zahlung, Warenkorb, Bestellung und sonstige E-Commerce-Funktionen gehören nicht zum Projekt. Gesetzliche Begriffe wie „elektronischer Geschäftsverkehr“ werden hier nur zur Prüfung der Anwendbarkeit verwendet.

Die Entwicklung mit synthetischen Testdaten kann auf dieser Baseline beginnen. Ein offener Platzhalter mit `GO-LIVE-BLOCKER` darf weder als echte Betreiberangabe veröffentlicht noch als Freigabe gewertet werden. Verantwortliche Personen und Nachweise werden im Freigabeprotokoll benannt; sensible Verträge gehören in eine zugriffsgeschützte Betriebsablage. Das Repository enthält nur deren Referenz, Prüfdatum und Ergebnis.

## Impressum — DDG § 5

Die anwendbaren Anbieterinformationen müssen leicht erkennbar, unmittelbar erreichbar und ständig verfügbar sein. Die Seite „Impressum“ ist ohne Login von jeder öffentlichen Seite einschließlich Buchungs- und Verwaltungsseiten erreichbar. Mobile Navigation und Fehleransichten dürfen den Zugang nicht verstecken. Maßstab: [DDG § 5](https://www.gesetze-im-internet.de/ddg/__5.html).

| Feld | Vor Produktion einzutragen oder begründet als nicht anwendbar zu bestätigen |
|---|---|
| Name/Firma und Rechtsform | `GO-LIVE-BLOCKER: BETREIBER_NAME_RECHTSFORM` |
| Niederlassungsanschrift | `GO-LIVE-BLOCKER: BETREIBER_ANSCHRIFT` |
| Vertretungsberechtigte, falls erforderlich | `GO-LIVE-BLOCKER: VERTRETUNG_PRUEFEN` |
| E-Mail und geeignete unmittelbare Kontaktmöglichkeit | `GO-LIVE-BLOCKER: BETREIBER_KONTAKT` |
| Register und Nummer, falls eingetragen | `GO-LIVE-BLOCKER: REGISTER_PRUEFEN` |
| Umsatzsteuer-/Wirtschafts-Identifikationsnummer, soweit vorhanden | `GO-LIVE-BLOCKER: IDENTIFIKATIONSNUMMERN_PRUEFEN` |
| Zuständige Aufsicht bei erlaubnispflichtiger Tätigkeit | `GO-LIVE-BLOCKER: AUFSICHT_PRUEFEN` |
| Reglementierter Beruf: Kammer, Berufsbezeichnung, Verleihungsstaat, zugängliche Berufsregeln | `GO-LIVE-BLOCKER: BERUFSRECHT_PRUEFEN` |

Betreiber/Rechtsverantwortung prüft außerdem besondere Angaben, etwa Liquidation oder veröffentlichte Kapitalangaben, soweit sie tatsächlich einschlägig sind. Nachweis: freigegebener Text und Erreichbarkeitsprüfung im Produktionslayout. Keine Testperson, Repository-Autoradresse oder erfundene Nummer ersetzt diese Angaben.

## Datenschutzinformationen — DSGVO Art. 13 und 14

Art. 13 betrifft die direkte Erhebung beim Kunden; Art. 14 betrifft Daten aus anderer Quelle. Erforderlich sind insbesondere Verantwortlicher und ggf. Datenschutzbeauftragter, Zwecke/Rechtsgrundlagen, Empfänger, Aufbewahrung, Betroffenenrechte, Beschwerdemöglichkeit und ggf. Drittlandtransfers samt Garantien. Art. 14 ergänzt Kategorien und Quelle. Art. 13 verlangt die Information bei Erhebung; Art. 14 grundsätzlich innerhalb eines Monats, bei früherer Kommunikation spätestens dabei, bei früherer Offenlegung spätestens davor. Grundlage: [DSGVO, Art. 13/14](https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX%3A32016R0679).

Für diese Anwendung gelten folgende Abnahmeregeln:

- Im Kundendialog steht der erkennbare Datenschutzhinweis vor der ersten Speicherung personenbezogener Formulardaten, auch bei serverseitigem Draft. Er erklärt Pflicht-/freiwillige Angaben und Folgen einer Nichtbereitstellung. Eine dauerhaft verlinkte vollständige Fassung ergänzt den kurzen Hinweis.
- Keine Pflichtcheckbox „Ich akzeptiere die Datenschutzerklärung“. Information ist keine Einwilligung. Für die Terminabwicklung wird keine künstliche Zustimmung erzeugt. Rechtsgrundlage und ggf. berechtigte Interessen werden pro Verarbeitungszweck durch den Betreiber freigegeben; die Information passt anschließend zu dieser Entscheidung. Falls eine künftige Verarbeitung tatsächlich Einwilligung erfordert, braucht sie einen gesonderten geprüften Ablauf.
- Gästeadressen werden durch die buchende Person bzw. berechtigte interne Nutzer erfasst. Die erste Einladung enthält einen klar bezeichneten Link zur vollständigen Gastinformation sowie den Hinweis auf die Quelle. Für vom Kunden eingetragene Gäste lautet die Quelle „E-Mail-Adresse von der buchenden Person angegeben“; bei interner Erfassung wird die tatsächliche Quelle genannt. Die Quelle darf nicht erfunden werden.
- Die Gastinformation benennt die verarbeiteten Kategorien (Gast-E-Mail, Terminzuordnung), Terminbenachrichtigung als Zweck und die freigegebene Gast-Rechtsgrundlage. Ein Gast erhält keine fremden Kontaktdaten, freien Anmerkungen oder Verwaltungstokens. Erstkontakt und jedes spätere Neuaufnehmen eines Gasts verwenden die Gastvorlage.
- Einladungsaufträge entstehen mit der Buchung/Gastaufnahme. Versandfehler werden überwacht und eskaliert; das Monatsmaximum ist keine zulässige pauschale Wartefrist. Wird vor dem Erstkontakt eine andere Offenlegung geplant, muss Datenschutzverantwortung den Informationszeitpunkt vorher klären.
- Die vollständigen Texte behandeln zusätzlich die jeweils einschlägigen Informationen zu Interessenabwägung, Widerruf einer tatsächlichen Einwilligung, gesetzlicher/vertraglicher Bereitstellungspflicht sowie automatisierten Entscheidungen. Die V1 trifft keine rechtlich erheblichen Profiling-Entscheidungen; die Slotberechnung wird nicht als solche dargestellt.

Freigabe: `GO-LIVE-BLOCKER: VERANTWORTLICHER_DATENSCHUTZKONTAKT`, `GO-LIVE-BLOCKER: DSB_ANWENDBARKEIT_UND_KONTAKT`, `GO-LIVE-BLOCKER: RECHTSGRUNDLAGEN_UND_INFORMATIONSTEXTE`. Nachweis durch Betreiber/Datenschutzverantwortung: freigegebene Kunden-/Gasttexte, Formularansicht vor Erhebung und Test-E-Mail mit funktionierendem Datenschutzlink. Informationen enthalten echte Empfänger-/Transferangaben aus dem freigegebenen Dienstleisterverzeichnis.

## Datenzwecke und Aufbewahrung — DSGVO Art. 5

Rechtmäßigkeit/Transparenz, Zweckbindung, Datenminimierung, Richtigkeit, Speicherbegrenzung und Integrität/Vertraulichkeit bilden die Prüfkriterien; ihre Einhaltung muss nachvollziehbar sein. Grundlage: [DSGVO, Art. 5](https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX%3A32016R0679).

| Daten | Konkreter V1-Zweck und Begrenzung |
|---|---|
| Name und E-Mail | Zuordnung und Bestätigung/Änderung des Termins; keine Kundenkonten oder Marketingnutzung |
| Telefon, weiterhin Pflichtfeld | Durchführung von Telefonterminen sowie kurzfristige organisatorische Rückfragen, etwa bei Ausfall oder Zugangsschwierigkeiten; kein Werbeanruf. Der Betreiber bestätigt vor Produktion die Erforderlichkeit auch bei Präsenz-/Online-Terminen. |
| Kundenadresse, freiwillig | Nur vom Kunden gewünschter Orts-/Anfahrtsbezug zur Vorbereitung des konkreten Termins; ohne solchen Bedarf leer lassen. Nicht für Werbung, Rechnung oder als Ersatz der Service-Terminadresse verwenden. |
| Wünsche/Anmerkungen, freiwillig | Vorbereitung des konkreten Gesprächs; nur berechtigte interne Beteiligte und ADMIN sehen den Inhalt. Hinweis am Feld: „Bitte nur Angaben zum Termin eintragen. Keine unnötig sensiblen Informationen, z. B. Gesundheitsdaten, Passwörter oder Ausweisdaten.“ |
| Gästeadressen | Einladung und erforderliche Terminänderungen; keine öffentliche Gästeliste, keine spätere Kontaktkampagne |
| Audit-/Betriebsdaten | Berechtigungs-, Änderungs- und Betriebsnachweis; keine Tokens, Passwörter, vollständigen E-Mail-Inhalte oder Freitexte in Logs |

Die bestehenden technischen Aufbewahrungswerte 12/6 Monate bleiben konfigurierbare Entwicklungswerte gemäß [Batch/Retention](spec/B2-batch.md) und [Datenmodell](spec/D1-datenmodell.md), keine gesetzlichen Mindest- oder Höchstfristen. `GO-LIVE-BLOCKER: RETENTION_12_6_MONATE_BEGRUENDEN_UND_FREIGEBEN` umfasst Zweck, Fristbeginn, Kategorien, Löschung/Anonymisierung und den Umgang mit Backups. Termine dürfen nach Ablauf keine indirekt personenbeziehbaren Freitexte, Gastadressen oder Nutzlastkopien behalten. Ein Test weist den Retentionslauf einschließlich Outbox/Logs und die erneute Anwendung nach Restore nach. Identifizierbare interne Auditakteure bleiben ebenfalls personenbezogen; bloßes Entfernen des Kundennamens ist keine vollständige Anonymisierung.

## Dienstleister — DSGVO Art. 28

Auftragsverarbeiter sind auf ausreichende Garantien, dokumentierte Weisungen und einen passenden bindenden Vertrag zu prüfen. Unteraufträge, Sicherheit, Unterstützung bei Betroffenenrechten, Löschung/Rückgabe und Kontrollen gehören zur Prüfung. [DSGVO, Art. 28](https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX%3A32016R0679); ergänzende behördliche [Hinweise zur Auftragsverarbeitung](https://www.datenschutz.sachsen.de/auftragsverarbeitung.html).

| Dienstleisterkategorie | Projektbezogener Prüfgegenstand | Produktionsstatus |
|---|---|---|
| Hosting | App, Zugriffslogs, Supportzugriff | `GO-LIVE-BLOCKER: HOSTING_PRUEFUNG_AVV` |
| Gehostetes PostgreSQL | Termin-/Kontodaten, Replikate, Backups | `GO-LIVE-BLOCKER: DATENBANK_PRUEFUNG_AVV` |
| E-Mail | Empfänger, Nachrichtentext, Versand-/Bounce-Daten | `GO-LIVE-BLOCKER: MAIL_PRUEFUNG_AVV` |
| Media/Object Storage | Öffentliche Profilbilder, technische Zugriffe | `GO-LIVE-BLOCKER: MEDIA_PRUEFUNG_AVV` |
| Monitoring, falls personenbezogene Daten verarbeitet werden | Fehler-/Zugriffsereignisse, Supportzugriff | `GO-LIVE-BLOCKER: MONITORING_ROLLE_PRUEFEN` |

Betreiber/Datenschutzverantwortung und Betrieb führen je Anbieter eine Referenz auf Vertrag/AVV, Datenfluss, tatsächliche Rolle, Unterauftragnehmer, Speicher-/Zugriffsländer, Löschfristen und ggf. Drittlandgrundlage. Ein EWR-Speicherort allein belegt nicht die Abwesenheit von Drittlandzugriffen. Eine Rolle als eigener Verantwortlicher wird nicht durch eine unpassende AVV umetikettiert. Die lokalen Testadapter arbeiten mit synthetischen Daten; ein späterer Providerwechsel erfordert erneute Prüfung vor Aktivierung.

## Technische und organisatorische Maßnahmen — DSGVO Art. 32

Die Maßnahmen müssen zum Risiko passen und hinsichtlich Vertraulichkeit, Integrität, Verfügbarkeit, Wiederherstellbarkeit und Wirksamkeit überprüft werden. [DSGVO, Art. 32](https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX%3A32016R0679).

Die Projektumsetzung liegt in [Sicherheit/Querschnitt](arch/A08-cross-cutting-concepts.md), [Betrieb](arch/A07-deployment-view.md) und [Qualitätsszenarien](arch/A10-quality-requirements.md). Vor Produktion liefert Entwicklung/Betrieb Nachweise für:

- HTTPS, sichere Cookies und geprüfte HTTP-Header; keine Tokens in Referrer, Logs oder Drittinhalten.
- Serverberechtigungen einschließlich tatsächlicher Terminbeteiligung, Kontodeaktivierung, sofortiger Sessionwiderruf, sichere Passwortreset- und Verwaltungstokens.
- Verschlüsselte Backups, beschränkte Schlüssel-/Datenzugriffe und isoliert erfolgreich ausgeführten Restore samt Wiederanlauf und Retention.
- Minimierte Logs, Alarme für fehlgeschlagene Jobs, geregelte Alarmannahme und dokumentierte Zuständigkeit bei Datenschutzvorfällen.
- Patch-/Dependency-Verfahren mit verantwortlicher Person, Sicherheitsbewertung vor Releases und erneutem Review bei Architektur-/Provideränderung.

`GO-LIVE-BLOCKER: TOM_UND_BETRIEBSNACHWEISE` wird nur mit Test-/Betriebsbelegen geschlossen. Dokumentierte Architektur allein ist kein Nachweis einer bereits implementierten Schutzmaßnahme.

## Endgerätespeicher — TDDDG § 25

Die Ausnahme vom Einwilligungserfordernis gilt für Speicherung/Zugriff, die unbedingt für den ausdrücklich gewünschten digitalen Dienst erforderlich sind; „technisch nützlich“ allein genügt nicht. Sie ersetzt keine Prüfung der personenbezogenen Verarbeitung nach DSGVO. Grundlage: [TDDDG § 25](https://www.gesetze-im-internet.de/ttdsg/__25.html).

V1 nutzt ausschließlich notwendige interne Sessions und, soweit für den begonnenen Buchungsablauf nötig, kurzlebige Draft-/CSRF-/Sicherheitszustände. Keine Marketing-/Tracking-Cookies, keine Analytics, keine Werbe-IDs und keine nicht notwendigen Dritt-Embeds. Die Umsetzung startet ohne pauschalen Cookiebanner. Ein solcher Banner ist kein Ersatz für Datenminimierung.

Vor Go-live dokumentiert Entwicklung für jeden tatsächlich eingesetzten Cookie/Storage-Key: Name, Zweck, Notwendigkeit, Inhalt, Geltungsbereich und Ablauf/Löschung. Drafts enthalten im Browser möglichst nur eine zufällige Referenz, keine Freitext-/Gastdaten; ihre Lebensdauer folgt [D2](spec/D2-datentypen.md). Die Browserprüfung muss auch SDKs und Infrastruktur erfassen. Jeder künftig nicht notwendige Speicherzugriff bleibt bis zur Neubewertung und, soweit erforderlich, einem wirksamen Consent-Verfahren deaktiviert. Nachweis: Storage-/Netzwerk-Inventar, verantwortlich Entwicklung/Datenschutzverantwortung; `GO-LIVE-BLOCKER: SPEICHERINVENTAR_FREIGEBEN`.

## Barrierefreiheit — Go-live applicability review

WCAG 2.2 AA ist verbindliches Projektziel gemäß [NFR-A11Y-03](spec/N1-nichtfunktional.md#nfr-a11y-03), unabhängig vom Ergebnis der Rechtsprüfung. Eine WCAG-Prüfung allein ersetzt keine vollständige BFSG/BFSGV-Anwendbarkeits- und Erfüllungsprüfung.

Betreiber/Rechtsverantwortung dokumentiert vor Produktion:

- Fällt die konkret betriebene Terminbuchung unter den [BFSG-Anwendungsbereich](https://www.gesetze-im-internet.de/bfsg/__1.html), insbesondere die Dienstleistung im elektronischen Geschäftsverkehr im Hinblick auf einen Verbrauchervertrag gemäß [§ 2 Nr. 26 BFSG](https://www.gesetze-im-internet.de/bfsg/__2.html)? Fehlende Zahlung entscheidet dies nicht allein.
- Greift die Ausnahme für dienstleistungserbringende Kleinstunternehmen nach [§ 3 Abs. 3 BFSG](https://www.gesetze-im-internet.de/bfsg/__3.html)? Die Definition in § 2 Nr. 17 verlangt weniger als zehn Beschäftigte und Jahresumsatz oder Jahresbilanzsumme von höchstens zwei Millionen Euro. Die Betreiberwerte und ihre Bewertung sind nachzuweisen, nicht zu vermuten.
- Falls anwendbar: Anforderungen nach [BFSGV § 12](https://www.gesetze-im-internet.de/bfsgv/__12.html) und [BFSGV § 19](https://www.gesetze-im-internet.de/bfsgv/__19.html) für die tatsächlich angebotenen Funktionen prüfen; barrierefreie Informationen nach [BFSG § 14](https://www.gesetze-im-internet.de/bfsg/__14.html) und [Anlage 3](https://www.gesetze-im-internet.de/bfsg/anlage_3.html) veröffentlichen. Dazu gehören Beschreibung der Terminbuchung, Erfüllung einschlägiger Anforderungen und zuständige Marktüberwachungsbehörde.

`GO-LIVE-BLOCKER: BFSG_ANWENDBARKEIT_NACHWEIS` endet mit begründeter Entscheidung und ggf. veröffentlichten Informationen. Unabhängig davon benötigt die Freigabe einen WCAG-Abnahmebericht über Buchung, Verwaltung, Kalender und interne Kernabläufe. Keine Zahlungsfunktion wird aus einer gesetzlichen Aufzählung abgeleitet oder ergänzt.

## Streitbeilegung — VSBG §§ 36/37

Vor Go-live prüft Betreiber/Rechtsverantwortung die erforderlichen Angaben zur Bereitschaft oder Pflicht zur Teilnahme an Verbraucherschlichtung und ggf. zur zuständigen Stelle. Die Ausnahme bei höchstens zehn Beschäftigten am 31. Dezember des Vorjahres betrifft nur § 36 Abs. 1 Nr. 1; sie ist keine pauschale Befreiung von allen Informationspflichten. Maßstab: [VSBG § 36](https://www.gesetze-im-internet.de/vsbg/__36.html).

Separat wird ein Prozess für eine nicht beigelegte Streitigkeit aus einem Verbrauchervertrag festgelegt: Information in Textform über zuständige Stelle und Teilnahmebereitschaft/-pflicht gemäß [VSBG § 37](https://www.gesetze-im-internet.de/vsbg/__37.html). Die Ausnahme aus § 36 wird nicht ungeprüft auf § 37 übertragen.

`GO-LIVE-BLOCKER: VSBG_ANWENDBARKEIT_UND_TEXT` verlangt dokumentierte Beschäftigtenzahl/Stichtag, einschlägige Teilnahmebindung, freigegebenen Website-Text und ggf. Textvorlage/Verantwortlichkeit für Beschwerden. Ohne Betreiberentscheidung wird weder Teilnahme noch Nichtteilnahme behauptet.

## Einordnung der Terminbestätigung

Betreiber/Rechtsverantwortung klärt vor Go-live anhand der angebotenen Terminarten, Formulierungen und tatsächlichen Abläufe, ob die Bestätigung selbst einen Verbrauchervertrag schließt oder nur einen Termin organisiert. Ggf. zu prüfen sind insbesondere die Bedingungen für [Fernabsatzverträge nach § 312c BGB](https://www.gesetze-im-internet.de/bgb/__312c.html). Aus der Bezeichnung „Reservierung“ folgt keine abschließende juristische Einordnung.

`GO-LIVE-BLOCKER: VERBRAUCHERVERTRAG_EINORDNUNG` enthält Entscheidung, Begründung und ggf. zusätzlich erforderliche Informationen. Die V1 erhält dadurch nicht automatisch Checkout, Zahlungsabwicklung, AGB oder einen Widerrufsflow. Ergibt die konkrete Betreiberkonstellation zusätzliche Pflichten, müssen sie vor Produktionsfreigabe geprüft und als gezielte Dokumentations-/Releaseänderung behandelt werden. Die festgelegte Entwicklung des reinen Buchungssystems kann vorher beginnen.

## Freigabenachweis und Einordnung offener Punkte

Alle hier genannten Platzhalter sind Go-live-Blocker. Sie verhindern Entwicklungsarbeit mit synthetischen Daten nicht. Die offene Liste steht in [OPEN-QUESTIONS](OPEN-QUESTIONS.md); die Freigabe erfolgt nach [S3](spec/S3-inbetriebnahme.md). Für jede Prüfung benötigt das Betriebsprotokoll: benannte verantwortliche Person, Datum, Ergebnis (`erfüllt` oder begründet `nicht anwendbar`), Belegreferenz, freigegebene Textversion und Anlass für erneute Prüfung. Leere Felder und unbestätigte Annahmen bedeuten `offen`.

Die Quellen wurden für diese Dokumentationsrevision am 29.09.2026 recherchiert. Wo Einzelansichten nicht abrufbar waren, wurden die offiziellen Gesamttexte von [DDG](https://www.gesetze-im-internet.de/ddg/BJNR0950B0024.html), [TDDDG](https://www.gesetze-im-internet.de/ttdsg/BJNR198210021.html), [BFSG](https://www.gesetze-im-internet.de/bfsg/BJNR297010021.html) und [BFSGV](https://www.gesetze-im-internet.de/bfsgv/BFSGV.pdf) verwendet. EUR-Lex lieferte beim direkten Abruf eine Bot-Prüfung; die DSGVO-Aussagen wurden mit den indexierten offiziellen Artikeltexten und der behördlichen [DSGVO/BDSG-Textsammlung der BfDI](https://www.bfdi.bund.de/SharedDocs/Downloads/DE/Broschueren/INFO1.pdf?__blob=publicationFile&v=61) abgeglichen. Vor Produktionsfreigabe ist der dann geltende Rechtsstand erneut zu prüfen.

## Technischer Nachweis Sprint 7 - 30.09.2026

[Notification-Sprint](NOTIFICATION-SPRINT.md) konkretisiert getrennte Empfaengerprojektionen, Gast-Erstkontaktinformation, verschluesselte kurzlebige Faehigkeiten und SMTP ohne Tracking. Die Pruefung dieses Bereichs verwendet den [offiziellen DSGVO-Text](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32016R0679) und die [Informationspflichten der EU-Kommission](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/obligations_en). Betreibertexte, Rechtsgrundlagen und Providerfreigaben bleiben offen; eine Rechtskonformitaet des spaeteren Betriebs wird nicht behauptet.

## Technische Retention-Konfiguration Sprint 10

[Audit-/Retention-Sprint](AUDIT-RETENTION-SECURITY-SPRINT.md) implementiert konfigurierbare Termine-/Nebenbestandsbereinigung und Schutz vor verspäteter Bereinigung. Die zusätzlichen Audit-Entwicklungswerte (12 Kalendermonate Erfolg, 30 Tage Ablehnung) sind ebenfalls keine gesetzlichen Vorgaben. Betreiberfreigabe muss jetzt ausdrücklich auch diese Kategorien, Akteurreferenzen, Proxy-/IP-Verarbeitung und Providerkopien umfassen. Quellenabgleich Art. 5/25 am 01.10.2026 anhand [EUR-Lex](https://eur-lex.europa.eu/legal-content/DE-EN/TXT/?from=de&uri=CELEX%3A32016R0679); keine neuen realen Betreiber-/Rechtsgrundlagenangaben werden behauptet.
